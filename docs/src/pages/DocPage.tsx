import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Markdown } from "../components/Markdown";
import { Toc } from "../components/Toc";
import { flat, pageByPath } from "../lib/content";
import { REPO } from "../components/Topbar";
import { NotFound } from "./Misc";

export function DocPage() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const page = pageByPath.get(path);

  useEffect(() => {
    document.title = page ? `${page.title} – react-mcp-chatbot` : "Not found – react-mcp-chatbot";
  }, [page]);

  if (path === "/docs") return <Navigate to={flat[0].path} replace />;
  if (!page) return <NotFound />;

  const i = flat.findIndex((p) => p.path === page.path);
  const prev = flat[i - 1];
  const next = flat[i + 1];

  return (
    <div className={`doc-layout ${page.body.includes("```component:") ? "has-live" : ""}`}>
      <article className="doc">
        <div className="eyebrow">{page.section}</div>
        <Markdown>{page.body}</Markdown>

        <div className="doc-foot">
          <a href={`${REPO}/edit/main/${page.file}`} target="_blank" rel="noreferrer">
            ✎ Edit this page on GitHub
          </a>
        </div>
        <div className="pager">
          {prev ? (
            <Link to={prev.path} className="pager-link prev">
              <small>← Previous</small>
              <span>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={next.path} className="pager-link next">
              <small>Next →</small>
              <span>{next.title}</span>
            </Link>
          )}
        </div>
      </article>
      <Toc key={page.path} headings={page.headings} />
    </div>
  );
}
