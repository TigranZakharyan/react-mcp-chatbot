---
title: Authentication
section: Guides
order: 6
description: Call your own API as the signed-in user: bearer tokens, cookies, refresh, per-endpoint headers.
---

# Authentication

Tool calls are ordinary `fetch` requests made by the user&rsquo;s browser, so they can use **the same authentication as the rest of your frontend**. The assistant can never do more than the signed-in user could do by hand.

## Bearer tokens

```tsx
api={{
  baseURL: "https://api.acme.com",
  headers: () => ({ Authorization: `Bearer ${auth.getToken()}` }),
}}
```

`headers` is evaluated **per request**, so a refreshed token is picked up automatically. It can also be `async`:

```tsx
headers: async () => ({ Authorization: `Bearer ${await auth.getAccessTokenSilently()}` }),
```

## Cookies and sessions

For cookie-based sessions, tell `fetch` to send cookies:

```tsx
api={{ baseURL: "https://api.acme.com", credentials: "include" }}
```

Your backend must then allow credentialed CORS: `Access-Control-Allow-Credentials: true` and a specific (not `*`) `Access-Control-Allow-Origin`. If the API is on the same origin as your app (for example `/api`), plain cookies work with no CORS setup.

## API keys and custom headers

```tsx
api={{
  baseURL: "https://api.acme.com",
  headers: { "X-API-Key": publicReadOnlyKey },
}}
```

Only put keys here that are safe to expose to the user. Anything in the browser is visible to them.

## Different auth for one endpoint

Endpoint-level `headers` are merged on top of the global ones:

```tsx
{
  name: "get_report",
  description: "Download the monthly report",
  path: "/reports/{month}",
  parameters: { month: { type: "string" } },
  headers: { Accept: "application/json", "X-Report-Scope": "readonly" },
}
```

## Handling expired sessions

When an API call returns 401 or 403, the status text and body are returned to the model, which will usually tell the user it could not access something. To react in your app (for example, redirect to login), observe tool results:

```tsx
<MCPAgent
  /* … */
  onToolCall={({ name, error }) => {
    if (error?.startsWith("HTTP 401")) auth.signOut();
  }}
/>
```

## Authorization is your backend&rsquo;s job

The model decides *which* endpoint to call, but **your backend must enforce who may call it**. Never rely on the prompt (“don&rsquo;t cancel other people&rsquo;s orders”) as access control. See [Security](/docs/guides/security).
