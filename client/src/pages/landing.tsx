import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X, Zap, Image as Img, MessageSquare, Mic, Layers, Star } from "lucide-react";

// ── Animated star canvas ──────────────────────────────────────────────────
function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let id: number;
    let W = (c.width = innerWidth), H = (c.height = innerHeight);
    const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    addEventListener("resize", resize);
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.25 + 0.04,
      o: Math.random() * 0.65 + 0.15,
      d: (Math.random() - 0.5) * 0.12,
    }));
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
        s.y += s.s; s.x += s.d;
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
        if (s.x > W + 4) s.x = -4;
        if (s.x < -4) s.x = W + 4;
      }
      id = requestAnimationFrame(frame);
    };
    frame();
    return () => { removeEventListener("resize", resize); cancelAnimationFrame(id); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.55 }} />;
}

// ── Rotating glow orb for AI models hub ──────────────────────────────────
function GlowOrb() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let angle = 0;
    const id = setInterval(() => {
      angle += 0.4;
      if (ref.current) ref.current.style.transform = `rotate(${angle}deg)`;
    }, 16);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,200,150,0.18) 0%, transparent 70%)", animation: "pulse 3s ease-in-out infinite" }} />
      <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
      <div className="absolute inset-7 rounded-full border border-emerald-400/15" />
      {/* Rotating ring */}
      <div ref={ref} className="absolute inset-2 rounded-full border-2 border-transparent" style={{ borderTopColor: "rgba(0,200,150,0.6)", borderRightColor: "rgba(0,200,150,0.2)" }} />
      {/* Core */}
      <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 40% 35%, #00c896, #006650)", boxShadow: "0 0 40px rgba(0,200,150,0.5), 0 0 80px rgba(0,200,150,0.2)" }}>
        <Logo size="sm" className="text-white" />
      </div>
    </div>
  );
}

