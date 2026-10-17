import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { loadUserLists } from "../movie/listsStore";
import { Switch } from "../static/controls";
import { entryState } from "../static/scroll";
import { deleteSavedFilter, getRegion, getSavedFilters, getServices, regionName, saveFilter } from "../static/prefs";
import { AnimatePresence, motion } from "framer-motion";
import Count from "../static/count";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { SkeletonGrid } from "../static/loading";
import {
    discoverTitles,
    fetchMovieGeneres,
    fetchProviders,
    fetchSeriesGeneres,
    searchTitles,
} from "../movie/allFetcher";

const EASE_OUT = [0.2, 0.8, 0.2, 1];
const THIS_YEAR = new Date().getFullYear();
const RECENT_YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);
const EARLIER_YEARS = Array.from({ length: THIS_YEAR - 5 - 1900 + 1 }, (_, i) => THIS_YEAR - 5 - i);
const SORT_LABELS = { popular: "Popular", rating: "Highest rated", newest: "Newest" };
const RUNTIMES = [["", "Any length"], ["90", "Under 90 min"], ["120", "Under 2 hours"]];
const RATINGS = [["", "Any rating"], ["6", "6+"], ["7", "7+"], ["8", "8+"]];
const LANGUAGES = ["en", "fr", "es", "de", "it", "ja", "ko", "zh", "hi", "ar", "pt", "sv", "da", "tr"];
const languageName = (code) => {
    try {
        return new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    } catch {
        return code;
    }
};
// Filters that aren't part of a saved set or "clear all" (the search text and type).
const FILTER_KEYS = ["year", "genres", "sort", "runtime", "rating", "lang", "providers", "cast", "castName", "keywords", "keywordName", "hide"];

// "movie:123" for every film in the user's lists.
const filmsInLists = (lists) =>
    new Set(
        lists.flatMap((l) => {
            const w = l.works;
            if (!w || Array.isArray(w)) return [];
            return [...(w.movie || []).map((id) => `movie:${id}`), ...(w.tv || []).map((id) => `tv:${id}`)];
        })
    );

