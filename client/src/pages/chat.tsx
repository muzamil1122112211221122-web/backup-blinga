import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChatInterface } from "../components/chat-interface";

export default function Chat() {
  const [, navigate] = useLocation();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      navigate("/start", { replace: true });
    }
  }, [user, isLoading, error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /start in useEffect
  }

  return (
    <div className="min-h-screen">
      <ChatInterface onShowAuth={() => navigate("/start")} />
    </div>
  );
}
