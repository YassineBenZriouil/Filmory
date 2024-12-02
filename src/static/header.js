import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
    const navElems = [
        "home",
        "filter",
        "movies",
        "tvShows",
        "public",
        "myLists",
        "about",
        "profile",
    ];
    const [showNavMenu, setShowNavMenu] = useState(false);

    const toggleNavMenu = () => {
        setShowNavMenu(!showNavMenu);
    };

    const closeNavMenu = () => {
        setShowNavMenu(false);
    };

    return (
        <>
            <div className="flex justify-between items-center bg-gray-200 text-black p-4 dark:bg-gray-900 dark:text-white border-b border-gray-700">
                <Link
                    to="/"
                    className="flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <i className="fa-solid fa-brain text-4xl text-blue-500"></i>
                    <h1 className="text-2xl font-bold ">
                        {process.env.REACT_APP_COMPANY_NAME}
                    </h1>
                </Link>

                <div className="flex items-center space-x-2">
                    {/* Burger Button (Hidden on larger screens) */}
                    <button
                        onClick={toggleNavMenu}
                        className="md:hidden text-xl cursor-pointer hover:text-blue-500"
                    >
                        <i
                            className={`fa-solid w-5 ${
                                showNavMenu ? "fa-times" : "fa-bars"
                            }`}
                        ></i>
                    </button>
                </div>

                {/* Navigation Menu for Larger Screens */}
                <div className="hidden md:block">
                    <ul className="flex space-x-6">
                        {navElems.map((navElem) => (
                            <Link
                                to={navElem === "home" ? "/" : `/${navElem}`}
                                key={navElem}
                            >
                                <li className="hover:text-blue-500 cursor-pointer">
                                    {(() => {
                                        switch (navElem.toLowerCase()) {
                                            case "profile":
                                                return (
                                                    <i className="fa-solid fa-user"></i>
                                                );
                                            case "tvshows":
                                                return "TV SHOWS";
                                            case "filter":
                                                return (
                                                    <>
                                                        <i className="fa-solid fa-magnifying-glass"></i>
                                                        <i className="fa-solid fa-filter"></i>
                                                    </>
                                                );
                                            case "public":
                                                return "PUBLIC LISTS";
                                            case "mylists":
                                                return "MY LISTS";
                                            default:
                                                return navElem.toUpperCase();
                                        }
                                    })()}
                                </li>
                            </Link>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {showNavMenu && (
                <div className="md:hidden flex flex-col items-center text-center bg-white text-black p-4 dark:bg-black dark:text-white">
                    <ul>
                        {navElems.map((navElem) => (
                            <Link
                                to={navElem === "home" ? "/" : `/${navElem}`}
                                key={navElem}
                                onClick={closeNavMenu}
                            >
                                <li className="hover:text-blue-500 cursor-pointer">
                                    {(() => {
                                        switch (navElem.toLowerCase()) {
                                            case "profile":
                                                return (
                                                    <i className="fa-solid fa-user"></i>
                                                );
                                            case "tvshows":
                                                return "TV SHOWS";
                                            case "filter":
                                                return (
                                                    <>
                                                        <i className="fa-solid fa-magnifying-glass"></i>
                                                        <i className="fa-solid fa-filter"></i>
                                                    </>
                                                );
                                            case "mylists":
                                                return "MY LISTS";
                                            default:
                                                return navElem.toUpperCase();
                                        }
                                    })()}
                                </li>
                            </Link>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
