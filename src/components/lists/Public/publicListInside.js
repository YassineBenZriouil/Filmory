import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchListById, likeaList } from "../../../movie/databaseFetcher";
import SmallCard from "../../smallCard";
import { fetchOneMovie, fetchOneSerie } from "../../../movie/oneFetcher";
import { db } from "../../../auth/firebase";
import { getDoc, doc } from "firebase/firestore";

export default function PublicListInside() {
    const { id } = useParams(); // The list ID from the URL
    const [listData, setListData] = useState(null);
    const [worksData, setWorksData] = useState([]);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Fetch list data first
        const fetchListData = async () => {
            try {
                const list = await fetchListById(id); // Fetch the list data
                if (list) {
                    setListData(list);
                    await fetchWorksData(list.works); // Fetch works once list is available
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

    useEffect(() => {
        // Fetch user data only when listData is available
        if (listData && listData.user) {
            const fetchUserData = async () => {
                let userRef = listData.user;

                if (typeof userRef === "string") {
                    const userId = userRef.split("/").pop();
                    userRef = doc(db, "Users", userId); // Create reference if it's an ID
                }

                try {
                    const userDocument = await getDoc(userRef);
                    if (userDocument.exists()) {
                        setUserData(userDocument.data());
                    } else {
                        console.log("User not found");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            };

            fetchUserData();
        }
    }, [listData]); // Trigger only when listData changes

    const fetchWorksData = async (works) => {
        try {
            const movieIds = works?.movie || [];
            const tvIds = works?.tv || [];

            const moviesData = await Promise.all(
                movieIds.map((movieId) => fetchOneMovie(movieId))
            );
            const tvShowsData = await Promise.all(
                tvIds.map((tvId) => fetchOneSerie(tvId))
            );

            const allWorks = [
                ...moviesData.map((movie) => ({ ...movie, type: "movie" })),
                ...tvShowsData.map((tv) => ({ ...tv, type: "tv" })),
            ];

            setWorksData(allWorks);
        } catch (err) {
            console.error("Error fetching works data:", err);
        }
    };

    return (
        <div className="bg-white min-h-screen text-black dark:bg-black dark:text-white pb-5">
            {error && <p className="text-red-500 text-center">{error}</p>}
            {listData ? (
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        {userData ? (
                            <h1>{userData.userName}</h1> // Display user name once userData is fetched
                        ) : (
                            <p>Loading user...</p>
                        )}
                        <h1 className="text-3xl font-bold text-black dark:text-white">
                            {listData.listName.toUpperCase()}
                        </h1>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                            {listData.description}
                        </p>
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
