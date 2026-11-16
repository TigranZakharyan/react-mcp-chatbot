// A tiny in-browser "backend". It intercepts fetch("/api/...") so the demo runs
// anywhere – including static hosting – with no server. In a real app you would
// simply point `api.baseURL` at your actual backend and delete this file.

type Order = { id: string; customer: string; status: string; total: number };

const seed = (): Order[] => [
  { id: "1001", customer: "Ada Lovelace", status: "shipped", total: 129.9 },
  { id: "1002", customer: "Alan Turing", status: "processing", total: 54.0 },
  { id: "1003", customer: "Grace Hopper", status: "delivered", total: 310.25 },
  { id: "1004", customer: "Linus Torvalds", status: "processing", total: 89.5 },
  { id: "1005", customer: "Margaret Hamilton", status: "shipped", total: 212.0 },
];

let orders = seed();

const reply = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function handle(url: URL, method: string): Response {
  const path = url.pathname.replace(/^.*\/api/, "");
  if (path === "/reset" && method === "POST") {
    orders = seed();
    return reply(200, orders);
  }
  const m = path.match(/^\/orders(?:\/(\w+))?(\/cancel)?$/);
  if (!m) return reply(404, { error: "not found" });

  if (!m[1] && method === "GET") {
    const status = url.searchParams.get("status");
    return reply(200, status ? orders.filter((o) => o.status === status) : orders);
  }
  const order = orders.find((o) => o.id === m[1]);
  if (!order) return reply(404, { error: "order not found" });
  if (m[2] && method === "POST") {
    if (order.status === "delivered") return reply(409, { error: "already delivered" });
    order.status = "cancelled";
  }
  return reply(200, order);
}

export function installMockApi() {
  const real = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    // only our own /api – LLM provider calls pass straight through
    if (url.origin === window.location.origin && /\/api\//.test(url.pathname)) {
      await new Promise((r) => setTimeout(r, 120)); // feel like a network
      return handle(url, (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase());
    }
    return real(input, init);
  };
}
