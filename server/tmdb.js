import { providerIdsForKeys } from "./providers.js";
import mockMovies from "./mockMovies.json" with { type: "json" };

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function normalizeTmdbMovie(m) {
  return {
    id: `tmdb-${m.id}`,
    title: m.title,
    year: (m.release_date || "").slice(0, 4) || null,
    overview: m.overview,
    posterUrl: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
  };
}

function mockDeck(serviceKeys, page) {
  const filtered = mockMovies.filter((m) =>
    m.services.some((s) => serviceKeys.includes(s))
  );
  const pageSize = 8;
  const start = (page - 1) * pageSize;
  return filtered.slice(start, start + pageSize).map(({ services, ...rest }) => rest);
}

// Fetches a page of movies available on any of the given streaming services.
export async function fetchDeckPage(serviceKeys, page) {
  if (!TMDB_API_KEY) {
    return mockDeck(serviceKeys, page);
  }

  const providerIds = providerIdsForKeys(serviceKeys);
  if (providerIds.length === 0) return [];

  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("watch_region", "US");
  url.searchParams.set("with_watch_providers", providerIds.join("|"));
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("page", String(page));
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (data.results || []).map(normalizeTmdbMovie);
}

export const usingMockData = !TMDB_API_KEY;
