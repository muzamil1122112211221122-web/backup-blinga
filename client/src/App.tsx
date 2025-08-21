import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Chat from "@/pages/chat";
import UserInfo from "@/pages/user-info";
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
      // If user is authenticated and on root path, redirect to chat
      if (user && location === "/") {
        navigate("/chat", { replace: true });
      }
      // If user is not authenticated and on protected routes, redirect to start page
      else if (!user && location !== "/" && location !== "/start") {
        navigate("/start", { replace: true });
      }
    }
  }, [user, isLoading, location, navigate]);

  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/chat" component={Chat} />
      <Route path="/start" component={UserInfo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="forus-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
