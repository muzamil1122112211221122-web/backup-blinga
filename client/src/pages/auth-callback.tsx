import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";

// Dedicated landing spot for Supabase's OAuth (PKCE) redirect. Supabase
// (and Google, via Supabase) always sends the browser back here with a
// `?code=...` query param that must be exchanged for a real session before
// any authenticated request will work.
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const url = window.location.href;
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription =
          params.get("error_description") || hashParams.get("error_description");

        if (errorDescription) {
          setError(errorDescription);
          return;
        }

        const code = params.get("code");
        if (code) {
          // Guard against the code being exchanged twice for the same login
          // attempt — e.g. a page refresh, browser back/forward, or a
          // duplicate effect run replaying the same `?code=`. Supabase
          // rejects a reused code with "flow_state_already_used".
          const consumedKey = `fius_oauth_code_consumed:${code}`;
          if (sessionStorage.getItem(consumedKey)) {
            // Already handled in this browser — just move on, the session
            // (if it succeeded) is already in localStorage.
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              setLocation("/chat", { replace: true });
            } else {
              setLocation("/start", { replace: true });
            }
            return;
          }
          sessionStorage.setItem(consumedKey, "1");

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("[auth-callback] exchangeCodeForSession failed:", exchangeError);
            setError(exchangeError.message);
            return;
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/chat", { replace: true });
      } catch (err: any) {
        console.error("[auth-callback] unexpected error:", err);
        setError(err?.message || "Something went wrong while signing you in.");
      }
    })();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <img src="/fius-logo.png" alt="Fius" className="w-16 h-16 object-contain animate-pulse" />
        {error ? (
          <>
            <p className="text-red-400 max-w-sm">{error}</p>
            <button
              onClick={() => setLocation("/start", { replace: true })}
              className="text-white underline text-sm"
            >
              Back to login
            </button>
          </>
        ) : (
          <p className="text-white text-lg font-medium animate-pulse">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
