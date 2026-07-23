const GRADIENTS = [
  "linear-gradient(135deg, #6a11cb, #2575fc)",
  "linear-gradient(135deg, #ff5f6d, #ffc371)",
  "linear-gradient(135deg, #11998e, #38ef7d)",
  "linear-gradient(135deg, #c31432, #240b36)",
  "linear-gradient(135deg, #0f2027, #2c5364)",
  "linear-gradient(135deg, #8e2de2, #4a00e0)",
];

function gradientFor(id) {
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function MovieCard({ movie, style, dragHandlers, badge }) {
  return (
    <div className="movie-card" style={style} {...dragHandlers}>
      {badge && <div className={`swipe-badge swipe-badge--${badge}`}>{badge === "like" ? "YES" : "PASS"}</div>}
      <div className="movie-poster" style={!movie.posterUrl ? { background: gradientFor(movie.id) } : undefined}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} draggable={false} />
        ) : (
          <span className="poster-fallback-title">{movie.title}</span>
        )}
      </div>
      <div className="movie-info">
        <h3>
          {movie.title} {movie.year && <span className="movie-year">({movie.year})</span>}
        </h3>
        <p>{movie.overview}</p>
      </div>
    </div>
  );
}
