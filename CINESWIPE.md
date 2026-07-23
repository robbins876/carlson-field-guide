# CineSwipe

A movie-matching app for couples: you and your partner each swipe right or
left on movies available on your shared streaming services. When you both
swipe right on the same title, you get a match.

Inspired by [this idea](https://reddit.com/r/meirl): "what if there was an
app that both you and your partner have where you both swipe right or left
on movies that are on your streaming services and when you find a match it
lets you know."

## How it works

- One partner **creates a room**, picks their name, and selects which
  streaming services you share (Netflix, Prime Video, Disney+, Max, Hulu,
  Apple TV+, Paramount+, Peacock). This generates a 5-character room code.
- The other partner **joins the room** with that code and their own name.
- Both partners see the same deck of movies (pulled from those services)
  and swipe: right (♥) to like, left (✕) to pass.
- The moment you've *both* liked the same movie, a "It's a match!" screen
  pops up live for both of you (over a WebSocket), and it's saved to a
  shared **Matches** tab.

## Project layout

```
server/   Node/Express API + WebSocket server + TMDB integration
client/   React (Vite) frontend
```

The server serves the built client too, so in production it's a single
deployable Node app.

## Movie data

Movie titles, posters, and "what's streaming where" data come from
[TMDB](https://www.themoviedb.org/)'s `discover` and watch-providers API.

1. Create a free account at themoviedb.org.
2. Get an API key/read access token at
   https://www.themoviedb.org/settings/api.
3. Copy `server/.env.example` to `server/.env` and set `TMDB_API_KEY`.

**No API key yet?** The app runs fine without one — it falls back to a
small bundled set of sample movies tagged with fake streaming services, so
you can try the whole flow (rooms, swiping, matching) immediately.

Note: for the MVP, streaming-service selection is set once per room (by
whoever creates it) rather than per-person — this keeps the "what movies
can we both actually watch" logic simple. Region is fixed to the US
TMDB catalog.

## Local development

Requires Node 18+.

```bash
# terminal 1 — API server
cd server
npm install
cp .env.example .env   # add your TMDB_API_KEY, or leave blank for mock data
npm run dev

# terminal 2 — frontend (proxies /api and /ws to the server)
cd client
npm install
npm run dev
```

Open the printed Vite URL (usually http://localhost:5173) in two browser
windows/tabs (or two devices on the same network pointed at your machine's
IP) to try it as two partners.

## Production build

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start
```

This serves the built client and the API from a single Node process on
`PORT` (default 3001).

## Deploying so two phones can actually use it

Since matches need to sync between two separate devices, the server needs
to be reachable from the internet. A simple path:

1. Push this repo to GitHub (already done here).
2. Deploy `server/` (with the client pre-built into `client/dist`, or run
   the build step as part of your host's build command) to a Node host
   such as Render, Railway, or Fly.io.
3. Set the `TMDB_API_KEY` environment variable on that host.
4. Note the data store (`server/data.json` via lowdb) is a flat file on
   disk — fine for a couple of rooms, but it resets if the host's
   filesystem is ephemeral (e.g. some free tiers). For anything longer-term,
   swap `db.js` for a hosted database (Postgres, SQLite on a persistent
   volume, etc.) — the rest of the app doesn't need to change.
