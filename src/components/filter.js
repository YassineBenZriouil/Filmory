import React, { useState, useEffect } from "react";
import { fetchMovieGeneres, fetchSeriesGeneres } from "./../movie/allFetcher";
import { useNavigate } from "react-router-dom";
import SearchDivMovie from "./SearchBars/searchDivMovie";
import SearchDivTv from "./SearchBars/searchDivTv";
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
        <div className="page flex justify-center">
                <form
                    onSubmit={handleSubmit}
                    className="panel w-full max-w-2xl space-y-6 p-6 md:p-8"
                >
                    <SearchDivMovie />
                    <SearchDivTv />
                    <h1 className="page-title">
                        Filter
                    </h1>
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
                                    className="h-5 w-5 accent-[rgb(var(--beam))]"
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
                                    className="h-5 w-5 accent-[rgb(var(--beam))]"
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
                                        className="h-5 w-5 accent-[rgb(var(--beam))]"
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
                                        className="h-5 w-5 accent-[rgb(var(--beam))]"
                                    />
                                    <span>{genre.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Filter
                        </button>
                    </div>
                </form>
        </div>
    );
}
