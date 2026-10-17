# Global improvements

Everything Filmory needs to stand next to [Letterboxd](https://letterboxd.com/) as a place where people log, rate, review and talk about films. This is the full gap analysis, area by area, down to the details.

Each section covers:
- **Letterboxd:** what it does.
- **Filmory today:** what exists now, after the redesign and `BETTER-UX.md` Phases 1 to 4.
- **Build:** what to add, including data and screens.
- **Done when:** a check you can actually test.

The goal is parity in depth, not imitation. Filmory keeps its own identity: the projection-booth look from `REDESIGN.md`, sentence-case copy, and lists as the heart of the product. Never copy Letterboxd's name, logo, three-dot mark, green/orange/blue palette or wording.

---

## 0. The gap in one paragraph

Letterboxd is a **social diary**. Every film you watch becomes an entry, with a date, a rating, a like and maybe a review. Those entries feed your profile, your stats, your friends' activity, the film's page, and an annual summary. Filmory today is a **browser with lists**. It's good at finding films and keeping lists, but it has no record of *when* you watched something or *what you thought*, and nobody sees anything you do unless they open a public list. Most of this document builds that missing spine (diary → reviews → activity → profile → community), then deepens film pages, discovery, and the platform underneath.

---

## 1. Foundations that everything else needs

These come first. The social features can't scale without them.

### 1.1 Real backend logic (Cloud Functions)
**Letterboxd:** server-side feeds, counters, notifications, moderation, search indexing.
**Filmory today:** everything runs in the browser against Firestore. Counts (likes) are arrays on documents, and there are no server jobs.
**Build:**
- Firebase Cloud Functions (or a small Node service) for:
  - Counter aggregation: likes, review counts, rating histograms, watch counts per film.
  - Activity fan-out to followers' feeds.
  - Notifications.
  - Search indexing.
  - Scheduled jobs: purging deleted lists, weekly "popular" rankings, the year in review.
- Move like counts from `likedBy` arrays to `likes/{uid}` subcollections plus a `likeCount` maintained by a function. Arrays stop scaling around a few thousand entries, and documents cap at 1 MB.
- Firebase App Check, so only the real app can call Firestore and the functions.
- Rate limits per user on writes (reviews, comments, likes, follows), enforced in functions.

**Done when:** no client writes a counter directly, and every count shown matches a server-maintained value.

### 1.2 Server rendering and SEO
**Letterboxd:**
- Every film, review, list and profile is a crawlable page with rich previews and structured data.
- Search engines send a large share of its traffic.

**Filmory today:**
- Create React App renders everything in the browser, so search engines see an empty page.
- Only `/l/:id` has a preview, through a function.

**Build:**
- Migrate to **Next.js (App Router)**. Server-render the film, person, list, review and profile pages, and keep the existing components; most move over unchanged.
- Add `generateMetadata` per page: title, description, Open Graph image, canonical URL.
- Generate Open Graph images with `@vercel/og`: a poster fan for lists, poster plus rating for reviews, favourite films for profiles.
- Structured data (JSON-LD):
  - `Movie` and `TVSeries`, with `aggregateRating` from Filmory's own ratings.
  - `Review` on review pages, `ItemList` on lists, `Person` on people.
- `sitemap.xml` (films with activity, public lists, reviews, profiles) and `robots.txt`.
- Clean, readable URLs that never change once shared:
  - `/film/dune-part-two-2024`, `/tv/the-bear`, `/person/zendaya`
  - `/u/sam`, `/u/sam/list/weekend-horror`, `/u/sam/review/dune-part-two-2024`
  - Old URLs (`/movieDetails/:id/:type`, `/listInside/:id`) redirect permanently.

**Done when:** Google indexes film and list pages with ratings in results, and every shareable page has a correct preview in Slack, iMessage and WhatsApp.

### 1.3 Usernames and identity
**Letterboxd:** every member has a unique username (`letterboxd.com/username`), a display name, an avatar, a bio, a location, a website and pronouns.
**Filmory today:** a display name only, with initials as the avatar and no public profile URL beyond `/u/<uid>`.
**Build:**
- **`Usernames/{username}` → `{ uid }`**, claimed in a transaction:
  - Lowercase letters, digits and underscore, 2 to 20 characters.
  - Reserved words blocked (`admin`, `film`, `settings`…).
  - Changeable once every 30 days, with redirects from the old name.
- **Public profile fields:** `username`, `displayName`, `bio` (300 characters, with links and @mentions), `location`, `website`, `pronouns` (optional, free text).
- **Avatars:** image upload to Firebase Storage. Crop to a square in the browser and resize to 400px WebP. Initials stay the fallback.
- **Profile backdrop:** the person picks any film they've logged and its backdrop shows behind their profile header, the way Letterboxd uses backdrops.

**Done when:** everyone has a stable `/u/username` page with a photo, and old links keep working after a rename.

### 1.4 Data model for the social layer
New collections. All writes go through security rules or functions.

| Collection | Shape | Notes |
|---|---|---|
| `Logs/{logId}` | `uid, filmKey, watchedOn (date), loggedAt, rating (0.5–5 or null), liked, rewatch, reviewId?, tags[], private, spoilers` | One per viewing. The diary. |
| `Reviews/{reviewId}` | `uid, filmKey, logId, body (markdown-lite), spoilers, rating, likeCount, commentCount, createdAt, editedAt, language` | A review is attached to a log. |
| `Reviews/{id}/Comments/{id}` | `uid, body, createdAt, editedAt, deleted` | Same for list comments. |
| `Likes/{targetType_targetId_uid}` | `uid, targetType (review, list, comment), targetId, createdAt` | Counter kept by a function. |
| `FilmStats/{filmKey}` | `watchCount, likeCount, ratingCount, ratingSum, histogram[10], listCount, reviewCount, fans` | Maintained by functions. |
| `UserFilm/{uid}_{filmKey}` | `watched, firstWatched, lastWatched, rating, liked, watchlist, logCount` | The per-person, per-film summary; replaces `Watched/{uid}`. |
| `Follows/{uid}/following/{otherUid}` | `createdAt` | One document per edge, mirrored to `followers` by a function. |
| `Feed/{uid}/items/{id}` | `actorUid, type, ref, createdAt` | Fan-out of followed people's activity. |
| `Notifications/{uid}/items/{id}` | `type, actorUid, ref, read, createdAt` | |
| `Blocks/{uid}/blocked/{otherUid}` | `createdAt` | |

Migration: copy `Watched/{uid}` into `UserFilm`, and turn `Follows/{uid}.following[]` into edge documents. Keep reading both for one release, then remove the old ones.

**Done when:** the security rules have emulator tests for every collection (who can read, create, edit and delete), and those tests run in CI.

---

## 2. The diary (logging what you watch)

This is the core loop that Filmory is missing.

### 2.1 Log a film
**Letterboxd:** "Review or log" opens a dialog with a watched date (defaulting to today), a "watched before" rewatch flag, a half-star rating, a like (heart), a review with a spoiler toggle, tags, and a private toggle.
**Filmory today:** a watched toggle with no date, plus a per-list rating and note.
**Build:**
- A **Log** button on every film page, card and search result, with the shortcut `W`.
- **The log sheet** (dialog on desktop, bottom sheet on phones):
  - Date watched, with a calendar picker and shortcuts for "Today" and "Yesterday". An "I don't remember the date" option logs without a date.
  - A "Watched this before" rewatch toggle. It's set automatically when a log already exists, and the rewatch icon shows in the diary.
  - The half-star rating (the existing `StarRating`, enlarged).
  - A like heart.
  - A review textarea with a spoiler toggle, plus markdown-lite (bold, italic, links, line breaks; nothing else).
  - Tags: free text with autocomplete from your own past tags.
  - Where you watched it (optional): a cinema, or one of your streaming services from the region settings.
  - Private: hidden from feeds and your profile.
- **Quick actions without the sheet**, as on Letterboxd's film page sidebar: a three-icon cluster for Watched (eye), Like (heart) and Watchlist (clock), plus a star row. Clicking a star logs a rating instantly.
- Saving updates the log, the per-person film summary (`UserFilm`) and the film's stats (via a function), then posts to followers' feeds unless the log is private.
- Toast: "Logged Dune: Part Two" with View and Undo.

**Done when:** logging a film with a date, rating, like and review takes under 15 seconds, and a second log of the same film is recorded as a rewatch.

### 2.2 Diary view
**Letterboxd:** a month-by-month table with day number, poster, title, release year, rating, like, rewatch, review icon and an edit pencil. It can be filtered by year and month, and sorted.
**Build:**
- **`/u/:username/diary`**: a table grouped by month. Each month is a heading made of a large Big Shoulders month name and the year. Each row has:
  - The day number, in the display face.
  - A small poster, the title and the year.
  - Stars, a heart, a rewatch icon, and a review icon (linking to the review).
  - Edit and delete buttons for the owner.
- Filter by year, month, rating, liked, rewatch only, has review, tag or service.
- Export as CSV (see 13.2).
- **Phones:** rows collapse to poster, title and stars, and tapping a row opens the log.
- **Keyboard:** arrow keys move between rows, Enter opens a row, and `E` edits it.

**Done when:** a 1,000-entry diary scrolls smoothly (virtualised rows) and filters in under 100ms.

### 2.3 Watchlist
**Letterboxd:** a separate watchlist, distinct from lists, that can be shuffled, filtered by streaming service, and seen as "in common" with a friend.
**Filmory today:** watchlists are just ordinary lists.
**Build:**
- **A built-in watchlist per user.** Store it in `UserFilm.watchlist` plus an order field. Show it at `/u/:username/watchlist`.
- **Clock icon** on every card and film page; the shortcut is `Q`.
- **Watchlist filters:** streaming services you have (from the region settings), runtime, decade, genre, and "released only".
- **Shuffle:** "Pick one for me" chooses from the filtered results.
- **Watchlists in common:** on a friend's profile, the films you both want to see.
- **Auto-remove:** logging a film takes it off the watchlist, with a setting to keep it.
- **Import:** a Letterboxd `watchlist.csv` imports straight into the watchlist (reusing the existing importer).

**Done when:** a person can pick tonight's film from "on my watchlist, on a service I have, under two hours" in two taps.

### 2.4 Ratings
- **Half stars from 0.5 to 5**, already built in `StarRating`. Use it everywhere and allow clearing a rating.
- **Per-person film summary:** each person's latest rating per film lives in `UserFilm`. The diary keeps the rating each log had at the time.
- **Distribution on profiles:** a 10-bar histogram of the person's ratings, with their average and total count.
- **Distribution on film pages:** the same 10-bar histogram for everyone who rated the film, with the Filmory average (to two decimals), the number of ratings, and a "fans" count (people who put it in their four favourites).
- Show "TMDB rating" separately and smaller once Filmory has 25 or more ratings for a film. Below that, show TMDB's rating only, clearly labelled.

---

## 3. Reviews

### 3.1 Writing
- Reviews live in the log sheet, and also on a dedicated `/u/:username/review/:slug` page for longer writing.
- **Editor:** a plain textarea with markdown-lite (bold, italic, links, block quotes, line breaks) and a live preview tab.
  - Autosave a draft locally every two seconds, with a "Draft saved" note.
  - Character counter after 2,000 characters; the hard limit is 20,000.
- **Spoilers:** a toggle that hides the whole review behind "This review may contain spoilers. Show anyway". Inline `||spoiler||` blocks blur that text until tapped.
- **Language:** detect it automatically, with a manual override. Readers can filter reviews by language.
- **Editing:** after editing, the review shows "Edited" with a tooltip showing the edit time. Keep only the latest version.

### 3.2 Reading
- **Review page:**
  - Poster, title and year.
  - The reviewer's avatar and username, their rating, a "watched on" date, and a rewatch icon.
  - The body, at 68 characters per line in the body face, size 18.
  - Like, comment and share buttons.
  - "More reviews of this film", "More reviews by this person", and links to the reviewer's diary entries for the film.
- **On the film page:**
  - "Popular reviews" (most likes in the last 30 days), "Recent reviews", and "Reviews from people you follow" first.
  - Filter by rating or language.
- **Long reviews** show 8 lines, then "Read more" expands them in place.
- **Likes and comments:** the like count links to the people who liked it.

### 3.3 Comments
- Threaded one level deep (replies to a comment, but no replies to replies, like Letterboxd).
- Available on reviews and public lists. The author can turn comments off per review or list.
- Formatting is plain text with links and @mentions; mentions notify the mentioned person.
- Commenters can edit or delete their own comments. Deleted comments read "Comment removed" when they have replies.
- Authors can delete any comment on their own content.
- Report button on every comment.

**Done when:** a review can be written, edited, liked, commented on and shared, and its page ranks in search with the right preview.

---

## 4. Profiles

**Letterboxd:** four favourite films at the top; stats (films, this year, lists, following, followers); recent activity, recent reviews, popular reviews, diary, watchlist, lists, likes and tags; a ratings histogram; and a year in review.
**Filmory today:** a private profile page with list stats, region settings, theme and log out.

### 4.1 Public profile `/u/:username`
- **Header:**
  - The chosen film backdrop behind it, faded into the booth colour.
  - Avatar, display name, username, and pronouns.
  - Bio, location and website.
  - Follow button, a Following/Followers count, and a "Follows you" label.
- **Four favourite films:** four large posters, picked from films they've watched. Hovering a poster shows its rating and title. On their own profile, the owner can drag the posters to reorder them.
- **Stats row**, using the counting numbers already built:
  - Films (total watched).
  - This year.
  - Lists, Following and Followers. Each is a link.
- **Sections, in this order:**
  - Recent activity: the last eight logs as posters with star ratings beneath.
  - Recent reviews.
  - Popular reviews.
  - Recent lists.
  - The rating histogram.
- **Tabs:** Profile, Activity, Films, Diary, Reviews, Watchlist, Lists, Likes, Tags. Each tab has its own URL.
- **"Films" tab:** a grid of every film watched, with the person's rating under each. Sort by when watched, rating, release date, popularity or length, and filter by decade, genre or service. The card's watched indicator shows the *person's* rating in place of the TMDB rating.
- **Privacy:** a private profile shows only the header to people who don't follow it, and new followers need approval.

### 4.2 Stats page `/u/:username/stats`
Letterboxd's paid Pro tier includes a stats page; for Filmory, make it free.
- **Totals:** films, hours watched, directors, countries, languages.
- **By year:** films per month (bar chart), first watches versus rewatches.
- **Most-watched:** directors, actors, genres, countries, languages, decades (each as a ranked list with posters).
- **Rating patterns:** your average versus the Filmory average, your most generous and harshest genres.
- **Milestones:** 100th film, longest streak of days with a log.
- **Charts:** inline SVG in the booth palette, with the beam colour for highlights. Every chart also has a visually hidden data table for screen readers.

### 4.3 Year in review
- From 1 December, each person gets `/u/:username/year/2026`:
  - Films watched, hours watched, top-rated films, most-watched director and actor, new favourites, and a month-by-month poster wall.
  - Share images in story (9:16) and square formats, generated on the server.
- One orchestrated reveal sequence when the page opens. This is the year's single big moment, so it's the one place that earns a page-load animation.

**Done when:** a profile tells a stranger someone's taste in five seconds, through the four favourites, the stats and recent activity.

---

## 5. Social graph and activity

### 5.1 Following
- **Edges:** follow and unfollow are stored as one document per relationship (see 1.4).
- **Lists:** Following and Followers pages show avatar, name, film count and a follow-back button.
- **Discovery:** "Popular members" this week, "Members you might know" (followed by people you follow), and members who reviewed films you loved.
- **Blocking:** a blocked person can't see your content, follow you, comment, or mention you. You don't see theirs.

### 5.2 Activity feed
**Letterboxd:** "Activity" shows friends' logs, reviews, likes, list creations, follows and comments, plus your own activity on another tab.
**Build:**
- **`/activity`** for people who are logged in. Items are grouped by person and day, e.g. "Sam watched 3 films" with a poster strip.
- **Item types:** logged (with rating), reviewed (with excerpt), liked a review or list, created or updated a list, followed someone, commented.
- **Tabs and filters:** Friends and You tabs, plus a filter by type.
- **Fan-out:** done by a function on write to `Feed/{followerUid}`, capped at 500 items per person.
- **Home when logged in:** the top of Home becomes "New from friends", a row of friends' latest logs with their ratings, above the hero. This replaces and extends the current "New from people you follow" row.
- **Friends' ratings on film pages:** avatars of people you follow who've watched the film, each with their rating, and "N friends watched".

### 5.3 Notifications
- A bell in the header with an unread count badge, and a `/notifications` page.
- **Events:**
  - New follower, or a follow request on a private profile.
  - Someone liked your review or list.
  - A comment on your content, a reply, or a mention.
  - Someone joined your shared list.
  - Your list was copied.
- **Settings:** each type can be turned on or off, separately for in-app, email and push.
- **Email:** an optional weekly digest; mentions are sent straight away.
- **Push:** for the PWA (`BETTER-UX.md` 5.1), using Firebase Cloud Messaging.

**Done when:** opening Filmory shows what friends watched since you were last here, and you hear about replies within a minute.

---

## 6. Film pages

**Letterboxd:** a film page has the poster, backdrop, title, year and director, a tagline, the synopsis, and tabs for Cast, Crew, Details, Genres and Releases. A sidebar holds your actions, where to watch, and the ratings histogram. Below come popular reviews, friends' activity, similar films, mentions in lists, and stats (watched by, listed by, liked by).
**Filmory today:** a strong lobby-card page with cast, crew line, keywords, seasons, providers, details, trailer and "More like this".

### 6.1 Additions
- **Action panel** (desktop: a sticky right column; phones: a bar under the title):
  - Watched, Like and Watchlist icons.
  - The star row, a "Log or review" button, and "Add to lists".
  - Share.
  - Your history: "You watched this 3 times, last on 12 March 2026".
- **Filmory ratings** (2.4): the histogram, average and count. Hovering a bar shows "312 people rated this 4 stars".
- **Tagline:** shown in italics under the title, when TMDB has one.
- **Cast and crew tabs:**
  - The full cast with characters.
  - Crew grouped by department (Directing, Writing, Producing, Editing, Cinematography, Composer, Production design, Costume…). Each name links to a person page filtered to that job.
- **Details tab:** studios (each linking to a studio page), countries, original language, spoken languages, alternative titles, budget and box office (TMDB revenue) when known.
- **Genres and themes tab:** TMDB genres and keywords as chips. Group the keywords into themes, like Letterboxd's "nanogenres"; a curated mapping file can start the grouping.
- **Releases tab:** release dates by country and type (theatrical, digital, physical), with certifications.
- **Reviews:** popular, friends first, then recent (3.2).
- **Lists featuring this film:** the most-liked public lists containing it, as tiles.
- **Film stats:** watched by N, listed by N, liked by N, fans N. Each number links to a list of those people.
- **Collections:** "Part of the Dune collection", showing the collection's films in order with your watched marks.
- **External links:** IMDb, TMDB, JustWatch and Wikipedia (from TMDB's `external_ids`).
- **Posters and backdrops:** let people choose which TMDB poster and backdrop *they* see, saved per person. Letterboxd charges for this; here it's free.
- **Adult-content safety:** hide adult titles by default, with a setting and an age confirmation.

### 6.2 People and studios
- **Person pages:**
  - Separate tabs for Actor, Director, Writer, Producer, Composer… (each job).
  - Sort by popularity, release date or your rating, with "Hide watched", "Only watched" and decade filters.
  - A progress line: "You've watched 14 of 38".
- **Studio pages** `/studio/:slug`: films by a production company, with the same filters.
- **Country and language pages**, both browsable.

**Done when:** every name and label on a film page leads somewhere useful, and a film page answers "should I watch this, where, and what do people I trust think?".

---

## 7. Lists, the Letterboxd way

Filmory's lists are already strong. These close the remaining gaps.
- **Ranked lists:** a "Show as ranked" toggle that numbers films in your order. Rank numbers appear only when the list really is a ranking.
- **Rich notes per entry:** already built (notes and rating per film). Add markdown-lite, plus a "Show notes" toggle for readers on long lists.
- **List descriptions:** markdown-lite, links and @mentions.
- **Visibility:** list views as a poster grid, a detailed list (poster, title, year, director, note) or a compact text list.
- **Progress for viewers:** "You've watched 23 of 100 (23%)" on any public list, already built for owners and members. Add a "Hide watched" filter for viewers.
- **List tags**, used in list search ("horror", "1970s", "comfort").
- **Comments on lists** (3.3).
- **Featured lists:** staff picks on the Lists page, set with a `featured` flag that only admins can write.
- **Large lists:** 10,000 films or more. Store entries in a `Mylists/{id}/entries` subcollection once a list passes 500 films, with paging and virtualised grids.
- **Clone with credit:** "Copy to my lists" (built) records `copiedFrom` and shows "Based on Sam's list" with a link.

---

## 8. Discovery and browsing

### 8.1 Films browse `/films`
**Letterboxd:** browse by year or decade, genre, country, language, service and rating; sort by popularity (week, month, year, all time), rating, release date and length; and hide watched or show only watched.
**Filmory today:** Discover covers most filters.
**Build:**
- **Decade chips:** 2020s, 2010s… 1900s, plus a single-year picker inside each.
- **Country filter:** `with_origin_country`.
- **Sort by Filmory popularity:** by week, month, year or all time, using `FilmStats` watch counts over that window. TMDB popularity is the fallback.
- **Sort by Filmory rating**, with a minimum number of ratings.
- **"Hide films I've watched"** and **"Only films I've watched"**, from `UserFilm`.
- **Poster sizes and density:** a small/medium/large toggle, remembered per device.
- **Infinite scroll** with a "Load more" fallback. Keep the page in the URL so Back works (scroll restoration is already built).

### 8.2 Popular and editorial
- **"Popular this week" on Home:** the films most logged on Filmory in the last 7 days. While usage is small, fall back to TMDB trending.
- **Popular lists and reviews this week.**
- **Upcoming:** films releasing in the next 30 days in your region, with a "Remind me" option that sends a notification on release day.
- **Journal:** an editorial section for features, interviews and themed lists. Write articles in markdown files in the repo; they render as pages.

### 8.3 Search everywhere
**Letterboxd:** one search across films, people, lists, members, reviews, tags, studios and stories.
**Filmory today:** films, series and people (TMDB), plus recent searches.
**Build:**
- Index Filmory content (members, public lists, reviews, tags) in **Typesense** or **Algolia**, fed by functions on write.
- Header search shows groups: Films, TV, People, Lists, Members, Reviews. Pressing Enter opens `/search?q=` with tabs per type.
- Fuzzy matching, typo tolerance, and the original title and year shown for disambiguation.
- **Search operators:** `year:1999`, `director:"Wong Kar-wai"`, `rating:>4`.

**Done when:** you can find a person by username, a list by its name or tags, and a review by a phrase in it, all from the header.

---

## 9. Personal taste features

- **Recommendations "for you":** from your high ratings and likes. Start with TMDB recommendations weighted by how often they appear across your top-rated films, then a function computes collaborative signals from Filmory ratings once there's enough data.
- **Taste match:** on someone's profile, a percentage similarity based on films you've both rated, with "films you both loved" and "films you disagree on".
- **Hide or exclude:** "Not interested" on any card removes a film from recommendations and browse, and it can be undone in settings.
- **Reminders:** "Remind me when it's streaming": when a watchlisted film becomes available on one of your services in your region, you get a notification. A daily function checks watch providers.

---

## 10. Content quality and safety

- **Reporting:** reviews, comments, lists and profiles all get a report option (lists done). Reasons are spoilers not marked, offensive, spam, harassment, or other.
- **Moderation queue:** a simple admin page (admins defined by a custom auth claim) showing reports grouped by item. Actions are hide, warn, suspend, or dismiss.
- **Automatic checks:**
  - Extend the word check to reviews and comments.
  - Run text through a moderation API (e.g. the Perspective API) in a function, and hold high-toxicity content for review.
  - Rate limits from 1.1.
- **Spam:** new accounts can't post links in reviews or comments for 48 hours. Watch for duplicate-content patterns.
- **Spoiler hygiene:** readers can flag a review as "contains spoilers"; after three flags it's blurred until moderated.
- **Account safety:**
  - Email verification before you can post publicly.
  - Optional two-factor sign-in (Firebase multi-factor).
  - Sign in with Google and Apple.
  - Account deletion that removes all content within 30 days (a GDPR requirement).
  - A data export (13.2).
- **Community guidelines** page linked from the footer and the report dialog.

---

## 11. Settings

A real `/settings` area with these sections, each on its own URL:
- **Profile:** photo, display name, username, bio, location, website, pronouns, the four favourite films, profile backdrop.
- **Account:** email, password, sign-in methods, two-factor sign-in, delete account.
- **Privacy:**
  - A private profile.
  - Who can comment (everyone, people you follow, nobody).
  - Hide your diary or ratings.
  - Hide from search engines.
  - The blocked list.
- **Notifications:** per type and per channel (5.3).
- **Display:**
  - Theme (built).
  - Poster size.
  - Show TMDB or Filmory ratings first.
  - Hide adult content.
  - Reduced motion override (in addition to the system setting).
- **Region and services** (built; move here from Profile).
- **Data:** import (Letterboxd: diary, ratings, reviews, watchlist, lists, likes), export, delete.

---

## 12. Mobile and app quality

- **Installable app** (`BETTER-UX.md` 5.1), plus native-feeling details:
  - Bottom tab bar on phones: Home, Search, Log (+), Activity, Profile.
  - Pull to refresh on feeds.
  - Swipe a diary row to edit or delete it.
  - Haptics on rating via `navigator.vibrate`, where supported.
- **Share target:** Filmory appears in the phone's share sheet. Sharing a TMDB, IMDb or Letterboxd link opens the matching film in Filmory, ready to log.
- **Offline:** read your diary, watchlist and lists offline. Logs made offline queue up (Firestore persistence is already on).
- **Native apps later:** wrap with Capacitor, or build React Native apps that share the data layer, once the web app is solid.

---

## 13. Import, export and integrations

### 13.1 Import
- **Full Letterboxd import.** Their export zip contains `diary.csv`, `ratings.csv`, `reviews.csv`, `watchlist.csv`, `watched.csv`, `likes/films.csv` and `lists/*.csv`. Map each to logs, ratings, reviews, watchlist, likes and lists, with a preview and confirm step. The current importer handles one CSV into one list; extend it to the whole zip (unzip in the browser with `fflate`).
- **Other sources:** IMDb ratings CSV, Trakt export, and TMDB account lists.
- **Matching:** use the Letterboxd URI and year when present, and fall back to title search. Unmatched rows go to a "Fix matches" screen with a search box per row.

### 13.2 Export
- One click from settings: a zip of CSVs (diary, ratings, reviews, watchlist, lists, likes) in a documented format, plus a JSON file with everything.
- Per list: CSV or plain text.

### 13.3 Integrations
- **Trakt scrobbling** (optional): log films automatically as you watch them on supported apps.
- **Public read API** for your own data (profile, diary RSS):
  - An RSS feed per person: `/u/:username/rss`, with logs and reviews.
  - Embeddable widgets: recent diary and favourite films (extends the current list embed).
- **Calendar:** an `.ics` feed of upcoming releases from your watchlist.

---

## 14. Design-system extensions

Keep the booth identity, and extend it for the new surfaces:
- **Diary rows:** day numbers in Big Shoulders 31px, a thin `--reel` rule between months, and month names as large display headings. No zebra stripes.
- **Hearts and rewatch:** `--velvet` for liked (the cinema-seat red), and a circular-arrow rewatch icon in `--grain`.
- **Review typography:** body face at 18px with 1.65 line height and 68 characters per line, block quotes with a 2px `--beam` rule, and spoiler blur at 8px plus a `--booth` overlay.
- **Stats charts:** bars in `--reel`, the highlighted bar in `--beam`, and axis labels in 13px `--grain`. No gridlines, only a baseline.
- **Avatars:** circular, with a 2px `--booth` ring when they overlap in stacks (friends who watched).
- **Empty states for every new page**, written as invitations to act. For example: "Your diary starts with one film. Log something you watched recently."
- **Motion:**
  - A heart pop when liking (spring, scale 0.6 → 1).
  - Stars fill left to right when rating.
  - The log sheet rises with the existing sheet spring.
  - No new page-load animation except the year in review.

---

## 15. Performance, reliability and quality bar

- **Budgets:**
  - Main JS under 170 kB gzipped (currently 159 kB).
  - Largest Contentful Paint under 2.0s on mid-range phones over 4G.
  - Interaction to Next Paint under 200ms.
- **Images:** use the Next.js `<Image>` component with TMDB sizes, AVIF/WebP for uploaded avatars, and blur-up placeholders generated from the TMDB `w92` poster.
- **Data:**
  - Paginate everything with cursors (`startAfter`); no unbounded queries.
  - Add composite indexes in `firestore.indexes.json`, checked into the repo.
- **Caching:**
  - Film pages are statically generated and revalidated hourly.
  - Social sections (reviews, friends' activity) load on the client.
  - TMDB responses are cached at the edge.
- **Testing:**
  - Unit tests for data helpers (list model, stats maths, CSV import mapping).
  - React Testing Library tests for the log sheet, review editor and comments.
  - Playwright end-to-end tests for sign up, log, review, follow, see in the feed, and get notified.
  - Firestore rules tests for every collection.
- **Monitoring:**
  - Sentry for errors.
  - Function logs with alerts on error rate.
  - A status page.
- **Accessibility:** WCAG 2.2 AA, tested with NVDA, VoiceOver and keyboard only on every new surface. Charts need text alternatives; star ratings are sliders; the feed is an ARIA `feed`.
- **Internationalisation:** `BETTER-UX.md` 5.3, plus localised TMDB titles and posters, and review language filters.

---

## 16. Business and sustainability (optional)

Letterboxd funds itself with ads plus Pro and Patron subscriptions. If Filmory ever needs to:
- **Keep core features free:** logging, reviews, lists, stats, custom posters and region services.
- **A supporter tier** could offer:
  - Profile badges and early features.
  - Extra stats (all-time comparisons).
  - No sponsored placements.
  - Custom profile colours within the booth palette.
- **Ads, if ever:** only clearly labelled, contextual, film-related placements. Never in reviews or lists, and never using tracking.

---

## 17. Order of work

This is a sequence, so it's numbered. Each step makes the next one possible.

1. **Foundations:** Cloud Functions, App Check, counters, data model, rules tests (1.1, 1.4).
2. **Identity:** usernames, avatars, public profile URLs (1.3).
3. **The diary:** log sheet, quick actions, watchlist, ratings and the per-person film summary (2).
4. **Reviews and comments** (3).
5. **Public profiles and stats** (4.1, 4.2).
6. **Follows, the activity feed and notifications** (5).
7. **Film pages:** Filmory ratings, friends' activity, reviews, the full tabs (6).
8. **Next.js migration with server rendering and SEO** (1.2). Do it here, before the content worth indexing grows large.
9. **Search across everything** (8.3), and discovery with Filmory data (8.1, 8.2).
10. **Safety and moderation at scale** (10), and **settings** (11).
11. **Import and export, the full Letterboxd zip** (13).
12. **Taste features** (9), **year in review** (4.3), **mobile polish** (12).

## 18. Done when (the whole document)

- A Letterboxd user can import their whole history in one go, and find their diary, ratings, reviews, watchlist and lists intact.
- Logging a film, writing a review and seeing friends react to it all happen within Filmory, in under a minute.
- A stranger landing on a film page from Google sees Filmory's own ratings, reviews and lists for it, and can sign up and log it in two minutes.
- Every count, feed and notification is correct, private content stays private (proven by rules tests), and the app meets the speed and accessibility budgets in section 15.
