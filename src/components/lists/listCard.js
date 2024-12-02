import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { handlepublication } from "../../movie/databaseFetcher";

export default function ListCard({ list, handleDeleteList }) {
    const [isPublic, setIsPublic] = useState(list.isPublic);

    const handleTogglePublication = async (event, listId) => {
        event.stopPropagation(); // Prevent navigation
        try {
            await handlepublication(listId);
            setIsPublic((prev) => !prev); // Update the state to reflect the change
        } catch (error) {
            console.error("Error updating publication status:", error);
        }
    };

    return (
        <div key={list.id} className="block">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    {list.listName.toUpperCase() || "Untitled List"}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {list.description || "No description available"}
                </p>

                <div className="flex space-x-4">
                    <button
                        onClick={(e) => handleDeleteList(e, list.id)}
                        className="bg-red-600 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                    >
                        <i className="fa-solid fa-trash"></i> Delete
                    </button>
                    <Link
                        to={`/updList/${list.id}`}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
                    >
                        <i className="fa-solid fa-pen"></i> Edit
                    </Link>

                    <Link to={`/listInside/${list.id}`}>
                        <button className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                            <i className="fa-solid fa-eye"></i>
                        </button>
                    </Link>

                    <button
                        onClick={(e) => handleTogglePublication(e, list.id)}
                        className={`${
                            isPublic
                                ? "bg-green-600 hover:bg-green-800"
                                : "bg-gray-600 hover:bg-gray-800"
                        } text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200`}
                    >
                        <i
                            className={`fa-solid ${
                                isPublic ? "fa-toggle-on" : "fa-toggle-off"
                            }`}
                        ></i>
                        {isPublic ? " Public" : " Private"}
                    </button>
                </div>
            </div>
        </div>
    );
}
