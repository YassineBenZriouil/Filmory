import React from "react";
import { Navigate } from "react-router-dom";
import Account from "./sett&logout";
import Loading from "../static/loading";
import { useAuth } from "./authContext";

// Logged-out visitors go to log in (and come back here), not to account creation.
export default function Profile() {
    const { ready, user } = useAuth();
    if (!ready) return <Loading />;
    return user ? <Account /> : <Navigate to="/login?next=%2Fprofile" replace />;
}
