import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { loginPath, useAuth } from "../../auth/authContext";
import { joinList } from "../../movie/databaseFetcher";
import { invalidateUserLists } from "../../movie/listsStore";
import { Spinner } from "../../static/controls";
import { customToast } from "../../static/toast";
import Loading from "../../static/loading";

// Opened from an invite link. The list stays hidden until you join, so this page
// can't show its name; the security rules check the invite code when you join.
export default function JoinList() {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { ready, user } = useAuth();
    const [status, setStatus] = useState("idle"); // idle | joining | failed

    const join = async () => {
        setStatus("joining");
        try {
            await joinList(id, token);
            invalidateUserLists();
            customToast("You joined the list. Add films and mark the ones you want to watch.", "success");
            navigate(`/listInside/${id}`, { replace: true });
        } catch (error) {
            console.error("Join failed:", error);
            setStatus("failed");
        }
    };

    if (!ready) return <Loading />;

    return (
        <div className="page flex min-h-[60vh] max-w-[calc(60ch+144px)] flex-col items-start justify-center gap-6">
            <h1 className="page-title">{status === "failed" ? "This invite link doesn’t work anymore" : "You’re invited to a shared list"}</h1>
            <p className="max-w-[60ch] text-lg text-grain">
                {status === "failed"
                    ? "The owner may have turned it off or made a new one. Ask them to send the link again."
                    : "Everyone on a shared list can add films, rate them and say which ones they’re in for."}
            </p>
            {status === "failed" ? (
                <Link to="/mylists" className="btn btn-secondary">
                    Go to my lists
                </Link>
            ) : user ? (
                <button type="button" className="btn btn-primary" onClick={join} disabled={status === "joining"}>
                    {status === "joining" && <Spinner />}
                    Join the list
                </button>
            ) : (
                <Link to={loginPath(location)} className="btn btn-primary">
                    Log in to join
                </Link>
            )}
        </div>
    );
}
