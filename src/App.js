import React, { useEffect, useRef } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import {
    AnimatePresence,
    MotionConfig,
    motion,
    useReducedMotion,
} from "framer-motion";

import "./style/global.css";

import About from "./components/about";
import Footer from "./static/footer";
import Header from "./static/header";
import Beam from "./static/beam";
import Home from "./components/home";
import useTheme from "./style/useTheme";
import MovieDetails from "./components/movieDetails";
import Movies from "./components/movies";
import Tvshows from "./components/tvShows";
import Filter from "./components/filter";
import Results from "./components/results";
import Profile from "./auth/profile";
import Register from "./auth/register";
import Login from "./auth/login";
import MyLists from "./components/lists/myLists";
import AddList from "./components/lists/addList";
import UpdList from "./components/lists/updList";
import ListInside from "./components/lists/listInside";
import PublicLists from "./components/lists/Public/publiclists";
import PublicListInside from "./components/lists/Public/publicListInside";
import NotFound from "./components/notFound";

import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

// Keyed by the first path segment, lowercased. Details pages set their own title.
const TITLES = {
    "": "",
    about: "About",
    movies: "Movies",
    tvshows: "TV shows",
    filter: "Filter",
    results: "Results",
    register: "Create account",
    login: "Log in",
    profile: "Profile",
    mylists: "My lists",
    addlist: "New list",
    updlist: "Edit list",
    listinside: "List",
    public: "Public lists",
    publiclistinside: "Public list",
};

const EASE_OUT = [0.2, 0.8, 0.2, 1];
const EASE_IN = [0.4, 0, 1, 1];

const Rise = cssTransition({
    enter: "toast-rise-in",
    exit: "toast-rise-out",
});

function usePageTitle(pathname) {
    useEffect(() => {
        const segment = pathname.split("/")[1].toLowerCase();
        if (segment === "moviedetails") return;
        const label = segment in TITLES ? TITLES[segment] : "Page not found";
        document.title = label ? `${label} – ${brand}` : brand;
    }, [pathname]);
}

// Advancing the film one frame: the old page lifts away, the shutter blinks, the new one settles.
function AnimatedRoutes() {
    const location = useLocation();
    const reduce = useReducedMotion();
    const firstKey = useRef(location.pathname);
    const shift = reduce ? 0 : 24;
    usePageTitle(location.pathname);

    return (
        <>
            {!reduce && location.pathname !== firstKey.current && (
                <motion.div
                    key={location.pathname}
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-30 bg-booth"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 0] }}
                    transition={{ duration: 0.3, times: [0, 0.55, 0.7, 1] }}
                />
            )}
            <AnimatePresence
                mode="wait"
                onExitComplete={() => window.scrollTo(0, 0)}
            >
                <motion.main
                    key={location.pathname}
                    id="main"
                    tabIndex={-1}
                    className="flex-1 outline-none"
                    initial={{ opacity: 0, y: shift }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.252, ease: EASE_OUT },
                    }}
                    exit={{
                        opacity: 0,
                        y: -shift,
                        transition: { duration: 0.168, ease: EASE_IN },
                    }}
                >
                    <Routes location={location}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route
                            path="/movieDetails/:id/:type"
                            element={<MovieDetails />}
                        />
                        <Route path="/movies" element={<Movies />} />
                        <Route path="/tvShows" element={<Tvshows />} />
                        <Route path="/filter" element={<Filter />} />
                        <Route path="/results" element={<Results />} />
                        <Route
                            path="/lists"
                            element={<Navigate to="/mylists" replace />}
                        />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/mylists" element={<MyLists />} />
                        <Route path="/addList" element={<AddList />} />
                        <Route path="/updList/:listId" element={<UpdList />} />
                        <Route path="/listInside/:id" element={<ListInside />} />
                        <Route path="/public" element={<PublicLists />} />
                        <Route
                            path="/publicListInside/:id"
                            element={<PublicListInside />}
                        />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </motion.main>
            </AnimatePresence>
        </>
    );
}

function App() {
    const { theme, resolved, setTheme } = useTheme();
    return (
        // "user": with reduced motion on, framer drops transforms and keeps opacity fades.
        <MotionConfig reducedMotion="user">
            <Router>
                <div className="flex min-h-screen flex-col">
                    <ToastContainer
                        position="bottom-right"
                        theme={resolved}
                        transition={Rise}
                        autoClose={3500}
                        hideProgressBar
                        icon={false}
                        closeButton={({ closeToast }) => (
                            <button
                                type="button"
                                onClick={closeToast}
                                aria-label="Dismiss"
                                className="grid h-8 w-8 shrink-0 place-items-center self-center rounded-[6px] text-grain transition-colors duration-quick hover:text-screen"
                            >
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        )}
                    />
                    <Header />
                    <AnimatedRoutes />
                    <Footer theme={theme} setTheme={setTheme} />
                </div>
                <Beam />
            </Router>
        </MotionConfig>
    );
}

export default App;
