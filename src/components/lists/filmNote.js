import React, { useEffect, useRef, useState } from "react";
import Popover from "../../static/popover";

// Five stars in half steps. Works as a slider: arrows change it by half a star.
export function StarRating({ value, onChange, size = "text-xl", label = "Your rating" }) {
    const [hover, setHover] = useState(null);
    const shown = hover ?? value ?? 0;
    const readOnly = !onChange;

    const stars = (
        <span className={`relative inline-flex ${size} leading-none`} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => {
                const fill = Math.max(0, Math.min(1, shown - (n - 1)));
                return (
                    <span key={n} className="relative inline-block">
                        <i className="fa-regular fa-star text-reel"></i>
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <i className="fa-solid fa-star text-beam"></i>
                        </span>
                    </span>
                );
            })}
        </span>
    );

    if (readOnly) {
        return value ? (
            <span className="inline-flex items-center" title={`${value} out of 5`}>
                {stars}
                <span className="sr-only">{`Rated ${value} out of 5`}</span>
            </span>
        ) : null;
    }

    const pick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const raw = ((e.clientX - rect.left) / rect.width) * 5;
        return Math.min(5, Math.max(0.5, Math.ceil(raw * 2) / 2));
    };

    return (
        <span className="inline-flex items-center gap-3">
            <span
                role="slider"
                tabIndex={0}
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={value || 0}
                aria-valuetext={value ? `${value} out of 5 stars` : "Not rated"}
                className="cursor-pointer rounded-[4px] py-1"
                onMouseMove={(e) => setHover(pick(e))}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => {
                    const next = pick(e);
                    onChange(next === value ? null : next);
                }}
                onKeyDown={(e) => {
                    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
                    if (step) {
                        e.preventDefault();
                        const next = Math.min(5, Math.max(0, (value || 0) + step));
                        onChange(next || null);
                    } else if (e.key === "Delete" || e.key === "Backspace") {
                        onChange(null);
                    }
                }}
            >
                {stars}
            </span>
            <span className="min-w-[3ch] font-display text-lg font-extrabold tabular-nums text-grain">{shown ? shown : ""}</span>
        </span>
    );
}

// Rating and note for one film in one list. Saves when the popover closes.
export default function FilmNote({ anchorRef, open, onClose, title, meta, onSave, onCover, isCover }) {
    const [rating, setRating] = useState(meta.rating ?? null);
    const [note, setNote] = useState(meta.note || "");
    const areaRef = useRef(null);

    useEffect(() => {
        if (open) {
            setRating(meta.rating ?? null);
            setNote(meta.note || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const close = () => {
        const changed = (rating ?? null) !== (meta.rating ?? null) || note.trim() !== (meta.note || "");
        if (changed) onSave({ rating: rating ?? null, note: note.trim() });
        onClose();
    };

    return (
        <Popover anchorRef={anchorRef} open={open} onClose={close} label={`Your notes on ${title}`} width={320}>
            <div className="space-y-4 p-3">
                <p className="truncate font-bold">{title}</p>
                <StarRating value={rating} onChange={setRating} />
                <div>
                    <label htmlFor="film-note" className="label">
                        Note (only on this list)
                    </label>
                    <textarea
                        ref={areaRef}
                        id="film-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder="Recommended by Sam"
                        className="field resize-none"
                    />
                    <p className="mt-1 text-right text-[13px] tabular-nums text-grain">{note.length}/200</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {onCover ? (
                        <button type="button" className="btn btn-text -ml-2 min-h-[40px] text-[13px]" onClick={onCover} disabled={isCover}>
                            <i className="fa-regular fa-image text-sm" aria-hidden="true"></i>
                            {isCover ? "List cover" : "Use as list cover"}
                        </button>
                    ) : (
                        <span />
                    )}
                    <button type="button" className="btn btn-primary min-h-[40px]" onClick={close}>
                        Done
                    </button>
                </div>
            </div>
        </Popover>
    );
}
