import React, { useEffect, useState } from "react";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { fetchAllPopularMoviesByPage } from "../movie/allFetcher";
import { SkeletonGrid } from "../static/loading";

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const totalPages = 20;

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

    useEffect(() => {
        // Fetch movies whenever page state changes
        getPopularMovies(page);
        // Persist the current page in localStorage
        localStorage.setItem("currentMoviePage", page);
    }, [page]);

    useEffect(() => {
        // On component mount, check if there's a saved page in localStorage
        const storedPage = localStorage.getItem("currentMoviePage");
        if (storedPage) {
            setPage(parseInt(storedPage, 10));
        }
    }, []);

    return (
        <div className="page">
            <h1 className="page-title">Movies</h1>
            <p className="mt-2 text-grain">Most popular on TMDB this week</p>
            <div className="mt-8">
                {loading ? (
                    <SkeletonGrid />
                ) : (
                    <CardGrid>
                        {movies.map((movie) => (
                            <SmallCard key={movie.id} data={movie} type="movie" />
                        ))}
                    </CardGrid>
                )}
            </div>
            <Pager page={page} totalPages={totalPages} setPage={setPage} />
        </div>
    );
}

// Interim pager; Phase 3 replaces it with numbered pages in the URL.
export function Pager({ page, totalPages, setPage }) {
    return (
        <nav
            aria-label="Pages"
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
            <button
                type="button"
                className="btn btn-text"
                onClick={() => setPage(1)}
                disabled={page === 1}
            >
                First
            </button>
            <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
            >
                <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true"></i>
                Previous
            </button>
            <span
                aria-current="page"
                className="min-w-[3ch] px-3 text-center font-display text-[25px] font-extrabold tabular-nums"
            >
                {page}
            </span>
            <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
            >
                Next
                <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true"></i>
            </button>
        </nav>
    );
}
