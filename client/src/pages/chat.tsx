import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthScreen } from "../components/auth-screen";
import { ChatInterface } from "../components/chat-interface";

export default function Chat() {
  const [showAuth, setShowAuth] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setShowAuth(true);
    } else if (user) {
      setShowAuth(false);
    }
  }, [user, isLoading, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dark-primary)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {showAuth ? (
        <AuthScreen onAuthSuccess={() => setShowAuth(false)} />
      ) : (
        <ChatInterface onShowAuth={() => setShowAuth(true)} />
      )}
    </div>
  );
}
