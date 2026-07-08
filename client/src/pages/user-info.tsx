import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "register" | "verify-sent" | "forgot";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.57-5.17 3.57-8.83Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.73-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"/>
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"/>
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"/>
    </svg>
  );
}

export default function UserInfo() {
  const [location, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devVerifyUrl, setDevVerifyUrl] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const getToday = () => new Date().toISOString().split("T")[0];
  const [today] = useState(getToday);

  // Check for ?verified=1 in URL after email verification redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setMode("login");
      setInfo("Email verified! You can now log in.");
    }
  }, []);

  const clearForm = () => {
    setError("");
    setInfo("");
    setDevVerifyUrl("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    clearForm();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Login failed.");
      } else {
        setLocation("/chat");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (oauthError) setError(oauthError.message || "Google sign-in failed.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !birthDate) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const birth = new Date(birthDate);
    const now = new Date();
    const age = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 5) { setError("You must be at least 5 years old."); return; }

    setIsLoading(true);
    clearForm();
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), birth_date: birthDate },
          emailRedirectTo: `${window.location.origin}/start?verified=1`,
        },
      });
      if (signUpError) {
        setError(signUpError.message || "Registration failed.");
      } else if (data.session) {
        // Email confirmation disabled on this Supabase project — user is signed in immediately.
        setLocation("/chat");
      } else {
        setRegisteredEmail(email.trim().toLowerCase());
        setMode("verify-sent");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    clearForm();
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: { emailRedirectTo: `${window.location.origin}/start?verified=1` },
      });
      setInfo(resendError ? resendError.message : "Verification email sent.");
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stars = (
    <div className="absolute inset-0">
      <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full opacity-60"></div>
      <div className="absolute top-40 right-32 w-0.5 h-0.5 bg-white rounded-full opacity-40"></div>
      <div className="absolute bottom-32 left-40 w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
      <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full opacity-30"></div>
      <div className="absolute bottom-20 right-20 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
    </div>
  );

  const logo = (
    <div className="flex items-center justify-center mb-6">
      <Logo size="lg" className="text-white" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="absolute inset-0 bg-gradient-radial from-gray-800/20 via-transparent to-transparent"></div>
      {stars}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md animate-pop-in">
          <div className="mb-8">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* ── VERIFY SENT ──────────────────────────────────────────────── */}
          {mode === "verify-sent" && (
            <Card className="border-white/20 bg-black/80 backdrop-blur-sm shadow-2xl">
              <CardContent className="pt-10 pb-8 text-center space-y-5">
                {logo}
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Check your email</h2>
                <p className="text-gray-300">
                  We sent a verification link to <span className="text-white font-medium">{registeredEmail}</span>.
                  Click the link to activate your account.
                </p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {info && <p className="text-green-400 text-sm">{info}</p>}
                <Button
                  onClick={handleResend}
                  disabled={isLoading}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isLoading ? "Sending..." : "Resend verification email"}
                </Button>
                <div>
                  <button
                    onClick={() => { setMode("login"); clearForm(); }}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── LOGIN ────────────────────────────────────────────────────── */}
          {mode === "login" && (
            <Card className="border-white/20 bg-black/80 backdrop-blur-sm shadow-2xl">
              <CardHeader className="text-center pb-4">
                {logo}
                <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
                <p className="text-gray-400 text-sm">Log in to your Fius account</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {info && (
                  <div className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    {info}
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 pr-11"
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      {error}
                      {error.includes("verify") && (
                        <button
                          type="button"
                          onClick={() => { setMode("verify-sent"); setRegisteredEmail(email); clearForm(); }}
                          className="block mt-1 text-blue-400 hover:text-blue-300 underline text-xs"
                        >
                          Resend verification email
                        </button>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim() || !password}
                    className="w-full h-11 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg"
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-gray-500">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-11 bg-white/5 border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setMode("register"); clearForm(); }}
                    className="text-white hover:underline font-medium"
                  >
                    Create one
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── REGISTER ─────────────────────────────────────────────────── */}
          {mode === "register" && (
            <Card className="border-white/20 bg-black/80 backdrop-blur-sm shadow-2xl">
              <CardHeader className="text-center pb-4">
                {logo}
                <h1 className="text-3xl font-bold text-white mb-1">Create account</h1>
                <p className="text-gray-400 text-sm">Join Fius — it's free</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Full name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Date of birth</Label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      min="1900-01-01"
                      max={today}
                      className="h-11 bg-white/10 border-white/20 text-white focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 pr-11"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Confirm password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 pr-11"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !name.trim() || !email.trim() || !password || !confirmPassword || !birthDate}
                    className="w-full h-11 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("login"); clearForm(); }}
                    className="text-white hover:underline font-medium"
                  >
                    Log in
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500">
                  By creating an account you agree to our{" "}
                  <button onClick={() => setLocation("/terms")} className="text-gray-400 hover:text-white underline">Terms</button>
                  {" "}and{" "}
                  <button onClick={() => setLocation("/privacy")} className="text-gray-400 hover:text-white underline">Privacy Policy</button>
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-8">
            <p className="text-lg text-gray-300 italic">Fly With Us!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
