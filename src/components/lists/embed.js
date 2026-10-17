import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchListById, fetchProfile } from "../../movie/databaseFetcher";
import { fetchTitleBasic } from "../../movie/allFetcher";
import { orderedKeys, ownerUid, parseKey } from "../../movie/listModel";
import Lens from "../../static/lens";

// A compact poster strip for embedding a public list on another site (in an iframe).
// No header, footer or navigation; every link opens Filmory in a new tab.
export default function Embed() {
    const { id } = useParams();
    const [list, setList] = useState(undefined);
    const [films, setFilms] = useState([]);
    const [author, setAuthor] = useState(null);

    useEffect(() => {
        let alive = true;
        fetchListById(id)
            .then(async (data) => {
                if (!alive) return;
                if (!data || !data.isPublic || data.deletedAt || data.hidden) return setList(null);
                setList(data);
                const keys = orderedKeys(data).slice(0, 12);
                const found = await Promise.all(keys.map((k) => fetchTitleBasic(parseKey(k).type, parseKey(k).id)));
                if (alive) setFilms(found.filter((f) => f?.poster_path));
                if (!data.anonymous) fetchProfile(ownerUid(data)).then((p) => alive && setAuthor(p));
            })
            .catch(() => alive && setList(null));
        return () => {
            alive = false;
        };
    }, [id]);

    const url = `${window.location.origin}/publicListInside/${id}`;

    if (list === null) {
        return (
            <div className="grid min-h-screen place-items-center bg-booth p-4 text-grain">
                <p>This list isn’t public anymore.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-booth p-4 text-screen">
            <div className="flex items-baseline justify-between gap-4">
                <a href={url} target="_blank" rel="noreferrer" className="min-w-0">
                    <span className="block truncate font-display text-[25px] font-extrabold leading-tight hover:underline hover:decoration-beam">
                        {list?.listName || " "}
                    </span>
                    {author?.userName && <span className="text-[13px] text-grain">By {author.userName}</span>}
                </a>
                <a href={url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 text-[13px] text-grain hover:text-screen">
                    <Lens className="h-4 w-4" />
                    View on Filmory
                </a>
            </div>
            <ul className="row-scroller mt-3 flex gap-2 overflow-x-auto">
                {(films.length ? films : Array(8).fill(null)).map((f, i) => (
                    <li key={f ? `${f.type}-${f.id}` : i} className="w-[100px] shrink-0">
                        {f ? (
                            <a href={`${window.location.origin}/movieDetails/${f.id}/${f.type}`} target="_blank" rel="noreferrer" title={f.title || f.name}>
                                <img src={`https://image.tmdb.org/t/p/w185${f.poster_path}`} alt={f.title || f.name} loading="lazy" className="aspect-[2/3] w-full rounded-[3px] object-cover" />
                            </a>
                        ) : (
                            <div className="skeleton aspect-[2/3] w-full rounded-[3px]" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
