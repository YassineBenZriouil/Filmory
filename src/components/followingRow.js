import React, { useEffect, useState } from "react";
import { fetchFollowing, fetchProfile, fetchPublicListsBy } from "../movie/databaseFetcher";
import { ownerUid } from "../movie/listModel";
import ListTile from "./lists/listTile";

// "New from people you follow" on Home. Renders nothing until there's something to show.
export default function FollowingRow() {
    const [lists, setLists] = useState([]);
    const [authors, setAuthors] = useState({});

    useEffect(() => {
        let alive = true;
        (async () => {
            const following = await fetchFollowing();
            if (!following.length) return;
            const found = (await fetchPublicListsBy(following))
                .filter((l) => !l.deletedAt && !l.hidden && !l.anonymous)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 10);
            if (!alive) return;
            setLists(found);
            const ids = [...new Set(found.map(ownerUid))];
            const profiles = await Promise.all(ids.map((u) => fetchProfile(u)));
            if (alive) setAuthors(Object.fromEntries(ids.map((u, i) => [u, profiles[i] || { userName: "" }])));
        })().catch((error) => console.error("Error loading followed lists:", error));
        return () => {
            alive = false;
        };
    }, []);

    if (!lists.length) return null;
    return (
        <section aria-labelledby="following-title" className="py-6">
            <h2 id="following-title" className="page-x mx-auto mb-4 max-w-[1464px] text-[25px] font-semibold md:text-[31px]">
                New from people you follow
            </h2>
            <ul className="row-scroller page-x flex snap-x gap-5 overflow-x-auto pb-3 scroll-px-4 md:scroll-px-8">
                {lists.map((list) => (
                    <li key={list.id} className="w-[280px] shrink-0 snap-start">
                        <ListTile list={list} to={`/publicListInside/${list.id}`} author={authors[ownerUid(list)] ?? null} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
