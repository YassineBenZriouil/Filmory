import React, { useEffect, useState } from "react";
import Animations from "../../../static/animations";
import { fetchAllPublicLists } from "../../../movie/databaseFetcher"; // Import the correct fetch function
import { searchListByQuery } from "../../../movie/databaseFetcher";
import PublicListCard from "./publicListCard";

export default function PublicLists() {
    const [lists, setLists] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLists = async () => {
            const publicLists = await fetchAllPublicLists(); // Fetch public lists
            setLists(publicLists);
        };

        fetchLists();
    }, []);

    const handleSearch = async (searchQuery) => {
        if (searchQuery === "") {
            const publicLists = await fetchAllPublicLists(); // If no search query, fetch all public lists
            setLists(publicLists);
        } else {
            const searchedLists = await searchListByQuery(searchQuery);
            setLists(searchedLists);
        }
    };

    return (
        <div className="min-h-screen  flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center  justify-center w-full max-w-4xl m-3">
                <Animations>
                    <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                        <h1 className="text-3xl font-bold text-center">
                            Public Lists
                        </h1>
                        <p>Take a Look At other people's lists </p>
                        <div className="text-center">
                            <input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value); // Update the search query state
                                    handleSearch(e.target.value); // Trigger search on every change
                                }}
                                placeholder="Search Lists With key Words"
                                type="text"
                                className="mt-4 w-full p-2 bg-gray-300 text-black rounded-l-md dark:bg-gray-700 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-4">
                            {lists.length > 0 ? (
                                lists.map((list) => (
                                    <PublicListCard key={list.id} list={list} />
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                                    No lists found...
                                </p>
                            )}
                        </div>
                    </div>
                </Animations>
            </div>
        </div>
    );
}
