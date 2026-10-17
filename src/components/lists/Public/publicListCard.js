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
            <div className="border border-reel p-4 rounded-[14px] transition-colors duration-quick hover:border-grain">
                {userData ? (
                    <p className="text-[13px] text-grain">{userData.userName}</p>
                ) : (
                    <div className="skeleton h-3 w-[60px] rounded" />
                )}
                <h3 className="font-display text-[25px] font-semibold mb-2">
                    {list.listName || "Untitled List"}
                </h3>

                <p className="text-sm text-grain mb-2">
                    {list.description || "No description available"}
                </p>

                <div className="flex gap-2">
                    <Link
                        to={`/publicListInside/${list.id}`}
                        className="btn btn-secondary btn-icon"
                        aria-label={`Open ${list.listName}`}
                    >
                        <i className="fa-solid fa-eye" aria-hidden="true"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}
