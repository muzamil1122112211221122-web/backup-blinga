import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/queryClient';
import { useTheme } from './theme-provider';
import { ArrowUp, ChevronRight, ChevronDown, FlaskConical, Zap, RotateCcw, Minus, Plus, Trash2, Maximize2, Pencil, FileDown, X, Filter as FilterIcon, Check } from 'lucide-react';
import microphoneIcon from "@assets/microphone_1784996715112.png";
import improvePromptIcon from "@assets/improve_promt__1784996516976.png";
import plusButtonIcon from "@assets/add_1784996715112.png";
import { FiusLogo } from './logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import normalLabWhiteIcon from '@assets/normal_lab_white_theme_1784982983175.png';
import superLabWhiteIcon from '@assets/super_lab_white_theme_1784982983174.png';
import normalLabDarkIcon from '@assets/normal_lab_dark_theme_1784983374592.png';
import superLabDarkIcon from '@assets/super_lab_dark_theme_1784983374593.png';
import fiusLabLogoWhite from '@assets/fius_lab_logo_white_theme_1784984081369.png';
import fiusLabLogoDark from '@assets/fius_lab_logo_dark_theme_1784984081368.png';

// ── Storage keys ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'fius_labs_onboarded';
const PREFS_KEY   = 'fius_labs_prefs';

// ── Onboarding questions ────────────────────────────────────────────────────
const ONBOARDING_QUESTIONS = [
  { id: 'name',      text: "What's your name? I'll use it to address you.",           placeholder: 'e.g. Ali, Sara…' },
  { id: 'field',     text: 'What field or profession are you in?',                     placeholder: 'e.g. Student, Developer, Designer…' },
  { id: 'expertise', text: 'How experienced are you in your field?',                   placeholder: 'Beginner / Intermediate / Expert' },
  { id: 'topics',    text: 'What topics excite you the most? List a few.',             placeholder: 'e.g. AI, Space, History, Games…' },
  { id: 'avoid',     text: "Any topics you'd rather not discuss?",                     placeholder: 'e.g. Politics, Horror…' },
  { id: 'style',     text: 'Prefer AI responses short & punchy, or detailed?',        placeholder: 'Short / Detailed / Balanced' },
  { id: 'tone',      text: 'What tone do you like — casual, professional, academic?', placeholder: 'Casual / Professional / Academic' },
  { id: 'lang',      text: 'What language do you prefer for responses?',              placeholder: 'English, Urdu, Arabic…' },
  { id: 'goal',      text: "What's your main goal when using an AI assistant?",       placeholder: 'Learning, Productivity, Coding…' },
  { id: 'creative',  text: 'Are you more creative or analytical? Or both?',           placeholder: 'Creative / Analytical / Both' },
  { id: 'usecase',   text: 'What will you mostly use Fius Labs for?',                 placeholder: 'Research, Writing, Coding, Chatting…' },
  { id: 'humor',     text: 'Do you like a touch of humor in responses?',              placeholder: 'Yes / No / Sometimes' },
  { id: 'depth',     text: 'When learning, do you prefer examples first or theory?',  placeholder: 'Examples / Theory / Mixed' },
  { id: 'time',      text: 'Quick sessions or long deep-dive work?',                  placeholder: 'Quick / Long / Both' },
  { id: 'extra',     text: 'Anything else you want me to know? (optional)',            placeholder: 'Feel free to share anything…' },
];

// ── Model definitions ───────────────────────────────────────────────────────
interface ModelDef {
  id: string; name: string; description: string; logo: string; color: string; provider: string;
}

const NORMAL_MODELS: ModelDef[] = [
  { id: 'fius-lite',  name: 'Fius Lite', description: 'Fast & efficient for everyday tasks',  logo: '/fius-logo.png', color: '#a855f7', provider: 'fius' },
  { id: 'fius-prime', name: 'Fius Pro',  description: 'Most advanced general AI by Fius',     logo: '/fius-logo.png', color: '#7c3aed', provider: 'fius' },
];

// Normal Lab: 4 slots — alternate Lite / Pro
const NORMAL_DEFAULT_SLOTS: ModelDef[] = [
  NORMAL_MODELS[0], NORMAL_MODELS[1], NORMAL_MODELS[0], NORMAL_MODELS[1],
];

const SUPER_MODELS: ModelDef[] = [
  { id: 'fius-ai',           name: 'Fius Lite',         description: 'Fast & efficient, powered by Fius',            logo: '/fius-logo.png',       color: '#a855f7', provider: 'fius'       },
  { id: 'fius-prime',        name: 'Fius Pro',          description: 'Most advanced general AI by Fius',             logo: '/fius-logo.png',       color: '#7c3aed', provider: 'fius'       },
  { id: 'gpt-4o',            name: 'GPT-5 mini',        description: 'Advanced reasoning & multimodal AI by OpenAI', logo: '/chatgpt-logo.png',    color: '#10a37f', provider: 'openai'     },
  { id: 'claude-3.5-sonnet', name: 'Claude Haiku 4.5',  description: 'Nuanced writing, analysis & coding by Anthropic', logo: '/claude-logo.png',  color: '#f97316', provider: 'anthropic'  },
  { id: 'gemini-pro',        name: 'Gemini Flash-Lite', description: "Google's multimodal reasoning model",          logo: '/gemini-logo.png',     color: '#14b8a6', provider: 'google'     },
  { id: 'grok-4',            name: 'Grok Build 0.1',   description: "xAI's witty, curious & unfiltered model",      logo: '/grok-logo.png',       color: '#6b7280', provider: 'xai'        },
  { id: 'deepseek-r1',       name: 'DeepSeek V4 Flash', description: 'Open-source reasoning & coding powerhouse',    logo: '/deepseek-logo.png',   color: '#3b82f6', provider: 'deepseek'   },
  { id: 'doubao',            name: 'Doubao Seed 2.0',  description: "ByteDance's multilingual smart assistant",      logo: '/bytedance-logo.png',  color: '#f59e0b', provider: 'bytedance'  },
  { id: 'kimi',              name: 'Kimi K2.6',        description: "Moonshot's long-context language model",        logo: '/perplexity-logo.png', color: '#06b6d4', provider: 'moonshot'   },
  { id: 'qwen',              name: 'Qwen Flash',       description: "Alibaba's multilingual language expert",        logo: '/mistral-logo.png',    color: '#6366f1', provider: 'alibaba'    },
  { id: 'llama-4',           name: 'Llama 4 Scout',    description: "Meta's open-source frontier AI model",          logo: '/meta-ai-logo.png',    color: '#3b82f6', provider: 'meta'       },
  { id: 'mistral',           name: 'Ministral 3',      description: 'Fast & efficient European open AI',             logo: '/doubao-logo.png',     color: '#7c3aed', provider: 'mistral'    },
  { id: 'perplexity',        name: 'Perplexity Sonar', description: 'Real-time web search & cited answers',          logo: '/kimi-logo.png',       color: '#38bdf8', provider: 'perplexity' },
  { id: 'copilot',           name: 'Copilot',          description: "Microsoft's AI powered by OpenAI models",       logo: '/copilot-logo.png',    color: '#0078d4', provider: 'microsoft'  },
];

// ── Model category tags (for picker filter tabs) ─────────────────────────────
const MODEL_TAGS: Record<string, string[]> = {
  'fius-ai':           ['popular'],
  'fius-prime':        ['popular', 'flagship', 'intelligent'],
  'gpt-4o':            ['popular', 'flagship'],
  'claude-3.5-sonnet': ['popular', 'flagship', 'intelligent'],
  'gemini-pro':        ['popular', 'latest'],
  'grok-4':            ['flagship', 'intelligent', 'latest'],
  'deepseek-r1':       ['flagship', 'intelligent', 'latest'],
  'doubao':            ['flagship', 'latest'],
  'kimi':              ['intelligent', 'latest'],
  'qwen':              ['intelligent'],
  'llama-4':           ['latest'],
  'mistral':           ['popular'],
  'perplexity':        ['popular'],
  'copilot':           ['latest'],
};

// ── Types ───────────────────────────────────────────────────────────────────
type Msg = { id: string; role: 'user' | 'assistant'; content: string };
type LabMode = 'normal' | 'super';

interface FiusLabsProps {
  user?: { displayName?: string | null; username?: string; id?: number | string } | null;
}

