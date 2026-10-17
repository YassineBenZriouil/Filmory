import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSeason } from "../movie/allFetcher";
import { getRegion, getServices, regionName } from "../static/prefs";

const GROUPS = [
    ["flatrate", "Stream"],
    ["free", "Free"],
    ["ads", "Free with ads"],
    ["rent", "Rent"],
    ["buy", "Buy"],
];

// Where to watch in the viewer's region, from TMDB's JustWatch data.
export function WhereToWatch({ data }) {
    const region = getRegion();
    const mine = new Set(getServices(region));
    const local = data?.results?.[region];
    const groups = GROUPS.map(([key, label]) => [label, local?.[key] || []]).filter(([, list]) => list.length);

    return (
        <section aria-labelledby="watch-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id="watch-title" className="text-[25px] font-semibold md:text-[31px]">
                    Where to watch
                </h2>
                <p className="text-[13px] text-grain">
                    In {regionName(region)}{" "}
                    <Link to="/profile#region" className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">
                        Change region
                    </Link>
                </p>
            </div>
            {groups.length ? (
                <div className="mt-4 space-y-4">
                    {groups.map(([label, list]) => (
                        <div key={label} className="flex flex-wrap items-center gap-3">
                            <span className="w-24 shrink-0 text-[13px] text-grain">{label}</span>
                            <ul className="flex flex-wrap gap-2">
                                {list.map((p) => (
                                    <li key={p.provider_id}>
                                        <a
                                            href={local.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            title={`${label} on ${p.provider_name}`}
                                            className={`group relative block rounded-[8px] ${
                                                mine.has(p.provider_id) ? "shadow-[0_0_0_2px_rgb(var(--beam))]" : ""
                                            }`}
                                        >
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                                alt={`${label} on ${p.provider_name}`}
                                                width="44"
                                                height="44"
                                                loading="lazy"
                                                className="h-11 w-11 rounded-[8px] object-cover transition-transform duration-quick group-hover:-translate-y-0.5"
                                            />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {mine.size > 0 && groups.some(([, list]) => list.some((p) => mine.has(p.provider_id))) && (
                        <p className="text-[13px] text-grain">Outlined: services you have.</p>
                    )}
                </div>
            ) : (
                <p className="mt-3 text-grain">Not available to stream, rent or buy in {regionName(region)} right now.</p>
            )}
            <p className="mt-4 text-[13px] text-grain">Streaming data from JustWatch.</p>
        </section>
    );
}

// "Directed by …. Written by …." (movies) or "Created by …." (series).
export function CreditLine({ film, type }) {
    const crew = film.credits?.crew || [];
    const names = (jobs) => [...new Set(crew.filter((c) => jobs.includes(c.job)).map((c) => c.name))];
    const people = (list) =>
        list.slice(0, 3).map((name, i) => {
            const person = crew.find((c) => c.name === name) || (film.created_by || []).find((c) => c.name === name);
            return (
                <React.Fragment key={name}>
                    {i > 0 && (i === list.length - 1 ? " and " : ", ")}
                    {person ? (
                        <Link to={`/person/${person.id}`} className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">
                            {name}
                        </Link>
                    ) : (
                        name
                    )}
                </React.Fragment>
            );
        });

    if (type === "tv") {
        const creators = (film.created_by || []).map((c) => c.name);
        if (!creators.length) return null;
        return <p className="mt-4 text-grain">Created by {people(creators)}.</p>;
    }
    const directors = names(["Director"]);
    const writers = names(["Screenplay", "Writer", "Story"]).filter((n) => !directors.includes(n));
    if (!directors.length && !writers.length) return null;
    return (
        <p className="mt-4 max-w-[68ch] text-grain">
            {directors.length > 0 && <>Directed by {people(directors)}. </>}
            {writers.length > 0 && <>Written by {people(writers)}.</>}
        </p>
    );
}

export function Keywords({ film, type }) {
    const list = (type === "tv" ? film.keywords?.results : film.keywords?.keywords) || [];
    if (!list.length) return null;
    return (
        <section aria-labelledby="keywords-title">
            <h2 id="keywords-title" className="text-[25px] font-semibold md:text-[31px]">
                Keywords
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
                {list.slice(0, 12).map((k) => (
                    <li key={k.id}>
                        <Link
                            to={`/discover?type=${type}&keywords=${k.id}&keywordName=${encodeURIComponent(k.name)}`}
                            className="inline-flex min-h-[36px] items-center rounded-full border border-reel px-3 text-[13px] text-grain transition-colors duration-quick hover:border-grain hover:text-screen"
                        >
                            {k.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// Season picker and episode list for series.
export function Seasons({ tvId, seasons }) {
    const real = (seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0);
    const options = real.length ? real : seasons || [];
    const [number, setNumber] = useState(options[0]?.season_number);
    const [season, setSeason] = useState(undefined);
    const [showAll, setShowAll] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (number === undefined) return;
        let alive = true;
        setSeason(undefined);
        setShowAll(false);
        fetchSeason(tvId, number).then((data) => alive && setSeason(data));
        return () => {
            alive = false;
        };
    }, [tvId, number, attempt]);

    if (!options.length) return null;
    const episodes = season?.episodes || [];
    const visible = showAll ? episodes : episodes.slice(0, 6);

    return (
        <section aria-labelledby="seasons-title">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="seasons-title" className="text-[25px] font-semibold md:text-[31px]">
                    Episodes
                </h2>
                {options.length > 1 && (
                    <label className="flex items-center gap-2 text-[13px] text-grain">
                        Season
                        <select
                            value={number}
                            onChange={(e) => setNumber(Number(e.target.value))}
                            className="field min-h-[40px] w-auto cursor-pointer text-base"
                        >
                            {options.map((s) => (
                                <option key={s.id} value={s.season_number}>
                                    {s.name} ({s.episode_count})
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {season === undefined ? (
                <div className="mt-4 space-y-3" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="skeleton h-16 rounded-[6px]" />
                    ))}
                </div>
            ) : season === null ? (
                <div className="mt-4 flex items-center gap-4 text-grain">
                    <p>This season didn’t load.</p>
                    <button type="button" className="btn btn-secondary" onClick={() => setAttempt((n) => n + 1)}>
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <ol className="mt-4 divide-y divide-reel border-y border-reel">
                        {visible.map((ep) => (
                            <li key={ep.id} className="grid grid-cols-[3ch_1fr] gap-x-4 py-4 sm:grid-cols-[3ch_1fr_auto]">
                                <span className="font-display text-xl font-extrabold tabular-nums text-grain">{ep.episode_number}</span>
                                <div className="min-w-0">
                                    <p className="font-bold">{ep.name}</p>
                                    {ep.overview && <p className="mt-1 line-clamp-2 max-w-[68ch] text-grain">{ep.overview}</p>}
                                </div>
                                <p className="col-start-2 mt-1 text-[13px] text-grain sm:col-start-3 sm:mt-0 sm:text-right">
                                    {[ep.air_date && new Date(ep.air_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), ep.runtime && `${ep.runtime} min`]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            </li>
                        ))}
                    </ol>
                    {episodes.length > 6 && (
                        <button type="button" className="btn btn-text -ml-2 mt-3" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                            {showAll ? "Show fewer episodes" : `Show all ${episodes.length} episodes`}
                        </button>
                    )}
                </>
            )}
        </section>
    );
}
