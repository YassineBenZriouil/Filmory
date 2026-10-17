import React, { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

// A number that rolls to its new value. Starts from `from` the first time it shows.
export default function Count({ value, from, duration = 0.28 }) {
    const ref = useRef(null);
    const shown = useRef(from ?? value);
    const reduce = useReducedMotion();

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        if (reduce) {
            node.textContent = value.toLocaleString();
            shown.current = value;
            return;
        }
        const controls = animate(shown.current, value, {
            duration,
            ease: [0.2, 0.8, 0.2, 1],
            onUpdate: (v) => {
                shown.current = v;
                node.textContent = Math.round(v).toLocaleString();
            },
        });
        return () => controls.stop();
    }, [value, reduce, duration]);

    return <span ref={ref}>{(from ?? value).toLocaleString()}</span>;
}
