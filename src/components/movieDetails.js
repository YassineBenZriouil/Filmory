import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { loginPath, useAuth } from "../auth/authContext";
import { CreditLine, Keywords, Seasons, WhereToWatch } from "./detailsExtras";
import { addRecentlyViewed } from "../static/prefs";
import WatchedButton from "./watchedButton";
import { fetchOneMovie, fetchOneSerie } from "./../movie/oneFetcher";
import { fetchRecommendations } from "./../movie/allFetcher";
import Loading from "../static/loading";
import SmallCard from "./smallCard";
import CardRow from "./cardRow";
import ListPicker from "./lazyListPicker";
import Dialog from "../static/dialog";
import { flipFrom, takePoster } from "../static/morph";
import { prefersReducedMotion } from "../static/hooks";
import { initialsOf } from "../static/avatar";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";
const languageName = new Intl.DisplayNames(["en"], { type: "language" });
const regionName = new Intl.DisplayNames(["en"], { type: "region" });

const safe = (fn, code) => {
    try {
        return fn.of(code) || code;
    } catch {
        return code;
    }
};

const hoursAndMinutes = (minutes) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
};

const longDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null;

const certificationOf = (film, type) => {
    if (type === "tv") {
        return film.content_ratings?.results?.find((r) => r.iso_3166_1 === "US")?.rating || null;
    }
    const us = film.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
    return us?.release_dates?.find((d) => d.certification)?.certification || null;
};

const trailerOf = (film) => {
    const videos = (film.videos?.results || []).filter((v) => v.site === "YouTube");
    return (
        videos.find((v) => v.type === "Trailer" && v.official) ||
        videos.find((v) => v.type === "Trailer") ||
        videos.find((v) => v.type === "Teaser") ||
        null
    );
};

// Ten segments, filled to the score; the last one partially.
function RatingBar({ value }) {
    return (
        <span className="flex gap-1" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => {
                const fill = Math.max(0, Math.min(1, value - i));
                return (
                    <span key={i} className="relative h-3 w-2 overflow-hidden rounded-[2px] bg-reel sm:w-2.5">
                        <span className="absolute inset-y-0 left-0 bg-beam" style={{ width: `${fill * 100}%` }} />
                    </span>
                );
            })}
        </span>
    );
}

