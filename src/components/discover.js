import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { SkeletonGrid } from "../static/loading";
import {
    discoverTitles,
    fetchMovieGeneres,
    fetchSeriesGeneres,
    searchTitles,
} from "../movie/allFetcher";

const EASE_OUT = [0.2, 0.8, 0.2, 1];
const THIS_YEAR = new Date().getFullYear();
const RECENT_YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);
const EARLIER_YEARS = Array.from({ length: THIS_YEAR - 5 - 1900 + 1 }, (_, i) => THIS_YEAR - 5 - i);
const SORT_LABELS = { popular: "Popular", rating: "Highest rated", newest: "Newest" };

const genreCache = {};
const loadGenres = (type) =>
    (genreCache[type] ||= (type === "tv" ? fetchSeriesGeneres() : fetchMovieGeneres()));

function Count({ value }) {
    const ref = useRef(null);
    const shown = useRef(value);
    const reduce = useReducedMotion();
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        if (reduce) {
            node.textContent = value.toLocaleString();
            shown.current = value;
            return;
        }
        const controls = animate(shown.current, value, {
            duration: 0.28,
            ease: EASE_OUT,
            onUpdate: (v) => {
                shown.current = v;
                node.textContent = Math.round(v).toLocaleString();
            },
        });
        return () => controls.stop();
    }, [value, reduce]);
    return <span ref={ref}>{value.toLocaleString()}</span>;
}

function Segmented({ value, options, onChange, label, id }) {
    return (
        <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-reel p-1">
            {options.map(([key, text]) => {
                const on = value === key;
                return (
                    <label
                        key={key}
                        className={`relative cursor-pointer rounded-full px-4 py-2 transition-colors duration-quick has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[rgb(var(--focus))] ${
                            on ? "text-screen" : "text-grain hover:text-screen"
                        }`}
                    >
                        <input
                            type="radio"
                            name={id}
                            className="sr-only"
                            checked={on}
                            onChange={() => onChange(key)}
                        />
                        {on && (
                            <motion.span
                                layoutId={`${id}-pill`}
                                className="absolute inset-0 rounded-full bg-leader"
                                transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }}
                            />
                        )}
                        <span className="relative">{text}</span>
                    </label>
                );
            })}
        </div>
    );
}

