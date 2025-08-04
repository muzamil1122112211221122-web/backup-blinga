import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "./logo";

interface AuthScreenProps {
  onSkip: () => void;
}

export function AuthScreen({ onSkip }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthOption = async (provider: string) => {
    setIsLoading(true);
    // TODO: Implement actual authentication
    console.log(`Authenticate with ${provider}`);
    
    // Simulate auth process
    setTimeout(() => {
      setIsLoading(false);
      onSkip(); // For now, just proceed to chat
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--dark-primary)]">
      {/* Skip Button */}
      <Button
        variant="ghost"
        className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        onClick={onSkip}
        data-testid="button-skip-auth"
      >
        Skip
      </Button>
      
      {/* Logo and Branding */}
      <div className="text-center mb-12">
        <Logo size="xl" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">LineusAPI</h1>
        <p className="text-[var(--text-secondary)] text-lg">Ask anything Lineus will do till death</p>
      </div>
      
      {/* Authentication Options */}
      <Card className="w-full max-w-sm bg-[var(--dark-secondary)] border-[var(--border)]">
        <CardContent className="p-6 space-y-4">
          <Button
            className="w-full bg-[var(--dark-secondary)] hover:bg-[var(--dark-accent)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center space-x-3"
            onClick={() => handleAuthOption('google')}
            disabled={isLoading}
            data-testid="button-auth-google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </Button>
          
          <Button
            className="w-full bg-[var(--dark-secondary)] hover:bg-[var(--dark-accent)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center space-x-3"
            onClick={() => handleAuthOption('apple')}
            disabled={isLoading}
            data-testid="button-auth-apple"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Continue with Apple</span>
          </Button>
          
          <Button
            className="w-full bg-[var(--dark-secondary)] hover:bg-[var(--dark-accent)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center space-x-3"
            onClick={() => handleAuthOption('x')}
            disabled={isLoading}
            data-testid="button-auth-x"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Continue with X</span>
          </Button>
          
          <Button
            variant="ghost"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
            onClick={() => handleAuthOption('other')}
            disabled={isLoading}
            data-testid="button-auth-other"
          >
            Other options
          </Button>
        </CardContent>
      </Card>
      
      {/* Terms and Privacy */}
      <div className="text-center mt-8 text-xs text-[var(--text-secondary)] pb-16">
        By continuing you agree to the{" "}
        <a href="#" className="underline hover:text-[var(--text-primary)]">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-[var(--text-primary)]">
          Privacy Policy
        </a>
      </div>
      
      {/* Attribution - Fixed positioning with proper spacing */}
      <div className="fixed bottom-4 right-4 attribution text-[var(--text-secondary)] z-10">
        Made by Muzamil
      </div>
    </div>
  );
}
