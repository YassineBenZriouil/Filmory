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
        <div className="relative w-full">
            <div className="flex w-full">
                <input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    placeholder="Search Series..."
                    type="text"
                    className="field"
                />
            </div>
            {resultsDivShowen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-12 right-0 w-full bg-leader text-screen border border-reel rounded-[14px] z-10 overflow-hidden"
                >
                    <div className="max-h-90 overflow-y-auto">
                        {searchQueryResults.slice(0, 5).map((result) => (
                            <Link
                                key={result.id}
                                to={`/movieDetails/${result.id}/tv`}
                                className="flex items-center p-2 hover:bg-reel transition-colors duration-quick"
                                onClick={closeResultsDiv}
                            >
                                <img
                                    src={
                                        result.poster_path
                                            ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                                            : "https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-pic-design-profile-vector-png-image_40966566.jpg"
                                    }
                                    alt={result.title}
                                    className="h-[69px] w-[46px] shrink-0 rounded-[3px] object-cover"
                                    loading="lazy"
                                />
                                <p className="ml-3">{result.name}</p>
                            </Link>
                        ))}
                        {searchQueryResults.length === 0 && (
                            <p className="p-3 text-grain">Nothing found. Try the original title.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
