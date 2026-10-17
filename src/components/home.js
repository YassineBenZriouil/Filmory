import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import {
    fetchAllPopularMovies,
    fetchAllLatestMovies,
    fetchLatestSeries,
    fetchPopularSeries,
} from "../movie/allFetcher";
import SmallCard from "./smallCard";
import Hero from "./hero";
import CardRow from "./cardRow";

// Only signed-in people follow anyone, so its code (and Firestore) loads only for them.
const FollowingRow = lazy(() => import("./followingRow"));

const ROWS = [
    { title: "Popular movies", fetch: fetchAllPopularMovies, type: "movie", seeAll: "/movies" },
    { title: "New movies", fetch: fetchAllLatestMovies, type: "movie", seeAll: "/movies" },
    { title: "Popular series", fetch: fetchPopularSeries, type: "tv", seeAll: "/tvShows" },
    { title: "New series", fetch: fetchLatestSeries, type: "tv", seeAll: "/tvShows" },
];

export default function Home() {
    const { user } = useAuth();
    const [rows, setRows] = useState(ROWS.map(() => []));
    const [failed, setFailed] = useState(ROWS.map(() => false));

    // Fetchers return null on failure; that row then offers "Try again".
    const loadRow = useCallback(async (i) => {
        setFailed((prev) => prev.map((f, j) => (j === i ? false : f)));
        const data = await ROWS[i].fetch();
        if (data) setRows((prev) => prev.map((r, j) => (j === i ? data : r)));
        else setFailed((prev) => prev.map((f, j) => (j === i ? true : f)));
    }, []);

    useEffect(() => {
        ROWS.forEach((_, i) => loadRow(i));
    }, [loadRow]);

    return (
        <div className="pb-10">
            <h1 className="sr-only">Home</h1>
            <Hero movies={rows[0]} />
            <div className="pt-4">
                {user && (
                    <Suspense fallback={null}>
                        <FollowingRow />
                    </Suspense>
                )}
                {ROWS.map(({ title, type, seeAll }, i) => (
                    <CardRow key={title} title={title} seeAll={seeAll} failed={failed[i]} onRetry={() => loadRow(i)}>
                        {rows[i].map((item) => (
                            <SmallCard key={item.id} data={item} type={type} />
                        ))}
                    </CardRow>
                ))}
            </div>
        </div>
    );
}
