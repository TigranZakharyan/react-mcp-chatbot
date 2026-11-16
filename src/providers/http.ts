export async function postJSON(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal?: AbortSignal
): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.error?.message ?? data?.error ?? data?.message ?? data?.raw ?? res.statusText;
    throw new Error(`${res.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return data;
}

export function parseArgs(raw: unknown): Record<string, any> {
  if (raw && typeof raw === "object") return raw as Record<string, any>;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
