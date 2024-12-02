import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import About from "./components/about";
import Footer from "./static/footer";
import Header from "./static/header";
import Home from "./components/home";
import useTheme from "./style/useTheme";
import "./style/global.css";
import MovieDetails from "./components/movieDetails";
import Movies from "./components/movies";
import Tvshows from "./components/tvShows";
import Filter from "./components/filter";
import Results from "./components/results";
import Lists from "./components/lists";
import Profile from "./auth/profile";
import Register from "./auth/register";
import Login from "./auth/login";
import MyLists from "./components/lists/myLists";
import AddList from "./components/lists/addList";
import UpdList from "./components/lists/updList";
import ListInside from "./components/lists/listInside";
import PublicLists from "./components/lists/Public/publiclists";
import PublicListInside from "./components/lists/Public/publicListInside";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const { theme, toggleTheme } = useTheme();
    return (
        <div className={theme}>
            <Router>
                <ToastContainer />
                <Header />
                <Routes>
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
                    <Route path="/lists" element={<Lists />} />
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
                </Routes>
                <Footer theme={theme} toggleTheme={toggleTheme} />
            </Router>
        </div>
    );
}

export default App;
