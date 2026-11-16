# Documentation site

The website for `react-mcp-chatbot`: landing page, guides, API reference, examples, FAQ, a live playground and a changelog.
It is a React + Vite app and is **not** part of the published npm package.

```bash
cd docs
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into docs/dist
npm run preview    # serve the production build locally
```

## How it works

- **Content is Markdown.** Every file in `src/content/**/*.md` becomes a page automatically, with sidebar entry, table of contents, search, and previous/next links. No code changes needed.
- **The docs always use the package source** (`../src`), so they never drift from the code. The in-browser fake backend and fake "demo mode" model come from `../demo/src`.
- **The changelog page renders `../CHANGELOG.md`**, so you only maintain one file.

## Adding or editing a page

Create `src/content/<section>/<slug>.md`:

```md
---
title: My page
section: Guides          # Getting started | Guides | Examples | Reference | Help
order: 12                # position within the section
description: One sentence, shown in search.
---

# My page

Normal Markdown. Tables, code blocks (with syntax highlighting) and links work.
```

To add a new sidebar section, add its name to `SECTION_ORDER` in `src/lib/content.ts`.

### Callouts

Start a blockquote with one of these words in bold:

```md
> **Note** Something useful.
> **Tip** A shortcut.
> **Warning** Be careful.
> **Danger** Something can break.
> **New** Added in a recent version.
```

### Live demos inside a page

````md
```component:Customizer
```
````

Available components are registered in `src/live/registry.ts` (`Customizer`, `Playground`).

### Links

- Internal: `[Providers](/docs/guides/providers)` or with an anchor `[…](/docs/guides/providers#free-and-local-options)`. Anchors are the lowercase, hyphenated heading text.

## Deploying to Netlify

The repository root has a `netlify.toml` that does everything:

1. In Netlify choose **Add new site → Import an existing project** and pick the GitHub repo.
2. Leave the build settings as detected (they are read from `netlify.toml`): base `docs`, command `npm run build`, publish `dist`.
3. Deploy. Every push to `main` redeploys.

Deep links work because of the SPA redirect in `netlify.toml`. The live site is https://react-mcp-chatbot.netlify.app/ (also set as `homepage` in the root `package.json`).
