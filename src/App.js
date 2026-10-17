import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
    useNavigationType,
    useParams,
} from "react-router-dom";
import {
    AnimatePresence,
    MotionConfig,
    motion,
    useReducedMotion,
} from "framer-motion";

import "./style/global.css";

import Footer from "./static/footer";
import Header from "./static/header";
import Beam from "./static/beam";
import Home from "./components/home";
import NotFound from "./components/notFound";
import Loading from "./static/loading";
import useTheme from "./style/useTheme";
import { ThemeContext } from "./style/themeContext";
import { AuthProvider } from "./auth/authContext";
import { OfflineBanner, RouteErrorBoundary } from "./static/resilience";
import { rememberScroll, restoreScroll, savedScroll } from "./static/scroll";
import * as routes from "./lazyRoutes";


import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Everything except Home and the 404 loads on demand.
const About = lazy(routes.loadAbout);
const MovieDetails = lazy(routes.loadDetails);
const Browse = lazy(routes.loadBrowse);
const Discover = lazy(routes.loadDiscover);
const Person = lazy(routes.loadPerson);
const AuthScreen = lazy(routes.loadAuth);
const Profile = lazy(routes.loadProfile);
const MyLists = lazy(routes.loadMyLists);
const ListPage = lazy(routes.loadListPage);
const PublicLists = lazy(routes.loadPublicLists);
const Author = lazy(routes.loadAuthor);
const JoinList = lazy(routes.loadJoin);
const Embed = lazy(routes.loadEmbed);

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";

// Keyed by the first path segment, lowercased. Details pages set their own title.
const TITLES = {
    "": "",
    about: "About",
    movies: "Movies",
    tvshows: "TV shows",
    discover: "Discover",
    register: "Create account",
    login: "Log in",
    profile: "Profile",
    mylists: "My lists",
    addlist: "New list",
    updlist: "Edit list",
    listinside: "List",
    public: "Public lists",
    publiclistinside: "Public list",
    person: "Person",
    u: "Lists",
    join: "Join a shared list",
};

const EASE_OUT = [0.2, 0.8, 0.2, 1];
const EASE_IN = [0.4, 0, 1, 1];

// Frame advance between pages. A poster morph skips the slide so the poster can fly on its own.
const PAGE = {
    enter: ({ shift, morph }) => ({ opacity: morph ? 1 : 0, y: morph ? 0 : shift }),
    shown: { opacity: 1, y: 0, transition: { duration: 0.252, ease: EASE_OUT } },
    leave: ({ shift, morph }) =>
        morph
            ? { opacity: 0, transition: { duration: 0.12 } }
            : { opacity: 0, y: -shift, transition: { duration: 0.168, ease: EASE_IN } },
};

const Rise = cssTransition({
    enter: "toast-rise-in",
    exit: "toast-rise-out",
});

// Tells screen-reader users which page they landed on. Waits so pages that set
// their own title after loading (details, lists) are announced correctly.
function RouteAnnouncer({ pathname }) {
    const [message, setMessage] = useState("");
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => setMessage(document.title.split(" – ")[0]), 700);
        return () => clearTimeout(t);
    }, [pathname]);
    return (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
            {message}
        </div>
    );
}

function usePageTitle(pathname) {
    useEffect(() => {
        const segment = pathname.split("/")[1].toLowerCase();
        if (segment === "moviedetails" || segment === "person" || segment === "u") return;
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
    const morph = !!location.state?.morph;
    const custom = { shift, morph };
    usePageTitle(location.pathname);

    // Back/Forward restore the scroll position of that history entry; new pages start at the top.
    const navType = useNavigationType();
    const latest = useRef({ navType, key: location.key, pathname: location.pathname });
    const previousPath = useRef(location.pathname);
    latest.current = { navType, key: location.key, pathname: location.pathname };

    useEffect(() => {
        window.history.scrollRestoration = "manual";
        return restoreScroll(savedScroll(location.key)); // after a refresh
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let frame;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => rememberScroll(location.key, window.scrollY));
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        // Same page, different query (e.g. ?page=2): no exit animation runs, so restore here.
        let stop;
        if (previousPath.current === location.pathname && navType === "POP") {
            stop = restoreScroll(savedScroll(location.key));
        }
        previousPath.current = location.pathname;
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            stop?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    const afterExit = () => {
        const { navType: type, key } = latest.current;
        if (type === "POP") restoreScroll(savedScroll(key));
        else window.scrollTo(0, 0);
    };

    return (
        <>
            <RouteAnnouncer pathname={location.pathname} />
            {!reduce && !morph && location.pathname !== firstKey.current && (
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
                custom={custom}
                onExitComplete={afterExit}
            >
                <motion.main
                    key={location.pathname}
                    id="main"
                    tabIndex={-1}
                    className="flex-1 outline-none"
                    custom={custom}
                    variants={PAGE}
                    initial="enter"
                    animate="shown"
                    exit="leave"
                >
                    <RouteErrorBoundary resetKey={location.pathname}>
                    <Suspense fallback={<Loading />}>
                    <Routes location={location}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route
                            path="/movieDetails/:id/:type"
                            element={<MovieDetails />}
                        />
                        <Route path="/movies" element={<Browse key="movie" type="movie" />} />
                        <Route path="/tvShows" element={<Browse key="tv" type="tv" />} />
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/filter" element={<Navigate to="/discover" replace />} />
                        <Route path="/results" element={<Navigate to="/discover" replace />} />
                        <Route
                            path="/lists"
                            element={<Navigate to="/mylists" replace />}
                        />
                        <Route path="/register" element={<AuthScreen mode="register" />} />
                        <Route path="/login" element={<AuthScreen mode="login" />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/mylists" element={<MyLists />} />
                        <Route path="/addList" element={<MyLists sheet="new" />} />
                        <Route path="/updList/:listId" element={<MyLists sheet="edit" />} />
                        <Route path="/listInside/:id" element={<ListPage />} />
                        <Route path="/public" element={<PublicLists />} />
                        <Route
                            path="/publicListInside/:id"
                            element={<ListPage publicRoute />}
                        />
                        <Route path="/person/:id" element={<Person />} />
                        <Route path="/u/:uid" element={<Author />} />
                        <Route path="/join/:id/:token" element={<JoinList />} />
                        {/* Share links; on Vercel, api/l/[id].js answers first with a link preview. */}
                        <Route path="/l/:id" element={<ShareRedirect />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    </Suspense>
                    </RouteErrorBoundary>
                </motion.main>
            </AnimatePresence>
        </>
    );
}

function ShareRedirect() {
    const { id } = useParams();
    return <Navigate to={`/publicListInside/${id}`} replace />;
}

function App() {
    const { theme, resolved, setTheme } = useTheme();
    return (
        // "user": with reduced motion on, framer drops transforms and keeps opacity fades.
        <AuthProvider>
        <ThemeContext.Provider value={{ theme, setTheme }}>
        <MotionConfig reducedMotion="user">
            <Router>
                <Routes>
                {/* Embeds render on their own: no header, footer or toasts. */}
                <Route path="/embed/:id" element={<Suspense fallback={null}><Embed /></Suspense>} />
                <Route path="*" element={<>
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
                    <OfflineBanner />
                    <AnimatedRoutes />
                    <Footer theme={theme} setTheme={setTheme} />
                </div>
                <Beam />
                </>} />
                </Routes>
            </Router>
        </MotionConfig>
        </ThemeContext.Provider>
        </AuthProvider>
    );
}

export default App;
