---
name: Session cookie fix for Replit
description: Express-session cookie SameSite setting that works in Replit's cross-origin iframe environment
---

**Rule:** When running on Replit, session cookies must use `sameSite: "none"` and `secure: true`. The default `sameSite: "lax"` blocks cookies in Replit's workspace preview, which loads the app inside a cross-origin iframe.

**Why:** Replit's workspace (replit.com) loads the dev preview at a different subdomain (xxx.pike.replit.dev) in an iframe. With `SameSite=Lax`, cookies are blocked for cross-site embedded contexts. With `SameSite=None; Secure`, cookies work in cross-site iframes but require HTTPS (which Replit always uses).

**How to apply:** Detect Replit via `process.env.REPL_ID` or `process.env.REPLIT_DOMAINS`. Set `secure: true` and `sameSite: "none"` when either is set. Also set `app.set("trust proxy", 1)` and `proxy: true` on the session options so Express trusts Replit's HTTPS proxy headers.
