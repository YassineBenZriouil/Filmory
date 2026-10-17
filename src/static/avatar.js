import React from "react";

export const initialsOf = (name, fallback) => {
    const words = (name || "").trim().split(/\s+/).filter(Boolean);
    if (words.length)
        return words
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
    return ((fallback || "?")[0] || "?").toUpperCase();
};

export default function Avatar({ name, fallback, size = "h-8 w-8 text-sm" }) {
    return (
        <span
            aria-hidden="true"
            className={`grid shrink-0 place-items-center rounded-full bg-reel font-display font-extrabold text-screen ${size}`}
        >
            {initialsOf(name, fallback)}
        </span>
    );
}
