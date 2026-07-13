import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Zap, Shield, Bot, ChevronDown, Check, ChevronRight } from "lucide-react";

// Moving stars background
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.7 + 0.2,
      drift: (Math.random() - 0.5) * 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        s.x += s.drift;
        if (s.y > H + 5) { s.y = -5; s.x = Math.random() * W; }
        if (s.x > W + 5) s.x = -5;
        if (s.x < -5) s.x = W + 5;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />;
}

const PLAN_FEATURES = [
  "Fius Pro Models",
  "Fius Imagine Models",
  "Complete Suite of Premium AI Models",
  "Side-by-side Comparisons",
  "3 Million Monthly Tokens (Premium models count 4x)",
  "Instant Prompt Optimization & Memory",
  "Voice Interaction Mode",
  "Professional Image Tools",
  "Extended Features: Avatars, Games & More",
  "Dedicated Image Studio: 250 Images",
  "Dedicated Voice Mode",
  "Get Models Worth More Than $150 in $11",
];

const FEATURES = [
  {
    icon: <Bot className="w-6 h-6 text-violet-400" />,
    title: "10+ Premium AI Models",
    desc: "Claude Sonnet 4, GPT-5, Gemini 3.1 Pro, Grok 4, DeepSeek, Fius Pro & more — all in one place.",
    accent: "#8b5cf6",
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    title: "Nomad: Multi-AI Mode",
    desc: "Chat with multiple top AIs simultaneously and compare responses side-by-side in real-time.",
    accent: "#f59e0b",
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-blue-400" />,
    title: "Voice Interaction",
    desc: "Speak naturally and hear AI responses back. Full voice-to-voice mode available.",
    accent: "#60a5fa",
  },
  {
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    title: "Imagine Studio",
    desc: "Generate stunning AI artwork with style presets — photorealistic, anime, oil painting & more.",
    accent: "#34d399",
  },
  {
    icon: <Zap className="w-6 h-6 text-pink-400" />,
    title: "Smart Documents",
    desc: "Create polished PDF, Word & PowerPoint documents from a single prompt — AI writes it all.",
    accent: "#f472b6",
  },
  {
    icon: <Shield className="w-6 h-6 text-cyan-400" />,
    title: "Philosopher Mode",
    desc: "Chat with 50+ historical figures — Socrates, Einstein, Shakespeare, Cleopatra & more.",
    accent: "#22d3ee",
  },
];

