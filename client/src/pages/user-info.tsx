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
  const [authStep, setAuthStep] = useState<"register" | "login">(
    localStorage.getItem("authStep") === "login" ? "login" : "register"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !birthDate) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    
    if (authStep === "register") {
      // First step - Register the user
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
          // Registration successful, move to login step
          localStorage.setItem("authStep", "login");
          localStorage.setItem("registeredName", name.trim());
          localStorage.setItem("registeredBirthDate", birthDate);
          setAuthStep("login");
          setIsLoading(false);
          setError("");
        } else {
          setError('Registration failed. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Registration failed:', error);
        setError('Registration failed. Please try again.');
        setIsLoading(false);
      }
    } else {
      // Second step - Login the user
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
          // Clear the auth step from localStorage
          localStorage.removeItem("authStep");
          localStorage.removeItem("registeredName");
          localStorage.removeItem("registeredBirthDate");
          setLocation('/chat');
        } else {
          setError('Login failed. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Login failed:', error);
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (authStep === "login") {
      // If on login step, go back to register
      setAuthStep("register");
      localStorage.setItem("authStep", "register");
      setError("");
    } else {
      // If on register step, go back to landing page
      setLocation('/');
    }
  };

  // Load saved data if returning to login step
  useEffect(() => {
    if (authStep === "login") {
      const savedName = localStorage.getItem("registeredName");
      const savedBirthDate = localStorage.getItem("registeredBirthDate");
      if (savedName) setName(savedName);
      if (savedBirthDate) setBirthDate(savedBirthDate);
    }
  }, [authStep]);

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
                {authStep === "register" ? "Welcome to Forus Heavy API" : "Login your account"}
              </h1>
              <p className="text-gray-300 text-lg">
                {authStep === "register" ? "Please Register" : "Login your account"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {authStep === "register" 
                  ? "Please tell us a bit about yourself to get started"
                  : "Confirm your details to access your account"
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
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

                {/* Success message for registration */}
                {authStep === "login" && !error && (
                  <div className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    Registration successful! Please confirm your details to login.
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim() || !birthDate}
                  className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-continue"
                >
                  {isLoading 
                    ? (authStep === "register" ? 'Registering...' : 'Logging in...')
                    : (authStep === "register" ? 'Register' : 'Login to Chat')
                  }
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