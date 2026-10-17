import React, { useState } from "react";
import Dialog from "../../static/dialog";
import { Spinner } from "../../static/controls";
import { searchMovie, searchTitles } from "../../movie/allFetcher";
import { keyOf } from "../../movie/listModel";

// "Heat (1995)" → { title: "Heat", year: "1995" }
const parseLine = (line) => {
    // Only a bracketed year counts, so "Blade Runner 2049" stays one title.
    const m = line.match(/^(.*?)\s*[([](\d{4})[)\]]\s*$/);
    return m && m[1] ? { title: m[1].trim(), year: m[2] } : { title: line.trim(), year: "" };
};

// Minimal CSV parser (quoted fields, escaped quotes) for Letterboxd exports.
const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"';
                i += 1;
            } else if (c === '"') quoted = false;
            else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && text[i + 1] === "\n") i += 1;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else field += c;
    }
    if (field || row.length) rows.push([...row, field]);
    return rows.filter((r) => r.some((x) => x.trim()));
};

const letterboxdEntries = (text) => {
    const [header, ...rows] = parseCsv(text);
    const name = header?.findIndex((h) => h.trim().toLowerCase() === "name");
    const year = header?.findIndex((h) => h.trim().toLowerCase() === "year");
    if (name === undefined || name < 0) return null;
    return rows.map((r) => ({ title: r[name]?.trim(), year: year >= 0 ? r[year]?.trim() : "" })).filter((e) => e.title);
};

// Run `task` over `items`, five at a time, reporting progress.
async function pool(items, task, onProgress) {
    const results = new Array(items.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next;
            next += 1;
            try {
                results[i] = await task(items[i]);
            } catch {
                results[i] = null;
            }
            done += 1;
            onProgress(done);
        }
    };
    await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
    return results;
}

const matchEntry = async ({ title, year }, moviesOnly) => {
    if (moviesOnly) {
        const found = await searchMovie(title, year || undefined);
        const hit = found[0] || (year ? (await searchMovie(title))[0] : null);
        return hit ? { ...hit, media_type: "movie" } : null;
    }
    const { results } = await searchTitles(title);
    const sameYear = (r) => (r.release_date || r.first_air_date || "").startsWith(year);
    return (year && results.find(sameYear)) || results[0] || null;
};

