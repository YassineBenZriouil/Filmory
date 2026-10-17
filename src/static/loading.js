import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import CardGrid from "../components/cardGrid";

// Film-leader countdown. Waits 200ms so fast loads never flash it.
export default function Loading() {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(false);
    const [count, setCount] = useState(3);

    useEffect(() => {
        const t = setTimeout(() => setShown(true), 200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!shown || reduce) return;
        // One number per sweep: the sweep animation is also 1s.
        const t = setInterval(() => setCount((c) => (c === 1 ? 3 : c - 1)), 1000);
        return () => clearInterval(t);
    }, [shown, reduce]);

    return (
        <div
            role="status"
            aria-live="polite"
            className="grid min-h-[70vh] place-items-center"
        >
            {shown && (
                <div className="leader text-screen">
                    {!reduce && <span className="leader-sweep" />}
                    {reduce ? (
                        <span className="relative z-[1] text-sm text-grain">
                            Loading
                        </span>
                    ) : (
                        <span className="leader-num" aria-hidden="true">
                            {count}
                        </span>
                    )}
                </div>
            )}
            <span className="sr-only">Loading</span>
        </div>
    );
}

// Poster-shaped placeholders in the same grid as real cards, so nothing jumps.
export function SkeletonGrid({ count = 20 }) {
    return (
        <div role="status" aria-label="Loading">
            <CardGrid>
                {Array.from({ length: count }, (_, i) => (
                    <div key={i} aria-hidden="true">
                        <div className="skeleton aspect-[2/3] rounded-[3px]" />
                        <div className="skeleton mt-3 h-4 w-4/5 rounded" />
                        <div className="skeleton mt-2 h-3 w-1/3 rounded" />
                    </div>
                ))}
            </CardGrid>
        </div>
    );
}
