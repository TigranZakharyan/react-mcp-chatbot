import { Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { Markdown } from "../components/Markdown";
import { Playground } from "../live/registry";
import changelog from "../../../CHANGELOG.md?raw";

export function PlaygroundPage() {
  useEffect(() => {
    document.title = "Playground – react-mcp-chatbot";
  }, []);
  return (
    <div className="page-narrow has-live">
      <div className="eyebrow">Live</div>
      <h1>Playground</h1>
      <p className="lead">
        A real <code className="inline-code">&lt;MCPAgent /&gt;</code> talking to a fake orders API that runs in your browser. Start in{" "}
        <strong>Demo mode</strong> (a simulated rule-based model: no key, no cost, no AI), or connect a real provider and ask
        anything. Cancelling an order asks for your confirmation first.
      </p>
      <Suspense fallback={<div className="live-loading">Loading playground…</div>}>
        <Playground />
      </Suspense>
    </div>
  );
}

export function ChangelogPage() {
  useEffect(() => {
    document.title = "Changelog – react-mcp-chatbot";
  }, []);
  // CHANGELOG.md is the single source of truth: this page renders the repo file.
  const body = changelog.replace(/^# Changelog\s*/, "");
  return (
    <div className="page-narrow doc">
      <div className="eyebrow">Releases</div>
      <h1>Changelog</h1>
      <Markdown>{body}</Markdown>
    </div>
  );
}

export function NotFound() {
  useEffect(() => {
    document.title = "Not found – react-mcp-chatbot";
  }, []);
  return (
    <div className="page-narrow center-text">
      <div className="eyebrow">404</div>
      <h1>Page not found</h1>
      <p className="lead">That page doesn&rsquo;t exist (or moved).</p>
      <Link className="btn primary" to="/docs/getting-started/installation">
        Go to the docs
      </Link>
    </div>
  );
}
