// MyLists.js
import React, { useEffect, useState } from "react";
import Animations from "../../static/animations";
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
        <div className="min-h-screen  flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center justify-center w-full max-w-4xl m-3">
                <Animations>
                    <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                        <h1 className="text-3xl font-bold text-center">
                            My Lists
                        </h1>
                        <div className="text-center">
                            <Link to="/addList">
                                <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Add A List
                                </button>
                            </Link>
                            <input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value); // Update the search query state
                                    handleSearch(e.target.value); // Trigger search on every change
                                }}
                                placeholder="Search Movies..."
                                type="text"
                                className="mt-4 w-full p-2 bg-gray-300 text-black rounded-l-md dark:bg-gray-700 dark:text-white focus:outline-none"
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
