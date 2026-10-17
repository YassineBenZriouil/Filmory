import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { searchTitles } from "../movie/allFetcher";
import { invalidateUserLists } from "../movie/listsStore";
import { customToast } from "../static/toast";
import { useMediaQuery } from "../static/hooks";
import { initialsOf } from "../static/avatar";
import {
    addRecentSearch,
    clearRecentSearches,
    getRecentSearches,
    getRecentlyViewed,
} from "../static/prefs";

const MAX = 8;
const EASE_OUT = [0.2, 0.8, 0.2, 1];

// Other screens open the search in "add films to this list" mode with this event.
export const openAddFilms = (list) =>
    window.dispatchEvent(new CustomEvent("filmory:add-films", { detail: list }));
export const LIST_CHANGED = "filmory:list-changed";

// Accents and punctuation removed: "Amélie!" → "amelie".
const normalise = (q) =>
    q
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

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

function Thumb({ path, round, name }) {
    const shape = round ? "h-12 w-12 rounded-full" : "h-[69px] w-[46px] rounded-[3px]";
    if (!path) {
        return (
            <span className={`grain relative grid shrink-0 place-items-center font-display font-extrabold text-grain ${shape}`}>
                {round ? initialsOf(name) : ""}
            </span>
        );
    }
    return (
        <img
            src={`https://image.tmdb.org/t/p/w92${path}`}
            alt=""
            loading="lazy"
            width={round ? 48 : 46}
            height={round ? 48 : 69}
            className={`grain relative shrink-0 object-cover ${shape}`}
        />
    );
}

