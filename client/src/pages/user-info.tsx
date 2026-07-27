import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { startGuestSession } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { User as UserIcon } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.57-5.17 3.57-8.83Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.73-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"/>
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"/>
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"/>
    </svg>
  );
}

// Subtle floating dot canvas for white bg
function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let id: number;
    let W = (c.width = innerWidth), H = (c.height = innerHeight);
    const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    addEventListener("resize", resize);
    const dots = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 1,
      s: Math.random() * 0.18 + 0.03,
      o: Math.random() * 0.08 + 0.03,
      d: (Math.random() - 0.5) * 0.08,
    }));
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of dots) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${s.o})`; ctx.fill();
        s.y += s.s; s.x += s.d;
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
        if (s.x > W + 4) s.x = -4;
        if (s.x < -4) s.x = W + 4;
      }
      id = requestAnimationFrame(frame);
    };
    frame();
    return () => { removeEventListener("resize", resize); cancelAnimationFrame(id); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />;
}

export default function UserInfo() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Surface any OAuth error the App-level router caught and stashed
  useEffect(() => {
    const storedError = sessionStorage.getItem("fius_auth_error");
    if (storedError) {
      setError(
        storedError.includes("already been used")
          ? "That sign-in link was already used. Please click 'Continue with Google' again."
          : storedError
      );
      sessionStorage.removeItem("fius_auth_error");
    }
  }, []);

  // TEMPORARY: Guest mode for testing — bypasses real auth entirely.
  const handleGuestLogin = () => {
    startGuestSession();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    setLocation("/chat");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setInfo("");
    setIsLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (oauthError) {
      console.error("[google-login] signInWithOAuth failed:", oauthError);
      setError(oauthError.message || "Google sign-in failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#ffffff", overflowX: "clip" }}>
      <DotField />

      {/* subtle gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.015) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.018) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-pop-in">
          <button
            onClick={() => setLocation("/")}
            className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div
            className="rounded-3xl border p-8 sm:p-10 bg-white shadow-xl"
            style={{
              borderColor: "rgba(0,0,0,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <div className="flex flex-col items-center text-center mb-8">
              <Logo size="lg" className="text-zinc-900 mb-4" />
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-1.5 tracking-tight">Welcome to Fius</h1>
              <p className="text-zinc-500 text-sm">Sign in to chat with the future of AI.</p>
            </div>

            {info && (
              <div className="mb-4 text-sm text-center text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                {info}
              </div>
            )}
            {error && (
              <div className="mb-4 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 rounded-full font-semibold flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 bg-zinc-900 text-white hover:bg-zinc-800 border-0"
            >
              <GoogleIcon />
              {isLoading ? "Connecting…" : "Continue with Google"}
            </Button>

            {/* TEMPORARY — testing only */}
            <Button
              type="button"
              onClick={handleGuestLogin}
              variant="outline"
              className="w-full h-11 mt-3 rounded-full border-dashed text-zinc-400 hover:text-zinc-700 flex items-center justify-center gap-2 border-zinc-300"
              style={{ background: "rgba(0,0,0,0.02)" }}
              data-testid="button-guest-login"
            >
              <UserIcon className="w-4 h-4" />
              Continue as Guest (testing)
            </Button>

            <p className="text-center text-xs text-zinc-400 mt-6 leading-relaxed">
              By continuing you agree to our{" "}
              <button onClick={() => setLocation("/terms")} className="text-zinc-600 hover:text-zinc-900 underline">Terms</button>
              {" "}and{" "}
              <button onClick={() => setLocation("/privacy")} className="text-zinc-600 hover:text-zinc-900 underline">Privacy Policy</button>.
            </p>
          </div>

          <p className="text-center text-sm text-zinc-400 italic mt-8">Fly With Us!</p>
        </div>
      </div>
    </div>
  );
}
