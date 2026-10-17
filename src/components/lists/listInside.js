import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchListById, removeItemFromList } from "../../movie/databaseFetcher";
import SmallCard from "../smallCard";
import CardGrid from "../cardGrid";
import { SkeletonGrid } from "../../static/loading";
import { fetchOneMovie, fetchOneSerie } from "../../movie/oneFetcher";

export default function ListInside() {
    const { id } = useParams();
    const [listData, setListData] = useState(null);
    const [worksData, setWorksData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchListData = async () => {
            try {
                const list = await fetchListById(id);
                if (list) {
                    console.log("Fetched list:", list);
                    setListData(list);
                    await fetchWorksData(list.works); // Fetch the details of all works
                } else {
                    setError("List not found.");
                }
            } catch (err) {
                setError("Error fetching the list.");
                console.error(err);
            }
        };

        fetchListData();
    }, [id]);

    const fetchWorksData = async (works) => {
        try {
            const movieIds = works?.movie || [];
            const tvIds = works?.tv || [];

            // Fetch movie and TV show data
            const moviesData = await Promise.all(
                movieIds.map((movieId) => fetchOneMovie(movieId))
            );
            const tvShowsData = await Promise.all(
                tvIds.map((tvId) => fetchOneSerie(tvId))
            );

            // Combine and set the data
            const allWorks = [
                ...moviesData.map((movie) => ({ ...movie, type: "movie" })),
                ...tvShowsData.map((tv) => ({ ...tv, type: "tv" })),
            ];

            setWorksData(allWorks);
        } catch (err) {
            console.error("Error fetching works data:", err);
        }
    };

    const handleRemoveWork = async (workId, type) => {
        try {
            // Call removeItemFromList with the correct parameters (id, workId, type)
            await removeItemFromList(id, workId, type);

            // Refetch the list to get updated works
            const updatedList = await fetchListById(id);
            if (updatedList) {
                setListData(updatedList); // Update list data
                await fetchWorksData(updatedList.works); // Update works data
            }
        } catch (error) {
            console.error(`Error removing work: `, error);
        }
    };

    return (
        <div className="min-h-screen pb-5">
            {error && <p className="page text-velvet">{error}</p>}
            {listData ? (
                <div className="page">
                    <div>
                        <h1 className="page-title">
                            {listData.listName}
                        </h1>
                        <p className="mt-3 max-w-[68ch] text-grain">
                            {listData.description}
                        </p>

                        <div className="mt-6">
                            <Link
                                to="/"
                                className="btn btn-primary"
                            >
                                <i className="fa-solid fa-plus" aria-hidden="true"></i> Add films
                            </Link>
                        </div>
                    </div>

                    <div className="mt-10">
                    <CardGrid>
                        {worksData.length > 0 ? (
                            worksData.map((work) => (
                                <div
                                    key={work.id}
                                    className="flex flex-col"
                                >
                                    <SmallCard
                                            data={work}
                                            type={work.type}
                                        />
                                    <button
                                        className="btn btn-destructive mt-1 self-start border-0 px-2 text-sm"
                                        aria-label={`Remove ${work.title || work.name}`}
                                        onClick={() =>
                                            handleRemoveWork(work.id, work.type)
                                        }
                                    >
                                        <i className="fa-solid fa-trash" aria-hidden="true"></i> Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-grain">
                                This list is empty.
                            </p>
                        )}
                    </CardGrid>
                    </div>
                </div>
            ) : (
                !error && (
                    <div className="page">
                        <SkeletonGrid count={10} />
                    </div>
                )
            )}
        </div>
    );
}
