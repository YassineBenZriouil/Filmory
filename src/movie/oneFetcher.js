export const fetchOneMovie = async (id) => {
    const API = `https://api.themoviedb.org/3/movie/${id}?api_key=8dc69cc265c5c8924c21ede4b9ddc208&append_to_response=credits,videos`;

    try {
        const response = await fetch(API);
        const data = await response.json();
        return data; // Return the full movie data
    } catch (error) {
        console.error("Error fetching single movie data:", error);
        return null;
    }
};

export const fetchOneSerie = async (id) => {
    const API = `https://api.themoviedb.org/3/tv/${id}?api_key=8dc69cc265c5c8924c21ede4b9ddc208&append_to_response=credits,videos`;

    try {
        const response = await fetch(API);
        const data = await response.json();
        return data; // Return the full series data
    } catch (error) {
        console.error("Error fetching single series data:", error);
        return null;
    }
};