const genreCache = {};
const loadGenres = (type) =>
    (genreCache[type] ||= (type === "tv" ? fetchSeriesGeneres() : fetchMovieGeneres()));

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
    const runtime = params.get("runtime") || "";
    const rating = params.get("rating") || "";
    const lang = params.get("lang") || "";
    const providerIds = useMemo(
        () => (params.get("providers") || "").split(",").filter(Boolean).map(Number),
        [params]
    );
    const cast = params.get("cast") || "";
    const castName = params.get("castName") || "";
    const keywords = params.get("keywords") || "";
    const keywordName = params.get("keywordName") || "";
    const hideMine = params.get("hide") === "1";
    const region = getRegion();
    const navigate = useNavigate();
    const { key: entryKey } = useLocation();
    const { user } = useAuth();
    const [providers, setProviders] = useState([]);
    const [mine, setMine] = useState(null); // Set of "type:id" in the user's lists
    const [saved, setSaved] = useState(getSavedFilters);
    const [naming, setNaming] = useState(null); // name being typed for a new saved set
    const [retry, setRetry] = useState(0);

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

    // Streaming chips: the person's own services if they set any, otherwise the biggest eight.
    useEffect(() => {
        if (q) return;
        let alive = true;
        fetchProviders(filterType, region).then((list) => {
            if (!alive) return;
            const own = getServices(region);
            setProviders(own.length ? list.filter((p) => own.includes(p.provider_id)) : list.slice(0, 8));
        });
        return () => {
            alive = false;
        };
    }, [filterType, region, q]);

    useEffect(() => {
        if (!hideMine || !user) return;
        let alive = true;
        loadUserLists().then((lists) => alive && setMine(filmsInLists(lists)));
        return () => {
            alive = false;
        };
    }, [hideMine, user]);

    const update = (changes) => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value === "" || value === null || value === undefined || (Array.isArray(value) && !value.length))
                next.delete(key);
            else next.set(key, Array.isArray(value) ? value.join(",") : value);
        }
        setParams(next, { replace: true });
    };

    const key = [q, type, year, sort, genreIds.join(","), runtime, rating, lang, providerIds.join(","), cast, keywords].join("|");

    const fetchPage = async (page) => {
        if (q) {
            const res = await searchTitles(q, { page }).catch(() => null);
            if (!res) return null;
            const results = type === "all" ? res.results : res.results.filter((r) => r.media_type === type);
            return { ...res, results };
        }
        return discoverTitles({
            type: filterType,
            year,
            genres: genreIds,
            sort,
            page,
            runtimeMax: runtime,
            minRating: rating,
            language: lang,
            providers: providerIds,
            region,
            cast,
            keywords,
        });
    };

    // Live results, debounced so quick chip taps settle into one request.
    useEffect(() => {
        let alive = true;
        // Back from a film: show exactly what was loaded before, including "Show more" pages.
        const snapshot = entryState.get(`discover:${entryKey}`);
        if (snapshot?.key === key && !retry) {
            setData(snapshot);
            setLoading(false);
            return;
        }
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
    }, [key, retry]);

    useEffect(() => {
        if (data && !data.failed) entryState.set(`discover:${entryKey}`, data);
    }, [data, entryKey]);

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
        update({ ...Object.fromEntries(FILTER_KEYS.filter((k) => k !== "sort").map((k) => [k, ""])), q: "", type: q ? "" : params.get("type") });
        setLastAdded(null);
    };

    const filtered = !!(year || genreIds.length || runtime || rating || lang || providerIds.length || cast || keywords || hideMine);

    const saveCurrent = (e) => {
        e.preventDefault();
        const name = naming?.trim();
        if (!name) return;
        const current = new URLSearchParams(params);
        current.delete("q");
        setSaved(saveFilter(name, current.toString()));
        setNaming(null);
    };

    const visibleResults = (data?.results || []).filter(
        (item) => !(hideMine && mine?.has(`${item.media_type || filterType}:${item.id}`))
    );
    const surprise = () => {
        const pick = visibleResults[Math.floor(Math.random() * visibleResults.length)];
        if (pick) navigate(`/movieDetails/${pick.id}/${pick.media_type || filterType}`);
    };
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

            {!q && saved.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Saved filters">
                    <span className="w-16 text-[13px] text-grain">Saved</span>
                    {saved.map((set) => {
                        const current = new URLSearchParams(params);
                        current.delete("q");
                        const on = new URLSearchParams(set.query).toString() === current.toString();
                        return (
                            <span
                                key={set.name}
                                className={`inline-flex min-h-[40px] items-center rounded-full border ${
                                    on ? "border-beam text-screen" : "border-reel text-grain"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setParams(new URLSearchParams(set.query), { replace: true });
                                        setLastAdded(null);
                                    }}
                                    className="px-4 py-2 hover:text-screen"
                                >
                                    {set.name}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Delete saved filters “${set.name}”`}
                                    onClick={() => setSaved(deleteSavedFilter(set.name))}
                                    className="grid h-8 w-8 place-items-center rounded-full pr-1 text-grain hover:text-velvet"
                                >
                                    <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {(castName || keywordName) && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {castName && (
                        <button
                            type="button"
                            className="btn btn-secondary min-h-[40px] rounded-full border-beam"
                            onClick={() => update({ cast: "", castName: "" })}
                        >
                            With {castName}
                            <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
                            <span className="sr-only">(remove)</span>
                        </button>
                    )}
                    {keywordName && (
                        <button
                            type="button"
                            className="btn btn-secondary min-h-[40px] rounded-full border-beam"
                            onClick={() => update({ keywords: "", keywordName: "" })}
                        >
                            About {keywordName}
                            <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
                            <span className="sr-only">(remove)</span>
                        </button>
                    )}
                </div>
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

                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Length">
                            <span className="w-16 text-[13px] text-grain">Length</span>
                            {RUNTIMES.map(([value, label]) => (
                                <Chip key={label} on={runtime === value} onClick={() => update({ runtime: value })}>
                                    {label}
                                </Chip>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Minimum rating">
                            <span className="w-16 text-[13px] text-grain">Rating</span>
                            {RATINGS.map(([value, label]) => (
                                <Chip key={label} on={rating === value} onClick={() => update({ rating: value })}>
                                    {label}
                                </Chip>
                            ))}
                            <label className="ml-2 flex items-center gap-2 text-[13px] text-grain">
                                Language
                                <select
                                    value={lang}
                                    onChange={(e) => update({ lang: e.target.value })}
                                    className={`field min-h-[40px] w-auto cursor-pointer rounded-full px-4 text-base ${lang ? "border-beam" : ""}`}
                                >
                                    <option value="">Any</option>
                                    {LANGUAGES.map((code) => (
                                        <option key={code} value={code}>
                                            {languageName(code)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {providers.length > 0 && (
                            <div
                                className="flex flex-wrap items-center gap-2"
                                role="group"
                                aria-label={`Streaming in ${regionName(region)}`}
                            >
                                <span className="w-16 text-[13px] leading-tight text-grain">Streaming on</span>
                                {providers.map((p) => {
                                    const on = providerIds.includes(p.provider_id);
                                    return (
                                        <button
                                            key={p.provider_id}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() =>
                                                update({
                                                    providers: on
                                                        ? providerIds.filter((x) => x !== p.provider_id)
                                                        : [...providerIds, p.provider_id],
                                                })
                                            }
                                            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors duration-quick ${
                                                on
                                                    ? "border-beam bg-beam/15 text-screen"
                                                    : "border-reel text-grain hover:border-grain hover:text-screen"
                                            }`}
                                        >
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                                alt=""
                                                width="28"
                                                height="28"
                                                loading="lazy"
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                            {p.provider_name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {user && (
                            <div className="flex w-fit items-center gap-3">
                                <Switch
                                    id="hide-mine"
                                    checked={hideMine}
                                    onChange={(v) => update({ hide: v ? "1" : "" })}
                                    label="Hide films in my lists"
                                />
                                <label htmlFor="hide-mine" className="cursor-pointer">
                                    Hide films in my lists
                                </label>
                            </div>
                        )}
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
                <div className="flex flex-wrap items-center gap-3">
                    {visibleResults.length > 1 && (
                        <button type="button" className="btn btn-text" onClick={surprise}>
                            <i className="fa-solid fa-shuffle text-sm" aria-hidden="true"></i>
                            Surprise me
                        </button>
                    )}
                    {!q && filtered && naming === null && (
                        <button type="button" className="btn btn-text" onClick={() => setNaming("")}>
                            <i className="fa-regular fa-bookmark text-sm" aria-hidden="true"></i>
                            Save filters
                        </button>
                    )}
                    {!q && filtered && naming !== null && (
                        <form onSubmit={saveCurrent} className="flex items-center gap-2">
                            <label htmlFor="saved-name" className="sr-only">
                                Name for these filters
                            </label>
                            <input
                                id="saved-name"
                                autoFocus
                                value={naming}
                                onChange={(e) => setNaming(e.target.value)}
                                onKeyDown={(e) => e.key === "Escape" && setNaming(null)}
                                maxLength={30}
                                placeholder="Name, like Friday horror"
                                className="field min-h-[40px] w-56"
                            />
                            <button type="submit" className="btn btn-primary min-h-[40px] px-3" disabled={!naming.trim()}>
                                Save
                            </button>
                        </form>
                    )}
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
                ) : visibleResults.length ? (
                    <motion.div
                        key={data.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loading && data.key !== key ? 0.4 : 1 }}
                        transition={{ duration: 0.28 }}
                        aria-busy={loading}
                    >
                        <CardGrid>
                            {visibleResults.map((item) => (
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
                        {data.failed && (
                            <button type="button" className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
                                <i className="fa-solid fa-rotate-right text-sm" aria-hidden="true"></i>
                                Try again
                            </button>
                        )}
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
