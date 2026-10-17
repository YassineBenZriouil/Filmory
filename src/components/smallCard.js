import React, { useState } from "react";
import { Link } from "react-router-dom";

// A film as a frame: poster, rating on the print, title and year beneath.
// Renders its own link to the details page.
export default function SmallCard({ data, type }) {
    const [loaded, setLoaded] = useState(false);
    if (!data) return null;

    const title = type === "tv" ? data.name : data.title;
    const date = type === "tv" ? data.first_air_date : data.release_date;
    const year = date ? date.slice(0, 4) : null;
    const rating = data.vote_average ? data.vote_average.toFixed(1) : null;
    const label = [title, year, rating && `rated ${rating}`]
        .filter(Boolean)
        .join(", ");

    return (
        <Link
            to={`/movieDetails/${data.id}/${type}`}
            aria-label={label}
            className="film-card group block"
        >
            <div className="film-frame grain relative aspect-[2/3] overflow-hidden rounded-[3px] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-[rgb(var(--focus))]">
                {data.poster_path ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w342${data.poster_path}`}
                        alt=""
                        width="342"
                        height="513"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setLoaded(true)}
                        className={`fade-img h-full w-full object-cover ${
                            loaded ? "is-loaded" : ""
                        }`}
                    />
                ) : (
                    <div className="grid h-full place-items-center p-4 text-center font-display text-2xl font-extrabold leading-none text-grain">
                        {title}
                    </div>
                )}
                {rating && (
                    <span
                        className={`absolute bottom-1.5 right-1.5 rounded-[3px] bg-booth/85 px-1.5 py-0.5 font-display text-base font-extrabold leading-none tabular-nums ${
                            rating >= 7 ? "text-beam" : "text-screen"
                        }`}
                        aria-hidden="true"
                    >
                        {rating}
                    </span>
                )}
            </div>
            <p className="mt-2 line-clamp-2 font-bold leading-snug text-screen">
                {title}
            </p>
            {year && <p className="text-[13px] text-grain">{year}</p>}
        </Link>
    );
}
