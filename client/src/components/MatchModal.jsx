import MovieCard from "./MovieCard.jsx";

export default function MatchModal({ movie, onClose }) {
  if (!movie) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal match-modal" onClick={(e) => e.stopPropagation()}>
        <h2>It's a match! 🎉</h2>
        <p>You both want to watch:</p>
        <div className="match-card-wrap">
          <MovieCard movie={movie} style={{}} dragHandlers={{}} />
        </div>
        <button className="btn btn--primary" onClick={onClose}>
          Keep swiping
        </button>
      </div>
    </div>
  );
}
