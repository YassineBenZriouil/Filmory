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
            customToast("List saved", "success");
            navigate("/myLists"); // Redirect to MyLists page after updating
        } catch (error) {
            console.error("Error updating list:", error);
        }
    };

    return (
        <div className="page flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md">
                <div className="panel p-6 md:p-8 w-full space-y-6">
                    <h1 className="page-title">
                        Edit List
                    </h1>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div>
                            <label
                                className="label"
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
                                className="field"
                            />
                        </div>
                        <div>
                            <label
                                className="label"
                                htmlFor="description"
                            >
                                Description
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                value={listData.description}
                                onChange={handleInputChange}
                                className="field"
                            />
                        </div>
                        <div>
                            <label
                                className="label"
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
                                className="w-full field opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                        >
                            Update List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
