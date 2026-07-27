import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// ─── Eagerly loaded (needed immediately on first paint) ───────────────────────
import Landing from "@/pages/landing";

// ─── Lazily loaded (only downloaded when user actually navigates there) ───────
// This keeps the initial JS bundle tiny so the landing page paints instantly.
const Chat         = lazy(() => import("@/pages/chat"));
const UserInfo     = lazy(() => import("@/pages/user-info"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const Privacy      = lazy(() => import("@/pages/privacy"));
const Terms        = lazy(() => import("@/pages/terms"));
const NotFound     = lazy(() => import("@/pages/not-found"));

// ─── Minimal full-screen placeholder shown only while a lazy chunk downloads ─
function PageShell() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <img
          src="/fius-logo.png"
          alt="Fius"
          className="w-16 h-16 object-contain animate-pulse"
          // image is already preloaded in index.html so this is instant
        />
        <p className="text-white text-xl font-bold tracking-widest animate-pulse">FIUS</p>
      </div>
    </div>
  );
}

function Router() {
  const [location, navigate] = useLocation();
  const [sessionReady, setSessionReady] = useState(false);

  // ── Catch Supabase OAuth errors sent back to the site root ────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get("error_description") || params.get("error");
    if (errorDescription && location !== "/start") {
      const message = decodeURIComponent(errorDescription.replace(/\+/g, " "));
      sessionStorage.setItem("fius_auth_error", message);
      navigate("/start", { replace: true });
    }
  }, [location, navigate]);

  // ── Restore Supabase session (runs in background — does NOT block render) ──
  useEffect(() => {
    supabase.auth.getSession().then(() => setSessionReady(true));
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Auth query — only fires once session is restored ──────────────────────
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: sessionReady,
  });

  // ── Background redirect once auth resolves (no blocking spinner) ──────────
  const redirected = useRef(false);
  useEffect(() => {
    if (isLoading || !sessionReady || redirected.current) return;
    redirected.current = true;
    if (user && (location === "/" || location === "/start")) {
      navigate("/chat", { replace: true });
    }
    if (!user && location === "/chat") {
      navigate("/start", { replace: true });
    }
  }, [user, isLoading, sessionReady, location, navigate]);

  // ─── Routes ───────────────────────────────────────────────────────────────
  // Landing page renders IMMEDIATELY — no wait for auth.
  // All other pages are lazy-loaded inside a Suspense boundary.
  return (
    <Suspense fallback={<PageShell />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/chat" component={Chat} />
        <Route path="/start" component={UserInfo} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fius-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
