import React, { useEffect, useRef } from "react";

const TARGETS = "a, button, input, select, textarea, label, [data-beam]";

// A pool of tungsten light that eases toward whatever is hovered or keyboard-focused.
// Pointer devices only; touch screens never render it.
export default function Beam() {
    const ref = useRef(null);

    useEffect(() => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
            return;
        const beam = ref.current;
        let target = null;

        const place = (instant) => {
            if (!target || !target.isConnected) {
                beam.style.opacity = "0";
                return;
            }
            const r = target.getBoundingClientRect();
            beam.style.transitionDuration = instant ? "0ms, var(--t-quick)" : "";
            beam.style.transform = `translate3d(${r.left + r.width / 2 - 210}px, ${
                r.top + r.height / 2 - 210
            }px, 0)`;
            beam.style.opacity = "1";
        };

        const onOver = (e) => {
            const el = e.target.closest(TARGETS);
            if (el === target) return;
            // Coming from nothing: jump there, then fade in, instead of sliding across the screen.
            const wasHidden = !target;
            target = el;
            place(wasHidden);
        };
        const onFocus = (e) => {
            if (!e.target.matches(":focus-visible")) return;
            target = e.target;
            place(true);
        };
        const onLeaveWindow = () => {
            target = null;
            place();
        };
        const onScroll = () => place(true);

        document.addEventListener("pointerover", onOver);
        document.addEventListener("focusin", onFocus);
        document.documentElement.addEventListener("pointerleave", onLeaveWindow);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            document.removeEventListener("pointerover", onOver);
            document.removeEventListener("focusin", onFocus);
            document.documentElement.removeEventListener(
                "pointerleave",
                onLeaveWindow
            );
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    return <div ref={ref} className="beam" aria-hidden="true" />;
}