const FAQS = [
  { q: "What models are available on the free plan?", a: "Free users get access to select models including Llama 3 variants and limited Fius models. Upgrade to Fius Ultimate to unlock all 10+ premium models including Claude Sonnet 4, GPT-5, Gemini 3.1 Pro, and Grok 4." },
  { q: "How many tokens do I get?", a: "Free users get a limited monthly message quota. Fius Ultimate gives you 3 Million tokens per month (note: premium models count 4x, so ~750K effective premium tokens)." },
  { q: "Can I generate images?", a: "Yes! Free users get a limited number of image generations per month. Fius Ultimate gives you 250 dedicated images per month via Imagine Studio." },
  { q: "What is Nomad mode?", a: "Nomad is our exclusive multi-AI comparison mode — send one message and see responses from multiple top AIs simultaneously, side-by-side. Ultimate only." },
  { q: "Is my data private?", a: "Yes. Your conversations are private and securely stored. We do not sell your data to third parties. You can delete your history at any time from Settings." },
  { q: "Can I cancel anytime?", a: "Absolutely. Fius Ultimate is a monthly subscription with no lock-in. Cancel at any time from your account settings, effective at the end of your billing period." },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [navigatingBtn, setNavigatingBtn] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [logoHue, setLogoHue] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLogoHue(h => (h + 0.5) % 360), 30);
    return () => clearInterval(id);
  }, []);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setNavigatingBtn(id);
    setTimeout(() => setShowOverlay(true), 180);
    setTimeout(() => setLocation("/start"), 350);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(135deg, #000000 0%, #0a0a0f 40%, #111018 70%, #0d0d0d 100%)" }}>
      {/* Page transition overlay */}
      <div className={`fixed inset-0 bg-black z-[200] transition-opacity duration-500 pointer-events-none ${showOverlay ? "opacity-100" : "opacity-0"}`} />

      {/* Moving stars */}
      <StarField />

      {/* Radial glow blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animation: "pulse 8s ease-in-out infinite" }} />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", animation: "pulse 10s ease-in-out infinite reverse" }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)", animation: "pulse 12s ease-in-out infinite" }} />
      </div>

      {/* ── Floating Header ── */}
      <div className="fixed top-3 sm:top-5 left-0 right-0 z-50 flex justify-center px-4">
        <header
          className="flex items-center justify-between backdrop-blur-xl rounded-full px-5 sm:px-8 py-2.5 w-full max-w-5xl border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)", boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center space-x-2.5">
            <div style={{ filter: `hue-rotate(${logoHue}deg)`, transition: "filter 0.1s linear" }}>
              <Logo size="sm" className="text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight">Fius</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={(e) => go(e, "header")}
              className="bg-white text-black hover:bg-zinc-100 px-4 sm:px-6 py-2 text-sm rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
            >
              <span className="hidden sm:inline">Begin Experience</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </header>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">

        {/* ── Hero ── */}
        <section className="container mx-auto px-6 pt-32 sm:pt-44 pb-20 sm:pb-32 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-violet-300 border border-violet-500/30 mb-8" style={{ background: "rgba(139,92,246,0.08)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              10+ Premium AI Models · One Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
              Chat with the
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Future of AI
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Access every top AI model in one beautiful interface — with voice, image generation, multi-AI comparison, and much more.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={(e) => go(e, "hero")}
                size="lg"
                className="bg-white text-black hover:bg-zinc-100 px-10 py-6 text-lg rounded-full font-bold transition-all hover:scale-105 shadow-2xl flex items-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                Begin Experience
              </Button>
              <a href="#plans" className="text-zinc-400 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
                See plans <ChevronDown className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-zinc-500 mt-5 font-medium tracking-widest uppercase">Fly With Us!</p>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="container mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Why Fius?</h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">Everything you need to get the most out of AI — in one place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl p-6 border border-white/8 hover:border-white/16 transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.accent + "18" }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI Models Showcase ── */}
        <section className="container mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Powered by Every Top AI</h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">We bring together the world's best AI models so you don't have to choose.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {[
              { name: "Claude Sonnet 4", accent: "#f97316" }, { name: "ChatGPT 5", accent: "#10a37f" },
              { name: "Gemini 3.1 Pro", accent: "#4285f4" }, { name: "Grok 4", accent: "#9ca3af" },
              { name: "DeepSeek v3", accent: "#3b82f6" }, { name: "Perplexity Sonar", accent: "#38bdf8" },
              { name: "Kimi K2.5", accent: "#06b6d4" }, { name: "Qwen 3.6 Plus", accent: "#8b5cf6" },
              { name: "Mistral Small 4", accent: "#a855f7" }, { name: "Fius Pro", accent: "#e879f9" },
            ].map(({ name, accent }) => (
              <div key={name} className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border border-white/8 hover:border-white/16 transition-all"
                style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }} />
                <span className="text-xs font-medium text-zinc-300 truncate">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Plans ── */}
        <section id="plans" className="container mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple, Honest Pricing</h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">Start free. Upgrade when you're ready for the full experience.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start justify-center gap-6 max-w-3xl mx-auto">

            {/* Free plan */}
            <div className="flex-1 rounded-2xl border border-white/10 p-7 w-full" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-zinc-500 text-sm mb-1.5">/month</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">No credit card required</p>
              <ul className="space-y-2.5 mb-7">
                {["Select AI Models (Llama, Fius Lite)", "Limited monthly messages", "5 image generations/month", "Basic chat features"].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={(e) => go(e, "free")} variant="outline" className="w-full border-white/15 text-white hover:bg-white/8 rounded-full font-semibold">
                Get Started Free
              </Button>
            </div>

            {/* Ultimate plan */}
            <div className="flex-1 rounded-2xl p-7 w-full relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.1) 50%, rgba(59,130,246,0.12) 100%)", border: "1px solid rgba(139,92,246,0.4)" }}>
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 60%)" }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-400">Fius Ultimate</p>
                  <span className="text-[10px] font-bold bg-gradient-to-r from-violet-500 to-pink-500 text-white px-2.5 py-1 rounded-full">BEST VALUE</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">$11</span>
                  <span className="text-zinc-400 text-sm mb-1.5">/month</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">Models worth more than $150 for just $11</p>
                <ul className="space-y-2.5 mb-7">
                  {PLAN_FEATURES.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-200">
                      <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button onClick={(e) => go(e, "ultimate")} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-full font-bold shadow-lg shadow-violet-900/40 transition-all hover:scale-[1.02]">
                  Upgrade to Fius Ultimate
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="container mx-auto px-6 pb-24 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.025)" }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 ml-3 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Upgrade Banner (bottom) ── */}
        <section className="container mx-auto px-6 pb-24">
          <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0008 0%, #120020 50%, #0a000e 100%)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="p-8 sm:p-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Fius Ultimate</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-8 leading-tight">
                Everything you need.<br />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Just $11/month.</span>
              </h3>
              <ul className="space-y-3 mb-10">
                {PLAN_FEATURES.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={(e) => go(e, "banner")}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-3 rounded-full font-bold text-base shadow-xl shadow-violet-900/50 transition-all hover:scale-[1.02]"
              >
                Upgrade to Fius Ultimate — $11/mo
              </Button>
              <p className="text-xs text-zinc-600 mt-4">By signing up, you agree to receive verification emails, account updates, and marketing communications. You can unsubscribe at any time.</p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pb-24 pt-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">Ready to Fly?</h2>
          <Button
            onClick={(e) => go(e, "cta")}
            size="lg"
            className="bg-white text-black hover:bg-zinc-100 px-10 py-6 text-lg rounded-full font-bold transition-all hover:scale-105 shadow-2xl"
          >
            Begin Experience
          </Button>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/5 py-10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Logo size="sm" className="text-white" />
              <span className="text-lg font-bold text-white">Fius</span>
            </div>
            <p className="text-zinc-500 text-sm mb-1">The future of AI conversations, today.</p>
            <p className="text-zinc-700 text-xs">© 2025 Fius. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
