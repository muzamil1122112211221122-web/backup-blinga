import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        // Node 20 lacks a native WebSocket global; supabase-js's realtime
        // client needs one injected even though we never use realtime here.
        realtime: { transport: WebSocket as any },
      })
    : null;

if (!supabaseAdmin) {
  console.warn("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — Supabase auth is disabled.");
}

export interface AuthedRequest extends Request {
  user?: any;
}

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <token>`,
 * then loads (auto-provisioning on first sight) the matching app-side profile
 * row keyed by the Supabase auth user's UUID.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: "Supabase auth is not configured on the server." });
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const authUser = data.user;
    let profile = await storage.getUser(authUser.id);
    if (!profile) {
      profile = await storage.upsertUser({
        id: authUser.id,
        username:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "user",
        email: authUser.email || "",
        displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      });
    }

    req.user = profile;
    next();
  } catch (err) {
    console.error("Auth verification error:", err);
    res.status(401).json({ message: "Authentication required" });
  }
}
