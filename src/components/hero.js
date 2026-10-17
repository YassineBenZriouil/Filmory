import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ListPicker from "./listPicker";
import { fetchMovieGeneres } from "../movie/allFetcher";

const SLIDE_MS = 7000;
const EASE_OUT = [0.2, 0.8, 0.2, 1];

// Five popular films, one at a time, full-bleed. Autoplay pauses on hover, focus
// and hidden tabs; the progress bar pauses with it.
export default function Hero({ movies }) {
    const slides = (movies || []).filter((m) => m.backdrop_path).slice(0, 5);
    const reduce = useReducedMotion();
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const [genres, setGenres] = useState({});
    const [picker, setPicker] = useState(false);
    const addRef = useRef(null);
    const swipe = useRef(null);
    const count = slides.length;

    useEffect(() => {
        fetchMovieGeneres().then((list) =>
            setGenres(Object.fromEntries(list.map((g) => [g.id, g.name])))
        );
        const onVis = () => setHidden(document.hidden);
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    const go = (next) => {
        setIndex(((next % count) + count) % count);
        setProgress(0);
    };

    // Progress accumulates only while playing, so pausing freezes the bar.
    useEffect(() => {
        if (!count || reduce || paused || hidden || picker) return;
        let last = performance.now();
        let frame;
        const tick = (now) => {
            setProgress((p) => {
                const next = p + (now - last) / SLIDE_MS;
                return next >= 1 ? 1 : next;
            });
            last = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [count, reduce, paused, hidden, picker]);

    useEffect(() => {
        if (progress >= 1) go(index + 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress]);

    if (!count) {
        return <div className="skeleton h-[72vh] max-h-[760px] min-h-[480px] w-full" aria-hidden="true" />;
    }

    const movie = slides[index];
    const year = movie.release_date?.slice(0, 4);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const genreNames = (movie.genre_ids || []).map((id) => genres[id]).filter(Boolean).slice(0, 2);

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Featured films"
            className="relative h-[64vh] max-h-[760px] min-h-[480px] overflow-hidden bg-booth sm:h-[72vh]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
            onKeyDown={(e) => {
                if (e.target.tagName === "INPUT") return;
                if (e.key === "ArrowRight") go(index + 1);
                if (e.key === "ArrowLeft") go(index - 1);
            }}
            onPointerDown={(e) => (swipe.current = e.pointerType === "touch" ? e.clientX : null)}
            onPointerUp={(e) => {
                if (swipe.current === null) return;
                const dx = e.clientX - swipe.current;
                if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
                swipe.current = null;
            }}
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key={movie.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.84, ease: [0.65, 0, 0.35, 1] }}
                    aria-hidden="true"
                >
                    <motion.img
                        src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                        alt=""
                        className="h-full w-full object-cover"
                        initial={{ scale: 1 }}
                        animate={{ scale: reduce ? 1 : 1.06 }}
                        transition={{ duration: SLIDE_MS / 1000 + 1, ease: "linear" }}
                    />
                </motion.div>
            </AnimatePresence>
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,rgb(var(--booth))_0%,rgb(var(--booth)/0.6)_30%,transparent_65%),linear-gradient(to_right,rgb(var(--booth)/0.85)_0%,rgb(var(--booth)/0.3)_45%,transparent_70%)]"
            />

            <div className="page-x relative mx-auto flex h-full max-w-[1464px] items-end pb-10 md:pb-14">
                <div className="w-full">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={movie.id}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${count}`}
                            className="max-w-[60ch]"
                            initial="in"
                            animate="shown"
                            exit="out"
                            variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
                        >
                            {[
                                <h2 key="t" className="text-[39px] font-extrabold leading-[0.95] tracking-[-0.01em] sm:text-[61px] lg:text-[76px]">
                                    {movie.title}
                                </h2>,
                                <p key="m" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-grain">
                                    {year && <span>{year}</span>}
                                    {rating && (
                                        <span className="font-display text-xl font-extrabold leading-none text-beam">
                                            {rating}
                                        </span>
                                    )}
                                    {genreNames.length > 0 && <span>{genreNames.join(", ")}</span>}
                                </p>,
                                <p key="o" className="mt-3 hidden text-screen/90 sm:line-clamp-2">
                                    {movie.overview}
                                </p>,
                                <div key="b" className="mt-6 flex flex-wrap gap-3">
                                    <Link to={`/movieDetails/${movie.id}/movie`} className="btn btn-primary">
                                        View film
                                    </Link>
                                    <button
                                        ref={addRef}
                                        type="button"
                                        className="btn btn-secondary hidden bg-booth/40 sm:inline-flex"
                                        onClick={() => setPicker((o) => !o)}
                                        aria-expanded={picker}
                                    >
                                        <i className="fa-solid fa-plus text-sm" aria-hidden="true"></i>
                                        Add to list
                                    </button>
                                </div>,
                            ].map((child) => (
                                <motion.div
                                    key={child.key}
                                    variants={{
                                        in: { opacity: 0, y: 8 },
                                        shown: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
                                        out: { opacity: 0, y: -8, transition: { duration: 0.2 } },
                                    }}
                                >
                                    {child}
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="absolute bottom-10 right-4 hidden items-center gap-4 md:right-8 md:bottom-14 md:flex xl:right-[72px]">
                    <div className="flex gap-1.5">
                        {slides.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => go(i)}
                                aria-label={`Show slide ${i + 1}: ${s.title}`}
                                aria-current={i === index ? "true" : undefined}
                                className="group flex h-6 items-center"
                            >
                                <span className="relative block h-1 w-8 overflow-hidden rounded-full bg-screen/25 transition-colors duration-quick group-hover:bg-screen/40">
                                    <span
                                        className="absolute inset-y-0 left-0 bg-beam"
                                        style={{ width: i < index ? "100%" : i === index ? `${(reduce ? 1 : progress) * 100}%` : "0%" }}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                    <span className="font-display text-lg font-extrabold tabular-nums text-grain">
                        {index + 1} / {count}
                    </span>
                </div>
            </div>

            <ListPicker
                anchorRef={addRef}
                open={picker}
                onClose={() => setPicker(false)}
                id={movie.id}
                type="movie"
                title={movie.title}
            />
        </section>
    );
}
