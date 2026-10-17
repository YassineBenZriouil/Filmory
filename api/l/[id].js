// Link previews for shared lists (Vercel serverless function, Node 18+).
// /l/:id is rewritten here by vercel.json. Chat apps read the Open Graph tags;
// people are sent straight on to the list in the app.
//
// Environment variables (Vercel project settings):
//   REACT_APP_PROJECT_ID  Firebase project id (already set for the app build)
//   REACT_APP_API_KEY     Firebase web API key (already set for the app build)
//   TMDB_API_KEY          TMDB v3 key, for the preview poster (optional)

const escape = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Firestore REST values → plain JS.
const plain = (v) => {
    if (!v) return undefined;
    if ("stringValue" in v) return v.stringValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(plain);
    if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, plain(x)]));
    return undefined;
};

const readDoc = async (path) => {
    const project = process.env.REACT_APP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const key = process.env.REACT_APP_API_KEY ? `?key=${process.env.REACT_APP_API_KEY}` : "";
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${path}${key}`);
    if (!res.ok) return null;
    const json = await res.json();
    return plain({ mapValue: { fields: json.fields || {} } });
};

const firstPoster = async (list) => {
    const tmdb = process.env.TMDB_API_KEY;
    if (!tmdb) return null;
    const works = list.works && !Array.isArray(list.works) ? list.works : {};
    const keys = [list.cover, ...(list.order || []), ...(works.movie || []).map((id) => `movie_${id}`), ...(works.tv || []).map((id) => `tv_${id}`)].filter(Boolean);
    for (const key of keys.slice(0, 4)) {
        const [type, id] = key.split("_");
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${tmdb}`);
        if (res.ok) {
            const film = await res.json();
            if (film.poster_path) return `https://image.tmdb.org/t/p/w780${film.poster_path}`;
        }
    }
    return null;
};

module.exports = async (req, res) => {
    const id = String(req.query.id || "").replace(/[^A-Za-z0-9_-]/g, "");
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `https://${host}`;
    const appUrl = `${origin}/publicListInside/${id}`;

    let title = "Filmory";
    let description = "Film lists on Filmory.";
    let image = null;

    try {
        const list = id ? await readDoc(`Mylists/${id}`) : null;
        if (list && list.isPublic && !list.deletedAt && !list.hidden) {
            const works = list.works && !Array.isArray(list.works) ? list.works : {};
            const count = (works.movie || []).length + (works.tv || []).length;
            const ownerId = typeof list.user === "string" ? list.user.split("/").pop() : null;
            const profile = !list.anonymous && ownerId ? await readDoc(`Profiles/${ownerId}`) : null;
            title = list.listName || title;
            description = [
                `${count} ${count === 1 ? "film" : "films"}${profile?.userName ? ` by ${profile.userName}` : ""} on Filmory.`,
                list.description,
            ]
                .filter(Boolean)
                .join(" ");
            image = await firstPoster(list);
        }
    } catch (error) {
        console.error("Preview failed:", error);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Filmory">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(`${origin}/l/${id}`)}">
${image ? `<meta property="og:image" content="${escape(image)}">\n<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
<meta http-equiv="refresh" content="0; url=${escape(appUrl)}">
<link rel="canonical" href="${escape(appUrl)}">
</head>
<body style="background:#0F1E26;color:#E9EDF0;font-family:sans-serif">
<p><a href="${escape(appUrl)}" style="color:#F2C35B">Open ${escape(title)} on Filmory</a></p>
<script>location.replace(${JSON.stringify(appUrl)})</script>
</body>
</html>`);
};
