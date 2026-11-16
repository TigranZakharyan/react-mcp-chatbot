import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const nm = (p: string) => path.resolve(__dirname, "node_modules", p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The docs always run against the package source, so they never drift from the code.
      "react-mcp-chatbot": path.resolve(__dirname, "../src/index.tsx"),
      // The in-browser fake backend + fake model are shared with the demo site.
      "@demo": path.resolve(__dirname, "../demo/src"),
      // One copy of each dependency, even though ../src and ../demo sit outside this folder.
      react: nm("react"),
      "react-dom": nm("react-dom"),
      "react-markdown": nm("react-markdown"),
      "remark-gfm": nm("remark-gfm"),
    },
  },
  server: { fs: { allow: [".."] } },
  build: { chunkSizeWarningLimit: 900 },
});
