# Better UX

Five phases that take Filmory from "looks finished" to "feels effortless". `REDESIGN.md` covered how every screen looks and moves. This file covers how the app behaves: speed, memory, trust, and the jobs people actually come here to do.

Do the phases in order. Each one fixes problems that would make the next one feel broken. Every item says why it matters, what to build, and how you'll know it worked.

People come to Filmory to do three things:
1. **Decide what to watch tonight.**
2. **Remember films they've heard about.**
3. **Share taste with other people.**

Every item below serves at least one of them.

---

## Phase 1: Fast, safe, and never lost

People forgive plain design. They don't forgive waiting, losing their place, or losing their data. Fix those first.

### 1.1 Back means back
**Why:** today every navigation scrolls to the top, including Back. Open a film from row 3 of Home, press Back, and you land at the top of Home with the rows reset.
**Build:**
- Only scroll to top on forward (PUSH) navigation. On Back/Forward (POP), restore the saved scroll position for that history entry (`useNavigationType`).
- Remember each Home row's sideways scroll position.
- Discover's "Show more" results survive a round trip to a film and back.

**Done when:** open a film from anywhere, press Back, and you're looking at exactly the same thing, at the same scroll position.

### 1.2 Instant-feeling navigation
**Why:** every page fetches from scratch, so you get a skeleton even for a film you opened ten seconds ago.
**Build:**
- An in-memory TMDB cache with stale-while-revalidate: show cached data immediately and refresh in the background. Keep it for the session, and mirror small responses (genres, popular lists) to `sessionStorage`.
- Prefetch the details page when a card is hovered for 150ms, or comes into view on touch screens.
- Load routes lazily (`React.lazy`) so the first visit to Home doesn't download the auth, lists and Discover code.
- Add `preconnect` to `image.tmdb.org`. Give posters `srcset`/`sizes` (`w185` / `w342` / `w500`) so phones stop downloading desktop images.

