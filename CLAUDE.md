# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Never touch Git: no commits, staging, branches, resets, stashes, pushes, or any other git command. The user handles version control.
- All Markdown files use uppercase names (e.g. `REDESIGN.md`, `REDESIGN-PHASES.md`).
- The redesign spec is `REDESIGN.md`; work through it in the order given in `REDESIGN-PHASES.md`.
- The next roadmap is `BETTER-UX.md` (five UX phases, done in order).

## Commands

Create React App project (`react-scripts` 5), plain JavaScript, no TypeScript.

- `npm start` — dev server on http://localhost:3000
- `npm run build` — production build to `build/`
- `npm test` — Jest in watch mode; run one file with `npm test -- src/path/file.test.js`, non-interactive with `CI=true npm test`
- Lint: ESLint runs through CRA (`react-app` config) during `start`/`build`; there is no separate lint script.

There are currently no test files in `src/`.

## Architecture

Filmory is a movie/TV browsing app with user-curated lists. Two backends:

- **TMDB REST API** — all calls live in `src/movie/allFetcher.js` (list/genre/country/search endpoints) and `src/movie/oneFetcher.js` (single movie/series with `append_to_response=credits,videos,release_dates|content_ratings`). The TMDB API key is hardcoded in these URLs, not in `.env`. Newer calls go through the `tmdb()` helper in `allFetcher.js` (`fetchBrowsePage`, `discoverTitles`, `searchTitles`, `fetchRecommendations`, cached `fetchTitleBasic`). Fetchers swallow errors and return `null`, except `searchTitles`, which lets aborts through.
- **Firebase (Auth + Firestore)** — the app and Auth are initialized in `src/auth/firebase.js` from `REACT_APP_*` vars in `.env` (also `REACT_APP_COMPANY_NAME`, used for branding text). Firestore is initialized separately in `src/auth/firestore.js` (offline persistence on) so it stays out of the main bundle; only import it from code that is already lazy-loaded, or via `import()`. All Firestore access goes through `src/movie/databaseFetcher.js`.
- **TMDB caching** — every TMDB request goes through `getJson()` in `src/movie/http.js` (session cache, stale-while-revalidate, one retry). Don't call `fetch` directly for TMDB.
- **Security rules** live in `firestore.rules` (not deployed automatically: `firebase deploy --only firestore:rules`). Non-owners can only touch specific fields (likes, joining, members editing films); keep the rules in step when adding list fields.
- **Link previews**: `api/l/[id].js` is a Vercel serverless function; `vercel.json` rewrites `/l/:id` to it and everything else to the SPA. Share links use `/l/:id`; the SPA also redirects `/l/:id` to `/publicListInside/:id` when not on Vercel.

### Firestore data model
- `Users/{uid}` — private account doc (`userName`, `email`); only its owner can read it.
- `Profiles/{uid}` — public `{ userName }` used for list authors. Read authors with `fetchProfile()`, never from `Users`.
- `Mylists` collection — lists with `listName`, `description`, `isPublic`, `createdAt` (ms timestamp, missing on old lists), `works: { movie: [ids], tv: [ids] }` (numbers), and `user` stored as the **string** `"/Users/<uid>"` (not a DocumentReference); queries match on that string. Some old lists have `works: []`; read works through `worksOf()` / `filmCount()`, and `addMovieToList` converts the array form on first write.
- List extras on the same doc: `order` (array of film keys like `"movie_123"`), `meta.<key>` (`addedAt`, `addedBy`, `rating` 0.5–5, `note`, `interested: [uids]`), `cover` (a film key), `deletedAt`/`wasPublic` (soft delete, purged after 30 days), `likedBy`, `members` + `inviteToken` (shared lists; joining writes `joinedWith`), `anonymous`, `copiedFrom`, and `hidden` (moderation, set only in the Firebase console). Read lists through the pure helpers in `movie/listModel.js` (`orderedKeys`, `metaOf`, `fanKeys`, `worksOf`, `filmCount`, `blockedWord`), which don't pull in Firestore.
- `Watched/{uid}` (`films: { "movie_123": timestamp }`) and `Follows/{uid}` (`following: [uids]`) are private per person; `Reports` is create-only. Watched state is shared app-wide through `movie/watchedStore.js` (`useWatched`, `setWatchedFilms`).
- `movie/listsStore.js` briefly caches the current user's lists for the list picker; call `invalidateUserLists()` after any list write.

