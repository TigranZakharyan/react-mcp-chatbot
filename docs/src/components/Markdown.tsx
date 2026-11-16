import { Children, Suspense, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { CodeBlock } from "./CodeBlock";
import { slugify } from "../lib/content";
import { liveComponents } from "../live/registry";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

const CALLOUTS: Record<string, { label: string; cls: string }> = {
  note: { label: "Note", cls: "note" },
  tip: { label: "Tip", cls: "tip" },
  warning: { label: "Warning", cls: "warning" },
  danger: { label: "Danger", cls: "danger" },
  new: { label: "New", cls: "new" },
};

function Heading({ level, children }: { level: 1 | 2 | 3 | 4; children?: ReactNode }) {
  const id = slugify(textOf(children));
  const Tag = `h${level}` as "h1";
  return (
    <Tag id={id}>
      {children}
      {level > 1 && (
        <a className="anchor" href={`#${id}`} aria-label="Link to this section">
          #
        </a>
      )}
    </Tag>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (p) => <Heading level={1}>{p.children}</Heading>,
        h2: (p) => <Heading level={2}>{p.children}</Heading>,
        h3: (p) => <Heading level={3}>{p.children}</Heading>,
        h4: (p) => <Heading level={4}>{p.children}</Heading>,

        a: ({ href = "", children }) => {
          if (href.startsWith("/")) return <Link to={href}>{children}</Link>;
          if (href.startsWith("#")) return <a href={href}>{children}</a>;
          return (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          );
        },

        // fenced code → highlighted block; ```component:Name → live widget
        pre: ({ children }) => {
          const child = Children.toArray(children)[0];
          if (isValidElement(child)) {
            const props = child.props as { className?: string; children?: ReactNode };
            const lang = /language-([\w:-]+)/.exec(props.className ?? "")?.[1] ?? "text";
            const code = textOf(props.children);
            if (lang.startsWith("component:")) {
              const Live = liveComponents[lang.slice("component:".length)];
              return Live ? (
                <Suspense fallback={<div className="live-loading">Loading live demo…</div>}>
                  <Live />
                </Suspense>
              ) : (
                <div className="callout danger">Unknown live component “{lang}”.</div>
              );
            }
            return <CodeBlock code={code} lang={lang} />;
          }
          return <pre>{children}</pre>;
        },
        code: ({ children }) => <code className="inline-code">{children}</code>,

        // > **Note** … → styled callout
        blockquote: ({ children }) => {
          const first = textOf(Children.toArray(children)[0]).trim().split(/[\s:.]/)[0].toLowerCase();
          const c = CALLOUTS[first];
          return <blockquote className={c ? `callout ${c.cls}` : ""}>{children}</blockquote>;
        },

        table: ({ children }) => (
          <div className="table-wrap">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
