import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import {
  MessageCircle, Sparkles, Brain, Globe, Gamepad2,
  Plus, X, ArrowUp, Mic, MicOff, ImageIcon,
  LogOut, Settings, Trash2, ChevronRight, Wand2,
  RotateCcw, Download, Check, StopCircle, Clock,
  Menu, Search,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "ask" | "imagine" | "philosopher" | "nomad" | "games";

interface Msg {
  id: string;
  role: "user" | "ai";
  content: string;
  imageUrl?: string;
  isGenerating?: boolean;
  timestamp: Date;
}

interface Conv {
  id: string;
  title: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface Personality {
  id: string;
  name: string;
  era: string;
  role: string;
  emoji: string;
  accent: string;
  bio: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MODELS = [
  { id: "fius-lite",    name: "Fius Lite",   dot: "#6366f1" },
  { id: "fius-prime",   name: "Fius Pro",    dot: "#8b5cf6" },
  { id: "gpt-4o",       name: "GPT-4o",      dot: "#10b981" },
  { id: "claude-sonnet","name": "Claude 3.5",dot: "#f97316" },
  { id: "gemini-pro",   name: "Gemini Pro",  dot: "#3b82f6" },
];

const PERSONALITIES: Personality[] = [
  { id:"socrates",        name:"Socrates",         era:"470–399 BC",   role:"Philosopher",         emoji:"🏛️", accent:"#6366f1", bio:"Father of Western philosophy, master of dialogue." },
  { id:"nietzsche",       name:"Nietzsche",         era:"1844–1900",    role:"Philosopher",         emoji:"⚡", accent:"#ec4899", bio:"Will to power, eternal recurrence, Übermensch." },
  { id:"einstein",        name:"Einstein",           era:"1879–1955",    role:"Physicist",           emoji:"🔭", accent:"#3b82f6", bio:"Relativity, imagination over knowledge." },
  { id:"lao-tzu",         name:"Lao Tzu",            era:"6th century BC",role:"Philosopher",        emoji:"☯️", accent:"#10b981", bio:"Author of Tao Te Ching, founder of Taoism." },
  { id:"aristotle",       name:"Aristotle",          era:"384–322 BC",   role:"Philosopher",         emoji:"🌿", accent:"#f59e0b", bio:"Logic, ethics, politics, and the good life." },
  { id:"marcus-aurelius", name:"Marcus Aurelius",    era:"121–180 AD",   role:"Stoic Emperor",       emoji:"⚔️", accent:"#8b5cf6", bio:"Meditations — virtue, duty, and inner peace." },
  { id:"cleopatra",       name:"Cleopatra",          era:"69–30 BC",     role:"Queen of Egypt",      emoji:"👑", accent:"#f43f5e", bio:"Genius ruler, diplomat, and scholar." },
  { id:"tesla",           name:"Nikola Tesla",       era:"1856–1943",    role:"Inventor",            emoji:"⚡", accent:"#06b6d4", bio:"AC electricity, wireless transmission, visionary." },
];

const IMAGINE_STYLES = [
  { id:"photorealistic", label:"Photo",   emoji:"📷", suffix:", photorealistic, ultra detailed, 8k" },
  { id:"anime",          label:"Anime",   emoji:"✨", suffix:", anime art style, manga, japanese animation, studio ghibli inspired" },
  { id:"digital-art",    label:"Digital", emoji:"🎨", suffix:", digital art, concept art, vibrant colors, trending on artstation" },
  { id:"oil-painting",   label:"Painting",emoji:"🖌️", suffix:", oil painting, impressionist, classical art style, museum quality" },
  { id:"sketch",         label:"Sketch",  emoji:"✏️", suffix:", pencil sketch, fine line art, black and white illustration" },
  { id:"3d-render",      label:"3D",      emoji:"🔮", suffix:", 3d render, octane render, cinematic lighting, ultra realistic" },
];

const TABS = [
  { id:"ask"        as MobileTab, label:"Ask",     Icon:MessageCircle, color:"#6366f1" },
  { id:"imagine"    as MobileTab, label:"Imagine", Icon:Sparkles,      color:"#a855f7" },
  { id:"philosopher"as MobileTab, label:"Philos",  Icon:Brain,         color:"#ec4899" },
  { id:"nomad"      as MobileTab, label:"Nomad",   Icon:Globe,         color:"#3b82f6" },
  { id:"games"      as MobileTab, label:"Games",   Icon:Gamepad2,      color:"#10b981" },
];

// ─── Small Helpers ────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#3b82f6","#10b981","#f59e0b","#ef4444","#06b6d4"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-white text-xs select-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  );
}

// Inline image card for imagine messages
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
      const ms = ["flux","turbo","flux-schnell"];
      u.searchParams.set("model", ms[Math.floor(Math.random()*ms.length)]);
      setElapsed(0); setAttempt(a=>a+1); setCur(u.toString());
    } catch { setElapsed(0); setAttempt(a=>a+1); }
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
    } catch { window.open(cur,"_blank"); }
  };

  const statusMsg = elapsed < 12 ? "Fius Studio is generating…"
    : elapsed < 28 ? `Still working… (${elapsed}s)` : `Almost ready… retrying soon`;

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-zinc-50 relative" style={{ minHeight: loaded ? 0 : 180 }}>
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-12">
          <div className="w-7 h-7 rounded-full border-[3px] border-purple-200 border-t-purple-500 animate-spin" />
          <p className="text-xs text-zinc-500 font-medium text-center px-4">{statusMsg}</p>
          {elapsed >= 20 && (
            <button onClick={retry} className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>↺ New seed</button>
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
          className="absolute bottom-2 right-2 bg-black/55 hover:bg-black/75 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm transition-colors">
          ⬇ Save
        </button>
      )}
    </div>
  );
}

