// Loads every Markdown file in ../content, parses its front-matter, and derives
// navigation, table of contents and a search index. Add a .md file => it appears in the site.

const files = import.meta.glob("../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type Heading = { level: 2 | 3; text: string; id: string };

export type DocPage = {
  /** URL path, e.g. /docs/guides/providers */
  path: string;
  title: string;
  description: string;
  section: string;
  order: number;
  body: string;
  headings: Heading[];
  /** Repo-relative source file, for "Edit this page". */
  file: string;
};

/** Order in which sections appear in the sidebar. */
export const SECTION_ORDER = ["Getting started", "Guides", "Examples", "Reference", "Help"];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2] };
}

/** h2/h3 headings, ignoring anything inside fenced code blocks. */
export function extractHeadings(body: string): Heading[] {
  const out: Heading[] = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (fence) continue;
    const m = line.match(/^(##|###)\s+(.+?)\s*$/);
    if (m) {
      const text = m[2].replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/[*_`]/g, "");
      out.push({ level: m[1].length as 2 | 3, text, id: slugify(text) });
    }
  }
  return out;
}

export const pages: DocPage[] = Object.entries(files)
  .map(([file, raw]) => {
    const { meta, body } = parseFrontMatter(raw);
    const path = "/docs/" + file.replace("../content/", "").replace(/\.md$/, "");
    return {
      path,
      title: meta.title ?? path.split("/").pop()!,
      description: meta.description ?? "",
      section: meta.section ?? "Guides",
      order: Number(meta.order ?? 99),
      body,
      headings: extractHeadings(body),
      file: "docs/src/" + file.replace("../", ""),
    } satisfies DocPage;
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export const pageByPath = new Map(pages.map((p) => [p.path, p]));

export type NavGroup = { section: string; pages: DocPage[] };

export const nav: NavGroup[] = SECTION_ORDER.map((section) => ({
  section,
  pages: pages.filter((p) => p.section === section),
})).filter((g) => g.pages.length > 0);

/** Flat reading order, used for "previous / next" links. */
export const flat: DocPage[] = nav.flatMap((g) => g.pages);

// ── search ─────────────────────────────────────────────

export type SearchEntry = {
  path: string;
  anchor?: string;
  page: string;
  heading: string;
  text: string;
};

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const p of pages) {
    entries.push({ path: p.path, page: p.title, heading: p.title, text: p.description });
    let current: { heading: string; anchor: string; lines: string[] } | null = null;
    let fence = false;
    const flush = () => {
      if (current)
        entries.push({
          path: p.path,
          anchor: current.anchor,
          page: p.title,
          heading: current.heading,
          text: current.lines.join(" ").replace(/\s+/g, " ").slice(0, 1200),
        });
    };
    for (const line of p.body.split("\n")) {
      if (/^\s*```/.test(line)) fence = !fence;
      const h = !fence && line.match(/^(##|###)\s+(.+?)\s*$/);
      if (h) {
        flush();
        const text = h[2].replace(/[*_`]/g, "");
        current = { heading: text, anchor: slugify(text), lines: [] };
      } else current?.lines.push(line.replace(/[#*_`|>-]/g, " "));
    }
    flush();
  }
  return entries;
}

const index = buildIndex();

export function search(query: string, limit = 8): SearchEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return index
    .map((e) => {
      const h = e.heading.toLowerCase();
      const pg = e.page.toLowerCase();
      const t = e.text.toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        if (h.includes(tok)) score += h === tok ? 12 : 8;
        else if (pg.includes(tok)) score += 4;
        else if (t.includes(tok)) score += 1;
        else return { e, score: 0 }; // every word must match somewhere
      }
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
