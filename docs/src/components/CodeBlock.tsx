import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "../lib/theme";

const LANG_ALIAS: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  html: "markup",
  text: "plain",
  txt: "plain",
};

export function CodeBlock({ code, lang = "tsx", inline = false }: { code: string; lang?: string; inline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const language = LANG_ALIAS[lang] ?? lang;
  const dark = useTheme() === "dark";

  if (inline) return <code className="inline-code">{code}</code>;

  return (
    <div className="codeblock">
      <div className="codeblock-bar">
        <span>{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <Highlight code={code.replace(/\n$/, "")} language={language} theme={dark ? themes.vsDark : themes.vsLight}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
