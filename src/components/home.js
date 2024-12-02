import React, { useEffect, useState } from "react";
import {
    fetchAllPopularMovies,
    fetchAllLatestMovies,
    fetchLatestSeries,
    fetchPopularSeries,
} from "../movie/allFetcher";
import SmallCard from "./smallCard";
import Carousel from "./carousel";
import Animations from "../static/animations";
import { Link } from "react-router-dom";

export default function Home() {
    const [popularMovies, setPopularMovies] = useState([]);
    const [latestMovies, setLatestMovies] = useState([]);
    const [popularSeries, setPopularSeries] = useState([]);
    const [latestSeries, setLatestSeries] = useState([]);

    const getPopularMovies = async () => {
        try {
            const data = await fetchAllPopularMovies();
            setPopularMovies(data || []); // Fallback to an empty array if data is undefined
        } catch (error) {
            console.error("Error fetching popular movies:", error);
        }
    };

    const getLatestMovies = async () => {
        try {
            const data = await fetchAllLatestMovies();
            setLatestMovies(data || []); // Fallback to an empty array if data is undefined
        } catch (error) {
            console.error("Error fetching latest movies:", error);
        }
    };

    const getPopularSeries = async () => {
        try {
            const data = await fetchPopularSeries();
            setPopularSeries(data || []); // Fallback to an empty array if data is undefined
        } catch (error) {
            console.error("Error fetching popular series:", error);
        }
    };

    const getLatestSeries = async () => {
        try {
            const data = await fetchLatestSeries();
            setLatestSeries(data || []); // Fallback to an empty array if data is undefined
        } catch (error) {
            console.error("Error fetching latest series:", error);
        }
    };

    useEffect(() => {
        getPopularMovies();
        getLatestMovies();
        getPopularSeries();
        getLatestSeries();
    }, []);

    console.log(popularMovies);
    console.log(latestMovies);
    console.log(popularSeries);
    console.log(latestSeries);

    const limit = 8;

    return (
        <div className="bg-white min-h-screen text-black dark:bg-black pb-5 dark:text-white">
            <div className="py-6">
                <Animations>
                    <Carousel movies={popularMovies} />
                </Animations>
            </div>
            <Animations>
                <div>
                    <h1 className="text-black dark:text-white text-2xl font-bold ml-20 m-3 uppercase">
                        Popular Movies
                    </h1>

                    <div className="md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center">
                        {popularMovies.slice(0, limit).map((popularMovie) => (
                            <Link to={`/movieDetails/${popularMovie.id}/movie`}>
                                <SmallCard
                                    data={popularMovie}
                                    key={popularMovie.id}
                                    type="movie"
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </Animations>
            <Animations>
                <div>
                    <h1 className="text-black dark:text-white text-2xl font-bold ml-20 m-3 uppercase">
                        Latest Movies
                    </h1>
                    <div className="md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center">
                        {latestMovies.slice(0, limit).map((latestMovie) => (
                            <Link to={`/movieDetails/${latestMovie.id}/movie`}>
                                <SmallCard
                                    data={latestMovie}
                                    key={latestMovie.id}
                                    type="movie"
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </Animations>
            <Animations>
                <div>
                    <h1 className="text-black dark:text-white text-2xl font-bold ml-20 m-3 uppercase">
                        Popular Series
                    </h1>
                    <div className="md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center">
                        {popularSeries.slice(0, limit).map((popularSerie) => (
                            <Link to={`/movieDetails/${popularSerie.id}/tv`}>
                                <SmallCard
                                    data={popularSerie}
                                    key={popularSerie.id}
                                    type="tv"
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </Animations>
            <Animations>
                <div>
                    <h1 className="text-black dark:text-white text-2xl font-bold ml-20 m-3 uppercase">
                        Latest Series
                    </h1>
                    <div className="md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center">
                        {latestSeries.slice(0, limit).map((latestSerie) => (
                            <Link to={`/movieDetails/${latestSerie.id}/tv`}>
                                <SmallCard
                                    data={latestSerie}
                                    key={latestSerie.id}
                                    type="tv"
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </Animations>
        </div>
    );
}
