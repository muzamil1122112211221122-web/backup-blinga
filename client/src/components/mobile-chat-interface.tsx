import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
import { CustomizeModal } from "./customize-modal";
import { useTheme } from "./theme-provider";
import {
  MessageCircle, Sparkles, Brain, Globe, Gamepad2,
  Plus, X, ArrowUp, Menu, Check, ChevronRight,
  LogOut, Trash2, Clock, Wand2, Download,
  ChevronLeft, Paperclip, Mic, AudioLines,
  Camera, FileText, Image, Search, PenTool, Settings, Link,
  Bell, Sun, Moon, Monitor,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import enhancePromptDark from "@assets/enhance_promt_button_-_Copy_1766904971885.png";
import enhancePromptLight from "@assets/enhance_promt_button_1766904971889.png";
import attachmentDark from "@assets/attachment_button_-_Copy_1766904971886.png";
import attachmentLight from "@assets/attachment_button_1766904971888.png";
import micDark from "@assets/mic_button_-_Copy_1766904971887.png";
import micLight from "@assets/mic_button_1766904971887.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "ask" | "imagine" | "philosopher" | "nomad" | "games";

interface Msg {
  id: string; role: "user" | "ai"; content: string;
  imageUrl?: string; isGenerating?: boolean; timestamp: Date;
}
interface Conv {
  id: string; title: string; createdAt: string | Date; updatedAt?: string | Date;
  aiRole?: string; isProject?: boolean;
}
interface Personality {
  id: string; name: string; era: string; role: string;
  category: string; style: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MODELS = [
  { id: "fius-lite",   name: "Fius Lite",  dot: "#a855f7" },
  { id: "fius-pro",    name: "Fius Pro",   dot: "#8b5cf6" },
  { id: "openai/gpt-4o", name: "GPT-4o",  dot: "#10b981" },
  { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5", dot: "#f97316" },
  { id: "google/gemini-pro-1.5", name: "Gemini",   dot: "#3b82f6" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3", dot: "#f59e0b" },
];

const IMAGINE_STYLES = [
  { id: "photo",    label: "Photo",   emoji: "📷", suffix: ", photorealistic, ultra detailed, 8k" },
  { id: "anime",    label: "Anime",   emoji: "✨", suffix: ", anime art style, studio ghibli inspired" },
  { id: "digital",  label: "Digital", emoji: "🎨", suffix: ", digital art, concept art, vibrant colors" },
  { id: "painting", label: "Paint",   emoji: "🖌️", suffix: ", oil painting, impressionist, museum quality" },
  { id: "sketch",   label: "Sketch",  emoji: "✏️", suffix: ", pencil sketch, fine line art" },
  { id: "3d",       label: "3D",      emoji: "🔮", suffix: ", 3d render, cinematic lighting, octane render" },
];

const PHILOSOPHERS: Personality[] = [
  { id:"socrates",  name:"Socrates",        era:"470–399 BC",  role:"Philosopher",     category:"Philosophy", style:"Socratic questioning, irony, dialogue" },
  { id:"nietzsche", name:"Nietzsche",       era:"1844–1900",   role:"Philosopher",     category:"Philosophy", style:"Will to power, poetic, provocative" },
  { id:"einstein",  name:"Einstein",        era:"1879–1955",   role:"Physicist",       category:"Science",    style:"Thought experiments, humble, curious" },
  { id:"lao-tzu",   name:"Lao Tzu",        era:"6th c. BC",   role:"Philosopher",     category:"Philosophy", style:"Tao, wu wei, poetic simplicity" },
  { id:"aristotle", name:"Aristotle",       era:"384–322 BC",  role:"Philosopher",     category:"Philosophy", style:"Logic, ethics, virtue, systematic" },
  { id:"marcus",    name:"Marcus Aurelius", era:"121–180 AD",  role:"Stoic Emperor",   category:"Philosophy", style:"Stoic, introspective, duty-focused" },
  { id:"gandhi",    name:"Gandhi",          era:"1869–1948",   role:"Leader",          category:"Leaders",    style:"Nonviolence, truth, spiritual, simple" },
  { id:"tesla",     name:"Nikola Tesla",    era:"1856–1943",   role:"Inventor",        category:"Science",    style:"Visionary, eccentric, technical" },
  { id:"plato",     name:"Plato",           era:"428–348 BC",  role:"Philosopher",     category:"Philosophy", style:"Allegory, idealism, dialogues" },
  { id:"confucius", name:"Confucius",       era:"551–479 BC",  role:"Philosopher",     category:"Philosophy", style:"Virtuous governance, ritual, filial piety" },
  { id:"darwin",    name:"Charles Darwin",  era:"1809–1882",   role:"Naturalist",      category:"Science",    style:"Observational, methodical, humble" },
  { id:"voltaire",  name:"Voltaire",        era:"1694–1778",   role:"Philosopher",     category:"Philosophy", style:"Satirical, rationalist, anti-dogma" },
];

const TABS: { id: MobileTab; short: string; full: string }[] = [
  { id: "ask",         short: "Ask",         full: "Ask"                },
  { id: "nomad",       short: "Nomad",       full: "Nomad"              },
  { id: "imagine",     short: "Studio",      full: "Imagine Studio"     },
  { id: "philosopher", short: "Minds",       full: "Philosophers"       },
  { id: "games",       short: "Games",       full: "Fius Games"         },
];

const SUGGESTION_CARDS = [
  { icon: <Search className="w-5 h-5 text-orange-400" />, title: "Research & analysis", desc: "Deep dive into topics",     prompt: "Analyze the benefits of renewable energy" },
  { icon: <PenTool className="w-5 h-5 text-blue-400" />,  title: "Creative writing",    desc: "Stories and content",      prompt: "Write a short story about time travel" },
  { icon: <Brain className="w-5 h-5 text-purple-400" />,  title: "Brainstorm ideas",    desc: "Generate fresh concepts",  prompt: "Give me 10 creative business ideas for 2025" },
];

function uid() { return Math.random().toString(36).slice(2); }

// ─── Logo avatar ──────────────────────────────────────────────────────────────
function FiusAvatar({ size = 28 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45, background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)" }}>
      F
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce inline-block"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

// ─── Image card ───────────────────────────────────────────────────────────────
function MobileImageCard({ src, onExpand }: { src: string; onExpand: (s: string) => void }) {
  const isData = src.startsWith("data:");
  const [loaded, setLoaded] = useState(isData);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [cur, setCur] = useState(src);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    if (loaded || isData) return;
    timer.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [loaded, attempt, isData]);

  const retry = useCallback(() => {
    try {
      const u = new URL(src);
      u.searchParams.set("seed", String(Math.floor(Math.random()*9e6)+1));
      setElapsed(0); setAttempt(a => a+1); setCur(u.toString());
    } catch { setElapsed(0); setAttempt(a => a+1); }
  }, [src]);

  const dl = async () => {
    try {
      if (cur.startsWith("data:")) {
        const a = document.createElement("a"); a.href = cur; a.download = "fius-image.jpg";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        const blob = await (await fetch(cur)).blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "fius-image.jpg";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { window.open(cur, "_blank"); }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card relative" style={{ minHeight: loaded ? 0 : 160 }}>
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10">
          <div className="w-6 h-6 rounded-full border-[3px] border-zinc-300 dark:border-zinc-600 border-t-purple-400 animate-spin" />
          <p className="text-xs text-muted-foreground text-center px-4">
            {elapsed < 12 ? "Generating…" : elapsed < 28 ? `Still working… (${elapsed}s)` : "Almost ready…"}
          </p>
          {elapsed >= 20 && (
            <button onClick={retry} className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500">↺ New seed</button>
          )}
        </div>
      )}
      <img key={`${attempt}-${cur.slice(0,40)}`} src={cur} alt="Generated"
        className={`w-full h-auto ${loaded ? "block" : "hidden"} cursor-zoom-in`}
        onClick={() => onExpand(cur)}
        onLoad={() => { setLoaded(true); if (timer.current) clearInterval(timer.current); }}
        onError={() => { if (!isData) setTimeout(retry, 2500); }}
      />
      {loaded && (
        <button onClick={dl}
          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm flex items-center gap-1">
          <Download className="w-3 h-3" /> Save
        </button>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, onExpandImg }: { msg: Msg; onExpandImg: (s: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 mb-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && <div className="self-end mb-5 flex-shrink-0"><FiusAvatar size={26} /></div>}
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.isGenerating ? (
          <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-3 py-2"><TypingDots /></div>
        ) : msg.imageUrl ? (
          <MobileImageCard src={msg.imageUrl} onExpand={onExpandImg} />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "rounded-tr-sm bg-zinc-800 dark:bg-zinc-700 text-white"
              : "rounded-tl-sm bg-card border border-border text-foreground"
          }`}>
            {msg.content}
          </div>
        )}
        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{format(msg.timestamp, "h:mm a")}</span>
      </div>
    </div>
  );
}

// ─── PC-matching Input Bar ────────────────────────────────────────────────────
function PCInputBar({
  value, onChange, onSend, placeholder, isTyping, onStop,
  model, onModelClick,
  onVoiceMode, onSettings, onIntegration,
  fiusIntegrationMode,
  showExtraButtons = true,
  showEnhance = true,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  placeholder: string; isTyping: boolean; onStop: () => void;
  model?: string; onModelClick?: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
  fiusIntegrationMode?: boolean;
  showExtraButtons?: boolean;
  showEnhance?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 130) + "px";
    }
  }, [value]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop(); setIsListening(false); return;
    }
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onChange(value ? `${value} ${transcript}` : transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.start(); setIsListening(true);
  };

  const handleEnhance = async () => {
    if (!value.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) onChange(data.enhancedPrompt);
    } catch { /* silent */ } finally { setIsEnhancing(false); }
  };

  const m = MODELS.find(x => x.id === model) || MODELS[0];

  return (
    <div className="flex-shrink-0 px-3 pb-safe-bottom pb-3 pt-1.5">
      <div className="relative bg-white dark:bg-[#303030] rounded-[1.5rem] glossy-outline">
        {/* Textarea row */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent text-[15px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 130, scrollbarWidth: "none", minHeight: 28 }}
          />
        </div>

        {/* Function row */}
        <div className="flex items-center px-2 pb-2 gap-1">
          {/* LEFT: Attachment dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 flex-shrink-0">
                <img src={isDark ? attachmentDark : attachmentLight} alt="Attachment" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none text-foreground rounded-xl shadow-2xl p-1 min-w-[160px]">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10">
                <FileText className="w-4 h-4 text-zinc-400" /><span>Upload File</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10">
                <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Integration / Voice / Settings */}
          {showExtraButtons && (
            <>
              <button onClick={onIntegration}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 ${fiusIntegrationMode ? "text-blue-400 bg-blue-500/10" : "bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"}`}>
                <img src="/integration-icon.png" alt="Integration" style={{width:17,height:17}}
                  className={fiusIntegrationMode ? "" : "brightness-0 dark:brightness-200 dark:contrast-150"} />
              </button>
              <button onClick={onVoiceMode}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 flex-shrink-0">
                <AudioLines className="w-3.5 h-3.5" />
              </button>
              <button onClick={onSettings}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 flex-shrink-0">
                <img src="/settings-icon.png" alt="Settings" style={{width:16,height:16}}
                  className="brightness-0 dark:brightness-200 dark:contrast-150" />
              </button>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Model selector chip */}
          {model && onModelClick && (
            <button onClick={onModelClick}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-zinc-100 dark:bg-white/[0.07] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/12 transition-all flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
              {m.name}
            </button>
          )}

          {/* Mic */}
          <button onClick={toggleMic}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 ${
              isListening ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"
            }`}>
            {isListening
              ? <Mic className="w-4 h-4" />
              : <img src={isDark ? micDark : micLight} alt="Mic" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />
            }
          </button>

          {/* Enhance */}
          {showEnhance && (
            <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.07] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 disabled:opacity-30 flex-shrink-0">
              {isEnhancing
                ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <img src={isDark ? enhancePromptDark : enhancePromptLight} alt="Enhance" className="w-4 h-4 brightness-0 dark:brightness-200 dark:contrast-150" />
              }
            </button>
          )}

          {/* Send / Stop */}
          {isTyping ? (
            <button onClick={onStop}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 dark:bg-white transition-all active:scale-90 flex-shrink-0">
              <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
            </button>
          ) : (
            <button onClick={onSend} disabled={!value.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-90 disabled:opacity-30 flex-shrink-0">
              <ArrowUp className="w-4 h-4 text-white dark:text-black" />
            </button>
          )}
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="absolute -top-8 inset-x-0 flex justify-center">
            <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Listening...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PC-matching Floating Header ─────────────────────────────────────────────
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
  const [pill, setPill] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    const btn = tabRefs.current[idx];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPill({ left: btnRect.left - navRect.left, width: btnRect.width, ready: true });
  }, [activeTab]);

  return (
    <header className="flex-shrink-0 bg-card border border-border backdrop-blur-lg rounded-full px-3 py-2 flex items-center justify-between mx-3 mt-2 mb-1 relative z-10 glossy-outline">
      {/* Left: menu + logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onMenuClick}
          className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Menu className="w-4 h-4" />
        </button>
        <Logo size="sm" />
        <span className="font-semibold text-foreground text-sm">Fius</span>
      </div>

      {/* Center: scrollable tabs with sliding pill */}
      <div className="flex-1 overflow-x-auto mx-1" style={{ scrollbarWidth: "none" }}>
        <div ref={navRef} className="relative flex items-center gap-0.5 min-w-max mx-auto">
          {/* Sliding active pill */}
          {pill.ready && (
            <div aria-hidden style={{
              position: "absolute",
              left: pill.left,
              width: pill.width,
              top: 2, bottom: 2,
              background: theme === "dark" ? "rgba(255,255,255,0.92)" : "white",
              borderRadius: 14,
              boxShadow: theme === "dark" ? "0 1px 10px rgba(255,255,255,0.18)" : "0 1px 8px rgba(0,0,0,0.13)",
              transition: "left 0.32s cubic-bezier(0.23,1,0.32,1), width 0.32s cubic-bezier(0.23,1,0.32,1)",
              pointerEvents: "none",
              zIndex: 0,
            }} />
          )}
          {TABS.map(({ id, short, full }, i) => {
            const isActive = activeTab === id;
            const label = id === "philosopher" && user ? `Minds` : short;
            return (
              <button
                key={id}
                ref={el => { tabRefs.current[i] = el; }}
                onClick={() => onTabChange(id)}
                className={`relative z-10 flex-shrink-0 text-xs px-2.5 py-1.5 rounded-2xl transition-colors duration-200 hover:bg-transparent font-medium ${
                  isActive ? "text-zinc-900 font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: theme toggle + bell */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
          className={`w-8 h-8 flex items-center justify-center rounded-2xl border border-border transition-all hover:shadow-md ${
            theme === "dark" ? "bg-zinc-800" : theme === "light" ? "bg-yellow-50" : "bg-zinc-100 dark:bg-zinc-800"
          }`}>
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
  model, setModel, user, onVoiceMode, onSettings, onIntegration,
}: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; model: string; setModel: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string|null>(null);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Model bottom sheet */}
      {showModels && (
        <div className="fixed inset-0 z-50" onClick={() => setShowModels(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1c1c1e] rounded-t-3xl p-4 border-t border-border" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            <p className="text-sm font-bold text-foreground mb-3 px-1">Select Model</p>
            {MODELS.map(opt => (
              <button key={opt.id} onClick={() => { setModel(opt.id); setShowModels(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-colors ${opt.id === model ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/8"}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                <span className="text-sm text-foreground flex-1 text-left">{opt.name}</span>
                {opt.id === model && <Check className="w-4 h-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center min-h-full pb-6 text-center">
            <Logo size="xl" className="mb-5 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {user?.displayName ? `Welcome back, ${user.displayName}!`
                : user?.username ? `Welcome back, ${user.username}!`
                : "Welcome to Fius"}
            </h2>
            <p className="text-sm text-muted-foreground mb-7">Fly With Us!</p>
            <p className="text-xs font-semibold text-muted-foreground mb-3 tracking-wide">What's on your mind? For example:</p>
            <div className="w-full flex flex-col gap-2.5 mb-7">
              {SUGGESTION_CARDS.map((card, i) => (
                <button key={i} onClick={() => setInput(card.prompt)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card text-left active:scale-[0.98] transition-all hover:bg-accent">
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 border border-border">
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-7">
              <button onClick={onIntegration} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <img src="/integration-icon.png" alt="Integration" style={{width:22,height:22}} className="brightness-0 dark:brightness-200 dark:contrast-150" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">Integration<br/>Answer</span>
              </button>
              <button onClick={onVoiceMode} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <AudioLines className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Voice Mode</span>
              </button>
              <button onClick={onSettings} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <img src="/settings-icon.png" alt="Settings" style={{width:20,height:20}} className="brightness-0 dark:brightness-200 dark:contrast-150" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Settings</span>
              </button>
            </div>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3">
            <div className="self-end mb-5"><FiusAvatar size={26} /></div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <PCInputBar
        value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder="What do you want to know ?" isTyping={isTyping}
        model={model} onModelClick={() => setShowModels(true)}
        onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration}
      />
    </>
  );
}

// ─── Imagine Tab ──────────────────────────────────────────────────────────────
function ImagineTab({
  messages, isTyping, input, setInput, onSend,
  onVoiceMode, onSettings, onIntegration,
}: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const [style, setStyle] = useState(IMAGINE_STYLES[0]);
  const [expandImg, setExpandImg] = useState<string|null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Style pills */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border">
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {IMAGINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                style.id === s.id
                  ? "bg-foreground text-background border-transparent"
                  : "bg-accent text-muted-foreground border-border hover:text-foreground hover:bg-accent/80"
              }`}>
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/40" />
            <div>
              <p className="text-base font-semibold text-foreground">Fius Studio</p>
              <p className="text-sm text-muted-foreground mt-1">Describe what you want to see</p>
            </div>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3">
            <div className="self-end mb-5 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5 text-xs text-muted-foreground">Generating image…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <PCInputBar
        value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Just Prompt and image is in your hands!" isTyping={isTyping}
        onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration}
        showEnhance
      />
    </>
  );
}

// ─── Philosopher Tab ──────────────────────────────────────────────────────────
function PhilosopherTab({
  messages, isTyping, input, setInput, onSend, onStop,
  personality, setPersonality,
  onVoiceMode, onSettings, onIntegration,
}: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void; onStop: () => void;
  personality: Personality|null; setPersonality: (p: Personality|null) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!personality) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">Choose a mind to explore</p>
        <div className="grid grid-cols-2 gap-2.5">
          {PHILOSOPHERS.map(p => (
            <button key={p.id} onClick={() => setPersonality(p)}
              className="flex flex-col items-start gap-1 p-4 rounded-2xl border border-border bg-card text-left active:scale-[0.97] transition-all hover:bg-accent">
              <p className="text-sm font-bold text-foreground">{p.name}</p>
              <p className="text-[11px] text-muted-foreground">{p.era}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.role}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card">
        <button onClick={() => setPersonality(null)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{personality.name}</p>
          <p className="text-[11px] text-muted-foreground">{personality.era} · {personality.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl border border-border bg-card flex items-center justify-center">
              <p className="text-3xl font-bold text-foreground">{personality.name[0]}</p>
            </div>
            <p className="text-base font-bold text-foreground">{personality.name} awaits</p>
            <p className="text-sm text-muted-foreground px-8">{personality.role} · {personality.era}</p>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={() => {}} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3">
            <div className="self-end mb-5 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center flex-shrink-0 text-xs font-bold text-foreground">
              {personality.name[0]}
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <PCInputBar
        value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder={`Talk with ${personality.name}...`} isTyping={isTyping}
        showExtraButtons={false} showEnhance={false}
        onVoiceMode={onVoiceMode} onSettings={onSettings} onIntegration={onIntegration}
      />
    </>
  );
}

// ─── Nomad Tab ────────────────────────────────────────────────────────────────
function NomadTab({
  input, setInput, onSend, isTyping, responses,
  onVoiceMode, onSettings, onIntegration,
}: {
  input: string; setInput: (v: string) => void; onSend: () => void;
  isTyping: boolean;
  responses: { model: string; content: string; color: string; done: boolean }[];
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [responses]);

  const NM = [
    { key: "gpt",    label: "GPT-4o",   color: "#10b981" },
    { key: "claude", label: "Claude",   color: "#f97316" },
    { key: "gemini", label: "Gemini",   color: "#3b82f6" },
    { key: "fius",   label: "Fius",     color: "#8b5cf6" },
  ];

  return (
    <>
      <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-card">
        <div className="flex gap-1.5 flex-wrap">
          {NM.map(m => (
            <span key={m.key} className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border"
              style={{ background: `${m.color}18`, color: m.color }}>{m.label}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {responses.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/40" />
            <div>
              <p className="text-base font-semibold text-foreground">Nomad Multi-AI</p>
              <p className="text-sm text-muted-foreground mt-1">Ask once, get all perspectives</p>
            </div>
          </div>
        )}
        {responses.map((r, i) => {
          const nm = NM[i % NM.length];
          return (
            <div key={i} className="mb-3 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <span className="w-2 h-2 rounded-full" style={{ background: r.color || nm.color }} />
                <span className="text-xs font-bold text-foreground">{nm.label}</span>
                {!r.done && <div className="ml-auto w-3 h-3 rounded-full border-2 border-border border-t-foreground/60 animate-spin" />}
              </div>
              <div className="px-3 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {r.content || <span className="text-muted-foreground">Generating…</span>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <PCInputBar
        value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Ask all AIs at once…" isTyping={isTyping}
        showEnhance={false}
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

  const [profilePicture, setProfilePicture] = useState<string | undefined>(() => {
    return localStorage.getItem("profilePicture") || undefined;
  });

  // Ask
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askModel, setAskModel] = useState("fius-lite");
  const [currentConvId, setCurrentConvId] = useState<string|undefined>();
  const askAbortRef = useRef<AbortController|null>(null);

  // Imagine
  const [imagMsgs, setImagMsgs] = useState<Msg[]>([]);
  const [imagInput, setImagInput] = useState("");
  const [imagTyping, setImagTyping] = useState(false);

  // Philosopher
  const [philMsgs, setPhilMsgs] = useState<Msg[]>([]);
  const [philInput, setPhilInput] = useState("");
  const [philTyping, setPhilTyping] = useState(false);
  const [philPerson, setPhilPerson] = useState<Personality|null>(null);
  const philAbortRef = useRef<AbortController|null>(null);

  // Nomad
  const [nomadInput, setNomadInput] = useState("");
  const [nomadTyping, setNomadTyping] = useState(false);
  const [nomadRes, setNomadRes] = useState<{ model: string; content: string; color: string; done: boolean }[]>([]);

  // Build projects list for sidebar
  const projects = convList.map(c => ({
    id: c.id,
    title: c.title || "New Chat",
    createdAt: new Date(c.createdAt),
    aiRole: c.aiRole,
    isProject: c.isProject,
  }));

  const loadConv = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
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
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) {
      setCurrentConvId(newId);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      return newId;
    }
    throw new Error("Could not create conversation");
  }, [currentConvId, askModel]);

  const handleAskSend = useCallback(async () => {
    const text = askInput.trim(); if (!text || askTyping) return;
    setAskInput(""); setAskTyping(true);
    setAskMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      const convId = await ensureConv();
      const ctrl = new AbortController(); askAbortRef.current = ctrl;
      const res = await fetch("/api/test-ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "I couldn't generate a response.", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
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
      const ctrl = new AbortController(); philAbortRef.current = ctrl;
      const msg = `[Respond as ${philPerson.name}]\nSystem: You are ${philPerson.name} (${philPerson.era}), the ${philPerson.role}. Style: ${philPerson.style}. Stay fully in character.\n\nUser: ${text}`;
      const res = await fetch("/api/test-ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, activeTab: "philosopher" }), signal: ctrl.signal,
      });
      const data = await res.json();
      setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "…", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong.", timestamp: new Date() }]);
    } finally { setPhilTyping(false); }
  }, [philInput, philTyping, philPerson]);

  const handleNomadSend = useCallback(async () => {
    const text = nomadInput.trim(); if (!text || nomadTyping) return;
    setNomadInput(""); setNomadTyping(true);
    const models = [
      { id: "gpt", color: "#10b981" }, { id: "claude", color: "#f97316" },
      { id: "gemini", color: "#3b82f6" }, { id: "fius", color: "#8b5cf6" },
    ];
    setNomadRes(models.map(m => ({ model: m.id, content: "", color: m.color, done: false })));
    await Promise.allSettled(models.map(async (m, i) => {
      try {
        const res = await fetch("/api/test-ai", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, activeTab: "nomad" }),
        });
        const data = await res.json();
        setNomadRes(p => p.map((r, j) => j === i ? { ...r, content: data.response || data.message || "No response", done: true } : r));
      } catch {
        setNomadRes(p => p.map((r, j) => j === i ? { ...r, content: "Failed to get response", done: true } : r));
      }
    }));
    setNomadTyping(false);
  }, [nomadInput, nomadTyping]);

  const handleNewTab = () => {
    if (tab === "ask") handleNewChat();
    else if (tab === "imagine") { setImagMsgs([]); setImagInput(""); }
    else if (tab === "philosopher") { setPhilMsgs([]); setPhilPerson(null); setPhilInput(""); }
    else if (tab === "nomad") { setNomadRes([]); setNomadInput(""); }
  };

  const handleUserRename = useCallback((newName: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  const voiceHandlers = {
    onVoiceMode: () => setVoiceModalOpen(true),
    onSettings: () => setSettingsModalOpen(true),
    onIntegration: () => setFiusIntegrationMode(v => !v),
  };

  return (
    <TooltipProvider delayDuration={400}>
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>

      {/* Actual PC Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentConvId}
        onProjectSelect={(id) => { handleSelectConv(id); setSidebarOpen(false); }}
        onNewProject={() => { handleNewChat(); setSidebarOpen(false); }}
        onDeleteProject={handleDeleteConv}
        onEditProject={async (id, title) => {
          try {
            await apiRequest("PATCH", `/api/conversations/${id}`, { title });
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          } catch { /* silent */ }
        }}
        onUpdateAiRole={async (id, aiRole) => {
          try {
            await apiRequest("PATCH", `/api/conversations/${id}`, { aiRole });
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          } catch { /* silent */ }
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onVoiceClick={() => { setSidebarOpen(false); setVoiceModalOpen(true); }}
        onImagineClick={() => { setSidebarOpen(false); setTab("imagine"); }}
        user={user ? { email: user.email, username: user.username } : undefined}
        onUserRename={handleUserRename}
        profilePicture={profilePicture}
        onProfilePictureChange={(dataUrl) => {
          setProfilePicture(dataUrl);
          localStorage.setItem("profilePicture", dataUrl);
        }}
      />

      {/* Voice Mode Modal */}
      <VoiceModeModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

      {/* Settings / Customize Modal */}
      <CustomizeModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentPreset={"custom" as any}
        customInstructions=""
        onSave={() => setSettingsModalOpen(false)}
        toggles={{}}
        aiOrder={[]}
        user={user ? { email: user.email, username: user.username, displayName: user.displayName } : undefined}
        profilePicture={profilePicture}
        onUserRename={handleUserRename}
        onProfilePictureChange={(dataUrl) => {
          setProfilePicture(dataUrl);
          localStorage.setItem("profilePicture", dataUrl);
        }}
      />

      {/* PC-matching Floating Header */}
      <PCHeader
        activeTab={tab}
        onTabChange={setTab}
        onMenuClick={() => setSidebarOpen(true)}
        user={user}
      />

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ask" && (
          <AskTab
            messages={askMsgs} isTyping={askTyping}
            input={askInput} setInput={setAskInput}
            onSend={handleAskSend}
            onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
            model={askModel} setModel={setAskModel}
            user={user}
            {...voiceHandlers}
          />
        )}
        {tab === "imagine" && (
          <ImagineTab
            messages={imagMsgs} isTyping={imagTyping}
            input={imagInput} setInput={setImagInput}
            onSend={handleImagSend}
            {...voiceHandlers}
          />
        )}
        {tab === "philosopher" && (
          <PhilosopherTab
            messages={philMsgs} isTyping={philTyping}
            input={philInput} setInput={setPhilInput}
            onSend={handlePhilSend}
            onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
            personality={philPerson}
            setPersonality={p => { setPhilPerson(p); setPhilMsgs([]); }}
            {...voiceHandlers}
          />
        )}
        {tab === "nomad" && (
          <NomadTab
            input={nomadInput} setInput={setNomadInput}
            onSend={handleNomadSend} isTyping={nomadTyping}
            responses={nomadRes}
            {...voiceHandlers}
          />
        )}
        {tab === "games" && (
          <div className="flex-1 overflow-hidden">
            <FiusGames
              playerName={user?.displayName || user?.username || "Player"}
              userId={user?.id}
            />
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
