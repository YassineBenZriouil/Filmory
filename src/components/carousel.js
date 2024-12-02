import React from "react";
import { Carousel as ReactCarousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Import carousel styles

export default function Carousel({ movies }) {
    return (
        <div className="relative w-full h-64">
            {/* Dark gradient overlay on top */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            {/* Dark gradient overlay on bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent opacity-60"></div>

            <ReactCarousel
                showThumbs={false}
                infiniteLoop={true}
                autoPlay={true}
                interval={3000}
                dynamicHeight={false}
                swipeable={true}
                showArrows={false}
                showStatus={false}
            >
                {movies?.map((movie) => (
                    <div key={movie.id} className="relative w-full h-64">
                        <img
                            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                            alt={movie.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                ))}
            </ReactCarousel>
        </div>
    );
}
