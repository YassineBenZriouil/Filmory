import React from "react";
import { Link } from "react-router-dom";

// A film leader that has run out: the countdown circle with nothing left in it.
export default function NotFound() {
    return (
        <div className="page flex min-h-[70vh] flex-col items-start justify-center gap-8">
            <div className="leader" aria-hidden="true" />
            <div className="space-y-3">
                <h1 className="page-title">This page isn't on the reel</h1>
                <p className="max-w-[60ch] text-grain">
                    The address may be mistyped, or the page has moved.
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <Link to="/" className="btn btn-primary">
                    Go to home
                </Link>
                <Link to="/discover" className="btn btn-secondary">
                    Discover films
                </Link>
            </div>
        </div>
    );
}
