import React, { useState } from "react";
import { auth } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { customToast } from "./../static/toast";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem("loggedInUser", email);

            customToast("Logged in", "success");
            navigate("/");
        } catch (error) {
            console.error("User login failed", error);
            customToast("Email or password is incorrect", "error");
        }
    };

    return (
        <div className="page flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md">
                    <div className="panel p-6 md:p-8 w-full space-y-6">
                        <h1 className="page-title">
                            Login
                        </h1>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    className="label"
                                    htmlFor="email"
                                >
                                    Email:
                                </label>
                                <input
                                    className="field"
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    className="label"
                                    htmlFor="password"
                                >
                                    Password:
                                </label>
                                <input
                                    className="field"
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <button
                                className="btn btn-primary w-full"
                                type="submit"
                            >
                                Log in
                            </button>
                        </form>
                        <p className="text-sm text-grain">
                            Don't have an account?{" "}
                            <Link
                                className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam"
                                to="/register"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
            </div>
        </div>
    );
}
