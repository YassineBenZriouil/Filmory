// Route code is split so the first visit only downloads what Home needs.
// Cards call loadDetails() on hover so the details page is ready before the click.
export const loadDetails = () => import("./components/movieDetails");
export const loadBrowse = () => import("./components/browse");
export const loadDiscover = () => import("./components/discover");
export const loadPerson = () => import("./components/person");
export const loadAbout = () => import("./components/about");
export const loadAuth = () => import("./auth/authScreen");
export const loadProfile = () => import("./auth/profile");
export const loadMyLists = () => import("./components/lists/myLists");
export const loadListPage = () => import("./components/lists/listPage");
export const loadPublicLists = () => import("./components/lists/Public/publiclists");
