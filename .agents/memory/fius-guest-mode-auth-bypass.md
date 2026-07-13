---
name: Guest-mode auth bypass pattern
description: How a temporary, testing-only "guest login" was added to an app using Supabase JWT auth, without touching the Supabase project config.
---

The app's real auth (`requireAuth` in server/supabaseAuth.ts) verifies a Supabase-issued JWT against
Supabase's JWKS endpoint — there's no server-side session store, and enabling Supabase anonymous
sign-in would require dashboard access we don't have. For a temporary "Continue as Guest" testing
option, the simplest self-contained approach was a custom `X-Guest-Id` header: the client generates
and stores a random id (`guest-<random>`) in localStorage once, and every `apiRequest`/`authFetch`/
`getQueryFn` call attaches it as a header when there's no real Supabase session. `requireAuth`
checks for this header first and, if present in the expected format, creates/reuses a lightweight
guest user profile and skips JWT verification entirely for that request — bypassing Supabase, not
extending it.

**Why:** this keeps the bypass fully isolated to one header check + one client helper, so it's a small,
obviously-removable block on both sides (marked "TEMPORARY" in both files) rather than something
entangled with the real auth flow or requiring Supabase project changes.

**How to apply:** if asked to remove guest mode later, delete the `tryGuestAuth` block in
server/supabaseAuth.ts, the guest helpers in client/src/lib/queryClient.ts, and the guest button in
user-info.tsx (plus the `endGuestSession()` calls on logout).
