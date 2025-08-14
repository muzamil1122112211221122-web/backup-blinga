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
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="w-full max-w-md px-6">
        {/* Main Auth Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-8 py-8 text-center">
            <Logo size="lg" className="mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to Forus Heavy API
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter the world of advanced AI conversation
            </p>
          </div>

          {/* Start Button */}
          <div className="px-8 pb-8">
            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              data-testid="button-start"
            >
              {isLoading ? 'Connecting...' : 'Begin Experience'}
            </Button>
          </div>
        </div>

        {/* Tagline - Outside card */}
        <div className="text-center mt-8">
          <h2 className="text-xl font-medium text-foreground mb-2">
            Forus Heavy API
          </h2>
          <p className="text-lg text-muted-foreground italic">
            Forus from Plant M
          </p>
        </div>
      </div>

      {/* Credit line - Bottom right */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        Powered by Plant M
      </div>
    </div>
  );
}