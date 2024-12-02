import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchAllSeriesBySearchQuery } from "../../movie/allFetcher";

export default function SearchDivTv() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchQueryResults, setSearchQueryResults] = useState([]);
    const [resultsDivShowen, setResultsDivShowen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSearch = async (query) => {
        if (query.trim() === "") {
            setSearchQueryResults([]);
            setResultsDivShowen(false);
            return;
        }
        const results = await fetchAllSeriesBySearchQuery(query);
        setSearchQueryResults(results);
        setResultsDivShowen(true);
    };

    const closeResultsDiv = () => {
        setResultsDivShowen(false);
    };

    return (
        <div className="relative flex items-center space-x-2 w-full max-w-md">
            <div className="flex w-full">
                <input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    placeholder="Search Series..."
                    type="text"
                    className="w-full p-2 bg-gray-300 text-black rounded-l-md dark:bg-gray-700 dark:text-white focus:outline-none rounded-md"
                />
            </div>
            {resultsDivShowen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-12 right-0 w-full bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md shadow-lg z-10 overflow-hidden"
                >
                    <div className="max-h-90 overflow-y-auto">
                        {searchQueryResults.slice(0, 5).map((result) => (
                            <Link
                                key={result.id}
                                to={`/movieDetails/${result.id}/tv`}
                                className="flex items-center p-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                                onClick={closeResultsDiv}
                            >
                                <img
                                    src={
                                        result.poster_path
                                            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                                            : "https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-pic-design-profile-vector-png-image_40966566.jpg"
                                    }
                                    alt={result.title}
                                    className="w-12 h-12 object-cover rounded-md"
                                />
                                <p className="ml-3">{result.name}</p>
                            </Link>
                        ))}
                        {searchQueryResults.length === 0 && (
                            <p className="p-2 text-center">No results found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
