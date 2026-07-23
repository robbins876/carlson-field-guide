// TMDB "watch provider" IDs for the US region (https://api.themoviedb.org/3/watch/providers/movie)
export const PROVIDERS = [
  { id: 8, key: "netflix", name: "Netflix" },
  { id: 9, key: "prime", name: "Prime Video" },
  { id: 337, key: "disney", name: "Disney+" },
  { id: 1899, key: "max", name: "Max" },
  { id: 15, key: "hulu", name: "Hulu" },
  { id: 350, key: "appletv", name: "Apple TV+" },
  { id: 531, key: "paramount", name: "Paramount+" },
  { id: 386, key: "peacock", name: "Peacock" },
];

export function providerIdsForKeys(keys) {
  return PROVIDERS.filter((p) => keys.includes(p.key)).map((p) => p.id);
}
