import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/authContext";
import { keyOf } from "../movie/listModel";
import { setWatchedFilms, useWatched } from "../movie/watchedStore";
import { customToast } from "../static/toast";

// "Watched" toggle. variant="overlay" sits on a poster; "full" is a normal button.
export default function WatchedButton({ type, id, title, variant = "full", className = "" }) {
    const { user } = useAuth();
    const watchedMap = useWatched();
    if (!user) return null;
    const key = keyOf(type, id);
    const watched = !!watchedMap[key];

    const toggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await setWatchedFilms([key], !watched);
        } catch {
            customToast(`Couldn’t update ${title}. Try again.`, "error");
        }
    };

    const tick = (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
            <motion.path
                d="M3.5 8.5l3 3 6-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: watched ? 1 : 0.0001, opacity: watched ? 1 : 0 }}
                transition={{ duration: 0.2 }}
            />
        </svg>
    );

    if (variant === "overlay") {
        return (
            <button
                type="button"
                onClick={toggle}
                aria-pressed={watched}
                aria-label={watched ? `Mark ${title} as not watched` : `Mark ${title} as watched`}
                className={`absolute left-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full transition-[opacity,transform,background-color] duration-quick ${
                    watched
                        ? "bg-house text-[rgb(233_237_240)] opacity-100"
                        : "film-add bg-booth/85 text-screen hover:bg-house hover:text-[rgb(233_237_240)]"
                } ${className}`}
            >
                {watched ? tick : <i className="fa-regular fa-eye text-sm" aria-hidden="true"></i>}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={watched}
            className={`btn ${watched ? "border border-house text-house" : "btn-secondary"} ${className}`}
        >
            {watched ? tick : <i className="fa-regular fa-eye text-sm" aria-hidden="true"></i>}
            {watched ? "Watched" : "Mark as watched"}
        </button>
    );
}
