import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { searchTitles } from "../movie/allFetcher";
import { addMovieToList } from "../movie/databaseFetcher";
import { invalidateUserLists } from "../movie/listsStore";
import { customToast } from "../static/toast";
import { useMediaQuery } from "../static/hooks";

const MAX = 8;
const EASE_OUT = [0.2, 0.8, 0.2, 1];

// Other screens open the search in "add films to this list" mode with this event.
export const openAddFilms = (list) =>
    window.dispatchEvent(new CustomEvent("filmory:add-films", { detail: list }));
export const LIST_CHANGED = "filmory:list-changed";

function Highlight({ text, query }) {
    const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (!query.trim() || i < 0) return text;
    const end = i + query.trim().length;
    return (
        <>
            {text.slice(0, i)}
            <strong className="font-bold text-screen">{text.slice(i, end)}</strong>
            {text.slice(end)}
        </>
    );
}

export default function Search() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const desktop = useMediaQuery("(min-width: 768px)");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("idle"); // idle | loading | done | error
    const [open, setOpen] = useState(false); // results panel
    const [expanded, setExpanded] = useState(false); // mobile overlay
    const [active, setActive] = useState(-1);
    const [addTarget, setAddTarget] = useState(null); // { id, listName }
    const [added, setAdded] = useState([]);
    const inputRef = useRef(null);
    const rootRef = useRef(null);

    const close = useCallback(() => {
        setOpen(false);
        setExpanded(false);
        setActive(-1);
        setAddTarget(null);
        setAdded([]);
    }, []);

    // Close on navigation.
    useEffect(() => close(), [pathname, close]);

    // Debounced search; stale responses are aborted.
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setResults([]);
            setStatus("idle");
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setStatus("loading");
            try {
                const { results: found } = await searchTitles(q, { signal: controller.signal });
                setResults(found.slice(0, MAX));
                setStatus("done");
                setActive(-1);
            } catch (error) {
                if (error.name !== "AbortError") setStatus("error");
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    // "/" or Ctrl/⌘+K focuses search from anywhere.
    useEffect(() => {
        const onKey = (e) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
            if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
                e.preventDefault();
                setExpanded(true);
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    // Add-films mode, opened from a list page.
    useEffect(() => {
        const onAdd = (e) => {
            setAddTarget(e.detail);
            setAdded([]);
            setExpanded(true);
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
        };
        window.addEventListener("filmory:add-films", onAdd);
        return () => window.removeEventListener("filmory:add-films", onAdd);
    }, []);

    // Outside click closes.
    useEffect(() => {
        if (!open && !expanded) return;
        const onDown = (e) => !rootRef.current?.contains(e.target) && close();
        document.addEventListener("pointerdown", onDown);
        return () => document.removeEventListener("pointerdown", onDown);
    }, [open, expanded, close]);

    // Group movies first, then series; keyboard order follows the visual order.
    const groups = useMemo(() => {
        const movies = results.filter((r) => r.media_type === "movie");
        const tv = results.filter((r) => r.media_type === "tv");
        return [
            { label: "Movies", items: movies },
            { label: "TV shows", items: tv },
        ].filter((g) => g.items.length);
    }, [results]);
    const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
    const options = addTarget ? flat.length : flat.length + 1; // + "See all results"

    const choose = async (index) => {
        if (index === flat.length) {
            navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
            return;
        }
        const item = flat[index];
        if (!item) return;
        if (!addTarget) {
            navigate(`/movieDetails/${item.id}/${item.media_type}`);
            return;
        }
        const name = item.title || item.name;
        try {
            await addMovieToList(addTarget.id, item.id, item.media_type);
            invalidateUserLists();
            setAdded((a) => [...a, `${item.media_type}:${item.id}`]);
            window.dispatchEvent(new CustomEvent(LIST_CHANGED, { detail: { id: addTarget.id } }));
            customToast(`Added ${name} to ${addTarget.listName}`, "success");
        } catch (error) {
            console.error("Error adding to list:", error);
            customToast(`Couldn’t add ${name}. Try again.`, "error");
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => (a + 1) % Math.max(options, 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? options - 1 : a - 1));
        } else if (e.key === "Enter") {
            if (active >= 0) {
                e.preventDefault();
                choose(active);
            } else if (query.trim() && !addTarget) {
                e.preventDefault();
                choose(flat.length);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (query) setQuery("");
            else {
                close();
                inputRef.current?.blur();
            }
        }
    };

    const showPanel = open && (query.trim() || addTarget);
    const optionId = (i) => `search-option-${i}`;

    const field = (
        <div className={`relative ${status === "loading" ? "search-loading" : ""} overflow-hidden rounded-[6px]`}>
            <i
                className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-grain"
                aria-hidden="true"
            ></i>
            <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={addTarget ? `Find a film to add` : "Search films and series"}
                role="combobox"
                aria-expanded={!!showPanel}
                aria-controls="search-listbox"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                aria-label="Search films and series"
                className="field min-h-[40px] border-transparent bg-leader pl-9 pr-10 transition-[border-color] [&::-webkit-search-cancel-button]:hidden"
            />
            {!query && desktop && !addTarget && (
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[4px] border border-reel px-1.5 font-body text-[13px] leading-5 text-grain">
                    /
                </kbd>
            )}
            {query && (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                        setQuery("");
                        inputRef.current?.focus();
                    }}
                    className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] text-grain hover:text-screen"
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            )}
        </div>
    );

    let index = -1;
    const panel = (
        <AnimatePresence>
            {showPanel && (
                <motion.div
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-reel bg-leader md:left-auto md:w-[420px]"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.16 } }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                    {addTarget && (
                        <div className="flex items-center justify-between gap-3 border-b border-reel px-4 py-2.5">
                            <p className="min-w-0 truncate text-[13px] text-grain">
                                Adding to <span className="font-bold text-screen">{addTarget.listName}</span>
                            </p>
                            <button type="button" className="btn btn-text min-h-[32px] px-2 text-[13px]" onClick={close}>
                                Done
                            </button>
                        </div>
                    )}
                    <ul id="search-listbox" role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto p-1.5">
                        {status === "error" && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Search isn’t responding. Check your connection and try again.
                            </li>
                        )}
                        {status === "done" && !flat.length && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Nothing found for “{query.trim()}”. Try the original title.
                            </li>
                        )}
                        {addTarget && !query.trim() && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Type a title to find it.
                            </li>
                        )}
                        {groups.map((group) => (
                            <li key={group.label} role="presentation">
                                <p className="px-3 pb-1 pt-2 text-[13px] text-grain" aria-hidden="true">
                                    {group.label}
                                </p>
                                <ul role="group" aria-label={group.label}>
                                    {group.items.map((item) => {
                                        index += 1;
                                        const i = index;
                                        const name = item.title || item.name;
                                        const year = (item.release_date || item.first_air_date || "").slice(0, 4);
                                        const isAdded = added.includes(`${item.media_type}:${item.id}`);
                                        return (
                                            <motion.li
                                                key={`${item.media_type}-${item.id}`}
                                                id={optionId(i)}
                                                role="option"
                                                aria-selected={active === i}
                                                onMouseEnter={() => setActive(i)}
                                                onClick={() => choose(i)}
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.015, duration: 0.2 }}
                                                className="relative flex cursor-pointer items-center gap-3 rounded-[8px] px-2 py-1.5"
                                            >
                                                {active === i && (
                                                    <motion.span
                                                        layoutId="search-highlight"
                                                        className="absolute inset-0 rounded-[8px] bg-reel/70"
                                                        transition={{ duration: 0.18, ease: EASE_OUT }}
                                                    />
                                                )}
                                                {item.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                                        alt=""
                                                        loading="lazy"
                                                        width="46"
                                                        height="69"
                                                        className="grain relative h-[69px] w-[46px] shrink-0 rounded-[3px] object-cover"
                                                    />
                                                ) : (
                                                    <span className="grain relative h-[69px] w-[46px] shrink-0 rounded-[3px]" />
                                                )}
                                                <span className="relative min-w-0 flex-1">
                                                    <span className="block truncate text-grain">
                                                        <Highlight text={name} query={query} />
                                                    </span>
                                                    <span className="block text-[13px] text-grain">
                                                        {[year, item.media_type === "tv" ? "TV show" : "Movie"].filter(Boolean).join(", ")}
                                                    </span>
                                                </span>
                                                {addTarget && (
                                                    <span className={`relative shrink-0 text-[13px] ${isAdded ? "text-house" : "text-grain"}`}>
                                                        {isAdded ? (
                                                            <>
                                                                <i className="fa-solid fa-check" aria-hidden="true"></i> Added
                                                            </>
                                                        ) : (
                                                            "Add"
                                                        )}
                                                    </span>
                                                )}
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                        {!addTarget && query.trim() && (
                            <li
                                id={optionId(flat.length)}
                                role="option"
                                aria-selected={active === flat.length}
                                onMouseEnter={() => setActive(flat.length)}
                                onClick={() => choose(flat.length)}
                                className="relative mt-1 cursor-pointer rounded-[8px] border-t border-reel px-3 py-3 text-screen"
                            >
                                {active === flat.length && (
                                    <motion.span
                                        layoutId="search-highlight"
                                        className="absolute inset-0 rounded-[8px] bg-reel/70"
                                        transition={{ duration: 0.18, ease: EASE_OUT }}
                                    />
                                )}
                                <span className="relative">See all results for “{query.trim()}”</span>
                            </li>
                        )}
                    </ul>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (desktop) {
        return (
            <div ref={rootRef} className="relative w-[200px] transition-[width] duration-move ease-out focus-within:w-[360px] lg:w-[240px] lg:focus-within:w-[360px]">
                {field}
                {panel}
            </div>
        );
    }

    return (
        <div ref={rootRef}>
            <button
                type="button"
                aria-label="Search films and series"
                className="btn btn-icon btn-text"
                onClick={() => {
                    setExpanded(true);
                    setOpen(true);
                    requestAnimationFrame(() => inputRef.current?.focus());
                }}
            >
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="page-x fixed inset-x-0 top-0 z-50 border-b border-reel bg-booth py-3"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: EASE_OUT }}
                    >
                        <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                {field}
                                {panel}
                            </div>
                            <button type="button" className="btn btn-text px-2" onClick={close}>
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
