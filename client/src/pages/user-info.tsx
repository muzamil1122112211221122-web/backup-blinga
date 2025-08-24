import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function UserInfo() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !birthDate) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    
    // Single step - Create account and login
    try {
      const response = await fetch('/api/auth/demo', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: name.trim(),
          birthDate: birthDate,
        })
      });
      
      if (response.ok) {
        console.log('Login successful');
        // Clear any stored auth state
        localStorage.removeItem("authStep");
        localStorage.removeItem("registeredName");
        localStorage.removeItem("registeredBirthDate");
        setLocation('/chat');
      } else {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setLocation('/');
  };


  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background elements matching landing page */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-800/20 via-transparent to-transparent"></div>
      
      {/* Minimal stars for atmosphere */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-40 right-32 w-0.5 h-0.5 bg-white rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-40 w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Back button */}
          <div className="mb-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-white hover:bg-white/10 flex items-center gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Main Card */}
          <Card className="border-white/20 bg-black/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-6">
              {/* Logo */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-400 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-black" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to Forus Heavy API
              </h1>
              <p className="text-gray-300 text-lg">
                Create your account
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please tell us a bit about yourself to get started
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Google Login Button */}
              <div className="space-y-4">
                <Button
                  onClick={() => window.location.href = '/api/auth/google'}
                  className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  data-testid="button-google-login"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-black/80 px-4 text-gray-400">OR</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white text-base font-medium">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-base focus:border-white/40 focus:ring-white/20"
                    required
                    data-testid="input-name"
                  />
                </div>

                {/* Birth date field */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white text-base font-medium">
                    Date of Birth
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white text-base focus:border-white/40 focus:ring-white/20"
                    required
                    data-testid="input-birth-date"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}


                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim() || !birthDate}
                  className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-continue"
                >
                  {isLoading ? 'Creating Account...' : 'Begin Experience'}
                </Button>
              </form>

              {/* Privacy note */}
              <div className="text-center text-xs text-gray-400 mt-4">
                Your information is securely stored and private
              </div>
            </CardContent>
          </Card>

          {/* Tagline below card */}
          <div className="text-center mt-8">
            <p className="text-lg text-gray-300 italic">
              Forus from Planet M
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}