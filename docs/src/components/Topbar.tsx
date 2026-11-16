import { Link, NavLink } from "react-router-dom";
import { setTheme, useTheme } from "../lib/theme";
import pkg from "../../../package.json";

export const REPO = "https://github.com/TigranZakharyan/react-mcp-chatbot";
export const NPM = "https://www.npmjs.com/package/react-mcp-chatbot";

export function Topbar({ onSearch, onMenu, showMenu }: { onSearch: () => void; onMenu: () => void; showMenu: boolean }) {
  const theme = useTheme();
  return (
    <header className="topbar">
      {showMenu && (
        <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation">
          ☰
        </button>
      )}
      <Link to="/" className="brand">
        <img src="/favicon.svg" alt="" width={26} height={26} />
        <span>react-mcp-chatbot</span>
        <span className="ver">v{pkg.version}</span>
      </Link>

      <nav className="top-links">
        <NavLink to="/docs/getting-started/installation" className={({ isActive }) => (isActive ? "active" : "")}>
          Docs
        </NavLink>
        <NavLink to="/docs/reference/mcpagent-props" className={({ isActive }) => (isActive ? "active" : "")}>
          API
        </NavLink>
        <NavLink to="/docs/examples/ecommerce-orders" className={({ isActive }) => (isActive ? "active" : "")}>
          Examples
        </NavLink>
        <NavLink to="/playground" className={({ isActive }) => (isActive ? "active" : "")}>
          Playground
        </NavLink>
        <NavLink to="/changelog" className={({ isActive }) => (isActive ? "active" : "")}>
          Changelog
        </NavLink>
      </nav>

      <div className="top-actions">
        <button className="search-btn" onClick={onSearch}>
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <a className="icon-btn" href={REPO} target="_blank" rel="noreferrer" aria-label="GitHub repository" title="GitHub">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle light / dark theme" title="Toggle theme">
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}
