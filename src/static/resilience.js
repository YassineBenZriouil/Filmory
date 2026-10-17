import React, { Component, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// One per route: a crash shows a way out instead of a blank page.
// `resetKey` (the path) clears the error when the person navigates away.
export class RouteErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Page crashed:", error, info.componentStack);
    }

    componentDidUpdate(prev) {
        if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
    }

    render() {
        if (!this.state.error) return this.props.children;
        // A deploy can remove old code chunks; a reload fetches the new ones.
        const chunk = /Loading chunk|ChunkLoadError|dynamically imported module/i.test(String(this.state.error));
        return (
            <div className="page flex min-h-[60vh] flex-col items-start justify-center gap-6">
                <h1 className="page-title">This page hit a problem</h1>
                <p className="max-w-[60ch] text-lg text-grain">
                    {chunk
                        ? "A newer version of Filmory is available. Reload to get it."
                        : "Reload it, or go back to Home."}
                </p>
                <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                        Reload
                    </button>
                    <Link to="/" className="btn btn-secondary">
                        Go to home
                    </Link>
                </div>
            </div>
        );
    }
}

export function useOnline() {
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
        const up = () => setOnline(true);
        const down = () => setOnline(false);
        window.addEventListener("online", up);
        window.addEventListener("offline", down);
        return () => {
            window.removeEventListener("online", up);
            window.removeEventListener("offline", down);
        };
    }, []);
    return online;
}

// A quiet strip under the header while the connection is down.
export function OfflineBanner() {
    const online = useOnline();
    return (
        <AnimatePresence>
            {!online && (
                <motion.div
                    role="status"
                    className="sticky top-14 z-30 overflow-hidden border-b border-reel bg-leader text-[13px] text-screen"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                >
                    <p className="page-x mx-auto flex max-w-[1464px] items-center gap-2 py-2">
                        <i className="fa-solid fa-plug-circle-xmark text-grain" aria-hidden="true"></i>
                        You’re offline. Changes to your lists will save when you reconnect.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// "Try again" for a section that failed to load.
export function LoadError({ message, onRetry }) {
    return (
        <div className="flex max-w-[60ch] flex-col items-start gap-4" role="alert">
            <p className="text-lg">{message}</p>
            {onRetry && (
                <button type="button" className="btn btn-secondary" onClick={onRetry}>
                    <i className="fa-solid fa-rotate-right text-sm" aria-hidden="true"></i>
                    Try again
                </button>
            )}
        </div>
    );
}
