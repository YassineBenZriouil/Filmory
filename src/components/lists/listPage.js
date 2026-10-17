import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SmallCard from "../smallCard";
import CardGrid from "../cardGrid";
import { SkeletonGrid } from "../../static/loading";
import { customToast } from "../../static/toast";
import Avatar from "../../static/avatar";
import Popover, { MenuItem } from "../../static/popover";
import { LoadError } from "../../static/resilience";
import { fetchTitleBasic } from "../../movie/allFetcher";
import {
    addManyToList,
    copyList,
    currentUid,
    fetchListById,
    fetchProfile,
    removeManyFromList,
    restoreList,
    setInterest,
    setItemMeta,
    setListCover,
    setListOrder,
    setLiked,
    setPublic,
    softDeleteList,
} from "../../movie/databaseFetcher";
import { blockedWord, keyOf, metaOf, orderedKeys, ownerUid, parseKey } from "../../movie/listModel";
import { invalidateUserLists, loadUserLists } from "../../movie/listsStore";
import { setWatchedFilms, useWatched } from "../../movie/watchedStore";
import { loginPath, useAuth } from "../../auth/authContext";
import { LIST_CHANGED, openAddFilms } from "../search";
import ListMenu from "./listMenu";
import ListSheet from "./listSheet";
import FilmNote, { StarRating } from "./filmNote";
import Arrange from "./arrange";
import ImportDialog from "./importDialog";
import { PeopleDialog, ReportDialog, ShareMenu } from "./sharing";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

const SORTS = {
    order: "Your order",
    added: "Recently added",
    year: "Release year",
    rating: "TMDB rating",
    mine: "Your rating",
    runtime: "Shortest first",
};

const yearOf = (f) => Number((f.release_date || f.first_air_date || "0").slice(0, 4));
const runtimeOf = (f) => f.runtime || f.episode_run_time?.[0] || 9999;

const UndoButton = ({ onClick, children = "Undo" }) => (
    <button type="button" className="font-bold underline underline-offset-4" onClick={onClick}>
        {children}
    </button>
);

