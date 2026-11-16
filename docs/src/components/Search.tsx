import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { search } from "../lib/content";

export function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = useMemo(() => search(q), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => input.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    navigate(r.path + (r.anchor ? `#${r.anchor}` : ""));
    onClose();
  };

  return (
    <div className="search-backdrop" onMouseDown={onClose}>
      <div className="search-box" role="dialog" aria-label="Search the docs" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          value={q}
          placeholder="Search the docs…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") go(active);
          }}
        />
        <div className="search-results">
          {q && results.length === 0 && <div className="search-empty">No results for “{q}”.</div>}
          {!q && <div className="search-empty">Type to search guides, props and examples.</div>}
          {results.map((r, i) => (
            <button
              key={r.path + (r.anchor ?? "")}
              className={`search-item ${i === active ? "active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(i)}
            >
              <span className="search-page">{r.page}</span>
              <span className="search-heading">{r.heading === r.page ? "Overview" : r.heading}</span>
            </button>
          ))}
        </div>
        <div className="search-foot">
          <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close
        </div>
      </div>
    </div>
  );
}
