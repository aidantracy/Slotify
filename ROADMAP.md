# Slotify — Completion Roadmap

A plan to finish Slotify (a YouCanBook.me-style meeting booking app) into a working, portfolio-ready project. Balanced for both solid functionality and clean presentation.

## Progress
- **Phase 0 (Foundation & cleanup): DONE.** Single backend, one API-base config, secrets in `.env`, quick bugs fixed, dead code removed. The backend also now serves the frontend, so `npm start` runs the whole app on one port.
- **Database switched from Supabase to SQLite (libSQL).** Local dev uses a SQLite file; production can use Turso's free always-on tier with no code changes. This is why the auth and access-control notes below no longer reference Supabase Auth / Row-Level Security.

---

## 1. Where the project stands today

**Working**
- Month-view calendar on `index.html` with prev/next navigation.
- Per-day available-slot fetching and a confirm-booking form.
- A Supabase-backed Express API (`backend.js`) with routes for slots, bookings, and users.
- A defined database schema (`users`, `bookings`, `time_intervals`).

**Broken / unfinished**
- **Single hardcoded provider.** The backend uses `provider_id = 1` everywhere. There is one global calendar and one global booking list — the opposite of a multi-user "book me" product.
- **No authentication.** `login.html` is a copy of the error page. The `users.password` column is never used. No signup, login, or session.
- **Fake profile page.** `profile.html` only echoes typed input to the screen and POSTs to `http://localhost:5500`, which exists nowhere in production. Nothing loads or persists.
- **Inconsistent API endpoints.** The frontend points at three different backends: `http://3.16.130.244` (bare EC2 IP, no HTTPS), `localhost:5500`, and `localhost:3000`. There are two near-identical `backend.js` files (root and `js/`).
- **Global "My Meetings".** `eventPage.html` shows every booking in the database to every visitor.
- **Dead code.** `src/calendar.js`, `src/event.js`, `src/user.js` are unused OOP models; `Calendar.main()` runs test output on every import.
- **Committed secrets.** Supabase URL + anon key are in the source. With no row-level security, the tables are effectively open.

**Known small bugs**
- First/last name `<label>`s are swapped in the booking form.
- `confirmBooking()` attaches a new submit listener on every click (double-binding).
- `checkConflict()` returns inside the first loop iteration, so it only ever checks one slot.
- The `add-booking` route ignores `end_time`, though the frontend sends it.

---

## 2. Target state

A visitor can:
1. Land on a provider's public page (e.g. `/book/aidan`) and book an open slot.

A registered user (provider) can:
2. Sign up and log in.
3. Set their own availability (working hours / open slots).
4. See only *their* incoming bookings on a dashboard.
5. Edit a real, persisted profile.

Plus a clean README, live demo, and no committed secrets — so it holds up as a portfolio piece.

---

## 3. Phased plan

Each phase is independently shippable and leaves the app in a working state. Rough effort estimates assume solo evenings/weekends.

### Phase 0 — Foundation & cleanup  *(~half a day)*
Unblocks everything else; low risk.

- Delete the duplicate backend. Keep one `backend.js` (recommend `js/backend.js` to match the `Procfile`) and remove the other.
- Introduce a single `API_BASE_URL` constant (or small `config.js`) used by every fetch call. Replace all three hardcoded hosts.
- Move `supabaseUrl` / `supabaseKey` into environment variables (`.env` + `process.env` on the backend; a small injected config or build step for the client). Add `.env` to `.gitignore`. Rotate the exposed key in Supabase.
- Remove `Calendar.main()` side-effect import, or move the `src/` classes behind a test entry point.
- Fix the quick bugs: swapped name labels, the `checkConflict` early-return, and the `confirmBooking` double-binding.

**Done when:** the app runs from a single backend and single config, no secrets in git, and the booking flow still works.

### Phase 1 — Authentication  *(~1–2 days)*
The feature that turns a demo into a product.

- Implement email/password auth in the Express backend: hash passwords with **bcrypt** (populating the existing `users.password` column) and issue a session via **JWT** (stateless, easy to deploy) or **express-session**.
- Build a real `login.html` + `signup.html` (replace the placeholder error-page copy).
- Store the session client-side via the Supabase JS client; gate `profile.html` and `eventPage.html` behind a logged-in check, redirecting to login otherwise.
- Add a logout control to the nav.

**Done when:** a new user can sign up, log in, stay logged in across pages, and log out.

### Phase 2 — Per-user booking pages  *(~2–3 days)*
Removes the `provider_id = 1` assumption — the core of the clone.

- Give each provider a public slug/route (e.g. `book.html?u=aidan` or `/book/:slug`).
- Update `get-available-slots`, `add-booking`, and `get-bookings` to take a `provider_id` (resolved from the slug) instead of the hardcoded `1`.
- Let a logged-in provider define availability (working hours, slot length via the existing `time_intervals` table) instead of the hardcoded 7 AM–8 PM / 30-min window.
- Scope `eventPage.html` ("My Meetings") to the logged-in provider only.

**Done when:** two different accounts have independent booking pages and dashboards that don't leak into each other.

### Phase 3 — Real profile & dashboard  *(~1 day)*
- Wire `profile.html` to load the logged-in user's record on page load and persist edits to Supabase.
- Reconcile the profile form fields (name/address/phone/company) with the actual schema — either extend the `users` table or trim the form.
- Booking dashboard: show upcoming vs. past, allow cancel.

**Done when:** profile data survives a refresh and reflects the database.

### Phase 4 — Polish & presentation  *(~1–2 days)*
The portfolio layer.

- Enforce access control in the backend: every booking/slot query is scoped by the authenticated provider's id, and write routes verify ownership before mutating rows.
- Add booking confirmation feedback (success/failure states) and basic email validation reuse from `src/user.js`.
- Responsive/mobile pass on the calendar and forms.
- Rewrite `README.md` for a portfolio audience: screenshots/GIF, tech stack, live demo link, "run locally" steps, and a short architecture note. Remove the internal class/scrum-linter content.
- Pick one hosting story and make it work end to end (Heroku is already referenced; confirm the live URL, or move to Render/Fly/Vercel + Supabase). Fix `slottify.xyz` or drop it.

**Done when:** a stranger can open the live link, book a meeting, and read a README that explains the project.

---

## 4. Suggested milestone ordering

If the goal is the strongest portfolio result per unit of effort:

1. **Phase 0** — always first; it's cheap and everything depends on it.
2. **Phase 1 (Auth)** — biggest credibility jump.
3. **Phase 2 (Per-user pages)** — the feature that makes it a real "book me" clone.
4. **Phase 4 polish items you can do early** — RLS and README screenshots can start once auth exists.
5. **Phase 3** — rounds out the UX.

A reasonable "minimum impressive" stopping point is end of Phase 2 + the README/RLS parts of Phase 4.

---

## 5. Risks & decisions to make

- **Auth approach:** since we're on plain SQLite, auth is built in the backend (bcrypt + JWT/session). Keep it minimal and standard; don't over-build.
- **Hosting:** the old Heroku + bare-EC2-IP mix is gone. Pick one Node host and one HTTPS domain, and use Turso for the database, before Phase 4.
- **API style:** the routes currently mix `GET` for writes (`add-booking` via query string). Consider moving writes to `POST` with JSON bodies during Phase 2 — cleaner and expected by reviewers.
- **Schema drift:** the profile form fields don't match the `users` table. Decide the canonical user shape early in Phase 3.
