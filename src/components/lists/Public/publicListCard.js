import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../../auth/firebase";
import { getDoc, doc } from "firebase/firestore";

export default function PublicListCard({ list, handleDeleteList }) {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            let userRef = list.user;

            if (userRef && typeof userRef === "string") {
                const userId = userRef.split("/").pop();
                userRef = doc(db, "Users", userId);
            }

            if (userRef) {
                try {
                    const userDocument = await getDoc(userRef);
                    if (userDocument.exists()) {
                        setUserData(userDocument.data());
                    } else {
                        console.log("User not found");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [list.user]);

    return (
        <div key={list.id} className="block">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                {userData ? (
                    <h2>{userData.userName}</h2> // Display username or any field from userData
                ) : (
                    <p>Loading user...</p>
                )}
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    {list.listName.toUpperCase() || "Untitled List"}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {list.description || "No description available"}
                </p>

                <div className="flex space-x-4">
                    <Link to={`/publicListInside/${list.id}`}>
                        <button className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                            <i className="fa-solid fa-eye"></i>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