function CastRow({ cast }) {
    if (!cast.length) return null;
    return (
        <section aria-labelledby="cast-title" className="py-6">
            <h2 id="cast-title" className="page-x mx-auto mb-4 max-w-[1464px] text-[25px] font-semibold md:text-[31px]">
                Cast
            </h2>
            <ul className="row-scroller page-x flex snap-x gap-5 overflow-x-auto pb-2 scroll-px-4 md:scroll-px-8">
                {cast.map((person) => (
                    <li key={person.credit_id || person.id} className="w-[96px] shrink-0 snap-start">
                        <Link to={`/person/${person.id}`} className="group block">
                        {person.profile_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                alt=""
                                loading="lazy"
                                width="72"
                                height="72"
                                className="grain h-[72px] w-[72px] rounded-full object-cover transition-shadow duration-quick group-hover:shadow-[0_0_0_2px_rgb(var(--beam))]"
                            />
                        ) : (
                            <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-leader font-display text-2xl font-extrabold text-grain">
                                {initialsOf(person.name)}
                            </span>
                        )}
                        <p className="mt-2 font-bold leading-snug group-hover:underline group-hover:decoration-beam group-hover:underline-offset-4">{person.name}</p>
                        {person.character && (
                            <p className="text-[13px] leading-snug text-grain">{person.character}</p>
                        )}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function MovieDetails() {
    const { id, type } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [film, setFilm] = useState(undefined); // undefined = loading, null = failed
    const [attempt, setAttempt] = useState(0);
    const [more, setMore] = useState([]);
    const [picker, setPicker] = useState(false);
    const [trailerOpen, setTrailerOpen] = useState(false);
    const [posterLoaded, setPosterLoaded] = useState(false);
    const addRef = useRef(null);
    const posterRef = useRef(null);
    const loggedIn = !!useAuth().user;

    useEffect(() => {
        let alive = true;
        const fetcher = type === "tv" ? fetchOneSerie : fetchOneMovie;
        setFilm(undefined);
        fetcher(id).then((data) => {
            if (!alive) return;
            setFilm(data && data.id ? data : null);
        });
        fetchRecommendations(type === "tv" ? "tv" : "movie", id).then((list) => alive && setMore(list));
        return () => {
            alive = false;
        };
    }, [id, type, attempt]);

    const title = film && (type === "tv" ? film.name : film.title);

    useEffect(() => {
        if (!title) return;
        document.title = `${title} – ${brand}`;
        addRecentlyViewed({
            id: film.id,
            type: type === "tv" ? "tv" : "movie",
            title,
            poster_path: film.poster_path,
            year: (type === "tv" ? film.first_air_date : film.release_date)?.slice(0, 4),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title]);

    // "L" opens the list picker from anywhere on the page (not while typing).
    useEffect(() => {
        if (!film || !loggedIn) return;
        const onKey = (e) => {
            if (e.key !== "l" && e.key !== "L") return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.closest(".film-card")) return;
            e.preventDefault();
            setPicker(true);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [film, loggedIn]);

    // Came back from logging in after pressing "Log in to save": finish adding.
    useEffect(() => {
        if (!film || !loggedIn || location.state?.intent !== "add") return;
        setPicker(true);
        navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }, [film, loggedIn, location, navigate]);

    // Arriving from a "More like this" card: fly the poster in from where the card was.
    useLayoutEffect(() => {
        if (!film || !posterRef.current) return;
        const from = takePoster(id);
        if (from && !prefersReducedMotion()) flipFrom(posterRef.current, from);
    }, [film, id]);

    if (film === undefined) return <Loading />;

    if (film === null) {
        return (
            <div className="page flex min-h-[60vh] flex-col items-start justify-center gap-6">
                <h1 className="page-title">This title couldn’t be loaded</h1>
                <p className="text-grain">The connection may have dropped, or TMDB removed it.</p>
                <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn btn-primary" onClick={() => setAttempt((n) => n + 1)}>
                        Try again
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    const date = type === "tv" ? film.first_air_date : film.release_date;
    const year = date?.slice(0, 4);
    const runtime = type === "tv"
        ? film.episode_run_time?.[0] && `${film.episode_run_time[0]} min episodes`
        : hoursAndMinutes(film.runtime);
    const certification = certificationOf(film, type);
    const genres = (film.genres || []).map((g) => g.name);
    const rating = film.vote_count ? film.vote_average : null;
    const trailer = trailerOf(film);
    const countries =
        type === "tv"
            ? (film.origin_country || []).map((c) => safe(regionName, c))
            : (film.production_countries || []).map((c) => c.name);

    const details = [
        ["Status", film.status],
        [type === "tv" ? "First aired" : "Released", longDate(date)],
        ["Original language", film.original_language && safe(languageName, film.original_language)],
        [countries.length > 1 ? "Countries" : "Country", countries.join(", ")],
        [type === "tv" ? "Episode length" : "Runtime", type === "tv" ? film.episode_run_time?.[0] && `${film.episode_run_time[0]} min` : hoursAndMinutes(film.runtime)],
        type === "tv" && ["Seasons", film.number_of_seasons],
        type === "tv" && ["Episodes", film.number_of_episodes],
    ].filter((row) => row && row[1]);

    return (
        <article className="pb-12">
            {/* Backdrop header */}
            <div className="relative h-[42vh] min-h-[300px] max-h-[640px] overflow-hidden lg:h-[64vh]" aria-hidden="true">
                {film.backdrop_path && (
                    <img
                        src={`https://image.tmdb.org/t/p/w1280${film.backdrop_path}`}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(var(--booth))_0%,rgb(var(--booth)/0.55)_45%,rgb(var(--booth)/0.15)_100%)]" />
            </div>

            {/* Lobby card */}
            <div className="page-x relative mx-auto -mt-48 flex max-w-content flex-col gap-6 sm:-mt-56 lg:-mt-72 lg:flex-row lg:items-end lg:gap-10">
                <div
                    ref={posterRef}
                    className="grain relative aspect-[2/3] w-[160px] shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(var(--reel)/0.5)] sm:w-[200px] lg:w-[280px] lg:translate-y-24"
                >
                    {film.poster_path && (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
                            alt={`Poster for ${title}`}
                            onLoad={() => setPosterLoaded(true)}
                            className={`fade-img h-full w-full object-cover ${posterLoaded ? "is-loaded" : ""}`}
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="break-words text-[39px] font-extrabold leading-[0.95] tracking-[-0.01em] sm:text-[61px] lg:text-[76px]">
                        {title}
                    </h1>
                    <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-grain">
                        {year && <span>{year}</span>}
                        {runtime && <span>{runtime}</span>}
                        {type === "tv" && film.number_of_seasons && (
                            <span>
                                {film.number_of_seasons} {film.number_of_seasons === 1 ? "season" : "seasons"}
                            </span>
                        )}
                        {certification && (
                            <span className="rounded-[3px] border border-reel px-1.5 text-[13px] leading-6">
                                {certification}
                            </span>
                        )}
                        {genres.length > 0 && <span>{genres.join(", ")}</span>}
                    </p>
                    <CreditLine film={film} type={type} />

                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                        {rating !== null ? (
                            <>
                                <span className="font-display text-[49px] font-extrabold leading-none tabular-nums text-beam">
                                    {rating.toFixed(1)}
                                </span>
                                <span className="flex flex-col gap-1.5">
                                    <RatingBar value={rating} />
                                    <span className="text-[13px] text-grain">
                                        from {film.vote_count.toLocaleString()} TMDB ratings
                                    </span>
                                </span>
                                <span className="sr-only">Rated {rating.toFixed(1)} out of 10</span>
                            </>
                        ) : (
                            <span className="text-grain">Not rated yet</span>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {loggedIn ? (
                            <button
                                ref={addRef}
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setPicker((o) => !o)}
                                aria-expanded={picker}
                            >
                                <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                                Add to list
                                <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-quick ${picker ? "rotate-180" : ""}`} aria-hidden="true"></i>
                            </button>
                        ) : (
                            <Link to={loginPath(location, "add")} className="btn btn-primary">
                                Log in to save
                            </Link>
                        )}
                        <WatchedButton type={type === "tv" ? "tv" : "movie"} id={film.id} title={title} />
                        {trailer && (
                            <button type="button" className="btn btn-secondary" onClick={() => setTrailerOpen(true)}>
                                <i className="fa-solid fa-play text-sm" aria-hidden="true"></i>
                                Trailer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Synopsis and details */}
            <div className="page-x mx-auto mt-10 grid max-w-content gap-10 lg:mt-36 lg:grid-cols-[280px_1fr] lg:gap-10">
                <div className="hidden lg:block" />
                <div className="space-y-10">
                    <p className="max-w-[68ch] text-lg leading-relaxed">{film.overview || "No synopsis yet."}</p>
                    <WhereToWatch data={film["watch/providers"]} />
                    {type === "tv" && <Seasons tvId={film.id} seasons={film.seasons} />}
                    {details.length > 0 && (
                        <section aria-labelledby="details-title">
                            <h2 id="details-title" className="text-[25px] font-semibold md:text-[31px]">
                                Details
                            </h2>
                            <dl className="mt-4 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                                {details.map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-[13px] text-grain">{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}
                    <Keywords film={film} type={type} />
                </div>
            </div>

            <div className="mt-6">
                <CastRow cast={(film.credits?.cast || []).slice(0, 12)} />
                {more.length > 0 && (
                    <CardRow title="More like this">
                        {more.map((item) => (
                            <SmallCard key={item.id} data={item} type={type === "tv" ? "tv" : "movie"} morph />
                        ))}
                    </CardRow>
                )}
            </div>

            {loggedIn && (
                <ListPicker
                    anchorRef={addRef}
                    open={picker}
                    onClose={() => setPicker(false)}
                    id={film.id}
                    type={type === "tv" ? "tv" : "movie"}
                    title={title}
                />
            )}

            {trailer && (
                <Dialog open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`${title} trailer`} variant="media">
                    <div className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-booth">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
                            title={`${title} trailer`}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                            className="absolute inset-0 h-full w-full"
                        />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button type="button" className="btn btn-secondary bg-booth" onClick={() => setTrailerOpen(false)}>
                            Close
                        </button>
                    </div>
                </Dialog>
            )}
        </article>
    );
}
