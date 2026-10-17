import React from "react";
import { motion } from "framer-motion";

const OPTIONS = [
    { value: "light", label: "Light theme", icon: "fa-sun" },
    { value: "system", label: "Match system theme", icon: "fa-circle-half-stroke" },
    { value: "dark", label: "Dark theme", icon: "fa-moon" },
];

// Three-way theme switch. Native radios keep arrow-key behaviour for free.
export default function ThemeControl({ theme, setTheme, id = "theme" }) {
    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className="inline-flex rounded-full border border-reel p-1"
        >
            {OPTIONS.map(({ value, label, icon }) => {
                const checked = theme === value;
                return (
                    <label
                        key={value}
                        title={label}
                        className={`relative grid h-9 w-11 cursor-pointer place-items-center rounded-full transition-colors duration-quick has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[rgb(var(--focus))] ${
                            checked ? "text-screen" : "text-grain hover:text-screen"
                        }`}
                    >
                        <input
                            type="radio"
                            name={id}
                            value={value}
                            checked={checked}
                            onChange={() => setTheme(value)}
                            className="sr-only"
                            aria-label={label}
                        />
                        {checked && (
                            <motion.span
                                layoutId={`${id}-pill`}
                                className="absolute inset-0 rounded-full bg-leader"
                                transition={{
                                    duration: 0.28,
                                    ease: [0.65, 0, 0.35, 1],
                                }}
                            />
                        )}
                        <i
                            className={`fa-solid ${icon} relative text-sm`}
                            aria-hidden="true"
                        ></i>
                    </label>
                );
            })}
        </div>
    );
}