// ─── Conversation Drawer ──────────────────────────────────────────────────────
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
      { label: "Older", items: older },
    ].filter(g => g.items.length > 0);
  }, [conversations]);

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose} />
      {/* Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[320px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <span className="text-white font-bold text-sm">f</span>
            </div>
            <span className="font-bold text-zinc-900 text-base tracking-tight">Fius</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-4 pt-3 pb-2">
          <button onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {grouped.map(group => (
            <div key={group.label} className="mb-3">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide px-1 mb-1.5">{group.label}</p>
              {group.items.map(c => (
                <div key={c.id} className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl mb-0.5 cursor-pointer transition-colors ${c.id === currentId ? "bg-indigo-50" : "hover:bg-zinc-50"}`}
                  onClick={() => { onSelect(c.id); onClose(); }}>
                  <div className={`flex-1 min-w-0`}>
                    <p className={`text-sm truncate ${c.id === currentId ? "text-indigo-700 font-semibold" : "text-zinc-800 font-medium"}`}>{c.title || "New Chat"}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-400 transition-all flex-shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <Clock className="w-8 h-8 text-zinc-300" />
              <p className="text-sm text-zinc-400">No conversations yet</p>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-zinc-100" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={user.username} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{user.username}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  return (
    <div className="flex-shrink-0 border-t border-zinc-100 bg-white/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center">
        {TABS.map(({ id, label, Icon, color }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 transition-all active:scale-90"
              style={{ minHeight: 56 }}>
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
                style={{ background: isActive ? `${color}18` : "transparent" }}>
                <Icon className="w-5 h-5 transition-colors duration-200"
                  style={{ color: isActive ? color : "#9ca3af" }} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: color }} />
                )}
              </div>
              <span className="text-[10px] font-semibold transition-colors duration-200"
                style={{ color: isActive ? color : "#9ca3af" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, aiName = "Fius", onExpandImg }: {
  msg: Msg; aiName?: string; onExpandImg: (s: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center self-end mb-0.5"
          style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <span className="text-white font-bold text-[11px]">f</span>
        </div>
      )}
      <div className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.isGenerating ? (
          <div className="rounded-2xl rounded-bl-sm bg-white border border-zinc-100 shadow-sm px-1 py-1">
            <TypingDots />
          </div>
        ) : msg.imageUrl ? (
          <MobileImageCard src={msg.imageUrl} onExpand={onExpandImg} />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isUser
              ? "rounded-tr-sm text-white"
              : "rounded-tl-sm bg-white border border-zinc-100 text-zinc-800"
          }`}
            style={isUser ? { background:"linear-gradient(135deg,#18181b,#27272a)" } : undefined}>
            {msg.content}
          </div>
        )}
        <span className="text-[10px] text-zinc-400 mt-1 px-1">
          {format(msg.timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}

// ─── Input Bar ────────────────────────────────────────────────────────────────
function InputBar({
  value, onChange, onSend, placeholder, isTyping, onStop,
  right,
}: {
  value: string; onChange: (v: string) => void;
  onSend: () => void; placeholder: string;
  isTyping: boolean; onStop: () => void;
  right?: React.ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-zinc-100 px-3 py-2">
      <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2" style={{ minHeight: 46 }}>
        {right && <div className="flex-shrink-0 self-end mb-0.5">{right}</div>}
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none leading-normal"
          style={{ maxHeight: 120, scrollbarWidth: "none" }}
        />
        {isTyping ? (
          <button onClick={onStop}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 self-end transition-all active:scale-90">
            <StopCircle className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={onSend}
            disabled={!value.trim()}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full self-end transition-all active:scale-90 disabled:opacity-30"
            style={{ background: value.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#e4e4e7" }}>
            <ArrowUp className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ask Tab ─────────────────────────────────────────────────────────────────
function AskTab({
  messages, isTyping, input, setInput, onSend, onStop, model, setModel, convId,
}: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; model: string; setModel: (m: string) => void;
  convId?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string|null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const m = MODELS.find(m => m.id === model) || MODELS[0];

  return (
    <>
      {/* Fullscreen image lightbox */}
      {expandImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button onClick={() => setExpandImg(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Model picker sheet */}
      {showModelPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-4"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
            <p className="text-sm font-bold text-zinc-800 mb-3 px-1">Choose Model</p>
            {MODELS.map(opt => (
              <button key={opt.id} onClick={() => { setModel(opt.id); setShowModelPicker(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors active:bg-zinc-100"
                style={{ background: opt.id === model ? "#f5f3ff" : "transparent" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                <span className="text-sm font-medium text-zinc-800 flex-1 text-left">{opt.name}</span>
                {opt.id === model && <Check className="w-4 h-4 text-indigo-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-header: model selector */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-50 flex items-center gap-2">
        <button onClick={() => setShowModelPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 active:bg-zinc-100 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
          {m.name}
          <ChevronRight className="w-3 h-3 text-zinc-400 rotate-90" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <span className="text-white font-bold text-2xl">f</span>
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900">Ask Fius anything</p>
              <p className="text-sm text-zinc-400 mt-1">AI-powered answers, always at hand</p>
            </div>
          </div>
        )}
        {messages.map(m => (
          <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />
        ))}
        {isTyping && (
          <div className="flex gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center self-end mb-0.5 flex-shrink-0"
              style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <span className="text-white font-bold text-[11px]">f</span>
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-100 shadow-sm px-1 py-1">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder="Ask anything…" isTyping={isTyping} />
    </>
  );
}

// ─── Imagine Tab ──────────────────────────────────────────────────────────────
function ImagineTab({
  messages, isTyping, input, setInput, onSend,
}: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void;
}) {
  const [style, setStyle] = useState(IMAGINE_STYLES[0]);
  const [expandImg, setExpandImg] = useState<string|null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button onClick={() => setExpandImg(null)} className="absolute top-4 right-4 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Style pills */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-zinc-50">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
          {IMAGINE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${style.id === s.id ? "text-white border-transparent" : "text-zinc-600 border-zinc-200 bg-zinc-50"}`}
              style={style.id === s.id ? { background:"linear-gradient(135deg,#a855f7,#7c3aed)", borderColor:"transparent" } : {}}>
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior:"contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900">Fius Studio</p>
              <p className="text-sm text-zinc-400 mt-1">Describe what you want to see</p>
            </div>
          </div>
        )}
        {messages.map(m => (
          <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} />
        ))}
        {isTyping && (
          <div className="flex gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center self-end flex-shrink-0" style={{ background:"linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-100 shadow-sm px-4 py-2.5">
              <p className="text-xs text-zinc-500 font-medium">Generating your image…</p>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Describe an image…" isTyping={isTyping}
        right={
          <div className="flex items-center justify-center w-5 h-5 text-purple-500 self-center">
            <Wand2 className="w-4 h-4" />
          </div>
        }
      />
    </>
  );
}

// ─── Philosopher Tab ──────────────────────────────────────────────────────────
function PhilosopherTab({
  messages, isTyping, input, setInput, onSend, onStop,
  personality, setPersonality,
}: {
  messages: Msg[]; isTyping: boolean; input: string;
  setInput: (v: string) => void; onSend: () => void; onStop: () => void;
  personality: Personality|null; setPersonality: (p: Personality|null) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandImg] = useState<string|null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  if (!personality) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior:"contain" }}>
        <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-6 mt-2">Choose a mind to explore</p>
        <div className="grid grid-cols-2 gap-3">
          {PERSONALITIES.map(p => (
            <button key={p.id} onClick={() => setPersonality(p)}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm text-left active:scale-[0.97] transition-all"
              style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background:`${p.accent}18` }}>
                {p.emoji}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{p.name}</p>
                <p className="text-[11px] text-zinc-400 leading-snug">{p.era}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug line-clamp-2">{p.bio}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Personality sub-header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-50 bg-white">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background:`${personality.accent}18` }}>
          {personality.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900">{personality.name}</p>
          <p className="text-[11px] text-zinc-400">{personality.era} · {personality.role}</p>
        </div>
        <button onClick={() => setPersonality(null)}
          className="px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 hover:bg-zinc-200 transition-colors">
          Change
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior:"contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
            <div className="text-4xl">{personality.emoji}</div>
            <p className="text-base font-bold text-zinc-900">{personality.name} awaits you</p>
            <p className="text-sm text-zinc-400 px-8">{personality.bio}</p>
          </div>
        )}
        {messages.map(m => (
          <MsgBubble key={m.id} msg={m} aiName={personality.name} onExpandImg={() => {}} />
        ))}
        {isTyping && (
          <div className="flex gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0 self-end"
              style={{ background:`${personality.accent}18` }}>
              {personality.emoji}
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-zinc-100 shadow-sm px-1 py-1">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={onStop}
        placeholder={`Talk with ${personality.name}…`} isTyping={isTyping} />
    </>
  );
}

// ─── Nomad Tab ────────────────────────────────────────────────────────────────
function NomadTab({
  input, setInput, onSend, isTyping,
  responses,
}: {
  input: string; setInput: (v: string) => void; onSend: () => void;
  isTyping: boolean;
  responses: { model: string; content: string; color: string; done: boolean }[];
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [responses]);

  const NOMAD_MODELS = [
    { id:"gpt-4o",       label:"GPT-4o",    color:"#10b981" },
    { id:"claude",       label:"Claude",    color:"#f97316" },
    { id:"gemini-pro",   label:"Gemini",    color:"#3b82f6" },
    { id:"fius-lite",    label:"Fius",      color:"#6366f1" },
  ];

  return (
    <>
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-zinc-50">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Comparing all AI responses</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior:"contain" }}>
        {responses.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900">Nomad Multi-AI</p>
              <p className="text-sm text-zinc-400 mt-1">Ask once, see all AI perspectives</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {NOMAD_MODELS.map(m => (
                <span key={m.id} className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: m.color }}>{m.label}</span>
              ))}
            </div>
          </div>
        )}
        {responses.map((r, i) => {
          const nm = NOMAD_MODELS.find(m => r.model.includes(m.id) || r.model === m.id) || NOMAD_MODELS[i % NOMAD_MODELS.length];
          return (
            <div key={i} className="mb-4 rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden"
              style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-50">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color || nm.color }} />
                <span className="text-xs font-bold text-zinc-700">{nm.label}</span>
                {!r.done && <div className="ml-auto w-3 h-3 rounded-full border-2 border-zinc-200 border-t-indigo-500 animate-spin" />}
              </div>
              <div className="px-3 py-3 text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                {r.content || <span className="text-zinc-400">Generating…</span>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <InputBar value={input} onChange={setInput} onSend={onSend} onStop={() => {}}
        placeholder="Ask all AIs at once…" isTyping={isTyping} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MobileChatInterface({ onShowAuth }: { onShowAuth: () => void }) {
  const { toast } = useToast();

  // Auth
  const { data: user } = useQuery<{ username: string; email: string; id: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Conversations
  const { data: convList = [] } = useQuery<Conv[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // ── UI state
  const [tab, setTab] = useState<MobileTab>("ask");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Ask tab state
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askModel, setAskModel] = useState("fius-lite");
  const [currentConvId, setCurrentConvId] = useState<string|undefined>(undefined);
  const askAbortRef = useRef<AbortController|null>(null);

  // ── Imagine tab state
  const [imagMsgs, setImagMsgs] = useState<Msg[]>([]);
  const [imagInput, setImagInput] = useState("");
  const [imagTyping, setImagTyping] = useState(false);

  // ── Philosopher tab state
  const [philMsgs, setPhilMsgs] = useState<Msg[]>([]);
  const [philInput, setPhilInput] = useState("");
  const [philTyping, setPhilTyping] = useState(false);
  const [philPersonality, setPhilPersonality] = useState<Personality|null>(null);
  const philAbortRef = useRef<AbortController|null>(null);

  // ── Nomad tab state
  const [nomadInput, setNomadInput] = useState("");
  const [nomadTyping, setNomadTyping] = useState(false);
  const [nomadResponses, setNomadResponses] = useState<{ model: string; content: string; color: string; done: boolean }[]>([]);

  // ── Shared
  const [imagine_style] = useState(IMAGINE_STYLES[0]);

  // ─── Load conversation messages ───────────────────────────────────────────
  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAskMsgs(data.map((m: any) => ({
          id: m.id || uid(),
          role: m.role === "assistant" ? "ai" : m.role,
          content: m.content,
          timestamp: new Date(m.createdAt || Date.now()),
        })));
      }
    } catch { /* silent */ }
  }, []);

  const handleSelectConv = useCallback((id: string) => {
    setCurrentConvId(id);
    setAskMsgs([]);
    setTab("ask");
    loadConversation(id);
  }, [loadConversation]);

  const handleNewChat = useCallback(() => {
    setCurrentConvId(undefined);
    setAskMsgs([]);
    setAskInput("");
    setTab("ask");
  }, []);

  const handleDeleteConv = useCallback(async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (id === currentConvId) handleNewChat();
    } catch { /* silent */ }
  }, [currentConvId, handleNewChat]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch { onShowAuth(); }
  }, [onShowAuth]);

  // ─── Ensure a conversation exists ────────────────────────────────────────
  const ensureConv = useCallback(async (): Promise<string> => {
    if (currentConvId) return currentConvId;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat", model: askModel }),
    });
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) { setCurrentConvId(newId); return newId; }
    throw new Error("Could not create conversation");
  }, [currentConvId, askModel]);

  // ─── Ask: send ───────────────────────────────────────────────────────────
  const handleAskSend = useCallback(async () => {
    const text = askInput.trim();
    if (!text || askTyping) return;
    setAskInput("");
    setAskTyping(true);

    const userMsg: Msg = { id: uid(), role: "user", content: text, timestamp: new Date() };
    setAskMsgs(p => [...p, userMsg]);

    try {
      const convId = await ensureConv();
      const ctrl = new AbortController();
      askAbortRef.current = ctrl;

      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      const aiMsg: Msg = {
        id: uid(), role: "ai",
        content: data.response || data.message || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };
      setAskMsgs(p => [...p, aiMsg]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        const errMsg: Msg = { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() };
        setAskMsgs(p => [...p, errMsg]);
      }
    } finally {
      setAskTyping(false);
    }
  }, [askInput, askTyping, ensureConv]);

  // ─── Imagine: send ────────────────────────────────────────────────────────
  const handleImagSend = useCallback(async () => {
    const text = imagInput.trim();
    if (!text || imagTyping) return;
    setImagInput("");
    setImagTyping(true);

    const userMsg: Msg = { id: uid(), role: "user", content: text, timestamp: new Date() };
    setImagMsgs(p => [...p, userMsg]);

    try {
      const fullPrompt = `${text}${imagine_style.suffix}`;
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, size: "1024x1024", quality: "standard" }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        const aiMsg: Msg = { id: uid(), role: "ai", content: "", imageUrl: data.url, timestamp: new Date() };
        setImagMsgs(p => [...p, aiMsg]);
      } else {
        setImagMsgs(p => [...p, { id: uid(), role: "ai", content: "Image generation failed. Please try again.", timestamp: new Date() }]);
      }
    } catch {
      setImagMsgs(p => [...p, { id: uid(), role: "ai", content: "Image generation failed. Please try again.", timestamp: new Date() }]);
    } finally {
      setImagTyping(false);
    }
  }, [imagInput, imagTyping, imagine_style]);

  // ─── Philosopher: send ────────────────────────────────────────────────────
  const handlePhilSend = useCallback(async () => {
    const text = philInput.trim();
    if (!text || philTyping || !philPersonality) return;
    setPhilInput("");
    setPhilTyping(true);

    const userMsg: Msg = { id: uid(), role: "user", content: text, timestamp: new Date() };
    setPhilMsgs(p => [...p, userMsg]);

    try {
      const ctrl = new AbortController();
      philAbortRef.current = ctrl;
      const sysPrompt = `You are ${philPersonality.name} (${philPersonality.era}), the ${philPersonality.role}. ${philPersonality.bio} Respond in their voice, style, and philosophical worldview. Stay in character.`;
      const messageWithContext = `[Respond as ${philPersonality.name} — ${philPersonality.role}]\n\nSystem: ${sysPrompt}\n\nUser: ${text}`;

      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageWithContext, activeTab: "philosopher" }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      setPhilMsgs(p => [...p, {
        id: uid(), role: "ai",
        content: data.response || data.message || "…",
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
      }
    } finally {
      setPhilTyping(false);
    }
  }, [philInput, philTyping, philPersonality]);

  // ─── Nomad: send ──────────────────────────────────────────────────────────
  const handleNomadSend = useCallback(async () => {
    const text = nomadInput.trim();
    if (!text || nomadTyping) return;
    setNomadInput("");
    setNomadTyping(true);
    const models = [
      { id:"gpt-4o",    color:"#10b981" },
      { id:"claude-3-5-sonnet-20241022", color:"#f97316" },
      { id:"gemini-pro",color:"#3b82f6" },
      { id:"fius-lite", color:"#6366f1" },
    ];
    setNomadResponses(models.map(m => ({ model: m.id, content: "", color: m.color, done: false })));

    await Promise.allSettled(models.map(async (m, i) => {
      try {
        const res = await fetch("/api/test-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, activeTab: "nomad" }),
        });
        const data = await res.json();
        setNomadResponses(p => p.map((r, j) => j === i ? { ...r, content: data.response || data.message || "No response", done: true } : r));
      } catch {
        setNomadResponses(p => p.map((r, j) => j === i ? { ...r, content: "Failed to get response", done: true } : r));
      }
    }));
    setNomadTyping(false);
  }, [nomadInput, nomadTyping]);

  // ─── Header labels ─────────────────────────────────────────────────────────
  const tabLabel: Record<MobileTab, string> = {
    ask: "Ask Fius", imagine: "Studio", philosopher: "Philosopher",
    nomad: "Nomad", games: "Games",
  };
  const tabColor: Record<MobileTab, string> = {
    ask: "#6366f1", imagine: "#a855f7", philosopher: "#ec4899",
    nomad: "#3b82f6", games: "#10b981",
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>

      {/* Conversation Drawer */}
      <ConvDrawer
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        conversations={convList} currentId={currentConvId}
        onSelect={handleSelectConv} onNew={handleNewChat}
        onDelete={handleDeleteConv} onLogout={handleLogout}
        user={user}
      />

      {/* ── Top Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-zinc-100"
        style={{ height: 56 }}>
        <button onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 active:bg-zinc-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${tabColor[tab]}, ${tabColor[tab]}aa)` }}>
            <span className="text-white font-bold text-xs">f</span>
          </div>
          <span className="font-bold text-zinc-900 text-sm tracking-tight">{tabLabel[tab]}</span>
        </div>

        {(tab === "ask" || tab === "imagine" || tab === "philosopher") && (
          <button onClick={() => {
            if (tab === "ask") handleNewChat();
            else if (tab === "imagine") { setImagMsgs([]); setImagInput(""); }
            else if (tab === "philosopher") { setPhilMsgs([]); setPhilPersonality(null); setPhilInput(""); }
          }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 active:bg-zinc-100 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
        {tab !== "ask" && tab !== "imagine" && tab !== "philosopher" && (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ask" && (
          <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
            onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
            model={askModel} setModel={setAskModel} convId={currentConvId} />
        )}
        {tab === "imagine" && (
          <ImagineTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput} onSend={handleImagSend} />
        )}
        {tab === "philosopher" && (
          <PhilosopherTab messages={philMsgs} isTyping={philTyping} input={philInput} setInput={setPhilInput}
            onSend={handlePhilSend} onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
            personality={philPersonality} setPersonality={p => { setPhilPersonality(p); setPhilMsgs([]); }} />
        )}
        {tab === "nomad" && (
          <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
            isTyping={nomadTyping} responses={nomadResponses} />
        )}
        {tab === "games" && (
          <div className="flex-1 overflow-hidden">
            <FiusGames playerName={user?.username || "Player"} userId={user?.id} />
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
