import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Search } from "./components/Search";
import { Sidebar } from "./components/Sidebar";
import { NPM, REPO, Topbar } from "./components/Topbar";
import { DocPage } from "./pages/DocPage";
import { Home } from "./pages/Home";
import { ChangelogPage, NotFound, PlaygroundPage } from "./pages/Misc";

/** Scroll to the #hash target, or to the top on a new page. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // wait a frame so the new page has rendered its headings
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const inDocs = pathname.startsWith("/docs");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ScrollManager />
      <Topbar onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} showMenu={inDocs} />
      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className={`shell ${inDocs ? "with-sidebar" : ""}`}>
        {inDocs && <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs/*" element={<DocPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          <footer className="site-footer">
            <span>MIT © Tigran Zakharyan</span>
            <span>
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
              </a>{" "}
              ·{" "}
              <a href={NPM} target="_blank" rel="noreferrer">
                npm
              </a>{" "}
              ·{" "}
              <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
                Issues
              </a>
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}
