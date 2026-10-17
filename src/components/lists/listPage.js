import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SmallCard from "../smallCard";
import CardGrid from "../cardGrid";
import { SkeletonGrid } from "../../static/loading";
import { customToast } from "../../static/toast";
import { ConfirmDialog } from "../../static/dialog";
import Avatar from "../../static/avatar";
import { fetchTitleBasic } from "../../movie/allFetcher";
import {
    addMovieToList,
    deleteListHandler,
    fetchListById,
    fetchUserData,
    fetchingUserUIDByEmail,
    handlepublication,
    removeItemFromList,
    worksOf,
} from "../../movie/databaseFetcher";
import { invalidateUserLists } from "../../movie/listsStore";
import { LIST_CHANGED, openAddFilms } from "../search";
import ListMenu from "./listMenu";
import ListSheet from "./listSheet";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

// One page for every list. Owners can edit; everyone else gets a read-only view.
// `publicRoute` = reached from Public lists (back link goes there).
export default function ListPage({ publicRoute = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [list, setList] = useState(undefined); // undefined loading, null missing
    const [films, setFilms] = useState(null);
    const [owner, setOwner] = useState(false);
    const [author, setAuthor] = useState(null);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadFilms = useCallback(async (data) => {
        const { movie, tv } = worksOf(data);
        // Movies and series load together, not one after the other.
        const all = await Promise.all([
            ...movie.map((filmId) => fetchTitleBasic("movie", filmId)),
            ...tv.map((filmId) => fetchTitleBasic("tv", filmId)),
        ]);
        setFilms(all.filter(Boolean));
    }, []);

    const load = useCallback(async () => {
        try {
            const [data, uid] = await Promise.all([fetchListById(id), fetchingUserUIDByEmail()]);
            if (!data) return setList(null);
            const isOwner = !!uid && data.user === `/Users/${uid}`;
            if (!isOwner && !data.isPublic) return setList(null);
            setOwner(isOwner);
            setList({ id, ...data });
            loadFilms(data);
            const userId = typeof data.user === "string" ? data.user.split("/").pop() : null;
            if (userId) fetchUserData(userId).then(setAuthor);
        } catch (error) {
            console.error("Error fetching the list:", error);
            setList(null);
        }
    }, [id, loadFilms]);

    useEffect(() => {
        load();
    }, [load]);

    // Films added from the header search show up straight away.
    useEffect(() => {
        const onChange = (e) => e.detail?.id === id && load();
        window.addEventListener(LIST_CHANGED, onChange);
        return () => window.removeEventListener(LIST_CHANGED, onChange);
    }, [id, load]);

    useEffect(() => {
        if (list?.listName) document.title = `${list.listName} – ${brand}`;
    }, [list?.listName]);

    const remove = async (film) => {
        setFilms((prev) => prev.filter((f) => !(f.id === film.id && f.type === film.type)));
        const title = film.title || film.name;
        try {
            await removeItemFromList(id, film.id, film.type);
            invalidateUserLists();
            customToast(
                <span>
                    Removed {title} from {list.listName}.{" "}
                    <button
                        type="button"
                        className="font-bold underline underline-offset-4"
                        onClick={async () => {
                            try {
                                await addMovieToList(id, film.id, film.type);
                                setFilms((prev) => [...prev, film]);
                                invalidateUserLists();
                            } catch {
                                customToast(`Couldn’t put ${title} back. Add it again from search.`, "error");
                            }
                        }}
                    >
                        Undo
                    </button>
                </span>,
                "success",
                { autoClose: 5000 }
            );
        } catch (error) {
            console.error("Error removing film:", error);
            setFilms((prev) => [...prev, film]);
            customToast(`Couldn’t remove ${title}. Try again.`, "error");
        }
    };

    const togglePublic = async () => {
        const next = !list.isPublic;
        setList((l) => ({ ...l, isPublic: next }));
        try {
            await handlepublication(id);
            invalidateUserLists();
            customToast(next ? "List is now public" : "List is now private", "success");
        } catch {
            setList((l) => ({ ...l, isPublic: !next }));
            customToast("Couldn’t change who can see the list. Try again.", "error");
        }
    };

    const share = async () => {
        const url = `${window.location.origin}/publicListInside/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            customToast("Link copied", "success");
        } catch {
            customToast(`Copy this link: ${url}`, "default", { autoClose: 8000 });
        }
    };

    const confirmDelete = async () => {
        setDeleting(false);
        try {
            await deleteListHandler(id);
            invalidateUserLists();
            customToast(`Deleted ${list.listName}`, "success");
            navigate("/mylists");
        } catch {
            customToast("Couldn’t delete the list. Try again.", "error");
        }
    };

    const back = owner && !publicRoute ? ["/mylists", "My lists"] : ["/public", "Public lists"];

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

    const count = films?.length ?? worksOf(list).movie.length + worksOf(list).tv.length;
    return (
        <div className="page">
            <Link to={back[0]} className="btn btn-text -ml-2 min-h-[36px]">
                <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true"></i>
                {back[1]}
            </Link>

            <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="text-[39px] font-extrabold leading-[0.95] tracking-[-0.01em] sm:text-[49px] lg:text-[61px]">
                        {list.listName}
                    </h1>
                    <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-grain">
                        <span className="flex items-center gap-2">
                            {author ? (
                                <>
                                    <Avatar name={author.userName} fallback={author.email} size="h-6 w-6 text-xs" />
                                    By {owner ? "you" : author.userName || "someone"}
                                </>
                            ) : (
                                <span className="skeleton h-4 w-28 rounded" />
                            )}
                        </span>
                        <span>
                            {count} {count === 1 ? "film" : "films"}
                        </span>
                        <span className={list.isPublic ? "text-house" : ""}>{list.isPublic ? "Public" : "Private"}</span>
                    </p>
                    {list.description && <p className="mt-4 max-w-[68ch] text-lg">{list.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {owner && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openAddFilms({ id, listName: list.listName })}
                        >
                            <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                            Add films
                        </button>
                    )}
                    {list.isPublic && (
                        <button type="button" className="btn btn-secondary" onClick={share}>
                            <i className="fa-solid fa-link text-sm" aria-hidden="true"></i>
                            Share
                        </button>
                    )}
                    {owner && (
                        <ListMenu
                            list={list}
                            onEdit={() => setEditing(true)}
                            onTogglePublic={togglePublic}
                            onDelete={() => setDeleting(true)}
                            className="min-h-[44px] w-11 bg-transparent border border-reel"
                        />
                    )}
                </div>
            </header>

            <div className="mt-12">
                {films === null ? (
                    <SkeletonGrid count={Math.min(Math.max(count, 4), 12)} />
                ) : films.length === 0 ? (
                    <div className="max-w-[60ch] space-y-5 py-6">
                        <p className="text-lg">
                            {owner ? "This list is empty. Search for a film and add it here." : "Nothing in this list yet."}
                        </p>
                        {owner && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => openAddFilms({ id, listName: list.listName })}
                            >
                                Add films
                            </button>
                        )}
                    </div>
                ) : (
                    <CardGrid>
                        <AnimatePresence initial={false}>
                            {films.map((film) => (
                                <motion.div
                                    key={`${film.type}-${film.id}`}
                                    layout
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.28 } }}
                                    transition={{ layout: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } }}
                                >
                                    <SmallCard
                                        data={film}
                                        type={film.type}
                                        quickAdd={!owner}
                                        overlay={
                                            owner && (
                                                <button
                                                    type="button"
                                                    onClick={() => remove(film)}
                                                    aria-label={`Remove ${film.title || film.name} from ${list.listName}`}
                                                    className="film-add absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-booth/85 text-screen transition-[opacity,transform,background-color] duration-quick hover:bg-velvet [@media(hover:none)]:!grid [@media(hover:none)]:opacity-100"
                                                >
                                                    <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                                                </button>
                                            )
                                        }
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardGrid>
                )}
            </div>

            {owner && (
                <>
                    <ListSheet
                        open={editing}
                        list={list}
                        onClose={() => setEditing(false)}
                        onSaved={(saved) => {
                            setList(saved);
                            setEditing(false);
                        }}
                    />
                    <ConfirmDialog
                        open={deleting}
                        onClose={() => setDeleting(false)}
                        onConfirm={confirmDelete}
                        title={`Delete “${list.listName}”?`}
                        body={`This removes the list${count ? ` and its ${count} ${count === 1 ? "film" : "films"}` : ""}. This can’t be undone.`}
                        confirmLabel="Delete list"
                    />
                </>
            )}
        </div>
    );
}
