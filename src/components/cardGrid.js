import React from "react";

export default function CardGrid({ children }) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] md:gap-x-6">
            {children}
        </div>
    );
}