### Auth/session
The signed-in user comes from Firebase's own session via `AuthProvider` / `useAuth()` in `src/auth/authContext.js` (`{ ready, user, profile, refreshProfile }`). In async data code use `currentUid()` from `databaseFetcher.js`, which waits for the session to restore. `localStorage.loggedInUser` is gone; don't reintroduce it. Links to log in should use `loginPath(location, intent)` so the person returns to where they were (`intent: "add"` reopens the list picker on a film page). `/login` and `/register` both render `auth/authScreen.js`; `/profile` redirects logged-out visitors to `/login`.

### UI
- Routing: all routes are declared in `src/App.js` (react-router-dom v7, `BrowserRouter`); every page except Home and the 404 is lazy-loaded from `src/lazyRoutes.js` and wrapped in a per-route `RouteErrorBoundary`. Detail page is `/movieDetails/:id/:type` where `type` selects movie vs. tv fetcher; people are `/person/:id`, list authors `/u/:uid`, invite links `/join/:id/:token`. `/embed/:id` renders outside the app layout (no header, footer or toasts) for iframes. Back/Forward restore scroll per history entry (`static/scroll.js`); per-entry UI state (row positions, Discover results) uses `entryState`.
- Device preferences (recent searches, recently viewed, region, streaming services, saved Discover filters) live in `static/prefs.js`.
- Styling: Tailwind with `darkMode: "class"`. Colours are CSS variables in `style/global.css` (`:root` = light, `:root.dark` = dark) mapped to token classes in `tailwind.config.js` (`booth`, `leader`, `reel`, `grain`, `screen`, `beam`, `velvet`, `house`, `ink`), so one class covers both themes; don't use raw Tailwind palette colours or `dark:` pairs. Shared classes (`btn btn-primary|secondary|text|destructive`, `field`, `label`, `panel`, `page`, `page-title`) live in the same file. Fonts: Big Shoulders Display (`font-display`, headings) and Atkinson Hyperlegible (`font-body`).
- Theme: `style/useTheme.js` stores `light | system | dark` in `localStorage.theme` and toggles `dark` on `<html>`; an inline script in `public/index.html` applies it before first paint. The control (`style/themeBtn.js`) is in the footer.
- Motion: framer-motion. Only the route wrapper in `App.js` animates on load (frame advance + shutter blink); don't add per-component entrance animations. `MotionConfig reducedMotion="user"` handles reduced motion for framer; CSS motion has its own `prefers-reduced-motion` block in `global.css`.
- Cards: `components/smallCard.js` renders its own `<Link>` to the details page plus a quick-add button (`listPicker.js`), so never wrap it in another link. Lay cards out with `cardGrid.js` or `cardRow.js`; loading states use `SkeletonGrid` / `Loading` from `static/loading.js`.
- Shared UI: `static/popover.js` (anchored panels/menus), `static/dialog.js` (modal, bottom sheet on phones, `ConfirmDialog`), `static/controls.js` (`Switch`, `FloatField`, `Spinner`), `static/hooks.js` (`useMediaQuery`, `useFocusTrap`).
- Search lives in the header (`components/search.js`). List pages open it in add-films mode with `openAddFilms({ id, listName })`; it fires `LIST_CHANGED` after adding.
- Lists: `/mylists` (`lists/myLists.js`; `/addList` and `/updList/:listId` open its create/edit sheet), `/listInside/:id` and `/publicListInside/:id` both render `lists/listPage.js` (editable only for the owner). `/filter` and `/results` redirect to `/discover`.
- Toasts: `react-toastify` `ToastContainer` mounted once in `App.js`, styled in `global.css`; helper `customToast` in `src/static/toast.js`.
- File names are lowercase/camelCase (e.g. `components/movieDetails.js`, `lists/Public/publiclists.js`); match the actual casing on imports.
