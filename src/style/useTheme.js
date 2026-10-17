import { useState, useEffect } from "react";

// theme is the saved choice ("light" | "system" | "dark"); resolved is what's on screen.
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

const readSaved = () => {
    try {
        return localStorage.getItem("theme") || "system";
    } catch {
        return "system";
    }
};

const useTheme = () => {
    const [theme, setThemeState] = useState(readSaved);
    const [systemDark, setSystemDark] = useState(darkQuery.matches);

    useEffect(() => {
        const onChange = (e) => setSystemDark(e.matches);
        darkQuery.addEventListener("change", onChange);
        return () => darkQuery.removeEventListener("change", onChange);
    }, []);

    const resolved =
        theme === "system" ? (systemDark ? "dark" : "light") : theme;

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add("theme-switching");
        root.classList.toggle("dark", resolved === "dark");
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute(
                "content",
                resolved === "dark" ? "#0F1E26" : "#E6EAED"
            );
        // Two frames: one to paint the new colours, one before transitions come back.
        let inner;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() =>
                root.classList.remove("theme-switching")
            );
        });
        return () => {
            cancelAnimationFrame(outer);
            cancelAnimationFrame(inner);
        };
    }, [resolved]);

    const setTheme = (next) => {
        setThemeState(next);
        try {
            localStorage.setItem("theme", next);
        } catch {}
    };

    return { theme, resolved, setTheme };
};

export default useTheme;
