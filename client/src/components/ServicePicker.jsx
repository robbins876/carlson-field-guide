export default function ServicePicker({ providers, selected, onToggle }) {
  return (
    <div className="service-grid">
      {providers.map((p) => {
        const active = selected.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            className={`service-chip${active ? " service-chip--active" : ""}`}
            onClick={() => onToggle(p.key)}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
