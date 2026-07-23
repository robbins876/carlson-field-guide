import { useState } from "react";
import ServicePicker from "./ServicePicker.jsx";

export default function Landing({ providers, onCreate, onJoin, error, busy }) {
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [services, setServices] = useState([]);

  function toggleService(key) {
    setServices((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "create") {
      onCreate(name.trim(), services);
    } else {
      onJoin(code.trim(), name.trim());
    }
  }

  const canSubmit =
    mode === "create" ? name.trim() && services.length > 0 : name.trim() && code.trim().length === 5;

  return (
    <div className="screen landing">
      <h1 className="logo">🎬 CineSwipe</h1>
      <p className="tagline">Swipe on movies together. When you both say yes, it's a match.</p>

      <div className="tabs">
        <button
          className={`tab${mode === "create" ? " tab--active" : ""}`}
          onClick={() => setMode("create")}
          type="button"
        >
          Start a room
        </button>
        <button
          className={`tab${mode === "join" ? " tab--active" : ""}`}
          onClick={() => setMode("join")}
          type="button"
        >
          Join a room
        </button>
      </div>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" maxLength={30} />
        </label>

        {mode === "create" ? (
          <label className="field">
            <span>Which streaming services do you two share?</span>
            <ServicePicker providers={providers} selected={services} onToggle={toggleService} />
          </label>
        ) : (
          <label className="field">
            <span>Room code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB3XQ"
              maxLength={5}
              className="code-input"
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={!canSubmit || busy}>
          {busy ? "Please wait…" : mode === "create" ? "Create room" : "Join room"}
        </button>
      </form>
    </div>
  );
}
