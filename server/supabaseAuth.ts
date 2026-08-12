import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Accept either the plain server-side name or the VITE_-prefixed one, since
// this project currently only defines the VITE_-prefixed vars. Keeping both
// here avoids the client and server silently pointing at different values.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.warn("⚠️  SUPABASE_URL / VITE_SUPABASE_URL not set — Supabase auth is disabled.");
}

// Public JWKS endpoint — no API key needed
const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

const ISSUER = supabaseUrl ? `${supabaseUrl}/auth/v1` : null;

export interface AuthedRequest extends Request {
  user?: any;
}

// ─── TEMPORARY: Guest mode for testing ─────────────────────────────────────
// Lets a visitor use the app without a real Supabase account. The client
// sends an `X-Guest-Id` header (a random id it generates once and stores in
// localStorage) instead of a Supabase bearer token. We create/reuse a local
// guest profile for that id and skip JWT verification entirely for it.
// Remove this block (and the client-side guest button/header) once real
// testing is done.
async function tryGuestAuth(req: AuthedRequest): Promise<boolean> {
  const guestId = req.headers["x-guest-id"];
  if (typeof guestId !== "string" || !/^guest-[a-zA-Z0-9]{6,40}$/.test(guestId)) return false;

  let profile = await storage.getUser(guestId);
  if (!profile) {
    profile = await storage.upsertUser({
      id: guestId,
      username: "Guest",
      email: `${guestId}@guest.fius.local`,
      displayName: "Guest",
      avatarUrl: null,
    });
  }
  req.user = profile;
  return true;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (await tryGuestAuth(req)) return next();

    if (!JWKS || !ISSUER) {
      return res.status(500).json({ message: "Supabase auth is not configured on the server." });
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    let payload: any;
    try {
      const result = await jwtVerify(token, JWKS, {
        issuer: ISSUER,
        audience: "authenticated",
      });
      payload = result.payload;
    } catch (jwtErr: any) {
      console.log("[requireAuth] JWT verify failed:", jwtErr?.message);
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = payload.sub as string;
    const email = payload.email as string | undefined;
    const meta = (payload.user_metadata as any) || {};

    let profile = await storage.getUser(userId);
    if (!profile) {
      profile = await storage.upsertUser({
        id: userId,
        username: meta.full_name || meta.name || email?.split("@")[0] || "user",
        email: email || "",
        displayName: meta.full_name || meta.name || null,
        avatarUrl: meta.avatar_url || meta.picture || null,
      });
    }

    req.user = profile;
    next();
  } catch (err) {
    console.error("Auth verification error:", err);
    res.status(401).json({ message: "Authentication required" });
  }
}
