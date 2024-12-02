import React, { useState } from "react";
import {
    addListhandler,
    fetchingUserUIDByEmail,
} from "../../movie/databaseFetcher";
import { useNavigate } from "react-router-dom";
import { customToast } from "../../static/toast";

export default function AddList() {
    const [listName, setListName] = useState("");
    const [description, setDescription] = useState("");
    const navigator = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userUID = await fetchingUserUIDByEmail();

        if (!userUID) {
            customToast("Please Login First ", "error");
            return;
        }

        const newList = {
            listName,
            description,
            user: `/Users/${userUID}`,
            works: [],
        };

        try {
            await addListhandler(newList);
            setListName("");
            setDescription("");
            customToast("List added successfully!", "success");
            navigator("/mylists");
        } catch (error) {
            console.error("Error adding list: ", error);
            customToast("Failed to add the list.", "error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center justify-center w-full max-w-md">
                <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                    <h1 className="text-3xl font-bold text-center">Add List</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                htmlFor="listName"
                            >
                                List Name
                            </label>
                            <input
                                type="text"
                                id="listName"
                                name="listName"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                required
                                className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                htmlFor="description"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Add List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
