import { useState } from "react";
import { AuthScreen } from "../components/auth-screen";
import { ChatInterface } from "../components/chat-interface";

export default function Chat() {
  const [showAuth, setShowAuth] = useState(true);

  const handleAuthComplete = () => {
    setShowAuth(false);
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen">
      {showAuth ? (
        <AuthScreen onSkip={handleAuthComplete} />
      ) : (
        <ChatInterface onShowAuth={handleShowAuth} />
      )}
    </div>
  );
}
