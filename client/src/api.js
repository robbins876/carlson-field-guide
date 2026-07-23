const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  getProviders: () => request("/providers"),
  createRoom: (name, services) =>
    request("/rooms", { method: "POST", body: JSON.stringify({ name, services }) }),
  joinRoom: (code, name) =>
    request(`/rooms/${code}/join`, { method: "POST", body: JSON.stringify({ name }) }),
  getRoom: (code) => request(`/rooms/${code}`),
  getDeck: (code, userId) => request(`/rooms/${code}/deck?userId=${encodeURIComponent(userId)}`),
  swipe: (code, userId, movie, direction) =>
    request(`/rooms/${code}/swipe`, {
      method: "POST",
      body: JSON.stringify({ userId, movie, direction }),
    }),
  getMatches: (code) => request(`/rooms/${code}/matches`),
};

export function wsUrl(code, userId) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?roomCode=${code}&userId=${userId}`;
}
