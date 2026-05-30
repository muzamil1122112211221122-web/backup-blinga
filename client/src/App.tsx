import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Landing from "@/pages/landing";
import Chat from "@/pages/chat";
import UserInfo from "@/pages/user-info";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

function Router() {
  const [location, navigate] = useLocation();
  
  // Check authentication status
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      // If user is authenticated and on landing page, redirect to chat
      if (user && location === "/") {
        navigate("/chat", { replace: true });
        return;
      }
      // If user is authenticated and on start page, redirect to chat
      if (user && location === "/start") {
        navigate("/chat", { replace: true });
        return;
      }
      // If user is authenticated and on protected routes, allow access
      if (user && location === "/chat") {
        // User can access chat
        return;
      }
      // If user is not authenticated and trying to access protected routes, redirect to start page
      else if (!user && location === "/chat") {
        navigate("/start", { replace: true });
      }
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <img src="/fius-logo.png" alt="Fius" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-white text-xl font-bold tracking-widest animate-pulse">FIUS</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/chat" component={Chat} />
      <Route path="/start" component={UserInfo} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="fius-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
