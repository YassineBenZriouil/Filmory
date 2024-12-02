import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchListById, removeItemFromList } from "../../movie/databaseFetcher";
import SmallCard from "../smallCard";
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
        <div className="bg-white min-h-screen text-black dark:bg-black dark:text-white pb-5">
            {error && <p className="text-red-500 text-center">{error}</p>}
            {listData ? (
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-black dark:text-white">
                            {listData.listName.toUpperCase()}
                        </h1>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                            {listData.description}
                        </p>

                        <div className="mt-6">
                            <Link
                                to="/"
                                className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg"
                            >
                                <i className="fa-solid fa-plus"></i> Add Movie
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {worksData.length > 0 ? (
                            worksData.map((work) => (
                                <div
                                    key={work.id}
                                    className="flex flex-col items-center"
                                >
                                    <Link
                                        to={`/movieDetails/${work.id}/${work.type}`}
                                    >
                                        <SmallCard
                                            data={work}
                                            type={work.type}
                                        />
                                    </Link>
                                    <button
                                        className="mt-2 text-red-500 hover:text-red-700"
                                        onClick={() =>
                                            handleRemoveWork(work.id, work.type)
                                        }
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">
                                No works found...
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                    Loading list...
                </p>
            )}
        </div>
    );
}
