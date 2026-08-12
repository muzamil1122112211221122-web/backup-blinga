import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Layers, Image as Img, Mic, Zap, MessageSquare, Star, Sparkles, Bot, Coins, Gauge, Gift } from "lucide-react";
import { UltimatePlanCard } from "@/components/ultimate-plan-card";

// ── Subtle floating dot pattern for white bg ──────────────────────────────
function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let id: number;
    let W = (c.width = innerWidth), H = (c.height = innerHeight);
    const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    addEventListener("resize", resize);
    const dots = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 1,
      s: Math.random() * 0.18 + 0.03,
      o: Math.random() * 0.12 + 0.04,
      d: (Math.random() - 0.5) * 0.08,
    }));
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of dots) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${s.o})`; ctx.fill();
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

// ── Center hub logo ────────────────────────────────────────────────────────
function HubLogo() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <Logo size="lg" className="text-zinc-900" />
      <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">Fius</span>
    </div>
  );
}

// ── Model card ─────────────────────────────────────────────────────────────
function ModelCard({ logo, name, tag, desc }: {
  logo: string; name: string; tag: string; desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 border border-zinc-200 hover:border-zinc-300 transition-all duration-300 w-full bg-white shadow-sm">
       <img
         src={logo}
         alt={name}
         className={`w-8 h-8 object-contain flex-shrink-0 mt-0.5 ${logo.includes("chatgpt") || logo.includes("grok") ? "brightness-0" : ""}`}
       />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-zinc-900">{name}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-500 bg-zinc-50">{tag}</span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">{desc}</p>
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
  { icon: <Layers className="w-6 h-6" />, title: "Nomad: Multi-AI Comparison Mode", subtitle: "One prompt. Multiple perspectives. Side-by-side.", desc: "Send a single message and instantly see responses from GPT-5, Claude 4, Gemini 3, and Grok 4 simultaneously. Compare, contrast, and pick the best — all in one interface. Exclusive to Fius.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%)" },
  { icon: <Img className="w-6 h-6" />, title: "Imagine Studio", subtitle: "Generate. Refine. Create. All in your browser.", desc: "AI image generation with curated style presets — photorealistic, cinematic, anime, oil painting, abstract and more. Your creations save locally and are always accessible in My Images.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f2f2f2 100%)" },
  { icon: <Mic className="w-6 h-6" />, title: "Voice Interaction Mode", subtitle: "Speak naturally. Hear AI respond.", desc: "Full voice-to-voice interaction powered by real-time speech recognition. Have natural conversations with any model hands-free. Perfect for when typing feels like too much.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f1f1f1 100%)" },
  { icon: <Zap className="w-6 h-6" />, title: "Prompt Optimizer", subtitle: "One click to 10× your results.", desc: "Automatically rewrites and enhances your prompts using AI. Weak questions become precise, expert-level queries. Every response you get back is measurably better.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%)" },
  { icon: <MessageSquare className="w-6 h-6" />, title: "Smart Documents", subtitle: "From prompt to PDF in seconds.", desc: "Generate professional PDFs, formatted Word documents, and presentation slides directly from a prompt. AI writes, structures, and exports — you just download.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f3f3f3 100%)" },
  { icon: <Star className="w-6 h-6" />, title: "Philosopher Mode", subtitle: "50+ minds from across human history.", desc: "Converse with Einstein, Socrates, Da Vinci, Cleopatra, Nikola Tesla and more — each with their own personality, worldview, and way of thinking. Genuinely unlike anything else.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f1f1f1 100%)" },
  { icon: <Sparkles className="w-6 h-6" />, title: "10+ Frontier AI Models", subtitle: "GPT-5, Claude 4, Gemini 3, Grok 4 & more.", desc: "Every major frontier model, unified under one roof. Switch between them instantly — no separate subscriptions, no juggling apps, no compromises on quality.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%)" },
  { icon: <Bot className="w-6 h-6" />, title: "Fius Pro & Lite", subtitle: "Our own proprietary models, built in-house.", desc: "Two exclusive Fius models tuned for speed and depth — Fius Lite for instant everyday answers, Fius Pro for heavier reasoning. Available nowhere else.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f2f2f2 100%)" },
  { icon: <Coins className="w-6 h-6" />, title: "3,000,000 Tokens / 30 Days", subtitle: "Room to actually use premium models.", desc: "A massive monthly allowance across premium models — enough for real, sustained work instead of running out of quota after a handful of prompts.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f1f1f1 100%)" },
  { icon: <Gauge className="w-6 h-6" />, title: "Priority Response Speed", subtitle: "Skip the queue on every model.", desc: "Ultimate members get priority routing across all models, meaning faster replies even during peak hours — your questions never wait in line.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%)" },
  { icon: <Gift className="w-6 h-6" />, title: "Exclusive Extras", subtitle: "Fius Minds, games & hidden modes.", desc: "Unlock members-only extras you won't find anywhere else — Fius Minds personas, built-in games, and secret modes tucked away for Ultimate subscribers.", accent: "linear-gradient(135deg, #f9f9f9 0%, #f3f3f3 100%)" },
];

function StackedFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const N = FEATURE_CARDS.length;

  useEffect(() => {
    const id = setInterval(() => setActiveIndex(i => (i + 1) % N), 3000);
    return () => clearInterval(id);
  }, [N]);

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
        className={maxHeight ? "" : "min-h-[260px] sm:min-h-[200px]"}
      >
        {FEATURE_CARDS.map((f, i) => {
          let diff = i - activeIndex;
          if (diff < 0) diff += N;
          const zIndex = N - diff;
          let transform: string;
          let opacity: number;
          if (diff === 0) { transform = "translateY(0px) scale(1)"; opacity = 1; }
          else if (diff === 1) { transform = "translateY(12px) scale(0.97)"; opacity = 0.55; }
          else if (diff === 2) { transform = "translateY(20px) scale(0.945)"; opacity = 0.28; }
          else if (diff === 3) { transform = "translateY(27px) scale(0.92)"; opacity = 0.12; }
          else { transform = "translateY(32px) scale(0.9)"; opacity = 0; }

          return (
            <div key={i} ref={el => { cardRefs.current[i] = el; }} onClick={() => setActiveIndex(i => (i + 1) % N)}
              style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex, transform, opacity, transition: "transform 0.45s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease", pointerEvents: diff === 0 ? "auto" : "none", cursor: diff === 0 ? "pointer" : "default" }}
            >
              <div className="rounded-3xl border border-zinc-200 p-7 sm:p-10 flex flex-col sm:flex-row items-start gap-6 shadow-sm"
                style={{ background: f.accent, boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                <div className="flex-shrink-0 mt-1 text-zinc-500">{f.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 leading-tight">{f.title}</h3>
                    <span className="text-[10px] font-bold uppercase flex-shrink-0 mt-1 text-zinc-400" style={{ letterSpacing: "0.12em" }}>
                      {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-3 text-zinc-500">{f.subtitle}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-6">
        {FEATURE_CARDS.map((_, i) => (
          <button key={i} aria-label={`Show feature ${i + 1}`} onClick={() => setActiveIndex(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === activeIndex ? 20 : 6, background: i === activeIndex ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.12)" }}
          />
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  { q: "What do I get on the free plan?", a: "Free users get 5 messages per 30-day period and 1 image generation. You can access select AI models including Llama variants and Fius Lite. Upgrade to Fius Ultimate for unlimited premium access across all models." },
  { q: "How many tokens / messages do I get with Ultimate?", a: "Fius Ultimate gives you 3 Million tokens per 30 days plus 250 images. Note: premium models like Claude Sonnet 4, ChatGPT 5, and Gemini 3 Pro count 4× per token — giving you roughly 750,000 effective premium-model tokens, or 3M with Fius-tier models." },
  { q: "What AI models are included in Fius Ultimate?", a: "Fius Ultimate unlocks all 10+ premium models: ChatGPT 5, Claude Sonnet 4, Google Gemini 3.1 Pro, Grok 4, DeepSeek v3, Perplexity Sonar Pro, Kimi K2.5, Qwen 3.6 Plus, Mistral Small 4, and all Fius Pro models." },
  { q: "What is Nomad (Side-by-side) mode?", a: "Nomad is Fius's exclusive multi-AI comparison feature — send one message and see responses from multiple top AIs simultaneously, side-by-side in real time. Available exclusively on Fius Ultimate." },
  { q: "When does my plan reset?", a: "Both free and Ultimate plans run on a 30-day rolling period from your account creation date. Your remaining messages, images, and tokens are always visible in the sidebar." },
  { q: "Can I cancel Fius Ultimate anytime?", a: "Yes, absolutely. No contracts, no lock-ins. Cancel anytime from Settings — your access continues until the end of your current 30-day period." },
  { q: "Is my data private?", a: "Yes. Your conversations are private and securely stored. We never sell your data to third parties. You can delete your entire chat history at any time from Settings." },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function Landing() {
  const [, setLocation] = useLocation();
  const [overlay, setOverlay] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"features" | "plans" | "faq">("features");

  const go = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const btn = e.currentTarget;
    btn.classList.remove("btn-click-pop");
    void btn.offsetWidth;
    btn.classList.add("btn-click-pop");
    setTimeout(() => setOverlay(true), 200);
    setTimeout(() => setLocation("/start"), 480);
  };

  const scrollTo = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative" style={{ background: "#ffffff", overflowX: "clip" }}>
      {/* Transition overlay */}
      <div className={`fixed inset-0 bg-white z-[200] transition-opacity duration-500 pointer-events-none ${overlay ? "opacity-100" : "opacity-0"}`} />

      <DotField />

      {/* Subtle gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.018) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.025) 0%, transparent 70%)" }} />
      </div>

      {/* ── Floating Nav ─────────────────────────────────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <header className="flex items-center justify-between px-6 py-3 w-full max-w-5xl rounded-full border border-zinc-200"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", boxShadow: "0 4px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="text-zinc-900" />
            <span className="text-base font-bold text-zinc-900 tracking-tight">Fius</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {([
              { key: "features", label: "Features", id: "features" },
              { key: "plans", label: "Plans", id: "plans" },
              { key: "faq", label: "FAQ", id: "faq" },
            ] as const).map(({ key, label, id }) => (
              <button key={key} onClick={() => scrollTo(id, key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}>
                {label}
              </button>
            ))}
          </nav>
          <Button onClick={go}
            className="font-bold px-5 py-2 text-sm rounded-full transition-colors shadow-sm border-0 bg-zinc-900 text-white hover:bg-zinc-800">
            Get Started
          </Button>
        </header>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 pt-36 pb-24 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-zinc-900 mb-5 leading-[1.04] tracking-tight">
            Chat with the<br />
            <span style={{ background: "linear-gradient(90deg, #18181b 0%, #71717a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Future of AI
            </span>
          </h1>
          <p className="text-lg text-zinc-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Access every top AI model — ChatGPT 5, Claude 4, Gemini 3, Grok 4 and more — in one premium interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={go} size="lg"
              className="font-bold px-10 py-6 text-lg rounded-full transition-colors shadow-lg border-0 bg-zinc-900 text-white hover:bg-zinc-800">
              Begin Experience
            </Button>
            <button onClick={() => scrollTo("plans", "plans")}
              className="text-zinc-400 hover:text-zinc-700 text-sm flex items-center gap-1.5 transition-colors">
              See pricing <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-5 tracking-widest uppercase font-semibold">Fly With Us!</p>
        </section>

        {/* ── AI Models Hub ─────────────────────────────────────── */}
        <section id="features" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">Powered by Every Top AI</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">One platform. Every frontier model. Choose what's right for each task.</p>
          </div>

          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 max-w-5xl mx-auto" style={{ minHeight: 320 }}>
            <div className="flex flex-col gap-3 w-full lg:w-72 relative z-10">
              {AI_MODELS.left.map((m) => <ModelCard key={m.name} {...m} />)}
            </div>
            <div className="flex-shrink-0 flex items-center justify-center px-4 lg:px-10 relative z-10">
              <HubLogo />
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-72 relative z-10">
              {AI_MODELS.right.map((m) => <ModelCard key={m.name} {...m} />)}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
            {["Kimi K2.5", "Qwen 3.6 Plus", "Mistral Small 4", "Fius Pro", "Fius Lite", "+ More"].map(n => (
              <span key={n} className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 bg-zinc-50">{n}</span>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section className="container mx-auto pb-28">
          <div className="text-center mb-12 px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">Why Fius?</h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">Everything you need. Nothing you don't.</p>
          </div>
          <StackedFeatures />
        </section>

        {/* ── Plans ─────────────────────────────────────────────── */}
        <section id="plans" className="container mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">Simple Pricing</h2>
            <p className="text-zinc-500 text-base">30-day plans. Cancel anytime.</p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-8 lg:gap-0 max-w-4xl mx-auto relative">
            {/* Free card */}
            <div className="w-full lg:pr-10 rounded-3xl">
              <div className="rounded-3xl border border-zinc-200 p-6 opacity-80 lg:scale-[0.94] origin-center bg-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Free</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-zinc-900">$0</span>
                  <span className="text-zinc-400 text-sm mb-1.5">/30 days</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">No credit card required</p>
                <ul className="space-y-2.5 mb-6">
                  {["Select AI models (Llama, Fius Lite)", "5 messages per 30 days", "1 image generation per 30 days", "Basic chat & document features"].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                      <span className="text-zinc-400 flex-shrink-0 mt-0.5 text-base font-light">⤳</span>{item}
                    </li>
                  ))}
                  {["All premium models", "Voice Mode", "Imagine Studio", "Side-by-side Compare"].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-zinc-300 flex-shrink-0 mt-0.5">–</span>{item}
                    </li>
                  ))}
                </ul>
                <Button onClick={go} variant="outline" className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-full font-semibold">
                  Start for Free
                </Button>
              </div>
            </div>

            {/* VS badge */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center border border-zinc-200 text-sm font-black tracking-wide bg-white shadow-md text-zinc-500">VS</div>
            </div>

            {/* Ultimate card */}
            <div className="w-full lg:pl-[60px] lg:scale-[1.05] origin-center">
              <UltimatePlanCard onUpgrade={go} forceLight />
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="container mx-auto px-6 pb-28 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">FAQ</h2>
            <p className="text-zinc-500 text-sm">Common questions, answered honestly.</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-sm">
                <button className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <div style={{ display: "grid", gridTemplateRows: openFaq === i ? "1fr" : "0fr", transition: "grid-template-rows 0.3s cubic-bezier(0.23,1,0.32,1)" }}>
                  <div style={{ overflow: "hidden" }}>
                    <div className="px-5 pb-4 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">{faq.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-zinc-200 py-10 bg-white">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <Logo size="sm" className="text-zinc-900" />
              <span className="text-base font-bold text-zinc-900">Fius</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button onClick={() => window.location.href = "/privacy"}
                className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all duration-200 bg-zinc-50">
                Privacy Policy
              </button>
              <span className="w-px h-3 bg-zinc-200" />
              <button onClick={() => window.location.href = "/terms"}
                className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all duration-200 bg-zinc-50">
                Terms of Service
              </button>
            </div>
            <p className="text-zinc-400 text-xs">© 2026 Fius. All rights reserved. · Fly With Us!</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
