import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchListById } from "../../movie/databaseFetcher"; // Import the fetch function
import { editListHandler } from "../../movie/databaseFetcher";
import { customToast } from "../../static/toast";

export default function UpdList() {
    const { listId } = useParams(); // Get the listId from the URL
    const [listData, setListData] = useState({
        listName: "",
        description: "",
        likes: 0, // Keep likes in the state, but make it non-editable
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchListData = async () => {
            const data = await fetchListById(listId); // Fetch list data by ID
            if (data) {
                setListData(data);
            } else {
                console.log("List not found");
            }
        };

        fetchListData();
    }, [listId]); // Dependency on listId to fetch new data if changed

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setListData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await editListHandler(listId, listData); // Update list data
            customToast("List updated successfully", "success");
            navigate("/myLists"); // Redirect to MyLists page after updating
        } catch (error) {
            console.error("Error updating list:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center justify-center w-full max-w-md">
                <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                    <h1 className="text-3xl font-bold text-center">
                        Edit List
                    </h1>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                htmlFor="listName"
                            >
                                List Name
                            </label>
                            <input
                                type="text"
                                name="listName"
                                id="listName"
                                value={listData.listName}
                                onChange={handleInputChange}
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
                                name="description"
                                id="description"
                                value={listData.description}
                                onChange={handleInputChange}
                                className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                htmlFor="likes"
                            >
                                Likes
                            </label>
                            <input
                                type="text"
                                name="likes"
                                id="likes"
                                value={listData.likes}
                                disabled
                                className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Update List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
