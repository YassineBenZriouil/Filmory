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
            <div className="border border-reel p-4 rounded-[14px] transition-colors duration-quick hover:border-grain">
                <h3 className="font-display text-[25px] font-semibold mb-2">
                    {list.listName || "Untitled List"}
                </h3>

                <p className="text-sm text-grain mb-2">
                    {list.description || "No description available"}
                </p>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={(e) => handleDeleteList(e, list.id)}
                        className="btn btn-destructive"
                    >
                        <i className="fa-solid fa-trash"></i> Delete
                    </button>
                    <Link
                        to={`/updList/${list.id}`}
                        className="btn btn-secondary"
                    >
                        <i className="fa-solid fa-pen"></i> Edit
                    </Link>

                    <Link
                        to={`/listInside/${list.id}`}
                        className="btn btn-secondary btn-icon"
                        aria-label={`Open ${list.listName}`}
                    >
                        <i className="fa-solid fa-eye" aria-hidden="true"></i>
                    </Link>

                    <button
                        onClick={(e) => handleTogglePublication(e, list.id)}
                        aria-pressed={isPublic}
                        className={`btn btn-secondary ${
                            isPublic ? "border-house text-house" : ""
                        }`}
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
