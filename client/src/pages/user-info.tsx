import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, LockKeyhole, Phone, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { CountryPhoneField, toE164 } from "@/components/country-phone-field";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { apiRequest, authFetch, endGuestSession, getGuestId, queryClient, startGuestSession } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  phoneCountryCode?: string | null;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.57-5.17 3.57-8.83Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.73-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"/>
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"/>
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"/>
    </svg>
  );
}

function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const dots = Array.from({ length: 72 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.7,
      speed: Math.random() * 0.16 + 0.03,
      opacity: Math.random() * 0.07 + 0.025,
    }));
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      dots.forEach((dot) => {
        context.beginPath();
        context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(0,0,0,${dot.opacity})`;
        context.fill();
        dot.y += dot.speed;
        if (dot.y > height + 4) {
          dot.y = -4;
          dot.x = Math.random() * width;
        }
      });
      frameId = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", resize);
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 opacity-70" />;
}

function LoadingCard() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[30px] border border-zinc-200 bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" className="animate-pulse text-zinc-900" />
        <p className="text-sm text-zinc-400">Preparing your Fius account…</p>
      </div>
    </div>
  );
}

function ProfileSetup({ user }: { user: UserProfile }) {
  const [, setLocation] = useLocation();
  const savedCountry = COUNTRIES.find((country) => country.dialCode === user.phoneCountryCode);
  const [name, setName] = useState(user.displayName || user.username || "");
  const [country, setCountry] = useState<Country>(savedCountry || DEFAULT_COUNTRY);
  const [phoneDigits, setPhoneDigits] = useState(() => {
    if (user.phoneNumber && savedCountry && user.phoneNumber.startsWith(savedCountry.dialCode)) {
      return user.phoneNumber.slice(savedCountry.dialCode.length);
    }
    return "";
  });
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameError("");
    setPhoneError("");
    setSubmitError("");
    const cleanName = name.trim();
    const cleanDigits = phoneDigits.replace(/\D/g, "");
    let valid = true;
    if (!cleanName) {
      setNameError("Please enter your name.");
      valid = false;
    }
    if (cleanDigits.length < country.minDigits || cleanDigits.length > country.maxDigits) {
      setPhoneError(`Enter a ${country.minDigits === country.maxDigits ? `${country.minDigits}-digit` : `${country.minDigits}–${country.maxDigits} digit`} number for ${country.name}.`);
      valid = false;
    }
    if (!valid) return;

    setIsSaving(true);
    try {
      const response = await authFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phoneNumber: toE164(country, cleanDigits),
          phoneCountryCode: country.dialCode,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(body.message || "Could not save your details. Please try again.");
        return;
      }
      queryClient.setQueryData(["/api/auth/user"], body);
      queryClient.setQueryData(["/api/user"], body);
      setLocation("/chat", { replace: true });
    } catch {
      setSubmitError("Could not save your details. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="fius-onboarding-enter w-full max-w-[540px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="fius-logo-breathe mb-3">
            <Logo size="xl" className="text-zinc-900" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Fius</span>
        </div>
        <div className="overflow-hidden rounded-[40px] border border-zinc-200/90 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.11),0_8px_24px_rgba(0,0,0,0.03)]">
          <div className="h-1.5 w-full bg-zinc-100/80">
            <div className="fius-progress-sweep h-full w-2/3 rounded-full bg-zinc-900" />
          </div>
          <form onSubmit={submit} className="p-7 sm:p-11">
            <div className="mb-9 text-center">
              <div className="mb-5 flex justify-center">
                <div className="fius-account-icon flex h-[72px] w-[72px] items-center justify-center rounded-[26px] bg-zinc-900 text-white shadow-[0_14px_28px_rgba(24,24,27,0.2)]">
                  <UserRound className="h-8 w-8" strokeWidth={1.8} />
                </div>
              </div>
              <h1 className="text-[29px] font-black tracking-tight text-zinc-900 sm:text-[32px]">Tell us a little about you</h1>
              <p className="mx-auto mt-3 max-w-[390px] text-sm leading-6 text-zinc-500">This helps us personalize your Fius experience. Your phone number is used once to keep every account unique.</p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Your name</span>
                <div className={`flex h-14 items-center gap-3 rounded-[22px] border bg-white px-4 transition-[border,box-shadow] duration-300 ${nameError ? "border-red-300 ring-4 ring-red-50" : "border-zinc-200 focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-100"}`}>
                  <UserRound className="h-4 w-4 shrink-0 text-zinc-400" />
                  <input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="What should we call you?"
                    className="fius-onboarding-input min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-zinc-900 outline-none shadow-none placeholder:text-zinc-300"
                  />
                </div>
                {nameError ? <p className="mt-2 px-1 text-xs font-medium text-red-600">{nameError}</p> : <p className="mt-2 px-1 text-xs text-zinc-400">Use any name you like.</p>}
              </label>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Mobile number</span>
                <CountryPhoneField
                  country={country}
                  value={phoneDigits}
                  onCountryChange={(next) => {
                    setCountry(next);
                    setPhoneError("");
                  }}
                  onValueChange={(next) => {
                    setPhoneDigits(next);
                    setPhoneError("");
                  }}
                  disabled={isSaving}
                  error={phoneError}
                />
                {!phoneError && <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-zinc-400"><LockKeyhole className="h-3 w-3" /> Used only for account uniqueness and security.</p>}
              </div>
            </div>

            {submitError && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-700">{submitError}</div>}

            <Button type="submit" disabled={isSaving} className="mt-8 h-13 w-full rounded-[22px] bg-zinc-900 text-sm font-bold text-white shadow-lg shadow-zinc-900/10 transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl disabled:opacity-60">
              {isSaving ? "Saving your details…" : "Continue to Fius"}
              {!isSaving && <Check className="ml-2 h-4 w-4" />}
            </Button>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-400">One phone number can only be connected to one Fius account.</p>
          </form>
        </div>
        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Fly With Us!</p>
      </div>
    </div>
  );
}

function LoginCard() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedError = sessionStorage.getItem("fius_auth_error");
    if (!storedError) return;
    setError(storedError.includes("already been used") ? "That sign-in link was already used. Please click Continue with Google again." : storedError);
    sessionStorage.removeItem("fius_auth_error");
  }, []);

  const handleGuestLogin = () => {
    startGuestSession();
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    setLocation("/start");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md animate-pop-in">
        <button onClick={() => setLocation("/")} className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-[30px] border border-zinc-200 bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="lg" className="mb-4 text-zinc-900" />
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Welcome to Fius</h1>
            <p className="mt-2 text-sm text-zinc-500">Sign in to chat with the future of AI.</p>
          </div>
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}
          <Button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-0 bg-zinc-900 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60">
            <GoogleIcon /> {isLoading ? "Connecting…" : "Continue with Google"}
          </Button>
          <Button type="button" onClick={handleGuestLogin} variant="outline" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800">
            <UserRound className="h-4 w-4" /> Continue as Guest
          </Button>
          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">
            By continuing you agree to our{" "}
            <button onClick={() => setLocation("/terms")} className="text-zinc-600 underline hover:text-zinc-900">Terms</button>{" "}
            and{" "}
            <button onClick={() => setLocation("/privacy")} className="text-zinc-600 underline hover:text-zinc-900">Privacy Policy</button>.
          </p>
        </div>
        <p className="mt-8 text-center text-sm italic text-zinc-400">Fly With Us!</p>
      </div>
    </div>
  );
}

export default function UserInfo() {
  const { data: user, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await authFetch("/api/auth/user");
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Unable to load account");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <DotField />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2" style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.018) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px]" style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.022) 0%, transparent 70%)" }} />
      </div>
      {isLoading ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6"><div className="w-full max-w-md"><LoadingCard /></div></div>
      ) : user ? (
        <ProfileSetup user={user} />
      ) : (
        <LoginCard />
      )}
    </div>
  );
}