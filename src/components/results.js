import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { filteredFetcher } from "../movie/allFetcher"; // Ensure you import the FilteredFetcher function
import SmallCard from "./smallCard"; // Import your SmallCard component
import Loading from "../static/loading";
import { Link } from "react-router-dom";

export default function Results() {
    const location = useLocation();
    const { selectedType, selectedYear, selectedGenreIds, selectedCountryIso } =
        location.state || {};

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            const genres = selectedGenreIds || [];
            const country = selectedCountryIso || "";
            const data = await filteredFetcher(selectedType, selectedYear, genres, country);
            setResults(data);
            setLoading(false);
        };
    
        fetchResults();
    }, [selectedType, selectedYear, selectedGenreIds, selectedCountryIso]);
    
    return (
        <div className="">
            {loading ? (
                <Loading />
            ) : (
                <div className="pt-5 md:grid-cols-3 lg:grid-cols-4 gap-3 flex flex-wrap align-middle justify-center  bg-white dark:bg-black text-black dark:text-white pb-5">
                    {results.length > 0 ? (
                        results.map((item) => (
                            <Link
                                to={`/movieDetails/${item.id}/${selectedType}`}
                                key={item.id}
                            >
                                <SmallCard
                                    data={item}
                                    type={
                                        selectedType === "movie"
                                            ? "movie"
                                            : "tv"
                                    }
                                />
                            </Link>
                        ))
                    ) : (
                        <p>No results found</p>
                    )}
                </div>
            )}
        </div>
    );
}
