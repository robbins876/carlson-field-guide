import { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard.jsx";
import { api } from "../api.js";

const SWIPE_THRESHOLD = 100;

export default function SwipeDeck({ roomCode, userId, onSwiped }) {
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const seenIds = useRef(new Set());

  const [drag, setDrag] = useState(null); // { startX, dx }
  const draggingRef = useRef(false);

  async function loadMore() {
    try {
      const { movies } = await api.getDeck(roomCode, userId);
      const fresh = movies.filter((m) => !seenIds.current.has(m.id));
      fresh.forEach((m) => seenIds.current.add(m.id));
      setDeck((prev) => [...prev, ...fresh]);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deck.length <= 2 && !loading) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length]);

  async function commitSwipe(movie, direction) {
    setDeck((prev) => prev.filter((m) => m.id !== movie.id));
    setDrag(null);
    try {
      const { match } = await api.swipe(roomCode, userId, movie, direction);
      onSwiped({ movie, direction, match });
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  function handlePointerDown(e) {
    draggingRef.current = true;
    setDrag({ startX: e.clientX, dx: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!draggingRef.current || !drag) return;
    setDrag((d) => ({ ...d, dx: e.clientX - d.startX }));
  }

  function handlePointerUp() {
    if (!draggingRef.current || !drag) return;
    draggingRef.current = false;
    const top = deck[0];
    if (Math.abs(drag.dx) > SWIPE_THRESHOLD && top) {
      commitSwipe(top, drag.dx > 0 ? "like" : "pass");
    } else {
      setDrag(null);
    }
  }

  if (loading && deck.length === 0) {
    return <div className="screen-center">Loading movies…</div>;
  }

  if (errorMsg && deck.length === 0) {
    return <div className="screen-center error">{errorMsg}</div>;
  }

  if (deck.length === 0) {
    return (
      <div className="screen-center">
        <p>You're all caught up! Check back later for more titles, or wait for your partner.</p>
      </div>
    );
  }

  const visible = deck.slice(0, 3);

  return (
    <div className="deck">
      <div className="card-stack">
      {visible
        .slice()
        .reverse()
        .map((movie, idxFromBack) => {
          const isTop = idxFromBack === visible.length - 1;
          const dx = isTop && drag ? drag.dx : 0;
          const rotate = dx / 18;
          const stackIndex = visible.length - 1 - idxFromBack;
          const style = isTop
            ? {
                transform: `translateX(${dx}px) rotate(${rotate}deg)`,
                transition: drag ? "none" : "transform 0.25s ease",
                zIndex: 10,
              }
            : {
                transform: `translateY(${stackIndex * 8}px) scale(${1 - stackIndex * 0.03})`,
                zIndex: 10 - stackIndex,
              };
          const badge = isTop && drag ? (drag.dx > 30 ? "like" : drag.dx < -30 ? "pass" : null) : null;

          return (
            <MovieCard
              key={movie.id}
              movie={movie}
              style={style}
              badge={badge}
              dragHandlers={
                isTop
                  ? {
                      onPointerDown: handlePointerDown,
                      onPointerMove: handlePointerMove,
                      onPointerUp: handlePointerUp,
                      onPointerCancel: handlePointerUp,
                    }
                  : {}
              }
            />
          );
        })}
      </div>

      <div className="swipe-buttons">
        <button className="swipe-btn swipe-btn--pass" onClick={() => commitSwipe(deck[0], "pass")}>
          ✕
        </button>
        <button className="swipe-btn swipe-btn--like" onClick={() => commitSwipe(deck[0], "like")}>
          ♥
        </button>
      </div>
    </div>
  );
}
