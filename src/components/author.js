import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { loginPath, useAuth } from "../auth/authContext";
import { fetchFollowing, fetchProfile, fetchPublicListsBy, setFollowing } from "../movie/databaseFetcher";
import Avatar from "../static/avatar";
import { customToast } from "../static/toast";
import { LoadError } from "../static/resilience";
import ListTile, { TileSkeleton } from "./lists/listTile";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5";

// Someone's public lists, and a way to follow them.
export default function Author() {
    const { uid } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const [profile, setProfile] = useState(undefined);
    const [lists, setLists] = useState(null);
    const [following, setFollowingState] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const self = user?.uid === uid;

    useEffect(() => {
        let alive = true;
        setFailed(false);
        Promise.all([fetchProfile(uid), fetchPublicListsBy([uid])])
            .then(([p, found]) => {
                if (!alive) return;
                setProfile(p || { userName: "" });
                // Lists the author chose to publish anonymously don't appear under their name.
                setLists(found.filter((l) => !l.deletedAt && !l.hidden && !l.anonymous).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
            })
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
        };
    }, [uid, attempt]);

    useEffect(() => {
        if (!user || self) return;
        fetchFollowing().then((ids) => setFollowingState(ids.includes(uid)));
    }, [user, uid, self]);

    useEffect(() => {
        if (profile) document.title = `${profile.userName || "Lists"} – ${brand}`;
    }, [profile]);

    const toggleFollow = async () => {
        const next = !following;
        setFollowingState(next);
        try {
            await setFollowing(uid, next);
            customToast(next ? `Following ${profile.userName || "them"}. Their new lists will show on Home.` : `Unfollowed ${profile.userName || "them"}`, "success");
        } catch {
            setFollowingState(!next);
            customToast("Couldn’t update that. Try again.", "error");
        }
    };

    if (failed) {
        return (
            <div className="page">
                <LoadError message="This page didn’t load. Check your connection, then try again." onRetry={() => setAttempt((n) => n + 1)} />
            </div>
        );
    }

    const name = profile?.userName || "Someone";
    return (
        <div className="page">
            <header className="flex flex-wrap items-center gap-6">
                {profile === undefined ? (
                    <div className="skeleton h-20 w-20 rounded-full" />
                ) : (
                    <Avatar name={profile.userName} size="h-20 w-20 text-[31px]" />
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="page-title">{profile === undefined ? <span className="skeleton inline-block h-12 w-56 rounded" /> : name}</h1>
                    <p className="mt-2 text-grain">
                        {lists === null ? "Public lists" : `${lists.length} public ${lists.length === 1 ? "list" : "lists"}`}
                    </p>
                </div>
                {!self &&
                    (user ? (
                        <button type="button" className={`btn ${following ? "btn-secondary" : "btn-primary"}`} aria-pressed={following} onClick={toggleFollow}>
                            {following ? "Following" : "Follow"}
                        </button>
                    ) : (
                        <Link to={loginPath(location)} className="btn btn-primary">
                            Log in to follow
                        </Link>
                    ))}
            </header>

            <div className="mt-10">
                {lists === null ? (
                    <div className={GRID}>
                        {[0, 1, 2].map((i) => (
                            <TileSkeleton key={i} />
                        ))}
                    </div>
                ) : lists.length === 0 ? (
                    <p className="text-lg text-grain">{self ? "You haven’t made any lists public yet." : `${name} hasn’t shared any lists yet.`}</p>
                ) : (
                    <div className={GRID}>
                        {lists.map((list) => (
                            <ListTile key={list.id} list={list} to={`/publicListInside/${list.id}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
