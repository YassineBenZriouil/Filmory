import React, { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";

function Row({ item, index, count, picked, onPick, onMove }) {
    const controls = useDragControls();
    const name = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").slice(0, 4);
    return (
        <Reorder.Item
            value={item.key}
            dragListener={false}
            dragControls={controls}
            className={`flex items-center gap-3 rounded-[8px] border bg-booth px-2 py-2 ${picked ? "border-beam" : "border-reel"}`}
            whileDrag={{ scale: 1.02, boxShadow: "0 12px 32px -12px rgb(var(--booth))", zIndex: 10 }}
        >
            <button
                type="button"
                aria-label={`Move ${name}, position ${index + 1} of ${count}`}
                aria-pressed={picked}
                onPointerDown={(e) => controls.start(e)}
                onClick={onPick}
                onKeyDown={(e) => {
                    if (!picked) return;
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        onMove(e.key === "ArrowUp" ? -1 : 1);
                    } else if (e.key === "Escape") {
                        onPick();
                    }
                }}
                className="grid h-11 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-[6px] text-grain hover:text-screen active:cursor-grabbing"
            >
                <i className="fa-solid fa-grip-vertical" aria-hidden="true"></i>
            </button>
            <span className="w-8 shrink-0 text-right font-display text-lg font-extrabold tabular-nums text-grain">{index + 1}</span>
            {item.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" width="32" height="48" className="h-12 w-8 shrink-0 rounded-[3px] object-cover" />
            ) : (
                <span className="grain h-12 w-8 shrink-0 rounded-[3px]" />
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{name}</span>
                {year && <span className="text-[13px] text-grain">{year}</span>}
            </span>
        </Reorder.Item>
    );
}

// Arrange a list by dragging, or with the keyboard: press a handle to pick a film up,
// move it with the arrow keys, press again (or Esc) to put it down.
export default function Arrange({ films, onDone, onCancel }) {
    const [keys, setKeys] = useState(films.map((f) => f.key));
    const [picked, setPicked] = useState(null);
    const [announcement, setAnnouncement] = useState("");
    const byKey = Object.fromEntries(films.map((f) => [f.key, f]));

    const move = (key, dir) => {
        setKeys((prev) => {
            const i = prev.indexOf(key);
            const j = i + dir;
            if (j < 0 || j >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            setAnnouncement(`${byKey[key].title || byKey[key].name}, position ${j + 1} of ${prev.length}`);
            return next;
        });
    };

    return (
        <div>
            <div className="sticky top-16 z-20 -mx-2 mb-4 flex flex-wrap items-center justify-between gap-3 bg-booth/90 px-2 py-3 backdrop-blur-md">
                <p className="text-grain">Drag the handles, or press one and use the arrow keys.</p>
                <div className="flex gap-2">
                    <button type="button" className="btn btn-text" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => onDone(keys)}>
                        Save order
                    </button>
                </div>
            </div>
            <p className="sr-only" aria-live="assertive">
                {announcement}
            </p>
            <Reorder.Group axis="y" values={keys} onReorder={setKeys} className="max-w-2xl space-y-2">
                {keys.map((key, i) => (
                    <Row
                        key={key}
                        item={byKey[key]}
                        index={i}
                        count={keys.length}
                        picked={picked === key}
                        onPick={() => {
                            setPicked((p) => (p === key ? null : key));
                            setAnnouncement(
                                picked === key
                                    ? `${byKey[key].title || byKey[key].name} put down at position ${i + 1}`
                                    : `${byKey[key].title || byKey[key].name} picked up. Use the arrow keys to move it.`
                            );
                        }}
                        onMove={(dir) => move(key, dir)}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
}
