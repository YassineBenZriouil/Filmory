// MyLists.js
import React, { useEffect, useState } from "react";
import {
    fetchCurrentUserLists,
    deleteListHandler,
} from "../../movie/databaseFetcher";
import { Link } from "react-router-dom";
import { searchListByQuery } from "../../movie/databaseFetcher";
import ListCard from "./listCard"; // Import the ListCard component

export default function MyLists() {
    const [lists, setLists] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLists = async () => {
            const userLists = await fetchCurrentUserLists();
            setLists(userLists);
        };

        fetchLists();
    }, []);

    const handleDeleteList = async (event, listId) => {
        event.stopPropagation(); // Prevent navigation
        try {
            await deleteListHandler(listId);
            setLists((prevLists) =>
                prevLists.filter((list) => list.id !== listId)
            );
        } catch (error) {
            console.error("Error deleting list:", error);
        }
    };

    const handleSearch = async (searchQuery) => {
        if (searchQuery === "") {
            const userLists = await fetchCurrentUserLists(); // If no search query, fetch all lists
            setLists(userLists);
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
                            My Lists
                        </h1>
                        <div>
                            <Link to="/addList" className="btn btn-primary w-full">
                                New list
                            </Link>
                            <input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value); // Update the search query state
                                    handleSearch(e.target.value); // Trigger search on every change
                                }}
                                placeholder="Search your lists"
                                type="text"
                                className="field mt-4"
                            />
                        </div>
                        <div className="space-y-4">
                            {lists.length > 0 ? (
                                lists.map((list) => (
                                    <ListCard
                                        key={list.id}
                                        list={list}
                                        handleDeleteList={handleDeleteList} // Pass the function as a prop
                                    />
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
