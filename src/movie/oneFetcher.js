import { getJson } from "./http";
export const fetchOneMovie = async (id) => {
    const API = `https://api.themoviedb.org/3/movie/${id}?api_key=8dc69cc265c5c8924c21ede4b9ddc208&append_to_response=credits,videos,release_dates,keywords,watch/providers`;

    try {
        const data = await getJson(API);
        return data; // Return the full movie data
    } catch (error) {
        console.error("Error fetching single movie data:", error);
        return null;
    }
};

export const fetchOneSerie = async (id) => {
    const API = `https://api.themoviedb.org/3/tv/${id}?api_key=8dc69cc265c5c8924c21ede4b9ddc208&append_to_response=credits,videos,content_ratings,keywords,watch/providers`;

    try {
        const data = await getJson(API);
        return data; // Return the full series data
    } catch (error) {
        console.error("Error fetching single series data:", error);
        return null;
    }
};

// Warm the cache so the details page opens instantly.
export const prefetchTitle = (type, id) => (type === "tv" ? fetchOneSerie(id) : fetchOneMovie(id));