**Done when:**
- Reopening any film shows real content in under 100ms.
- Lighthouse mobile performance is 90 or above on Home.
- The first-load JavaScript is under 170 kB gzipped (it's about 238 kB now).

### 1.3 Real sign-in, not a remembered email
**Why:** the app treats "logged in" as "an email is saved in `localStorage`". Anyone can type someone else's email into DevTools and the app will show and edit that person's lists. This is a trust problem first and a security problem second.
**Build:**
- Use Firebase's own session (`onAuthStateChanged`) as the single source of truth, exposed through an `AuthContext`. Delete `localStorage.loggedInUser`.
- Store lists with the owner's real `uid`.
- Write Firestore security rules: read if `isPublic` or you're the owner; write only if you're the owner.
- Migrate existing lists from the `"/Users/<uid>"` string to a `uid` field.

**Done when:** editing `localStorage` can't reveal or change anyone's private lists, and the security rules have tests (Firebase emulator).

### 1.4 Nothing is ever silently lost
**Why:** a failed save today shows a toast at best. A crash shows a blank screen.
**Build:**
- A React error boundary per route. The copy is "This page hit a problem. Reload it, or go back to Home." with both buttons, and the error is logged.
- When offline: a quiet banner ("You're offline. Changes will save when you reconnect."). Turn on Firestore's offline persistence so list edits queue up instead of failing.
- Retry failed TMDB requests once with backoff before showing an error. Every error state gets a "Try again" button.
- Return to where you were after logging in: send logged-out actions like "Add to list" to `/login?next=<current URL>`, then back again, and finish the action that started it.

**Done when:**
- Pulling the network mid-session never shows a blank page or a dead button.
- Logging in from a film page returns you to that film with your add-to-list already done.

**Phase 1 done when:** a new user can browse, sign up, save a film and come back the next day without waiting, getting lost, or losing anything.

---

## Phase 2: Finding the right film faster

The core job is "what should I watch?" Make every path to an answer shorter.

### 2.1 Search that remembers
- Show **recent searches** (last 8, stored on this device) when the field is focused and empty, with a "Clear" button.
- Show **recently viewed films** under the recent searches.
- Search people too (TMDB `/search/person`). Picking an actor opens their films in Discover (`with_cast`).
- Tolerate typos: if a search returns nothing, try once with `include_adult=false` and the original-language title before showing the empty state.

**Done when:** you can get back to a film you looked at yesterday in two keystrokes.

### 2.2 "Where can I watch it?"
**Why:** Filmory doesn't stream. The very next question after "this looks good" is "where?", and today the answer is "go somewhere else and search".
**Build:**
- On the details page, use TMDB's `/watch/providers` to show streaming, rent and buy options for the viewer's region, with provider logos. Include JustWatch attribution, which TMDB requires.
- Add a region setting on Profile, defaulting to the browser locale.
- Add a "Streaming on" filter in Discover (`with_watch_providers`) using the user's own services.

**Done when:** from any film, you can see in one glance whether you can watch it tonight, and where.

### 2.3 Discover that knows you
- **Saved filters:** "Save these filters" on Discover. Saved sets appear as chips at the top ("Friday horror", "80s sci-fi").
- **More useful filters:** runtime ("Under 2 hours"), minimum rating, original language, and "Hide films in my lists".
- **Surprise me:** a button that opens a random film from the current results.

**Done when:** a returning user's most common filter combination takes one tap.

### 2.4 Better details-page decisions
- Show IMDb, Rotten Tomatoes and Metacritic scores if a source is added (OMDb). Otherwise keep TMDB only and say so ("TMDB users").
- For series: a season and episode list, with episode runtimes.
- Director, writers and the top crew line under the title.
- Make the cast clickable: an actor page listing their films, sorted by popularity.
- Keyword chips (TMDB `/keywords`) that open Discover filtered by that keyword.

**Done when:** you can decide on a film without leaving Filmory.

**Phase 2 done when:** usability test: five people each find "something to watch tonight on a service I have" in under 60 seconds, with no help.

---

## Phase 3: Lists people actually live in

Lists are the reason to create an account. Make them worth returning to.

### 3.1 Watched, and what I thought
- A **watched** toggle on every film (on cards, the details page and list pages). Lists show progress: "7 of 12 watched", with a thin beam bar.
- An optional **personal rating** (half stars, 0.5 to 5) and a short **note** per film per list ("Recommended by Sam").
- A filter on every list: All / To watch / Watched.

**Done when:** a list can be used as a watch plan from start to finish.

### 3.2 Arrange and tidy
- **Drag to reorder** (the stretch goal left over from the redesign), with keyboard reordering (select, then arrow keys) for accessibility.
- **Sort within a list:** your order, recently added, release year, rating, runtime.
- **Bulk select:** remove, move or copy several films at once.
- **Cover choice:** pick which poster leads the fan on the tile.
- Warn about duplicates: "Already in Weekend horror" in the list picker.

**Done when:** a 50-film list is as easy to manage as a 5-film one.

### 3.3 Faster adding
- **Add from anywhere:** quick-add already exists on cards. Add keyboard support too: `L` on a focused card or details page opens the list picker.
- **Last-used list first:** the picker sorts by most recently used, and Enter adds to the top one.
- **Paste a list:** paste titles, one per line, and Filmory matches each to TMDB with a confirm step before adding them all. Good for moving over from notes apps.
- **Import from Letterboxd CSV** (watched and watchlist exports).

**Done when:** moving an existing 100-film watchlist into Filmory takes under five minutes.

### 3.4 Undo everywhere
- Every destructive action gets Undo in its toast: removing a film (done), deleting a list (soft delete for 10 seconds), making a list private, and bulk actions.
- Deleted lists stay in a "Recently deleted" area on My lists for 30 days.

**Done when:** no single click can permanently destroy something.

**Phase 3 done when:** in a test group, people who make a list come back to it at least twice in their first two weeks.

---

## Phase 4: Sharing and other people

Public lists exist, but they're a dead end today. You can look at someone's list and that's it.

### 4.1 Lists worth sharing
- **Link previews:** when a public list link is pasted into a chat, it should show the list name, author and poster fan. CRA can't render these on the server, so add one small serverless function (e.g. a Vercel or Firebase function at `/l/:id`) that returns Open Graph tags and redirects people on to the app.
- **Share sheet:** use `navigator.share` on phones, and copy the link on desktop (done).
- **Embed:** a "Copy embed" option for blogs, rendering a compact poster strip.

**Done when:** a shared link looks like a real thing in iMessage, WhatsApp and Slack.

### 4.2 React and keep
- **Likes:** add a heart on public lists, show counts on tiles, and add a "Most liked" sort. (An old page imported a `likeaList` helper, but it was never written; this needs building from scratch, plus a security rule that lets anyone signed in change only the like count.)
- **Save a copy:** "Copy to my lists" on any public list.
- **Follow an author:** a person's page shows their public lists. Following someone shows their new lists on Home ("New from people you follow").

**Done when:** a public list can turn a visitor into a sign-up. Track this as visits to `/publicListInside` → account created.

### 4.3 Collaborate
- **Shared lists:** invite someone by link to add films to a list ("Movie night with Sam"). Show who added each film with a small avatar.
- **Pick tonight's film together:** on a shared list, each member marks interest, and the list highlights films everyone wants.

**Done when:** two people can plan a movie night in one list without messaging each other.

### 4.4 Safety
- Report a public list (name or description), and a basic moderation flag in Firestore.
- A profanity check on public list names and descriptions before publishing, with a clear message about what to change.
- Authors can hide their name on public lists ("Shown as Anonymous").

**Phase 4 done when:** at least one in five public list views comes from a shared link, and there are reporting and hiding controls for every piece of public content.

---

## Phase 5: Everyone, everywhere, measured

Make it work for every person and every device, then use real data to keep improving it.

### 5.1 Installable and offline
- Make Filmory a PWA: manifest, icons (the lens mark), and a service worker. Cache the app shell and recently viewed films, so lists and recent details open with no connection.
- Give it a home-screen name and the right theme colour per theme.

**Done when:** the installed app opens to your lists offline, in airplane mode.

### 5.2 Inclusive by testing, not by assumption
- Automated checks: `axe-core` in tests for every route, failing the build on serious issues.
- Manual passes:
  - NVDA + Firefox and VoiceOver + Safari through the full "find a film, add to a list, share it" journey.
  - Keyboard only.
  - 200% zoom.
  - Windows high contrast.
- Add a keyboard shortcuts sheet (`?`) listing `/`, `Ctrl+K`, `L`, arrows in rows and the hero, and Esc.
- Captions: always request YouTube captions in the trailer embed (`cc_load_policy=1`), following the viewer's language.

**Done when:** a screen-reader user completes the core journey unaided, and axe reports zero serious issues.

### 5.3 Your language and region
- Pull every UI string into one copy file, then add i18n (`react-intl`) starting with French and Arabic. Arabic covers right-to-left layout: logical CSS properties, and mirrored chevrons and swipe directions.
- Ask TMDB for titles, overviews and posters in the viewer's language (`language=`), and fall back to English.
- Format dates, numbers and runtimes with the viewer's locale (most already go through `Intl`).

**Done when:** switching to Arabic mirrors the whole layout correctly, and film text appears in Arabic when TMDB has it.

### 5.4 Measure, test, repeat
- **Privacy-friendly analytics** (e.g. Plausible) with a few named events:
  - `search_used`
  - `film_opened`
  - `added_to_list` (with source: card, details, hero, search)
  - `list_created`
  - `list_shared`
  - `signup_completed`
- **Funnel to watch:** first visit → film opened → added to list → account created → returned within 7 days.
- **Error monitoring** (e.g. Sentry) wired to the error boundaries from Phase 1.
- **Tests:** there are none today. Add:
  - React Testing Library tests for the list picker, search keyboard behaviour, list sheet validation and auth errors.
  - One Playwright end-to-end test for the core journey, run in CI.
- **Performance budget** in CI: fail if the JS bundle grows past the Phase 1 target, or Lighthouse drops below 90.
- **A five-person usability test every quarter,** with findings logged in this file under a "Findings" heading.

**Done when:** every change can be judged by numbers (funnel, errors, speed), not opinion, and regressions are caught before release.

**Phase 5 done when:** Filmory installs, works offline, reads correctly in two more languages, passes a screen-reader journey, and has a dashboard showing whether each change made the experience better.

---

## Order of value at a glance

If time is short, these six items move the experience the most, in this order:
1. Back restores your place (1.1).
2. Real sign-in and security rules (1.3).
3. Where to watch (2.2).
4. Watched status and progress on lists (3.1).
5. Return to where you were after login (1.4).
6. Link previews for shared lists (4.1).
