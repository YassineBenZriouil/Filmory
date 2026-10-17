import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useFocusTrap, useMediaQuery } from "./hooks";

const SPRING = { type: "spring", stiffness: 380, damping: 34 };

// Modal dialog. On phones it becomes a bottom sheet you can drag down to dismiss.
// variant="media" keeps a centred, wide, unpadded frame on every screen (trailers).
export default function Dialog({ open, onClose, title, children, variant = "form", width = 520 }) {
    const panelRef = useRef(null);
    const phone = useMediaQuery("(max-width: 639px)");
    const sheet = phone && variant !== "media";
    const drag = useDragControls();
    useFocusTrap(panelRef, open);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    }, [open, onClose]);

    const motionProps = sheet
        ? {
              initial: { y: "100%" },
              animate: { y: 0, transition: SPRING },
              exit: { y: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
              drag: "y",
              dragListener: false,
              dragControls: drag,
              dragConstraints: { top: 0, bottom: 0 },
              dragElastic: { top: 0, bottom: 0.6 },
              onDragEnd: (_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 600) onClose();
              },
          }
        : {
              initial: { opacity: 0, y: variant === "media" ? 0 : 24, scale: variant === "media" ? 0.96 : 1 },
              animate: { opacity: 1, y: 0, scale: 1, transition: SPRING },
              exit: { opacity: 0, y: variant === "media" ? 0 : 12, scale: variant === "media" ? 0.96 : 1, transition: { duration: 0.16 } },
          };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className={`fixed inset-0 z-[70] flex ${sheet ? "items-end" : "items-center justify-center p-4"}`}>
                    <motion.div
                        className={`absolute inset-0 ${variant === "media" ? "bg-booth/90" : "bg-booth/70"}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        tabIndex={-1}
                        className={
                            variant === "media"
                                ? "relative w-full max-w-5xl outline-none"
                                : `relative w-full border border-reel bg-leader text-screen outline-none ${
                                      sheet
                                          ? "max-h-[92vh] overflow-y-auto rounded-t-[14px] px-4 pb-8 pt-3"
                                          : "max-h-[90vh] overflow-y-auto rounded-[14px] p-6 md:p-8"
                                  }`
                        }
                        style={variant === "media" ? undefined : { maxWidth: sheet ? undefined : width }}
                        {...motionProps}
                    >
                        {sheet && (
                            <div
                                className="-mx-4 -mt-3 mb-2 flex cursor-grab touch-none justify-center pb-3 pt-3"
                                onPointerDown={(e) => drag.start(e)}
                                aria-hidden="true"
                            >
                                <span className="h-1 w-10 rounded-full bg-reel" />
                            </div>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// "Are you sure?" with a destructive confirm button.
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel }) {
    return (
        <Dialog open={open} onClose={onClose} title={title} width={440}>
            <h2 className="text-[31px] font-extrabold">{title}</h2>
            <p className="mt-3 text-grain">{body}</p>
            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-text" onClick={onClose} data-autofocus>
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn border border-velvet bg-velvet text-[rgb(233_237_240)] hover:brightness-110"
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </div>
        </Dialog>
    );
}
