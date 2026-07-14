import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react"; // useRef kept for StarField
import { ChevronDown, Layers, Image as Img, Mic, Zap, MessageSquare, Star } from "lucide-react";

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
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.22 + 0.04,
      o: Math.random() * 0.6 + 0.15,
      d: (Math.random() - 0.5) * 0.1,
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
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.5 }} />;
}

// ── Center hub logo (no circle) ────────────────────────────────────────────
function HubLogo() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <Logo size="lg" className="text-white" />
      <span className="text-xs font-bold tracking-widest uppercase text-zinc-600">Fius</span>
    </div>
  );
}

// ── Model card with real logo ─────────────────────────────────────────────
function ModelCard({ logo, name, tag, desc }: {
  logo: string; name: string; tag: string; desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 border border-white/8 hover:border-white/20 transition-all duration-300 w-full"
      style={{ background: "rgba(18,18,18,0.92)", backdropFilter: "blur(12px)" }}>
      <img src={logo} alt={name} className="w-8 h-8 object-contain flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/15 text-white/50"
            style={{ background: "rgba(255,255,255,0.06)" }}>{tag}</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const AI_MODELS = {
  left: [
    { logo: "/chatgpt-logo.png", name: "ChatGPT 5", tag: "All Rounder", desc: "OpenAI's flagship — perfect for questions, brainstorming & step-by-step explanations." },
    { logo: "/claude-logo.png", name: "Claude Sonnet 4", tag: "Co-Writing Master", desc: "Refines polished essays, emails & scripts while preserving your exact tone." },
    { logo: "/gemini-logo.png", name: "Gemini 3.1 Pro", tag: "Long-Context Champion", desc: "Handles massive docs and images while tracking full context without loss." },
  ],
  right: [
    { logo: "/perplexity-logo.png", name: "Perplexity Sonar Pro", tag: "Live Researcher", desc: "Delivers real-time answers and news from credible, up-to-the-minute web sources." },
    { logo: "/deepseek-logo.png", name: "DeepSeek v3", tag: "Reasoning Specialist", desc: "Excels at logic, math & coding with detailed, methodical solutions." },
    { logo: "/grok-logo.png", name: "Grok 4", tag: "Creative Powerhouse", desc: "Bold, unconventional ideas and punchy copy — built for trend-forward content." },
  ],
};

// ── Stacked scrollable feature cards ─────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Nomad: Multi-AI Comparison Mode",
    subtitle: "One prompt. Multiple perspectives. Side-by-side.",
    desc: "Send a single message and instantly see responses from GPT-5, Claude 4, Gemini 3, and Grok 4 simultaneously. Compare, contrast, and pick the best — all in one interface. Exclusive to Fius.",
    accent: "linear-gradient(135deg, #111111 0%, #1e1e1e 60%, #2e2e2e 100%)",
  },
  {
    icon: <Img className="w-6 h-6" />,
    title: "Imagine Studio",
    subtitle: "Generate. Refine. Create. All in your browser.",
    desc: "AI image generation with curated style presets — photorealistic, cinematic, anime, oil painting, abstract and more. Your creations save locally and are always accessible in My Images.",
    accent: "linear-gradient(135deg, #111111 0%, #181818 55%, #303030 100%)",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Interaction Mode",
    subtitle: "Speak naturally. Hear AI respond.",
    desc: "Full voice-to-voice interaction powered by real-time speech recognition. Have natural conversations with any model hands-free. Perfect for when typing feels like too much.",
    accent: "linear-gradient(135deg, #111111 0%, #141414 50%, #282828 100%)",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Prompt Optimizer",
    subtitle: "One click to 10× your results.",
    desc: "Automatically rewrites and enhances your prompts using AI. Weak questions become precise, expert-level queries. Every response you get back is measurably better.",
    accent: "linear-gradient(135deg, #111111 0%, #161616 52%, #2c2c2c 100%)",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Smart Documents",
    subtitle: "From prompt to PDF in seconds.",
    desc: "Generate professional PDFs, formatted Word documents, and presentation slides directly from a prompt. AI writes, structures, and exports — you just download.",
    accent: "linear-gradient(135deg, #111111 0%, #1a1a1a 58%, #323232 100%)",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Philosopher Mode",
    subtitle: "50+ minds from across human history.",
    desc: "Converse with Einstein, Socrates, Da Vinci, Cleopatra, Nikola Tesla and more — each with their own personality, worldview, and way of thinking. Genuinely unlike anything else.",
    accent: "linear-gradient(135deg, #111111 0%, #1c1c1c 56%, #363636 100%)",
  },
];

function StackedFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const N = FEATURE_CARDS.length;

  // Auto-cycle the stack — no scroll-jacking, no dead scroll space below.
  useEffect(() => {
    const id = setInterval(() => setActiveIndex(i => (i + 1) % N), 4200);
    return () => clearInterval(id);
  }, [N]);

  // Measure the tallest card once so the stack reserves a fixed, minimal
  // height (all cards are absolutely positioned inside it) — this is what
  // removes the huge empty area that used to sit below the section.
  useEffect(() => {
    const measure = () => {
      const tallest = Math.max(0, ...cardRefs.current.map(el => el?.offsetHeight ?? 0));
      if (tallest) setMaxHeight(tallest);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="px-4 sm:px-6">
      <div
        style={{ position: "relative", maxWidth: 820, margin: "0 auto", height: maxHeight ?? undefined }}
        // small default reserve until measured, avoids a flash of 0-height
        className={maxHeight ? "" : "min-h-[260px] sm:min-h-[200px]"}
      >
        {FEATURE_CARDS.map((f, i) => {
          // circular distance from the active card — this is what makes the
          // deck feel stacked "by default": card 0 sits on top, and the next
          // cards peek out just slightly above/behind it, very lightly.
          let diff = i - activeIndex;
          if (diff < 0) diff += N;

          const zIndex = N - diff;
          let transform: string;
          let opacity: number;
          if (diff === 0) {
            transform = "translateY(0px) scale(1)";
            opacity = 1;
          } else if (diff === 1) {
            transform = "translateY(12px) scale(0.97)";
            opacity = 0.55;
          } else if (diff === 2) {
            transform = "translateY(20px) scale(0.945)";
            opacity = 0.28;
          } else if (diff === 3) {
            transform = "translateY(27px) scale(0.92)";
            opacity = 0.12;
          } else {
            transform = "translateY(32px) scale(0.9)";
            opacity = 0;
          }

          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              onClick={() => setActiveIndex(i => (i + 1) % N)}
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                zIndex,
                transform,
                opacity,
                transition: "transform 0.45s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease",
                pointerEvents: diff === 0 ? "auto" : "none",
                cursor: diff === 0 ? "pointer" : "default",
              }}
            >
              <div
                className="rounded-3xl border p-7 sm:p-10 flex flex-col sm:flex-row items-start gap-6"
                style={{
                  background: f.accent,
                  borderColor: `rgba(255,255,255,${0.06 + i * 0.015})`,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex-shrink-0 mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight">{f.title}</h3>
                    <span
                      className="text-[10px] font-bold uppercase flex-shrink-0 mt-1"
                      style={{
                        letterSpacing: "0.12em",
                        background: "linear-gradient(90deg, #555 0%, #fff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{f.subtitle}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* progress dots — tap to jump straight to a card */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {FEATURE_CARDS.map((_, i) => (
          <button
            key={i}
            aria-label={`Show feature ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 20 : 6,
              background: i === activeIndex ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const PLAN_FEATURES = [
  "10+ Frontier AI Models — GPT-5, Claude 4, Gemini 3, Grok 4 & More",
  "Fius Pro & Lite Proprietary Models",
  "Nomad Mode — Real-Time Multi-AI Side-by-Side Comparisons",
  "3,000,000 Tokens per 30 Days (Premium Models Included)",
  "Imagine Studio — 250 AI Images per Period",
  "Smart Prompt Optimizer & Persistent Conversation Memory",
  "Full Voice-to-Voice Interaction Mode",
  "Professional AI Image Creation & Editing Suite",
  "Priority Response Speeds Across All Models",
  "Exclusive Extras — AI Avatars, Games & Hidden Modes",
  "Access $150+ Worth of AI Models — Yours for Just $11",
];

const FAQS = [
  {
    q: "What do I get on the free plan?",
    a: "Free users get 5 messages per 30-day period and 1 image generation. You can access select AI models including Llama variants and Fius Lite. Upgrade to Fius Ultimate for unlimited premium access across all models.",
  },
  {
    q: "How many tokens / messages do I get with Ultimate?",
    a: "Fius Ultimate gives you 3 Million tokens per 30 days plus 250 images. Note: premium models like Claude Sonnet 4, ChatGPT 5, and Gemini 3 Pro count 4× per token — giving you roughly 750,000 effective premium-model tokens, or 3M with Fius-tier models.",
  },
  {
    q: "What AI models are included in Fius Ultimate?",
    a: "Fius Ultimate unlocks all 10+ premium models: ChatGPT 5, Claude Sonnet 4, Google Gemini 3.1 Pro, Grok 4, DeepSeek v3, Perplexity Sonar Pro, Kimi K2.5, Qwen 3.6 Plus, Mistral Small 4, and all Fius Pro models.",
  },
  {
    q: "What is Nomad (Side-by-side) mode?",
    a: "Nomad is Fius's exclusive multi-AI comparison feature — send one message and see responses from multiple top AIs simultaneously, side-by-side in real time. Available exclusively on Fius Ultimate.",
  },
  {
    q: "When does my plan reset?",
    a: "Both free and Ultimate plans run on a 30-day rolling period from your account creation date. Your remaining messages, images, and tokens are always visible in the sidebar.",
  },
  {
    q: "Can I cancel Fius Ultimate anytime?",
    a: "Yes, absolutely. No contracts, no lock-ins. Cancel anytime from Settings — your access continues until the end of your current 30-day period.",
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

  const scrollTo = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#0d0d0d", overflowX: "clip" }}>
      {/* Transition overlay */}
      <div className={`fixed inset-0 bg-black z-[200] transition-opacity duration-500 pointer-events-none ${overlay ? "opacity-100" : "opacity-0"}`} />

      <StarField />

      {/* Subtle gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── Floating Nav ─────────────────────────────────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <header className="flex items-center justify-between px-6 py-3 w-full max-w-5xl rounded-full border border-white/10"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(24px)", boxShadow: "0 4px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="text-white" />
            <span className="text-base font-bold text-white tracking-tight">Fius</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {([
              { key: "features", label: "Features", id: "features" },
              { key: "plans", label: "Plans", id: "plans" },
              { key: "faq", label: "FAQ", id: "faq" },
            ] as const).map(({ key, label, id }) => (
              <button key={key} onClick={() => scrollTo(id, key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === key ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </nav>
          <Button onClick={go}
            className="font-bold px-5 py-2 text-sm rounded-full transition-all hover:scale-105 shadow-lg border-0"
            style={{ background: "linear-gradient(110deg, #000000 0%, #ffffff 100%)", color: "#000", textShadow: "none" }}>
            <span style={{ background: "linear-gradient(110deg, #ffffff 0%, #000000 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get Started</span>
          </Button>
        </header>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 pt-36 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white/50 border border-white/12 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            30-day plans · No subscription lock-in
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-5 leading-[1.04] tracking-tight">
            Chat with the<br />
            <span style={{ background: "linear-gradient(90deg, #ffffff 0%, #6b6b6b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Future of AI
            </span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Access every top AI model — ChatGPT 5, Claude 4, Gemini 3, Grok 4 and more — in one premium interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={go} size="lg"
              className="font-bold px-10 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-2xl border-0 relative overflow-hidden"
              style={{ background: "linear-gradient(110deg, #000000 0%, #ffffff 100%)" }}>
              <span style={{ background: "linear-gradient(110deg, #ffffff 0%, #000000 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Begin Experience
              </span>
            </Button>
            <button onClick={() => scrollTo("plans", "plans")}
              className="text-zinc-500 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              See pricing <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-700 mt-5 tracking-widest uppercase font-semibold">Fly With Us!</p>
        </section>

        {/* ── AI Models Hub ─────────────────────────────────────── */}
        <section id="features" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Powered by Every Top AI</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">One platform. Every frontier model. Choose what's right for each task.</p>
          </div>

          {/* Hub layout with SVG connecting lines */}
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 max-w-5xl mx-auto" style={{ minHeight: 320 }}>

            {/* Left cards */}
            <div className="flex flex-col gap-3 w-full lg:w-72 relative z-10">
              {AI_MODELS.left.map((m) => (
                <ModelCard key={m.name} {...m} />
              ))}
            </div>

            {/* Center — just the Fius logo, no circle */}
            <div className="flex-shrink-0 flex items-center justify-center px-4 lg:px-10 relative z-10">
              <HubLogo />
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-3 w-full lg:w-72 relative z-10">
              {AI_MODELS.right.map((m) => (
                <ModelCard key={m.name} {...m} />
              ))}
            </div>
          </div>

          {/* More models strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
            {["Kimi K2.5", "Qwen 3.6 Plus", "Mistral Small 4", "Fius Pro", "Fius Lite", "+ More"].map(n => (
              <span key={n} className="text-xs px-3 py-1.5 rounded-full border border-white/8 text-zinc-500"
                style={{ background: "rgba(255,255,255,0.02)" }}>{n}</span>
            ))}
          </div>
        </section>

        {/* ── Features — Stacked Scroll Cards ──────────────────── */}
        <section className="container mx-auto pb-28">
          <div className="text-center mb-12 px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Why Fius?</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">Everything you need. Nothing you don't.</p>
          </div>
          <StackedFeatures />
        </section>

        {/* ── Plans ─────────────────────────────────────────────── */}
        <section id="plans" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple Pricing</h2>
            <p className="text-zinc-500 text-base">30-day plans. Cancel anytime.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 max-w-4xl mx-auto">

            {/* ─ Free card ─ */}
            <div className="flex-1 rounded-3xl border border-white/8 p-8"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-zinc-600 text-sm mb-2">/30 days</span>
              </div>
              <p className="text-xs text-zinc-700 mb-7">No credit card required</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Select AI models (Llama, Fius Lite)",
                  "5 messages per 30 days",
                  "1 image generation per 30 days",
                  "Basic chat & document features",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="text-zinc-600 flex-shrink-0 mt-0.5 text-base font-light">⤳</span>
                    {item}
                  </li>
                ))}
                {["All premium models", "Voice Mode", "Imagine Studio", "Side-by-side Compare"].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-700">
                    <span className="text-zinc-800 flex-shrink-0 mt-0.5">–</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={go} variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/6 rounded-full font-semibold">
                Start for Free
              </Button>
            </div>

            {/* ─ Ultimate card — black bg + gradient border + gradient accents ─ */}
            <div className="flex-1 rounded-3xl relative overflow-hidden p-[1px]"
              style={{ background: "linear-gradient(145deg, #333333 0%, #888888 50%, #ffffff 100%)" }}>
              {/* Inner card — stays dark so text is always readable */}
              <div className="rounded-[23px] relative overflow-hidden p-8 h-full"
                style={{ background: "linear-gradient(145deg, #111111 0%, #161616 50%, #1e1e1e 100%)" }}>
                {/* White shimmer glow top-right */}
                <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
                  style={{ background: "radial-gradient(circle at top right, rgba(255,255,255,0.07) 0%, transparent 65%)" }} />
                {/* White glow bottom-right */}
                <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
                  style={{ background: "radial-gradient(circle at bottom right, rgba(255,255,255,0.05) 0%, transparent 60%)" }} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest"
                      style={{ background: "linear-gradient(90deg, #888 0%, #fff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Fius Ultimate
                    </p>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 text-white/70"
                      style={{ background: "rgba(255,255,255,0.06)" }}>BEST VALUE</span>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-black"
                      style={{ background: "linear-gradient(110deg, #ffffff 0%, #aaaaaa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      $11
                    </span>
                    <span className="text-zinc-500 text-sm mb-2">/30 days</span>
                  </div>
                  <p className="text-xs text-zinc-600 mb-7">Models worth more than $150 — for $11</p>

                  {/* Arrow-bullet features with ⤳ icon */}
                  <ul className="space-y-3 mb-8">
                    {PLAN_FEATURES.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="flex-shrink-0 mt-0.5 text-lg leading-none font-light"
                          style={{ background: "linear-gradient(180deg, #fff 0%, #555 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          ⤳
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Sparkle icon — bottom right */}
                  <div className="absolute bottom-6 right-6 opacity-15 pointer-events-none">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                  </div>

                  <Button onClick={go}
                    className="relative z-10 w-full font-bold rounded-full py-3 transition-all hover:scale-[1.02] shadow-xl border-0"
                    style={{ background: "linear-gradient(110deg, #000000 0%, #ffffff 100%)" }}>
                    <span style={{ background: "linear-gradient(110deg, #ffffff 0%, #000000 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Upgrade to Fius Ultimate
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="container mx-auto px-6 pb-28 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">FAQ</h2>
            <p className="text-zinc-500 text-sm">Common questions, answered honestly.</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/8 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-zinc-600 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {/* smooth height via grid 0fr→1fr — no JS measurement needed */}
                <div style={{
                  display: "grid",
                  gridTemplateRows: openFaq === i ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.3s cubic-bezier(0.23,1,0.32,1)",
                }}>
                  <div style={{ overflow: "hidden" }}>
                    <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <Logo size="sm" className="text-white" />
              <span className="text-base font-bold text-white">Fius</span>
            </div>
            <p className="text-zinc-700 text-xs">© 2025 Fius. All rights reserved. · Fly With Us!</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
