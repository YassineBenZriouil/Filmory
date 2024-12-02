// src/style/theme.js
import React from "react";

export default function Theme({ theme, toggleTheme }) {
    return (
        <button
            className="bg-black text-white p-1 px-3  rounded-lg  dark:bg-white dark:text-black"
            onClick={toggleTheme}
        >
            {theme === "dark" ? (
                <i className="fa-solid fa-sun"></i>
            ) : (
                <i className="fa-solid fa-moon"></i>
            )}
        </button>
    );
}
