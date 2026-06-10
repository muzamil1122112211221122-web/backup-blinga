import React, { useState, useRef, useEffect, useCallback, Component } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
import { useTheme } from "./theme-provider";
import {
  X, ArrowUp, Menu, Check, ChevronRight,
  Download, ChevronLeft, Mic, FileText, Image,
  Sun, Moon, Monitor, Globe, AudioLines,
  RefreshCcw, Zap, Palette, ChevronDown,
  Trash2, Camera, SlidersHorizontal, Sparkles,
  Brain, Search, PenTool, Filter, ChevronUp,
  Database, Sliders, User, Pencil, Laptop,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch() {}
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <RefreshCcw className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-1">Tap below to reload the app</p>
          </div>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-semibold active:scale-95 transition-all">
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "ask" | "imagine" | "philosopher" | "nomad" | "games";

interface Msg {
  id: string; role: "user" | "ai"; content: string;
  imageUrl?: string; timestamp: Date;
}
interface Conv {
  id: string; title: string; createdAt: string | Date; updatedAt?: string | Date;
  aiRole?: string; isProject?: boolean;
}
interface Personality {
  id: string; name: string; era: string; role: string;
  category: string; style: string; emoji: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GRAY_DOT = "#9ca3af";

const ASK_MODELS = [
  { id: "fius-lite",  name: "Fius Lite",  short: "Lite",  dot: GRAY_DOT },
  { id: "fius-pro",   name: "Fius Pro",   short: "Pro",   dot: GRAY_DOT },
];

const STUDIO_MODELS = [
  { id: "fius-studio-lite", name: "Fius Studio Lite", short: "Lite", dot: GRAY_DOT },
  { id: "fius-studio-pro",  name: "Fius Studio Pro",  short: "Pro",  dot: GRAY_DOT },
];

const PRESETS = [
  { id: "custom",   label: "Custom",   desc: "Default style" },
  { id: "concise",  label: "Concise",  desc: "Brief & direct" },
  { id: "formal",   label: "Formal",   desc: "Professional tone" },
  { id: "socratic", label: "Socratic", desc: "Asks questions back" },
];

const IMAGINE_STYLES = [
  { id: "photo",    label: "Photo",    emoji: "📷", suffix: ", photorealistic, ultra detailed, 8k" },
  { id: "anime",    label: "Anime",    emoji: "✨", suffix: ", anime art style, vibrant, detailed" },
  { id: "digital",  label: "Digital",  emoji: "🎨", suffix: ", digital art, concept art, vivid" },
  { id: "painting", label: "Painting", emoji: "🖌️", suffix: ", oil painting, impressionist, museum quality" },
  { id: "sketch",   label: "Sketch",   emoji: "✏️", suffix: ", pencil sketch, fine line art" },
  { id: "3d",       label: "3D",       emoji: "🔮", suffix: ", 3d render, cinematic lighting, octane" },
];

const PHILOSOPHERS: Personality[] = [
  { id: "socrates",  emoji: "🏛️", name: "Socrates",        era: "470–399 BC",  role: "Philosopher",   category: "Philosophy", style: "Socratic questioning, irony, dialogue" },
  { id: "nietzsche", emoji: "⚡", name: "Nietzsche",        era: "1844–1900",   role: "Philosopher",   category: "Philosophy", style: "Will to power, poetic, provocative" },
  { id: "einstein",  emoji: "🔭", name: "Einstein",         era: "1879–1955",   role: "Physicist",     category: "Science",    style: "Thought experiments, humble, curious" },
  { id: "lao-tzu",   emoji: "☯️", name: "Lao Tzu",         era: "6th c. BC",   role: "Philosopher",   category: "Philosophy", style: "Tao, wu wei, poetic simplicity" },
  { id: "aristotle", emoji: "📚", name: "Aristotle",        era: "384–322 BC",  role: "Philosopher",   category: "Philosophy", style: "Logic, ethics, virtue" },
  { id: "marcus",    emoji: "🛡️", name: "Marcus Aurelius", era: "121–180 AD",  role: "Stoic Emperor", category: "Philosophy", style: "Stoic, introspective, duty" },
  { id: "gandhi",    emoji: "✌️", name: "Gandhi",           era: "1869–1948",   role: "Leader",        category: "Leaders",    style: "Nonviolence, truth, spiritual" },
  { id: "tesla",     emoji: "⚡", name: "Nikola Tesla",     era: "1856–1943",   role: "Inventor",      category: "Science",    style: "Visionary, eccentric, technical" },
  { id: "plato",     emoji: "🌌", name: "Plato",            era: "428–348 BC",  role: "Philosopher",   category: "Philosophy", style: "Allegory, idealism, dialogues" },
  { id: "confucius", emoji: "🌸", name: "Confucius",        era: "551–479 BC",  role: "Philosopher",   category: "Philosophy", style: "Virtue, ritual, filial piety" },
  { id: "darwin",    emoji: "🦋", name: "Charles Darwin",   era: "1809–1882",   role: "Naturalist",    category: "Science",    style: "Observational, methodical" },
  { id: "voltaire",  emoji: "🖊️", name: "Voltaire",         era: "1694–1778",   role: "Philosopher",   category: "Philosophy", style: "Satirical, rationalist, wit" },
  { id: "descartes", emoji: "🤔", name: "Descartes",        era: "1596–1650",   role: "Philosopher",   category: "Philosophy", style: "Systematic doubt, cogito ergo sum" },
  { id: "darwin2",   emoji: "🌿", name: "Charles Lyell",   era: "1797–1875",   role: "Geologist",     category: "Science",    style: "Uniformitarianism, careful observation" },
  { id: "curie",     emoji: "⚗️", name: "Marie Curie",     era: "1867–1934",   role: "Physicist",     category: "Science",    style: "Determined, precise, pioneering" },
  { id: "napoleon",  emoji: "⚔️", name: "Napoleon",        era: "1769–1821",   role: "Emperor",       category: "Leaders",    style: "Strategic, ambitious, commanding" },
];

const TABS: { id: MobileTab; label: string }[] = [
  { id: "ask",         label: "Ask"    },
  { id: "nomad",       label: "Nomad"  },
  { id: "imagine",     label: "Studio" },
  { id: "philosopher", label: "Minds"  },
  { id: "games",       label: "Games"  },
];

const NOMAD_MODELS = [
  { key: "gpt",    label: "GPT-4o",   color: "#10b981", bg: "#10b98115" },
  { key: "claude", label: "Claude",   color: "#f97316", bg: "#f9731615" },
  { key: "gemini", label: "Gemini",   color: "#3b82f6", bg: "#3b82f615" },
  { key: "fius",   label: "Fius",     color: "#8b5cf6", bg: "#8b5cf615" },
];

const SUGGESTION_CARDS = [
  { icon: <Search className="w-4 h-4 text-orange-400" />, title: "Research & analysis", desc: "Deep dive into any topic",   prompt: "Analyze the benefits of renewable energy sources" },
  { icon: <PenTool className="w-4 h-4 text-blue-400" />,  title: "Creative writing",    desc: "Stories, essays, content",  prompt: "Write a short story about time travel" },
  { icon: <Brain className="w-4 h-4 text-purple-400" />,  title: "Brainstorm ideas",    desc: "Generate fresh concepts",   prompt: "Give me 10 creative business ideas for 2025" },
];

const PHIL_CATEGORIES = ["All", "Philosophy", "Science", "Leaders"];

function uid() { return Math.random().toString(36).slice(2); }

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
        <span key={i} className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.14}s`, animationDuration: "0.85s" }} />
      ))}
    </div>
  );
}

function MobileImageCard({ src, onExpand }: { src: string; onExpand: (s: string) => void }) {
  const isData = src.startsWith("data:");
  const [loaded, setLoaded] = useState(isData);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [cur, setCur] = useState(src);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loaded || isData) return;
    timer.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [loaded, attempt, isData]);

  const retry = useCallback(() => {
    try {
      const u = new URL(src);
      u.searchParams.set("seed", String(Math.floor(Math.random() * 9e6) + 1));
      setElapsed(0); setAttempt(a => a + 1); setCur(u.toString());
    } catch { setElapsed(0); setAttempt(a => a + 1); }
  }, [src]);

  const dl = async () => {
    try {
      const a = document.createElement("a");
      if (cur.startsWith("data:")) { a.href = cur; a.download = "fius-image.jpg"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
      else {
        const blob = await (await fetch(cur)).blob();
        const url = URL.createObjectURL(blob);
        a.href = url; a.download = "fius-image.jpg"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { window.open(cur, "_blank"); }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card relative w-full">
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="w-8 h-8 rounded-full border-[3px] border-zinc-300 dark:border-zinc-600 border-t-purple-400 animate-spin" />
          <p className="text-xs text-muted-foreground text-center px-6">
            {elapsed < 12 ? "Generating image…" : elapsed < 28 ? `Still working… (${elapsed}s)` : "Almost there…"}
          </p>
          {elapsed >= 20 && (
            <button onClick={retry} className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all">
              ↺ Try new seed
            </button>
          )}
        </div>
      )}
      <img key={`${attempt}-${cur.slice(0, 40)}`} src={cur} alt="Generated"
        className={`w-full h-auto cursor-zoom-in ${loaded ? "block" : "hidden"}`}
        onClick={() => onExpand(cur)}
        onLoad={() => { setLoaded(true); if (timer.current) clearInterval(timer.current); }}
        onError={() => { if (!isData) setTimeout(retry, 2500); }}
      />
      {loaded && (
        <button onClick={dl}
          className="absolute bottom-2.5 right-2.5 bg-black/55 hover:bg-black/75 text-white text-[11px] px-3 py-1 rounded-lg font-medium backdrop-blur-sm flex items-center gap-1.5">
          <Download className="w-3 h-3" /> Save
        </button>
      )}
    </div>
  );
}

function MsgBubble({ msg, onExpandImg }: { msg: Msg; onExpandImg: (s: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 mb-3.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}>
      {!isUser && <div className="self-end mb-5 flex-shrink-0"><FiusAvatar size={26} /></div>}
      <div className={`flex flex-col max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.imageUrl ? (
          <MobileImageCard src={msg.imageUrl} onExpand={onExpandImg} />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "rounded-tr-sm bg-zinc-900 dark:bg-zinc-700 text-white"
              : "rounded-tl-sm bg-card border border-border text-foreground"
          }`}>
            {msg.content}
          </div>
        )}
        <span className="text-[10px] text-muted-foreground mt-1 px-1">{format(msg.timestamp, "h:mm a")}</span>
      </div>
    </div>
  );
}

// ─── Model Picker Sheet ───────────────────────────────────────────────────────
function ModelSheet({ models, current, onSelect, onClose }: {
  models: { id: string; name: string; dot: string }[];
  current: string; onSelect: (id: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative bg-background rounded-t-[28px] pb-8 shadow-2xl animate-in slide-in-from-bottom duration-350"
        style={{ animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-3"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
        <p className="text-[16px] font-bold text-foreground px-5 mb-3">Select Model</p>
        {models.map((opt, i) => (
          <button key={opt.id} onClick={() => { onSelect(opt.id); onClose(); }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors ${opt.id === current ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-zinc-400" />
            <span className="text-[14px] font-semibold text-foreground flex-1">{opt.name}</span>
            {opt.id === current && <Check className="w-4 h-4 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Function Bar (above message bar) ────────────────────────────────────────
function FunctionBar({ onIntegration, onVoiceMode, onSettings, fiusIntegrationMode, hidden }: {
  onIntegration?: () => void; onVoiceMode?: () => void; onSettings?: () => void;
  fiusIntegrationMode?: boolean; hidden?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (hidden) return null;

  const btns = [
    {
      icon: (
        <img src="/integration-icon.png" alt="Integration"
          style={{ width: 22, height: 22 }}
          className={fiusIntegrationMode ? "" : "brightness-0 invert opacity-90"} />
      ),
      label: "Integration\nAnswer",
      onClick: onIntegration,
      active: fiusIntegrationMode,
    },
    {
      icon: <AudioLines className="w-5 h-5 text-white" />,
      label: "Voice Mode",
      onClick: onVoiceMode,
      active: false,
    },
    {
      icon: (
        <img src="/settings-icon.png" alt="Settings"
          style={{ width: 20, height: 20 }}
          className="brightness-0 invert opacity-90" />
      ),
      label: "Settings",
      onClick: onSettings,
      active: false,
    },
  ];

  return (
    <div className="flex-shrink-0 flex justify-around items-end px-8 py-2.5">
      {btns.map((btn, i) => (
        <button key={i} onClick={btn.onClick}
          className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-200">
          <div
            className="w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: btn.active ? "#2563eb" : (isDark ? "rgba(55,55,55,0.95)" : "rgba(36,36,36,0.92)"),
              boxShadow: "0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
            {btn.icon}
          </div>
          <span className="text-[10.5px] font-medium text-muted-foreground text-center leading-tight whitespace-pre-line">
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Compact Input Bar ────────────────────────────────────────────────────────
function PCInputBar({
  value, onChange, onSend, placeholder, isTyping, onStop,
  showEnhance = true,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  placeholder: string; isTyping: boolean; onStop: () => void;
  showEnhance?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + "px";
  }, [value]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); return; }
    const rec = new SR();
    recognitionRef.current = rec;
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
    } catch { /* silent */ } finally { setIsEnhancing(false); }
  };

  const btnCls = "w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0";
  const defaultBtnCls = `${btnCls} bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10`;

  return (
    <div className="flex-shrink-0 px-3 pb-3 pt-0 relative">
      {isListening && (
        <div className="absolute -top-7 inset-x-0 flex justify-center z-10">
          <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Listening…</span>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#303030] rounded-3xl glossy-outline overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKey}
            placeholder={placeholder} rows={1}
            className="w-full bg-transparent text-[14.5px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 120, scrollbarWidth: "none", minHeight: 26 }}
          />
        </div>
        <div className="flex items-center px-2 pb-2.5 gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={defaultBtnCls}>
                <img src={isDark ? attachmentDark : attachmentLight} alt="Attach" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-white dark:bg-[#303030] border-none rounded-2xl shadow-2xl p-1 min-w-[160px] z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-xl hover:bg-black/8 dark:hover:bg-white/8 text-foreground">
                <FileText className="w-4 h-4 text-zinc-400" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-xl hover:bg-black/8 dark:hover:bg-white/8 text-foreground">
                <Image className="w-4 h-4 text-zinc-400" /> Upload Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1" />
          <button onClick={toggleMic}
            className={`${btnCls} ${isListening ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"}`}>
            {isListening
              ? <Mic className="w-4 h-4" />
              : <img src={isDark ? micDark : micLight} alt="Mic" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />}
          </button>
          {showEnhance && (
            <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing}
              className={`${defaultBtnCls} disabled:opacity-30`}>
              {isEnhancing
                ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <img src={isDark ? enhancePromptDark : enhancePromptLight} alt="Enhance" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />}
            </button>
          )}
          {isTyping ? (
            <button onClick={onStop}
              className={`${btnCls} bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200`}>
              <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-900" />
            </button>
          ) : (
            <button onClick={onSend} disabled={!value.trim()}
              className={`${btnCls} bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-30`}>
              <ArrowUp className="w-4 h-4 text-white dark:text-black" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Settings Sheet (PC-style ported to mobile) ───────────────────────
type SettingsSection = "account" | "appearance" | "behavior" | "general" | "nomad";

function MobileSettings({
  isOpen, onClose, user, profilePicture, onProfilePictureChange, onUserRename,
  model, onModelChange, onChatBgChange,
}: {
  isOpen: boolean; onClose: () => void;
  user?: { username: string; email: string; displayName?: string };
  profilePicture?: string;
  onProfilePictureChange?: (dataUrl: string) => void;
  onUserRename?: (name: string) => void;
  model?: string; onModelChange?: (m: string) => void;
  onChatBgChange?: (bg: string) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [closing, setClosing] = useState(false);

  // Account
  const [editName, setEditName] = useState(user?.displayName || user?.username || "");
  const [previewPic, setPreviewPic] = useState("");
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  // General
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem("aiPreset") || "custom");
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem("customInstructions") || "");

  // Appearance
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [localToggles, setLocalToggles] = useState({
    wrapLines: true, showPreviews: true, showFiusLogo: true,
    nomadGrid: true, nomadNotification: true, autoScroll: true, richText: true,
    improveModel: true, personalize: true,
  });
  const [localAiOrder, setLocalAiOrder] = useState([
    "gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai",
  ]);

  useEffect(() => {
    if (isOpen) {
      setEditName(user?.displayName || user?.username || "");
      setPreviewPic("");
      setShowCustomizePanel(false);
      setClosing(false);
    }
  }, [isOpen, user]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 320);
  };

  const handleSave = () => {
    localStorage.setItem("aiPreset", selectedPreset);
    localStorage.setItem("customInstructions", customInstructions);
    localStorage.setItem("chatBg", chatBg);
    onChatBgChange?.(chatBg);
    window.dispatchEvent(new Event("chatBgChanged"));
    handleClose();
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      await apiRequest("PATCH", "/api/auth/user", { username: editName.trim() });
      onUserRename?.(editName.trim());
      if (previewPic) onProfilePictureChange?.(previewPic);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowCustomizePanel(false);
    } catch { /* silent */ }
  };

  const moveOrder = (index: number, dir: "up" | "down") => {
    const n = [...localAiOrder];
    if (dir === "up" && index > 0) { [n[index], n[index - 1]] = [n[index - 1], n[index]]; }
    else if (dir === "down" && index < n.length - 1) { [n[index], n[index + 1]] = [n[index + 1], n[index]]; }
    setLocalAiOrder(n);
  };

  const MODEL_NAMES: Record<string, string> = {
    "gpt-4o": "ChatGPT 5", "claude-3.5-sonnet": "Claude Sonnet 4", "gemini-pro": "Gemini 2.5 Pro",
    "perplexity": "Perplexity Sonar Pro", "grok-4": "Grok 4", "deepseek-r1": "Deepseek v3", "fius-ai": "Fius Pro",
  };

  const initials = (user?.displayName || user?.username || "?").charAt(0).toUpperCase();

  const menuItems: { id: SettingsSection; label: string; icon: React.ComponentType<any> }[] = [
    { id: "account",    label: "Account",        icon: User },
    { id: "general",    label: "General",         icon: Sliders },
    { id: "appearance", label: "Appearance",      icon: Palette },
    { id: "behavior",   label: "Behavior",        icon: Zap },
    { id: "nomad",      label: "Nomad Settings",  icon: Database },
  ];

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ WebkitTapHighlightColor: "transparent" }} onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${closing ? "animate-out fade-out duration-300" : "animate-in fade-in duration-250"}`} />
      <div
        className={`relative bg-background rounded-t-[24px] flex flex-col overflow-hidden ${closing ? "animate-out slide-out-to-bottom duration-320" : "animate-in slide-in-from-bottom duration-380"}`}
        style={{ height: "92vh", boxShadow: "0 -10px 60px rgba(0,0,0,0.4)", animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0">
          <h2 className="text-[17px] font-bold text-foreground">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleSave}
              className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold transition-all active:scale-95">
              Save
            </button>
            <button onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-accent/80 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left nav */}
          <div className="w-[140px] flex-shrink-0 bg-zinc-50 dark:bg-[#161616] border-r border-border/50 overflow-y-auto py-3 flex flex-col gap-1 px-2">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-[12px] font-medium ${
                  activeSection === item.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60"
                }`}>
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </button>
            ))}
            <div className="mt-auto pt-3 border-t border-border/50 px-1">
              <button className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-[11px] font-medium transition-colors"
                onClick={() => { localStorage.removeItem("customInstructions"); setCustomInstructions(""); }}>
                <Trash2 className="w-3 h-3" /> Clear Data
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-[#1a1a1a] rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {(previewPic || profilePicture) ? (
                          <img src={previewPic || profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            {initials}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{user?.displayName || user?.username || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowCustomizePanel(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-accent/60 transition-all">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  {showCustomizePanel && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                        <Input value={editName} onChange={e => setEditName(e.target.value)}
                          placeholder="Your name"
                          className="mt-1.5 h-9 rounded-xl bg-background border-border/60 text-sm text-foreground" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Profile Photo</label>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border/60 flex-shrink-0">
                            {(previewPic || profilePicture) ? (
                              <img src={previewPic || profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>{initials}</div>
                            )}
                          </div>
                          <button onClick={() => picInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card text-xs font-medium text-foreground hover:bg-accent/60 transition-all">
                            <Camera className="w-3 h-3" /> Upload
                          </button>
                          <input ref={picInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]; if (!f) return;
                              const r = new FileReader();
                              r.onload = ev => setPreviewPic(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowCustomizePanel(false); setPreviewPic(""); }}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                        <button onClick={handleSaveName}
                          className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold active:scale-95 transition-all">
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GENERAL */}
            {activeSection === "general" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">AI Preset</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map(p => (
                      <button key={p.id} onClick={() => setSelectedPreset(p.id)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all active:scale-[0.97] ${
                          selectedPreset === p.id
                            ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800 text-foreground"
                            : "border-border/50 bg-card hover:bg-accent/50 text-muted-foreground"
                        }`}>
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
                  <p className="text-xs text-muted-foreground mb-2">Tell Fius how you want it to respond</p>
                  <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Always respond in a friendly, concise manner..."
                    className="w-full h-24 bg-zinc-50 dark:bg-[#1a1a1a] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "light" as const, icon: Sun, label: "Light" },
                      { v: "dark"  as const, icon: Moon, label: "Dark" },
                      { v: "system" as const, icon: Laptop, label: "System" },
                    ].map(opt => (
                      <button key={opt.v} onClick={() => setTheme(opt.v)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all active:scale-95 ${
                          theme === opt.v
                            ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                            : "border-border/50 bg-card hover:bg-accent/50"
                        }`}>
                        <opt.icon className={`w-4 h-4 ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`} />
                        <span className={`text-[11px] font-semibold ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Chat Background</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "plain",          label: "Plain" },
                      { v: "gradient",       label: "Blue Sides" },
                      { v: "rainbow",        label: "Rainbow Sides" },
                      { v: "stars",          label: "Stars" },
                      { v: "stars-gradient", label: "Stars + Blue" },
                      { v: "stars-rainbow",  label: "Stars + Rainbow" },
                    ].map(opt => (
                      <button key={opt.v} onClick={() => { setChatBg(opt.v); localStorage.setItem("chatBg", opt.v); onChatBgChange?.(opt.v); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                          chatBg === opt.v
                            ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                            : "border-border/50 bg-card hover:bg-accent/50"
                        }`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 ${chatBg === opt.v ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                        <span className={`text-[12px] font-semibold ${chatBg === opt.v ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/50 pt-4">
                  {[
                    { key: "wrapLines",      label: "Wrap Long Lines in Code Blocks" },
                    { key: "showPreviews",   label: "Show Conversation Previews" },
                    { key: "showFiusLogo",   label: "Show Fius Logo in Responses" },
                    { key: "nomadGrid",      label: "Nomad Grid Background" },
                    { key: "nomadNotification", label: "Nomad Notifications" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-[12.5px] text-foreground">{item.label}</span>
                      <Switch
                        checked={localToggles[item.key as keyof typeof localToggles] as boolean}
                        onCheckedChange={() => setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BEHAVIOR */}
            {activeSection === "behavior" && (
              <div className="space-y-4">
                {[
                  { key: "autoScroll",   label: "Enable Auto Scroll",    desc: "" },
                  { key: "richText",     label: "Rich Text Editor",      desc: "Code blocks and lists in query bar" },
                  { key: "improveModel", label: "Improve the Model",     desc: "Allow your data to improve AI quality" },
                  { key: "personalize",  label: "Personalize Fius",      desc: "Remember details from past chats" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[12.5px] font-medium text-foreground">{item.label}</p>
                      {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
                    </div>
                    <Switch
                      checked={localToggles[item.key as keyof typeof localToggles] as boolean}
                      onCheckedChange={() => setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))} />
                  </div>
                ))}
              </div>
            )}

            {/* NOMAD */}
            {activeSection === "nomad" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Order Switcher</p>
                  <div className="space-y-2">
                    {localAiOrder.map((name, i) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-border/50">
                        <span className="text-[12.5px] font-medium text-foreground">{MODEL_NAMES[name] || name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveOrder(i, "up")} disabled={i === 0}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveOrder(i, "down")} disabled={i === localAiOrder.length - 1}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4 p-4 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Storage Usage</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-zinc-500 dark:bg-zinc-400 h-full w-[2%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">13.59 MB used of 1.07 GB</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PC-style Floating Pill Header ────────────────────────────────────────────
function PCHeader({
  activeTab, onTabChange, onMenuClick,
}: {
  activeTab: MobileTab; onTabChange: (t: MobileTab) => void;
  onMenuClick: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    const btn = tabRefs.current[idx];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const nRect = nav.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - nRect.left, width: bRect.width, ready: true });
  }, [activeTab]);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="flex-shrink-0 bg-card border border-border backdrop-blur-lg rounded-full px-2 py-1.5 flex items-center mx-3 mt-2 mb-1 relative z-10 glossy-outline gap-1">
      {/* Menu button */}
      <button onClick={onMenuClick}
        className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        <Menu className="w-4 h-4" />
      </button>

      {/* Scrollable tabs with sliding pill */}
      <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div ref={navRef} className="relative flex items-center min-w-max">
          {pill.ready && (
            <div aria-hidden style={{
              position: "absolute", left: pill.left, width: pill.width, top: 1, bottom: 1,
              background: theme === "dark" ? "rgba(255,255,255,0.92)" : "white",
              borderRadius: 14,
              boxShadow: theme === "dark" ? "0 1px 12px rgba(255,255,255,0.2)" : "0 1px 8px rgba(0,0,0,0.14)",
              transition: "left 0.35s cubic-bezier(0.23,1,0.32,1), width 0.35s cubic-bezier(0.23,1,0.32,1)",
              pointerEvents: "none", zIndex: 0,
            }} />
          )}
          {TABS.map(({ id, label }, i) => (
            <button key={id} ref={el => { tabRefs.current[i] = el; }} onClick={() => onTabChange(id)}
              className={`relative z-10 flex-shrink-0 text-[12px] px-2.5 py-1.5 rounded-2xl font-medium transition-colors duration-200 ${activeTab === id ? "text-zinc-900 dark:text-zinc-900 font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme toggle */}
      <button onClick={cycleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : theme === "system" ? <Monitor className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </button>
    </header>
  );
}

// ─── Ask Tab ──────────────────────────────────────────────────────────────────
function AskTab({
  messages, isTyping, input, setInput, onSend, onStop,
  model, setModel, user, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode,
}: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; model: string; setModel: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
  fiusIntegrationMode?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [showModels, setShowModels] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const m = ASK_MODELS.find(x => x.id === model) || ASK_MODELS[0];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {showModels && (
        <ModelSheet models={ASK_MODELS} current={model} onSelect={setModel} onClose={() => setShowModels(false)} />
      )}

      {/* Model switcher */}
      <div className="flex-shrink-0 flex items-center px-3 pt-1.5 pb-0.5">
        <button onClick={() => setShowModels(true)}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/15 transition-all active:scale-95">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-400" />
          {m.name}
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping ? (
          <div className="flex flex-col items-center justify-center min-h-full py-8 text-center">
            <Logo size="xl" className="mb-5 text-foreground" />
            <h2 className="text-[22px] font-bold text-foreground mb-1">
              {user?.displayName ? `Welcome back, ${user.displayName}!`
                : user?.username ? `Welcome back, ${user.username}!`
                : "Welcome to Fius"}
            </h2>
            <p className="text-sm text-muted-foreground mb-7">Fly With Us!</p>
            <p className="text-[11px] font-semibold text-muted-foreground mb-3.5 uppercase tracking-wide">What's on your mind?</p>
            <div className="w-full flex flex-col gap-2.5">
              {SUGGESTION_CARDS.map((card, i) => (
                <button key={i} onClick={() => setInput(card.prompt)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card text-left active:scale-[0.97] transition-all hover:bg-accent/60">
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 border border-border/60">{card.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
            {isTyping && (
              <div className="flex gap-2 mb-3.5 animate-in fade-in duration-200">
                <div className="self-end mb-5 flex-shrink-0"><FiusAvatar size={26} /></div>
                <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      <FunctionBar onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} fiusIntegrationMode={fiusIntegrationMode} />
      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder="What do you want to know?" isTyping={isTyping}
      />
    </>
  );
}

// ─── Studio (Imagine) Tab ─────────────────────────────────────────────────────
function ImagineTab({ messages, isTyping, input, setInput, onSend, onVoiceMode, onSettings, onIntegration }: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const [style, setStyle] = useState(IMAGINE_STYLES[0]);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [showModels, setShowModels] = useState(false);
  const [studioModel, setStudioModel] = useState(STUDIO_MODELS[0].id);
  const [detailImg, setDetailImg] = useState<Msg | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // When new image arrives, show detail view
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "ai" && last?.imageUrl) {
      setDetailImg(last);
    }
  }, [messages]);

  const sm = STUDIO_MODELS.find(x => x.id === studioModel) || STUDIO_MODELS[0];

  // Detail / result view
  if (detailImg && !isTyping) {
    return (
      <>
        {expandImg && (
          <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
            <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
            <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
          </div>
        )}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card">
          <button onClick={() => setDetailImg(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Generated Image</p>
            <p className="text-[11px] text-muted-foreground">Fius Studio</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <MobileImageCard src={detailImg.imageUrl!} onExpand={s => setExpandImg(s)} />
          <div className="text-xs text-muted-foreground px-1">
            Prompt: <span className="text-foreground">{messages.find(m => m.role === "user")?.content || ""}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setDetailImg(null); setInput(""); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold active:scale-95 transition-all">
              <Sparkles className="w-3 h-3" /> New Image
            </button>
            <button onClick={() => { setDetailImg(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-foreground text-xs font-semibold active:scale-95 transition-all">
              View All
            </button>
          </div>
        </div>
        <FunctionBar onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
        <PCInputBar value={input} onChange={v => setInput(v)} onSend={onSend} onStop={() => {}}
          placeholder="Just Prompt and image is in your hands!" isTyping={isTyping} showEnhance
        />
      </>
    );
  }

  return (
    <>
      {showModels && (
        <ModelSheet models={STUDIO_MODELS} current={studioModel} onSelect={setStudioModel} onClose={() => setShowModels(false)} />
      )}
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Top bar: model + style scroller */}
      <div className="flex-shrink-0 px-3 pt-2 pb-1">
        {/* Model picker */}
        <div className="flex items-center mb-2">
          <button onClick={() => setShowModels(true)}
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/15 transition-all active:scale-95">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-400" />
            {sm.name}
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>
        </div>
        {/* Style strip */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {IMAGINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold border transition-all active:scale-95 ${style.id === s.id ? "bg-foreground text-background border-transparent" : "bg-accent/60 text-muted-foreground border-border/50 hover:text-foreground"}`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Fius Studio</p>
              <p className="text-sm text-muted-foreground mt-1.5">Just Prompt and image is in your hands!</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-[260px]">
              {["A futuristic city at night", "Portrait of a wise sage", "Abstract cosmic art"].map(p => (
                <button key={p} onClick={() => setInput(p)}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3.5 animate-in fade-in">
            <div className="self-end mb-5 w-7 h-7 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              Generating your image…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <FunctionBar onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
      <PCInputBar value={input} onChange={v => setInput(v + style.suffix)} onSend={onSend} onStop={() => {}}
        placeholder="Just Prompt and image is in your hands!" isTyping={isTyping} showEnhance
      />
    </>
  );
}

// ─── Philosopher (Minds) Tab ───────────────────────────────────────────────────
const PHIL_COLORS: Record<string, string> = {
  Philosophy: "#8b5cf6", Science: "#3b82f6", Leaders: "#10b981",
};

function PhilosopherTab({ messages, isTyping, input, setInput, onSend, onStop, personality, setPersonality, onVoiceMode, onSettings, onIntegration }: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void; onStop: () => void;
  personality: Personality | null; setPersonality: (p: Personality | null) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const filtered = activeCategory === "All" ? PHILOSOPHERS : PHILOSOPHERS.filter(p => p.category === activeCategory);

  if (!personality) {
    return (
      <>
        {/* Filter bottom sheet */}
        {showFilter && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowFilter(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
            <div className="relative bg-background rounded-t-[28px] pb-8 shadow-2xl animate-in slide-in-from-bottom duration-350"
              style={{ animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-3"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
              <p className="text-[16px] font-bold text-foreground px-5 mb-3">Filter by Category</p>
              {PHIL_CATEGORIES.map((cat, i) => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setShowFilter(false); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors ${cat === activeCategory ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
                  {cat !== "All" && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PHIL_COLORS[cat] || "#888" }} />
                  )}
                  {cat === "All" && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-zinc-400" />}
                  <span className="text-[14px] font-semibold text-foreground flex-1">{cat}</span>
                  {cat === activeCategory && <Check className="w-4 h-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border/60">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Choose a mind</p>
          <button onClick={() => setShowFilter(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/70 border border-border/50 text-xs font-semibold text-foreground transition-all active:scale-95 hover:bg-accent">
            <Filter className="w-3 h-3" />
            {activeCategory !== "All" ? activeCategory : "Filter"}
          </button>
        </div>

        {/* Row list */}
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {filtered.map((p, i) => {
            const color = PHIL_COLORS[p.category] || "#888";
            return (
              <button key={p.id} onClick={() => setPersonality(p)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all active:scale-[0.98] hover:bg-accent/50 ${i > 0 ? "border-t border-border/40" : ""}`}>
                {/* Emoji as avatar */}
                <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl"
                  style={{ background: `${color}18`, border: `1.5px solid ${color}30` }}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{p.role} · {p.era}</p>
                  <p className="text-[10.5px] text-muted-foreground/70 truncate mt-0.5">{p.style}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const color = PHIL_COLORS[personality.category] || "#888";
  return (
    <>
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => setPersonality(null)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>{personality.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-foreground">{personality.name}</p>
          <p className="text-[11px] text-muted-foreground">{personality.era} · {personality.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ background: `${color}18`, border: `2px solid ${color}30` }}>{personality.emoji}</div>
            <div>
              <p className="text-lg font-bold text-foreground">{personality.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{personality.role} · {personality.era}</p>
              <p className="text-xs text-muted-foreground mt-3 max-w-[240px] mx-auto leading-relaxed italic">"{personality.style}"</p>
            </div>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={() => {}} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3.5 animate-in fade-in">
            <div className="self-end mb-5 w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>{personality.emoji}</div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <FunctionBar onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder={`Ask ${personality.name} anything…`} isTyping={isTyping} showEnhance={false}
      />
    </>
  );
}

// ─── Nomad Tab ────────────────────────────────────────────────────────────────
function NomadTab({ input, setInput, onSend, isTyping, responses, onVoiceMode, onSettings, onIntegration }: {
  input: string; setInput: (v: string) => void; onSend: () => void;
  isTyping: boolean;
  responses: { model: string; content: string; color: string; bg: string; done: boolean }[];
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [responses]);

  return (
    <>
      {/* Active model badges strip */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-border/60 bg-card">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0 mr-1">Active:</span>
          {NOMAD_MODELS.map(m => (
            <span key={m.key} className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0"
              style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}>{m.label}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ overscrollBehavior: "contain" }}>
        {responses.length === 0 && !isTyping ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 border border-border flex items-center justify-center">
              <Globe className="w-9 h-9 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Nomad Multi-AI</p>
              <p className="text-sm text-muted-foreground mt-1.5">Ask once, get all perspectives<br />from every leading AI</p>
            </div>
            {["Compare AI opinions on climate change", "What is consciousness?", "Best programming language in 2025"].map(p => (
              <button key={p} onClick={() => setInput(p)}
                className="text-[12px] px-4 py-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95">
                {p}
              </button>
            ))}
          </div>
        ) : (
          <>
            {responses.map((r, i) => {
              const nm = NOMAD_MODELS[i % NOMAD_MODELS.length];
              return (
                <div key={i} className="mb-3 rounded-2xl overflow-hidden animate-in fade-in duration-300"
                  style={{ border: `1px solid ${nm.color}25`, background: nm.bg }}>
                  <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom: `1px solid ${nm.color}20` }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: nm.color }} />
                    <span className="text-[12.5px] font-bold" style={{ color: nm.color }}>{nm.label}</span>
                    {!r.done && <div className="ml-auto w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: nm.color }} />}
                    {r.done && <Check className="ml-auto w-3.5 h-3.5" style={{ color: nm.color }} />}
                  </div>
                  <div className="px-4 py-3 text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {r.content || <span className="text-muted-foreground text-sm">Thinking…</span>}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      <FunctionBar onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Ask all AIs at once…" isTyping={isTyping} showEnhance={false}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MobileChatInterface({ onShowAuth }: { onShowAuth: () => void }) {
  useToast();

  const { data: user } = useQuery<{ username: string; email: string; id: string; displayName?: string }>({
    queryKey: ["/api/auth/user"], retry: false,
  });
  const { data: convList = [] } = useQuery<Conv[]>({
    queryKey: ["/api/conversations"], enabled: !!user,
  });

  const [tab, setTab] = useState<MobileTab>("ask");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [fiusIntegrationMode, setFiusIntegrationMode] = useState(false);
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");

  const [profilePicture, setProfilePicture] = useState<string | undefined>(() =>
    localStorage.getItem("profilePicture") || undefined
  );

  // Ask
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askModel, setAskModel] = useState("fius-lite");
  const [currentConvId, setCurrentConvId] = useState<string | undefined>();
  const askAbortRef = useRef<AbortController | null>(null);

  // Imagine / Studio
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
  const [nomadRes, setNomadRes] = useState<{ model: string; content: string; color: string; bg: string; done: boolean }[]>([]);

  // Listen for chatBg changes from settings
  useEffect(() => {
    const handler = () => setChatBg(localStorage.getItem("chatBg") || "plain");
    window.addEventListener("chatBgChanged", handler);
    return () => window.removeEventListener("chatBgChanged", handler);
  }, []);

  const projects = convList.map(c => ({
    id: c.id, title: c.title || "New Chat",
    createdAt: new Date(c.createdAt), aiRole: c.aiRole, isProject: c.isProject,
  }));

  const loadConv = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAskMsgs(data.map((m: any) => ({
          id: m.id || uid(), role: m.role === "assistant" ? "ai" : m.role,
          content: m.content, timestamp: new Date(m.createdAt || Date.now()),
        })));
      }
    } catch { /* silent */ }
  }, []);

  const handleSelectConv = useCallback((id: string) => {
    setCurrentConvId(id); setAskMsgs([]); setTab("ask"); loadConv(id);
  }, [loadConv]);

  const handleNewChat = useCallback(() => {
    setCurrentConvId(undefined); setAskMsgs([]); setAskInput(""); setTab("ask");
  }, []);

  const handleDeleteConv = useCallback(async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (id === currentConvId) handleNewChat();
    } catch { /* silent */ }
  }, [currentConvId, handleNewChat]);

  const handleLogout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }
    catch { onShowAuth(); }
  }, [onShowAuth]);

  const ensureConv = useCallback(async (): Promise<string> => {
    if (currentConvId) return currentConvId;
    const res = await fetch("/api/conversations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat", model: askModel }),
    });
    if (!res.ok) throw new Error("Could not create conversation");
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) {
      setCurrentConvId(newId);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      return newId;
    }
    throw new Error("No ID returned");
  }, [currentConvId, askModel]);

  const handleAskSend = useCallback(async () => {
    const text = askInput.trim(); if (!text || askTyping) return;
    setAskInput(""); setAskTyping(true);
    const userMsg: Msg = { id: uid(), role: "user", content: text, timestamp: new Date() };
    setAskMsgs(p => [...p, userMsg]);
    try {
      const convId = await ensureConv();
      askAbortRef.current?.abort();
      const ctrl = new AbortController(); askAbortRef.current = ctrl;
      const res = await fetch("/api/test-ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "I couldn't generate a response.", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
    } finally { setAskTyping(false); }
  }, [askInput, askTyping, ensureConv]);

  const handleImagSend = useCallback(async () => {
    const text = imagInput.trim(); if (!text || imagTyping) return;
    setImagInput(""); setImagTyping(true);
    setImagMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, size: "1024x1024", quality: "standard" }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImagMsgs(p => [...p, { id: uid(), role: "ai", content: "", imageUrl: data.url, timestamp: new Date() }]);
      } else {
        setImagMsgs(p => [...p, { id: uid(), role: "ai", content: "Image generation failed. Please try again.", timestamp: new Date() }]);
      }
    } catch {
      setImagMsgs(p => [...p, { id: uid(), role: "ai", content: "Image generation failed.", timestamp: new Date() }]);
    } finally { setImagTyping(false); }
  }, [imagInput, imagTyping]);

  const handlePhilSend = useCallback(async () => {
    const text = philInput.trim(); if (!text || philTyping || !philPerson) return;
    setPhilInput(""); setPhilTyping(true);
    setPhilMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      philAbortRef.current?.abort();
      const ctrl = new AbortController(); philAbortRef.current = ctrl;
      const systemMsg = `You are ${philPerson.name} (${philPerson.era}), the ${philPerson.role}. Style: ${philPerson.style}. Stay fully in character at all times. The user asks: ${text}`;
      const res = await fetch("/api/test-ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: systemMsg, activeTab: "philosopher" }), signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "…", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong.", timestamp: new Date() }]);
    } finally { setPhilTyping(false); }
  }, [philInput, philTyping, philPerson]);

  const handleNomadSend = useCallback(async () => {
    const text = nomadInput.trim(); if (!text || nomadTyping) return;
    setNomadInput(""); setNomadTyping(true);
    setNomadRes(NOMAD_MODELS.map(m => ({ model: m.key, content: "", color: m.color, bg: m.bg, done: false })));
    await Promise.allSettled(NOMAD_MODELS.map(async (nm, i) => {
      try {
        const res = await fetch("/api/test-ai", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, activeTab: "nomad" }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setNomadRes(p => p.map((r, j) => j === i ? { ...r, content: data.response || data.message || "No response", done: true } : r));
      } catch {
        setNomadRes(p => p.map((r, j) => j === i ? { ...r, content: "Failed to get response. Please retry.", done: true } : r));
      }
    }));
    setNomadTyping(false);
  }, [nomadInput, nomadTyping]);

  const handleUserRename = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  const getChatBgStyle = () => {
    switch (chatBg) {
      case "gradient": return { background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" };
      case "stars": return { background: "radial-gradient(ellipse at center, #1a1a3e 0%, #0d0d1a 60%, #000 100%)" };
      case "rainbow": return { background: "linear-gradient(135deg,#ff6b6b22,#feca5722,#48dbfb22,#ff9ff322,#54a0ff22)" };
      case "stars-gradient": return { background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" };
      case "stars-rainbow": return { background: "linear-gradient(135deg,#ff6b6b22,#feca5722,#48dbfb22,#ff9ff322,#54a0ff22)" };
      default: return {};
    }
  };

  const voiceHandlers = {
    onVoiceMode: () => setVoiceModalOpen(true),
    onSettings: () => setSettingsModalOpen(true),
    onIntegration: () => setFiusIntegrationMode(v => !v),
  };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <div className="fixed inset-0 bg-background flex flex-col overflow-hidden"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout}
            projects={projects} currentProjectId={currentConvId}
            onProjectSelect={id => { handleSelectConv(id); setSidebarOpen(false); }}
            onNewProject={() => { handleNewChat(); setSidebarOpen(false); }}
            onDeleteProject={handleDeleteConv}
            onEditProject={async (id, title) => {
              try { await apiRequest("PATCH", `/api/conversations/${id}`, { title }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { }
            }}
            onUpdateAiRole={async (id, aiRole) => {
              try { await apiRequest("PATCH", `/api/conversations/${id}`, { aiRole }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { }
            }}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onVoiceClick={() => { setSidebarOpen(false); setVoiceModalOpen(true); }}
            onImagineClick={() => { setSidebarOpen(false); setTab("imagine"); }}
            user={user ? { email: user.email, username: user.username } : undefined}
            onUserRename={handleUserRename}
            profilePicture={profilePicture}
            onProfilePictureChange={dataUrl => { setProfilePicture(dataUrl); localStorage.setItem("profilePicture", dataUrl); }}
          />

          <VoiceModeModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

          <MobileSettings
            isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)}
            user={user ? { email: user.email, username: user.username, displayName: user.displayName } : undefined}
            profilePicture={profilePicture}
            onUserRename={handleUserRename}
            onProfilePictureChange={dataUrl => { setProfilePicture(dataUrl); localStorage.setItem("profilePicture", dataUrl); }}
            model={askModel} onModelChange={setAskModel}
            onChatBgChange={bg => setChatBg(bg)}
          />

          {/* Header */}
          <PCHeader activeTab={tab} onTabChange={setTab} onMenuClick={() => setSidebarOpen(true)} />

          {/* Tab content */}
          <div className="flex-1 flex flex-col overflow-hidden relative" style={getChatBgStyle()}>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "ask" ? "flex" : "none" }}>
              <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
                onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
                model={askModel} setModel={setAskModel} user={user}
                fiusIntegrationMode={fiusIntegrationMode} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "nomad" ? "flex" : "none" }}>
              <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
                isTyping={nomadTyping} responses={nomadRes} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ display: tab === "imagine" ? "flex" : "none" }}>
              <ImagineTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput}
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
