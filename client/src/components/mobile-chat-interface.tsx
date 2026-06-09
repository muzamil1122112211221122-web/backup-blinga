import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import {
  MessageCircle, Sparkles, Brain, Globe, Gamepad2,
  Plus, X, ArrowUp, Menu, Check, ChevronRight,
  LogOut, Trash2, Clock, Wand2, Download,
  ChevronLeft, Paperclip, Mic, AudioLines,
  Camera, FileText, Image,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import micDark from "@assets/mic_button_-_Copy_1766904971887.png";
import enhanceDark from "@assets/enhance_promt_button_-_Copy_1766904971885.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "ask" | "imagine" | "philosopher" | "nomad" | "games";

interface Msg {
  id: string; role: "user" | "ai"; content: string;
  imageUrl?: string; isGenerating?: boolean; timestamp: Date;
}
interface Conv { id: string; title: string; createdAt: string | Date; updatedAt?: string | Date; }
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

const TABS: { id: MobileTab; label: string; Icon: React.FC<any> }[] = [
  { id: "ask",         label: "Ask",    Icon: MessageCircle },
  { id: "imagine",     label: "Studio", Icon: Sparkles      },
  { id: "philosopher", label: "Minds",  Icon: Brain         },
  { id: "nomad",       label: "Nomad",  Icon: Globe         },
  { id: "games",       label: "Games",  Icon: Gamepad2      },
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
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a2e] relative" style={{ minHeight: loaded ? 0 : 160 }}>
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10">
          <div className="w-6 h-6 rounded-full border-[3px] border-zinc-600 border-t-purple-400 animate-spin" />
          <p className="text-xs text-zinc-400 text-center px-4">
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
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-card border border-border text-foreground"
          }`}>
            {msg.content}
          </div>
        )}
        <span className="text-[10px] text-zinc-500 mt-0.5 px-1">{format(msg.timestamp, "h:mm a")}</span>
      </div>
    </div>
  );
}

// ─── Full input bar — desktop-matching ────────────────────────────────────────
function InputBar({
  value, onChange, onSend, placeholder, isTyping, onStop,
  showMic = true, showEnhance = true, showAttach = true,
  model, onModelClick, onVoice,
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  placeholder: string; isTyping: boolean; onStop: () => void;
  showMic?: boolean; showEnhance?: boolean; showAttach?: boolean;
  model?: string; onModelClick?: () => void; onVoice?: () => void;
}) {
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
    <div className="flex-shrink-0 px-3 pb-3 pt-1.5">
      {/* Desktop-style dark glossy container */}
      <div className="bg-[#303030] rounded-[1.5rem]"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>

        {/* Textarea row */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent text-[16px] text-white placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 130, scrollbarWidth: "none", minHeight: 28 }}
          />
        </div>

        {/* Function row */}
        <div className="flex items-center px-2 pb-2 gap-1">
          {/* LEFT buttons */}
          {showAttach && (
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/7 hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
          )}
          {onVoice && (
            <button onClick={onVoice}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/7 hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 flex-shrink-0">
              <AudioLines className="w-4 h-4" />
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Model selector chip */}
          {model && onModelClick && (
            <button onClick={onModelClick}
              className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/7 border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/12 active:bg-white/15 transition-all flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
              {m.name}
            </button>
          )}

          {/* RIGHT: mic + enhance + send/stop */}
          {showMic && (
            <button onClick={toggleMic}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 ${
                isListening ? "bg-emerald-500/20 text-emerald-400" : "bg-white/7 hover:bg-white/12 text-zinc-400 hover:text-white"
              }`}>
              {isListening
                ? <Mic className="w-4 h-4" />
                : <img src={micDark} alt="Mic" className="w-4 h-4 brightness-200 contrast-150" />
              }
            </button>
          )}
          {showEnhance && (
            <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/7 hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 disabled:opacity-30 flex-shrink-0">
              {isEnhancing
                ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                : <img src={enhanceDark} alt="Enhance" className="w-4 h-4 brightness-200 contrast-150" />
              }
            </button>
          )}
          {isTyping ? (
            <button onClick={onStop}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white transition-all active:scale-90 flex-shrink-0">
              <div className="w-3 h-3 rounded-sm bg-black" />
            </button>
          ) : (
            <button onClick={onSend} disabled={!value.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30 flex-shrink-0"
              style={{ background: value.trim() ? "white" : "#505050" }}>
              <ArrowUp className="w-4 h-4" style={{ color: value.trim() ? "black" : "#888" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TOP Tab Bar ──────────────────────────────────────────────────────────────
function TopTabBar({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  return (
    <div className="flex-shrink-0 flex items-center border-b border-white/8 bg-[#1c1c1e] px-1"
      style={{ overflowX: "auto", scrollbarWidth: "none" }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold flex-shrink-0 border-b-2 transition-all ${
              isActive
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sidebar / Drawer ─────────────────────────────────────────────────────────
function ConvDrawer({
  open, onClose, conversations, currentId, onSelect, onNew, onDelete, onLogout, user,
}: {
  open: boolean; onClose: () => void;
  conversations: Conv[]; currentId?: string;
  onSelect: (id: string) => void; onNew: () => void;
  onDelete: (id: string) => void; onLogout: () => void;
  user?: { username: string; email: string };
}) {
  const grouped = React.useMemo(() => {
    const today: Conv[] = [], yesterday: Conv[] = [], older: Conv[] = [];
    conversations.forEach(c => {
      const d = new Date(c.updatedAt || c.createdAt);
      if (isToday(d)) today.push(c);
      else if (isYesterday(d)) yesterday.push(c);
      else older.push(c);
    });
    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: older },
    ].filter(g => g.items.length > 0);
  }, [conversations]);

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-[78vw] max-w-[290px] bg-[#1c1c1e] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <FiusAvatar size={28} />
            <span className="text-white font-bold text-base tracking-tight">Fius</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 mb-3">
          <button onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 bg-white/8 hover:bg-white/12 border border-white/10 transition-all active:scale-[0.98]">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">History</p>
          {grouped.map(group => (
            <div key={group.label} className="mb-3">
              <p className="text-[10px] font-medium text-zinc-600 px-2 mb-1">{group.label}</p>
              {group.items.map(c => (
                <div key={c.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl mb-0.5 cursor-pointer transition-colors ${c.id === currentId ? "bg-white/12 text-white" : "text-zinc-400 hover:bg-white/8 hover:text-white"}`}
                  onClick={() => { onSelect(c.id); onClose(); }}>
                  <p className="flex-1 text-xs truncate">{c.title || "New Chat"}</p>
                  <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Clock className="w-7 h-7 text-zinc-600" />
              <p className="text-xs text-zinc-500">No conversations yet</p>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/8" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {user && (
            <div className="flex items-center gap-2.5 mb-2.5 px-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {user.username.slice(0,1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Ask Tab ──────────────────────────────────────────────────────────────────
function AskTab({ messages, isTyping, input, setInput, onSend, onStop, model, setModel }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; model: string; setModel: (m: string) => void;
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
          <div className="absolute bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-3xl p-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <p className="text-sm font-bold text-white mb-3 px-1">Select Model</p>
            {MODELS.map(opt => (
              <button key={opt.id} onClick={() => { setModel(opt.id); setShowModels(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-colors ${opt.id === model ? "bg-white/10" : "hover:bg-white/8"}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                <span className="text-sm text-white flex-1 text-left">{opt.name}</span>
                {opt.id === model && <Check className="w-4 h-4 text-white/60" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <FiusAvatar size={52} />
            <div>
              <p className="text-base font-semibold text-white">Ask Fius anything</p>
              <p className="text-sm text-zinc-500 mt-1">AI answers, always at hand</p>
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

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder="What do you want to know?" isTyping={isTyping}
        model={model} onModelClick={() => setShowModels(true)}
        onVoice={() => {}} />
    </>
  );
}

// ─── Imagine Tab ──────────────────────────────────────────────────────────────
function ImagineTab({ messages, isTyping, input, setInput, onSend }: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void;
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
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-white/8">
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {IMAGINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                style.id === s.id
                  ? "bg-white text-black border-transparent"
                  : "bg-white/8 text-zinc-400 border-white/10 hover:text-white hover:bg-white/12"
              }`}>
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <Sparkles className="w-12 h-12 text-white/20" />
            <div>
              <p className="text-base font-semibold text-white">Fius Studio</p>
              <p className="text-sm text-zinc-500 mt-1">Describe what you want to see</p>
            </div>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3">
            <div className="self-end mb-5 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5 text-xs text-zinc-400">Generating image…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Just Prompt and image is in your hands!" isTyping={isTyping}
        showEnhance={true} showMic={false}
        extra={
          <div className="flex items-center gap-1.5 pb-1 px-1">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-zinc-500">{style.label} style active</span>
          </div>
        } />
    </>
  );
}

// ─── Philosopher Tab ──────────────────────────────────────────────────────────
function PhilosopherTab({ messages, isTyping, input, setInput, onSend, onStop, personality, setPersonality }: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void; onStop: () => void;
  personality: Personality|null; setPersonality: (p: Personality|null) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!personality) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest text-center mb-4">Choose a mind to explore</p>
        <div className="grid grid-cols-2 gap-2.5">
          {PHILOSOPHERS.map(p => (
            <button key={p.id} onClick={() => setPersonality(p)}
              className="flex flex-col items-start gap-1 p-4 rounded-2xl border border-white/10 bg-[#1c1c1e] text-left active:scale-[0.97] transition-all">
              <p className="text-sm font-bold text-white">{p.name}</p>
              <p className="text-[11px] text-zinc-500">{p.era}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{p.role}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-[#1c1c1e]">
        <button onClick={() => setPersonality(null)} className="text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{personality.name}</p>
          <p className="text-[11px] text-zinc-500">{personality.era} · {personality.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1c1c1e] flex items-center justify-center">
              <p className="text-3xl font-bold text-white">{personality.name[0]}</p>
            </div>
            <p className="text-base font-bold text-white">{personality.name} awaits</p>
            <p className="text-sm text-zinc-500 px-8">{personality.role} · {personality.era}</p>
          </div>
        )}
        {messages.map(m => <MsgBubble key={m.id} msg={m} onExpandImg={() => {}} />)}
        {isTyping && (
          <div className="flex gap-2 mb-3">
            <div className="self-end mb-5 w-6 h-6 rounded-full border border-white/10 bg-[#1c1c1e] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {personality.name[0]}
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2.5"><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder={`Talk with ${personality.name}...`} isTyping={isTyping}
        showEnhance={false} />
    </>
  );
}

// ─── Nomad Tab ────────────────────────────────────────────────────────────────
function NomadTab({ input, setInput, onSend, isTyping, responses }: {
  input: string; setInput: (v: string) => void; onSend: () => void;
  isTyping: boolean;
  responses: { model: string; content: string; color: string; done: boolean }[];
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
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/8">
        <div className="flex gap-1.5 flex-wrap">
          {NM.map(m => (
            <span key={m.key} className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-white/10"
              style={{ background: `${m.color}18`, color: m.color }}>{m.label}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {responses.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <Globe className="w-12 h-12 text-white/20" />
            <div>
              <p className="text-base font-semibold text-white">Nomad Multi-AI</p>
              <p className="text-sm text-zinc-500 mt-1">Ask once, get all perspectives</p>
            </div>
          </div>
        )}
        {responses.map((r, i) => {
          const nm = NM[i % NM.length];
          return (
            <div key={i} className="mb-3 rounded-2xl border border-white/10 bg-[#1c1c1e] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
                <span className="w-2 h-2 rounded-full" style={{ background: r.color || nm.color }} />
                <span className="text-xs font-bold text-white">{nm.label}</span>
                {!r.done && <div className="ml-auto w-3 h-3 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />}
              </div>
              <div className="px-3 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {r.content || <span className="text-zinc-600">Generating…</span>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Ask all AIs at once…" isTyping={isTyping}
        showMic={true} showEnhance={false} showAttach={false} />
    </>
  );
}

// ─── Extended InputBar with extra slot ───────────────────────────────────────
// Wrapper that adds the extra prop passthrough
function InputBar2({ extra, ...props }: React.ComponentProps<typeof InputBar> & { extra?: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 px-3 pb-3 pt-1.5">
      {extra}
      <div className="bg-[#303030] rounded-[1.5rem]"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
        <div className="px-4 pt-3 pb-1">
          <textarea
            value={props.value}
            onChange={e => props.onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); props.onSend(); } }}
            placeholder={props.placeholder}
            rows={1}
            className="w-full bg-transparent text-[16px] text-white placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 130, scrollbarWidth: "none", minHeight: 28 }}
          />
        </div>
        <div className="flex items-center px-2 pb-2 gap-1">
          <div className="flex-1" />
          <button onClick={props.onSend} disabled={!props.value.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30 flex-shrink-0"
            style={{ background: props.value.trim() ? "white" : "#505050" }}>
            <ArrowUp className="w-4 h-4" style={{ color: props.value.trim() ? "black" : "#888" }} />
          </button>
        </div>
      </div>
    </div>
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    if (newId) { setCurrentConvId(newId); return newId; }
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

  const tabLabel: Record<MobileTab, string> = {
    ask: "Ask Fius", imagine: "Fius Studio", philosopher: "Minds",
    nomad: "Nomad", games: "Games",
  };

  const handleNewTab = () => {
    if (tab === "ask") handleNewChat();
    else if (tab === "imagine") { setImagMsgs([]); setImagInput(""); }
    else if (tab === "philosopher") { setPhilMsgs([]); setPhilPerson(null); setPhilInput(""); }
    else if (tab === "nomad") { setNomadRes([]); setNomadInput(""); }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>

      <ConvDrawer
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        conversations={convList} currentId={currentConvId}
        onSelect={handleSelectConv} onNew={handleNewChat}
        onDelete={handleDeleteConv} onLogout={handleLogout}
        user={user}
      />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 bg-[#1c1c1e] border-b border-white/8" style={{ height: 50 }}>
        <button onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-white/60 hover:bg-white/12 active:bg-white/15 transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <FiusAvatar size={22} />
          <span className="font-bold text-white text-sm tracking-tight">{tabLabel[tab]}</span>
        </div>

        {tab !== "games" ? (
          <button onClick={handleNewTab}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-white/60 hover:bg-white/12 active:bg-white/15 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        ) : <div className="w-9 h-9" />}
      </div>

      {/* TOP Tab Bar */}
      <TopTabBar active={tab} onChange={setTab} />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ask" && (
          <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
            onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
            model={askModel} setModel={setAskModel} />
        )}
        {tab === "imagine" && (
          <ImagineTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput} onSend={handleImagSend} />
        )}
        {tab === "philosopher" && (
          <PhilosopherTab messages={philMsgs} isTyping={philTyping} input={philInput} setInput={setPhilInput}
            onSend={handlePhilSend} onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
            personality={philPerson} setPersonality={p => { setPhilPerson(p); setPhilMsgs([]); }} />
        )}
        {tab === "nomad" && (
          <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
            isTyping={nomadTyping} responses={nomadRes} />
        )}
        {tab === "games" && (
          <div className="flex-1 overflow-hidden">
            <FiusGames playerName={user?.displayName || user?.username || "Player"} userId={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
}
