import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDemoLogin = async () => {
    try {
      const response = await fetch('/api/auth/demo', { method: 'POST' });
      if (response.ok) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--dark-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Left side - Auth Form */}
        <div className="w-full max-w-md">
          <div className="bg-[var(--dark-secondary)] rounded-2xl p-8 shadow-xl border border-[var(--border)]">
            <div className="flex items-center justify-center mb-8">
              <Logo size="lg" />
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Welcome to LineusAPI
              </h1>
              <p className="text-[var(--text-secondary)]">
                Sign in to continue to your AI assistant
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                className="w-full bg-[#4285f4] hover:bg-[#3367d6] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-3"
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--dark-secondary)] px-2 text-[var(--text-secondary)]">Or</span>
                </div>
              </div>
              
              <Button
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--dark-accent)] py-3"
                data-testid="button-demo-login"
              >
                Continue with Demo Account
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="w-full max-w-2xl text-center lg:text-left">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
                Ask anything<br />
                <span className="text-[var(--primary-blue)]">Lineus will do</span><br />
                till death
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Experience the power of advanced AI with our premium chat application. 
                Get intelligent responses, creative solutions, and personalized assistance 
                for all your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="bg-[var(--dark-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[var(--primary-blue)] mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Lightning Fast</h3>
                <p className="text-sm text-[var(--text-secondary)]">Get instant responses powered by advanced AI models</p>
              </div>

              <div className="bg-[var(--dark-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[var(--primary-blue)] mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Secure & Private</h3>
                <p className="text-sm text-[var(--text-secondary)]">Your conversations are encrypted and protected</p>
              </div>

              <div className="bg-[var(--dark-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[var(--primary-blue)] mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Smart & Creative</h3>
                <p className="text-sm text-[var(--text-secondary)]">From analysis to creativity, we've got you covered</p>
              </div>

              <div className="bg-[var(--dark-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                <div className="text-[var(--primary-blue)] mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Mobile Ready</h3>
                <p className="text-sm text-[var(--text-secondary)]">Perfect experience on all your devices</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)] italic">
                Made by Muzamil
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}