import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { loginPath, useAuth } from "../../auth/authContext";
import { AnimatePresence, motion } from "framer-motion";
import { deleteListHandler, filmCount, handlepublication } from "../../movie/databaseFetcher";
import { invalidateUserLists, loadUserLists } from "../../movie/listsStore";
import { customToast } from "../../static/toast";
import { ConfirmDialog } from "../../static/dialog";
import ListTile, { TileSkeleton } from "./listTile";
import ListSheet from "./listSheet";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5";

// `sheet` comes from the /addList and /updList/:listId routes so those links still work.
export default function MyLists({ sheet: initialSheet }) {
    const navigate = useNavigate();
    const { listId } = useParams();
    const location = useLocation();
    const { ready, user } = useAuth();
    const loggedIn = !!user;
    const [lists, setLists] = useState(null);
    const [query, setQuery] = useState("");
    const [sheet, setSheet] = useState(null); // null | { mode: "new" } | { mode: "edit", list }
    const [deleting, setDeleting] = useState(null);
    // Keep the last shown values so titles don’t change while dialogs animate closed.
    const shownSheet = useRef(null);
    const shownDelete = useRef(null);
    if (sheet) shownSheet.current = sheet;
    if (deleting) shownDelete.current = deleting;

    useEffect(() => {
        if (!user) return;
        let alive = true;
        loadUserLists().then((l) => alive && setLists(l));
        return () => {
            alive = false;
        };
    }, [user]);

    // Deep links open the sheet once the lists are in.
    useEffect(() => {
        if (initialSheet === "new") setSheet({ mode: "new" });
        if (initialSheet === "edit" && lists) {
            const list = lists.find((l) => l.id === listId);
            if (list) setSheet({ mode: "edit", list });
        }
    }, [initialSheet, listId, lists]);

    const closeSheet = () => {
        setSheet(null);
        if (initialSheet) navigate("/mylists", { replace: true });
    };

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const all = [...(lists || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (!q) return all;
        return all.filter(
            (l) => l.listName?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
        );
    }, [lists, query]);

    const onSaved = (saved) => {
        setLists((prev) => {
            const exists = prev?.some((l) => l.id === saved.id);
            return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...(prev || [])];
        });
        closeSheet();
    };

    const togglePublic = async (list) => {
        const next = !list.isPublic;
        setLists((prev) => prev.map((l) => (l.id === list.id ? { ...l, isPublic: next } : l)));
        try {
            await handlepublication(list.id);
            invalidateUserLists();
            customToast(next ? "List is now public" : "List is now private", "success");
        } catch (error) {
            console.error("Error updating publication status:", error);
            setLists((prev) => prev.map((l) => (l.id === list.id ? { ...l, isPublic: !next } : l)));
            customToast("Couldn’t change who can see the list. Try again.", "error");
        }
    };

    const confirmDelete = async () => {
        const list = deleting;
        setDeleting(null);
        setLists((prev) => prev.filter((l) => l.id !== list.id));
        try {
            await deleteListHandler(list.id);
            invalidateUserLists();
            customToast(`Deleted ${list.listName}`, "success");
        } catch (error) {
            console.error("Error deleting list:", error);
            setLists((prev) => [list, ...prev]);
            customToast("Couldn’t delete the list. Try again.", "error");
        }
    };

    if (ready && !loggedIn) {
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

    const toDelete = shownDelete.current;
    const count = toDelete ? filmCount(toDelete) : 0;
    return (
        <div className="page">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="page-title">My lists</h1>
                <button type="button" className="btn btn-primary" onClick={() => setSheet({ mode: "new" })}>
                    <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                    New list
                </button>
            </div>

            {lists?.length > 0 && (
                <div className="relative mt-8 max-w-md">
                    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-grain" aria-hidden="true"></i>
                    <label htmlFor="list-search" className="sr-only">
                        Search your lists
                    </label>
                    <input
                        id="list-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your lists"
                        className="field pl-9"
                    />
                </div>
            )}

            <div className="mt-8">
                {lists === null ? (
                    <div className={GRID}>
                        {[0, 1, 2].map((i) => (
                            <TileSkeleton key={i} />
                        ))}
                    </div>
                ) : lists.length === 0 ? (
                    <div className="max-w-[60ch] space-y-5 py-8">
                        <p className="text-lg">
                            You haven’t made a list yet. Lists keep films you want to remember, and you can share them.
                        </p>
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
                                        onEdit={() => setSheet({ mode: "edit", list })}
                                        onTogglePublic={() => togglePublic(list)}
                                        onDelete={() => setDeleting(list)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <ListSheet
                open={!!sheet}
                list={shownSheet.current?.mode === "edit" ? shownSheet.current.list : null}
                onClose={closeSheet}
                onSaved={onSaved}
            />
            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                title={toDelete ? `Delete “${toDelete.listName}”?` : "Delete list?"}
                body={`This removes the list${count ? ` and its ${count} ${count === 1 ? "film" : "films"}` : ""}. This can’t be undone.`}
                confirmLabel="Delete list"
            />
        </div>
    );
}
