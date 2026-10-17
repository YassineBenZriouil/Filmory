import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { customToast } from "../static/toast";
import { initialsOf } from "../static/avatar";
import Count from "../static/count";
import ThemeControl from "../style/themeBtn";
import { ThemeContext } from "../style/themeContext";
import { filmCount } from "../movie/listModel";
import { useAuth } from "./authContext";
import { invalidateUserLists, loadUserLists } from "../movie/listsStore";
import ListTile, { TileSkeleton } from "../components/lists/listTile";
import WatchSettings from "./watchSettings";

function Stat({ value, label }) {
    return (
        <div>
            <p className="font-display text-[39px] font-extrabold leading-none tabular-nums">
                {value === null ? (
                    <span className="skeleton inline-block h-9 w-12 rounded align-middle" aria-hidden="true" />
                ) : (
                    <Count value={value} from={0} duration={0.42} />
                )}
            </p>
            <p className="mt-1 text-grain">{label}</p>
        </div>
    );
}

export default function Account() {
    const navigate = useNavigate();
    const { theme, setTheme } = useContext(ThemeContext);
    const { user: authUser, profile } = useAuth();
    const email = authUser?.email;
    const user = profile || undefined; // undefined while the profile loads
    const [lists, setLists] = useState(null);

    useEffect(() => {
        let alive = true;
        loadUserLists().then((l) => alive && setLists(l.filter((x) => !x.deletedAt)));
        return () => {
            alive = false;
        };
    }, [authUser?.uid]);

    const logOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign-out failed:", error);
            customToast("Couldn’t log out. Check your connection and try again.", "error");
            return;
        }
        invalidateUserLists();
        customToast("Logged out", "success");
        navigate("/");
    };

    const name = user?.userName;
    const stats = lists && {
        lists: lists.length,
        films: lists.reduce((sum, l) => sum + filmCount(l), 0),
        public: lists.filter((l) => l.isPublic).length,
    };
    const recent = [...(lists || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 4);

    return (
        <div className="page">
            <header className="flex flex-wrap items-center gap-6">
                {user === undefined ? (
                    <>
                        <div className="skeleton h-24 w-24 rounded-full" aria-hidden="true" />
                        <div aria-busy="true">
                            <div className="skeleton h-12 w-64 max-w-full rounded" />
                            <div className="skeleton mt-3 h-4 w-44 rounded" />
                        </div>
                    </>
                ) : (
                    <>
                        <span
                            aria-hidden="true"
                            className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-reel font-display text-[39px] font-extrabold shadow-[0_0_0_3px_rgb(var(--booth)),0_0_0_5px_rgb(var(--beam))]"
                        >
                            {initialsOf(name, user.email || email)}
                        </span>
                        <div className="min-w-0">
                            <h1 className="page-title break-words">{name || "Your profile"}</h1>
                            <p className="mt-2 text-grain">{user.email || email}</p>
                        </div>
                    </>
                )}
            </header>

            <div className="mt-10 flex flex-wrap gap-x-14 gap-y-6">
                <Stat value={stats ? stats.lists : null} label={stats?.lists === 1 ? "list" : "lists"} />
                <Stat value={stats ? stats.films : null} label={stats?.films === 1 ? "film saved" : "films saved"} />
                <Stat value={stats ? stats.public : null} label="public" />
            </div>

            <section aria-labelledby="your-lists" className="mt-16">
                <div className="flex items-baseline justify-between gap-4">
                    <h2 id="your-lists" className="text-[25px] font-semibold md:text-[31px]">
                        Your lists
                    </h2>
                    {lists?.length > 0 && (
                        <Link to="/mylists" className="btn btn-text min-h-0 py-1">
                            See all
                        </Link>
                    )}
                </div>
                <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                    {lists === null
                        ? [0, 1].map((i) => <TileSkeleton key={i} />)
                        : recent.map((list) => <ListTile key={list.id} list={list} to={`/listInside/${list.id}`} showProgress />)}
                </div>
                {lists?.length === 0 && (
                    <div className="space-y-4">
                        <p className="text-grain">You haven’t made a list yet.</p>
                        <Link to="/addList" className="btn btn-primary">
                            Create your first list
                        </Link>
                    </div>
                )}
            </section>

            <WatchSettings />

            <section aria-labelledby="appearance" className="mt-16">
                <h2 id="appearance" className="text-[25px] font-semibold md:text-[31px]">
                    Appearance
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <ThemeControl theme={theme} setTheme={setTheme} id="profile-theme" />
                    <p className="text-grain">
                        {theme === "system" ? "Matches your device" : theme === "dark" ? "Dark" : "Light"}
                    </p>
                </div>
            </section>

            <section aria-labelledby="account" className="mt-16">
                <h2 id="account" className="text-[25px] font-semibold md:text-[31px]">
                    Account
                </h2>
                <button type="button" className="btn btn-destructive mt-4" onClick={logOut}>
                    Log out
                </button>
            </section>
        </div>
    );
}
