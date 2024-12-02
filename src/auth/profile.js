/* eslint-disable react/jsx-no-comment-textnodes */
import React, { useState, useEffect } from "react";
import Register from "./register";
import Logout from "./sett&logout";

export default function Profile() {
    const [loggedInUser, setLoggedInUser] = useState(
        localStorage.getItem("loggedInUser")
    );

    useEffect(() => {
        const handleStorageChange = () => {
            setLoggedInUser(localStorage.getItem("loggedInUser"));
        };
        window.addEventListener("storage", handleStorageChange);

        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return <>{loggedInUser ? <Logout /> : <Register />}</>;
}
