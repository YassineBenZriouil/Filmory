import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchListById, likeaList } from "../../../movie/databaseFetcher";
import SmallCard from "../../smallCard";
import CardGrid from "../../cardGrid";
import { SkeletonGrid } from "../../../static/loading";
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
        <div className="min-h-screen pb-5">
            {error && <p className="page text-velvet">{error}</p>}
            {listData ? (
                <div className="page">
                    <div>
                        {userData ? (
                            <p className="mb-3 text-grain">By {userData.userName}</p>
                        ) : (
                            <div className="skeleton mb-3 h-4 w-[120px] rounded" />
                        )}
                        <h1 className="page-title">
                            {listData.listName}
                        </h1>
                        <p className="mt-3 max-w-[68ch] text-grain">
                            {listData.description}
                        </p>
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
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-grain">
                                Nothing in this list yet.
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
