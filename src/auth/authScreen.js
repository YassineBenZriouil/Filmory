import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { safeNext, useAuth } from "./authContext";
import { AnimatePresence, LayoutGroup, motion, useAnimationControls } from "framer-motion";
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { db } from "./firestore";
import { saveProfile } from "../movie/databaseFetcher";
import { FloatField, Spinner } from "../static/controls";
import { customToast } from "../static/toast";
import { fetchAllPopularMovies, fetchPopularSeries } from "../movie/allFetcher";

const brand = process.env.REACT_APP_COMPANY_NAME || "Filmory";
const EASE_OUT = [0.2, 0.8, 0.2, 1];
const MIN_PASSWORD = 8;

// 0–4: length, mixed case, a digit, a symbol.
const strengthOf = (pw) =>
    !pw
        ? 0
        : [pw.length >= MIN_PASSWORD, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(
              Boolean
          ).length;

const STRENGTH = [
    null,
    { label: "Weak", color: "bg-velvet" },
    { label: "Fair", color: "bg-beam" },
    { label: "Good", color: "bg-beam" },
    { label: "Strong", color: "bg-house" },
];

// Firebase error codes → which field the message belongs under.
const explain = (code, mode) => {
    switch (code) {
        case "auth/invalid-email":
            return { email: "Enter an email address like name@example.com" };
        case "auth/missing-email":
            return { email: "Enter your email address" };
        case "auth/email-already-in-use":
            return { email: "That email already has an account.", emailTaken: true };
        case "auth/weak-password":
            return { password: `Use at least ${MIN_PASSWORD} characters` };
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return { password: "Email or password is incorrect" };
        case "auth/too-many-requests":
            return { form: "Too many attempts. Wait a minute, or reset your password." };
        case "auth/network-request-failed":
            return { form: "Can’t reach the server. Check your connection and try again." };
        default:
            return {
                form: mode === "register" ? "Couldn’t create the account. Try again." : "Couldn’t log in. Try again.",
            };
    }
};

// Three columns of posters drifting at different speeds behind the form.
function PosterWall() {
    const [posters, setPosters] = useState([]);
    useEffect(() => {
        Promise.all([fetchAllPopularMovies(), fetchPopularSeries()]).then(([movies, series]) => {
            const paths = [...(movies || []), ...(series || [])].map((f) => f.poster_path).filter(Boolean);
            setPosters(paths);
        });
    }, []);
    const columns = useMemo(() => [0, 1, 2].map((c) => posters.filter((_, i) => i % 3 === c)), [posters]);

    return (
        <div className="relative hidden overflow-hidden min-[900px]:block" aria-hidden="true">
            <div className="absolute inset-0 grid grid-cols-3 gap-4 px-4">
                {columns.map((col, c) => (
                    <div key={c} className="relative overflow-hidden">
                        {col.length > 0 && (
                            <div
                                className={`poster-drift flex flex-col gap-4 ${c === 1 ? "poster-drift-reverse" : ""}`}
                                style={{ animationDuration: `${[18, 24, 30][c] * 4}s` }}
                            >
                                {[...col, ...col].map((path, i) => (
                                    <img
                                        key={i}
                                        src={`https://image.tmdb.org/t/p/w342${path}`}
                                        alt=""
                                        loading="lazy"
                                        className="aspect-[2/3] w-full rounded-[3px] object-cover"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 bg-booth/65" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-booth" />
        </div>
    );
}

export default function AuthScreen({ mode: initialMode }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = safeNext(params.get("next"));
    const intent = params.get("intent");
    const { refreshProfile } = useAuth();
    const [mode, setMode] = useState(initialMode);
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // idle | saving | done
    const registering = mode === "register";
    const strength = strengthOf(password);
    const shake = useAnimationControls();

    useEffect(() => {
        document.title = `${registering ? "Create account" : "Log in"} – ${brand}`;
    }, [registering]);

    // Switching keeps the form mounted so the shared fields stay put. The router
    // isn't told, on purpose: a route change would remount the page.
    const switchMode = (target) => {
        setMode(target);
        setErrors({});
        const query = window.location.search;
        window.history.replaceState(window.history.state, "", (target === "register" ? "/register" : "/login") + query);
    };

    const succeed = (message) => {
        setStatus("done");
        customToast(message, "success");
        // Back to where they were, finishing what they started (e.g. adding a film).
        setTimeout(() => navigate(next, { replace: true, state: intent ? { intent } : undefined }), 450);
    };

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        if (registering && !userName.trim()) next.userName = "Enter a display name";
        if (!email.trim()) next.email = "Enter your email address";
        if (!password) next.password = "Enter your password";
        else if (registering && password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`;
        setErrors(next);
        if (Object.keys(next).length) {
            shake.start({ x: [0, -4, 4, -4, 0], transition: { duration: 0.24 } });
            return;
        }

        setStatus("saving");
        try {
            if (registering) {
                // Firebase signs the new user in straight away.
                const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
                await Promise.all([
                    setDoc(doc(db, "Users", user.uid), { userName: userName.trim(), email: email.trim() }),
                    saveProfile(user.uid, userName.trim()),
                ]);
                refreshProfile();
                succeed("Account created");
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
                succeed("Logged in");
            }
        } catch (error) {
            console.error(registering ? "Registration failed" : "Login failed", error);
            setErrors(explain(error.code, mode));
            setStatus("idle");
            shake.start({ x: [0, -4, 4, -4, 0], transition: { duration: 0.24 } });
        }
    };

    const resetPassword = async () => {
        if (!email.trim()) {
            setErrors({ email: "Enter your email first, then choose “Forgot password?”" });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setErrors({});
            customToast(`Reset link sent to ${email.trim()}`, "success");
        } catch (error) {
            setErrors(explain(error.code, mode));
        }
    };

    const fieldMotion = { layout: "position", transition: { duration: 0.28, ease: EASE_OUT } };

    return (
        <div className="grid min-h-[calc(100vh-64px)] min-[900px]:grid-cols-2">
            <PosterWall />
            <div className="page-x flex items-center py-12">
                <div className="w-full max-w-[380px] min-[900px]:ml-[8%]">
                    <LayoutGroup>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.h1
                                key={mode}
                                className="page-title"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                {registering ? "Create account" : "Log in"}
                            </motion.h1>
                        </AnimatePresence>
                        <motion.p {...fieldMotion} className="mt-2 text-grain">
                            {registering ? "Make lists of films and share them." : `Welcome back to ${brand}.`}
                        </motion.p>

                        <motion.form animate={shake} onSubmit={submit} noValidate className="mt-8">
                            <AnimatePresence initial={false}>
                                {registering && (
                                    <motion.div
                                        key="name"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28, ease: EASE_OUT }}
                                        className="overflow-hidden"
                                    >
                                        <FloatField
                                            id="userName"
                                            label="Display name"
                                            value={userName}
                                            onChange={setUserName}
                                            error={errors.userName}
                                            autoComplete="nickname"
                                            maxLength={40}
                                        />
                                        {!errors.userName && (
                                            <p className="-mt-4 mb-3 text-[13px] text-grain">Shown on your public lists</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div {...fieldMotion}>
                                <FloatField
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={setEmail}
                                    error={errors.email}
                                    autoComplete="email"
                                />
                                {errors.emailTaken && (
                                    <button type="button" className="btn btn-text -ml-2 -mt-3 min-h-[36px] text-screen underline underline-offset-4" onClick={() => switchMode("login")}>
                                        Log in instead
                                    </button>
                                )}
                            </motion.div>

                            <motion.div {...fieldMotion} className="relative">
                                <FloatField
                                    id="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={setPassword}
                                    error={errors.password}
                                    autoComplete={registering ? "new-password" : "current-password"}
                                    className="peer block w-full resize-none border-b border-reel bg-transparent pb-2 pl-3 pr-16 pt-6 text-screen outline-none focus-visible:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-pressed={showPassword}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-1 top-2 min-h-[40px] rounded-[6px] px-3 text-[13px] font-bold text-grain hover:text-screen"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </motion.div>

                            <AnimatePresence initial={false}>
                                {registering && (
                                    <motion.div
                                        key="strength"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex gap-1" aria-hidden="true">
                                            {[1, 2, 3, 4].map((step) => (
                                                <span key={step} className="h-1 flex-1 overflow-hidden rounded-full bg-reel">
                                                    <motion.span
                                                        className={`block h-full ${STRENGTH[strength]?.color || ""}`}
                                                        initial={false}
                                                        animate={{ width: strength >= step ? "100%" : "0%" }}
                                                        transition={{ duration: 0.16 }}
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                        <p className="mt-1.5 text-[13px] text-grain" aria-live="polite">
                                            {password
                                                ? `${STRENGTH[strength]?.label || "Weak"}${
                                                      password.length < MIN_PASSWORD ? `. Use at least ${MIN_PASSWORD} characters.` : strength < 4 ? ". Mix in capitals, numbers or symbols." : ""
                                                  }`
                                                : `Use at least ${MIN_PASSWORD} characters`}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!registering && (
                                <motion.div {...fieldMotion} className="-mt-2 flex justify-end">
                                    <button type="button" className="btn btn-text min-h-[36px] px-0 text-[13px] font-normal" onClick={resetPassword}>
                                        Forgot password?
                                    </button>
                                </motion.div>
                            )}

                            {errors.form && (
                                <p role="alert" className="mt-4 rounded-[6px] border border-velvet/60 px-3 py-2 text-[13px] text-velvet">
                                    {errors.form}
                                </p>
                            )}

                            <motion.div {...fieldMotion} className="mt-6">
                                <button
                                    type="submit"
                                    disabled={status !== "idle"}
                                    className={`btn w-full transition-colors duration-move ${status === "done" ? "bg-house text-ink" : "btn-primary"}`}
                                    style={status === "done" ? { opacity: 1 } : undefined}
                                >
                                    {status === "saving" && <Spinner />}
                                    {status === "done" && (
                                        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                                            <motion.path
                                                d="M3.5 8.5l3 3 6-7"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.28 }}
                                            />
                                        </svg>
                                    )}
                                    {status === "saving"
                                        ? registering
                                            ? "Creating account"
                                            : "Logging in"
                                        : status === "done"
                                        ? registering
                                            ? "Account created"
                                            : "Logged in"
                                        : registering
                                        ? "Create account"
                                        : "Log in"}
                                </button>
                            </motion.div>
                        </motion.form>

                        <motion.p {...fieldMotion} className="mt-6 text-grain">
                            {registering ? "Already have an account? " : "New here? "}
                            <button
                                type="button"
                                className="font-bold text-screen underline decoration-reel underline-offset-4 hover:decoration-beam"
                                onClick={() => switchMode(registering ? "login" : "register")}
                            >
                                {registering ? "Log in" : "Create an account"}
                            </button>
                        </motion.p>
                    </LayoutGroup>
                </div>
            </div>
        </div>
    );
}
