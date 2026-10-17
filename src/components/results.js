import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { filteredFetcher } from "../movie/allFetcher";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { SkeletonGrid } from "../static/loading";

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
            const data = await filteredFetcher(
                selectedType,
                selectedYear,
                genres,
                country
            );
            setResults(data || []);
            setLoading(false);
        };

        fetchResults();
    }, [selectedType, selectedYear, selectedGenreIds, selectedCountryIso]);

    const type = selectedType === "tv" ? "tv" : "movie";

    return (
        <div className="page">
            <h1 className="page-title">Results</h1>
            <div className="mt-8">
                {loading ? (
                    <SkeletonGrid />
                ) : results.length > 0 ? (
                    <CardGrid>
                        {results.map((item) => (
                            <SmallCard key={item.id} data={item} type={type} />
                        ))}
                    </CardGrid>
                ) : (
                    <div className="space-y-4">
                        <p className="text-grain">No films match these filters.</p>
                        <Link to="/filter" className="btn btn-secondary">
                            Change filters
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