// Paste titles or a Letterboxd CSV, check the matches, then add them in one go.
export default function ImportDialog({ open, onClose, listName, existingKeys, onImport }) {
    const [tab, setTab] = useState("paste");
    const [text, setText] = useState("");
    const [csv, setCsv] = useState(null); // { name, entries }
    const [markWatched, setMarkWatched] = useState(false);
    const [rows, setRows] = useState(null); // [{ entry, match, on }]
    const [progress, setProgress] = useState(null); // { done, total }
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setRows(null);
        setProgress(null);
        setError("");
    };

    const close = () => {
        if (progress && !rows) return; // still matching
        reset();
        setText("");
        setCsv(null);
        onClose();
    };

    const readFile = async (file) => {
        reset();
        if (!file) return setCsv(null);
        const entries = letterboxdEntries(await file.text());
        if (!entries) {
            setError("This file doesn’t look like a Letterboxd export. Use watched.csv or watchlist.csv from your Letterboxd data export.");
            setCsv(null);
            return;
        }
        setCsv({ name: file.name, entries });
        setMarkWatched(/watched|diary/i.test(file.name));
    };

    const findMatches = async () => {
        const entries = tab === "paste" ? text.split("\n").map((l) => l.trim()).filter(Boolean).map(parseLine) : csv?.entries || [];
        if (!entries.length) {
            setError(tab === "paste" ? "Paste at least one title, one per line." : "Choose a Letterboxd CSV file first.");
            return;
        }
        setError("");
        const list = entries.slice(0, 500);
        setProgress({ done: 0, total: list.length });
        const matches = await pool(list, (e) => matchEntry(e, tab === "csv"), (done) => setProgress({ done, total: list.length }));
        setRows(
            list.map((entry, i) => {
                const match = matches[i];
                const already = match && existingKeys.has(keyOf(match.media_type, match.id));
                return { entry, match, already, on: !!match && !already };
            })
        );
    };

    const chosen = (rows || []).filter((r) => r.on && r.match);
    const unmatched = (rows || []).filter((r) => !r.match).length;

    const add = async () => {
        setAdding(true);
        try {
            await onImport(
                chosen.map((r) => ({ type: r.match.media_type, id: r.match.id })),
                tab === "csv" && markWatched
            );
            close();
        } finally {
            setAdding(false);
        }
    };

    return (
        <Dialog open={open} onClose={close} title={`Import films into ${listName}`} width={640}>
            <h2 className="text-[31px] font-extrabold">Import films</h2>
            <p className="mt-1 text-grain">Into {listName}</p>

            {!rows && (
                <>
                    <div role="tablist" aria-label="Import from" className="mt-6 inline-flex rounded-full border border-reel p-1">
                        {[
                            ["paste", "Paste titles"],
                            ["csv", "Letterboxd CSV"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => {
                                    setTab(key);
                                    setError("");
                                }}
                                className={`rounded-full px-4 py-2 transition-colors duration-quick ${tab === key ? "bg-leader text-screen" : "text-grain hover:text-screen"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === "paste" ? (
                        <div className="mt-5">
                            <label htmlFor="import-text" className="label">
                                One title per line. Add the year in brackets to be exact, like Heat (1995).
                            </label>
                            <textarea
                                id="import-text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={8}
                                placeholder={"Heat (1995)\nPerfect Days\nThe Bear"}
                                className="field resize-y font-body"
                                disabled={!!progress}
                            />
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            <p className="text-grain">
                                On Letterboxd, go to Settings, then Import and export, and export your data. Choose watched.csv or watchlist.csv from the download.
                            </p>
                            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-[6px] border border-dashed border-reel px-4 py-3 hover:border-grain has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[rgb(var(--focus))]">
                                <i className="fa-solid fa-file-csv text-grain" aria-hidden="true"></i>
                                <span>{csv ? `${csv.name}: ${csv.entries.length} films` : "Choose a CSV file"}</span>
                                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} disabled={!!progress} />
                            </label>
                            {csv && (
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={markWatched} onChange={(e) => setMarkWatched(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--beam))]" />
                                    Also mark these as watched
                                </label>
                            )}
                        </div>
                    )}

                    {error && (
                        <p role="alert" className="mt-3 text-[13px] text-velvet">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-3">
                        {progress && (
                            <p className="mr-auto flex items-center gap-2 text-grain" aria-live="polite">
                                <Spinner />
                                Matching {progress.done} of {progress.total}
                            </p>
                        )}
                        <button type="button" className="btn btn-text" onClick={close} disabled={!!progress}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={findMatches} disabled={!!progress}>
                            Find matches
                        </button>
                    </div>
                </>
            )}

            {rows && (
                <>
                    <p className="mt-6 text-grain">
                        {chosen.length} selected{unmatched ? `, ${unmatched} with no match` : ""}. Untick anything that matched the wrong film.
                    </p>
                    <ul className="mt-3 max-h-[50vh] divide-y divide-reel overflow-y-auto rounded-[6px] border border-reel">
                        {rows.map((row, i) => {
                            const m = row.match;
                            const name = m && (m.title || m.name);
                            const year = m && (m.release_date || m.first_air_date || "").slice(0, 4);
                            return (
                                <li key={i}>
                                    <label className={`flex items-center gap-3 px-3 py-2 ${m && !row.already ? "cursor-pointer" : "opacity-60"}`}>
                                        <input
                                            type="checkbox"
                                            checked={row.on}
                                            disabled={!m || row.already}
                                            onChange={(e) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, on: e.target.checked } : r)))}
                                            className="h-4 w-4 shrink-0 accent-[rgb(var(--beam))]"
                                        />
                                        {m?.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" width="32" height="48" loading="lazy" className="h-12 w-8 shrink-0 rounded-[3px] object-cover" />
                                        ) : (
                                            <span className="grain h-12 w-8 shrink-0 rounded-[3px]" />
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate">{m ? `${name}${year ? ` (${year})` : ""}` : row.entry.title}</span>
                                            <span className="block truncate text-[13px] text-grain">
                                                {!m
                                                    ? "No match found"
                                                    : row.already
                                                    ? "Already in this list"
                                                    : `From “${row.entry.title}${row.entry.year ? ` (${row.entry.year})` : ""}”`}
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" className="btn btn-text" onClick={reset}>
                            Back
                        </button>
                        <button type="button" className="btn btn-primary" onClick={add} disabled={!chosen.length || adding}>
                            {adding && <Spinner />}
                            Add {chosen.length} {chosen.length === 1 ? "film" : "films"}
                        </button>
                    </div>
                </>
            )}
        </Dialog>
    );
}
