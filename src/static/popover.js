import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const EASE_OUT = [0.2, 0.8, 0.2, 1];

// A small panel anchored to a button. Opens below (or above when there's no room),
// right-aligned to the anchor. Closes on outside click and Esc.
export default function Popover({
    anchorRef,
    open,
    onClose,
    label,
    width = 300,
    role = "dialog",
    children,
}) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    useLayoutEffect(() => {
        if (!open) {
            setPos(null);
            return;
        }
        const place = () => {
            const a = anchorRef.current?.getBoundingClientRect();
            const panel = ref.current;
            if (!a || !panel) return;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const w = Math.min(width, vw - 16);
            const h = panel.offsetHeight;
            const left = Math.min(Math.max(8, a.right - w), vw - w - 8);
            let top = a.bottom + 8;
            let up = false;
            if (top + h > vh - 8 && a.top - h - 8 > 8) {
                top = a.top - h - 8;
                up = true;
            }
            setPos({ top, left, width: w, up });
        };
        place();
        const ro = new ResizeObserver(place);
        if (ref.current) ro.observe(ref.current);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open, anchorRef, width]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (ref.current?.contains(e.target)) return;
            if (anchorRef.current?.contains(e.target)) return;
            onClose();
        };
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            onClose();
            anchorRef.current?.focus();
        };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose, anchorRef]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={ref}
                    role={role}
                    aria-label={label}
                    className="fixed z-50 rounded-[14px] border border-reel bg-leader p-1.5 text-screen"
                    style={{
                        top: pos?.top ?? -9999,
                        left: pos?.left ?? 0,
                        width: pos?.width ?? width,
                        transformOrigin: pos?.up ? "bottom right" : "top right",
                    }}
                    initial={{ opacity: 0, y: pos?.up ? 4 : -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.16 } }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// One row in a popover menu.
export function MenuItem({ onClick, danger, children, ...rest }) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={`flex min-h-[44px] w-full items-center gap-3 rounded-[8px] px-3 text-left transition-colors duration-quick hover:bg-reel/60 focus-visible:bg-reel/60 ${
                danger ? "text-velvet" : "text-screen"
            }`}
            {...rest}
        >
            {children}
        </button>
    );
}
