import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTitleBasic } from "../../movie/allFetcher";
import { filmCount, worksOf } from "../../movie/databaseFetcher";
import Avatar from "../../static/avatar";
import ListMenu from "./listMenu";

// The first four posters in a list.
function usePosters(list) {
    const { movie, tv } = worksOf(list);
    const firstFour = [...movie.map((id) => ["movie", id]), ...tv.map((id) => ["tv", id])].slice(0, 4);
    const key = firstFour.map((w) => w.join(":")).join(",");
    const [posters, setPosters] = useState([]);
    useEffect(() => {
        let alive = true;
        Promise.all(firstFour.map(([type, id]) => fetchTitleBasic(type, id))).then(
            (films) => alive && setPosters(films.filter((f) => f?.poster_path).map((f) => f.poster_path))
        );
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return { posters, expected: firstFour.length };
}

function Fan({ list }) {
    const { posters, expected } = usePosters(list);
    if (!expected) {
        return (
            <div className="grid h-[150px] w-[100px] place-items-center rounded-[3px] border border-dashed border-reel text-[13px] text-grain">
                Empty
            </div>
        );
    }
    return (
        <div className="relative h-[150px]" aria-hidden="true">
            {(posters.length ? posters : Array(expected).fill(null)).map((path, i) => (
                <div
                    key={i}
                    className="fan-item absolute left-0 top-0 aspect-[2/3] w-[100px] overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(var(--reel)/0.6),0_6px_16px_-6px_rgb(var(--booth))]"
                    style={{ "--i": i, zIndex: i }}
                >
                    {path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w185${path}`}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="skeleton h-full w-full" />
                    )}
                </div>
            ))}
        </div>
    );
}

// A list on a shelf. The whole tile links to the list; owners also get the ⋯ menu.
export default function ListTile({ list, to, author, onEdit, onTogglePublic, onDelete }) {
    const count = filmCount(list);
    const owner = !!onEdit;
    return (
        <article className="group relative flex h-full flex-col rounded-[14px] border border-reel p-5 transition-colors duration-quick hover:border-grain has-[a:focus-visible]:border-beam">
            <Fan list={list} />
            <h3 className="mt-5 text-[25px] font-semibold leading-tight">
                <Link
                    to={to}
                    className="outline-none after:absolute after:inset-0 after:rounded-[14px] after:content-['']"
                >
                    {list.listName || "Untitled list"}
                </Link>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-grain">
                {author === null && <span className="skeleton h-3 w-[60px] rounded" aria-hidden="true" />}
                {author && (
                    <span className="flex items-center gap-2">
                        <Avatar name={author.userName} size="h-5 w-5 text-[11px]" />
                        {author.userName || "Someone"}
                    </span>
                )}
                <span>
                    {count} {count === 1 ? "film" : "films"}
                </span>
                {owner && (
                    <span className={`flex items-center gap-1.5 ${list.isPublic ? "text-house" : ""}`}>
                        {list.isPublic && <span className="h-1.5 w-1.5 rounded-full bg-house" aria-hidden="true" />}
                        {list.isPublic ? "Public" : "Private"}
                    </span>
                )}
            </p>
            {list.description && <p className="mt-3 line-clamp-2 max-w-[60ch] text-grain">{list.description}</p>}
            {owner && (
                <div className="absolute right-3 top-3 z-10 opacity-100 transition-opacity duration-quick [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 [&:has([aria-expanded=true])]:!opacity-100">
                    <ListMenu list={list} onEdit={onEdit} onTogglePublic={onTogglePublic} onDelete={onDelete} />
                </div>
            )}
        </article>
    );
}

export function TileSkeleton() {
    return (
        <div className="rounded-[14px] border border-reel p-5" aria-hidden="true">
            <div className="skeleton h-[150px] w-[100px] rounded-[3px]" />
            <div className="skeleton mt-5 h-6 w-2/3 rounded" />
            <div className="skeleton mt-3 h-3 w-1/3 rounded" />
        </div>
    );
}
