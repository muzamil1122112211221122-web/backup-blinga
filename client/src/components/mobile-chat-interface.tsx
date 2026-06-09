import React, { useState, useRef, useEffect, useCallback, Component } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
import { useTheme } from "./theme-provider";
import {
  Sparkles, Brain, Globe, AudioLines,
  Plus, X, ArrowUp, Menu, Check, ChevronRight,
  Download, ChevronLeft, Mic, FileText, Image,
  Search, PenTool, Settings, Bell, Sun, Moon, Monitor,
  RefreshCcw, Zap, User, Palette, Sliders, ChevronDown,
  Trash2, MessageCircle, Camera,
} from "lucide-react";
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
const MODELS = [
  { id: "fius-lite",   name: "Fius Lite",   short: "Lite",    dot: "#a855f7" },
  { id: "fius-pro",    name: "Fius Pro",    short: "Pro",     dot: "#7c3aed" },
  { id: "openai/gpt-4o", name: "GPT-4o",   short: "GPT",     dot: "#10b981" },
  { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5", short: "Claude", dot: "#f97316" },
  { id: "google/gemini-pro-1.5", name: "Gemini 1.5", short: "Gemini", dot: "#3b82f6" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3", short: "Llama", dot: "#f59e0b" },
];

const PRESETS = [
  { id: "custom",  label: "Custom",   desc: "Default style" },
  { id: "concise", label: "Concise",  desc: "Brief & direct" },
  { id: "formal",  label: "Formal",   desc: "Professional tone" },
  { id: "socratic",label: "Socratic", desc: "Asks questions back" },
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
  { id: "nietzsche", emoji: "⚡", name: "Nietzsche",        era: "1844–1900",  role: "Philosopher",   category: "Philosophy", style: "Will to power, poetic, provocative" },
  { id: "einstein",  emoji: "🔭", name: "Einstein",         era: "1879–1955",  role: "Physicist",     category: "Science",   style: "Thought experiments, humble, curious" },
  { id: "lao-tzu",   emoji: "☯️", name: "Lao Tzu",         era: "6th c. BC",  role: "Philosopher",   category: "Philosophy", style: "Tao, wu wei, poetic simplicity" },
  { id: "aristotle", emoji: "📚", name: "Aristotle",        era: "384–322 BC", role: "Philosopher",   category: "Philosophy", style: "Logic, ethics, virtue" },
  { id: "marcus",    emoji: "🛡️", name: "Marcus Aurelius", era: "121–180 AD", role: "Stoic Emperor", category: "Philosophy", style: "Stoic, introspective, duty" },
  { id: "gandhi",    emoji: "✌️", name: "Gandhi",           era: "1869–1948",  role: "Leader",        category: "Leaders",   style: "Nonviolence, truth, spiritual" },
  { id: "tesla",     emoji: "⚡", name: "Nikola Tesla",     era: "1856–1943",  role: "Inventor",      category: "Science",   style: "Visionary, eccentric, technical" },
  { id: "plato",     emoji: "🌌", name: "Plato",            era: "428–348 BC", role: "Philosopher",   category: "Philosophy", style: "Allegory, idealism, dialogues" },
  { id: "confucius", emoji: "🌸", name: "Confucius",        era: "551–479 BC", role: "Philosopher",   category: "Philosophy", style: "Virtue, ritual, filial piety" },
  { id: "darwin",    emoji: "🦋", name: "Charles Darwin",   era: "1809–1882",  role: "Naturalist",    category: "Science",   style: "Observational, methodical" },
  { id: "voltaire",  emoji: "🖊️", name: "Voltaire",         era: "1694–1778",  role: "Philosopher",   category: "Philosophy", style: "Satirical, rationalist, wit" },
];

const TABS: { id: MobileTab; label: string }[] = [
  { id: "ask",         label: "Ask"     },
  { id: "nomad",       label: "Nomad"   },
  { id: "imagine",     label: "Studio"  },
  { id: "philosopher", label: "Minds"   },
  { id: "games",       label: "Games"   },
];

const NOMAD_MODELS = [
  { key: "gpt",    label: "GPT-4o",   color: "#10b981", bg: "#10b98115" },
  { key: "claude", label: "Claude",   color: "#f97316", bg: "#f9731615" },
  { key: "gemini", label: "Gemini",   color: "#3b82f6", bg: "#3b82f615" },
  { key: "fius",   label: "Fius",     color: "#8b5cf6", bg: "#8b5cf615" },
];

const SUGGESTION_CARDS = [
  { icon: <Search className="w-4 h-4 text-orange-400" />, title: "Research & analysis", desc: "Deep dive into any topic", prompt: "Analyze the benefits of renewable energy sources" },
  { icon: <PenTool className="w-4 h-4 text-blue-400" />,  title: "Creative writing",    desc: "Stories, essays, content",  prompt: "Write a short story about time travel" },
  { icon: <Brain className="w-4 h-4 text-purple-400" />,  title: "Brainstorm ideas",    desc: "Generate fresh concepts",   prompt: "Give me 10 creative business ideas for 2025" },
];

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

// ─── Compact Input Bar ────────────────────────────────────────────────────────
function PCInputBar({
  value, onChange, onSend, placeholder, isTyping, onStop,
  model, onModelClick,
  onVoiceMode, onSettings, onIntegration, fiusIntegrationMode,
  showEnhance = true,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  placeholder: string; isTyping: boolean; onStop: () => void;
  model?: string; onModelClick?: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
  fiusIntegrationMode?: boolean; showEnhance?: boolean;
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

  const m = MODELS.find(x => x.id === model) || MODELS[0];
  const btnCls = "w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0";
  const defaultBtnCls = `${btnCls} bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10`;

  return (
    <div className="flex-shrink-0 px-3 pb-3 pt-1 relative">
      {isListening && (
        <div className="absolute -top-7 inset-x-0 flex justify-center z-10">
          <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Listening…</span>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#303030] rounded-3xl glossy-outline overflow-hidden">
        {/* Model chip — top left */}
        {model && onModelClick && (
          <div className="px-3 pt-2.5 pb-0">
            <button onClick={onModelClick}
              className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/15 transition-all active:scale-95">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
              {m.name}
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <div className="px-4 py-2.5">
          <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKey}
            placeholder={placeholder} rows={1}
            className="w-full bg-transparent text-[14.5px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 120, scrollbarWidth: "none", minHeight: 26 }}
          />
        </div>

        {/* Single action row */}
        <div className="flex items-center px-2 pb-2.5 gap-1">
          {/* Attachment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={defaultBtnCls}>
                <img src={isDark ? attachmentDark : attachmentLight} alt="Attach" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none rounded-2xl shadow-2xl p-1 min-w-[160px] z-[200]">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-xl hover:bg-black/8 dark:hover:bg-white/8 text-foreground">
                <FileText className="w-4 h-4 text-zinc-400" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-xl hover:bg-black/8 dark:hover:bg-white/8 text-foreground">
                <Image className="w-4 h-4 text-zinc-400" /> Upload Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Integration */}
          <button onClick={onIntegration}
            className={`${btnCls} ${fiusIntegrationMode ? "bg-blue-500/15 text-blue-400" : "bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"}`}>
            <img src="/integration-icon.png" alt="Integration" style={{ width: 16, height: 16 }}
              className={fiusIntegrationMode ? "" : "brightness-0 dark:brightness-200 dark:contrast-150"} />
          </button>

          {/* Voice Mode */}
          <button onClick={onVoiceMode} className={defaultBtnCls}>
            <AudioLines className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button onClick={onSettings} className={defaultBtnCls}>
            <img src="/settings-icon.png" alt="Settings" style={{ width: 15, height: 15 }} className="brightness-0 dark:brightness-200 dark:contrast-150" />
          </button>

          <div className="flex-1" />

          {/* Mic */}
          <button onClick={toggleMic}
            className={`${btnCls} ${isListening ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"}`}>
            {isListening
              ? <Mic className="w-4 h-4" />
              : <img src={isDark ? micDark : micLight} alt="Mic" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />}
          </button>

          {/* Enhance */}
          {showEnhance && (
            <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing}
              className={`${defaultBtnCls} disabled:opacity-30`}>
              {isEnhancing
                ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <img src={isDark ? enhancePromptDark : enhancePromptLight} alt="Enhance" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />}
            </button>
          )}

          {/* Send / Stop */}
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

// ─── Comprehensive Mobile Settings Sheet ──────────────────────────────────────
function MobileSettingsSheet({
  isOpen, onClose, user, profilePicture, onProfilePictureChange, onUserRename,
  model, onModelChange,
}: {
  isOpen: boolean; onClose: () => void;
  user?: { username: string; email: string; displayName?: string };
  profilePicture?: string;
  onProfilePictureChange?: (dataUrl: string) => void;
  onUserRename?: (name: string) => void;
  model?: string; onModelChange?: (m: string) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<"main" | "account" | "appearance" | "behavior" | "nomad">("main");
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "");
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem("customInstructions") || "");
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem("aiPreset") || "custom");
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "default");
  const picInputRef = useRef<HTMLInputElement>(null);

  const CHAT_BGS = [
    { id: "default",  label: "Default" }, { id: "gradient", label: "Gradient" },
    { id: "stars",    label: "Stars" },   { id: "rainbow",  label: "Rainbow" },
  ];

  useEffect(() => { if (!isOpen) { setTimeout(() => setSection("main"), 350); } }, [isOpen]);
  useEffect(() => { setDisplayName(user?.displayName || user?.username || ""); }, [user]);

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onProfilePictureChange?.(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    try {
      await apiRequest("PATCH", "/api/auth/user", { username: displayName.trim() });
      onUserRename?.(displayName.trim());
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch { /* silent */ }
  };

  const savePreset = (preset: string) => {
    setSelectedPreset(preset); localStorage.setItem("aiPreset", preset);
  };
  const saveInstructions = () => { localStorage.setItem("customInstructions", customInstructions); };
  const saveChatBg = (bg: string) => { setChatBg(bg); localStorage.setItem("chatBg", bg); };

  if (!isOpen) return null;

  const initials = (user?.displayName || user?.username || "?").charAt(0).toUpperCase();

  const SectionRow = ({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-accent/60 transition-colors">
      <div className="w-9 h-9 rounded-2xl bg-accent border border-border/60 flex items-center justify-center text-muted-foreground flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );

  const sectionTitle = section === "main" ? "Settings"
    : section === "account" ? "Account"
    : section === "appearance" ? "Appearance"
    : section === "behavior" ? "AI Behavior"
    : "Nomad Settings";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ WebkitTapHighlightColor: "transparent" }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative bg-background rounded-t-[28px] max-h-[90vh] flex flex-col"
        style={{ boxShadow: "0 -10px 60px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center px-5 py-3 flex-shrink-0">
          {section !== "main" && (
            <button onClick={() => setSection("main")} className="mr-3 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-[17px] font-bold text-foreground flex-1">{sectionTitle}</h2>
          {section === "main" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent/80 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pb-8">

          {/* MAIN SECTION */}
          {section === "main" && (
            <>
              {/* Account card */}
              <div className="px-5 mb-3">
                <button onClick={() => setSection("account")}
                  className="w-full flex items-center gap-3.5 p-4 rounded-3xl bg-accent/70 border border-border/50 text-left active:scale-[0.98] transition-all">
                  <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    {profilePicture ? <img src={profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{initials}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{user?.displayName || user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              </div>

              {/* Settings sections */}
              <div className="mx-5 rounded-3xl border border-border/50 overflow-hidden mb-3 bg-card">
                <SectionRow icon={<Palette className="w-4 h-4" />} label="Appearance" sub="Theme, background, style" onClick={() => setSection("appearance")} />
                <div className="h-px bg-border/50 mx-4" />
                <SectionRow icon={<Zap className="w-4 h-4" />} label="AI Behavior" sub="Preset, model, instructions" onClick={() => setSection("behavior")} />
                <div className="h-px bg-border/50 mx-4" />
                <SectionRow icon={<Globe className="w-4 h-4" />} label="Nomad Settings" sub="Multi-AI configuration" onClick={() => setSection("nomad")} />
              </div>

              <div className="mx-5 rounded-3xl border border-border/50 overflow-hidden bg-card">
                <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-accent/60 transition-colors"
                  onClick={() => { localStorage.removeItem("customInstructions"); setCustomInstructions(""); }}>
                  <div className="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">Clear Data</p>
                    <p className="text-xs text-muted-foreground">Reset preferences & instructions</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ACCOUNT SECTION */}
          {section === "account" && (
            <div className="px-5">
              <div className="flex flex-col items-center gap-3 mb-6">
                <button onClick={() => picInputRef.current?.click()} className="relative group">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    {profilePicture ? <img src={profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-3xl">{initials}</span>}
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-active:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <p className="text-xs text-muted-foreground">Tap to change photo</p>
                <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Display Name</p>
              <div className="flex gap-2 mb-4">
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSaveName(); }}
                  placeholder="Your name" className="flex-1 h-11 rounded-2xl bg-accent border-border/60 text-foreground text-sm" />
                <button onClick={handleSaveName} className="h-11 px-5 rounded-2xl bg-foreground text-background text-sm font-semibold active:scale-95 transition-all flex-shrink-0">Save</button>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Email</p>
              <div className="h-11 px-4 flex items-center rounded-2xl bg-accent/60 border border-border/60">
                <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {section === "appearance" && (
            <div className="px-5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Theme</p>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[
                  { v: "light" as const, icon: <Sun className="w-4 h-4 text-yellow-500" />, label: "Light" },
                  { v: "dark"  as const, icon: <Moon className="w-4 h-4 text-blue-400" />, label: "Dark" },
                  { v: "system" as const, icon: <Monitor className="w-4 h-4 text-foreground" />, label: "System" },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setTheme(opt.v)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${theme === opt.v ? "border-foreground/40 bg-foreground/10" : "border-border/50 bg-accent/50 hover:bg-accent/80"}`}>
                    {opt.icon}
                    <span className={`text-xs font-semibold ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                    {theme === opt.v && <div className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Chat Background</p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {CHAT_BGS.map(bg => (
                  <button key={bg.id} onClick={() => saveChatBg(bg.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-left transition-all active:scale-95 ${chatBg === bg.id ? "border-foreground/40 bg-foreground/10" : "border-border/50 bg-accent/50 hover:bg-accent/80"}`}>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${chatBg === bg.id ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                    <span className={`text-sm font-semibold ${chatBg === bg.id ? "text-foreground" : "text-muted-foreground"}`}>{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BEHAVIOR SECTION */}
          {section === "behavior" && (
            <div className="px-5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">AI Preset</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => savePreset(p.id)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all active:scale-[0.97] ${selectedPreset === p.id ? "border-foreground/40 bg-foreground/10" : "border-border/50 bg-accent/50 hover:bg-accent/80"}`}>
                    <div className="flex items-center gap-1.5 w-full">
                      <p className={`text-[13px] font-bold ${selectedPreset === p.id ? "text-foreground" : "text-foreground/80"}`}>{p.label}</p>
                      {selectedPreset === p.id && <Check className="w-3 h-3 ml-auto text-foreground" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Default Model</p>
              <div className="rounded-3xl border border-border/50 overflow-hidden mb-5 bg-card">
                {MODELS.map((m, i) => (
                  <button key={m.id} onClick={() => onModelChange?.(m.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors ${model === m.id ? "bg-accent/80" : "hover:bg-accent/50"} ${i > 0 ? "border-t border-border/40" : ""}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
                    <span className="text-[13.5px] font-semibold text-foreground flex-1">{m.name}</span>
                    {model === m.id && <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Custom Instructions</p>
              <p className="text-xs text-muted-foreground mb-3 px-1">Tell Fius how you want it to respond</p>
              <textarea
                value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
                placeholder="e.g. Always respond in a friendly, concise manner..."
                className="w-full h-28 bg-accent/60 border border-border/60 rounded-2xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-foreground/30 transition-colors"
              />
              <button onClick={saveInstructions} className="mt-3 w-full py-3 rounded-2xl bg-foreground text-background text-sm font-bold active:scale-[0.98] transition-all">
                Save Instructions
              </button>
            </div>
          )}

          {/* NOMAD SECTION */}
          {section === "nomad" && (
            <div className="px-5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Active AI Models</p>
              <p className="text-xs text-muted-foreground mb-4 px-1">Nomad queries all enabled models simultaneously</p>
              <div className="rounded-3xl border border-border/50 overflow-hidden bg-card">
                {NOMAD_MODELS.map((nm, i) => (
                  <div key={nm.key} className={`flex items-center gap-3.5 px-4 py-4 ${i > 0 ? "border-t border-border/40" : ""}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: nm.color }} />
                    <span className="text-[13.5px] font-semibold text-foreground flex-1">{nm.label}</span>
                    <div className="w-12 h-6 rounded-full bg-foreground/20 flex items-center justify-end px-0.5 transition-colors">
                      <div className="w-5 h-5 rounded-full bg-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PC-style Floating Pill Header ────────────────────────────────────────────
function PCHeader({
  activeTab, onTabChange, onMenuClick, user,
}: {
  activeTab: MobileTab; onTabChange: (t: MobileTab) => void;
  onMenuClick: () => void;
  user?: { username: string; displayName?: string };
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

  return (
    <header className="flex-shrink-0 bg-card border border-border backdrop-blur-lg rounded-full px-2.5 py-2 flex items-center justify-between mx-3 mt-2 mb-1 relative z-10 glossy-outline gap-1">
      {/* Left: menu + logo */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onMenuClick}
          className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Menu className="w-4 h-4" />
        </button>
        <Logo size="sm" />
      </div>

      {/* Center: scrollable tabs with sliding pill */}
      <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div ref={navRef} className="relative flex items-center min-w-max">
          {pill.ready && (
            <div aria-hidden style={{
              position: "absolute", left: pill.left, width: pill.width, top: 1, bottom: 1,
              background: theme === "dark" ? "rgba(255,255,255,0.92)" : "white",
              borderRadius: 14,
              boxShadow: theme === "dark" ? "0 1px 12px rgba(255,255,255,0.2)" : "0 1px 8px rgba(0,0,0,0.14)",
              transition: "left 0.3s cubic-bezier(0.23,1,0.32,1), width 0.3s cubic-bezier(0.23,1,0.32,1)",
              pointerEvents: "none", zIndex: 0,
            }} />
          )}
          {TABS.map(({ id, label }, i) => (
            <button key={id} ref={el => { tabRefs.current[i] = el; }} onClick={() => onTabChange(id)}
              className={`relative z-10 flex-shrink-0 text-[12px] px-2.5 py-1.5 rounded-2xl font-medium transition-colors duration-200 ${activeTab === id ? "text-zinc-900 font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: theme toggle + bell */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
          className={`w-8 h-8 flex items-center justify-center rounded-2xl border border-border transition-all ${theme === "dark" ? "bg-zinc-800" : theme === "light" ? "bg-yellow-50" : "bg-zinc-100 dark:bg-zinc-800"}`}>
          {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-blue-400" />
            : theme === "light" ? <Sun className="w-3.5 h-3.5 text-yellow-500" />
            : <Monitor className="w-3.5 h-3.5 text-foreground" />}
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>
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

      {/* Model picker bottom sheet */}
      {showModels && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-150" onClick={() => setShowModels(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-background rounded-t-[28px] pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-3"><div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" /></div>
            <p className="text-[16px] font-bold text-foreground px-5 mb-3">Select Model</p>
            {MODELS.map((opt, i) => (
              <button key={opt.id} onClick={() => { setModel(opt.id); setShowModels(false); }}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors ${opt.id === model ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                <span className="text-[14px] font-semibold text-foreground flex-1">{opt.name}</span>
                {opt.id === model && <Check className="w-4 h-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <div className="w-full flex flex-col gap-2.5 mb-7">
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
            <div className="flex items-center gap-8">
              {[
                { icon: <img src="/integration-icon.png" alt="" style={{ width: 20, height: 20 }} className="brightness-0 dark:brightness-200" />, label: "Integration\nAnswer", onClick: onIntegration },
                { icon: <AudioLines className="w-5 h-5 text-foreground" />, label: "Voice Mode", onClick: onVoiceMode },
                { icon: <img src="/settings-icon.png" alt="" style={{ width: 18, height: 18 }} className="brightness-0 dark:brightness-200" />, label: "Settings", onClick: onSettings },
              ].map((btn, i) => (
                <button key={i} onClick={btn.onClick} className="flex flex-col items-center gap-2 active:scale-90 transition-all">
                  <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">{btn.icon}</div>
                  <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight whitespace-pre-line">{btn.label}</span>
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

      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder="What do you want to know?" isTyping={isTyping}
        model={model} onModelClick={() => setShowModels(true)}
        onVoiceMode={onVoiceMode} onSettings={onSettings}
        onIntegration={onIntegration} fiusIntegrationMode={fiusIntegrationMode}
      />
    </>
  );
}

// ─── Imagine Tab ──────────────────────────────────────────────────────────────
function ImagineTab({ messages, isTyping, input, setInput, onSend, onVoiceMode, onSettings, onIntegration }: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const [style, setStyle] = useState(IMAGINE_STYLES[0]);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}
      {/* Style scroll strip */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border/60">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {IMAGINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all active:scale-95 ${style.id === s.id ? "bg-foreground text-background border-transparent" : "bg-accent/60 text-muted-foreground border-border/50 hover:text-foreground"}`}>
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
              <p className="text-sm text-muted-foreground mt-1.5">Describe what you want to see<br />and bring it to life</p>
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

      <PCInputBar value={input} onChange={v => setInput(v + style.suffix)} onSend={onSend} onStop={() => {}}
        placeholder="Describe the image you want to create…" isTyping={isTyping}
        onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration} showEnhance
      />
    </>
  );
}

// ─── Philosopher Tab ──────────────────────────────────────────────────────────
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
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  if (!personality) {
    const categories = [...new Set(PHILOSOPHERS.map(p => p.category))];
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-5">Choose a mind to explore</p>
        {categories.map(cat => (
          <div key={cat} className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest px-1 mb-2.5"
              style={{ color: PHIL_COLORS[cat] || "#888" }}>{cat}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {PHILOSOPHERS.filter(p => p.category === cat).map(p => (
                <button key={p.id} onClick={() => setPersonality(p)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card text-left active:scale-[0.97] transition-all hover:bg-accent/60">
                  <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ background: `${PHIL_COLORS[p.category] || "#888"}18`, border: `1px solid ${PHIL_COLORS[p.category] || "#888"}30` }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{p.era}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
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

      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder={`Ask ${personality.name} anything…`} isTyping={isTyping}
        showEnhance={false} onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration}
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
      {/* AI model badges strip */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-border/60 bg-card">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">Active:</span>
          <div className="flex gap-1.5 flex-wrap">
            {NOMAD_MODELS.map(m => (
              <span key={m.key} className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}>{m.label}</span>
            ))}
          </div>
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

      <PCInputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Ask all AIs at once…" isTyping={isTyping} showEnhance={false}
        onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration}
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

  // Imagine
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

          <MobileSettingsSheet
            isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)}
            user={user ? { email: user.email, username: user.username, displayName: user.displayName } : undefined}
            profilePicture={profilePicture}
            onUserRename={handleUserRename}
            onProfilePictureChange={dataUrl => { setProfilePicture(dataUrl); localStorage.setItem("profilePicture", dataUrl); }}
            model={askModel} onModelChange={setAskModel}
          />

          {/* Header */}
          <PCHeader activeTab={tab} onTabChange={setTab} onMenuClick={() => setSidebarOpen(true)} user={user} />

          {/* Tab content with transition */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
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
