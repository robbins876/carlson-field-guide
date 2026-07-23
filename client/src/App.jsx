import { useEffect, useState, useCallback } from "react";
import Landing from "./components/Landing.jsx";
import SwipeDeck from "./components/SwipeDeck.jsx";
import MatchModal from "./components/MatchModal.jsx";
import MatchesList from "./components/MatchesList.jsx";
import { api, wsUrl } from "./api.js";

const STORAGE_KEY = "cineswipe.session";

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export default function App() {
  const [providers, setProviders] = useState([]);
  const [session, setSession] = useState(loadSession);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("swipe");
  const [matches, setMatches] = useState([]);
  const [pendingMatch, setPendingMatch] = useState(null);

  useEffect(() => {
    api.getProviders().then(({ providers }) => setProviders(providers));
  }, []);

  // Rehydrate room info if we have a saved session.
  useEffect(() => {
    if (!session) return;
    api
      .getRoom(session.code)
      .then(({ room }) => setRoom(room))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    api.getMatches(session.code).then(({ matches }) => setMatches(matches)).catch(() => {});
  }, [session]);

  // WebSocket for live updates.
  useEffect(() => {
    if (!session) return undefined;
    const ws = new WebSocket(wsUrl(session.code, session.userId));

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "match") {
        setMatches((prev) => [...prev, { movie: payload.movie, matchedAt: payload.matchedAt }]);
        setPendingMatch(payload.movie);
      } else if (payload.type === "partner_joined") {
        setRoom((prev) => (prev ? { ...prev, users: [...prev.users, payload.user] } : prev));
      }
    };

    return () => ws.close();
  }, [session]);

  const persistSession = useCallback((code, userId, name) => {
    const s = { code, userId, name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  async function handleCreate(name, services) {
    setBusy(true);
    setError("");
    try {
      const { room, userId } = await api.createRoom(name, services);
      setRoom(room);
      persistSession(room.code, userId, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(code, name) {
    setBusy(true);
    setError("");
    try {
      const { room, userId } = await api.joinRoom(code, name);
      setRoom(room);
      persistSession(room.code, userId, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setRoom(null);
    setMatches([]);
  }

  function handleSwiped({ match }) {
    if (match) setPendingMatch(match.movie);
  }

  if (!session || !room) {
    return <Landing providers={providers} onCreate={handleCreate} onJoin={handleJoin} error={error} busy={busy} />;
  }

  const partner = room.users.find((u) => u.id !== session.userId);

  return (
    <div className="screen">
      <header className="room-header">
        <div>
          <h1 className="logo">🎬 CineSwipe</h1>
          <p className="room-meta">
            Room <strong>{room.code}</strong> · {partner ? `with ${partner.name}` : "waiting for your partner to join…"}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={handleLeave}>
          Leave
        </button>
      </header>

      {!partner && (
        <div className="card notice">
          Share this code with your partner so they can join: <strong className="room-code">{room.code}</strong>
        </div>
      )}

      <div className="tabs">
        <button className={`tab${tab === "swipe" ? " tab--active" : ""}`} onClick={() => setTab("swipe")}>
          Swipe
        </button>
        <button className={`tab${tab === "matches" ? " tab--active" : ""}`} onClick={() => setTab("matches")}>
          Matches {matches.length > 0 && <span className="badge-count">{matches.length}</span>}
        </button>
      </div>

      {tab === "swipe" ? (
        <SwipeDeck roomCode={room.code} userId={session.userId} onSwiped={handleSwiped} />
      ) : (
        <MatchesList matches={matches} />
      )}

      <MatchModal movie={pendingMatch} onClose={() => setPendingMatch(null)} />
    </div>
  );
}
