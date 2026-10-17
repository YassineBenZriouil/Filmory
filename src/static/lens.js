import React from "react";

// The projector-lens mark used in the header, footer and favicon.
export default function Lens({ className = "h-8 w-8" }) {
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
            <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
            />
            <circle cx="16" cy="16" r="5.5" fill="rgb(var(--beam))" />
        </svg>
    );
}
