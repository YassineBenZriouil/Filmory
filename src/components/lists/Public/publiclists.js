import React, { useEffect, useMemo, useState } from "react";
import { fetchAllPublicLists, fetchProfile } from "../../../movie/databaseFetcher";
import { filmCount } from "../../../movie/listModel";
import ListTile, { TileSkeleton } from "../listTile";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5";
const userIdOf = (list) => (typeof list.user === "string" ? list.user.split("/").pop() : null);

export default function PublicLists() {
    const [lists, setLists] = useState(null);
    const [authors, setAuthors] = useState({});
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("newest");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                // Moderated or deleted lists never show here.
                const publicLists = (await fetchAllPublicLists()).filter((l) => !l.deletedAt && !l.hidden);
                if (!alive) return;
                setLists(publicLists);
                // One lookup per author, all at once, instead of one per card.
                const ids = [...new Set(publicLists.map(userIdOf).filter(Boolean))];
                const users = await Promise.all(ids.map((uid) => fetchProfile(uid)));
                if (alive) setAuthors(Object.fromEntries(ids.map((uid, i) => [uid, users[i]])));
            } catch (error) {
                console.error("Error fetching public lists:", error);
                if (alive) setLists([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Search runs over public lists only, never anyone's private lists.
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matched = (lists || []).filter(
            (l) => !q || l.listName?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
        );
        const likes = (l) => (l.likedBy || []).length;
        return matched.sort((a, b) =>
            sort === "films"
                ? filmCount(b) - filmCount(a)
                : sort === "liked"
                ? likes(b) - likes(a) || (b.createdAt || 0) - (a.createdAt || 0)
                : (b.createdAt || 0) - (a.createdAt || 0)
        );
    }, [lists, query, sort]);

    return (
        <div className="page">
            <h1 className="page-title">Public lists</h1>
            <p className="mt-2 text-grain">Lists other people have shared</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-grain" aria-hidden="true"></i>
                    <label htmlFor="public-search" className="sr-only">
                        Search public lists
                    </label>
                    <input
                        id="public-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by list name or description"
                        className="field pl-9"
                    />
                </div>
                <label className="flex items-center gap-2 text-[13px] text-grain sm:ml-auto">
                    Sort
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="field min-h-[40px] w-auto cursor-pointer text-base">
                        <option value="newest">Newest</option>
                        <option value="liked">Most liked</option>
                        <option value="films">Most films</option>
                    </select>
                </label>
            </div>

            <div className="mt-8">
                {lists === null ? (
                    <div className={GRID}>
                        {[0, 1, 2, 3].map((i) => (
                            <TileSkeleton key={i} />
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <p className="text-lg text-grain">
                        {query.trim() ? `No public lists match “${query.trim()}”.` : "No one has shared a list yet."}
                    </p>
                ) : (
                    <div className={GRID}>
                        {visible.map((list) => {
                            const uid = userIdOf(list);
                            return (
                                <ListTile
                                    key={list.id}
                                    list={list}
                                    to={`/publicListInside/${list.id}`}
                                    author={uid in authors ? authors[uid] || { userName: "" } : null}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
