import React from "react";
import Animations from "../static/animations";

export default function SmallCard({ data, type }) {
    const truncateText = (text, maxLength) => {
        if (!text) return ""; // Handle case where text is undefined
        return text.length > maxLength
            ? text.slice(0, maxLength) + "..."
            : text;
    };

    const typeCheck = () => {
        return type === "tv"
            ? ["name", "first_air_date"]
            : ["title", "release_date"];
    };

    if (!data) return console.log("no data passed to smallCard");

    const [titleField, dateField] = typeCheck(); // Destructure the array returned by typeCheck

    return (
        <Animations>
            <div className="bg-gray-200 text-black dark:bg-gray-900  dark:text-white rounded-lg shadow-lg  w-50 h-72 p-0 hover:scale-105 cursor-pointer">
                <img
                    src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                    alt={data[titleField]}
                    className="w-50 max-h-52 object-contain rounded-md"
                />
                <div className="mt-4 p-2">
                    <div className="flex justify-between">
                        <h2 className="text-sm font-semibold mb-2">
                            {truncateText(data[titleField], 15)}
                        </h2>
                    </div>

                    <div className="flex justify-between text-xs">
                        <p className="font-bold">
                            Rating: {data.vote_average.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                            {new Date(data[dateField]).getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </Animations>
    );
}