// ── Model card for hub section ────────────────────────────────────────────
function ModelCard({ logo, name, tag, tagColor, desc, side }: {
  logo: string; name: string; tag: string; tagColor: string; desc: string; side: "left" | "right";
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 border border-white/8 hover:border-emerald-500/30 transition-all duration-300 w-full"
      style={{ background: "rgba(10,15,12,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: tagColor + "22", color: tagColor, border: `1px solid ${tagColor}44` }}>{tag}</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const AI_MODELS = {
  left: [
    { logo: "✦", name: "ChatGPT 5", tag: "All Rounder", tagColor: "#10a37f", desc: "Great for questions, brainstorming, and clear step-by-step explanations." },
    { logo: "❋", name: "Claude Sonnet 4", tag: "Co-Writing Master", tagColor: "#d97706", desc: "Refines polished emails, essays, and scripts while keeping your style." },
    { logo: "◆", name: "Google Gemini 3.1 Pro", tag: "Long Context Master", tagColor: "#4285f4", desc: "Handles long documents and images, tracking full context and details." },
  ],
  right: [
    { logo: "⟁", name: "Perplexity Sonar Pro", tag: "Live Web Researcher", tagColor: "#38bdf8", desc: "Delivers fresh answers and news from credible, real-time sources." },
    { logo: "⟡", name: "DeepSeek v3", tag: "Reasoning Specialist", tagColor: "#8b5cf6", desc: "Excels at logic, math, and coding with clear, detailed solutions." },
    { logo: "○", name: "Grok 4", tag: "Creative Powerhouse", tagColor: "#ec4899", desc: "Bold, unconventional ideas and punchy copy for trend-focused content." },
  ],
};

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

const COMPARE_ROWS = [
  { label: "AI Models", free: "Select models (Llama, Fius Lite)", ultimate: "10+ Premium (Claude, GPT-5, Gemini, Grok…)" },
  { label: "Messages / 30 days", free: "5 messages", ultimate: "3 Million tokens (premium 4×)" },
  { label: "Image Generation", free: "1 image / 30 days", ultimate: "250 images / 30 days" },
  { label: "Side-by-side Compare", free: false, ultimate: true },
  { label: "Voice Mode", free: false, ultimate: true },
  { label: "Imagine Studio", free: false, ultimate: true },
  { label: "Prompt Optimizer", free: false, ultimate: true },
  { label: "Avatars & Games", free: false, ultimate: true },
  { label: "Priority Support", free: false, ultimate: true },
];

const FAQS = [
  {
    q: "What do I get on the free plan?",
    a: "Free users get 5 messages total (30-day period) and 1 image generation. You can access select AI models including Llama variants and Fius Lite. Upgrade to Fius Ultimate for unlimited premium access.",
  },
  {
    q: "How many tokens / messages do I get?",
    a: "Free plan: 5 messages per 30-day period, 1 image. Fius Ultimate: 3 Million tokens per 30 days (note: premium models like Claude, GPT-5, and Gemini count 4× per token, giving ~750K effective premium tokens), plus 250 images.",
  },
  {
    q: "What AI models are included in Fius Ultimate?",
    a: "Fius Ultimate unlocks all 10+ premium models: ChatGPT 5, Claude Sonnet 4, Google Gemini 3.1 Pro, Grok 4, DeepSeek v3, Perplexity Sonar Pro, Kimi K2.5, Qwen 3.6 Plus, Mistral Small 4, and all Fius Pro models.",
  },
  {
    q: "What is Nomad (Side-by-side) mode?",
    a: "Nomad is our exclusive multi-AI comparison mode — send one message and see responses from multiple top AIs simultaneously, side-by-side. Available exclusively on Fius Ultimate.",
  },
  {
    q: "When does my plan reset?",
    a: "Both free and Ultimate plans reset every 30 days from your account creation date. Your remaining messages, images, and tokens are shown in the sidebar.",
  },
  {
    q: "Can I cancel Fius Ultimate anytime?",
    a: "Yes, absolutely. Fius Ultimate is a simple monthly subscription ($11/mo) with no lock-in contracts. Cancel anytime from Settings — your access continues until the end of the 30-day period.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your conversations are private and securely stored. We never sell your data to third parties. You can delete your entire chat history at any time from Settings.",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function Landing() {
  const [, setLocation] = useLocation();
  const [overlay, setOverlay] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"features" | "plans" | "faq">("features");

  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    setOverlay(true);
    setTimeout(() => setLocation("/start"), 350);
  };

  // Smooth scroll to section
  const scrollTo = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#000000" }}>
      {/* Transition overlay */}
      <div className={`fixed inset-0 bg-black z-[200] transition-opacity duration-500 pointer-events-none ${overlay ? "opacity-100" : "opacity-0"}`} />

      {/* Stars */}
      <StarField />

      {/* Subtle gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]" style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px]" style={{ background: "radial-gradient(ellipse at bottom right, rgba(180,140,100,0.07) 0%, transparent 70%)" }} />
      </div>

      {/* ── Floating Nav ─────────────────────────────────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <header className="flex items-center justify-between px-6 py-3 w-full max-w-5xl rounded-full border border-white/10"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", boxShadow: "0 4px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="text-white" />
            <span className="text-base font-bold text-white tracking-tight">Fius</span>
          </div>

          {/* Nav tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {([
              { key: "features", label: "Features", id: "features" },
              { key: "plans", label: "Plans", id: "plans" },
              { key: "faq", label: "FAQ", id: "faq" },
            ] as const).map(({ key, label, id }) => (
              <button
                key={key}
                onClick={() => scrollTo(id, key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === key ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <Button onClick={go} className="bg-white text-black hover:bg-zinc-100 px-5 py-2 text-sm rounded-full font-bold transition-all hover:scale-105 shadow-lg">
            Get Started
          </Button>
        </header>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 pt-36 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white/60 border border-white/15 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            30-day plans · No subscriptions lock-in
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-5 leading-[1.04] tracking-tight">
            Chat with the<br />
            <span style={{ background: "linear-gradient(90deg, #ffffff 0%, #a0a0a0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Future of AI
            </span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Access every top AI model — ChatGPT 5, Claude 4, Gemini 3, Grok 4 and more — in one premium interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={go} size="lg" className="bg-white text-black hover:bg-zinc-100 px-10 py-6 text-lg rounded-full font-bold transition-all hover:scale-105 shadow-2xl">
              Begin Experience
            </Button>
            <button onClick={() => scrollTo("plans", "plans")} className="text-zinc-500 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              See pricing <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-5 tracking-widest uppercase font-semibold">Fly With Us!</p>
        </section>

        {/* ── AI Models Hub ─────────────────────────────────────── */}
        <section id="features" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Powered by Every Top AI</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">One platform. Every frontier model. Choose what's right for each task.</p>
          </div>

          {/* Hub layout — orb in center, cards on sides */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-6xl mx-auto">
            {/* Left cards */}
            <div className="flex flex-col gap-3 w-full lg:w-72">
              {AI_MODELS.left.map((m) => (
                <ModelCard key={m.name} {...m} side="left" />
              ))}
            </div>

            {/* Center orb */}
            <div className="flex-shrink-0 flex items-center justify-center px-4 lg:px-8">
              <GlowOrb />
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-3 w-full lg:w-72">
              {AI_MODELS.right.map((m) => (
                <ModelCard key={m.name} {...m} side="right" />
              ))}
            </div>
          </div>

          {/* More models strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
            {["Kimi K2.5", "Qwen 3.6 Plus", "Mistral Small 4", "Fius Pro", "Fius Lite", "+ More"].map(n => (
              <span key={n} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-zinc-400" style={{ background: "rgba(255,255,255,0.03)" }}>{n}</span>
            ))}
          </div>
        </section>

        {/* ── Features Grid ─────────────────────────────────────── */}
        <section className="container mx-auto px-6 pb-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Why Fius?</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">Everything you need. Nothing you don't.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: <Layers className="w-5 h-5" />, color: "#8b5cf6", title: "Nomad: Multi-AI Mode", desc: "Compare responses from multiple top AIs simultaneously, side-by-side in real-time." },
              { icon: <Img className="w-5 h-5" />, color: "#ec4899", title: "Imagine Studio", desc: "Generate stunning AI art with style presets — photorealistic, anime, oil painting & more." },
              { icon: <Mic className="w-5 h-5" />, color: "#06b6d4", title: "Voice Mode", desc: "Speak naturally and hear AI responses back. Full voice-to-voice interaction available." },
              { icon: <Zap className="w-5 h-5" />, color: "#f59e0b", title: "Prompt Optimizer", desc: "One click to enhance any prompt. Let AI rewrite your question for better results." },
              { icon: <MessageSquare className="w-5 h-5" />, color: "#10b981", title: "Smart Documents", desc: "Create PDFs, Word docs and slides from a single prompt. AI writes everything." },
              { icon: <Star className="w-5 h-5" />, color: "#f97316", title: "Philosopher Mode", desc: "Chat with 50+ historical figures — Einstein, Socrates, Da Vinci, Cleopatra and more." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-5 border border-white/8 hover:border-white/16 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color + "18", color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Plans ─────────────────────────────────────────────── */}
        <section id="plans" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple Pricing</h2>
            <p className="text-zinc-500 text-base">30-day plans. Cancel anytime.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 max-w-4xl mx-auto">

            {/* ─ Free card ─ */}
            <div className="flex-1 rounded-3xl border border-white/10 p-8"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-zinc-500 text-sm mb-2">/30 days</span>
              </div>
              <p className="text-xs text-zinc-600 mb-7">No credit card required</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Select AI models (Llama, Fius Lite)",
                  "5 messages per 30 days",
                  "1 image generation per 30 days",
                  "Basic chat features",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                {["All premium models", "Voice Mode", "Imagine Studio", "Side-by-side Compare"].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-700">
                    <X className="w-4 h-4 text-zinc-800 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={go} variant="outline" className="w-full border-white/12 text-white hover:bg-white/8 rounded-full font-semibold">
                Start for Free
              </Button>
            </div>

            {/* ─ Ultimate card (styled like uploaded image) ─ */}
            <div className="flex-1 rounded-3xl relative overflow-hidden p-8"
              style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #111008 60%, #1a1208 100%)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {/* Warm bottom-right glow matching reference */}
              <div className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none" style={{ background: "radial-gradient(circle at bottom right, rgba(200,160,80,0.12) 0%, transparent 65%)" }} />
              {/* Top badge */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Fius Ultimate</p>
                  <span className="text-[10px] font-bold text-black px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(90deg, #e5d080, #c8a84b)" }}>BEST VALUE</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">$11</span>
                  <span className="text-zinc-400 text-sm mb-2">/30 days</span>
                </div>
                <p className="text-xs text-zinc-500 mb-7">Models worth more than $150 — for $11</p>

                {/* Features matching image 1 style — arrow bullets */}
                <ul className="space-y-3 mb-8">
                  {PLAN_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                      <span className="text-zinc-400 flex-shrink-0 mt-0.5 font-light">→</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Sparkle icon — bottom right of card, like reference */}
                <div className="absolute bottom-6 right-6 opacity-30 pointer-events-none">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                </div>

                <Button onClick={go} className="relative z-10 w-full text-black font-bold rounded-full py-3 transition-all hover:scale-[1.02] shadow-xl"
                  style={{ background: "linear-gradient(90deg, #e5d080, #c8a84b)", boxShadow: "0 6px 30px rgba(200,168,75,0.3)" }}>
                  Upgrade to Fius Ultimate
                </Button>
              </div>
            </div>
          </div>

          {/* ─ Comparison table ─ */}
          <div className="mt-12 max-w-3xl mx-auto rounded-3xl overflow-hidden border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-zinc-500 px-6 py-4 border-b border-white/8">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-amber-400">Ultimate</span>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-3.5 items-center text-sm border-b border-white/5 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <span className="text-zinc-300 font-medium">{row.label}</span>
                <div className="flex justify-center">
                  {typeof row.free === "boolean" ? (
                    row.free
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <X className="w-4 h-4 text-zinc-700" />
                  ) : <span className="text-xs text-zinc-400 text-center">{row.free}</span>}
                </div>
                <div className="flex justify-center">
                  {typeof row.ultimate === "boolean" ? (
                    row.ultimate
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <X className="w-4 h-4 text-zinc-700" />
                  ) : <span className="text-xs text-amber-300/80 text-center font-medium">{row.ultimate}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="container mx-auto px-6 pb-28 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">FAQ</h2>
            <p className="text-zinc-500 text-sm">Common questions answered.</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-zinc-600 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Upgrade banner (matching plan card style) ──────────── */}
        <section className="container mx-auto px-6 pb-28">
          <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden relative"
            style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #111008 60%, #1a1208 100%)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(circle at bottom right, rgba(200,160,80,0.10) 0%, transparent 65%)" }} />
            <div className="relative z-10 p-10 sm:p-14">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Fius Ultimate</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Everything you need.</h3>
              <p className="text-2xl sm:text-3xl font-black mb-8" style={{ background: "linear-gradient(90deg, #e5d080, #c8a84b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Just $11 per 30 days.
              </p>
              <ul className="space-y-3 mb-10">
                {PLAN_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-500">→</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button onClick={go}
                className="font-bold rounded-full px-10 py-3 text-black transition-all hover:scale-[1.02] shadow-xl"
                style={{ background: "linear-gradient(90deg, #e5d080, #c8a84b)" }}>
                Upgrade to Fius Ultimate — $11/30 days
              </Button>
              <p className="text-xs text-zinc-700 mt-5 max-w-lg">By signing up, you agree to receive verification emails, account updates, and marketing communications. You can unsubscribe at any time.</p>
              {/* Sparkle */}
              <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <Logo size="sm" className="text-white" />
              <span className="text-base font-bold text-white">Fius</span>
            </div>
            <p className="text-zinc-600 text-xs">© 2025 Fius. All rights reserved. · Fly With Us!</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
