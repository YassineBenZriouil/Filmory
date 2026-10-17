import React, { useState } from "react";
import { auth, db } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
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

            customToast("Account created. Log in to continue.", "success");
            navigate("/login");
        } catch (error) {
            console.error("User registration failed:", error.message);
            if (error.code === "auth/email-already-in-use") {
                customToast(
                    <span>
                        That email already has an account.{" "}
                        <button
                            type="button"
                            className="font-bold underline underline-offset-4"
                            onClick={() => navigate("/login")}
                        >
                            Log in
                        </button>
                    </span>,
                    "warning"
                );
            } else {
                customToast("Couldn’t create the account. Try again.", "error");
            }
        }
    };

    return (
        <div className="page flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md">
                    <div className="panel p-6 md:p-8 w-full space-y-6">
                        <h1 className="page-title">
                            Register
                        </h1>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label
                                    className="label"
                                    htmlFor="userName"
                                >
                                    User Name
                                </label>
                                <input
                                    className="field"
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
                                    className="label"
                                    htmlFor="email"
                                >
                                    Email
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
                                    Password
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
                                Register
                            </button>
                        </form>
                        <p className="text-sm text-grain">
                            Already have an account?{" "}
                            <Link
                                className="text-screen underline decoration-reel underline-offset-4 hover:decoration-beam"
                                to="/login"
                            >
                                Login
                            </Link>
                        </p>
                    </div>
            </div>
        </div>
    );
}
