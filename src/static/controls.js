import React, { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";

// On/off switch with a slightly springy thumb.
export function Switch({ checked, onChange, label, id }) {
    return (
        <button
            type="button"
            role="switch"
            id={id}
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-quick ${
                checked ? "bg-house" : "bg-reel"
            }`}
        >
            <motion.span
                className="block h-4 w-4 rounded-full bg-[rgb(233_237_240)]"
                animate={{ x: checked ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );
}

// Text field whose label sits inside, then slides up and shrinks on focus or once filled.
// The bottom rule draws in from the left in beam on focus.
export function FloatField({
    id,
    label,
    value,
    onChange,
    multiline,
    maxLength,
    counterFrom,
    error,
    ...rest
}) {
    const areaRef = useRef(null);
    useLayoutEffect(() => {
        const el = areaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    const Input = multiline ? "textarea" : "input";
    const showCounter = maxLength && value.length >= (counterFrom ?? maxLength * 0.75);
    return (
        <div>
            <div className="relative rounded-t-[6px] bg-booth/60">
                <Input
                    ref={multiline ? areaRef : undefined}
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    placeholder=" "
                    rows={multiline ? 2 : undefined}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className="peer block w-full resize-none border-b border-reel bg-transparent px-3 pb-2 pt-6 text-screen outline-none focus-visible:outline-none"
                    {...rest}
                />
                <label
                    htmlFor={id}
                    className="pointer-events-none absolute left-3 top-1.5 text-[13px] text-grain transition-all duration-quick peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-[13px]"
                >
                    {label}
                </label>
                <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-move ease-out peer-focus:scale-x-100 ${
                        error ? "scale-x-100 bg-velvet" : "bg-beam"
                    }`}
                />
            </div>
            <div className="mt-1 flex min-h-[20px] justify-between gap-4 text-[13px]">
                <motion.p
                    id={`${id}-error`}
                    className="text-velvet"
                    initial={false}
                    animate={{ opacity: error ? 1 : 0, y: error ? 0 : -4 }}
                    transition={{ duration: 0.16 }}
                    role={error ? "alert" : undefined}
                >
                    {error || ""}
                </motion.p>
                {showCounter && (
                    <span className="tabular-nums text-grain">
                        {value.length}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
}

// Small amber sweep used inside buttons while saving.
export function Spinner() {
    return (
        <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
    );
}
