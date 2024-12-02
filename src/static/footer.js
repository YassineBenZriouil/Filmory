import React from "react";
import Theme from "../style/themeBtn";
import { Link } from "react-router-dom";

export default function Footer({ theme, toggleTheme }) {
    return (
        <div className=" bg-gray-200 text-black p-4 dark:bg-gray-900 dark:text-white border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
                {/* Company Name */}
                <Link
                    to="/"
                    className="flex items-center justify-center space-x-2 cursor-pointer"
                >
                    {" "}
                    <i className="fa-solid fa-brain text-4xl text-blue-500"></i>
                    <h1 className="text-2xl font-bold  hover:text-blue-500 cursor-pointer dark:text-white">
                        {process.env.REACT_APP_COMPANY_NAME || "Your Company"}
                    </h1>
                </Link>

                {/* Copyright */}
                <p className="text-sm mt-2 md:mt-0  dark:text-white ">
                    © 2023{" "}
                    {process.env.REACT_APP_COMPANY_NAME || "Your Company"}. All
                    rights reserved.
                </p>

                {/* Theme Toggle Button */}
                <div className="mt-2 md:mt-0">
                    <Theme theme={theme} toggleTheme={toggleTheme} />
                </div>
            </div>
        </div>
    );
}
