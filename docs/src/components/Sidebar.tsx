import { NavLink } from "react-router-dom";
import { nav } from "../lib/content";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Documentation navigation">
        {nav.map((g) => (
          <div className="nav-group" key={g.section}>
            <div className="nav-title">{g.section}</div>
            {g.pages.map((p) => (
              <NavLink key={p.path} to={p.path} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {p.title}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="nav-group">
          <div className="nav-title">More</div>
          <NavLink to="/playground" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Live playground
          </NavLink>
          <NavLink to="/changelog" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Changelog
          </NavLink>
        </div>
      </aside>
    </>
  );
}
