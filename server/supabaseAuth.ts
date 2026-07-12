import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.warn("⚠️  SUPABASE_URL not set — Supabase auth is disabled.");
}

// Public JWKS endpoint — no API key needed
const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

const ISSUER = supabaseUrl ? `${supabaseUrl}/auth/v1` : null;

export interface AuthedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
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
