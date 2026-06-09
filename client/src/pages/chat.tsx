import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChatInterface } from "../components/chat-interface";
import { MobileChatInterface } from "../components/mobile-chat-interface";
import { useIsMobileOrTablet } from "../hooks/use-mobile";

export default function Chat() {
  const [, navigate] = useLocation();
  const isMobileOrTablet = useIsMobileOrTablet();

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

  if (!user) return null;

  if (isMobileOrTablet) {
    return <MobileChatInterface onShowAuth={() => navigate("/start")} />;
  }

  return (
    <div className="min-h-screen">
      <ChatInterface onShowAuth={() => navigate("/start")} />
    </div>
  );
}