export default function Search() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const desktop = useMediaQuery("(min-width: 768px)");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [correctedTo, setCorrectedTo] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | loading | done | error
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false); // mobile overlay
    const [active, setActive] = useState(-1);
    const [addTarget, setAddTarget] = useState(null); // { id, listName }
    const [added, setAdded] = useState([]);
    const [recents, setRecents] = useState(getRecentSearches);
    const [viewed, setViewed] = useState(getRecentlyViewed);
    const inputRef = useRef(null);
    const rootRef = useRef(null);

    const close = useCallback(() => {
        setOpen(false);
        setExpanded(false);
        setActive(-1);
        setAddTarget(null);
        setAdded([]);
    }, []);

    useEffect(() => close(), [pathname, close]);

    // Debounced search; stale requests are aborted. If nothing matches, retry once
    // without accents and punctuation before giving up.
    useEffect(() => {
        const q = query.trim();
        setActive(-1);
        if (!q) {
            setResults([]);
            setCorrectedTo(null);
            setStatus("idle");
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setStatus("loading");
            try {
                const people = !addTarget;
                let { results: found } = await searchTitles(q, { signal: controller.signal, people });
                let corrected = null;
                const simpler = normalise(q);
                if (!found.length && simpler && simpler.toLowerCase() !== q.toLowerCase()) {
                    ({ results: found } = await searchTitles(simpler, { signal: controller.signal, people }));
                    if (found.length) corrected = simpler;
                }
                setResults(found.slice(0, MAX));
                setCorrectedTo(corrected);
                setStatus("done");
            } catch (error) {
                if (error.name !== "AbortError") setStatus("error");
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, addTarget]);

    const focusSearch = useCallback(() => {
        setRecents(getRecentSearches());
        setViewed(getRecentlyViewed());
        setExpanded(true);
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    // "/" or Ctrl/⌘+K focuses search from anywhere.
    useEffect(() => {
        const onKey = (e) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
            // Browser autofill fires keydown events with no key at all.
            if (!e.key) return;
            if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
                e.preventDefault();
                focusSearch();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [focusSearch]);

    useEffect(() => {
        const onAdd = (e) => {
            setAddTarget(e.detail);
            setAdded([]);
            focusSearch();
        };
        window.addEventListener("filmory:add-films", onAdd);
        return () => window.removeEventListener("filmory:add-films", onAdd);
    }, [focusSearch]);

    useEffect(() => {
        if (!open && !expanded) return;
        const onDown = (e) => !rootRef.current?.contains(e.target) && close();
        document.addEventListener("pointerdown", onDown);
        return () => document.removeEventListener("pointerdown", onDown);
    }, [open, expanded, close]);

    // Everything the panel can show, as groups of selectable options, in visual order.
    const groups = useMemo(() => {
        const q = query.trim();
        if (!q) {
            if (addTarget) return [];
            return [
                {
                    label: "Recent searches",
                    action: recents.length
                        ? {
                              label: "Clear",
                              run: () => {
                                  clearRecentSearches();
                                  setRecents([]);
                              },
                          }
                        : null,
                    items: recents.map((r) => ({ kind: "recent", key: `r-${r}`, text: r })),
                },
                {
                    label: "Recently viewed",
                    items: viewed.slice(0, 5).map((f) => ({ kind: "viewed", key: `v-${f.type}-${f.id}`, film: f })),
                },
            ].filter((g) => g.items.length);
        }
        const toItem = (r) =>
            r.media_type === "person"
                ? { kind: "person", key: `p-${r.id}`, person: r }
                : { kind: "title", key: `${r.media_type}-${r.id}`, title: r };
        const byType = (t) => results.filter((r) => r.media_type === t).map(toItem);
        const list = [
            { label: "Movies", items: byType("movie") },
            { label: "TV shows", items: byType("tv") },
            { label: "People", items: byType("person") },
        ].filter((g) => g.items.length);
        if (!addTarget) list.push({ label: null, items: [{ kind: "all", key: "all" }] });
        return list;
    }, [query, results, recents, viewed, addTarget]);
    const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

    const remember = () => {
        addRecentSearch(query);
        setRecents(getRecentSearches());
    };

    const addToList = async (item) => {
        const name = item.title || item.name;
        try {
            const { addMovieToList } = await import("../movie/databaseFetcher");
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

    const choose = (option) => {
        if (!option) return;
        switch (option.kind) {
            case "recent":
                setQuery(option.text);
                inputRef.current?.focus();
                return;
            case "viewed":
                navigate(`/movieDetails/${option.film.id}/${option.film.type}`);
                return;
            case "person":
                remember();
                navigate(`/person/${option.person.id}`);
                return;
            case "all":
                remember();
                navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
                return;
            default:
                if (addTarget) {
                    addToList(option.title);
                    return;
                }
                remember();
                navigate(`/movieDetails/${option.title.id}/${option.title.media_type}`);
        }
    };

    const onKeyDown = (e) => {
        const count = flat.length;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            if (count) setActive((a) => (a + 1) % count);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (count) setActive((a) => (a <= 0 ? count - 1 : a - 1));
        } else if (e.key === "Enter") {
            if (active >= 0) {
                e.preventDefault();
                choose(flat[active]);
            } else if (query.trim() && !addTarget) {
                e.preventDefault();
                choose({ kind: "all" });
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

    const showPanel = open && (query.trim() || addTarget || groups.length);
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
                onFocus={() => {
                    setRecents(getRecentSearches());
                    setViewed(getRecentlyViewed());
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                placeholder={addTarget ? "Find a film to add" : "Search films, series and people"}
                role="combobox"
                aria-expanded={!!showPanel}
                aria-controls="search-listbox"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                aria-label="Search films, series and people"
                className="field min-h-[40px] border-transparent bg-leader pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
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

    const renderOption = (option, i) => {
        const selected = active === i;
        const common = {
            id: optionId(i),
            role: "option",
            "aria-selected": selected,
            onMouseEnter: () => setActive(i),
            onMouseDown: (e) => e.preventDefault(), // keep focus in the field
            onClick: () => choose(option),
        };
        const highlight = selected && (
            <motion.span
                layoutId="search-highlight"
                className="absolute inset-0 rounded-[8px] bg-reel/70"
                transition={{ duration: 0.18, ease: EASE_OUT }}
            />
        );

        if (option.kind === "all") {
            return (
                <li key={option.key} {...common} className="relative mt-1 cursor-pointer rounded-[8px] border-t border-reel px-3 py-3 text-screen">
                    {highlight}
                    <span className="relative">See all results for “{query.trim()}”</span>
                </li>
            );
        }
        if (option.kind === "recent") {
            return (
                <li key={option.key} {...common} className="relative flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5">
                    {highlight}
                    <i className="fa-solid fa-clock-rotate-left relative text-sm text-grain" aria-hidden="true"></i>
                    <span className="relative truncate">{option.text}</span>
                </li>
            );
        }

        let thumb, name, meta, round = false;
        if (option.kind === "person") {
            const p = option.person;
            round = true;
            thumb = p.profile_path;
            name = p.name;
            const known = (p.known_for || []).map((k) => k.title || k.name).filter(Boolean).slice(0, 2);
            meta = [p.known_for_department === "Acting" ? "Actor" : p.known_for_department, known.join(", ")].filter(Boolean).join(", ");
        } else if (option.kind === "viewed") {
            const f = option.film;
            thumb = f.poster_path;
            name = f.title;
            meta = [f.year, f.type === "tv" ? "TV show" : "Movie"].filter(Boolean).join(", ");
        } else {
            const t = option.title;
            thumb = t.poster_path;
            name = t.title || t.name;
            meta = [(t.release_date || t.first_air_date || "").slice(0, 4), t.media_type === "tv" ? "TV show" : "Movie"].filter(Boolean).join(", ");
        }
        const isAdded = option.kind === "title" && added.includes(`${option.title.media_type}:${option.title.id}`);

        return (
            <motion.li
                key={option.key}
                {...common}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015, duration: 0.2 }}
                className="relative flex cursor-pointer items-center gap-3 rounded-[8px] px-2 py-1.5"
            >
                {highlight}
                <Thumb path={thumb} round={round} name={name} />
                <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-grain">
                        {option.kind === "viewed" ? <span className="text-screen">{name}</span> : <Highlight text={name} query={correctedTo || query} />}
                    </span>
                    {meta && <span className="block truncate text-[13px] text-grain">{meta}</span>}
                </span>
                {addTarget && option.kind === "title" && (
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
    };

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
                    {correctedTo && (
                        <p className="border-b border-reel px-4 py-2 text-[13px] text-grain">
                            No matches for “{query.trim()}”. Showing results for “{correctedTo}”.
                        </p>
                    )}
                    <ul id="search-listbox" role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto p-1.5">
                        {status === "error" && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Search isn’t responding. Check your connection and try again.
                            </li>
                        )}
                        {status === "done" && query.trim() && !results.length && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Nothing found for “{query.trim()}”. Try the original title, or an actor’s name.
                            </li>
                        )}
                        {addTarget && !query.trim() && (
                            <li className="px-3 py-3 text-grain" role="presentation">
                                Type a title to find it.
                            </li>
                        )}
                        {groups.map((group) => (
                            <li key={group.label || "footer"} role="presentation">
                                {group.label && (
                                    <div className="flex items-center justify-between px-3 pb-1 pt-2">
                                        <p className="text-[13px] text-grain" aria-hidden="true">
                                            {group.label}
                                        </p>
                                        {group.action && (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={group.action.run}
                                                className="text-[13px] text-grain underline-offset-4 hover:text-screen hover:underline"
                                            >
                                                {group.action.label}
                                            </button>
                                        )}
                                    </div>
                                )}
                                <ul role="group" aria-label={group.label || undefined}>
                                    {group.items.map((option) => {
                                        index += 1;
                                        return renderOption(option, index);
                                    })}
                                </ul>
                            </li>
                        ))}
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
            <button type="button" aria-label="Search films, series and people" className="btn btn-icon btn-text" onClick={focusSearch}>
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
