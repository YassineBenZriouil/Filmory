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
            customToast("Log in to create lists", "error");
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
            customToast("List created", "success");
            navigator("/mylists");
        } catch (error) {
            console.error("Error adding list: ", error);
            customToast("Couldn’t create the list. Try again.", "error");
        }
    };

    return (
        <div className="page flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md">
                <div className="panel p-6 md:p-8 w-full space-y-6">
                    <h1 className="page-title">Add List</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                className="label"
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
                                id="description"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="field"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                        >
                            Add List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
