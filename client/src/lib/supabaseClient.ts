import { createClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(envUrl && envAnonKey);

if (!isSupabaseConfigured) {
  console.error("Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.");
}

// Fall back to a harmless placeholder so createClient never throws at module
// load time when Supabase env vars are missing (e.g. demo-login-only setups).
const supabaseUrl = envUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = envAnonKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
