import React from "react";
import { Link } from "react-router-dom";
import Animations from "../static/animations";

export default function About() {
    const companyName = process.env.REACT_APP_COMPANY_NAME || "Your Company";

    return (
        <div className="bg-white text-black dark:bg-black dark:text-white">
            <Animations>
                <div className="min-h-screen flex flex-col items-center justify-center p-8">
                    <h1 className="text-4xl font-bold mb-6">
                        🎥 Welcome to {companyName} Official Site 🌟
                    </h1>
                    <Link className="m-4" to="/">
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            🏠 Home
                        </button>
                    </Link>
                    <p className="text-lg mb-4">
                        {companyName} is your ultimate platform to explore a
                        vast library of movies 🎬 and TV series 📺. Dive into
                        popular movies, the latest releases, trending series,
                        and new arrivals—all easily accessible on the home page
                        of our site. However, please note that streaming is not
                        available; instead, {companyName} offers a curated
                        browsing experience to discover and organize your
                        favorites.
                    </p>

                    <h2 className="text-3xl font-semibold mb-4">
                        Features that Enhance Your Experience 🌟
                    </h2>

                    <div className="mb-6">
                        <h3 className="text-2xl font-semibold mb-2">
                            🔍 Advanced Search and Filters
                        </h3>
                        <p className="text-lg mb-4">
                            You can search for specific movies or series by name
                            or filter them by type, release year, or genre.
                            Whether you're into action-packed adventures,
                            heartwarming romances, or thrilling sci-fi tales,
                            {companyName} makes it easy to find what you're
                            looking for.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-2xl font-semibold mb-2">
                            🖥️ Dedicated Spaces for Movies and TV Series
                        </h3>
                        <p className="text-lg mb-4">
                            Our site offers dedicated sections for movies and TV
                            series. Navigate between pages for an enriched
                            browsing experience, designed to help you discover
                            content effortlessly.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-2xl font-semibold mb-2">
                            🔑 User Authentication and Personal Lists
                        </h3>
                        <p className="text-lg mb-4">
                            When you authenticate, a world of personalization
                            opens up. Create custom lists with unique names and
                            descriptions. Add your favorite movies and series to
                            these lists and manage them as you wish. Edit,
                            delete, or publish your lists anytime.
                        </p>
                        <p className="text-lg mb-4">
                            By publishing your lists, you can share them with
                            the community. Visit the *Public Lists* section to
                            explore lists shared by others, and when accessing
                            any list, you can see all the movies and series
                            included.
                        </p>
                    </div>

                    <h2 className="text-3xl font-semibold mb-4">
                        Why {companyName}? 🌟
                    </h2>
                    <p className="text-lg mb-4">
                        {companyName} provides a seamless, feature-rich platform
                        for movie and TV series enthusiasts to explore,
                        organize, and share their favorites with the community.
                        Whether you're creating a private collection or
                        discovering public lists, {companyName} makes every
                        moment enjoyable. Start browsing today!
                    </p>
                    <h2 className="text-3xl font-semibold m-6">
                        Made By Yassine BenZriouil 👍
                    </h2>
                    <h4 className="text-3xl font-semibold mb-4">
                        Contact me :
                    </h4>
                    <h4>yassinebenzriouil7@gmail.com</h4>
                </div>
            </Animations>
        </div>
    );
}
