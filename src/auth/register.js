import React, { useState } from "react";
import { auth, db } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import Animations from "../static/animations";
import { customToast } from "./../static/toast";

export default function Register() {
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;
            console.log("User created successfully:", user);

            await setDoc(doc(db, "Users", user.uid), {
                userName,
                email,
            });
            console.log("User data stored in Firestore");

            customToast("User registered successfully", "success");
            navigate("/login");
        } catch (error) {
            console.error("User registration failed:", error.message);
            if (error.code === "auth/email-already-in-use") {
                customToast(
                    "Email already in use, please use another email",
                    "warning"
                );
            } else {
                customToast("User registration failed", "error");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-white">
            <div className="flex items-center justify-center w-full max-w-md">
                <Animations>
                    <div className="bg-gray-200 text-black dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6 w-full space-y-6">
                        <h1 className="text-3xl font-bold text-center">
                            Register
                        </h1>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="userName"
                                >
                                    User Name
                                </label>
                                <input
                                    className="w-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    type="text"
                                    id="userName"
                                    name="userName"
                                    value={userName}
                                    onChange={(e) =>
                                        setUserName(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="email"
                                >
                                    Email
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
                                    Password
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
                                Register
                            </button>
                        </form>
                        <p className="text-sm text-center">
                            Already have an account?{" "}
                            <Link
                                className="text-blue-500 hover:underline"
                                to="/login"
                            >
                                Login
                            </Link>
                        </p>
                    </div>
                </Animations>
            </div>
        </div>
    );
}