// One film on the list, with its notes, rating, who added it and interest.
function ListFilm({ film, list, canEdit, shared, selecting, selected, onSelect, onRemove, onSaveNote, onCover, onInterest, people, uid, everyoneIn }) {
    const noteRef = useRef(null);
    const [noteOpen, setNoteOpen] = useState(false);
    const meta = metaOf(list, film.key);
    const title = film.title || film.name;
    const interested = meta.interested || [];
    const mine = uid && interested.includes(uid);
    const adder = meta.addedBy && people[meta.addedBy];

    return (
        <div className={`relative ${everyoneIn ? "rounded-[6px] p-1.5 shadow-[0_0_0_2px_rgb(var(--beam))]" : ""}`}>
            {everyoneIn && (
                <span className="absolute -top-3 left-3 z-10 rounded-full bg-beam px-2 py-0.5 text-[13px] font-bold text-ink">Everyone’s in</span>
            )}
            <SmallCard
                data={film}
                type={film.type}
                quickAdd={!canEdit && !selecting}
                watchedToggle={!selecting}
                overlay={
                    selecting ? (
                        <button
                            type="button"
                            onClick={onSelect}
                            aria-pressed={selected}
                            aria-label={`Select ${title}`}
                            className={`absolute inset-0 z-10 rounded-[3px] transition-shadow duration-quick ${selected ? "shadow-[inset_0_0_0_3px_rgb(var(--beam))]" : ""}`}
                        >
                            <span
                                className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-[4px] border-2 ${
                                    selected ? "border-beam bg-beam text-ink" : "border-[rgb(233_237_240)] bg-booth/60"
                                }`}
                            >
                                {selected && <i className="fa-solid fa-check text-xs" aria-hidden="true"></i>}
                            </span>
                        </button>
                    ) : (
                        canEdit && (
                            <button
                                type="button"
                                onClick={onRemove}
                                aria-label={`Remove ${title} from ${list.listName}`}
                                className="film-add absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-booth/85 text-screen transition-[opacity,transform,background-color] duration-quick hover:bg-velvet [@media(hover:none)]:!grid [@media(hover:none)]:opacity-100"
                            >
                                <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                            </button>
                        )
                    )
                }
            />

            {(meta.rating || meta.note || canEdit || shared) && !selecting && (
                <div className="mt-1.5 space-y-1.5">
                    {meta.rating && <StarRating value={meta.rating} size="text-sm" />}
                    {meta.note && <p className="line-clamp-3 text-[13px] italic leading-snug text-grain">“{meta.note}”</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {canEdit && (
                            <button
                                ref={noteRef}
                                type="button"
                                onClick={() => setNoteOpen(true)}
                                className="text-[13px] text-grain underline-offset-4 hover:text-screen hover:underline"
                                aria-label={`Rate or add a note to ${title}`}
                            >
                                {meta.rating || meta.note ? "Edit note" : "Rate or note"}
                            </button>
                        )}
                        {shared && (
                            <button
                                type="button"
                                onClick={onInterest}
                                aria-pressed={!!mine}
                                className={`inline-flex items-center gap-1.5 text-[13px] ${mine ? "text-beam" : "text-grain hover:text-screen"}`}
                            >
                                <i className={`fa-${mine ? "solid" : "regular"} fa-hand text-xs`} aria-hidden="true"></i>
                                {mine ? "You’re in" : "I’m in"}
                                {interested.length > 0 && <span className="tabular-nums">({interested.length})</span>}
                            </button>
                        )}
                        {shared && adder && (
                            <span className="ml-auto flex items-center gap-1 text-[13px] text-grain" title={`Added by ${adder.userName || "someone"}`}>
                                <Avatar name={adder.userName} size="h-5 w-5 text-[10px]" />
                                <span className="sr-only">Added by {adder.userName || "someone"}</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {canEdit && (
                <FilmNote
                    anchorRef={noteRef}
                    open={noteOpen}
                    onClose={() => setNoteOpen(false)}
                    title={title}
                    meta={meta}
                    onSave={onSaveNote}
                    onCover={onCover}
                    isCover={list.cover === film.key}
                />
            )}
        </div>
    );
}

// Pick one of your other lists (for moving or copying films).
function TargetPicker({ anchorRef, open, onClose, excludeId, onPick, label }) {
    const [lists, setLists] = useState(null);
    useEffect(() => {
        if (!open) return;
        loadUserLists().then((l) => setLists(l.filter((x) => x.id !== excludeId && !x.deletedAt)));
    }, [open, excludeId]);
    return (
        <Popover anchorRef={anchorRef} open={open} onClose={onClose} label={label} role="menu" width={260}>
            <p className="px-3 pb-1 pt-2 text-[13px] text-grain">{label}</p>
            {lists === null && <div className="skeleton m-3 h-4 w-32 rounded" />}
            {lists?.length === 0 && <p className="px-3 py-2 text-grain">You don’t have another list yet.</p>}
            <div className="max-h-[260px] overflow-y-auto">
                {lists?.map((l) => (
                    <MenuItem
                        key={l.id}
                        onClick={() => {
                            onClose();
                            onPick(l);
                        }}
                    >
                        <span className="truncate">{l.listName}</span>
                    </MenuItem>
                ))}
            </div>
        </Popover>
    );
}

export default function ListPage({ publicRoute = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const uid = user?.uid;
    const watched = useWatched();
    const [list, setList] = useState(undefined); // undefined loading, null missing
    const [films, setFilms] = useState(null);
    const [failed, setFailed] = useState(false);
    const [people, setPeople] = useState({});
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("order");
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const [arranging, setArranging] = useState(false);
    const [editing, setEditing] = useState(false);
    const [peopleOpen, setPeopleOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [target, setTarget] = useState(null); // "move" | "copy"
    const moveRef = useRef(null);
    const copyRef = useRef(null);

    const loadFilms = useCallback(async (data) => {
        const keys = orderedKeys(data);
        const found = await Promise.all(
            keys.map((key) => {
                const { type, id: filmId } = parseKey(key);
                return fetchTitleBasic(type, filmId).then((f) => f && { ...f, key, type });
            })
        );
        setFilms(found.filter(Boolean));
    }, []);

    const load = useCallback(async () => {
        try {
            setFailed(false);
            const [data, me] = await Promise.all([fetchListById(id), currentUid()]);
            if (!data || data.deletedAt) return setList(null);
            const full = { id, ...data };
            const isOwner = !!me && data.user === `/Users/${me}`;
            const isMember = !!me && (data.members || []).includes(me);
            if (!isOwner && !isMember && !data.isPublic) return setList(null);
            setList(full);
            loadFilms(full);
            const ids = [...new Set([ownerUid(full), ...(full.members || [])].filter(Boolean))];
            Promise.all(ids.map((u) => fetchProfile(u))).then((found) =>
                setPeople(Object.fromEntries(ids.map((u, i) => [u, found[i] || { userName: "" }])))
            );
        } catch (error) {
            // A private list you can't see reads as missing; anything else offers a retry.
            if (error?.code === "permission-denied") setList(null);
            else {
                console.error("Error fetching the list:", error);
                setFailed(true);
            }
        }
        // Re-check roles when someone signs in or out on this page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, loadFilms, uid]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const onChange = (e) => e.detail?.id === id && load();
        window.addEventListener(LIST_CHANGED, onChange);
        return () => window.removeEventListener(LIST_CHANGED, onChange);
    }, [id, load]);

    useEffect(() => {
        if (list?.listName) document.title = `${list.listName} – ${brand}`;
    }, [list?.listName]);

    const ownerId = ownerUid(list);
    const owner = !!uid && ownerId === uid;
    const member = !!uid && (list?.members || []).includes(uid);
    const canEdit = owner || member;
    const shared = !!list && ((list.members || []).length > 0 || !!list.inviteToken);
    const participants = useMemo(() => [ownerId, ...(list?.members || [])].filter(Boolean), [ownerId, list?.members]);
    const likedBy = list?.likedBy || [];
    const liked = !!uid && likedBy.includes(uid);

    const patch = (fn) => setList((l) => (l ? fn(l) : l));
    const patchMeta = (key, values) =>
        patch((l) => ({ ...l, meta: { ...(l.meta || {}), [key]: { ...metaOf(l, key), ...values } } }));

    const everyoneIn = useCallback(
        (film) =>
            shared && participants.length > 1 && participants.every((p) => (metaOf(list, film.key).interested || []).includes(p)),
        [shared, participants, list]
    );

    const shown = useMemo(() => {
        if (!films) return null;
        let out = films.filter((f) => {
            if (filter === "watched") return watched[f.key];
            if (filter === "towatch") return !watched[f.key];
            if (filter === "everyone") return everyoneIn(f);
            return true;
        });
        const by = {
            added: (a, b) => (metaOf(list, b.key).addedAt || 0) - (metaOf(list, a.key).addedAt || 0),
            year: (a, b) => yearOf(b) - yearOf(a),
            rating: (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
            mine: (a, b) => (metaOf(list, b.key).rating || 0) - (metaOf(list, a.key).rating || 0),
            runtime: (a, b) => runtimeOf(a) - runtimeOf(b),
        }[sort];
        if (by) out = [...out].sort(by);
        return out;
    }, [films, filter, sort, watched, list, everyoneIn]);

    // ---- Removing, with Undo (one film or many) ----
    const removeFilms = async (toRemove) => {
        const before = list;
        const keys = new Set(toRemove.map((f) => f.key));
        const items = toRemove.map((f) => ({ type: f.type, id: f.id }));
        setFilms((prev) => prev.filter((f) => !keys.has(f.key)));
        setSelected(new Set());
        try {
            await removeManyFromList(id, items);
            invalidateUserLists();
            const label = toRemove.length === 1 ? toRemove[0].title || toRemove[0].name : `${toRemove.length} films`;
            const undo = async () => {
                try {
                    await addManyToList(id, items);
                    // Put back notes, ratings and the original order.
                    await Promise.all(
                        toRemove.map((f) => {
                            const m = metaOf(before, f.key);
                            return Object.keys(m).length ? setItemMeta(id, f.key, m) : null;
                        })
                    );
                    await setListOrder(id, orderedKeys(before));
                    invalidateUserLists();
                    load();
                } catch {
                    customToast("Couldn’t put those back. Add them again from search.", "error");
                }
            };
            customToast(
                <span>
                    Removed {label} from {before.listName}. <UndoButton onClick={undo} />
                </span>,
                "success",
                { autoClose: 6000 }
            );
        } catch (error) {
            console.error("Error removing films:", error);
            load();
            customToast("Couldn’t remove that. Try again.", "error");
        }
    };

    // ---- Bulk ----
    const selectedFilms = (films || []).filter((f) => selected.has(f.key));
    const toggleSelect = (key) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const bulkWatched = async () => {
        const keys = selectedFilms.map((f) => f.key);
        const notYet = keys.filter((k) => !watched[k]);
        try {
            await setWatchedFilms(keys, true);
            setSelected(new Set());
            customToast(
                <span>
                    Marked {keys.length} as watched.{" "}
                    {notYet.length > 0 && <UndoButton onClick={() => setWatchedFilms(notYet, false).catch(() => {})} />}
                </span>,
                "success",
                { autoClose: 6000 }
            );
        } catch {
            customToast("Couldn’t update those films. Try again.", "error");
        }
    };

    const bulkTo = async (dest, mode) => {
        const items = selectedFilms.map((f) => ({ type: f.type, id: f.id }));
        const movedKeys = new Set(selectedFilms.map((f) => f.key));
        try {
            const destBefore = await fetchListById(dest.id);
            const already = new Set(orderedKeys(destBefore || {}));
            const newlyAdded = items.filter((x) => !already.has(keyOf(x.type, x.id)));
            await addManyToList(dest.id, items);
            if (mode === "move") await removeManyFromList(id, items);
            invalidateUserLists();
            setSelected(new Set());
            if (mode === "move") setFilms((prev) => prev.filter((f) => !movedKeys.has(f.key)));
            const undo = async () => {
                try {
                    if (newlyAdded.length) await removeManyFromList(dest.id, newlyAdded);
                    if (mode === "move") await addManyToList(id, items);
                    invalidateUserLists();
                    load();
                } catch {
                    customToast("Couldn’t undo that. Check both lists.", "error");
                }
            };
            customToast(
                <span>
                    {mode === "move" ? "Moved" : "Copied"} {items.length} {items.length === 1 ? "film" : "films"} to {dest.listName}.{" "}
                    <UndoButton onClick={undo} />
                </span>,
                "success",
                { autoClose: 6000 }
            );
        } catch (error) {
            console.error(error);
            customToast(`Couldn’t ${mode} those films. Try again.`, "error");
        }
    };

    // ---- Owner actions ----
    const togglePublic = async () => {
        const next = !list.isPublic;
        const bad = next && blockedWord(list.listName, list.description || "");
        if (bad) {
            customToast(`Change “${bad}” in the name or description before making this list public.`, "error", { autoClose: 6000 });
            setEditing(true);
            return;
        }
        patch((l) => ({ ...l, isPublic: next }));
        try {
            await setPublic(id, next);
            invalidateUserLists();
            const undo = async () => {
                await setPublic(id, true).catch(() => {});
                patch((l) => ({ ...l, isPublic: true }));
            };
            customToast(
                next ? (
                    "List is now public"
                ) : (
                    <span>
                        List is now private. <UndoButton onClick={undo} />
                    </span>
                ),
                "success"
            );
        } catch {
            patch((l) => ({ ...l, isPublic: !next }));
            customToast("Couldn’t change who can see the list. Try again.", "error");
        }
    };

    // Soft delete: no confirm needed, because it can be undone here or restored for 30 days.
    const deleteList = async () => {
        const snapshot = list;
        try {
            await softDeleteList(snapshot);
            invalidateUserLists();
            navigate("/mylists");
            const undo = async () => {
                await restoreList(snapshot).catch(() => {});
                invalidateUserLists();
                navigate(`/listInside/${snapshot.id}`);
            };
            customToast(
                <span>
                    Deleted {snapshot.listName}. It’s in Recently deleted for 30 days. <UndoButton onClick={undo} />
                </span>,
                "success",
                { autoClose: 10000 }
            );
        } catch {
            customToast("Couldn’t delete the list. Try again.", "error");
        }
    };

    const saveNote = async (key, values) => {
        patchMeta(key, values);
        try {
            await setItemMeta(id, key, values);
        } catch {
            customToast("Couldn’t save your note. Try again.", "error");
            load();
        }
    };

    const chooseCover = async (key) => {
        patch((l) => ({ ...l, cover: key }));
        try {
            await setListCover(id, key);
            invalidateUserLists();
            customToast("Cover updated", "success");
        } catch {
            customToast("Couldn’t change the cover. Try again.", "error");
        }
    };

    const toggleInterest = async (key) => {
        const current = metaOf(list, key).interested || [];
        const on = !current.includes(uid);
        patchMeta(key, { interested: on ? [...current, uid] : current.filter((u) => u !== uid) });
        try {
            await setInterest(id, key, on);
        } catch {
            patchMeta(key, { interested: current });
            customToast("Couldn’t save that. Try again.", "error");
        }
    };

    const saveOrder = async (keys) => {
        setArranging(false);
        patch((l) => ({ ...l, order: keys }));
        setFilms((prev) => keys.map((k) => prev.find((f) => f.key === k)).filter(Boolean));
        try {
            await setListOrder(id, keys);
            invalidateUserLists();
            customToast("Order saved", "success");
        } catch {
            customToast("Couldn’t save the order. Try again.", "error");
            load();
        }
    };

    // ---- Visitor actions ----
    const toggleLike = async () => {
        if (!uid) return navigate(loginPath(location));
        const next = !liked;
        patch((l) => ({ ...l, likedBy: next ? [...likedBy, uid] : likedBy.filter((u) => u !== uid) }));
        try {
            await setLiked(id, next);
        } catch {
            patch((l) => ({ ...l, likedBy }));
            customToast("Couldn’t save your like. Try again.", "error");
        }
    };

    const copyToMine = async () => {
        if (!uid) return navigate(loginPath(location));
        try {
            const copy = await copyList(list, uid);
            invalidateUserLists();
            customToast(
                <span>
                    Copied to your lists. <UndoButton onClick={() => navigate(`/listInside/${copy.id}`)}>Open it</UndoButton>
                </span>,
                "success"
            );
        } catch {
            customToast("Couldn’t copy the list. Try again.", "error");
        }
    };

    const importFilms = async (items, markWatched) => {
        try {
            await addManyToList(id, items);
            if (markWatched) await setWatchedFilms(items.map((x) => keyOf(x.type, x.id)), true);
            invalidateUserLists();
            customToast(`Added ${items.length} ${items.length === 1 ? "film" : "films"} to ${list.listName}`, "success");
            load();
        } catch (error) {
            console.error(error);
            customToast("Couldn’t add those films. Try again.", "error");
            throw error;
        }
    };

    // ---- Render ----
    if (failed) {
        return (
            <div className="page">
                <LoadError message="This list didn’t load. Check your connection, then try again." onRetry={load} />
            </div>
        );
    }

    if (list === null) {
        return (
            <div className="page flex min-h-[60vh] flex-col items-start justify-center gap-6">
                <h1 className="page-title">This list doesn’t exist or isn’t public</h1>
                <p className="text-grain">It may have been deleted, or its owner made it private.</p>
                <Link to="/public" className="btn btn-primary">
                    Browse public lists
                </Link>
            </div>
        );
    }

    if (list === undefined) {
        return (
            <div className="page" aria-busy="true">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton mt-6 h-14 w-2/3 max-w-xl rounded" />
                <div className="skeleton mt-4 h-4 w-48 rounded" />
                <div className="mt-12">
                    <SkeletonGrid count={10} />
                </div>
            </div>
        );
    }

    const back = canEdit && !publicRoute ? ["/mylists", "My lists"] : ["/public", "Public lists"];
    const total = films?.length ?? orderedKeys(list).length;
    const watchedCount = (films || []).filter((f) => watched[f.key]).length;
    const author = people[ownerId];
    const anonymous = list.anonymous && !owner;
    const existingKeys = new Set(orderedKeys(list));
    const others = participants.length - 1;
    const filters = [
        ["all", "All"],
        ...(uid ? [["towatch", "To watch"], ["watched", "Watched"]] : []),
        ...(shared && canEdit ? [["everyone", "Everyone’s in"]] : []),
    ];

    return (
        <div className="page pb-28">
            <Link to={back[0]} className="btn btn-text -ml-2 min-h-[36px]">
                <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true"></i>
                {back[1]}
            </Link>

            <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="break-words text-[39px] font-extrabold leading-[0.95] tracking-[-0.01em] sm:text-[49px] lg:text-[61px]">
                        {list.listName}
                    </h1>
                    <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-grain">
                        <span className="flex items-center gap-2">
                            {owner ? (
                                "By you"
                            ) : anonymous ? (
                                "By an anonymous author"
                            ) : author ? (
                                <Link to={`/u/${ownerId}`} className="flex items-center gap-2 hover:text-screen">
                                    <Avatar name={author.userName} size="h-6 w-6 text-xs" />
                                    By {author.userName || "someone"}
                                </Link>
                            ) : (
                                <span className="skeleton h-4 w-28 rounded" />
                            )}
                        </span>
                        <span>
                            {total} {total === 1 ? "film" : "films"}
                        </span>
                        <span className={list.isPublic ? "text-house" : ""}>{list.isPublic ? "Public" : "Private"}</span>
                        {shared && others > 0 && (
                            <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-user-group text-xs" aria-hidden="true"></i>
                                Shared with {others} {others === 1 ? "person" : "people"}
                            </span>
                        )}
                        {list.isPublic && likedBy.length > 0 && (
                            <span>
                                {likedBy.length} {likedBy.length === 1 ? "like" : "likes"}
                            </span>
                        )}
                    </p>
                    {list.description && <p className="mt-4 max-w-[68ch] text-lg">{list.description}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canEdit && (
                        <>
                            <button type="button" className="btn btn-primary" onClick={() => openAddFilms({ id, listName: list.listName })}>
                                <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                                Add films
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
                                <i className="fa-solid fa-file-import text-sm" aria-hidden="true"></i>
                                Import
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setPeopleOpen(true)}>
                                <i className="fa-solid fa-user-plus text-sm" aria-hidden="true"></i>
                                {owner ? "Invite" : "People"}
                            </button>
                        </>
                    )}
                    {!canEdit && list.isPublic && (
                        <>
                            <button
                                type="button"
                                className={`btn ${liked ? "border border-velvet text-velvet" : "btn-secondary"}`}
                                aria-pressed={liked}
                                onClick={toggleLike}
                            >
                                <motion.i
                                    key={liked ? "on" : "off"}
                                    initial={{ scale: liked ? 0.6 : 1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                    className={`fa-${liked ? "solid" : "regular"} fa-heart text-sm`}
                                    aria-hidden="true"
                                ></motion.i>
                                {liked ? "Liked" : "Like"}
                                {likedBy.length > 0 && <span className="tabular-nums text-grain">{likedBy.length}</span>}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={copyToMine}>
                                <i className="fa-regular fa-copy text-sm" aria-hidden="true"></i>
                                Copy to my lists
                            </button>
                        </>
                    )}
                    {list.isPublic && <ShareMenu list={list} />}
                    {owner && (
                        <ListMenu
                            list={list}
                            onEdit={() => setEditing(true)}
                            onTogglePublic={togglePublic}
                            onDelete={deleteList}
                            className="min-h-[44px] w-11 border border-reel bg-transparent"
                        />
                    )}
                    {!canEdit && list.isPublic && uid && (
                        <button type="button" className="btn btn-text text-[13px]" onClick={() => setReportOpen(true)}>
                            Report
                        </button>
                    )}
                </div>
            </header>

            {uid && total > 0 && (
                <div className="mt-8 max-w-md">
                    <p className="text-grain">
                        <span className="font-display text-xl font-extrabold tabular-nums text-screen">{watchedCount}</span> of {total} watched
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-reel" aria-hidden="true">
                        <motion.div
                            className="h-full rounded-full bg-beam"
                            initial={false}
                            animate={{ width: `${(watchedCount / total) * 100}%` }}
                            transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
                        />
                    </div>
                </div>
            )}

            {total > 0 && !arranging && (
                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-reel pt-6">
                    {filters.length > 1 && (
                        <div role="radiogroup" aria-label="Show" className="inline-flex flex-wrap rounded-full border border-reel p-1">
                            {filters.map(([key, label]) => (
                                <label
                                    key={key}
                                    className={`relative cursor-pointer rounded-full px-4 py-2 transition-colors duration-quick has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[rgb(var(--focus))] ${
                                        filter === key ? "text-screen" : "text-grain hover:text-screen"
                                    }`}
                                >
                                    <input type="radio" name="list-filter" className="sr-only" checked={filter === key} onChange={() => setFilter(key)} />
                                    {filter === key && (
                                        <motion.span layoutId="list-filter-pill" className="absolute inset-0 rounded-full bg-leader" transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }} />
                                    )}
                                    <span className="relative">{label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-[13px] text-grain">
                        Sort
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field min-h-[40px] w-auto cursor-pointer text-base">
                            {Object.entries(SORTS).map(([k, label]) => (
                                <option key={k} value={k}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {canEdit && (
                        <div className="ml-auto flex gap-2">
                            <button
                                type="button"
                                className="btn btn-text"
                                onClick={() => {
                                    setSort("order");
                                    setFilter("all");
                                    setSelecting(false);
                                    setArranging(true);
                                }}
                                disabled={(films || []).length < 2}
                            >
                                <i className="fa-solid fa-arrow-down-up-across-line text-sm" aria-hidden="true"></i>
                                Arrange
                            </button>
                            <button
                                type="button"
                                className="btn btn-text"
                                aria-pressed={selecting}
                                onClick={() => {
                                    setSelecting((s) => !s);
                                    setSelected(new Set());
                                }}
                            >
                                <i className="fa-regular fa-square-check text-sm" aria-hidden="true"></i>
                                {selecting ? "Cancel" : "Select"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-10">
                {arranging ? (
                    <Arrange films={films} onDone={saveOrder} onCancel={() => setArranging(false)} />
                ) : shown === null ? (
                    <SkeletonGrid count={Math.min(Math.max(total, 4), 12)} />
                ) : films.length === 0 ? (
                    <div className="max-w-[60ch] space-y-5 py-6">
                        <p className="text-lg">
                            {canEdit ? "This list is empty. Search for a film, or import a list you already have." : "Nothing in this list yet."}
                        </p>
                        {canEdit && (
                            <div className="flex flex-wrap gap-3">
                                <button type="button" className="btn btn-primary" onClick={() => openAddFilms({ id, listName: list.listName })}>
                                    Add films
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
                                    Import a list
                                </button>
                            </div>
                        )}
                    </div>
                ) : shown.length === 0 ? (
                    <p className="text-grain">
                        {filter === "watched"
                            ? "You haven’t watched any of these yet."
                            : filter === "towatch"
                            ? "You’ve watched everything on this list."
                            : "No film has everyone in yet."}
                    </p>
                ) : (
                    <CardGrid>
                        <AnimatePresence initial={false}>
                            {shown.map((film) => (
                                <motion.div
                                    key={film.key}
                                    layout
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.28 } }}
                                    transition={{ layout: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } }}
                                >
                                    <ListFilm
                                        film={film}
                                        list={list}
                                        canEdit={canEdit}
                                        shared={shared && canEdit}
                                        selecting={selecting}
                                        selected={selected.has(film.key)}
                                        onSelect={() => toggleSelect(film.key)}
                                        onRemove={() => removeFilms([film])}
                                        onSaveNote={(values) => saveNote(film.key, values)}
                                        onCover={owner ? () => chooseCover(film.key) : null}
                                        onInterest={() => toggleInterest(film.key)}
                                        people={people}
                                        uid={uid}
                                        everyoneIn={everyoneIn(film)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardGrid>
                )}
            </div>

            <AnimatePresence>
                {selecting && (
                    <motion.div
                        role="toolbar"
                        aria-label="Selected films"
                        className="fixed inset-x-0 bottom-0 z-40 border-t border-reel bg-leader/95 backdrop-blur-md"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                        <div className="page-x mx-auto flex max-w-content flex-wrap items-center gap-2 py-3">
                            <p className="mr-2 font-bold" aria-live="polite">
                                {selected.size} selected
                            </p>
                            <button
                                type="button"
                                className="btn btn-text"
                                onClick={() =>
                                    setSelected(selected.size === (shown || []).length ? new Set() : new Set((shown || []).map((f) => f.key)))
                                }
                            >
                                {selected.size === (shown || []).length ? "Select none" : "Select all"}
                            </button>
                            <div className="ml-auto flex flex-wrap gap-2">
                                <button type="button" className="btn btn-secondary" disabled={!selected.size} onClick={bulkWatched}>
                                    Mark watched
                                </button>
                                <button ref={moveRef} type="button" className="btn btn-secondary" disabled={!selected.size} onClick={() => setTarget("move")}>
                                    Move to…
                                </button>
                                <button ref={copyRef} type="button" className="btn btn-secondary" disabled={!selected.size} onClick={() => setTarget("copy")}>
                                    Copy to…
                                </button>
                                <button type="button" className="btn btn-destructive" disabled={!selected.size} onClick={() => removeFilms(selectedFilms)}>
                                    Remove
                                </button>
                                <button type="button" className="btn btn-text" onClick={() => setSelecting(false)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <TargetPicker
                anchorRef={target === "copy" ? copyRef : moveRef}
                open={!!target}
                onClose={() => setTarget(null)}
                excludeId={id}
                label={target === "copy" ? "Copy to" : "Move to"}
                onPick={(dest) => bulkTo(dest, target)}
            />

            {owner && (
                <ListSheet
                    open={editing}
                    list={list}
                    onClose={() => setEditing(false)}
                    onSaved={(saved) => {
                        setList(saved);
                        setEditing(false);
                    }}
                />
            )}
            {canEdit && (
                <>
                    <ImportDialog
                        open={importOpen}
                        onClose={() => setImportOpen(false)}
                        listName={list.listName}
                        existingKeys={existingKeys}
                        onImport={importFilms}
                    />
                    <PeopleDialog
                        open={peopleOpen}
                        onClose={() => setPeopleOpen(false)}
                        list={list}
                        owner={owner}
                        onChange={(values) => patch((l) => ({ ...l, ...values }))}
                        onLeft={() => {
                            setPeopleOpen(false);
                            invalidateUserLists();
                            navigate("/mylists");
                        }}
                    />
                </>
            )}
            {!canEdit && list.isPublic && <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} list={list} />}
        </div>
    );
}
