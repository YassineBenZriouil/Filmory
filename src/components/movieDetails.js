import React, { useState, useEffect, useRef } from "react";
import { fetchOneMovie, fetchOneSerie } from "./../movie/oneFetcher";
import {
    fetchMoviesByGenres,
    fetchSeriesByGenres,
} from "./../movie/allFetcher";
import { useParams } from "react-router-dom";
import Loading from "../static/loading";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { fetchCurrentUserLists } from "../movie/databaseFetcher";
import { addMovieToList } from "../movie/databaseFetcher";
import { customToast } from "../static/toast";

export default function MovieDetails() {
    const { id, type } = useParams();
    const [movie, setMovie] = useState(null);
    const [simular, setSimular] = useState(null);
    const [limit, setLimit] = useState(6);
    const targetRef = useRef(null);
    const [userLists, setUserLists] = useState(null);
    const [loadingLists, setLoadingLists] = useState(true);
    const [chosenList, setChosenList] = useState("");

    const scrollToTarget = () => {
        if (targetRef.current) {
            targetRef.current.scrollIntoView({
                behavior: "smooth",
            });
        }
    };

    const fetchingMovieData = async () => {
        let data;
        if (type === "movie") {
            data = await fetchOneMovie(id);
        } else if (type === "tv") {
            data = await fetchOneSerie(id);
        }
        setMovie(data);
    };

    const fetchingSimularMoviesData = async () => {
        if (movie) {
            const movieGenresids = movie.genres?.map((genre) => genre.id) || [];
            const data = await fetchMoviesByGenres(movieGenresids.slice(0, 1));
            setSimular(data);
        }
    };

    const fetchingSimularSeriesData = async () => {
        if (movie) {
            const movieGenresids = movie.genres?.map((genre) => genre.id) || [];
            const data = await fetchSeriesByGenres(movieGenresids.slice(0, 2));
            setSimular(data);
        }
    };

    useEffect(() => {
        fetchingMovieData();
    }, [id]);

    useEffect(() => {
        if (movie) {
            scrollToTarget();
            if (type === "movie") {
                fetchingSimularMoviesData();
            } else if (type === "tv") {
                fetchingSimularSeriesData();
            }
        }
    }, [movie]);

    useEffect(() => {
        const fetchLists = async () => {
            const userLists = await fetchCurrentUserLists();
            setUserLists(userLists);
            setLoadingLists(false);
        };
        fetchLists();
    }, []);

    const typeCheck = () => {
        return type === "tv"
            ? ["name", "first_air_date"]
            : ["title", "release_date"];
    };

    const handleAddToList = async () => {
        if (!chosenList) {
            customToast("Choose a list first", "error");
            return;
        }

        try {
            await addMovieToList(chosenList, id, type); // id and type represent the item and its type
            customToast(
                `Added to ${userLists?.find((l) => l.id === chosenList)?.listName || "your list"}`,
                "success"
            );
        } catch (error) {
            console.error("Error adding item to list:", error);
            customToast("Couldn’t add it to the list. Try again.", "error");
        }
    };

    const seeMore = () => {
        setLimit((prevLimit) => prevLimit + 6);
    };

    const [titleField, dateField] = typeCheck();

    useEffect(() => {
        if (movie?.[titleField]) {
            document.title = `${movie[titleField]} – ${
                process.env.REACT_APP_COMPANY_NAME || "Filmory"
            }`;
        }
    }, [movie, titleField]);

    if (!movie) {
        return <Loading />;
    }

    if (loadingLists) {
        return <Loading />;
    }

    return (
        <div
            className="min-h-screen bg-cover bg-center flex items-center justify-center"
            style={{
                backgroundImage: `linear-gradient(to right, rgb(var(--booth) / 0.55), rgb(var(--booth) / 0.85)), url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})`,
            }}
        >
                <div
                    ref={targetRef}
                    className="flex flex-col w-fit m-2 p-2 lg:flex-row items-center lg:items-start bg-leader text-screen rounded-[14px] overflow-hidden justify-between"
                >
                    <div className="flex justify-center items-center">
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie[titleField]}
                            className="w-80 lg:w-50 h-auto object-cover rounded"
                        />
                    </div>
                    <div className="text-screen p-2 lg:p-2 lg:w-2/3 space-y-7 align-middle justify-center">
                        <h2 className="text-4xl font-bold">
                            {movie[titleField]}
                        </h2>
                        <div className="flex justify-between text-sm">
                            <p className="text-screen p-2">
                                Rating:{" "}
                                {movie.vote_average?.toFixed(1) || "N/A"} / 10
                            </p>
                            <p className="text-screen p-2">
                                Released:{" "}
                                {new Date(
                                    movie[dateField]
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        <p className="text-base leading-relaxed w-full">
                            {movie.overview ||
                                "Overview not available at the moment."}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    {[
                                        {
                                            label: "Genres",
                                            value:
                                                movie.genres
                                                    ?.map((g) => g.name)
                                                    .join(", ") || "N/A",
                                        },
                                        {
                                            label: "Status",
                                            value: movie.status,
                                        },
                                        {
                                            label: "Safe for Kids",
                                            value: movie.adult ? "NO" : "YES",
                                        },
                                        {
                                            label: movie.runtime
                                                ? "Watch Time"
                                                : "Episode Run Time",
                                            value: movie.runtime
                                                ? `${(
                                                      movie.runtime / 60
                                                  ).toFixed(2)} Hours`
                                                : `${
                                                      movie
                                                          .episode_run_time?.[0] ||
                                                      0
                                                  } Minutes`,
                                        },
                                        {
                                            label: "Popularity",
                                            value: movie.popularity,
                                        },
                                        {
                                            label: "Origin Country",
                                            value:
                                                movie.origin_country?.join(
                                                    ", "
                                                ) || "N/A",
                                        },
                                        {
                                            label: "Language",
                                            value: movie.original_language,
                                        },
                                    ].map(({ label, value }) => (
                                        <tr key={label}>
                                            <td className="px-4 py-2 font-semibold">
                                                {label}:
                                            </td>
                                            <td className="px-4 py-2">
                                                {value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between">
                            <select
                                className="field w-auto cursor-pointer"
                                value={chosenList}
                                onChange={(e) => setChosenList(e.target.value)}
                            >
                                <option value="">Add To List</option>
                                {userLists?.map((list) => (
                                    <option key={list.id} value={list.id}>
                                        {list.listName}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddToList}
                                className="btn btn-primary"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-fill bg-leader text-screen rounded-[14px] overflow-hidden m-2 p-2">
                    <h1 className="text-2xl font-bold ml-20 m-3">
                        Similar {type === "movie" ? "Movies" : "Series"}
                    </h1>
                    <CardGrid>
                        {simular?.slice(0, limit).map((latestMovie) => (
                            <SmallCard
                                key={latestMovie.id}
                                data={latestMovie}
                                type={type === "movie" ? "movie" : "tv"}
                            />
                        ))}
                    </CardGrid>
                    <button
                        className="btn btn-secondary m-3 mx-auto"
                        onClick={seeMore}
                    >
                        See More
                    </button>
                </div>
        </div>
    );
}
