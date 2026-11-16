import { defineConfig } from "tsup";

// Inline the icon so consumers' bundlers never need to resolve a separate asset.
const loader = { ".svg": "dataurl" } as const;

export default defineConfig([
  {
    entry: ["src/index.tsx"],
    format: ["esm"],
    dts: true,
    clean: true,
    loader,
    external: ["react", "react-dom"],
  },
  {
    entry: ["src/index.tsx"],
    format: ["cjs"],
    dts: true,
    loader,
    external: ["react", "react-dom"],
    // react-markdown / remark-gfm are ESM-only. require() of an ES module throws on
    // Node < 20.19 / 22.12, so the CJS build bundles them instead of requiring them.
    noExternal: [/^(react-markdown|remark-gfm|remark-.*|rehype-.*|mdast-.*|hast-.*|micromark.*|unified|unist-.*|vfile.*|bail|devlop|is-plain-obj|trough|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities.*|html-url-attributes|estree-util-.*|ccount|markdown-table|zwitch|longest-streak|trim-lines|stringify-entities|style-to-.*|inline-style-parser|ms)$/],
  },
]);
