import React, { useState, useEffect } from "react";
import { fetchMovieGeneres, fetchSeriesGeneres } from "./../movie/allFetcher";
import { useNavigate } from "react-router-dom";
import SearchDivMovie from "./SearchBars/searchDivMovie";
import SearchDivTv from "./SearchBars/searchDivTv";
import Animations from "../static/animations";
import Loading from "./../static/loading";

export default function Filter() {
    const [years, setYears] = useState([]);
    const [genres, setGenres] = useState([]);
    const [selectedType, setSelectedType] = useState("movie");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state for API requests
    const navigate = useNavigate();

    const fetchGenres = async (type) => {
        setLoading(true);
        const fetchedGenres =
            type === "movie"
                ? await fetchMovieGeneres()
                : await fetchSeriesGeneres();
        setGenres(fetchedGenres);
        setLoading(false);
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        fetchGenres(type);
    };

    useEffect(() => {
        const thisYear = new Date().getFullYear();
        setYears(Array.from({ length: 5 }, (_, k) => thisYear - k).reverse());
        fetchGenres("movie");
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const selectedGenreIds = genres
            .filter((genre) => selectedGenres.includes(genre.name))
            .map((genre) => genre.id);

        navigate("/results", {
            state: {
                selectedType,
                selectedYear,
                selectedGenreIds,
            },
        });
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white p-6">
            <Animations className>
                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-200 text-black p-8 dark:bg-gray-900 dark:text-white shadow-lg rounded-lg  space-y-6 w-full "
                >
                    <SearchDivMovie />
                    <SearchDivTv />
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Filter
                    </h2>
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Type:</h3>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="type"
                                    value="movie"
                                    checked={selectedType === "movie"}
                                    onChange={() => handleTypeChange("movie")}
                                    className="form-radio h-5 w-5 text-blue-500"
                                />
                                <span>Movie</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="type"
                                    value="tv"
                                    checked={selectedType === "tv"}
                                    onChange={() => handleTypeChange("tv")}
                                    className="form-radio h-5 w-5 text-blue-500"
                                />
                                <span>TV Show</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Release Year:</h3>
                        <div className="space-y-2">
                            {years.map((year) => (
                                <label
                                    key={year}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="radio"
                                        name="year"
                                        value={year}
                                        checked={selectedYear === year}
                                        onChange={() => setSelectedYear(year)}
                                        className="form-radio h-5 w-5 text-blue-500 checked:text-blue-500"
                                    />
                                    <span>{year}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Genres:</h3>
                        <div className="space-y-2">
                            {genres.map((genre) => (
                                <label
                                    key={genre.id}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="checkbox"
                                        name="genre"
                                        value={genre.name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedGenres((prevGenres) =>
                                                prevGenres.includes(value)
                                                    ? prevGenres.filter(
                                                          (g) => g !== value
                                                      )
                                                    : [...prevGenres, value]
                                            );
                                        }}
                                        className="form-checkbox h-5 w-5 text-blue-500"
                                    />
                                    <span>{genre.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className=" bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                        >
                            Filter
                        </button>
                    </div>
                </form>
            </Animations>
        </div>
    );
}
