import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/queryClient';
import { useTheme } from './theme-provider';
import { ArrowUp, ChevronRight, ChevronDown, FlaskConical, Zap, RotateCcw, Minus, Plus, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [messages,  setMessages]  = useState<Record<number, Msg[]>>({});
  const [typing,    setTyping]    = useState<Record<number, boolean>>({});
  const [perInput,  setPerInput]  = useState<Record<number, string>>({});
  const [numChats,  setNumChats]  = useState(4);
  const scrollRefs  = useRef<Map<number, HTMLDivElement>>(new Map());
  const colsRef     = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const enterLab = (mode: LabMode) => {
    const pool = mode === 'normal' ? NORMAL_DEFAULT_SLOTS : SUPER_MODELS.slice(0, 4);
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

  const clearColumn = (idx: number) => {
    setMessages(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const changeSlotModel = (idx: number, model: ModelDef) => {
    setSlots(prev => prev.map((m, i) => i === idx ? model : m));
    clearColumn(idx);
    setOpenDropdown(null);
  };

  const toggleColumn = (idx: number) => {
    setActive(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Send message to a single column ─────────────────
  const sendToColumn = async (colIdx: number) => {
    const content = (perInput[colIdx] || '').trim();
    if (!content) return;
    setPerInput(prev => ({ ...prev, [colIdx]: '' }));
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
              setTimeout(() => { el.classList.remove('btn-click-pop'); enterLab('normal'); }, 480);
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
              setTimeout(() => { el.classList.remove('btn-click-pop'); enterLab('super'); }, 480);
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
      </div>
    );
  }

  // ── LAB UI (Nomad clone) ──────────────────────────────────────────────────
  return (
    <TooltipProvider>
    <div className="absolute inset-0 flex flex-col overflow-hidden" onClick={() => openDropdown !== null && setOpenDropdown(null)}>

      {/* ── Top strip ───────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0" style={{
        borderBottom: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
      }}>
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
      <div className="flex-1 relative overflow-hidden min-h-0">

        {/* Columns */}
        <div
          ref={colsRef}
          className="nomad-hscroll flex flex-nowrap h-full overflow-x-auto"
          style={{ alignItems: 'stretch', scrollbarWidth: 'thin' }}
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
                    borderRight: !isLast ? (dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)') : 'none',
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
                          <img
                            src={model.logo}
                            alt={model.name}
                            className="w-10 h-10 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
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

                        {/* Toggle switch + clear */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {msgs.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => clearColumn(colIdx)}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Clear chat</TooltipContent>
                            </Tooltip>
                          )}
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

                  {/* ── Messages ────────── */}
                  <div
                    ref={el => { if (el) scrollRefs.current.set(colIdx, el); }}
                    className="mx-2 flex flex-col pb-4 overflow-y-auto flex-1 min-h-0"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {msgs.length === 0 && !isTyping && (
                      <div className="flex flex-col items-center justify-center flex-1 min-h-[60%] text-center py-10 select-none px-3">
                        {/* Model logo — mirrors ask tab's FiusLogo */}
                        <img
                          src={model.logo}
                          alt={model.name}
                          className="object-contain mb-5"
                          style={{ width: 72, height: 72 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {/* Model name — mirrors ask tab h2 */}
                        <h2 className="text-2xl font-normal text-foreground mb-1">{model.name}</h2>
                        {/* Description — mirrors "Fly With Us!" */}
                        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">{model.description}</p>
                        {/* Quick starter chips — mirrors ask tab action chips */}
                        <div className="flex flex-col gap-2 w-full">
                          {['Explain something to me', 'Help me write something', 'Brainstorm ideas'].map(prompt => (
                            <button
                              key={prompt}
                              onClick={() => setPerInput(prev => ({ ...prev, [colIdx]: prompt }))}
                              className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.97]"
                              style={{
                                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                border: dark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)',
                                color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)',
                              }}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {msgs.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'user' ? (
                          <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 text-sm max-w-[85%] chat-bubble shadow-sm [overflow-wrap:anywhere]">
                            <p className="text-foreground">{msg.content}</p>
                          </div>
                        ) : (
                          <div className="max-w-[90%]">
                            <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                              <img src="/fius-logo.png" alt={model.name} className="w-4 h-4 object-contain rounded-full flex-shrink-0" />
                              <span className="text-[10px] font-semibold text-muted-foreground">{model.name}</span>
                            </div>
                            <div className="rounded-3xl px-4 py-3 chat-bubble">
                              <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert break-words leading-relaxed">
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start mb-2">
                        <ThinkingCloud logo="/fius-logo.png" name={model.name} dark={dark} />
                      </div>
                    )}
                  </div>

                  {/* ── Per-chat ask-tab-style message bar ─────────── */}
                  <div className="mx-2 mb-3 flex-shrink-0">
                    <div className="relative bg-white dark:bg-[#383838] rounded-full glossy-outline !border-none !outline-none">
                      <div className="flex items-center px-3 py-2 gap-2">
                        {/* Fius logo left */}
                        <img src="/fius-logo.png" alt="" className="w-5 h-5 object-contain flex-shrink-0 opacity-60" />

                        {/* Textarea */}
                        <textarea
                          value={perInput[colIdx] || ''}
                          onChange={e => setPerInput(prev => ({ ...prev, [colIdx]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToColumn(colIdx); } }}
                          onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 38) + 'px'; }}
                          placeholder={`Message ${model.name}…`}
                          rows={1}
                          disabled={!isActive || typing[colIdx]}
                          className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden disabled:opacity-40"
                          style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                        />

                        {/* Model switcher pill (Super mode only) */}
                        {labMode === 'super' && (
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === colIdx ? null : colIdx); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.07] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border border-zinc-200/60 dark:border-white/10"
                            >
                              <img src={model.logo} alt="" className="w-3.5 h-3.5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                              <span className="truncate max-w-[60px]">{model.name}</span>
                              <ChevronDown className={`w-2.5 h-2.5 opacity-60 transition-transform duration-200 ${openDropdown === colIdx ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === colIdx && (
                              <div
                                className="absolute bottom-full mb-2 right-0 z-50 rounded-xl shadow-2xl overflow-hidden py-1"
                                style={{ background: dark ? '#383838' : '#ffffff', minWidth: 170, width: 'max-content' }}
                                onClick={e => e.stopPropagation()}
                              >
                                {SUPER_MODELS.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => { changeSlotModel(colIdx, m); setOpenDropdown(null); }}
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
                        )}

                        {/* Send button */}
                        <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-out ${(perInput[colIdx] || '').trim() ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                          <button
                            onClick={() => sendToColumn(colIdx)}
                            disabled={!(perInput[colIdx] || '').trim() || !isActive || typing[colIdx]}
                            className="w-8 h-8 bg-zinc-800 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 text-white dark:text-black rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
