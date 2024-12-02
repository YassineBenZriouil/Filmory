import React, { useEffect, useState } from "react";
import SmallCard from "./smallCard";
import { Link } from "react-router-dom";
import { fetchAllPopularMoviesByPage } from "../movie/allFetcher";
import Loading from "../static/loading";

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(20); // Adjust this to the total number of pages you want to allow

    const getPopularMovies = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const data = await fetchAllPopularMoviesByPage(pageNumber);
            if (data) {
                setMovies(data);
            }
        } catch (error) {
            console.error("Error fetching popular movies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const goPageOne = () => {
        setPage(1);
    };

    useEffect(() => {
        // Fetch movies whenever page state changes
        getPopularMovies(page);
        // Persist the current page in localStorage
        localStorage.setItem("currentMoviePage", page);
    }, [page]); // Only run when `page` changes

    useEffect(() => {
        // On component mount, check if there's a saved page in localStorage
        const storedPage = localStorage.getItem("currentMoviePage");
        if (storedPage) {
            setPage(parseInt(storedPage, 10));
        }
    }, []); // Runs only on mount

    return (
        <div className="pt-5 bg-white min-h-screen text-black dark:bg-black dark:text-white">
            <h1 className="text-black dark:text-white text-2xl font-bold uppercase pl-5">
                Popular Movies
            </h1>
            <div className="pt-5 md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center">
                {loading ? (
                    <Loading />
                ) : (
                    movies.map((popularMovie) => (
                        <Link
                            to={`/movieDetails/${popularMovie.id}/movie`}
                            key={popularMovie.id}
                        >
                            <SmallCard data={popularMovie} type="movie" />
                        </Link>
                    ))
                )}
            </div>
            <div className="flex justify-center items-center p-6">
                <div className="flex gap-2">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white  font-bold py-2 px-4 rounded-md"
                        onClick={goPageOne}
                    >
                        0
                    </button>
                    <button
                        onClick={handlePreviousPage}
                        className={`${
                            page === 1
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-700"
                        } text-white font-bold py-2 px-4 rounded-md`}
                        disabled={page === 1}
                    >
                        {" "}
                        <i className="fas fa-arrow-left"></i>
                    </button>

                    <button className="bg-blue-500 hover:bg-blue-700 text-white  font-bold py-2 px-4 rounded-md">
                        {page} {/* Display current page */}
                    </button>

                    <button
                        onClick={handleNextPage}
                        className={`${
                            page === totalPages
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-700"
                        } text-white font-bold py-2 px-4 rounded-md`}
                        disabled={page === totalPages}
                    >
                        <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
