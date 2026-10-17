import React from "react";
import { Link } from "react-router-dom";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

const SECTIONS = [
    {
        title: "Browse",
        body: (
            <>
                Find popular and new movies and series, search by title, or narrow things down by type, year and genre
                in <Link to="/discover" className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">Discover</Link>.
                {" "}{brand} doesn’t stream anything; it helps you decide what to watch.
            </>
        ),
    },
    {
        title: "Keep lists",
        body: "Make a list for anything: a festival plan, a deep dive into one genre, films to watch with friends. Add or remove films from any film’s page, or with the + on a poster.",
    },
    {
        title: "Share",
        body: (
            <>
                Make a list public and anyone can find it under{" "}
                <Link to="/public" className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">Public lists</Link>.
                Private lists stay visible only to you.
            </>
        ),
    },
];

export default function About() {
    return (
        <div className="page max-w-[calc(68ch+144px)]">
            <h1 className="page-title">About {brand}</h1>
            <div className="mt-10 max-w-[68ch] space-y-10">
                {SECTIONS.map(({ title, body }) => (
                    <section key={title}>
                        <h2 className="text-[31px] font-semibold">{title}</h2>
                        <p className="mt-3 text-lg leading-relaxed">{body}</p>
                    </section>
                ))}

                <section className="border-t border-reel pt-10">
                    <h2 className="text-[31px] font-semibold">Made by Yassine Ben Zriouil</h2>
                    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                        <li>
                            <a href="https://ybz.vercel.app/" className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">
                                ybz.vercel.app
                            </a>
                        </li>
                        <li>
                            <a href="mailto:yassinebenzriouil7@gmail.com" className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam">
                                yassinebenzriouil7@gmail.com
                            </a>
                        </li>
                    </ul>
                </section>

                <section className="flex flex-wrap items-center gap-5 text-[13px] text-grain">
                    <a href="https://www.themoviedb.org/" aria-label="The Movie Database (TMDB)">
                        <img
                            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                            alt="TMDB"
                            width="110"
                            height="14"
                            className="h-3.5 w-auto"
                        />
                    </a>
                    <p className="max-w-[48ch]">
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </p>
                </section>
            </div>
        </div>
    );
}
