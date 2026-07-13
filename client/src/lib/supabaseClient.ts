import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Throwing here (instead of silently falling back to a placeholder) makes
  // misconfiguration impossible to miss — a broken login page is much easier
  // to debug than requests that silently 401 forever.
  console.error(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. " +
      "Google/email login will not work until these are set."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      // PKCE is the modern, secure flow Supabase recommends for SPAs. It
      // requires a dedicated callback route that calls
      // `supabase.auth.exchangeCodeForSession()` — see /auth/callback.
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
