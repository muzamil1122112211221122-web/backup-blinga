---
name: Supabase Google OAuth env var mismatch
description: Why Google login via Supabase silently fails even with correct credentials — a vite define block overwriting the real client env vars.
---

If a project has both `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` set directly as env vars AND a `vite.config.ts` `define` block that maps a *different* name (e.g. plain `SUPABASE_URL`/`SUPABASE_ANON_KEY`) into those same `import.meta.env.VITE_*` keys, the `define` block wins and silently blanks the client config to `""` whenever the plain-named var isn't set. Symptom: "Supabase is not configured" in the browser console and Google/email login failing no matter how many times credentials are re-entered — because the credentials never reached the client at all.

**Why:** Vite's `define` performs a literal text substitution at build time and takes priority over `import.meta.env` values Vite would otherwise auto-expose from any `VITE_`-prefixed env var. Two naming conventions for the same value is the trap.

**How to apply:** Prefer Vite's built-in behavior — just set `VITE_`-prefixed env vars directly, no custom `define` needed for client env passthrough. If the server also needs the same value under a non-`VITE_` name, read `process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL` server-side rather than re-deriving/overwriting the client var. Also remember: Google Cloud's "Authorized redirect URI" for a Supabase-brokered OAuth flow must point at Supabase's own callback (`https://<project-ref>.supabase.co/auth/v1/callback`), never at the app's own callback route — the app's callback is only used as a Supabase "Redirect URL" allow-list entry and in `redirectTo`.
