import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ListPicker from "./lazyListPicker";
import { stashPoster } from "../static/morph";
import { prefetchTitle } from "../movie/oneFetcher";
import { loadDetails } from "../lazyRoutes";

// A film as a frame: poster, rating on the print, title and year beneath.
// Renders its own link to the details page, plus a quick-add button
// (hover on desktop, long-press on touch). `morph` makes the poster fly into the details page.
export default function SmallCard({ data, type, morph = false, quickAdd = true, overlay }) {
    const [loaded, setLoaded] = useState(false);
    const [picker, setPicker] = useState(null); // null | "button" | "press"
    const [pickerMounted, setPickerMounted] = useState(false);
    const frameRef = useRef(null);
    const addRef = useRef(null);
    const press = useRef(null);
    const hover = useRef(null);
    if (!data) return null;

    // Fetch the details page (data and code) once intent is clear.
    const prefetch = () => {
        prefetchTitle(type, data.id);
        loadDetails();
    };
    const startHover = () => {
        hover.current = setTimeout(prefetch, 150);
    };
    const endHover = () => clearTimeout(hover.current);

    const title = type === "tv" ? data.name : data.title;
    const date = type === "tv" ? data.first_air_date : data.release_date;
    const year = date ? date.slice(0, 4) : null;
    const rating = data.vote_average ? data.vote_average.toFixed(1) : null;
    const label = [title, year, rating && `rated ${rating}`].filter(Boolean).join(", ");

    const openPicker = (from) => {
        setPickerMounted(true);
        setPicker(from);
    };

    const startPress = () => {
        prefetch();
        if (!quickAdd) return;
        press.current = setTimeout(() => {
            press.current = "long";
            navigator.vibrate?.(10);
            openPicker("press");
        }, 500);
    };
    const cancelPress = () => {
        if (typeof press.current === "number") clearTimeout(press.current);
        if (press.current !== "long") press.current = null;
    };

    const onClick = (e) => {
        if (press.current === "long") {
            e.preventDefault();
            press.current = null;
            return;
        }
        if (morph && frameRef.current) stashPoster(data.id, frameRef.current);
    };

    return (
        <div className="film-card relative">
            <Link
                to={`/movieDetails/${data.id}/${type}`}
                state={morph ? { morph: true } : undefined}
                aria-label={label}
                className="group block outline-none"
                onClick={onClick}
                onMouseEnter={startHover}
                onMouseLeave={endHover}
                onFocus={prefetch}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onContextMenu={(e) => press.current === "long" && e.preventDefault()}
            >
                <div
                    ref={frameRef}
                    className="film-frame grain relative aspect-[2/3] overflow-hidden rounded-[3px] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-[rgb(var(--focus))]"
                >
                    {data.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w342${data.poster_path}`}
                            srcSet={[185, 342, 500]
                                .map((w) => `https://image.tmdb.org/t/p/w${w}${data.poster_path} ${w}w`)
                                .join(", ")}
                            sizes="(min-width: 768px) 200px, 160px"
                            alt=""
                            width="342"
                            height="513"
                            loading="lazy"
                            decoding="async"
                            draggable="false"
                            onLoad={() => setLoaded(true)}
                            className={`fade-img h-full w-full select-none object-cover ${loaded ? "is-loaded" : ""}`}
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
                <p className="mt-2 line-clamp-2 font-bold leading-snug text-screen">{title}</p>
                {year && <p className="text-[13px] text-grain">{year}</p>}
            </Link>

            {quickAdd && (
                <button
                    ref={addRef}
                    type="button"
                    aria-label={`Add ${title} to a list`}
                    aria-expanded={!!picker}
                    onClick={() => (picker ? setPicker(null) : openPicker("button"))}
                    className={`film-add absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-booth/85 text-screen transition-[opacity,transform,background-color] duration-quick hover:bg-beam hover:text-ink ${
                        picker ? "opacity-100" : ""
                    }`}
                >
                    <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                </button>
            )}
            {overlay}

            {pickerMounted && (
                <ListPicker
                    anchorRef={picker === "press" ? frameRef : addRef}
                    open={!!picker}
                    onClose={() => setPicker(null)}
                    id={data.id}
                    type={type}
                    title={title}
                />
            )}
        </div>
    );
}
