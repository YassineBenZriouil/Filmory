import React, { useState } from "react";
import { auth } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import Animations from "./../static/animations";
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

            customToast("User logged in successfully", "success");
            navigate("/");
        } catch (error) {
            console.error("User login failed", error);
            customToast("User login failed", "error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center justify-center w-full max-w-md">
                <Animations>
                    <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                        <h1 className="text-3xl font-bold text-center">
                            Login
                        </h1>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="email"
                                >
                                    Email:
                                </label>
                                <input
                                    className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="password"
                                >
                                    Password:
                                </label>
                                <input
                                    className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                type="submit"
                            >
                                Log in
                            </button>
                        </form>
                        <p className="text-sm text-center">
                            Don't have an account?{" "}
                            <Link
                                className="text-blue-500 hover:underline"
                                to="/register"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </Animations>
            </div>
        </div>
    );
}
