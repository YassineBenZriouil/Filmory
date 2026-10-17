import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { fetchBrowsePage } from "../movie/allFetcher";
import { SkeletonGrid } from "../static/loading";
import { prefersReducedMotion } from "../static/hooks";
import { LoadError } from "../static/resilience";

const COPY = {
    movie: { title: "Movies", noun: "movies" },
    tv: { title: "TV shows", noun: "TV shows" },
};

// 1 … 4 5 [6] 7 8 … 500
const pageWindow = (page, total) => {
    const pages = new Set([1, total]);
    for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= total) pages.add(p);
    const sorted = [...pages].sort((a, b) => a - b);
    return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ["gap" + p, p] : [p]));
};

export function Pager({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    return (
        <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-center gap-1">
            <button
                type="button"
                className="btn btn-text"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
            >
                <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true"></i>
                Previous
            </button>
            <ol className="flex flex-wrap items-center">
                {pageWindow(page, totalPages).map((p) =>
                    typeof p === "string" ? (
                        <li key={p} className="px-1 text-grain" aria-hidden="true">
                            …
                        </li>
                    ) : (
                        <li key={p} className="relative">
                            <button
                                type="button"
                                onClick={() => onChange(p)}
                                aria-current={p === page ? "page" : undefined}
                                aria-label={`Page ${p}`}
                                className={`grid h-11 min-w-[44px] place-items-center px-2 font-display text-xl font-extrabold tabular-nums transition-colors duration-quick ${
                                    p === page ? "text-screen" : "text-grain hover:text-screen"
                                }`}
                            >
                                {p}
                            </button>
                            {p === page && (
                                <motion.span
                                    layoutId="page-rule"
                                    className="absolute inset-x-2 bottom-1 h-0.5 bg-beam"
                                    transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }}
                                />
                            )}
                        </li>
                    )
                )}
            </ol>
            <button
                type="button"
                className="btn btn-text"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
            >
                Next
                <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true"></i>
            </button>
        </nav>
    );
}

export default function Browse({ type }) {
    const [params, setParams] = useSearchParams();
    const page = Math.max(1, parseInt(params.get("page"), 10) || 1);
    const [data, setData] = useState(null); // { page, results, totalPages }
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const titleRef = useRef(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        fetchBrowsePage(type, page).then((res) => {
            if (!alive) return;
            if (res) setData({ page, ...res });
            setLoading(false);
        });
        return () => {
            alive = false;
        };
    }, [type, page, attempt]);

    const changePage = (next) => {
        setParams(next === 1 ? {} : { page: String(next) });
        titleRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };

    const { title, noun } = COPY[type];
    return (
        <div className="page">
            <h1 ref={titleRef} className="page-title scroll-mt-24">
                {title}
            </h1>
            <p className="mt-2 text-grain">Most popular on TMDB this week</p>
            <div className="mt-8">
                {!data ? (
                    loading ? (
                        <SkeletonGrid />
                    ) : (
                        <LoadError
                            message={`Couldn’t load ${noun}. Check your connection, then try again.`}
                            onRetry={() => setAttempt((n) => n + 1)}
                        />
                    )
                ) : (
                    <motion.div
                        key={data.page}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loading ? 0.4 : 1 }}
                        transition={{ duration: loading ? 0.16 : 0.28 }}
                        aria-busy={loading}
                    >
                        <CardGrid>
                            {data.results.map((item) => (
                                <SmallCard key={item.id} data={item} type={type} />
                            ))}
                        </CardGrid>
                    </motion.div>
                )}
            </div>
            {data && <Pager page={page} totalPages={data.totalPages} onChange={changePage} />}
        </div>
    );
}