// ── Build system prompt ─────────────────────────────────────────────────────
function buildSysPrompt(prefs: Record<string, string>, modelName: string) {
  const p = (k: string) => prefs[k] || '';
  return [
    `You are ${modelName}, an AI inside Fius Labs.`,
    p('name')    && `The user's name is ${p('name')}.`,
    p('field')   && `Their field: ${p('field')}.`,
    p('topics')  && `Favourite topics: ${p('topics')}.`,
    p('avoid')   && `Topics to avoid: ${p('avoid')}.`,
    `Style: ${p('style') || 'balanced'}. Tone: ${p('tone') || 'casual'}. Language: ${p('lang') || 'English'}.`,
    p('goal')    && `Main goal: ${p('goal')}.`,
    p('humor')   && `Humor: ${p('humor')}.`,
    p('depth')   && `Learning style: ${p('depth')}.`,
    p('extra')   && `Extra: ${p('extra')}.`,
    'Tailor every response to these preferences.',
  ].filter(Boolean).join(' ');
}

// ── Rotating placeholders (same pool as Ask tab) ────────────────────────────
const LAB_PLACEHOLDERS = [
  "What do you want to know?",
  "Prepare me a documentary on...",
  "Write a poem about...",
  "Explain how black holes work",
  "Help me plan a trip to Tokyo",
  "Debug my Python code...",
  "Summarize this article for me",
  "What's the difference between AI and ML?",
  "Give me 5 startup ideas for 2025",
  "Translate this to Spanish...",
  "How do I learn guitar faster?",
  "Create a workout plan for beginners",
  "Explain quantum computing simply",
];

