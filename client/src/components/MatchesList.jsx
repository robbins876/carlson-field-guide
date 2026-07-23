export default function MatchesList({ matches }) {
  if (matches.length === 0) {
    return <div className="screen-center">No matches yet — keep swiping!</div>;
  }
  return (
    <div className="matches-list">
      {matches
        .slice()
        .sort((a, b) => b.matchedAt - a.matchedAt)
        .map((m) => (
          <div key={m.movie.id} className="match-row">
            <div
              className="match-thumb"
              style={!m.movie.posterUrl ? { background: "linear-gradient(135deg, #6a11cb, #2575fc)" } : undefined}
            >
              {m.movie.posterUrl ? <img src={m.movie.posterUrl} alt={m.movie.title} /> : null}
            </div>
            <div>
              <h4>
                {m.movie.title} {m.movie.year && <span className="movie-year">({m.movie.year})</span>}
              </h4>
              <p className="match-time">{new Date(m.matchedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
    </div>
  );
}
