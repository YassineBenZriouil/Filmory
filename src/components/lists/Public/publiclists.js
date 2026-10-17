import React, { useEffect, useState } from "react";
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
        <div className="page flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-4xl">
                    <div className="panel p-6 md:p-8 w-full space-y-6">
                        <h1 className="page-title">
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
                                className="field mt-4"
                            />
                        </div>
                        <div className="space-y-4">
                            {lists.length > 0 ? (
                                lists.map((list) => (
                                    <PublicListCard key={list.id} list={list} />
                                ))
                            ) : (
                                <p className="text-grain">
                                    No lists found...
                                </p>
                            )}
                        </div>
                    </div>
            </div>
        </div>
    );
}
