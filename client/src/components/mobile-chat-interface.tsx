import React, { useState, useRef, useEffect, useCallback, Component, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
import { EducationModal } from "./education-modal";
import { useTheme } from "./theme-provider";
import {
  X, ArrowUp, Menu, Check, ChevronRight, Download, ChevronLeft,
  Mic, FileText, Image, Sun, Moon, Monitor, AudioLines, Globe,
  RefreshCcw, Palette, ChevronDown, Trash2, Camera, Sparkles,
  Brain, Search, PenTool, Filter, ChevronUp, Database, Sliders,
  User, Pencil, Laptop, GraduationCap, RefreshCw, Target, Share2,
  Heart, Wand2, Edit, Maximize2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import enhancePromptDark from "@assets/enhance_promt_button_-_Copy_1766904971885.png";
import enhancePromptLight from "@assets/enhance_promt_button_1766904971889.png";
import attachmentDark from "@assets/attachment_button_-_Copy_1766904971886.png";
import attachmentLight from "@assets/attachment_button_1766904971888.png";
import micDark from "@assets/mic_button_-_Copy_1766904971887.png";
import micLight from "@assets/mic_button_1766904971887.png";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-5 p-8 text-center">
        <RefreshCcw className="w-10 h-10 text-red-400" />
        <p className="text-base font-bold text-foreground">Something went wrong</p>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          className="px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-semibold">Reload</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "ask" | "imagine" | "philosopher" | "nomad" | "games";

interface Msg { id: string; role: "user" | "ai"; content: string; imageUrl?: string; timestamp: Date; isGenerating?: boolean; }
interface Conv { id: string; title: string; createdAt: string | Date; updatedAt?: string | Date; aiRole?: string; isProject?: boolean; }
interface Personality { id: string; name: string; era: string; role: string; category: string; style: string; wikiTitle?: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS: { id: MobileTab; label: string }[] = [
  { id: "ask", label: "Ask" }, { id: "nomad", label: "Nomad" }, { id: "imagine", label: "Studio" },
  { id: "philosopher", label: "Minds" }, { id: "games", label: "Games" },
];

const ASK_MODELS = [
  { id: "fius-lite", name: "Fius Lite", dot: "#9ca3af" },
  { id: "fius-pro", name: "Fius Pro", dot: "#9ca3af" },
  { id: "fius-education", name: "Fius Education", dot: "#9ca3af" },
];

const IMAGINE_STYLES_LOCAL: Record<string, string> = {
  Photorealistic: "/style-photo.jpg", Anime: "/style-anime.png", "Oil Painting": "/style-oil.jpg",
  "3D Render": "/style-3d.jpg", Watercolor: "/style-watercolor.jpg", Sketch: "/style-sketch.jpg",
  Cinematic: "/style-cinematic.jpg",
};

const GALLERY_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70", label: "Mountain Sunrise", prompt: "a breathtaking sunrise over snow-capped mountain peaks with golden rays" },
  { url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=70", label: "Ocean Storm", prompt: "powerful ocean waves crashing against rocky cliffs in a storm" },
  { url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=70", label: "Lion Portrait", prompt: "a majestic lion in close-up with intense eyes and golden mane" },
];

const NOMAD_CONFIG: Record<string, { name: string; logo: string; color: string; description: string }> = {
  "gpt-4o":          { name: "ChatGPT 5",          logo: "/chatgpt-logo.png",    color: "#10a37f", description: "Advanced reasoning & multimodal AI by OpenAI" },
  "claude-3.5-sonnet":{ name: "Claude Sonnet 4",   logo: "/claude-logo.png",    color: "#f97316", description: "Nuanced writing, analysis & coding" },
  "gemini-pro":      { name: "Gemini 2.5 Pro",      logo: "/gemini-logo.png",    color: "#14b8a6", description: "Google's multimodal reasoning model" },
  "perplexity":      { name: "Perplexity Sonar Pro",logo: "/kimi-logo.png",      color: "#38bdf8", description: "Real-time web search & cited answers" },
  "grok-4":          { name: "Grok 4",              logo: "/grok-logo.png",      color: "#6b7280", description: "xAI's witty, curious & unfiltered model" },
  "deepseek-r1":     { name: "Deepseek v3",         logo: "/deepseek-logo.png",  color: "#3b82f6", description: "Open-source reasoning & coding" },
  "fius-ai":         { name: "Fius Pro",            logo: "/fius-logo.png",      color: "#a855f7", description: "Specialized productivity AI" },
};

const NOMAD_DEFAULT_MODELS = Object.keys(NOMAD_CONFIG);

const PRESETS = [
  { id: "custom", label: "Custom", desc: "Default style" },
  { id: "concise", label: "Concise", desc: "Brief & direct" },
  { id: "formal", label: "Formal", desc: "Professional tone" },
  { id: "socratic", label: "Socratic", desc: "Asks questions" },
];

const SUGGESTION_CARDS = [
  { icon: <Search className="w-4 h-4 text-orange-400" />, title: "Research & analysis", desc: "Deep dive into any topic", prompt: "Analyze the benefits of renewable energy sources" },
  { icon: <PenTool className="w-4 h-4 text-blue-400" />, title: "Creative writing", desc: "Stories, essays, content", prompt: "Write a short story about time travel" },
  { icon: <Brain className="w-4 h-4 text-purple-400" />, title: "Brainstorm ideas", desc: "Generate fresh concepts", prompt: "Give me 10 creative business ideas for 2025" },
];

const PHIL_CATEGORIES = ["All", "Leaders", "Philosophers", "Scientists", "Artists", "Reformers"];

const PHILOSOPHERS: Personality[] = [
  { id: "jinnah",    name: "Muhammad Ali Jinnah",  era: "1876–1948",   role: "Founder of Pakistan",      category: "Leaders",     style: "Formal, precise, passionate about rights",                 wikiTitle: "Muhammad Ali Jinnah" },
  { id: "gandhi",    name: "Mahatma Gandhi",        era: "1869–1948",   role: "Leader of Independence",   category: "Leaders",     style: "Gentle, humble, speaks in parables",                       wikiTitle: "Mahatma Gandhi" },
  { id: "napoleon",  name: "Napoleon Bonaparte",    era: "1769–1821",   role: "French Emperor",           category: "Leaders",     style: "Intense, direct, tactical genius",                         wikiTitle: "Napoleon" },
  { id: "lincoln",   name: "Abraham Lincoln",       era: "1809–1865",   role: "16th US President",        category: "Leaders",     style: "Storytelling, humble, deeply moral",                       wikiTitle: "Abraham Lincoln" },
  { id: "mandela",   name: "Nelson Mandela",        era: "1918–2013",   role: "South African President",  category: "Leaders",     style: "Dignified, forgiving, hopeful",                            wikiTitle: "Nelson Mandela" },
  { id: "churchill", name: "Winston Churchill",     era: "1874–1965",   role: "British Prime Minister",   category: "Leaders",     style: "Eloquent, defiant, powerful rhetoric",                     wikiTitle: "Winston Churchill" },
  { id: "cleopatra", name: "Cleopatra VII",         era: "69–30 BC",    role: "Egyptian Queen",           category: "Leaders",     style: "Intelligent, seductive, politically shrewd",               wikiTitle: "Cleopatra" },
  { id: "socrates",  name: "Socrates",              era: "470–399 BC",  role: "Greek Philosopher",        category: "Philosophers",style: "Socratic questioning, admits knowing nothing",              wikiTitle: "Socrates" },
  { id: "plato",     name: "Plato",                 era: "428–348 BC",  role: "Greek Philosopher",        category: "Philosophers",style: "Uses allegories, references ideal world",                   wikiTitle: "Plato" },
  { id: "aristotle", name: "Aristotle",             era: "384–322 BC",  role: "Greek Philosopher",        category: "Philosophers",style: "Systematic, categorizing, methodical",                      wikiTitle: "Aristotle" },
  { id: "nietzsche", name: "Friedrich Nietzsche",   era: "1844–1900",   role: "German Philosopher",       category: "Philosophers",style: "Aphoristic, bold, references Übermensch",                   wikiTitle: "Friedrich Nietzsche" },
  { id: "laotzu",    name: "Lao Tzu",               era: "6th c. BC",   role: "Daoist Philosopher",       category: "Philosophers",style: "Paradoxical, flowing, Tao references",                      wikiTitle: "Laozi" },
  { id: "confucius", name: "Confucius",             era: "551–479 BC",  role: "Chinese Philosopher",      category: "Philosophers",style: "Short wise sayings, virtue and duty",                       wikiTitle: "Confucius" },
  { id: "marcus",    name: "Marcus Aurelius",       era: "121–180 AD",  role: "Roman Emperor-Philosopher",category: "Philosophers",style: "Stoic, introspective, references duty",                     wikiTitle: "Marcus Aurelius" },
  { id: "machiavelli",name:"Niccolò Machiavelli",   era: "1469–1527",   role: "Political Philosopher",    category: "Philosophers",style: "Coldly pragmatic, power without morality",                  wikiTitle: "Machiavelli" },
  { id: "einstein",  name: "Albert Einstein",       era: "1879–1955",   role: "Theoretical Physicist",    category: "Scientists",  style: "Curious, thought-experiment driven",                       wikiTitle: "Albert Einstein" },
  { id: "newton",    name: "Isaac Newton",          era: "1643–1727",   role: "Mathematician & Physicist",category: "Scientists",  style: "Precise, references natural philosophy",                   wikiTitle: "Isaac Newton" },
  { id: "tesla",     name: "Nikola Tesla",          era: "1856–1943",   role: "Electrical Engineer",      category: "Scientists",  style: "Visionary, eccentric, references AC power",                wikiTitle: "Nikola Tesla" },
  { id: "curie",     name: "Marie Curie",           era: "1867–1934",   role: "Physicist & Chemist",      category: "Scientists",  style: "Determined, focused, references radioactivity",            wikiTitle: "Marie Curie" },
  { id: "darwin",    name: "Charles Darwin",        era: "1809–1882",   role: "Naturalist",               category: "Scientists",  style: "Careful, methodical, natural selection",                   wikiTitle: "Charles Darwin" },
  { id: "davinci",   name: "Leonardo da Vinci",     era: "1452–1519",   role: "Polymath & Artist",        category: "Artists",     style: "Curiosity without bounds, art and science as one",         wikiTitle: "Leonardo da Vinci" },
  { id: "shakespeare",name: "William Shakespeare",  era: "1564–1616",   role: "Playwright & Poet",        category: "Artists",     style: "Poetic, dramatic, references human nature",                wikiTitle: "William Shakespeare" },
  { id: "beethoven", name: "Ludwig van Beethoven",  era: "1770–1827",   role: "Composer",                 category: "Artists",     style: "Passionate, tormented, references music as destiny",       wikiTitle: "Ludwig van Beethoven" },
  { id: "picasso",   name: "Pablo Picasso",         era: "1881–1973",   role: "Artist",                   category: "Artists",     style: "Provocative, creative, references cubism",                 wikiTitle: "Pablo Picasso" },
  { id: "tubman",    name: "Harriet Tubman",        era: "1822–1913",   role: "Abolitionist",             category: "Reformers",   style: "Determined, courageous, references freedom",               wikiTitle: "Harriet Tubman" },
  { id: "mlk",       name: "Martin Luther King Jr.",era: "1929–1968",   role: "Civil Rights Leader",      category: "Reformers",   style: "Oratorical brilliance, references the dream",              wikiTitle: "Martin Luther King Jr." },
];

function uid() { return Math.random().toString(36).slice(2); }

// ─── WikiFace ─────────────────────────────────────────────────────────────────
const wikiCache = new Map<string, string>();
async function fetchWiki(title: string): Promise<string | null> {
  if (wikiCache.has(title)) return wikiCache.get(title)!;
  try {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=120&origin=*`);
    const d = await r.json();
    const pages = d?.query?.pages;
    const url = pages ? Object.values(pages)[0] as any : null;
    const imgUrl = url?.thumbnail?.source || null;
    if (imgUrl) wikiCache.set(title, imgUrl);
    return imgUrl;
  } catch { return null; }
}

function WikiFace({ name, wikiTitle, size = 36 }: { name: string; wikiTitle?: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(wikiCache.get(wikiTitle || name) ?? null);
  useEffect(() => {
    const t = wikiTitle || name;
    if (wikiCache.has(t)) { setSrc(wikiCache.get(t)!); return; }
    let cancelled = false;
    fetchWiki(t).then(url => { if (!cancelled && url) setSrc(url); });
    return () => { cancelled = true; };
  }, [name, wikiTitle]);
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 border border-border/50"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover object-top" />
        : <span className="text-white font-bold" style={{ fontSize: size * 0.42 }}>{name.charAt(0)}</span>}
    </div>
  );
}

// ─── Micro components ─────────────────────────────────────────────────────────
function FiusAvatar({ size = 28 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)" }}>
      F
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

function MsgBubble({ msg, onExpandImg }: { msg: Msg; onExpandImg?: (s: string) => void }) {
  const isUser = msg.role === "user";
  if (msg.imageUrl) {
    return (
      <div className="mb-3.5 rounded-2xl overflow-hidden border border-border bg-card animate-in fade-in duration-200">
        {msg.isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="flex gap-1.5">{[0,150,300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: "0.9s" }} />)}</div>
            <span className="text-xs text-muted-foreground font-medium">Creating your image…</span>
          </div>
        ) : (
          <>
            <img src={msg.imageUrl} alt="Generated" className="w-full h-auto cursor-zoom-in"
              onClick={() => onExpandImg?.(msg.imageUrl!)}
              onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400"; }} />
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border">
              <button onClick={async () => {
                try { const a = document.createElement("a"); const blob = await (await fetch(msg.imageUrl!)).blob(); a.href = URL.createObjectURL(blob); a.download = "fius-image.png"; a.click(); } catch { window.open(msg.imageUrl, "_blank"); }
              }} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <Download className="w-3.5 h-3.5" /> Save
              </button>
              <button onClick={() => navigator.clipboard.writeText(msg.imageUrl!)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div className={`flex gap-2 mb-3.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}>
      {!isUser && <div className="self-end mb-5 flex-shrink-0"><FiusAvatar size={26} /></div>}
      <div className={`flex flex-col max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${isUser ? "rounded-tr-sm bg-zinc-900 dark:bg-zinc-700 text-white" : "rounded-tl-sm bg-card border border-border text-foreground"}`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">{format(msg.timestamp, "h:mm a")}</span>
      </div>
    </div>
  );
}

// ─── Model Sheet ──────────────────────────────────────────────────────────────
function ModelSheet({ models, current, onSelect, onClose }: {
  models: { id: string; name: string }[]; current: string; onSelect: (id: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative bg-background rounded-t-[24px] shadow-2xl animate-in slide-in-from-bottom duration-350"
        style={{ animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
        <p className="text-[16px] font-bold text-foreground px-5 mb-2">Select Model</p>
        {models.map((opt, i) => (
          <button key={opt.id} onClick={() => { onSelect(opt.id); onClose(); }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors ${opt.id === current ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-400" />
            <span className="text-[14px] font-semibold text-foreground flex-1">{opt.name}</span>
            {opt.id === current && <Check className="w-4 h-4 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Message Bar (PC compact style) ────────────────────────────────────
interface MsgBarProps {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop?: () => void;
  isTyping: boolean; placeholder: string;
  tab: MobileTab;
  model?: string; onModelChange?: (m: string) => void;
  fiusIntegrationMode?: boolean; onIntegration?: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  showEnhance?: boolean; showModel?: boolean; onCameraRef?: () => void;
  hidden?: boolean;
}

function MobileMessageBar({ value, onChange, onSend, onStop, isTyping, placeholder, tab, model, onModelChange, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, showEnhance = true, showModel = true, hidden = false }: MsgBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showModelSheet, setShowModelSheet] = useState(false);

  const models = ASK_MODELS;
  const currentModel = models.find(m => m.id === model) || models[0];

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 100) + "px";
  }, [value]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening && (window as any)._sr) { (window as any)._sr.stop(); return; }
    const rec = new SR(); (window as any)._sr = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; onChange(value ? `${value} ${t}` : t); };
    rec.onend = () => setIsListening(false);
    rec.start(); setIsListening(true);
  };

  const handleEnhance = async () => {
    if (!value.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/enhance-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: value }) });
      const data = await res.json();
      if (data.enhancedPrompt) onChange(data.enhancedPrompt);
    } catch { } finally { setIsEnhancing(false); }
  };

  if (hidden) return null;

  // Shared button class for the input pill buttons
  // Input pill icon button — circle with background
  const iconBtnCls = "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 bg-zinc-200/80 dark:bg-zinc-700/60 hover:bg-zinc-300/80 dark:hover:bg-zinc-600/60";
  // Theme-aware icon: use dark:invert to flip black icon → white in dark mode
  const imgCls = "w-4 h-4 dark:invert";
  const showFnBar = tab !== "philosopher" && tab !== "games";

  // Function bar button: circle icon + label below
  const FnBtn = ({ onClick, icon, label, active, iconBg, textColor }: {
    onClick?: () => void; icon: React.ReactNode; label: string;
    active?: boolean; iconBg?: string; textColor?: string;
  }) => (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-2xl transition-all active:scale-90 flex-shrink-0 ${textColor || (active ? "text-blue-400" : "text-zinc-500 dark:text-zinc-400")}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg || (active ? "bg-blue-500/15" : "bg-zinc-200/80 dark:bg-zinc-700/60")}`}>
        {icon}
      </div>
      <span className="text-[9.5px] font-semibold leading-none tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex-shrink-0 px-3 pb-3 pt-0">
      {isListening && (
        <div className="flex justify-center mb-1.5">
          <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Listening…</span>
          </div>
        </div>
      )}

      {showModelSheet && model && onModelChange && (
        <ModelSheet models={models} current={model} onSelect={onModelChange} onClose={() => setShowModelSheet(false)} />
      )}

      {/* ── Function bar: icon + label buttons ── */}
      {showFnBar && (
        <div className="flex items-start justify-between mb-2 px-0.5">
          <FnBtn
            onClick={onIntegration}
            active={fiusIntegrationMode}
            iconBg={fiusIntegrationMode ? "bg-blue-500/15" : "bg-zinc-200/80 dark:bg-zinc-700/60"}
            textColor={fiusIntegrationMode ? "text-blue-400" : "text-zinc-500 dark:text-zinc-400"}
            icon={<img src="/integration-icon.png" alt="" style={{ width: 18, height: 18 }} className={imgCls} />}
            label="Integrated"
          />
          <FnBtn
            onClick={onVoiceMode}
            icon={<AudioLines className="w-[18px] h-[18px]" />}
            label="Voice Mode"
          />
          <FnBtn
            onClick={onSettings}
            icon={<img src="/settings-icon.png" alt="" style={{ width: 17, height: 17 }} className={imgCls} />}
            label="Settings"
          />
          {model === "fius-education" && onEducation && (
            <FnBtn
              onClick={onEducation}
              iconBg="bg-amber-500/15"
              textColor="text-amber-400"
              icon={<GraduationCap className="w-[18px] h-[18px]" />}
              label="Education"
            />
          )}
          {showModel && tab !== "nomad" && model && onModelChange && (
            <button onClick={() => setShowModelSheet(true)}
              className="flex flex-col items-center gap-1 px-1 py-1.5 rounded-2xl transition-all active:scale-90 flex-shrink-0 text-zinc-500 dark:text-zinc-400">
              <div className="h-9 px-3 rounded-full flex items-center gap-1.5 bg-zinc-200/80 dark:bg-zinc-700/60">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-400" />
                <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                  {currentModel.name}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
              </div>
              <span className="text-[9.5px] font-semibold leading-none tracking-tight">Model</span>
            </button>
          )}
        </div>
      )}

      {/* ── Main input pill ── */}
      <div className="bg-white dark:bg-[#303030] rounded-3xl glossy-outline overflow-hidden">
        <div className="flex items-end px-2 py-2 gap-1.5">
          {/* Attachment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={iconBtnCls}>
                <img src={attachmentLight} alt="Attach" className={imgCls} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none rounded-xl shadow-2xl p-1 min-w-[160px] z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-foreground" onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 text-zinc-400" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-foreground" onClick={() => imageInputRef.current?.click()}>
                <Image className="w-4 h-4 text-zinc-400" /> Upload Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={fileInputRef} type="file" className="hidden" />
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" />

          {/* Textarea */}
          <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKey}
            placeholder={placeholder} rows={1}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed py-1.5 px-1"
            style={{ maxHeight: 120, scrollbarWidth: "none", minHeight: 28 }} />

          {/* Mic — theme-aware */}
          <button onClick={toggleMic}
            className={`${iconBtnCls} ${isListening ? "!bg-emerald-500/10 !text-emerald-400" : ""}`}>
            <img src={micLight} alt="Mic" className={imgCls} />
          </button>

          {/* Enhance — theme-aware */}
          {showEnhance && (
            <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing} className={`${iconBtnCls} disabled:opacity-30`}>
              {isEnhancing
                ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <img src={enhancePromptLight} alt="Enhance" className={imgCls} />}
            </button>
          )}

          {/* Send / Stop */}
          {isTyping ? (
            <button onClick={onStop}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 transition-all">
              <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
            </button>
          ) : (
            <button onClick={onSend} disabled={!value.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 disabled:opacity-30 transition-all hover:bg-zinc-700 dark:hover:bg-zinc-100">
              <ArrowUp className="w-4 h-4 text-white dark:text-black" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Settings ──────────────────────────────────────────────────────────
type SettingsSection = "account" | "appearance" | "behavior" | "general" | "nomad";

function MobileSettings({ isOpen, onClose, user, profilePicture, onProfilePictureChange, onUserRename, model, onModelChange, onChatBgChange }: {
  isOpen: boolean; onClose: () => void;
  user?: { username: string; email: string; displayName?: string };
  profilePicture?: string; onProfilePictureChange?: (d: string) => void; onUserRename?: (n: string) => void;
  model?: string; onModelChange?: (m: string) => void; onChatBgChange?: (bg: string) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [closing, setClosing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || user?.username || "");
  const [previewPic, setPreviewPic] = useState("");
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem("aiPreset") || "custom");
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem("customInstructions") || "");
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [localToggles, setLocalToggles] = useState({ autoScroll: true, richText: true, improveModel: true, personalize: true, nomadGrid: true, nomadNotification: true });
  const [localAiOrder, setLocalAiOrder] = useState(["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai"]);
  const picInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen) { setEditName(user?.displayName || user?.username || ""); setPreviewPic(""); setShowCustomizePanel(false); setClosing(false); } }, [isOpen, user]);

  const handleClose = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose(); }, 300); };

  const handleSave = () => {
    localStorage.setItem("aiPreset", selectedPreset); localStorage.setItem("customInstructions", customInstructions); localStorage.setItem("chatBg", chatBg);
    onChatBgChange?.(chatBg); window.dispatchEvent(new Event("chatBgChanged")); handleClose();
  };

  const moveOrder = (i: number, dir: "up" | "down") => {
    const n = [...localAiOrder];
    if (dir === "up" && i > 0) [n[i], n[i-1]] = [n[i-1], n[i]];
    else if (dir === "down" && i < n.length - 1) [n[i], n[i+1]] = [n[i+1], n[i]];
    setLocalAiOrder(n);
  };

  const MODEL_NAMES: Record<string, string> = { "gpt-4o": "ChatGPT 5", "claude-3.5-sonnet": "Claude Sonnet 4", "gemini-pro": "Gemini 2.5 Pro", "perplexity": "Perplexity Sonar Pro", "grok-4": "Grok 4", "deepseek-r1": "Deepseek v3", "fius-ai": "Fius Pro" };
  const initials = (user?.displayName || user?.username || "?").charAt(0).toUpperCase();

  const menuItems: { id: SettingsSection; label: string; icon: React.ComponentType<any> }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "general", label: "Main Area", icon: Sliders },
    { id: "appearance", label: "Preferences", icon: Palette },
  ];

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${closing ? "animate-out fade-out duration-280" : "animate-in fade-in duration-220"}`} />
      <div className={`relative bg-background rounded-t-[24px] flex flex-col overflow-hidden ${closing ? "animate-out slide-out-to-bottom duration-300" : "animate-in slide-in-from-bottom duration-360"}`}
        style={{ height: "78vh", boxShadow: "0 -10px 60px rgba(0,0,0,0.35)", animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/50 flex-shrink-0">
          <h2 className="text-[17px] font-bold text-foreground">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold active:scale-95 transition-all">Save</button>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent/80 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Horizontal tab bar — full width, no cramped sidebar */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-shrink-0 border-b border-border/50 bg-zinc-50 dark:bg-[#161616]">
            <div className="flex items-center overflow-x-auto px-2 py-1.5 gap-1" style={{ scrollbarWidth: "none" }}>
              {menuItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-[12px] font-semibold transition-all flex-shrink-0 ${activeSection === item.id ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"}`}>
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === "account" && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-[#1a1a1a] rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {(previewPic || profilePicture) ? <img src={previewPic || profilePicture} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>{initials}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{user?.displayName || user?.username || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => setShowCustomizePanel(v => !v)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-accent/60 transition-all">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  {showCustomizePanel && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div><label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                        <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" className="mt-1.5 h-9 rounded-xl bg-background border-border/60 text-sm" /></div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowCustomizePanel(false); setPreviewPic(""); }} className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={async () => {
                          if (!editName.trim()) return;
                          try { await apiRequest("PATCH", "/api/auth/user", { username: editName.trim() }); onUserRename?.(editName.trim()); queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); setShowCustomizePanel(false); } catch {}
                        }} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold active:scale-95">
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Main Area = General + Behavior combined ── */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Preset</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map(p => (
                      <button key={p.id} onClick={() => setSelectedPreset(p.id)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all active:scale-[0.97] ${selectedPreset === p.id ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        <div className="flex items-center gap-1 w-full">
                          <p className="text-[12px] font-bold text-foreground">{p.label}</p>
                          {selectedPreset === p.id && <Check className="w-3 h-3 ml-auto text-foreground" />}
                        </div>
                        <p className="text-[10.5px] text-muted-foreground">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Custom Instructions</p>
                  <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="Tell Fius how to respond…"
                    className="w-full h-24 bg-zinc-50 dark:bg-[#1a1a1a] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Behavior</p>
                  <div className="space-y-4">
                    {[
                      { key: "autoScroll", label: "Enable Auto Scroll", desc: "" },
                      { key: "richText", label: "Rich Text Editor", desc: "Code blocks and lists" },
                      { key: "improveModel", label: "Improve the Model", desc: "Allow data to improve AI quality" },
                      { key: "personalize", label: "Personalize Fius", desc: "Remember details from past chats" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="flex-1"><p className="text-[12.5px] font-medium text-foreground">{item.label}</p>{item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}</div>
                        <Switch checked={localToggles[item.key as keyof typeof localToggles]} onCheckedChange={() => setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Preferences = Appearance + Nomad combined ── */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ v: "light" as const, icon: Sun, label: "Light" }, { v: "dark" as const, icon: Moon, label: "Dark" }, { v: "system" as const, icon: Laptop, label: "System" }].map(opt => (
                      <button key={opt.v} onClick={() => setTheme(opt.v)}
                        className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border transition-all active:scale-95 ${theme === opt.v ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        <opt.icon className={`w-4 h-4 ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`} />
                        <span className={`text-[11px] font-semibold ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Chat Background</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["plain","gradient","rainbow","stars","stars-gradient","stars-rainbow"].map(v => (
                      <button key={v} onClick={() => { setChatBg(v); localStorage.setItem("chatBg", v); onChatBgChange?.(v); window.dispatchEvent(new Event("chatBgChanged")); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 ${chatBg === v ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 ${chatBg === v ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                        <span className={`text-[12px] font-semibold capitalize ${chatBg === v ? "text-foreground" : "text-muted-foreground"}`}>{v.replace(/-/g, " ")}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Nomad Order</p>
                  <div className="space-y-2">
                    {localAiOrder.map((name, i) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-border/50">
                        <span className="text-[12.5px] font-medium text-foreground">{MODEL_NAMES[name] || name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveOrder(i, "up")} disabled={i === 0} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => moveOrder(i, "down")} disabled={i === localAiOrder.length - 1} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PC-style Header ──────────────────────────────────────────────────────────
function PCHeader({ activeTab, onTabChange, onMenuClick }: { activeTab: MobileTab; onTabChange: (t: MobileTab) => void; onMenuClick: () => void; }) {
  const { theme, setTheme } = useTheme();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    const btn = tabRefs.current[idx]; const nav = navRef.current;
    if (!btn || !nav) return;
    const nr = nav.getBoundingClientRect(); const br = btn.getBoundingClientRect();
    setPill({ left: br.left - nr.left, width: br.width, ready: true });
  }, [activeTab]);

  const cycleTheme = () => { if (theme === "light") setTheme("dark"); else if (theme === "dark") setTheme("system"); else setTheme("light"); };

  return (
    <header className="flex-shrink-0 bg-card border border-border rounded-full px-2 py-1.5 flex items-center mx-3 mt-2 mb-1 z-10 gap-1 glossy-outline">
      <button onClick={onMenuClick} className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        <Menu className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div ref={navRef} className="relative flex items-center min-w-max">
          {pill.ready && (
            <div aria-hidden style={{ position: "absolute", left: pill.left, width: pill.width, top: 1, bottom: 1, background: theme === "dark" ? "rgba(255,255,255,0.92)" : "white", borderRadius: 14, boxShadow: theme === "dark" ? "0 1px 12px rgba(255,255,255,0.2)" : "0 1px 8px rgba(0,0,0,0.14)", transition: "left 0.35s cubic-bezier(0.23,1,0.32,1), width 0.35s cubic-bezier(0.23,1,0.32,1)", pointerEvents: "none", zIndex: 0 }} />
          )}
          {TABS.map(({ id, label }, i) => (
            <button key={id} ref={el => { tabRefs.current[i] = el; }} onClick={() => onTabChange(id)}
              className={`relative z-10 flex-shrink-0 text-[12px] px-2.5 py-1.5 rounded-2xl font-medium transition-colors duration-200 ${activeTab === id ? "text-zinc-900 dark:text-zinc-900 font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={cycleTheme} className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : theme === "system" ? <Monitor className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </button>
    </header>
  );
}

// ─── Ask Tab ──────────────────────────────────────────────────────────────────
function AskTab({ messages, isTyping, input, setInput, onSend, onStop, model, setModel, user, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; model: string; setModel: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  fiusIntegrationMode?: boolean; onIntegration?: () => void; onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 text-center">
            <Logo size="xl" className="mb-5 text-foreground" />
            <h2 className="text-[22px] font-bold text-foreground mb-1">
              {user?.displayName ? `Welcome back, ${user.displayName}!` : user?.username ? `Welcome back, ${user.username}!` : "Welcome to Fius"}
            </h2>
            <p className="text-sm text-muted-foreground mb-7">Fly With Us!</p>
            <p className="text-[11px] font-semibold text-muted-foreground mb-3.5 uppercase tracking-wide">What's on your mind?</p>
            <div className="w-full flex flex-col gap-2.5">
              {SUGGESTION_CARDS.map((card, i) => (
                <button key={i} onClick={() => setInput(card.prompt)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card text-left active:scale-[0.97] transition-all hover:bg-accent/60">
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 border border-border/60">{card.icon}</div>
                  <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-foreground">{card.title}</p><p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
            {isTyping && (
              <div className="flex gap-2 mb-3.5 animate-in fade-in">
                <div className="self-end mb-5 flex-shrink-0"><FiusAvatar size={26} /></div>
                <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>
      <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping}
        placeholder="What do you want to know?" tab="ask" model={model} onModelChange={setModel}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode}
        onSettings={onSettings} onEducation={onEducation} showEnhance showModel />
    </>
  );
}

// ─── Nomad Tab (PC-style multi-column) ────────────────────────────────────────
function NomadTab({ input, setInput, onSend, isTyping, nomadMessages, nomadTyping, activeModels, onToggleModel, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode }: {
  input: string; setInput: (v: string) => void; onSend: () => void; isTyping: boolean;
  nomadMessages: Record<string, { id: string; role: "user" | "ai"; content: string }[]>;
  nomadTyping: Record<string, boolean>;
  activeModels: Set<string>; onToggleModel: (id: string) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
}) {
  const hasMessages = Object.values(nomadMessages).some(m => m.length > 0);
  const [soloModel, setSoloModel] = useState<string | null>(null);
  const models = NOMAD_DEFAULT_MODELS;
  const iconFilter = (id: string) => id === "gpt-4o" ? "dark:invert" : id === "grok-4" ? "brightness-0 dark:invert" : "";
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Solo mode back button */}
      {soloModel && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-card">
          <button onClick={() => setSoloModel(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Models
          </button>
          {models.filter(id => id !== soloModel && activeModels.has(id)).map(id => {
            const cfg = NOMAD_CONFIG[id]; if (!cfg) return null;
            return (
              <button key={id} onClick={() => setSoloModel(id)} title={cfg.name}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-card hover:scale-110 transition-all overflow-hidden p-1"
                style={{ borderColor: cfg.color }}>
                <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(id)}`}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Multi-column (normal mode) */}
        {!soloModel && (
          <div ref={scrollRef} className="flex-1 flex flex-nowrap overflow-x-auto" style={{ scrollbarWidth: "thin", alignItems: "stretch", overscrollBehavior: "contain" }}>
            {models.map((modelId, idx) => {
              const cfg = NOMAD_CONFIG[modelId]; if (!cfg) return null;
              const isActive = activeModels.has(modelId);
              const isLast = idx === models.length - 1;
              const msgs = nomadMessages[modelId] || [];
              return (
                <React.Fragment key={modelId}>
                  <div className="flex-shrink-0 flex flex-col" style={{ width: 220 }}>
                    {/* Toggle card */}
                    <div className="mx-2.5 mt-2.5 mb-2.5 rounded-xl border-2 transition-all duration-300 bg-card p-2.5 flex flex-col items-center gap-1"
                      style={{ borderColor: isActive ? cfg.color : "rgba(128,128,128,0.2)" }}>
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(modelId)}${modelId === "fius-ai" ? " rounded-full" : ""}`}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{cfg.name}</span>
                      <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">{cfg.description}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <button onClick={() => onToggleModel(modelId)}
                          className="relative flex-shrink-0 rounded-full transition-all duration-300"
                          style={{ width: 36, height: 18, background: isActive ? cfg.color : undefined }}
                          className2={!isActive ? "bg-gray-300 dark:bg-gray-600" : ""}
                          >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${isActive ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
                        </button>
                        <button onClick={() => setSoloModel(modelId)} title={`Chat only with ${cfg.name}`}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent transition-all"
                          style={{ color: cfg.color }}>
                          <Target className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="mx-2.5 flex-1 flex flex-col space-y-2 pb-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                      {msgs.map(msg => (
                        <div key={msg.id} className={`p-2.5 rounded-lg text-sm ${msg.role === "user" ? "bg-secondary text-secondary-foreground ml-3" : "bg-card border border-border text-foreground"}`}>
                          {msg.content}
                        </div>
                      ))}
                      {nomadTyping[modelId] && (
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                            <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(modelId)}`}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          </div>
                          <div className="bg-card rounded-xl px-3 py-2 border border-border"><TypingDots /></div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLast && <div className="flex-shrink-0 w-px self-stretch" style={{ background: "rgba(128,128,128,0.3)" }} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Solo mode */}
        {soloModel && (() => {
          const cfg = NOMAD_CONFIG[soloModel];
          const msgs = nomadMessages[soloModel] || [];
          if (!cfg) return null;
          return (
            <div className="flex-1 px-4 pb-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              <div className="space-y-4 max-w-full">
                {msgs.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "user" ? (
                      <div className="bg-card rounded-3xl px-4 py-3 max-w-xs border border-border"><p className="text-foreground text-sm">{msg.content}</p></div>
                    ) : (
                      <div className="flex space-x-3 w-full">
                        <div className="flex-shrink-0 mt-1 w-6 h-6 flex items-center justify-center">
                          <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(soloModel)}`}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        </div>
                        <div className="rounded-3xl px-4 py-3 flex-1 border bg-card border-border text-foreground text-sm">{msg.content}</div>
                      </div>
                    )}
                  </div>
                ))}
                {nomadTyping[soloModel] && (
                  <div className="flex justify-start"><div className="flex space-x-3">
                    <div className="flex-shrink-0 mt-1 w-6 h-6 flex items-center justify-center">
                      <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(soloModel)}`}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="bg-card rounded-3xl px-4 py-3 border border-border"><TypingDots /></div>
                  </div></div>
                )}
              </div>
            </div>
          );
        })()}

        {!hasMessages && !soloModel && (
          <div className="flex-shrink-0 flex flex-col items-center justify-center py-6 text-center px-4">
            <h3 className="text-lg font-semibold text-foreground mb-1">Multi-AI Paradise Awaits</h3>
            <p className="text-sm text-muted-foreground">Toggle models above, then send a message to compare all AIs at once</p>
          </div>
        )}
      </div>

      <MobileMessageBar value={input} onChange={setInput} onSend={onSend} isTyping={isTyping}
        placeholder="Ask all AIs at once…" tab="nomad" showEnhance={false} showModel={false}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
    </>
  );
}

// ─── Studio (Imagine) Tab ─────────────────────────────────────────────────────
function StudioTab({ messages, isTyping, input, setInput, onSend, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void; onSend: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
}) {
  const [imagineStyle, setImagineStyle] = useState("Photorealistic");
  const [showResults, setShowResults] = useState(false);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallery, setGallery] = useState(GALLERY_PHOTOS);
  const [shuffleKey, setShuffleKey] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const styleNames = Object.keys(IMAGINE_STYLES_LOCAL);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // Auto-switch to results when new AI message arrives
  useEffect(() => {
    if (messages.some(m => m.role === "ai")) setShowResults(true);
  }, [messages.length]);

  const handleSend = () => { onSend(); };

  const refreshGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/imagine/gallery?style=${encodeURIComponent(imagineStyle)}&seed=${shuffleKey}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setGallery(data.slice(0, 3).map((item: any) => ({ url: item.url, label: item.label, prompt: item.prompt })));
      }
    } catch { }
    setGalleryLoading(false);
    setShuffleKey(k => k + 1);
  };

  if (expandImg) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
        <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
        <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
      </div>
    );
  }

  // Results panel (shown after prompt sent)
  if (showResults) {
    return (
      <>
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card">
          <button onClick={() => setShowResults(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Gallery
          </button>
          <span className="text-sm font-semibold text-foreground">{messages.filter(m => m.role === "ai").length} image{messages.filter(m => m.role === "ai").length !== 1 ? "s" : ""}</span>
          <button onClick={() => { /* clear */ }} className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: "none" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center px-4">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">Ready to create</p>
              <p className="text-xs text-muted-foreground">Type a prompt below</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[90%]">{msg.content}</div>
              </div>
            ) : (
              <MsgBubble key={msg.id} msg={msg} onExpandImg={s => setExpandImg(s)} />
            )
          ))}
          {isTyping && (
            <div className="rounded-2xl border border-border overflow-hidden bg-background">
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className="flex gap-1.5">{[0,150,300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: "0.9s" }} />)}</div>
                <span className="text-[11px] text-muted-foreground font-medium">Creating your image…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <MobileMessageBar value={input} onChange={setInput} onSend={handleSend} isTyping={isTyping}
          placeholder="Just Prompt and image is in your hands!" tab="imagine" showEnhance showModel={false}
          fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
      </>
    );
  }

  // Discovery panel (default view)
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <p className="text-sm font-bold text-foreground">✦ Imagination Studio</p>
        <button onClick={refreshGallery} disabled={galleryLoading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${galleryLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
        {/* 3 gallery photos */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {gallery.slice(0, 3).map((item, i) => (
            <button key={i} className="group text-left focus:outline-none" onClick={() => setInput(item.prompt)}>
              <div className="w-full rounded-2xl overflow-hidden border border-border" style={{ height: 160 }}>
                <img src={item.url} alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                  onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80"; }} />
              </div>
              <p className="text-[11px] font-semibold text-foreground leading-tight truncate mt-1.5 px-0.5">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="w-full flex justify-center py-4">
          <Logo size="xl" className="opacity-60 hover:opacity-90 transition-opacity" />
        </div>

        {/* Style circles */}
        <div className="flex-shrink-0 border-t border-border pt-3 pb-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Styles</p>
          <div className="flex gap-4 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: "none" }}>
            {styleNames.map(styleName => (
              <button key={styleName} onClick={() => setImagineStyle(styleName)} title={styleName}
                className="flex-shrink-0 flex flex-col items-center gap-2 group">
                <div className={`w-[80px] h-[80px] rounded-full overflow-hidden border-[3px] transition-all duration-200 group-hover:scale-110 ${imagineStyle === styleName ? "border-primary shadow-md ring-2 ring-primary/30 ring-offset-2" : "border-border"}`}>
                  <img src={IMAGINE_STYLES_LOCAL[styleName] || ""} alt={styleName}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=100&q=60"; }} />
                </div>
                <span className={`text-[10.5px] font-medium text-center leading-tight ${imagineStyle === styleName ? "text-primary" : "text-muted-foreground"}`}>{styleName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <MobileMessageBar value={input} onChange={setInput} onSend={handleSend} isTyping={isTyping}
        placeholder="Just Prompt and image is in your hands!" tab="imagine" showEnhance showModel={false}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
    </>
  );
}

// ─── Philosopher (Minds) Tab ───────────────────────────────────────────────────
function PhilosopherTab({ messages, isTyping, input, setInput, onSend, onStop, personality, setPersonality, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; personality: Personality | null; setPersonality: (p: Personality | null) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const filtered = useMemo(() => PHILOSOPHERS.filter(p => {
    const matchCat = filter === "All" || p.category === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [filter, search]);

  if (!personality) {
    return (
      <>
        {showFilter && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowFilter(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
            <div className="relative bg-background rounded-t-[24px] shadow-2xl animate-in slide-in-from-bottom duration-350"
              style={{ animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)", paddingBottom: "max(env(safe-area-inset-bottom),20px)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-3"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
              <p className="text-[16px] font-bold text-foreground px-5 mb-2">Filter by Category</p>
              {PHIL_CATEGORIES.map((cat, i) => (
                <button key={cat} onClick={() => { setFilter(cat); setShowFilter(false); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors ${cat === filter ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-400" />
                  <span className="text-[14px] font-semibold text-foreground flex-1">{cat}</span>
                  {cat === filter && <Check className="w-4 h-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-foreground">Philosophers & Minds</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Choose a historical figure to converse with</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search personalities…"
              className="flex-1 bg-card border border-border rounded-2xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={() => setShowFilter(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-accent/70 border border-border/50 text-xs font-semibold text-foreground transition-all active:scale-95 hover:bg-accent flex-shrink-0">
              <Filter className="w-3.5 h-3.5" />
              {filter !== "All" ? filter : "Filter"}
            </button>
          </div>
        </div>

        {/* Row list */}
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {filtered.map((p, i) => (
            <button key={p.id} onClick={() => { setPersonality(p); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all active:scale-[0.98] hover:bg-accent/50 ${i > 0 ? "border-t border-border/40" : ""}`}>
              <WikiFace name={p.name} wikiTitle={p.wikiTitle} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-foreground">{p.name}</p>
                <p className="text-[11.5px] text-muted-foreground">{p.role} · {p.era}</p>
                <p className="text-[10.5px] text-muted-foreground/70 truncate mt-0.5">{p.style}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No personalities found.</div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => setPersonality(null)} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <WikiFace name={personality.name} wikiTitle={personality.wikiTitle} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-foreground">{personality.name}</p>
          <p className="text-[11px] text-muted-foreground">{personality.era} · {personality.role}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
            <WikiFace name={personality.name} wikiTitle={personality.wikiTitle} size={80} />
            <div>
              <p className="text-lg font-bold text-foreground">{personality.name} awaits you</p>
              <p className="text-sm text-muted-foreground mt-1">{personality.era} · {personality.role}</p>
              <p className="text-sm text-muted-foreground mt-4 max-w-[240px] mx-auto italic">Say hello or ask anything</p>
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 mb-3.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "ai" && <div className="self-end mb-5 flex-shrink-0"><WikiFace name={personality.name} wikiTitle={personality.wikiTitle} size={26} /></div>}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 mb-3.5 animate-in fade-in">
            <div className="self-end mb-5 flex-shrink-0"><WikiFace name={personality.name} wikiTitle={personality.wikiTitle} size={26} /></div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping}
        placeholder={`Talk with ${personality.name}...`} tab="philosopher" showEnhance={false} showModel={false} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MobileChatInterface({ onShowAuth }: { onShowAuth: () => void }) {
  useToast();
  const { data: user } = useQuery<{ username: string; email: string; id: string; displayName?: string }>({ queryKey: ["/api/auth/user"], retry: false });
  const { data: convList = [] } = useQuery<Conv[]>({ queryKey: ["/api/conversations"], enabled: !!user });

  const [tab, setTab] = useState<MobileTab>("ask");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [fiusIntegrationMode, setFiusIntegrationMode] = useState(false);
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(() => localStorage.getItem("profilePicture") || undefined);

  // Ask
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askModel, setAskModel] = useState("fius-lite");
  const [currentConvId, setCurrentConvId] = useState<string | undefined>();
  const askAbortRef = useRef<AbortController | null>(null);

  // Studio
  const [imagMsgs, setImagMsgs] = useState<Msg[]>([]);
  const [imagInput, setImagInput] = useState("");
  const [imagTyping, setImagTyping] = useState(false);

  // Philosopher
  const [philMsgs, setPhilMsgs] = useState<Msg[]>([]);
  const [philInput, setPhilInput] = useState("");
  const [philTyping, setPhilTyping] = useState(false);
  const [philPerson, setPhilPerson] = useState<Personality | null>(null);
  const philAbortRef = useRef<AbortController | null>(null);

  // Nomad
  const [nomadInput, setNomadInput] = useState("");
  const [nomadTyping, setNomadTyping] = useState(false);
  const [nomadMessages, setNomadMessages] = useState<Record<string, { id: string; role: "user" | "ai"; content: string }[]>>({});
  const [nomadIsTyping, setNomadIsTyping] = useState<Record<string, boolean>>({});
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set(["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "fius-ai"]));

  useEffect(() => {
    const handler = () => setChatBg(localStorage.getItem("chatBg") || "plain");
    window.addEventListener("chatBgChanged", handler);
    return () => window.removeEventListener("chatBgChanged", handler);
  }, []);

  const projects = convList.map(c => ({ id: c.id, title: c.title || "New Chat", createdAt: new Date(c.createdAt), aiRole: c.aiRole, isProject: c.isProject }));

  const loadConv = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setAskMsgs(data.map((m: any) => ({ id: m.id || uid(), role: m.role === "assistant" ? "ai" : m.role, content: m.content, timestamp: new Date(m.createdAt || Date.now()) })));
    } catch { }
  }, []);

  const handleSelectConv = useCallback((id: string) => { setCurrentConvId(id); setAskMsgs([]); setTab("ask"); loadConv(id); }, [loadConv]);
  const handleNewChat = useCallback(() => { setCurrentConvId(undefined); setAskMsgs([]); setAskInput(""); setTab("ask"); }, []);
  const handleDeleteConv = useCallback(async (id: string) => {
    try { await fetch(`/api/conversations/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); if (id === currentConvId) handleNewChat(); } catch { }
  }, [currentConvId, handleNewChat]);

  const handleLogout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; } catch { onShowAuth(); }
  }, [onShowAuth]);

  const ensureConv = useCallback(async (): Promise<string> => {
    if (currentConvId) return currentConvId;
    const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "New Chat", model: askModel }) });
    if (!res.ok) throw new Error("Could not create conversation");
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) { setCurrentConvId(newId); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); return newId; }
    throw new Error("No ID");
  }, [currentConvId, askModel]);

  const handleAskSend = useCallback(async () => {
    const text = askInput.trim(); if (!text || askTyping) return;
    setAskInput(""); setAskTyping(true);
    setAskMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      const convId = await ensureConv();
      askAbortRef.current?.abort();
      const ctrl = new AbortController(); askAbortRef.current = ctrl;
      const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }), signal: ctrl.signal });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "I couldn't generate a response.", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
    } finally { setAskTyping(false); }
  }, [askInput, askTyping, ensureConv]);

  const handleImagSend = useCallback(async () => {
    const text = imagInput.trim(); if (!text || imagTyping) return;
    setImagInput(""); setImagTyping(true);
    const userMsgId = uid();
    const aiMsgId = uid();
    setImagMsgs(p => [...p, { id: userMsgId, role: "user", content: text, timestamp: new Date() }, { id: aiMsgId, role: "ai", content: "", imageUrl: "", isGenerating: true, timestamp: new Date() }]);
    try {
      const res = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text, size: "1024x1024" }) });
      const data = await res.json();
      setImagMsgs(p => p.map(m => m.id === aiMsgId ? { ...m, imageUrl: data.success && data.url ? data.url : undefined, content: data.success && data.url ? "" : "Image generation failed.", isGenerating: false } : m));
    } catch {
      setImagMsgs(p => p.map(m => m.id === aiMsgId ? { ...m, content: "Image generation failed.", imageUrl: undefined, isGenerating: false } : m));
    } finally { setImagTyping(false); }
  }, [imagInput, imagTyping]);

  const handlePhilSend = useCallback(async () => {
    const text = philInput.trim(); if (!text || philTyping || !philPerson) return;
    setPhilInput(""); setPhilTyping(true);
    setPhilMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      philAbortRef.current?.abort();
      const ctrl = new AbortController(); philAbortRef.current = ctrl;
      const systemMsg = `You are ${philPerson.name} (${philPerson.era}), the ${philPerson.role}. Style: ${philPerson.style}. Stay in character at all times. User: ${text}`;
      const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: systemMsg, activeTab: "philosopher" }), signal: ctrl.signal });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "…", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong.", timestamp: new Date() }]);
    } finally { setPhilTyping(false); }
  }, [philInput, philTyping, philPerson]);

  const handleNomadSend = useCallback(async () => {
    const text = nomadInput.trim(); if (!text || nomadTyping) return;
    setNomadInput(""); setNomadTyping(true);
    const activeIds = Array.from(activeModels).filter(id => NOMAD_DEFAULT_MODELS.includes(id));
    // Add user message to each active model
    setNomadMessages(prev => {
      const updated = { ...prev };
      activeIds.forEach(id => { updated[id] = [...(updated[id] || []), { id: uid(), role: "user" as const, content: text }]; });
      return updated;
    });
    // Start typing for all
    setNomadIsTyping(prev => { const u = { ...prev }; activeIds.forEach(id => { u[id] = true; }); return u; });
    await Promise.allSettled(activeIds.map(async (modelId) => {
      try {
        const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, activeTab: "nomad" }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setNomadMessages(prev => ({ ...prev, [modelId]: [...(prev[modelId] || []), { id: uid(), role: "ai" as const, content: data.response || data.message || "No response" }] }));
      } catch {
        setNomadMessages(prev => ({ ...prev, [modelId]: [...(prev[modelId] || []), { id: uid(), role: "ai" as const, content: "Failed to get response." }] }));
      } finally {
        setNomadIsTyping(prev => ({ ...prev, [modelId]: false }));
      }
    }));
    setNomadTyping(false);
  }, [nomadInput, nomadTyping, activeModels]);

  const handleToggleModel = useCallback((id: string) => {
    setActiveModels(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); setNomadMessages(prev2 => { const u = { ...prev2 }; delete u[id]; return u; }); }
      else n.add(id);
      return n;
    });
  }, []);

  const getChatBgStyle = (): React.CSSProperties => {
    switch (chatBg) {
      case "gradient": return { background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" };
      case "stars": return { background: "radial-gradient(ellipse at center, #1a1a3e 0%, #0d0d1a 60%, #000 100%)" };
      case "rainbow": return { background: "linear-gradient(135deg,#ff6b6b22,#feca5722,#48dbfb22,#ff9ff322,#54a0ff22)" };
      default: return {};
    }
  };

  const voiceHandlers = { onVoiceMode: () => setVoiceModalOpen(true), onSettings: () => setSettingsOpen(true), onIntegration: () => setFiusIntegrationMode(v => !v), fiusIntegrationMode };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <div className="fixed inset-0 bg-background flex flex-col overflow-hidden"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

          <Sidebar
            isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout}
            projects={projects} currentProjectId={currentConvId}
            onProjectSelect={id => { handleSelectConv(id); setSidebarOpen(false); }}
            onNewProject={() => { handleNewChat(); setSidebarOpen(false); }}
            onDeleteProject={handleDeleteConv}
            onEditProject={async (id, title) => { try { await apiRequest("PATCH", `/api/conversations/${id}`, { title }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { } }}
            onUpdateAiRole={async (id, aiRole) => { try { await apiRequest("PATCH", `/api/conversations/${id}`, { aiRole }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { } }}
            onOpenSettings={() => setSettingsOpen(true)}
            onVoiceClick={() => { setSidebarOpen(false); setVoiceModalOpen(true); }}
            onImagineClick={() => { setSidebarOpen(false); setTab("imagine"); }}
            user={user ? { email: user.email, username: user.username } : undefined}
            onUserRename={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })}
            profilePicture={profilePicture}
            onProfilePictureChange={d => { setProfilePicture(d); localStorage.setItem("profilePicture", d); }}
          />

          <VoiceModeModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

          {educationOpen && (
            <EducationModal isOpen={educationOpen} onClose={() => setEducationOpen(false)}
              onStartExamination={() => setEducationOpen(false)}
              onStartSelfListen={() => setEducationOpen(false)} />
          )}

          <MobileSettings
            isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
            user={user ? { email: user.email, username: user.username, displayName: user.displayName } : undefined}
            profilePicture={profilePicture}
            onUserRename={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })}
            onProfilePictureChange={d => { setProfilePicture(d); localStorage.setItem("profilePicture", d); }}
            model={askModel} onModelChange={setAskModel}
            onChatBgChange={bg => setChatBg(bg)}
          />

          <PCHeader activeTab={tab} onTabChange={setTab} onMenuClick={() => setSidebarOpen(true)} />

          <div className="flex-1 flex flex-col overflow-hidden relative" style={getChatBgStyle()}>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "ask" ? "flex" : "none" }}>
              <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
                onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
                model={askModel} setModel={setAskModel} user={user}
                onEducation={() => setEducationOpen(true)} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "nomad" ? "flex" : "none" }}>
              <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
                isTyping={nomadTyping} nomadMessages={nomadMessages} nomadTyping={nomadIsTyping}
                activeModels={activeModels} onToggleModel={handleToggleModel} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "imagine" ? "flex" : "none" }}>
              <StudioTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput}
                onSend={handleImagSend} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "philosopher" ? "flex" : "none" }}>
              <PhilosopherTab messages={philMsgs} isTyping={philTyping} input={philInput} setInput={setPhilInput}
                onSend={handlePhilSend} onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
                personality={philPerson} setPersonality={p => { setPhilPerson(p); setPhilMsgs([]); }} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 overflow-hidden" style={{ display: tab === "games" ? "block" : "none" }}>
              <FiusGames playerName={user?.displayName || user?.username || "Player"} userId={user?.id} />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
