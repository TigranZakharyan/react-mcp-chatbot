import type {
  ApiConfig,
  ApiEndpoint,
  ApiParameter,
  HttpMethod,
  MCPTool,
  MCPToolParameter,
  ToolSpec,
} from "./types";

export type RuntimeTool = MCPTool & { method?: HttpMethod };

export function toToolSpec(tool: MCPTool): ToolSpec {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const [key, p] of Object.entries(tool.parameters ?? {})) {
    const prop: Record<string, unknown> = { type: p.type };
    if (p.description) prop.description = p.description;
    if (p.enum) prop.enum = p.enum;
    if (p.type === "array") prop.items = p.items ?? {};
    if (p.type === "object" && p.properties) prop.properties = p.properties;
    properties[key] = prop;
    if (!p.optional) required.push(key);
  }

  return {
    name: tool.name,
    description: tool.description,
    parameters: { type: "object", properties, required },
  };
}

/** Light validation + coercion of model-produced arguments. Returns an error string or the cleaned args. */
export function prepareArgs(
  tool: MCPTool,
  raw: Record<string, any>
): { args: Record<string, any> } | { error: string } {
  const args: Record<string, any> = { ...raw };
  const params = tool.parameters ?? {};

  for (const [key, p] of Object.entries(params)) {
    let v = args[key];
    if (v === undefined || v === null || v === "") {
      if (!p.optional) return { error: `Missing required argument "${key}".` };
      delete args[key];
      continue;
    }
    if ((p.type === "number" || p.type === "integer") && typeof v === "string") {
      const n = Number(v);
      if (Number.isNaN(n)) return { error: `Argument "${key}" must be a number.` };
      v = n;
    }
    if (p.type === "boolean" && typeof v === "string") v = v === "true";
    if ((p.type === "object" || p.type === "array") && typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        return { error: `Argument "${key}" must be valid JSON.` };
      }
    }
    args[key] = v;
  }
  return { args };
}

// ─────────────────────────────────────────────
// Declarative API → tools
// ─────────────────────────────────────────────

function defaultLocation(method: HttpMethod, path: string, name: string): NonNullable<ApiParameter["in"]> {
  if (path.includes(`{${name}}`)) return "path";
  return method === "GET" || method === "DELETE" ? "query" : "body";
}

async function resolveHeaders(h: ApiConfig["headers"]): Promise<Record<string, string>> {
  if (!h) return {};
  return typeof h === "function" ? await h() : h;
}

function appendQuery(search: URLSearchParams, key: string, v: unknown) {
  if (Array.isArray(v)) v.forEach((i) => appendQuery(search, key, i));
  else if (v !== null && typeof v === "object") search.append(key, JSON.stringify(v));
  else search.append(key, String(v));
}

/** `getApi` is read at call time so fresh headers/baseURL from re-renders are always used. */
export function endpointToTool(getApi: () => ApiConfig, ep: ApiEndpoint): RuntimeTool {
  const method = ep.method ?? "GET";

  const parameters: Record<string, MCPToolParameter> = {};
  for (const [k, p] of Object.entries(ep.parameters ?? {})) {
    const { in: _in, ...rest } = p;
    parameters[k] = rest;
  }

  return {
    name: ep.name,
    description: `${ep.description}${ep.description.endsWith(".") ? "" : "."} (${method} ${ep.path})`,
    parameters,
    method,
    async call(args: Record<string, any>) {
      const api = getApi();
      const maxChars = api.maxResponseChars ?? 8000;
      let path = ep.path;
      const search = new URLSearchParams();
      const body: Record<string, any> = {};
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(await resolveHeaders(api.headers)),
        ...ep.headers,
      };

      for (const [k, v] of Object.entries(args)) {
        const where = ep.parameters?.[k]?.in ?? defaultLocation(method, ep.path, k);
        if (where === "path") path = path.replace(`{${k}}`, encodeURIComponent(String(v)));
        else if (where === "query") appendQuery(search, k, v);
        else if (where === "header") headers[k] = String(v);
        else body[k] = v;
      }

      const base = api.baseURL.replace(/\/+$/, "");
      const qs = search.toString();
      const url = `${base}${path.startsWith("/") ? "" : "/"}${path}${qs ? (path.includes("?") ? "&" : "?") + qs : ""}`;

      const hasBody = Object.keys(body).length > 0 && method !== "GET";
      if (hasBody) headers["Content-Type"] ??= "application/json";

      const res = await fetch(url, {
        method,
        headers,
        credentials: api.credentials,
        body: hasBody ? JSON.stringify(body) : undefined,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
      }
      if (!text) return { status: res.status, ok: true };
      try {
        return JSON.parse(text);
      } catch {
        return text.length > maxChars ? text.slice(0, maxChars) : text;
      }
    },
  };
}

