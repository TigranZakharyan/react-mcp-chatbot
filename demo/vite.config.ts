import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// A tiny fake "backend" so the demo works with no server of its own.
const orders = [
  { id: "1001", customer: "Ada Lovelace", status: "shipped", total: 129.9 },
  { id: "1002", customer: "Alan Turing", status: "processing", total: 54.0 },
  { id: "1003", customer: "Grace Hopper", status: "delivered", total: 310.25 },
];

function mockBackend(): Plugin {
  return {
    name: "mock-backend",
    configureServer(server) {
      server.middlewares.use("/api", (req, res) => {
        const url = new URL(req.url ?? "/", "http://x");
        const send = (code: number, data: unknown) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };
        const m = url.pathname.match(/^\/orders(?:\/(\w+))?(\/cancel)?$/);
        if (!m) return send(404, { error: "not found" });

        if (!m[1] && req.method === "GET") {
          const status = url.searchParams.get("status");
          return send(200, status ? orders.filter((o) => o.status === status) : orders);
        }
        const order = orders.find((o) => o.id === m[1]);
        if (!order) return send(404, { error: "order not found" });
        if (m[2] && req.method === "POST") {
          if (order.status === "delivered") return send(409, { error: "already delivered" });
          order.status = "cancelled";
        }
        send(200, order);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockBackend()],
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
