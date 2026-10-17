import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPerson } from "../movie/allFetcher";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import Loading from "../static/loading";
import { LoadError } from "../static/resilience";
import { initialsOf } from "../static/avatar";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

const longDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

// An actor or director: who they are, then their films, most popular first.
export default function Person() {
    const { id } = useParams();
    const [person, setPerson] = useState(undefined);
    const [expanded, setExpanded] = useState(false);
    const [filter, setFilter] = useState("all");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let alive = true;
        setPerson(undefined);
        fetchPerson(id).then((data) => alive && setPerson(data?.id ? data : null));
        return () => {
            alive = false;
        };
    }, [id, attempt]);

    useEffect(() => {
        if (person?.name) document.title = `${person.name} – ${brand}`;
    }, [person?.name]);

    const directing = person?.known_for_department === "Directing";
    const films = useMemo(() => {
        if (!person) return [];
        const credits = person.combined_credits || {};
        const pool = [
            ...(credits.cast || []),
            ...(credits.crew || []).filter((c) => c.job === "Director"),
        ];
        const seen = new Set();
        return pool
            .filter((c) => (c.media_type === "movie" || c.media_type === "tv") && c.poster_path)
            // Talk shows and award ceremonies list hundreds of guest spots; keep real roles.
            .filter((c) => !(c.media_type === "tv" && (c.episode_count || 0) < 2 && c.character?.match(/self|host|guest/i)))
            .filter((c) => {
                const key = `${c.media_type}:${c.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }, [person]);

    if (person === undefined) return <Loading />;
    if (person === null) {
        return (
            <div className="page">
                <LoadError
                    message="This person couldn’t be loaded. Check your connection, or try again."
                    onRetry={() => setAttempt((n) => n + 1)}
                />
            </div>
        );
    }

    const shown = films.filter((f) => filter === "all" || f.media_type === filter);
    const bio = person.biography || "";
    const born = [longDate(person.birthday), person.place_of_birth].filter(Boolean).join(", in ");

    return (
        <div className="page">
            <header className="flex flex-col gap-8 sm:flex-row sm:items-end">
                {person.profile_path ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                        alt={person.name}
                        width="200"
                        height="300"
                        className="grain aspect-[2/3] w-[160px] shrink-0 rounded-[3px] object-cover sm:w-[200px]"
                    />
                ) : (
                    <span className="grid aspect-[2/3] w-[160px] place-items-center rounded-[3px] bg-leader font-display text-[61px] font-extrabold text-grain sm:w-[200px]">
                        {initialsOf(person.name)}
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="page-title">{person.name}</h1>
                    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-grain">
                        {person.known_for_department && <span>{directing ? "Director" : person.known_for_department === "Acting" ? "Actor" : person.known_for_department}</span>}
                        {born && <span>Born {born}</span>}
                        {person.deathday && <span>Died {longDate(person.deathday)}</span>}
                    </p>
                </div>
            </header>

            {bio && (
                <div className="mt-8 max-w-[68ch]">
                    <p className={`whitespace-pre-line text-lg leading-relaxed ${expanded ? "" : "line-clamp-4"}`}>{bio}</p>
                    {bio.length > 400 && (
                        <button type="button" className="btn btn-text -ml-2 mt-1" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>
            )}

            <section aria-labelledby="films-title" className="mt-12">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 id="films-title" className="text-[25px] font-semibold md:text-[31px]">
                        Known for
                    </h2>
                    <div className="flex items-center gap-1" role="group" aria-label="Show">
                        {[
                            ["all", "All"],
                            ["movie", "Movies"],
                            ["tv", "TV shows"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={filter === key}
                                onClick={() => setFilter(key)}
                                className={`btn btn-text min-h-[40px] ${filter === key ? "text-screen underline decoration-beam decoration-2 underline-offset-8" : ""}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-6">
                    {shown.length ? (
                        <CardGrid>
                            {shown.map((film) => (
                                <SmallCard key={`${film.media_type}-${film.id}`} data={film} type={film.media_type} />
                            ))}
                        </CardGrid>
                    ) : (
                        <p className="text-grain">No titles to show.</p>
                    )}
                </div>
                <Link
                    to={`/discover?${directing ? "" : `cast=${person.id}&castName=${encodeURIComponent(person.name)}`}`}
                    className={`btn btn-secondary mt-10 ${directing ? "hidden" : ""}`}
                >
                    Filter more films with {person.name}
                </Link>
            </section>
        </div>
    );
}
