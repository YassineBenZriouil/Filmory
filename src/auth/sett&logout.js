import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { getDoc, doc } from "firebase/firestore";
import Animations from "./../static/animations";
import { customToast } from "../static/toast";

export default function Logout() {
    const [userDetails, setUserDetails] = useState({});
    const [isadmin, setIsadmin] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("cart");
        customToast("User logged out successfully", "success");
        navigate("/register");
    };

    const fetchUserDetails = async () => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "Users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserDetails(docSnap.data());
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            }
        });
    };

    useEffect(() => {
        fetchUserDetails();
        checkAdmin();
    }, []);

    const checkAdmin = () => {
        if (localStorage.getItem("loggedInUser") === "admin@admin.com") {
            setIsadmin(true);
        }
    };

    const handelpanel = () => {
        navigate("/adminopt");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-white">
            <Animations>
                <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-80 space-y-6 mx-auto">
                    <h3 className="text-xl font-semibold text-center">
                        Welcome to {process.env.REACT_APP_COMPANY_NAME}
                    </h3>
                    <h5 className="text-lg font-medium text-center">
                        {userDetails.userName || "Guest"}
                    </h5>
                    <p className="text-sm text-center">
                        Email: {userDetails.email || "No email found"}
                    </p>
                    <div className="space-y-3">
                        <button
                            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                        {isadmin && (
                            <button
                                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={handelpanel}
                            >
                                Admin Panel
                            </button>
                        )}
                    </div>
                </div>
            </Animations>
        </div>
    );
}
