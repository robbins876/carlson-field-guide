import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { customAlphabet } from "nanoid";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { fetchDeckPage, usingMockData } from "./tmdb.js";
import { PROVIDERS } from "./providers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);
const makeId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

const app = express();
app.use(cors());
app.use(express.json());

function getRoom(code) {
  return db.data.rooms[code?.toUpperCase()];
}

function publicRoom(room) {
  return {
    code: room.code,
    services: room.services,
    users: room.users.map(({ id, name }) => ({ id, name })),
    createdAt: room.createdAt,
  };
}

function otherUser(room, userId) {
  return room.users.find((u) => u.id !== userId);
}

// --- Rooms ---

app.post("/api/rooms", async (req, res) => {
  const { name, services } = req.body;
  if (!name || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: "name and at least one service are required" });
  }

  const code = nanoid();
  const userId = makeId();
  const room = {
    code,
    createdAt: Date.now(),
    services,
    users: [{ id: userId, name }],
    swipes: {},
    matches: [],
  };
  db.data.rooms[code] = room;
  await db.write();

  res.json({ room: publicRoom(room), userId });
});

app.post("/api/rooms/:code/join", async (req, res) => {
  const room = getRoom(req.params.code);
  const { name } = req.body;
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (!name) return res.status(400).json({ error: "name is required" });
  if (room.users.length >= 2) return res.status(409).json({ error: "Room is already full" });

  const userId = makeId();
  room.users.push({ id: userId, name });
  await db.write();

  broadcast(room.code, { type: "partner_joined", user: { id: userId, name } });
  res.json({ room: publicRoom(room), userId });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ room: publicRoom(room) });
});

app.get("/api/providers", (req, res) => {
  res.json({ providers: PROVIDERS.map(({ key, name }) => ({ key, name })), usingMockData });
});

// --- Deck ---

app.get("/api/rooms/:code/deck", async (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const { userId } = req.query;
  if (!room.users.some((u) => u.id === userId)) {
    return res.status(403).json({ error: "Not a member of this room" });
  }

  const seen = new Set(Object.keys(room.swipes[userId] || {}));
  const results = [];
  let page = 1;
  const maxPages = 6;

  try {
    while (results.length < 10 && page <= maxPages) {
      const batch = await fetchDeckPage(room.services, page);
      if (batch.length === 0) break;
      for (const movie of batch) {
        if (!seen.has(movie.id) && !results.some((r) => r.id === movie.id)) {
          results.push(movie);
        }
      }
      page += 1;
    }
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Failed to fetch movies" });
  }

  res.json({ movies: results.slice(0, 10) });
});

// --- Swipes / matches ---

app.post("/api/rooms/:code/swipe", async (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const { userId, movie, direction } = req.body;
  if (!room.users.some((u) => u.id === userId)) {
    return res.status(403).json({ error: "Not a member of this room" });
  }
  if (!movie || !movie.id || !["like", "pass"].includes(direction)) {
    return res.status(400).json({ error: "movie and a valid direction are required" });
  }

  room.swipes[userId] ||= {};
  room.swipes[userId][movie.id] = { direction, movie };

  let match = null;
  if (direction === "like") {
    const partner = otherUser(room, userId);
    const partnerSwipe = partner && room.swipes[partner.id]?.[movie.id];
    if (partnerSwipe?.direction === "like") {
      match = { movie, matchedAt: Date.now() };
      room.matches.push(match);
    }
  }

  await db.write();

  if (match) {
    broadcast(room.code, { type: "match", movie: match.movie, matchedAt: match.matchedAt });
  }

  res.json({ match });
});

app.get("/api/rooms/:code/matches", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({ matches: room.matches });
});

// --- Static client build (production) ---

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

// --- WebSocket (match notifications) ---

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`CineSwipe server listening on :${PORT}${usingMockData ? " (using mock movie data — set TMDB_API_KEY for live data)" : ""}`);
});

const wss = new WebSocketServer({ server, path: "/ws" });
const roomSockets = new Map(); // roomCode -> Set<ws>

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const code = url.searchParams.get("roomCode")?.toUpperCase();
  if (!code || !getRoom(code)) {
    ws.close();
    return;
  }
  if (!roomSockets.has(code)) roomSockets.set(code, new Set());
  roomSockets.get(code).add(ws);

  ws.on("close", () => {
    roomSockets.get(code)?.delete(ws);
  });
});

function broadcast(code, payload) {
  const sockets = roomSockets.get(code);
  if (!sockets) return;
  const message = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
}
