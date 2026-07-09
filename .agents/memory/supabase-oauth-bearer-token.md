---
name: Supabase OAuth bearer token wiring
description: Why Google/OAuth logins via Supabase succeed client-side but the backend keeps returning 401
---

**Rule:** When using Supabase Auth (especially OAuth providers like Google), the session token is NOT a cookie — it lives in the Supabase client's localStorage (and briefly in the URL hash right after the OAuth redirect). Every backend fetch must explicitly read `supabase.auth.getSession()` and attach `Authorization: Bearer <access_token>`, and the auth-check query must not run until the client has had a chance to parse that hash into a session.

**Why:** A generic `fetch(..., { credentials: "include" })` only sends cookies. With Supabase OAuth there is no cookie, so the backend's `requireAuth` middleware (which expects a Bearer header) always sees no token and returns 401 — even though the login itself succeeded and the browser briefly showed the token in the URL. The app's own auth-gated router then bounces the user back to the login page, making it look like OAuth "doesn't work" when actually the session was established fine.

**How to apply:** Centralize an `getAuthHeaders()` helper in the shared query client that calls `supabase.auth.getSession()` and merges the Authorization header into both `apiRequest` and the default query function. In the top-level router, delay the `/api/auth/user` query (`enabled: false` until ready) until `supabase.auth.getSession()` resolves once on mount, and subscribe to `supabase.auth.onAuthStateChange` to invalidate that query when the session changes (e.g. right after OAuth redirect parses the hash).
