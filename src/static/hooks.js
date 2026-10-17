import { useEffect, useState } from "react";

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);
        setMatches(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [query]);
    return matches;
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

// Keeps Tab inside `ref` while active, focuses the first control, and hands focus
// back to whatever had it before.
export function useFocusTrap(ref, active) {
    useEffect(() => {
        if (!active) return;
        const previous = document.activeElement;
        const node = ref.current;
        const items = () => [...(node?.querySelectorAll(FOCUSABLE) || [])];
        const first = node?.querySelector("[data-autofocus]") || items()[0] || node;
        first?.focus({ preventScroll: true });

        const onKey = (e) => {
            if (e.key !== "Tab" || !node) return;
            const list = items();
            if (!list.length) return e.preventDefault();
            const [start, end] = [list[0], list[list.length - 1]];
            if (e.shiftKey && document.activeElement === start) {
                e.preventDefault();
                end.focus();
            } else if (!e.shiftKey && document.activeElement === end) {
                e.preventDefault();
                start.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            if (previous?.isConnected) previous.focus({ preventScroll: true });
        };
    }, [ref, active]);
}

export const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
