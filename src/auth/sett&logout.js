import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { getDoc, doc } from "firebase/firestore";
import { customToast } from "../static/toast";

export default function Logout() {
    const [userDetails, setUserDetails] = useState({});
    const [isadmin, setIsadmin] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("cart");
        customToast("Logged out", "success");
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
        <div className="page flex min-h-[70vh] items-center justify-center">
                <div className="panel w-full max-w-sm space-y-6 p-6 md:p-8">
                    <h1 className="font-display text-[31px] font-extrabold">
                        Welcome to {process.env.REACT_APP_COMPANY_NAME || "Filmory"}
                    </h1>
                    <h5 className="text-lg font-bold">
                        {userDetails.userName || "Guest"}
                    </h5>
                    <p className="text-sm text-grain">
                        Email: {userDetails.email || "No email found"}
                    </p>
                    <div className="space-y-3">
                        <button
                            className="btn btn-destructive w-full"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                        {isadmin && (
                            <button
                                className="btn btn-primary w-full"
                                onClick={handelpanel}
                            >
                                Admin Panel
                            </button>
                        )}
                    </div>
                </div>
        </div>
    );
}
