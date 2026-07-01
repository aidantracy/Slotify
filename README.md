## Team Name: CS471-Team13

## Project Name: Slotify

## Project Description:
We will be designing a web app with a similar functionality to the meeting
booking website [youcanbookme.com]([https://www.example.com](https://youcanbook.me/#:~:text=YouCanBookMe%20lets%20you%20create%20the%20best%20booking%20experience%20for%20your))
Users will be able to set a defined number of meeting times on their own calendar to then
have meetings set up with other users or interact with other user's meeting times to set up 
a meeting.

## Team Members:

Last Name       | First Name      | GitHub Username    | Scrum Role
--------------- | --------------- | ------------------ | ---------------
Flinn           | Aidan           | AFlinn53           | Product Owner
Lilya           | Corbin          | corbinlilya        | Scrum Master
Pierce          | Tyler           | tylerpierce683     | Developer
Tracy           | Aidan           | aidantracy         | Developer
Woodard         | Jacob           | jacobwoodard1      | Developer

## :eyes: :memo: Scrum Linter Reports:
Access the [Scrum Linter Report](https://scrumlinter.boisestate.edu/CS471F24ScrumLinterReports/CS471-F24-Team13_msvzqqCCgKXWEFbNY028OASuNj9bQ6xH9mo3f3Gt/). A new report will be automatically generated every few hours.
- Fix all inconsistencies, which are indicated in the report with :heavy_exclamation_mark:
- Aim to obtain :thumbsup: in all the sections of the linter report

## Miscellaneous information
We researched how to deploy the site online. We looked at using both AWS and GitHub Pages.
We decided that GitHub Pages was the best, easiest option., so we setup the repository to work with them.

## Tech Stack
- **Frontend:** static HTML, CSS, and vanilla JavaScript
- **Backend:** Node.js + Express (`js/backend.js`)
- **Database:** SQLite via [libSQL](https://github.com/tursodatabase/libsql) (`@libsql/client`) — a local file in development, [Turso](https://turso.tech) in production

## Running Locally
1. Install dependencies:
   ```
   npm install
   ```
2. Create your environment file:
   ```
   cp .env.example .env
   ```
   The defaults use a local SQLite file (`slotify.db`), so no extra setup is needed.
3. Start the server (it creates the database and tables automatically on first run):
   ```
   npm start
   ```
4. Open http://localhost:3000 in your browser.

The backend serves the frontend and the API from the same port, so a single
`npm start` runs the whole app.

### Configuration
- `js/config.js` sets `API_BASE_URL`, the backend the frontend talks to
  (`http://localhost:3000` locally; your deployed URL in production).
- `.env` holds backend settings (`DATABASE_URL`, optional `PORT`). It is
  git-ignored; `.env.example` documents the available values.

## Database
The schema (`users`, `bookings`, `time_intervals`) is created automatically by
`js/db.js` on startup, and a default "Demo Provider" is seeded so the booking
flow works before real accounts exist.

## Deployment
The same code deploys to any Node host. For a free, always-on database, point
`DATABASE_URL`/`DATABASE_AUTH_TOKEN` at a [Turso](https://turso.tech) database
(its free tier does not sleep). Because it's libSQL, no code changes are needed —
only the connection string.



