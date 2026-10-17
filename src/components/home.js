import React, { useEffect, useState } from "react";
import {
    fetchAllPopularMovies,
    fetchAllLatestMovies,
    fetchLatestSeries,
    fetchPopularSeries,
} from "../movie/allFetcher";
import SmallCard from "./smallCard";
import Carousel from "./carousel";
import CardRow from "./cardRow";

const ROWS = [
    { title: "Popular movies", fetch: fetchAllPopularMovies, type: "movie", seeAll: "/movies" },
    { title: "New movies", fetch: fetchAllLatestMovies, type: "movie", seeAll: "/movies" },
    { title: "Popular series", fetch: fetchPopularSeries, type: "tv", seeAll: "/tvShows" },
    { title: "New series", fetch: fetchLatestSeries, type: "tv", seeAll: "/tvShows" },
];

export default function Home() {
    const [rows, setRows] = useState(ROWS.map(() => []));

    useEffect(() => {
        ROWS.forEach(async ({ title, fetch }, i) => {
            try {
                const data = (await fetch()) || [];
                setRows((prev) => prev.map((r, j) => (j === i ? data : r)));
            } catch (error) {
                console.error(`Error fetching ${title}:`, error);
            }
        });
    }, []);

    return (
        <div className="pb-10">
            <h1 className="sr-only">Home</h1>
            <div className="py-6">
                <Carousel movies={rows[0]} />
            </div>
            {ROWS.map(({ title, type, seeAll }, i) => (
                <CardRow key={title} title={title} seeAll={seeAll}>
                    {rows[i].map((item) => (
                        <SmallCard key={item.id} data={item} type={type} />
                    ))}
                </CardRow>
            ))}
        </div>
    );
}