// ─────────────────────────────────────────────
// OpenAPI → endpoints
// ─────────────────────────────────────────────

const METHODS = ["get", "post", "put", "patch", "delete"] as const;

function deref(doc: any, node: any, seen = new Set<string>()): any {
  if (!node || typeof node !== "object") return node;
  if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
    if (seen.has(node.$ref)) return {}; // break cycles
    const next = new Set(seen).add(node.$ref);
    const target = node.$ref
      .slice(2)
      .split("/")
      .reduce((acc: any, part: string) => acc?.[part.replace(/~1/g, "/").replace(/~0/g, "~")], doc);
    return deref(doc, target, next);
  }
  if (Array.isArray(node)) return node.map((n) => deref(doc, n, seen));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(node)) out[k] = deref(doc, v, seen);
  return out;
}

function toParam(schema: any, description?: string, optional = false): ApiParameter {
  const t = schema?.type;
  const type: ApiParameter["type"] = ["string", "number", "integer", "boolean", "object", "array"].includes(t)
    ? t
    : "string";
  const p: ApiParameter = { type, optional };
  const d = [description, schema?.description].filter(Boolean).join(" – ");
  if (d) p.description = d;
  if (Array.isArray(schema?.enum)) p.enum = schema.enum;
  if (type === "array") p.items = schema?.items ?? {};
  if (type === "object" && schema?.properties) p.properties = schema.properties;
  return p;
}

export function endpointsFromOpenAPI(rawDoc: any): ApiEndpoint[] {
  const doc = rawDoc;
  const endpoints: ApiEndpoint[] = [];
  const used = new Set<string>();

  for (const [path, item] of Object.entries<any>(doc.paths ?? {})) {
    for (const m of METHODS) {
      const op = item?.[m];
      if (!op) continue;

      const method = m.toUpperCase() as HttpMethod;
      let name = String(op.operationId ?? `${m}_${path}`)
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 64);
      for (let i = 2; used.has(name); i++) name = `${name.slice(0, 60)}_${i}`;
      used.add(name);

      const parameters: Record<string, ApiParameter> = {};
      const all = [...(item.parameters ?? []), ...(op.parameters ?? [])].map((p) => deref(doc, p));
      for (const p of all) {
        if (!["path", "query", "header"].includes(p.in)) continue;
        const schema = p.schema ?? p; // Swagger 2 keeps type inline
        parameters[p.name] = {
          ...toParam(schema, p.description, !p.required && p.in !== "path"),
          in: p.in,
        };
      }

      // OpenAPI 3 body
      const bodySchema = deref(doc, op.requestBody?.content?.["application/json"]?.schema);
      if (bodySchema?.type === "object" && bodySchema.properties) {
        const req: string[] = bodySchema.required ?? [];
        for (const [k, s] of Object.entries<any>(bodySchema.properties)) {
          parameters[k] ??= { ...toParam(s, undefined, !req.includes(k)), in: "body" };
        }
      } else if (bodySchema) {
        parameters.body = { ...toParam(bodySchema, "Request body", !op.requestBody?.required), in: "body" };
      }
      // Swagger 2 body
      const s2 = all.find((p) => p.in === "body");
      if (s2?.schema?.properties) {
        const req: string[] = s2.schema.required ?? [];
        for (const [k, s] of Object.entries<any>(s2.schema.properties)) {
          parameters[k] ??= { ...toParam(s, undefined, !req.includes(k)), in: "body" };
        }
      }

      endpoints.push({
        name,
        description: [op.summary, op.description].filter(Boolean).join(". ") || `${method} ${path}`,
        method,
        path,
        parameters,
      });
    }
  }
  return endpoints;
}

/** Resolve an `ApiConfig` (hand-written endpoints + optional OpenAPI) to tools. */
export async function buildApiTools(
  api: ApiConfig,
  getApi: () => ApiConfig = () => api
): Promise<RuntimeTool[]> {
  let endpoints = [...(api.endpoints ?? [])];

  if (api.openapi) {
    let doc: any = api.openapi;
    if (typeof doc === "string") {
      const res = await fetch(doc, { credentials: api.credentials });
      if (!res.ok) throw new Error(`Could not load OpenAPI document (${res.status}).`);
      doc = await res.json();
    }
    doc = deref(doc, doc);
    let generated = endpointsFromOpenAPI(doc);
    if (api.include) generated = generated.filter((e) => api.include!.includes(e.name));
    if (api.exclude) generated = generated.filter((e) => !api.exclude!.includes(e.name));
    // hand-written endpoints win on name clash
    const names = new Set(endpoints.map((e) => e.name));
    endpoints = [...endpoints, ...generated.filter((e) => !names.has(e.name))];
  }

  return endpoints.map((ep) => endpointToTool(getApi, ep));
}
