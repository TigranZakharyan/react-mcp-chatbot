# Demo

A tiny Vite app that uses the package source directly, with a fake orders API built into the dev server.

```bash
cd demo
npm install
npm run dev
```

Pick a provider, paste your API key, and ask about orders. The key is only kept in memory.
This folder is not published to npm (the package's `files` field only ships `dist/`).
