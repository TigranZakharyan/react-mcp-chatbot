import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // relative base so the build works on GitHub Pages sub-paths
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // use the package source directly, so edits show up instantly
      "react-mcp-chatbot": path.resolve(__dirname, "../src/index.tsx"),
      // one copy of React, even though ../src sits outside this folder
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-markdown": path.resolve(__dirname, "node_modules/react-markdown"),
      "remark-gfm": path.resolve(__dirname, "node_modules/remark-gfm"),
    },
  },
  server: { fs: { allow: [".."] } },
});