// A pill that fills with light from its centre when switched on.
function Chip({ on, onClick, children }) {
    return (
        <button
            type="button"
            aria-pressed={on}
            onClick={onClick}
            className={`relative inline-flex min-h-[40px] items-center overflow-hidden rounded-full border px-4 transition-colors duration-quick ${
                on ? "border-beam text-ink" : "border-reel text-grain hover:border-grain hover:text-screen"
            }`}
        >
            <motion.span
                aria-hidden="true"
                className="absolute inset-0 bg-beam"
                initial={false}
                animate={{ clipPath: on ? "circle(75% at 50% 50%)" : "circle(0% at 50% 50%)" }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
            />
            <motion.span
                aria-hidden="true"
                className="relative inline-block overflow-hidden"
                initial={false}
                animate={{ width: on ? 18 : 0, opacity: on ? 1 : 0, x: on ? 0 : -6 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
            >
                <i className="fa-solid fa-check text-xs"></i>
            </motion.span>
            <span className="relative">{children}</span>
        </button>
    );
}

export default function Discover() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q")?.trim() || "";
    const type = params.get("type") || (q ? "all" : "movie");
    const year = params.get("year") || "";
    const sort = params.get("sort") || "popular";
    const genreIds = useMemo(
        () => (params.get("genres") || "").split(",").filter(Boolean).map(Number),
        [params]
    );

    const [genres, setGenres] = useState([]);
    const [data, setData] = useState(null); // { key, results, totalResults, totalPages, page }
    const [loading, setLoading] = useState(true);
    const [lastAdded, setLastAdded] = useState(null); // { kind: "year" | "genre", value, label }
    const filterType = type === "tv" ? "tv" : "movie";

    useEffect(() => {
        if (q) return;
        let alive = true;
        loadGenres(filterType).then((list) => alive && setGenres(list));
        return () => {
            alive = false;
        };
    }, [filterType, q]);

    const update = (changes) => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value === "" || value === null || value === undefined || (Array.isArray(value) && !value.length))
                next.delete(key);
            else next.set(key, Array.isArray(value) ? value.join(",") : value);
        }
        setParams(next, { replace: true });
    };

    const key = [q, type, year, sort, genreIds.join(",")].join("|");

    const fetchPage = async (page) => {
        if (q) {
            const res = await searchTitles(q, { page }).catch(() => null);
            if (!res) return null;
            const results = type === "all" ? res.results : res.results.filter((r) => r.media_type === type);
            return { ...res, results };
        }
        return discoverTitles({ type: filterType, year, genres: genreIds, sort, page });
    };

    // Live results, debounced so quick chip taps settle into one request.
    useEffect(() => {
        let alive = true;
        setLoading(true);
        const timer = setTimeout(async () => {
            const res = await fetchPage(1);
            if (!alive) return;
            setData(res ? { key, page: 1, ...res } : { key, page: 1, results: [], totalResults: 0, totalPages: 0, failed: true });
            setLoading(false);
        }, 250);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const showMore = async () => {
        setLoading(true);
        const res = await fetchPage(data.page + 1);
        if (res) setData((d) => ({ ...d, page: d.page + 1, results: [...d.results, ...res.results] }));
        setLoading(false);
    };

    const toggleGenre = (genre) => {
        const on = genreIds.includes(genre.id);
        update({ genres: on ? genreIds.filter((g) => g !== genre.id) : [...genreIds, genre.id] });
        if (!on) setLastAdded({ kind: "genre", value: genre.id, label: genre.name });
    };
    const setYear = (value) => {
        update({ year: value });
        if (value) setLastAdded({ kind: "year", value, label: String(value) });
    };
    const removeLast = () => {
        if (!lastAdded) return;
        if (lastAdded.kind === "year") update({ year: "" });
        else update({ genres: genreIds.filter((g) => g !== lastAdded.value) });
        setLastAdded(null);
    };
    const clearAll = () => {
        update({ year: "", genres: [], q: "", type: q ? "" : params.get("type") });
        setLastAdded(null);
    };

    const filtered = !!(year || genreIds.length);
    const lastStillActive =
        lastAdded &&
        (lastAdded.kind === "year" ? String(year) === String(lastAdded.value) : genreIds.includes(lastAdded.value));
    const typeOptions = [
        ...(q ? [["all", "All"]] : []),
        ["movie", "Movies"],
        ["tv", "TV shows"],
    ];
    const cardType = (item) => item.media_type || filterType;

    return (
        <div className="page">
            <h1 className="page-title">{q ? `Results for “${q}”` : "Discover"}</h1>
            {q && (
                <button type="button" className="btn btn-text -ml-2 mt-2" onClick={() => update({ q: "", type: "" })}>
                    <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                    Clear search
                </button>
            )}

            <div className="mt-8 space-y-5">
                <Segmented
                    id="discover-type"
                    label="Type"
                    value={type}
                    options={typeOptions}
                    onChange={(t) => {
                        // Genre ids differ between movies and TV, so switching type clears them.
                        update({ type: t === (q ? "all" : "movie") ? "" : t, genres: [] });
                        setLastAdded(null);
                    }}
                />

                {!q && (
                    <>
                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Release year">
                            <span className="w-16 text-[13px] text-grain">Year</span>
                            <Chip on={!year} onClick={() => setYear("")}>
                                Any
                            </Chip>
                            {RECENT_YEARS.map((y) => (
                                <Chip key={y} on={String(year) === String(y)} onClick={() => setYear(String(year) === String(y) ? "" : y)}>
                                    {y}
                                </Chip>
                            ))}
                            <label className="sr-only" htmlFor="earlier-year">
                                Earlier year
                            </label>
                            <select
                                id="earlier-year"
                                value={EARLIER_YEARS.includes(Number(year)) ? year : ""}
                                onChange={(e) => setYear(e.target.value)}
                                className={`field min-h-[40px] w-auto cursor-pointer rounded-full px-4 ${
                                    EARLIER_YEARS.includes(Number(year)) ? "border-beam" : ""
                                }`}
                            >
                                <option value="">Earlier</option>
                                {EARLIER_YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Genres">
                            <span className="w-16 text-[13px] text-grain">Genres</span>
                            {genres.length
                                ? genres.map((genre) => (
                                      <Chip key={genre.id} on={genreIds.includes(genre.id)} onClick={() => toggleGenre(genre)}>
                                          {genre.name}
                                      </Chip>
                                  ))
                                : Array.from({ length: 8 }, (_, i) => (
                                      <span key={i} className="skeleton h-10 w-24 rounded-full" aria-hidden="true" />
                                  ))}
                        </div>
                    </>
                )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-reel pt-6">
                <p className="text-grain" aria-live="polite">
                    <span className="font-display text-[25px] font-extrabold text-screen">
                        <Count value={data?.totalResults || 0} />
                    </span>{" "}
                    results
                </p>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {(filtered || q) && (
                            <motion.button
                                type="button"
                                className="btn btn-text"
                                onClick={clearAll}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.16 }}
                            >
                                Clear all
                            </motion.button>
                        )}
                    </AnimatePresence>
                    {!q && (
                        <label className="flex items-center gap-2 text-[13px] text-grain">
                            Sort
                            <select
                                value={sort}
                                onChange={(e) => update({ sort: e.target.value === "popular" ? "" : e.target.value })}
                                className="field min-h-[40px] w-auto cursor-pointer text-base"
                            >
                                {Object.entries(SORT_LABELS).map(([k, label]) => (
                                    <option key={k} value={k}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            <div className="mt-8">
                {!data ? (
                    <SkeletonGrid />
                ) : data.results.length ? (
                    <motion.div
                        key={data.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loading && data.key !== key ? 0.4 : 1 }}
                        transition={{ duration: 0.28 }}
                        aria-busy={loading}
                    >
                        <CardGrid>
                            {data.results.map((item) => (
                                <SmallCard key={`${cardType(item)}-${item.id}`} data={item} type={cardType(item)} />
                            ))}
                        </CardGrid>
                        {data.page < data.totalPages && (
                            <div className="mt-12 flex justify-center">
                                <button type="button" className="btn btn-secondary" onClick={showMore} disabled={loading}>
                                    Show more
                                </button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loading ? 0.4 : 1 }}
                        className="max-w-[60ch] space-y-4"
                    >
                        <p className="text-lg">
                            {data.failed
                                ? "Results aren’t loading. Check your connection and try again."
                                : q
                                ? `Nothing found for “${q}”. Try the original title.`
                                : "No films match these filters."}
                        </p>
                        {!data.failed && (
                            <div className="flex flex-wrap gap-3">
                                {lastStillActive && (
                                    <button type="button" className="btn btn-secondary" onClick={removeLast}>
                                        Remove {lastAdded.label}
                                    </button>
                                )}
                                {(filtered || q) && (
                                    <button type="button" className="btn btn-text" onClick={clearAll}>
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
