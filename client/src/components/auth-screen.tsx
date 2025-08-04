import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/demo', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Demo login successful');
        // Force a complete page reload to ensure session is properly established
        window.location.href = window.location.href;
      } else {
        console.error('Login failed:', response.status);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Start failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--dark-primary)] flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Main Auth Card - Grok Style */}
        <div className="bg-[var(--dark-secondary)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-8 py-8 text-center">
            <Logo size="lg" className="mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Sign in to LineusAPI
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Welcome back! Please sign in to your account
            </p>
          </div>

          {/* Start Button */}
          <div className="px-8 pb-8">
            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full h-14 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--dark-primary)] rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              data-testid="button-start"
            >
              {isLoading ? 'Starting...' : 'Start'}
            </Button>

          </div>
        </div>

        {/* Tagline - Outside card */}
        <div className="text-center mt-8">
          <h2 className="text-xl font-medium text-[var(--text-primary)] mb-2">
            Ask anything
          </h2>
          <p className="text-lg text-[var(--text-secondary)] italic">
            Lineus will do till death
          </p>
        </div>

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-[var(--text-secondary)] italic" style={{ fontSize: '14px' }}>
            Made by Muzamil
          </p>
        </div>
      </div>
    </div>
  );
}