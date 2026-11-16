import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // Inline the icon so consumers' bundlers never need to resolve a separate asset.
  loader: { ".svg": "dataurl" },
  external: ["react", "react-dom"],
});
