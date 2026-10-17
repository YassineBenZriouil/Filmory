import React, { useEffect, useState } from "react";
import SmallCard from "./smallCard";
import CardGrid from "./cardGrid";
import { Pager } from "./movies";
import { fetchAllPopularSeriesByPage } from "../movie/allFetcher";
import { SkeletonGrid } from "../static/loading";

export default function Tvshows() {
    const [series, setSeries] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const totalPages = 20;

    const getPopularSeries = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const data = await fetchAllPopularSeriesByPage(pageNumber);
            if (data) {
                setSeries(data);
            }
        } catch (error) {
            console.error("Error fetching popular series:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPopularSeries(page);
        localStorage.setItem("currentTvPage", page);
    }, [page]);

    useEffect(() => {
        const storedPage = localStorage.getItem("currentTvPage");
        if (storedPage) {
            setPage(parseInt(storedPage, 10));
        }
    }, []);

    return (
        <div className="page">
            <h1 className="page-title">TV shows</h1>
            <p className="mt-2 text-grain">Most popular on TMDB this week</p>
            <div className="mt-8">
                {loading ? (
                    <SkeletonGrid />
                ) : (
                    <CardGrid>
                        {series.map((show) => (
                            <SmallCard key={show.id} data={show} type="tv" />
                        ))}
                    </CardGrid>
                )}
            </div>
            <Pager page={page} totalPages={totalPages} setPage={setPage} />
        </div>
    );
}
