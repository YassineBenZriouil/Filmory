import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { loginPath, useAuth } from "../../auth/authContext";
import {
    deleteListHandler,
    fetchProfile,
    fetchSharedWithMe,
    purgeDeleted,
    restoreList,
    setPublic,
    softDeleteList,
} from "../../movie/databaseFetcher";
import { DELETE_AFTER_DAYS, blockedWord, ownerUid } from "../../movie/listModel";
import { invalidateUserLists, loadUserLists } from "../../movie/listsStore";
import { customToast } from "../../static/toast";
import { ConfirmDialog } from "../../static/dialog";
import ListTile, { TileSkeleton } from "./listTile";
import ListSheet from "./listSheet";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5";

const daysLeft = (deletedAt) =>
    Math.max(0, DELETE_AFTER_DAYS - Math.floor((Date.now() - deletedAt) / (24 * 60 * 60 * 1000)));

const Undo = ({ onClick }) => (
    <button type="button" className="font-bold underline underline-offset-4" onClick={onClick}>
        Undo
    </button>
);

// `sheet` comes from the /addList and /updList/:listId routes so those links still work.
export default function MyLists({ sheet: initialSheet }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { listId } = useParams();
    const { ready, user } = useAuth();
    const [all, setAll] = useState(null);
    const [shared, setShared] = useState(null);
    const [owners, setOwners] = useState({});
    const [query, setQuery] = useState("");
    const [sheet, setSheet] = useState(null);
    const [forever, setForever] = useState(null);
    const shownSheet = useRef(null);
    const shownForever = useRef(null);
    if (sheet) shownSheet.current = sheet;
    if (forever) shownForever.current = forever;

    useEffect(() => {
        if (!user) return;
        let alive = true;
        loadUserLists().then(async (lists) => {
            // Lists deleted more than 30 days ago are removed for good.
            const purged = await purgeDeleted(lists, DELETE_AFTER_DAYS).catch(() => []);
            if (purged.length) invalidateUserLists();
            if (alive) setAll(lists.filter((l) => !purged.includes(l.id)));
        });
        fetchSharedWithMe()
            .then(async (lists) => {
                const visible = lists.filter((l) => !l.deletedAt);
                if (!alive) return;
                setShared(visible);
                const ids = [...new Set(visible.map(ownerUid).filter(Boolean))];
                const found = await Promise.all(ids.map((u) => fetchProfile(u)));
                if (alive) setOwners(Object.fromEntries(ids.map((u, i) => [u, found[i] || { userName: "" }])));
            })
            .catch(() => alive && setShared([]));
        return () => {
            alive = false;
        };
    }, [user]);

    const lists = useMemo(() => (all || []).filter((l) => !l.deletedAt), [all]);
    const deleted = useMemo(() => (all || []).filter((l) => l.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt), [all]);

    useEffect(() => {
        if (initialSheet === "new") setSheet({ mode: "new" });
        if (initialSheet === "edit" && all) {
            const list = all.find((l) => l.id === listId);
            if (list) setSheet({ mode: "edit", list });
        }
    }, [initialSheet, listId, all]);

    const closeSheet = () => {
        setSheet(null);
        if (initialSheet) navigate("/mylists", { replace: true });
    };

    const replace = (id, values) => setAll((prev) => prev.map((l) => (l.id === id ? { ...l, ...values } : l)));

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const sorted = [...lists].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (!q) return sorted;
        return sorted.filter((l) => l.listName?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q));
    }, [lists, query]);

    const onSaved = (saved) => {
        setAll((prev) =>
            prev?.some((l) => l.id === saved.id) ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...(prev || [])]
        );
        closeSheet();
    };

    const togglePublic = async (list) => {
        const next = !list.isPublic;
        const bad = next && blockedWord(list.listName, list.description || "");
        if (bad) {
            customToast(`Change “${bad}” in the name or description before making this list public.`, "error", { autoClose: 6000 });
            setSheet({ mode: "edit", list });
            return;
        }
        replace(list.id, { isPublic: next });
        try {
            await setPublic(list.id, next);
            invalidateUserLists();
            const undo = async () => {
                await setPublic(list.id, true).catch(() => {});
                replace(list.id, { isPublic: true });
            };
            customToast(
                next ? (
                    "List is now public"
                ) : (
                    <span>
                        List is now private. <Undo onClick={undo} />
                    </span>
                ),
                "success"
            );
        } catch {
            replace(list.id, { isPublic: !next });
            customToast("Couldn’t change who can see the list. Try again.", "error");
        }
    };

    // No confirm needed: it can be undone now, or restored for 30 days.
    const softDelete = async (list) => {
        replace(list.id, { deletedAt: Date.now(), wasPublic: !!list.isPublic, isPublic: false });
        try {
            await softDeleteList(list);
            invalidateUserLists();
            const undo = async () => {
                await restoreList({ ...list, wasPublic: !!list.isPublic }).catch(() => {});
                replace(list.id, { deletedAt: undefined, isPublic: !!list.isPublic });
                invalidateUserLists();
            };
            customToast(
                <span>
                    Deleted {list.listName}. <Undo onClick={undo} />
                </span>,
                "success",
                { autoClose: 10000 }
            );
        } catch {
            replace(list.id, { deletedAt: undefined, isPublic: !!list.isPublic });
            customToast("Couldn’t delete the list. Try again.", "error");
        }
    };

    const restore = async (list) => {
        replace(list.id, { deletedAt: undefined, isPublic: !!list.wasPublic });
        try {
            await restoreList(list);
            invalidateUserLists();
            customToast(`Restored ${list.listName}`, "success");
        } catch {
            replace(list.id, { deletedAt: list.deletedAt, isPublic: false });
            customToast("Couldn’t restore the list. Try again.", "error");
        }
    };

    const deleteForever = async () => {
        const list = forever;
        setForever(null);
        setAll((prev) => prev.filter((l) => l.id !== list.id));
        try {
            await deleteListHandler(list.id);
            invalidateUserLists();
            customToast(`${list.listName} is gone for good`, "success");
        } catch {
            setAll((prev) => [list, ...prev]);
            customToast("Couldn’t delete the list. Try again.", "error");
        }
    };

    if (ready && !user) {
        return (
            <div className="page flex min-h-[60vh] flex-col items-start justify-center gap-6">
                <h1 className="page-title">My lists</h1>
                <p className="max-w-[60ch] text-lg text-grain">
                    Log in to see your lists. Lists keep films you want to remember, and you can share them.
                </p>
                <Link to={loginPath(location)} className="btn btn-primary">
                    Log in
                </Link>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="page-title">My lists</h1>
                <button type="button" className="btn btn-primary" onClick={() => setSheet({ mode: "new" })}>
                    <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                    New list
                </button>
            </div>

            {lists.length > 0 && (
                <div className="relative mt-8 max-w-md">
                    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-grain" aria-hidden="true"></i>
                    <label htmlFor="list-search" className="sr-only">
                        Search your lists
                    </label>
                    <input id="list-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your lists" className="field pl-9" />
                </div>
            )}

            <div className="mt-8">
                {all === null ? (
                    <div className={GRID}>
                        {[0, 1, 2].map((i) => (
                            <TileSkeleton key={i} />
                        ))}
                    </div>
                ) : lists.length === 0 ? (
                    <div className="max-w-[60ch] space-y-5 py-8">
                        <p className="text-lg">You haven’t made a list yet. Lists keep films you want to remember, and you can share them.</p>
                        <button type="button" className="btn btn-primary" onClick={() => setSheet({ mode: "new" })}>
                            Create your first list
                        </button>
                    </div>
                ) : visible.length === 0 ? (
                    <p className="text-grain">No lists match “{query.trim()}”.</p>
                ) : (
                    <motion.div layout className={GRID}>
                        <AnimatePresence initial={false}>
                            {visible.map((list) => (
                                <motion.div
                                    key={list.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                                >
                                    <ListTile
                                        list={list}
                                        to={`/listInside/${list.id}`}
                                        showProgress
                                        onEdit={() => setSheet({ mode: "edit", list })}
                                        onTogglePublic={() => togglePublic(list)}
                                        onDelete={() => softDelete(list)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {shared?.length > 0 && (
                <section aria-labelledby="shared-title" className="mt-16">
                    <h2 id="shared-title" className="text-[25px] font-semibold md:text-[31px]">
                        Shared with you
                    </h2>
                    <div className={`mt-5 ${GRID}`}>
                        {shared.map((list) => (
                            <ListTile
                                key={list.id}
                                list={list}
                                to={`/listInside/${list.id}`}
                                author={owners[ownerUid(list)] ?? null}
                                showProgress
                            />
                        ))}
                    </div>
                </section>
            )}

            {deleted.length > 0 && (
                <section aria-labelledby="deleted-title" className="mt-16">
                    <h2 id="deleted-title" className="text-[25px] font-semibold md:text-[31px]">
                        Recently deleted
                    </h2>
                    <p className="mt-1 text-grain">Deleted lists are removed for good after {DELETE_AFTER_DAYS} days.</p>
                    <ul className="mt-4 max-w-2xl divide-y divide-reel border-y border-reel">
                        {deleted.map((list) => {
                            const left = daysLeft(list.deletedAt);
                            return (
                                <li key={list.id} className="flex flex-wrap items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold">{list.listName}</p>
                                        <p className="text-[13px] text-grain">
                                            {left} {left === 1 ? "day" : "days"} left
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-secondary min-h-[40px]" onClick={() => restore(list)}>
                                        Restore
                                    </button>
                                    <button type="button" className="btn btn-text min-h-[40px] hover:text-velvet" onClick={() => setForever(list)}>
                                        Delete forever
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            <ListSheet
                open={!!sheet}
                list={shownSheet.current?.mode === "edit" ? shownSheet.current.list : null}
                onClose={closeSheet}
                onSaved={onSaved}
            />
            <ConfirmDialog
                open={!!forever}
                onClose={() => setForever(null)}
                onConfirm={deleteForever}
                title={shownForever.current ? `Delete “${shownForever.current.listName}” forever?` : "Delete forever?"}
                body="This can’t be undone."
                confirmLabel="Delete forever"
            />
        </div>
    );
}