// ── Animated Fius Logo ──────────────────────────────────────────────────────
function AnimatedFiusLogo({ dark, size = 44, src }: { dark: boolean; size?: number; src?: string }) {
  const logoSrc = src || (dark ? fiusLabLogoDark : fiusLabLogoWhite);
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulsing glow ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -size * 0.18,
          borderRadius: '50%',
          background: dark
            ? 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Second slower ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -size * 0.1,
          borderRadius: '50%',
          border: dark ? '1.5px solid rgba(168,85,247,0.3)' : '1.5px solid rgba(124,58,237,0.2)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Logo image with subtle breathe */}
      <motion.img
        src={logoSrc}
        alt="Fius Labs"
        style={{ width: size, height: size, objectFit: 'contain', position: 'relative', zIndex: 1 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ── Thinking cloud SVG (copied from Nomad) ─────────────────────────────────
function ThinkingCloud({ logo, name, dark }: { logo: string; name: string; dark: boolean }) {
  const cloudPath = "M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z";
  return (
    <div className="thinking-cloud-wrapper" style={{ position: 'relative', width: 196, height: 66 }}>
      <svg viewBox="0 0 196 66" width={196} height={66} style={{ position: 'absolute', top: 0, left: 0 }}>
        <path
          d={cloudPath}
          fill={dark ? "rgba(22,22,28,0.82)" : "rgba(255,255,255,0.98)"}
          stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(160,165,180,0.8)"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: 10, paddingRight: 18, zIndex: 1 }}>
        <img src={logo} alt={name} className="w-4 h-4 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span
          className="thinking-label text-sm font-medium"
          style={!dark ? {
            background: 'linear-gradient(90deg,rgba(55,55,75,0.85) 0%,rgba(55,55,75,0.85) 38%,rgba(10,10,30,1) 50%,rgba(55,55,75,0.85) 62%,rgba(55,55,75,0.85) 100%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'text-shimmer 1.8s linear infinite',
            animationDelay: '0.7s',
          } : undefined}
        >
          Thinking
        </span>
      </div>
    </div>
  );
}

// ── Main FiusLabs component ─────────────────────────────────────────────────
export function FiusLabs({ user }: FiusLabsProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [labTypingPlaceholder, setLabTypingPlaceholder] = useState('');
  const lastLabPlaceholderRef = useRef(LAB_PLACEHOLDERS[0]);
  useEffect(() => {
    let promptIdx = 0, charIdx = 0, phase: 'typing' | 'pausing' | 'erasing' = 'typing';
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = LAB_PLACEHOLDERS[promptIdx];
      if (phase === 'typing') {
        charIdx++;
        const txt = cur.slice(0, charIdx);
        setLabTypingPlaceholder(txt);
        lastLabPlaceholderRef.current = txt;
        if (charIdx >= cur.length) { phase = 'pausing'; timer = setTimeout(tick, 3000); }
        else { timer = setTimeout(tick, 16); }
      } else if (phase === 'pausing') {
        phase = 'erasing'; tick();
      } else {
        charIdx--;
        setLabTypingPlaceholder(cur.slice(0, charIdx));
        if (charIdx <= 0) { promptIdx = (promptIdx + 1) % LAB_PLACEHOLDERS.length; phase = 'typing'; timer = setTimeout(tick, 300); }
        else { timer = setTimeout(tick, 12); }
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── AI text reveal animation ─────────────────────────────────────────────
  const [messages,  setMessages]  = useState<Record<number, Msg[]>>({});
  const [revealMap, setRevealMap] = useState<Record<string, string>>({});
  const animatingMsgIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    Object.values(messages).forEach(msgs => {
      msgs.filter(m => m.role === 'assistant').forEach(msg => {
        if (animatingMsgIds.current.has(msg.id)) return;
        animatingMsgIds.current.add(msg.id);
        const words = msg.content.split(' ');
        let idx = 0;
        const step = () => {
          idx += 2;
          const revealed = words.slice(0, idx).join(' ');
          setRevealMap(prev => ({ ...prev, [msg.id]: revealed }));
          if (idx < words.length) setTimeout(step, 18);
          else setRevealMap(prev => { const n = { ...prev }; delete n[msg.id]; return n; });
        };
        step();
      });
    });
  }, [messages]);

  const prefs: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; }
  })();

  // Phase
  const [phase, setPhase] = useState<'onboarding' | 'mode-select' | 'lab'>(() =>
    localStorage.getItem(STORAGE_KEY) === 'done' ? 'mode-select' : 'onboarding'
  );

  // ── Onboarding state ──────────────────────────────────
  const [qIdx,    setQIdx]    = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [obInput, setObInput] = useState('');
  const obRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'onboarding') setTimeout(() => obRef.current?.focus(), 80);
  }, [phase, qIdx]);

  const submitOb = () => {
    const q = ONBOARDING_QUESTIONS[qIdx];
    const newAnswers = { ...answers, [q.id]: obInput.trim() };
    setAnswers(newAnswers);
    setObInput('');
    if (qIdx < ONBOARDING_QUESTIONS.length - 1) {
      setQIdx(i => i + 1);
    } else {
      localStorage.setItem(PREFS_KEY, JSON.stringify(newAnswers));
      localStorage.setItem(STORAGE_KEY, 'done');
      setPhase('mode-select');
    }
  };

  const clearPrefs = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    setAnswers({}); setQIdx(0); setObInput('');
    setPhase('onboarding');
  };

  // ── Lab state ────────────────────────────────────────
  const [labMode,   setLabMode]   = useState<LabMode>('normal');
  const [slots,     setSlots]     = useState<ModelDef[]>([]);
  const [active,    setActive]    = useState<Record<number, boolean>>({});
  const [typing,    setTyping]    = useState<Record<number, boolean>>({});
  const [perInput,  setPerInput]  = useState<Record<number, string>>({});
  const [numChats,  setNumChats]  = useState(4);
  const scrollRefs  = useRef<Map<number, HTMLDivElement>>(new Map());
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const colsRef     = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  // ── Input-mode state ─────────────────────────────────
  const [pendingLabMode,  setPendingLabMode]  = useState<LabMode | null>(null);
  const [inputMode,       setInputMode]       = useState<'separate' | 'super'>('separate');
  const [superTargetPanel, setSuperTargetPanel] = useState<number | null>(null);
  const [openPanelPicker,  setOpenPanelPicker]  = useState(false);
  const [listenMap,        setListenMap]        = useState<Record<number, boolean>>({});
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [enhancingMap,     setEnhancingMap]     = useState<Record<number, boolean>>({});
  const [isEnhancingGlobal, setIsEnhancingGlobal] = useState(false);
  // ── After-message actions (labs) ─────────────────────
  const [labLiked,    setLabLiked]    = useState<Set<string>>(new Set());
  const [labDisliked, setLabDisliked] = useState<Set<string>>(new Set());
  const [labCopiedId, setLabCopiedId] = useState<string | null>(null);

  // ── Model picker (super mode) ─────────────────────────
  const [chatModelsChosen, setChatModelsChosen] = useState<Record<number, boolean>>({});
  const [modelPickerOpen,  setModelPickerOpen]  = useState<number | null>(null);
  const [pickerFilter,     setPickerFilter]     = useState<'popular' | 'flagship' | 'latest'>('popular');
  const [pickerSelected,   setPickerSelected]   = useState<string | null>(null);
  // Sliding pill for picker filter tabs
  const pickerNavRef       = useRef<HTMLDivElement>(null);
  const pickerTabRefs      = useRef<(HTMLButtonElement | null)[]>([]);
  const [pickerPillStyle,  setPickerPillStyle]  = useState({ left: 0, width: 0, ready: false });
  const pickerPillAnim     = useRef(false);

  const handleLabLike = (id: string) => {
    setLabLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setLabDisliked(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const handleLabDislike = (id: string) => {
    setLabDisliked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setLabLiked(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const handleLabCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setLabCopiedId(id);
    setTimeout(() => setLabCopiedId(null), 2000);
  };

  // ── Mic helpers ─────────────────────────────────────
  const toggleMicCol = async (colIdx: number) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const key = `_sr_labs_${colIdx}`;
    if (listenMap[colIdx] && (window as any)[key]) { try { (window as any)[key].stop(); } catch {} return; }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return; }
    const rec = new SR(); (window as any)[key] = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setPerInput(prev => ({ ...prev, [colIdx]: prev[colIdx] ? `${prev[colIdx]} ${t}` : t })); };
    rec.onend = () => { setListenMap(prev => ({ ...prev, [colIdx]: false })); (window as any)[key] = null; };
    rec.onerror = () => { setListenMap(prev => ({ ...prev, [colIdx]: false })); (window as any)[key] = null; };
    rec.start(); setListenMap(prev => ({ ...prev, [colIdx]: true }));
  };

  const toggleMicGlobal = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListeningGlobal && (window as any)._sr_labs_global) { try { (window as any)._sr_labs_global.stop(); } catch {} return; }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return; }
    const rec = new SR(); (window as any)._sr_labs_global = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setGlobalInput(prev => prev ? `${prev} ${t}` : t); };
    rec.onend = () => { setIsListeningGlobal(false); (window as any)._sr_labs_global = null; };
    rec.onerror = () => { setIsListeningGlobal(false); (window as any)._sr_labs_global = null; };
    rec.start(); setIsListeningGlobal(true);
  };

  const enhanceCol = async (colIdx: number) => {
    const val = (perInput[colIdx] || '').trim();
    if (!val || enhancingMap[colIdx]) return;
    setEnhancingMap(prev => ({ ...prev, [colIdx]: true }));
    try {
      const res = await authFetch('/api/enhance-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalPrompt: val }) });
      const data = await res.json();
      if (data.enhancedPrompt) setPerInput(prev => ({ ...prev, [colIdx]: data.enhancedPrompt }));
    } catch {} finally { setEnhancingMap(prev => ({ ...prev, [colIdx]: false })); }
  };

  const enhanceGlobal = async () => {
    if (!globalInput.trim() || isEnhancingGlobal) return;
    setIsEnhancingGlobal(true);
    try {
      const res = await authFetch('/api/enhance-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalPrompt: globalInput }) });
      const data = await res.json();
      if (data.enhancedPrompt) setGlobalInput(data.enhancedPrompt);
    } catch {} finally { setIsEnhancingGlobal(false); }
  };

  const enterLab = (mode: LabMode, imode: 'separate' | 'super' = 'separate') => {
    const count = mode === 'normal' ? 4 : numChats;
    const initSlots = mode === 'normal' ? NORMAL_DEFAULT_SLOTS : SUPER_MODELS.slice(0, count);
    setSlots(initSlots);
    const initActive: Record<number, boolean> = {};
    initSlots.forEach((_, i) => { initActive[i] = true; });
    setActive(initActive);
    setMessages({});
    setTyping({});
    setPerInput({});
    setLabMode(mode);
    setInputMode(imode);
    setSuperTargetPanel(null);
    setPendingLabMode(null);
    setChatModelsChosen({});
    setPhase('lab');
  };

  // Scroll columns to bottom when messages update
  useEffect(() => {
    scrollRefs.current.forEach((el) => { if (el) el.scrollTop = el.scrollHeight; });
  }, [messages, typing]);

  // ── Send message to all active columns ──────────────
  // Add / remove columns (Super only)
  const addColumn = () => {
    if (slots.length >= 6) return;
    const nextModel = SUPER_MODELS[slots.length % SUPER_MODELS.length];
    const newIdx = slots.length;
    setSlots(prev => [...prev, nextModel]);
    setActive(prev => ({ ...prev, [newIdx]: true }));
    setNumChats(n => n + 1);
  };

  const removeLastColumn = () => {
    if (slots.length <= 1) return;
    const lastIdx = slots.length - 1;
    setSlots(prev => prev.slice(0, -1));
    setActive(prev => { const n = { ...prev }; delete n[lastIdx]; return n; });
    setMessages(prev => { const n = { ...prev }; delete n[lastIdx]; return n; });
    setTyping(prev => { const n = { ...prev }; delete n[lastIdx]; return n; });
    setNumChats(n => n - 1);
  };

  const setColumnCount = (target: number) => {
    const clamped = Math.max(1, Math.min(6, target));
    const diff = clamped - slots.length;
    if (diff > 0) { for (let i = 0; i < diff; i++) addColumn(); }
    else if (diff < 0) { for (let i = 0; i < -diff; i++) removeLastColumn(); }
    // Reset selected panel if it's now out of bounds
    setSuperTargetPanel(prev => (prev !== null && prev >= clamped) ? null : prev);
  };

  const clearColumn = (idx: number) => {
    setMessages(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const changeSlotModel = (idx: number, model: ModelDef) => {
    setSlots(prev => prev.map((m, i) => i === idx ? model : m));
    clearColumn(idx);
    setOpenDropdown(null);
  };

  // Like changeSlotModel but does NOT clear messages — used by the model picker
  // so choosing/changing a model mid-chat doesn't wipe the conversation.
  const setSlotModelOnly = (idx: number, model: ModelDef) => {
    setSlots(prev => prev.map((m, i) => i === idx ? model : m));
    setOpenDropdown(null);
  };

  const toggleColumn = (idx: number) => {
    setActive(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Send message to a single column ─────────────────
  const sendToColumn = async (colIdx: number, contentOverride?: string) => {
    const content = contentOverride ?? (perInput[colIdx] || '').trim();
    if (!content) return;
    if (!contentOverride) setPerInput(prev => ({ ...prev, [colIdx]: '' }));
    const userMsgId = `u-${Date.now()}-${colIdx}`;
    setMessages(prev => ({ ...prev, [colIdx]: [...(prev[colIdx] || []), { id: userMsgId, role: 'user', content }] }));
    setTyping(prev => ({ ...prev, [colIdx]: true }));
    const model = slots[colIdx];
    if (!model) return;
    try {
      const res = await authFetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: `fius-labs-${colIdx}-${model.id}`, model: model.id, provider: model.provider, systemPrompt: buildSysPrompt(prefs, model.name) }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => ({ ...prev, [colIdx]: [...(prev[colIdx] || []), { id: `a-${Date.now()}-${colIdx}`, role: 'assistant', content: data.response || 'No response.' }] }));
      } else {
        setMessages(prev => ({ ...prev, [colIdx]: [...(prev[colIdx] || []), { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Error. Please try again.' }] }));
      }
    } catch {
      setMessages(prev => ({ ...prev, [colIdx]: [...(prev[colIdx] || []), { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Network error.' }] }));
    } finally {
      setTyping(prev => ({ ...prev, [colIdx]: false }));
    }
  };

  const hasMessages = Object.values(messages).some(arr => arr && arr.length > 0);
  const isTypingAny = Object.values(typing).some(Boolean);
  const pool = labMode === 'normal' ? NORMAL_MODELS : SUPER_MODELS;
  // All super-mode chats must have an explicitly chosen model before sending
  const allModelsChosen = labMode !== 'super' || inputMode !== 'super' || slots.every((_, i) => chatModelsChosen[i]);

  // ── Picker filter-tab sliding pill ───────────────────
  const PICKER_TABS = ['popular', 'flagship', 'latest'] as const;
  useEffect(() => {
    const idx = PICKER_TABS.indexOf(pickerFilter as any);
    const btn = pickerTabRefs.current[idx];
    const nav = pickerNavRef.current;
    if (!btn || !nav) return;
    const br = btn.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    setPickerPillStyle({ left: br.left - nr.left, width: br.width, ready: true });
  }, [pickerFilter, modelPickerOpen]);

  // ── Global input (empty state) ───────────────────────
  const [globalInput, setGlobalInput] = useState('');
  const globalInputRef = useRef<HTMLTextAreaElement>(null);

  const sendToAll = async () => {
    const content = globalInput.trim();
    if (!content) return;
    setGlobalInput('');
    // fire to every active slot
    slots.forEach((_, idx) => {
      if (active[idx]) {
        setPerInput(prev => ({ ...prev, [idx]: content }));
      }
    });
    // small delay so perInput is set, then send
    setTimeout(() => {
      slots.forEach((_, idx) => {
        if (active[idx]) sendToColumn(idx);
      });
    }, 0);
    // send directly instead of relying on perInput state
    slots.forEach((model, idx) => {
      if (!active[idx]) return;
      const userMsgId = `u-${Date.now()}-${idx}`;
      setMessages(prev => ({ ...prev, [idx]: [...(prev[idx] || []), { id: userMsgId, role: 'user', content }] }));
      setTyping(prev => ({ ...prev, [idx]: true }));
      authFetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: `fius-labs-${idx}-${model.id}`, model: model.id, provider: model.provider, systemPrompt: buildSysPrompt(prefs, model.name) }),
      }).then(async res => {
        const data = res.ok ? await res.json() : null;
        setMessages(prev => ({ ...prev, [idx]: [...(prev[idx] || []), { id: `a-${Date.now()}-${idx}`, role: 'assistant', content: data?.response || '⚠️ Error.' }] }));
      }).catch(() => {
        setMessages(prev => ({ ...prev, [idx]: [...(prev[idx] || []), { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Network error.' }] }));
      }).finally(() => {
        setTyping(prev => ({ ...prev, [idx]: false }));
      });
    });
  };

  // ── ONBOARDING ────────────────────────────────────────────────────────────
  if (phase === 'onboarding') {
    const q   = ONBOARDING_QUESTIONS[qIdx];
    const pct = Math.round((qIdx / ONBOARDING_QUESTIONS.length) * 100);

    const skipSurvey = () => {
      localStorage.setItem(PREFS_KEY, JSON.stringify({}));
      localStorage.setItem(STORAGE_KEY, 'done');
      setPhase('mode-select');
    };

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        {/* Top branding — static, outside AnimatePresence */}
        <div className="flex flex-col items-center mb-10">
          <img
            src={dark ? '/tab-labs-dark.png' : '/tab-labs-light.png'}
            alt="Fius Labs"
            className="object-contain mb-3"
            style={{ width: 72, height: 72 }}
          />
          <span
            className="text-foreground tracking-tight"
            style={{ fontSize: '2rem', fontWeight: 1000, lineHeight: 1 }}
          >
            Fius Labs
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Progress row: bar + counter centered together */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="flex-1 h-0.5 rounded-full overflow-hidden"
                style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums font-medium shrink-0">
                {qIdx + 1} / {ONBOARDING_QUESTIONS.length}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-xl font-semibold text-foreground leading-snug mb-1.5">{q.text}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {qIdx === ONBOARDING_QUESTIONS.length - 1 ? 'Optional — press Enter to skip' : 'Press Enter to continue'}
            </p>

            {/* Input — pill shaped */}
            <div className="relative">
              <input
                ref={obRef}
                value={obInput}
                onChange={e => setObInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitOb(); } }}
                placeholder={q.placeholder}
                className="w-full px-5 py-3.5 pr-14 text-base outline-none transition-all"
                style={{
                  borderRadius: '9999px',
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                  color: 'inherit',
                }}
              />
              <button
                onClick={submitOb}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center hover:opacity-75 transition-all"
                style={{
                  borderRadius: '9999px',
                  background: dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.1)',
                }}
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Previous answers chips */}
            {qIdx > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {ONBOARDING_QUESTIONS.slice(0, qIdx).map(prev =>
                  answers[prev.id] ? (
                    <span key={prev.id} className="text-xs px-3 py-1 text-muted-foreground" style={{
                      borderRadius: '999px',
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    }}>
                      {answers[prev.id].length > 24 ? answers[prev.id].slice(0, 24) + '…' : answers[prev.id]}
                    </span>
                  ) : null
                )}
              </div>
            )}

            {/* Skip survey */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={skipSurvey}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderRadius: '9999px' }}
              >
                Skip survey
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── MODE SELECT ───────────────────────────────────────────────────────────
  if (phase === 'mode-select') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: dark
            ? 'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(255,255,255,0.025) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(0,0,0,0.045) 0%, transparent 70%)',
        }} />

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 relative z-10 flex flex-col items-center">
          <img
            src={dark ? '/tab-labs-dark.png' : '/tab-labs-light.png'}
            alt="Fius Labs"
            className="object-contain mb-4"
            style={{ width: 110, height: 110 }}
          />
          <h1
            className="tracking-tight mb-1"
            style={{ fontSize: '3rem', fontWeight: 1000, color: dark ? '#f5f5f5' : '#171717', lineHeight: 1 }}
          >
            Fius Labs
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {prefs.name ? `Welcome back, ${prefs.name}!` : 'Welcome!'} Pick a lab mode.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl relative z-10">
          {/* Normal */}
          <motion.button
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            onClick={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.classList.remove('btn-click-pop');
              void el.offsetWidth;
              el.classList.add('btn-click-pop');
              setTimeout(() => { el.classList.remove('btn-click-pop'); setPendingLabMode('normal'); }, 480);
            }}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.08 }}
            className="flex-1 min-h-[470px] rounded-3xl p-12 text-left group flex flex-col"
            style={{
              background: dark
                ? 'linear-gradient(to bottom, #1c1c22 0%, #000000 100%)'
                : 'linear-gradient(to bottom, #ffffff 0%, #000000 100%)',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            <img
              src={dark ? normalLabDarkIcon : normalLabWhiteIcon}
              alt="Normal Fius Lab"
              className="w-32 h-32 object-contain mb-8"
            />
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Normal Fius Lab</h2>
            <p className="text-sm leading-relaxed mb-5 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              4 AI panels side-by-side. One message bar sends to all active chats. Only Fius Lite and Fius Pro models.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {NORMAL_MODELS.map(m => (
                <span key={m.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(0,0,0,0.38)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                  {m.name}
                </span>
              ))}
            </div>
            <span className="mt-auto text-sm font-semibold flex items-center gap-1 text-white">
              Open Normal Lab <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          {/* Super */}
          <motion.button
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            onClick={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.classList.remove('btn-click-pop');
              void el.offsetWidth;
              el.classList.add('btn-click-pop');
              setTimeout(() => { el.classList.remove('btn-click-pop'); setPendingLabMode('super'); }, 480);
            }}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.13 }}
            className="flex-1 min-h-[470px] rounded-3xl p-12 text-left group relative overflow-hidden flex flex-col"
            style={{
              background: dark
                ? 'linear-gradient(to bottom, #1c1c22 0%, #000000 100%)'
                : 'linear-gradient(to bottom, #ffffff 0%, #000000 100%)',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            <img
              src={dark ? superLabDarkIcon : superLabWhiteIcon}
              alt="Super Fius Lab"
              className="w-32 h-32 object-contain mb-8 relative z-10"
            />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <h2 className="text-3xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Super Fius Lab</h2>
              <span className="text-[10px] px-2 py-1 rounded-full font-bold tracking-wide bg-black text-white">SUPER</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 relative z-10 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              1–6 AI panels, all models from Nomad. One global message bar, one send — all active chats respond.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
              {SUPER_MODELS.slice(0, 5).map(m => (
                <span key={m.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                  background: 'rgba(0,0,0,0.38)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}>
                  {m.name}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                background: 'rgba(0,0,0,0.38)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
              }}>
                +{SUPER_MODELS.length - 5} more
              </span>
            </div>
            <span className="mt-auto text-sm font-semibold flex items-center gap-1 relative z-10 text-white">
              Open Super Lab <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
          onClick={clearPrefs}
          className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors relative z-10"
        >
          <RotateCcw className="w-3 h-3" />
          Retake preference survey
        </motion.button>

        {/* ── Input-mode picker overlay ── */}
        {pendingLabMode !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            onClick={() => setPendingLabMode(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: dark ? '#1a1a1a' : '#f5f5f5' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-8 pt-8 pb-4 text-center">
                <h2 className="text-xl font-bold mb-1" style={{ color: dark ? '#f5f5f5' : '#171717' }}>
                  Choose input mode
                </h2>
                <p className="text-xs text-muted-foreground">How do you want to send messages in {pendingLabMode === 'normal' ? 'Normal' : 'Super'} Lab?</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 px-6 pb-8">
                {/* Option 1 — Separate Bars */}
                <button
                  onClick={() => enterLab(pendingLabMode, 'separate')}
                  className="flex-1 rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ background: dark ? '#2a2a2a' : '#ffffff', border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                    <img src={dark ? '/fn-longans-gray.png' : '/fn-longans-black.png'} alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: dark ? '#f5f5f5' : '#171717' }}>Separate Bars</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Each chat panel gets its own message bar. Send independently to any panel.</p>
                </button>
                {/* Option 2 — Super Mode */}
                <button
                  onClick={() => enterLab(pendingLabMode, 'super')}
                  className="flex-1 rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ background: dark ? '#2a2a2a' : '#ffffff', border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(168,85,247,0.18)' }}>
                    <Zap className="w-5 h-5" style={{ color: '#a855f7' }} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-sm" style={{ color: dark ? '#f5f5f5' : '#171717' }}>Super Mode</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#a855f7', color: '#fff' }}>SUPER</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">One shared message bar. Pick a target panel with the selector, then send — message goes only to that panel.</p>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // ── LAB UI (Nomad clone) ──────────────────────────────────────────────────
  return (
    <TooltipProvider>
    <div className="absolute inset-0 flex flex-col overflow-hidden" onClick={() => { if (openDropdown !== null) setOpenDropdown(null); if (openPanelPicker) setOpenPanelPicker(false); }}>

      {/* ── Top strip ───────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0" style={{}}>
        <AnimatedFiusLogo
          dark={dark}
          size={28}
          src={labMode === 'super'
            ? (dark ? superLabDarkIcon : superLabWhiteIcon)
            : (dark ? normalLabDarkIcon : normalLabWhiteIcon)}
        />
        <span className="font-semibold text-sm" style={{ color: dark ? '#f5f5f5' : '#171717' }}>
          {labMode === 'normal' ? 'Normal Fius Lab' : 'Super Fius Lab'}
        </span>
        <span className="text-xs text-muted-foreground">— {slots.length} panel{slots.length !== 1 ? 's' : ''}</span>

        <div className="ml-auto flex items-center gap-2">
          {labMode === 'super' && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={removeLastColumn} disabled={slots.length <= 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove panel</TooltipContent>
              </Tooltip>
              <span className="text-xs font-bold w-4 text-center tabular-nums" style={{ color: dark ? '#f5f5f5' : '#171717' }}>{slots.length}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={addColumn} disabled={slots.length >= 6}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Add panel</TooltipContent>
              </Tooltip>
            </div>
          )}

          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => { setMessages({}); setTyping({}); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg transition-all"
                  style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              </TooltipTrigger>
              <TooltipContent>Clear all conversations</TooltipContent>
            </Tooltip>
          )}

          <button onClick={() => setPhase('mode-select')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
            <RotateCcw className="w-3 h-3" />
            Back
          </button>
        </div>
      </div>
      {/* ── Columns area + floating bar ────────────────── */}
      <div className="flex-1 relative overflow-hidden min-h-0 flex flex-col-reverse"
        style={{
          backgroundImage: dark
            ? 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >

        {/* ── GLOBAL EMPTY STATE — super inputMode only, when no messages ── */}
        {inputMode === 'super' && !hasMessages && !isTypingAny && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
            {/* Logo + Fly With Us */}
            <FiusLogo size="2xl" className="mb-4 text-black dark:text-foreground" />
            <h2 className="text-3xl font-normal mb-1 text-foreground text-center">
              {prefs.name ? `Hey ${prefs.name}, the sky's the limit today!` : 'Welcome to Fius Labs'}
            </h2>
            <p className="text-lg text-foreground mb-8">Fly With Us!</p>

            {/* Function bar — exact ask tab pill style */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {([
                { icon: dark ? '/fn-voice-gray.png' : '/fn-voice-black.png', label: 'Long Answer' },
                { icon: dark ? '/fn-settings-gray.png' : '/fn-settings-black.png', label: 'Voice Mode' },
                { icon: dark ? '/fn-longans-gray.png' : '/fn-longans-black.png', label: 'Settings' },
              ] as const).map(({ icon, label }) => (
                <button key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 active:scale-95 bg-white dark:bg-[#2e2e2e] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#383838] hover:scale-[1.05] hover:-translate-y-0.5 hover:shadow-md">
                  <span className="flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center">
                    <img src={icon} alt="" className="w-[18px] h-[18px] object-contain" style={{ mixBlendMode: dark ? 'screen' : 'multiply' }} />
                  </span>
                  <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>

            {/* Message bar — Ask tab style with panel count + panel selector inside */}
            <div className="w-full max-w-[42rem] mb-4">
              <div className="relative bg-white dark:bg-[#383838] transition-all duration-300 glossy-outline !border-none !outline-none rounded-full">
                <div className="flex items-center px-2 pt-2 pb-[10px] gap-1">
                  {/* Attach — far left */}
                  <button onClick={() => globalFileInputRef.current?.click()}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-zinc-400 hover:text-white hover:bg-white/10 ml-0.5">
                    <img src={plusButtonIcon} alt="Attach" className="w-5 h-5 composer-message-icon" />
                  </button>
                  <input ref={globalFileInputRef} type="file" accept="image/*" className="sr-only" onChange={() => {}} />
                  <textarea
                    ref={globalInputRef}
                    value={globalInput}
                    onChange={e => setGlobalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (superTargetPanel !== null && globalInput.trim()) { sendToColumn(superTargetPanel, globalInput.trim()); setGlobalInput(''); } } }}
                    onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 38) + 'px'; }}
                    placeholder={superTargetPanel !== null ? labTypingPlaceholder || `Message Panel ${superTargetPanel + 1}…` : 'Select a panel first…'}
                    rows={1}
                    disabled={superTargetPanel === null}
                    className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden disabled:opacity-40"
                    style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                  />
                  {/* Panel picker — model-selector position (right of textarea) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`flex items-center gap-1 px-2 h-7 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${superTargetPanel !== null ? 'text-zinc-800 dark:text-zinc-100 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15' : 'text-zinc-600 dark:text-zinc-300 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                        {superTargetPanel !== null ? `Panel ${superTargetPanel + 1}` : 'Panels'}
                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-2 w-auto data-[state=closed]:animate-none data-[state=closed]:duration-0" style={{ minWidth: 0 }}>
                      {/* ── Models section ── */}
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Models</p>
                      <div className="flex flex-col gap-0.5 mb-2">
                        {slots.map((slotModel, idx) => (
                          <button key={idx}
                            onClick={e => { e.stopPropagation(); setPickerSelected(chatModelsChosen[idx] ? slotModel.id : null); setModelPickerOpen(idx); }}
                            className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/8 transition-all w-full text-left">
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 w-9 flex-shrink-0 tabular-nums">Chat {idx + 1}</span>
                            <Minus className="w-2.5 h-2.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] flex-1 border transition-all ${chatModelsChosen[idx] ? 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-white/5' : 'border-dashed border-zinc-300 dark:border-zinc-600 bg-transparent'}`}>
                              {chatModelsChosen[idx] ? (
                                <>
                                  {slotModel.provider === 'fius' ? (
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: slotModel.color }} />
                                  ) : (
                                    <img src={slotModel.logo} alt="" className="w-3 h-3 object-contain flex-shrink-0" onError={e2 => { (e2.target as HTMLImageElement).style.display='none'; }} />
                                  )}
                                  <span className="font-semibold text-foreground truncate max-w-[72px]">{slotModel.name}</span>
                                </>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 italic">Pick model…</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-700 mb-2 mx-1" />
                      {/* ── Row 1: panel count ── */}
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Panels</p>
                      <div className="relative flex flex-row items-center mb-3 w-full">
                        <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                          style={{ width: `${100 / 6}%`, transform: `translateX(${(slots.length - 1) * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        {[1, 2, 3, 4, 5, 6].map(n => {
                          const isActive = slots.length === n;
                          return (
                            <button key={n} onClick={() => setColumnCount(n)}
                              className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors duration-200 min-w-0 ${isActive ? 'text-zinc-800 dark:text-black' : 'text-zinc-500 dark:text-zinc-200 hover:text-zinc-700 dark:hover:text-white'}`}>
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      {/* ── Row 2: send-to panel ── */}
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Send to</p>
                      <div className="relative flex flex-row items-center w-full">
                        {superTargetPanel !== null && superTargetPanel < slots.length && (
                          <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                            style={{ width: `${100 / slots.length}%`, transform: `translateX(${superTargetPanel * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        )}
                        {slots.map((m, idx) => {
                          const isActive = superTargetPanel === idx;
                          return (
                            <button key={idx} onClick={() => setSuperTargetPanel(idx)}
                              className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors duration-200 min-w-0 ${isActive ? 'text-zinc-800 dark:text-black' : 'text-zinc-500 dark:text-zinc-200 hover:text-zinc-700 dark:hover:text-white'}`}>
                              {idx + 1}
                              <span className={`text-[8px] font-normal truncate max-w-[48px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>{m.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Enhance — slides in when text present */}
                  <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${globalInput.trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                    <button onClick={enhanceGlobal} disabled={!globalInput.trim() || isEnhancingGlobal || superTargetPanel === null}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 flex-shrink-0">
                      {isEnhancingGlobal ? <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />}
                    </button>
                  </div>
                  {/* Mic */}
                  <button onClick={toggleMicGlobal}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isListeningGlobal ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                    <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                  </button>
                  {/* Send — slides in when text present */}
                  <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${globalInput.trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={() => { if (superTargetPanel !== null && globalInput.trim() && allModelsChosen) { sendToColumn(superTargetPanel, globalInput.trim()); setGlobalInput(''); } }}
                      disabled={!globalInput.trim() || superTargetPanel === null || !allModelsChosen}
                      title={!allModelsChosen ? 'Pick a model for all chats first' : undefined}
                      className="w-8 h-8 composer-send-button text-white dark:text-black rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mr-1"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 pill chips — exact ask tab */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {([
                { label: 'Create Visuals', light: '/quick-visuals-light.png',   dark: '/quick-visuals-dark.png',   prompt: 'Create some visuals for me' },
                { label: 'Web Search',     light: '/quick-websearch-light.png', dark: '/quick-websearch-dark.png', prompt: 'Search the web for: ' },
                { label: 'Create Files',   light: '/quick-files-light.png',     dark: '/quick-files-dark.png',     prompt: 'Help me create a file' },
                { label: 'Play Games',     light: '/quick-games-light.png',     dark: '/quick-games-dark.png',     prompt: "Let's play a word game" },
              ] as const).map(({ label, light, dark: dIcon, prompt }) => (
                <button key={label} onClick={() => setGlobalInput(prompt)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all hover:scale-[1.05] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] bg-zinc-100 dark:bg-[#2e2e2e] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-600/30 hover:bg-zinc-200 dark:hover:bg-[#3a3a3a]">
                  <img src={dark ? dIcon : light} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* ── Super mode shared bottom bar — shows when has messages ── */}
      {inputMode === 'super' && (hasMessages || isTypingAny) && (
          <div className="px-4 pb-2 pt-2 flex-shrink-0">
            <div className="max-w-[56rem] mx-auto">
              <div className="relative bg-white dark:bg-[#383838] transition-all duration-300 glossy-outline !border-none !outline-none rounded-full">
                <div className="flex items-center px-2 pt-2 pb-[10px] gap-1">
                  {/* Attach — far left */}
                  <button onClick={() => globalFileInputRef.current?.click()}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-zinc-400 hover:text-white hover:bg-white/10 ml-0.5">
                    <img src={plusButtonIcon} alt="Attach" className="w-5 h-5 composer-message-icon" />
                  </button>
                  <textarea
                    value={globalInput}
                    onChange={e => setGlobalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (superTargetPanel !== null && globalInput.trim()) { sendToColumn(superTargetPanel, globalInput.trim()); setGlobalInput(''); } } }}
                    onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 38) + 'px'; }}
                    placeholder={superTargetPanel !== null ? labTypingPlaceholder || `Message Panel ${superTargetPanel + 1}…` : 'Select a panel first…'}
                    rows={1}
                    disabled={superTargetPanel === null}
                    className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden disabled:opacity-40"
                    style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                  />
                  {/* Panel picker */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`flex items-center gap-1 px-2 h-7 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${superTargetPanel !== null ? 'text-zinc-800 dark:text-zinc-100 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15' : 'text-zinc-600 dark:text-zinc-300 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
                        {superTargetPanel !== null ? `Panel ${superTargetPanel + 1}` : 'Panels'}
                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-2 w-auto data-[state=closed]:animate-none data-[state=closed]:duration-0" style={{ minWidth: 0 }}>
                      {/* ── Models section ── */}
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Models</p>
                      <div className="flex flex-col gap-0.5 mb-2">
                        {slots.map((slotModel, idx) => (
                          <button key={idx}
                            onClick={e => { e.stopPropagation(); setPickerSelected(chatModelsChosen[idx] ? slotModel.id : null); setModelPickerOpen(idx); }}
                            className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/8 transition-all w-full text-left">
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 w-9 flex-shrink-0 tabular-nums">Chat {idx + 1}</span>
                            <Minus className="w-2.5 h-2.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] flex-1 border transition-all ${chatModelsChosen[idx] ? 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-white/5' : 'border-dashed border-zinc-300 dark:border-zinc-600 bg-transparent'}`}>
                              {chatModelsChosen[idx] ? (
                                <>
                                  {slotModel.provider === 'fius' ? (
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: slotModel.color }} />
                                  ) : (
                                    <img src={slotModel.logo} alt="" className="w-3 h-3 object-contain flex-shrink-0" onError={e2 => { (e2.target as HTMLImageElement).style.display='none'; }} />
                                  )}
                                  <span className="font-semibold text-foreground truncate max-w-[72px]">{slotModel.name}</span>
                                </>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 italic">Pick model…</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-700 mb-2 mx-1" />
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Panels</p>
                      <div className="relative flex flex-row items-center mb-3 w-full">
                        <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                          style={{ width: `${100 / 6}%`, transform: `translateX(${(slots.length - 1) * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        {[1, 2, 3, 4, 5, 6].map(n => {
                          const isAct = slots.length === n;
                          return (
                            <button key={n} onClick={() => setColumnCount(n)}
                              className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors duration-200 min-w-0 ${isAct ? 'text-zinc-800 dark:text-black' : 'text-zinc-500 dark:text-zinc-200 hover:text-zinc-700 dark:hover:text-white'}`}>
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-400 px-1 mb-1 select-none">Send to</p>
                      <div className="relative flex flex-row items-center w-full">
                        {superTargetPanel !== null && superTargetPanel < slots.length && (
                          <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                            style={{ width: `${100 / slots.length}%`, transform: `translateX(${superTargetPanel * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        )}
                        {slots.map((m, idx) => {
                          const isAct = superTargetPanel === idx;
                          return (
                            <button key={idx} onClick={() => setSuperTargetPanel(idx)}
                              className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-bold transition-colors duration-200 min-w-0 ${isAct ? 'text-zinc-800 dark:text-black' : 'text-zinc-500 dark:text-zinc-200 hover:text-zinc-700 dark:hover:text-white'}`}>
                              {idx + 1}
                              <span className={`text-[8px] font-normal truncate max-w-[48px] ${isAct ? 'opacity-70' : 'opacity-50'}`}>{m.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Enhance */}
                  <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${globalInput.trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                    <button onClick={enhanceGlobal} disabled={!globalInput.trim() || isEnhancingGlobal || superTargetPanel === null}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 flex-shrink-0">
                      {isEnhancingGlobal ? <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />}
                    </button>
                  </div>
                  {/* Mic */}
                  <button onClick={toggleMicGlobal}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isListeningGlobal ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                    <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                  </button>
                  {/* Send */}
                  <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${globalInput.trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={() => { if (superTargetPanel !== null && globalInput.trim() && allModelsChosen) { sendToColumn(superTargetPanel, globalInput.trim()); setGlobalInput(''); } }}
                      disabled={!globalInput.trim() || superTargetPanel === null || !allModelsChosen}
                      title={!allModelsChosen ? 'Pick a model for all chats first' : undefined}
                      className="w-8 h-8 composer-send-button text-white dark:text-black rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mr-1"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Columns — separate: always shown; super: only when has messages */}
        <div
          ref={colsRef}
          className="nomad-hscroll flex flex-nowrap overflow-x-auto"
          style={{ flex: 1, minHeight: 0, alignItems: 'stretch', scrollbarWidth: 'thin', display: inputMode === 'separate' || hasMessages || isTypingAny ? 'flex' : 'none' }}
        >
          {slots.map((model, colIdx) => {
            const isActive = !!active[colIdx];
            const msgs     = messages[colIdx] || [];
            const isTyping = typing[colIdx];
            const isLast   = colIdx === slots.length - 1;

            return (
              <div
                key={colIdx}
                className="flex-shrink-0 flex items-stretch"
                style={{ height: '100%', position: 'relative', zIndex: openDropdown === colIdx ? 9999 : 'auto' }}
              >
                <div
                  className="flex-shrink-0 flex flex-col"
                  style={{
                    width: 390,
                    height: '100%',
                    paddingLeft: 10,
                    paddingRight: 10,
                    opacity: isActive ? 1 : 0.45,
                    transform: isActive ? 'scale(1)' : 'scale(0.97)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                    borderRight: isLast ? 'none' : dark ? '3px solid rgba(255,255,255,0.22)' : '3px solid rgba(0,0,0,0.22)',
                  }}
                >
                  {/* ── Header card (Nomad style) ─────── */}
                  <div className="relative mx-3 mt-2 mb-2">
                    <div
                      className="rounded-full border-2 transition-all duration-300 bg-card"
                      style={{ borderColor: isActive ? model.color : 'rgba(128,128,128,0.25)' }}
                    >
                      <div className="flex flex-row items-center gap-3 px-3.5 py-3">
                        {/* Logo */}
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {model.provider === 'fius' ? (
                            <FiusLogo size="sm" scaleWhenCurrent="scale(1.65) translateY(3px)" className={dark ? 'text-white' : 'text-black'} />
                          ) : (
                            <img
                              src={model.logo}
                              alt={model.name}
                              className="w-10 h-10 object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>

                        {/* Name + description */}
                        <div className="flex flex-col flex-1 min-w-0">
                          {/* Model name — clickable dropdown in Super mode */}
                          {labMode === 'super' ? (
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === colIdx ? null : colIdx); }}
                                className="flex items-center gap-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-full px-1.5 py-0.5 text-left min-w-0"
                              >
                                <span className="font-bold text-foreground leading-tight truncate text-xs">{model.name}</span>
                                <ChevronDown className={`w-3 h-3 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${openDropdown === colIdx ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Dropdown */}
                              {openDropdown === colIdx && (
                                <div
                                  className="absolute left-0 top-full mt-1 z-50 rounded-xl shadow-2xl overflow-hidden py-1"
                                  style={{ background: dark ? '#383838' : '#ffffff', minWidth: 160, width: 'max-content', maxWidth: 220 }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {SUPER_MODELS.map(m => (
                                    <button
                                      key={m.id}
                                      onClick={() => changeSlotModel(colIdx, m)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/10 dark:hover:bg-white/10 text-left transition-all"
                                      style={{ color: model.id === m.id ? m.color : 'inherit', fontWeight: model.id === m.id ? 700 : 400 }}
                                    >
                                      <img src={m.logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                      {m.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-foreground leading-tight truncate text-xs">{model.name}</span>
                          )}
                          <span className="text-[9px] text-muted-foreground leading-tight">{model.description}</span>
                        </div>

                        {/* Toggle switch */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Toggle */}
                          <button
                            onClick={() => toggleColumn(colIdx)}
                            className="relative rounded-full transition-all duration-300 flex-shrink-0"
                            style={isActive
                              ? { background: model.color, width: 36, height: 18 }
                              : { width: 36, height: 18, background: 'rgb(209 213 219)' }}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${isActive ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Flex-1 area: empty state OR messages ── */}
                  <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>

                    {/* ── EMPTY STATE — separate mode only, centered placeholder ── */}
                    {msgs.length === 0 && !isTyping && inputMode === 'separate' && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 12px' }}>
                        <p className="text-sm text-muted-foreground opacity-50">Send a message to start</p>
                      </div>
                    )}

                    {/* ── MESSAGES scroll ── */}
                    <div
                      ref={el => { if (el) scrollRefs.current.set(colIdx, el); }}
                      className="mx-2 flex flex-col space-y-6 pb-4 overflow-y-auto h-full"
                      style={{ scrollbarWidth: 'thin', display: msgs.length === 0 && !isTyping ? 'none' : 'flex' }}
                    >
                      {msgs.map(msg => {
                        const mcab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                        return (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' ? (
                            <div className="group/usermsg user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 text-sm max-w-[85%] chat-bubble shadow-sm [overflow-wrap:anywhere]">
                              <p className="text-foreground">{msg.content}</p>
                              {/* Hover-only buttons row */}
                              <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover/usermsg:opacity-100 transition-opacity duration-150">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => handleLabCopy(msg.content, msg.id)}
                                      className="h-6 w-6 flex items-center justify-center rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 active:scale-90">
                                      <img src="/icon-copy-black.png" className="h-3.5 w-3.5 object-contain block dark:hidden brightness-0" alt="copy" />
                                      <img src="/icon-copy-gray2.png" className="h-3.5 w-3.5 object-contain hidden dark:block opacity-75" alt="copy" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{labCopiedId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => setPerInput(prev => ({ ...prev, [colIdx]: msg.content }))}
                                      className="h-6 w-6 flex items-center justify-center rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 active:scale-90">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Edit</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-[90%]">
                              <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                {model.provider === 'fius' ? (
                                  <FiusLogo size="sm" className="flex-shrink-0 text-black dark:text-foreground" />
                                ) : (
                                  <img src={model.logo} alt={model.name} className="w-4 h-4 object-contain rounded-full flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = '/fius-logo.png'; }} />
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground">{model.name}</span>
                              </div>
                              <div className="rounded-3xl px-4 py-3 chat-bubble">
                                <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert break-words leading-relaxed">
                                  {msg.content}
                                </div>
                              </div>
                              {/* Action row — Nomad style with ... menu */}
                              <div className="flex items-center gap-0.5 mt-1 ml-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => handleLabLike(msg.id)} className={mcab}>
                                      {labLiked.has(msg.id)
                                        ? <><img src="/icon-like-clicked-light.png" className="h-4 w-4 object-contain block dark:hidden" alt="like" /><img src="/icon-like-clicked-dark.png" className="h-4 w-4 object-contain hidden dark:block" alt="like" /></>
                                        : <><img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden brightness-0" alt="like" /><img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="like" /></>}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Like</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => handleLabDislike(msg.id)} className={mcab}>
                                      {labDisliked.has(msg.id)
                                        ? <><img src="/icon-dislike-clicked-light.png" className="h-4 w-4 object-contain block dark:hidden" alt="dislike" /><img src="/icon-dislike-clicked-dark.png" className="h-4 w-4 object-contain hidden dark:block" alt="dislike" /></>
                                        : <><img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden brightness-0" alt="dislike" /><img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="dislike" /></>}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Dislike</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => handleLabCopy(msg.content, msg.id)} className={mcab}>
                                      {labCopiedId === msg.id
                                        ? <><img src="/icon-copy-clicked-light.png" className="h-4 w-4 object-contain block dark:hidden" alt="copy" /><img src="/icon-copy-clicked-dark.png" className="h-4 w-4 object-contain hidden dark:block" alt="copy" /></>
                                        : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden brightness-0" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{labCopiedId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent>
                                </Tooltip>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className={mcab}>
                                      <img src="/icon-more-black.png" className="h-3.5 w-3.5 object-contain block dark:hidden brightness-0" alt="more" />
                                      <img src="/icon-more-gray.png" className="h-3.5 w-3.5 object-contain hidden dark:block opacity-75" alt="more" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[180px] z-[200]">
                                    <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-labs-export.txt'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                      <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-labs-export.md'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                      <FileDown className="w-3.5 h-3.5 text-violet-500" /> Export as Markdown
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                      {isTyping && (
                        <div className="flex justify-start mb-2">
                          <ThinkingCloud logo={model.logo} name={model.name} dark={dark} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Per-panel bottom bar — separate mode only, always at bottom ── */}
                  {inputMode === 'separate' && (
                  <div className="mx-2 mb-3 flex-shrink-0">
                    <div className="relative bg-white dark:bg-[#383838] transition-all duration-300 glossy-outline !border-none !outline-none rounded-full">
                      <div className="flex items-center px-2 pt-2 pb-[10px] gap-1">
                        {/* Attach */}
                        <button onClick={() => fileInputRefs.current.get(colIdx)?.click()} disabled={!isActive}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30">
                          <img src={plusButtonIcon} alt="Attach" className="w-5 h-5 composer-message-icon" />
                        </button>
                        <textarea
                          value={perInput[colIdx] || ''}
                          onChange={e => setPerInput(prev => ({ ...prev, [colIdx]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToColumn(colIdx); } }}
                          onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 38) + 'px'; }}
                          placeholder={labTypingPlaceholder || `Message ${model.name}…`}
                          rows={1}
                          disabled={!isActive || typing[colIdx]}
                          className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden disabled:opacity-40"
                          style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                        />
                        {/* Enhance — slides in when text present */}
                        <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${(perInput[colIdx] || '').trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                          <button onClick={() => enhanceCol(colIdx)} disabled={!(perInput[colIdx] || '').trim() || enhancingMap[colIdx] || !isActive}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30">
                            {enhancingMap[colIdx] ? <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />}
                          </button>
                        </div>
                        {/* Mic */}
                        <button onClick={() => toggleMicCol(colIdx)} disabled={!isActive}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${listenMap[colIdx] ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'} disabled:opacity-30`}>
                          <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                        </button>
                        {/* Send — slides in when text present */}
                        <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${(perInput[colIdx] || '').trim() ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                          <button onClick={() => sendToColumn(colIdx)} disabled={!(perInput[colIdx] || '').trim() || !isActive || typing[colIdx]}
                            className="w-8 h-8 composer-send-button text-white dark:text-black rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mr-1">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* ── Model Picker Modal (Super mode) ──────────────────────────────── */}
    {modelPickerOpen !== null && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) setModelPickerOpen(null); }}
      >
        <div
          className="relative flex flex-col shadow-2xl w-full mx-4 overflow-hidden"
          style={{
            maxWidth: 680,
            height: '75vh',
            background: '#303030',
            color: '#f5f5f5',
            borderRadius: 24,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-5 pt-5 pb-3 flex-shrink-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-xl font-bold">Choose a model</h2>
                <p className="text-sm mt-0.5" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>
                  picks the best model for your task
                </p>
              </div>
              <button
                onClick={() => setModelPickerOpen(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ml-3 mt-0.5"
                style={{ color: dark ? '#9ca3af' : '#6b7280' }}
                onMouseOver={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Sliding filter pills ── */}
            <div className="flex items-center gap-2 mt-5">
              <div
                ref={pickerNavRef}
                className="relative flex items-center p-1 flex-1"
                style={{ background: dark ? '#222222' : '#f0f0f0', borderRadius: 999 }}
              >
                {/* Sliding pill underlay */}
                {pickerPillStyle.ready && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: pickerPillStyle.left,
                      width: pickerPillStyle.width,
                      top: 4, bottom: 4,
                      transition: 'left 0.42s cubic-bezier(0.34,1.56,0.64,1), width 0.42s cubic-bezier(0.34,1.56,0.64,1)',
                      pointerEvents: 'none',
                      zIndex: 0,
                      background: dark ? '#ffffff' : '#111111',
                      borderRadius: 999,
                      boxShadow: dark ? '0 1px 8px rgba(255,255,255,0.15)' : '0 1px 4px rgba(0,0,0,0.12)',
                    }}
                  />
                )}
                {(['popular', 'flagship', 'latest'] as const).map((tab, i) => {
                  const isActive = pickerFilter === tab;
                  return (
                    <button
                      key={tab}
                      ref={el => { pickerTabRefs.current[i] = el; }}
                      onClick={() => { pickerPillAnim.current = true; setPickerFilter(tab); }}
                      className="relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-200 capitalize"
                      style={{
                        color: isActive ? (dark ? '#111111' : '#ffffff') : (dark ? '#9ca3af' : '#71717a'),
                        background: 'transparent',
                        borderRadius: 999,
                      }}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  );
                })}
              </div>
              <button
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs border flex-shrink-0 transition-all"
                style={{
                  borderColor: dark ? '#333333' : '#e0e0e0',
                  color: dark ? '#9ca3af' : '#71717a',
                  borderRadius: 999,
                }}
              >
                <FilterIcon className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px mx-5" style={{ background: dark ? '#242424' : '#f0f0f0' }} />

          {/* ── Model grid — scrollable ── */}
          <div className="overflow-y-auto flex-1 px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 gap-2">
              {SUPER_MODELS.filter(m =>
                pickerFilter === 'popular' || MODEL_TAGS[m.id]?.includes(pickerFilter)
              ).map(m => {
                const isSelected = pickerSelected === m.id;
                const isPro = m.provider !== 'fius';
                return (
                  <button
                    key={m.id}
                    onClick={() => setPickerSelected(m.id)}
                    className="flex items-center gap-2 px-3 py-3 text-left transition-all"
                    style={{
                      borderRadius: 14,
                      border: `1.5px solid ${isSelected ? '#888888' : '#404040'}`,
                      background: '#404040',
                      position: 'relative',
                      zIndex: 1,
                      isolation: 'isolate',
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {/* Logo */}
                    {m.provider === 'fius' ? (
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 46, height: 46 }}>
                        <FiusLogo size="sm" className="text-white" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 46, height: 46 }}>
                        <img src={m.logo} alt={m.name} className="w-9 h-9 object-contain"
                          onError={e2 => { (e2.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}

                    {/* Name — full, no truncate */}
                    <span className="flex-1 text-[12px] font-semibold leading-tight" style={{ color: '#f5f5f5' }}>
                      {m.name}
                    </span>

                    {/* PRO badge */}
                    {isPro && (
                      <span className="text-[8px] font-bold px-1 py-0.5 flex-shrink-0"
                        style={{
                          color: '#d97706',
                          background: 'rgba(217,119,6,0.2)',
                          borderRadius: 999,
                        }}>
                        PRO
                      </span>
                    )}

                    {/* Tick checkmark when selected */}
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? '#ffffff' : '#777777',
                        background: isSelected
                          ? 'linear-gradient(to bottom, #ffffff, #9ca3af)'
                          : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5" style={{ color: '#111111', strokeWidth: 3 }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Continue button ── */}
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${dark ? '#242424' : '#f0f0f0'}` }}>
            <button
              onClick={() => {
                if (pickerSelected !== null && modelPickerOpen !== null) {
                  const chosen = SUPER_MODELS.find(m => m.id === pickerSelected);
                  if (chosen) {
                    // Use setSlotModelOnly — does NOT clear messages, fixes "UI closes" bug
                    setSlotModelOnly(modelPickerOpen, chosen);
                    setChatModelsChosen(prev => ({ ...prev, [modelPickerOpen]: true }));
                  }
                }
                setModelPickerOpen(null);
              }}
              disabled={pickerSelected === null}
              className="w-full font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: dark ? '#ffffff' : '#111111',
                color: dark ? '#111111' : '#ffffff',
                borderRadius: 999,
                paddingTop: 13,
                paddingBottom: 13,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}
    </TooltipProvider>
  );
}
