import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lens from "./lens";
import Search from "../components/search";
import { initialsOf } from "./avatar";
import {
    fetchingUserUIDByEmail,
    fetchUserData,
} from "../movie/databaseFetcher";

const NAV = [
    { to: "/", label: "Home" },
    { to: "/movies", label: "Movies" },
    { to: "/tvShows", label: "TV shows" },
    { to: "/discover", label: "Discover" },
    { to: "/public", label: "Public lists" },
    { to: "/mylists", label: "My lists" },
];

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

const isActive = (pathname, to) =>
    to === "/" ? pathname === "/" : pathname.toLowerCase() === to.toLowerCase();

// Who is logged in, re-read on every route change (login/logout happen in this tab,
// where the storage event never fires).
function useCurrentUser(pathname) {
    const [email, setEmail] = useState(localStorage.getItem("loggedInUser"));
    const [name, setName] = useState("");

    useEffect(() => {
        setEmail(localStorage.getItem("loggedInUser"));
    }, [pathname]);

    useEffect(() => {
        let alive = true;
        setName("");
        if (!email) return;
        (async () => {
            const uid = await fetchingUserUIDByEmail();
            const data = uid && (await fetchUserData(uid));
            if (alive && data?.userName) setName(data.userName);
        })();
        return () => {
            alive = false;
        };
    }, [email]);

    return { email, name };
}

export default function Header() {
    const { pathname } = useLocation();
    const { email, name } = useCurrentUser(pathname);
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const burgerRef = useRef(null);
    const sheetRef = useRef(null);
    const wasOpen = useRef(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close the mobile menu whenever the route changes.
    useEffect(() => setOpen(false), [pathname]);

    // Mobile menu: lock scroll, Esc to close, move focus in and back out.
    useEffect(() => {
        if (open) {
            wasOpen.current = true;
            document.body.style.overflow = "hidden";
            sheetRef.current?.querySelector("a")?.focus();
            const onKey = (e) => e.key === "Escape" && setOpen(false);
            document.addEventListener("keydown", onKey);
            return () => {
                document.body.style.overflow = "";
                document.removeEventListener("keydown", onKey);
            };
        }
        if (wasOpen.current) {
            wasOpen.current = false;
            burgerRef.current?.focus();
        }
    }, [open]);

    const profile = email ? (
        <Link
            to="/profile"
            aria-label="Your profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-reel font-display text-base font-extrabold text-screen transition-shadow duration-quick hover:shadow-[0_0_0_2px_rgb(var(--beam))]"
        >
            {initialsOf(name, email)}
        </Link>
    ) : (
        <Link to="/login" className="btn btn-text">
            Log in
        </Link>
    );

    return (
        <>
            <a
                href="#main"
                className="fixed left-4 top-0 z-[60] -translate-y-full rounded-b-[6px] bg-beam px-4 py-2 font-bold text-ink transition-transform duration-quick focus:translate-y-0"
            >
                Skip to content
            </a>
            <header
                className={`sticky top-0 z-40 bg-booth/80 backdrop-blur-md transition-[border-color] duration-quick border-b ${
                    scrolled || open ? "border-reel" : "border-transparent"
                }`}
            >
                <div
                    className={`page-x mx-auto flex max-w-[1464px] items-center gap-6 transition-[height] duration-move ease-out ${
                        scrolled ? "h-14" : "h-16"
                    }`}
                >
                    <Link
                        to="/"
                        className="flex shrink-0 items-center gap-2 text-screen"
                    >
                        <Lens className="h-7 w-7" />
                        <span className="font-display text-[25px] font-extrabold leading-none">
                            {brand}
                        </span>
                    </Link>

                    <nav aria-label="Main" className="hidden lg:block">
                        <ul className="flex items-center gap-1">
                            {NAV.map(({ to, label }) => {
                                const active = isActive(pathname, to);
                                return (
                                    <li key={to} className="relative">
                                        <Link
                                            to={to}
                                            aria-current={active ? "page" : undefined}
                                            className={`block px-3 py-2 transition-colors duration-quick ${
                                                active
                                                    ? "text-screen"
                                                    : "text-grain hover:text-screen"
                                            }`}
                                        >
                                            {label}
                                        </Link>
                                        {active && (
                                            <motion.span
                                                layoutId="nav-rule"
                                                className="absolute inset-x-3 -bottom-px h-0.5 bg-beam"
                                                transition={{
                                                    duration: 0.28,
                                                    ease: [0.65, 0, 0.35, 1],
                                                }}
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <Search />
                        <div className="hidden lg:block">{profile}</div>
                        <button
                            ref={burgerRef}
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            aria-expanded={open}
                            aria-controls="mobile-menu"
                            aria-label={open ? "Close menu" : "Open menu"}
                            className="btn btn-icon btn-text text-screen lg:hidden"
                        >
                            <span className="relative block h-3 w-6" aria-hidden="true">
                                <span
                                    className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-transform duration-move ease-out ${
                                        open ? "top-[5px] rotate-45" : "top-0"
                                    }`}
                                />
                                <span
                                    className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-transform duration-move ease-out ${
                                        open ? "top-[5px] -rotate-45" : "top-[10px]"
                                    }`}
                                />
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id="mobile-menu"
                        ref={sheetRef}
                        className="fixed inset-x-0 bottom-0 z-30 overflow-y-auto bg-booth lg:hidden"
                        style={{ top: scrolled ? 56 : 64 }}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                        <nav aria-label="Main" className="page-x py-8">
                            <ul className="flex flex-col gap-2">
                                {[...NAV, { to: "/about", label: "About" }].map(
                                    ({ to, label }, i) => {
                                        const active = isActive(pathname, to);
                                        return (
                                            <motion.li
                                                key={to}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: 0.03 * i,
                                                    duration: 0.28,
                                                    ease: [0.2, 0.8, 0.2, 1],
                                                }}
                                            >
                                                <Link
                                                    to={to}
                                                    aria-current={active ? "page" : undefined}
                                                    className={`block py-1 font-display text-[39px] font-extrabold leading-tight ${
                                                        active ? "text-beam" : "text-screen"
                                                    }`}
                                                >
                                                    {label}
                                                </Link>
                                            </motion.li>
                                        );
                                    }
                                )}
                            </ul>
                            <div className="mt-8 border-t border-reel pt-6">
                                {email ? (
                                    <Link to="/profile" className="flex items-center gap-3 text-screen">
                                        <span className="grid h-9 w-9 place-items-center rounded-full bg-reel font-display font-extrabold">
                                            {initialsOf(name, email)}
                                        </span>
                                        {name || email}
                                    </Link>
                                ) : (
                                    <Link to="/login" className="btn btn-primary w-full">
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
