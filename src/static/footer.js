import React from "react";
import { Link } from "react-router-dom";
import ThemeControl from "../style/themeBtn";
import Lens from "./lens";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

export default function Footer({ theme, setTheme }) {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-reel text-[13px] leading-[1.4] text-grain">
            <div className="page-x mx-auto flex max-w-[1464px] flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                    <Link to="/" className="inline-flex items-center gap-2 text-screen">
                        <Lens className="h-6 w-6" />
                        <span className="font-display text-xl font-extrabold leading-none">
                            {brand}
                        </span>
                    </Link>
                    <p className="max-w-[60ch]">
                        Film data from{" "}
                        <a
                            href="https://www.themoviedb.org/"
                            className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam"
                        >
                            TMDB
                        </a>
                        . This product uses the TMDB API but is not endorsed or
                        certified by TMDB.
                    </p>
                    <p>
                        Made by Yassine Ben Zriouil at{" "}
                        <a
                            href="https://ybz.vercel.app/"
                            className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam"
                        >
                            ybz.vercel.app
                        </a>
                    </p>
                </div>

                <div className="flex flex-col gap-4 md:items-end">
                    <div className="flex items-center gap-4">
                        <Link to="/about" className="btn btn-text min-h-0 px-0 text-[13px] font-normal">
                            About
                        </Link>
                        <ThemeControl theme={theme} setTheme={setTheme} id="footer-theme" />
                    </div>
                    <p>
                        © {year} {brand}
                    </p>
                </div>
            </div>
        </footer>
    );
}
