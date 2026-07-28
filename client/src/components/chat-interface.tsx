import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import animeBoy1 from "@assets/Cute-Anime-Boy-Desktop-Wallpaper_1780491124348.jpg";
import animeBoy2 from "@assets/e4acdbfb00577aa06233ae2d91e2629a_1780491124348.jpg";
import animeBoy3 from "@assets/cool-anime-cartoon-dp_1780491124349.jpeg";
import animeBoy4 from "@assets/Vwmyh9_1780491124350.jpg";
import animeBoy5 from "@assets/HD-wallpaper-handsome-anime-boy-handsome-boy-anime_1780491124350.jpg";
import animeBoy6 from "@assets/HD-wallpaper-handsome-anime-boy-hōtarō-oreki-handsome-boy-anim_1780491124351.jpg";
import render3d1 from "@assets/5e835680417d8f37b203d006_5ad102cf0f7efdaab0f155e6_Who-is-the-_1780675830862.jpeg";
import render3d2 from "@assets/3d-rendering-box_1780675830864.avif";
import render3d3 from "@assets/media_1976b43e20a9983ad2b30c4524f9248e32dee7a22_1780675830865.jpg";
import pixelArt1 from "@assets/how-to-draw-a-rose-pixel-art-featured-image-1200_1780675830865.png";
import pixelArt2 from "@assets/a1b857df7f3bd73ec2ff9f2ee45b0b67_1780675830866.jpg";
import pixelArt3 from "@assets/3367465_1780675830867.png";
import pixelArt4 from "@assets/images_(1)_1780675830868.jpg";
import pixelArt5 from "@assets/Pixel-art-Creez-un-adorable-cochon-en-quelques-pixels_1780675830868.jpeg";
import studioHero from "@assets/Gemini_Generated_Image_rdsaverdsaverdsa_1784927084436.png";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FiusLogo, Logo } from "./logo";
import { useTheme } from "./theme-provider";
import { queryClient, authFetch, endGuestSession } from "@/lib/queryClient";
import { FiusGames } from "./fius-games";
import { FiusLabs } from "./fius-labs";
import { useUsage } from "@/hooks/use-usage";
import { Lock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStoredGlowAccent, getGlowGradient, applyAppFont, getActiveUiAccent, applyUiAccent, playTabClick, assignLogoStyleToConversation } from "@/lib/appearance-settings";

// ── Nomad sub-model options per provider (Normal & Flagship categories) ─────
const NOMAD_SUB_MODELS: Record<string, { normal: string[]; flagship: string[]; default: string }> = {
  'fius-ai':          { normal: ['Fius Lite'],                                                                         flagship: ['Fius Pro'],                                                default: 'Fius Lite' },
  'gpt-4o':           { normal: ['GPT-5 mini'],                                                                        flagship: ['GPT-5', 'GPT-5 Pro'],                                      default: 'GPT-5 mini' },
  'claude-3.5-sonnet':{ normal: ['Claude Haiku 4.5'],                                                                  flagship: ['Claude Sonnet 5', 'Claude Opus 4.8'],                      default: 'Claude Haiku 4.5' },
  'gemini-pro':       { normal: ['Gemini 3.5 Flash-Lite', 'Gemini 3.6 Flash'],                                        flagship: ['Gemini 3.1 Pro'],                                          default: 'Gemini 3.5 Flash-Lite' },
  'perplexity':       { normal: ['Perplexity Sonar', 'Perplexity Sonar Pro'],                                         flagship: ['Perplexity Sonar Reasoning Pro', 'Perplexity Sonar Deep Research'], default: 'Perplexity Sonar' },
  'grok-4':           { normal: ['Grok Build 0.1', 'Grok 4.3'],                                                       flagship: ['Grok 4.5'],                                                default: 'Grok Build 0.1' },
  'deepseek-r1':      { normal: ['DeepSeek V4 Flash'],                                                                 flagship: ['DeepSeek V4 Pro'],                                         default: 'DeepSeek V4 Flash' },
  'doubao':           { normal: ['Doubao Seed 2.0 Mini', 'Doubao Seed 2.0 Lite'],                                     flagship: ['Doubao Seed 2.0 Pro'],                                     default: 'Doubao Seed 2.0 Mini' },
  'kimi':             { normal: ['Kimi K2.6', 'Kimi K2.7 Code'],                                                      flagship: ['Kimi K3'],                                                 default: 'Kimi K2.6' },
  'qwen':             { normal: ['Qwen Flash', 'Qwen Plus', 'Qwen Coder'],                                            flagship: ['Qwen Max'],                                                default: 'Qwen Flash' },
  'llama-4':          { normal: ['Llama 4 Scout', 'Llama 4 Maverick'],                                                flagship: ['Llama 4 Behemoth'],                                        default: 'Llama 4 Scout' },
  'mistral':          { normal: ['Ministral 3', 'Ministral 3 14B', 'Mistral Small 4', 'Mistral Medium 3.5'],          flagship: ['Mistral Large 3'],                                         default: 'Ministral 3' },
  'copilot':          { normal: ['GPT-5 mini', 'GPT-5.4 mini / GPT-5.4 nano', 'GPT-5.5'],                            flagship: ['Claude Haiku / Sonnet'],                                   default: 'GPT-5 mini' },
};

// Generate vibrant colors based on user info (matching sidebar colors)
// Module-scope animation caches — survive component remounts and parent re-renders.
// Without these at module scope, defining TypingText inside the parent component
// would cause every parent re-render to remount all message bubbles and re-trigger
// their typing animations (the "cursor on every message" bug).
const globalCompletedTextsModule = new Map<string, string>();
const globalProgressTextsModule = new Map<string, string>();

// This component must stay at module scope. A component declared inside
// ChatInterface gets a new identity whenever chat state changes, which would
// restart the reveal and flash the bubble between plain text and Markdown.
function StableTypingResponse({
  text,
  messageId,
  finalContent,
  renderTyping,
}: {
  text: string;
  messageId: string;
  finalContent: React.ReactNode;
  renderTyping: (partialText: string) => React.ReactNode;
}) {
  const [displayed, setDisplayed] = useState(() =>
    globalCompletedTextsModule.has(messageId)
      ? text
      : (globalProgressTextsModule.get(messageId) || '')
  );
  const [done, setDone] = useState(() => globalCompletedTextsModule.has(messageId));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (globalCompletedTextsModule.has(messageId)) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    if (!text) {
      setDisplayed('');
      setDone(false);
      return;
    }

    // Keep the whitespace attached to each word. Splitting on whitespace and
    // joining with single spaces makes new paragraphs and Markdown bullets
    // appear as one block during the reveal, then reflow abruptly at the end.
    const chunks = text.match(/\S+(?:\s+|$)/g) ?? [];
    let index = Math.min(
      (globalProgressTextsModule.get(messageId) || '').match(/\S+(?:\s+|$)/g)?.length ?? 0,
      chunks.length,
    );
    let carry = 0;
    let last: number | null = null;
    setDone(false);

    const step = (now: number) => {
      if (last === null) last = now;
      carry += ((now - last) / 1000) * 30;
      last = now;
      const advance = Math.floor(carry);
      if (advance > 0) {
        carry -= advance;
        index = Math.min(index + advance, chunks.length);
      }
      if (index < chunks.length) {
        const next = chunks.slice(0, index).join('');
        globalProgressTextsModule.set(messageId, next);
        setDisplayed(next);
        frameRef.current = requestAnimationFrame(step);
      } else {
        globalProgressTextsModule.delete(messageId);
        globalCompletedTextsModule.set(messageId, text);
        setDisplayed(text);
        setDone(true);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [text, messageId]);

  return done
    ? <>{finalContent}</>
    : <div className="text-foreground prose prose-sm max-w-none dark:prose-invert relative">{renderTyping(displayed)}</div>;
}

// ── Rotating Ask-tab placeholders ────────────────────────────────────────────
const ROTATING_PLACEHOLDERS = [
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
  "Write a cover letter for...",
  "What are the best books on leadership?",
  "Help me brainstorm names for my brand",
  "Explain quantum computing simply",
  "What happened in the 1969 moon landing?",
  "Give me a recipe for chocolate cake",
];

// ── Fius Ultimatum suggestion card pool ──────────────────────────────────────
type UltimatumCard = { Icon: React.ElementType; label: string; prompt: string; modelName: string; modelLogo: string; color: string };
const ULTIMATUM_CARD_POOL: UltimatumCard[] = [
  { Icon: Brain,          label: 'Deep Reasoning',  prompt: 'Break down a complex problem step by step',    modelName: 'DeepSeek R1',     modelLogo: '/deepseek-logo.png',    color: '#6366f1' },
  { Icon: Search,         label: 'Live Search',      prompt: 'Find the latest news and real-time info',      modelName: 'Perplexity',      modelLogo: '/perplexity-logo.png',  color: '#0ea5e9' },
  { Icon: PenLine,        label: 'Creative Writing', prompt: 'Write a compelling story or article',          modelName: 'Claude',          modelLogo: '/claude-logo.png',      color: '#ec4899' },
  { Icon: Code,           label: 'Coding',           prompt: 'Debug, explain or write code for me',          modelName: 'GPT-5',           modelLogo: '/chatgpt-logo.png',     color: '#10b981' },
  { Icon: BarChart3,      label: 'Data Analysis',    prompt: 'Analyse data and uncover hidden insights',     modelName: 'Gemini',          modelLogo: '/gemini-logo.png',      color: '#f59e0b' },
  { Icon: Palette,        label: 'Design Ideas',     prompt: 'Generate UI/UX or visual concepts',            modelName: 'Claude',          modelLogo: '/claude-logo.png',      color: '#8b5cf6' },
  { Icon: TestTube2,      label: 'Science & Math',   prompt: 'Explain complex concepts in simple terms',     modelName: 'Gemini',          modelLogo: '/gemini-logo.png',      color: '#06b6d4' },
  { Icon: AlignLeft,      label: 'Summarise',        prompt: 'Condense a long text into key points',         modelName: 'GPT-5',           modelLogo: '/chatgpt-logo.png',     color: '#64748b' },
  { Icon: Lightbulb,      label: 'Brainstorm',       prompt: 'Generate a flood of creative ideas',           modelName: 'Claude',          modelLogo: '/claude-logo.png',      color: '#eab308' },
  { Icon: Cpu,            label: 'AI Strategy',      prompt: 'How to automate and scale using AI',           modelName: 'GPT-5',           modelLogo: '/chatgpt-logo.png',     color: '#a855f7' },
  { Icon: TrendingUp,     label: 'Business Plan',    prompt: 'Build a go-to-market or growth strategy',      modelName: 'Grok 4',          modelLogo: '/grok-logo.png',        color: '#ef4444' },
  { Icon: BookOpenCheck,  label: 'Research',         prompt: 'Deep-dive research with cited sources',        modelName: 'Perplexity',      modelLogo: '/perplexity-logo.png',  color: '#3b82f6' },
  { Icon: Globe,          label: 'Translation',      prompt: 'Translate with cultural nuance intact',        modelName: 'DeepSeek',        modelLogo: '/deepseek-logo.png',    color: '#f97316' },
  { Icon: Zap,            label: 'Quick Answer',     prompt: 'Fast, precise answer to any question',         modelName: 'Fius',            modelLogo: '/fius-logo.png',        color: '#fbbf24' },
  { Icon: Target,         label: 'Problem Solving',  prompt: 'Find the best path through any challenge',     modelName: 'DeepSeek R1',     modelLogo: '/deepseek-logo.png',    color: '#f43f5e' },
  { Icon: GraduationCap,  label: 'Learning',         prompt: 'Teach me something new from scratch',          modelName: 'Gemini',          modelLogo: '/gemini-logo.png',      color: '#0891b2' },
  { Icon: MessageSquare,  label: 'Debate & Argue',   prompt: 'Build the strongest case for a position',      modelName: 'Claude',          modelLogo: '/claude-logo.png',      color: '#d946ef' },
  { Icon: Shield,         label: 'Security',         prompt: 'Audit or explain security vulnerabilities',    modelName: 'GPT-5',           modelLogo: '/chatgpt-logo.png',     color: '#475569' },
  { Icon: Leaf,           label: 'Life Advice',      prompt: 'Help me think through a life decision',        modelName: 'Claude',          modelLogo: '/claude-logo.png',      color: '#16a34a' },
  { Icon: Rocket,         label: 'Startup Ideas',    prompt: 'Validate or refine my startup concept',        modelName: 'Grok 4',          modelLogo: '/grok-logo.png',        color: '#7c3aed' },
];
// Own Mode owl background positions (used when Own Mode is active — mirrors the star-bg pattern)
const OWL_BG_DATA = [
  {l:'5%',t:'8%',d:'0s',dur:'3.2s',dd:'0s',ddur:'9s',sz:'20px'},
  {l:'15%',t:'22%',d:'0.6s',dur:'2.8s',dd:'1.2s',ddur:'11s',sz:'16px'},
  {l:'28%',t:'6%',d:'1.2s',dur:'3.6s',dd:'0.5s',ddur:'8s',sz:'22px'},
  {l:'42%',t:'35%',d:'0.3s',dur:'2.6s',dd:'2.1s',ddur:'13s',sz:'18px'},
  {l:'55%',t:'12%',d:'1.5s',dur:'3.0s',dd:'0.8s',ddur:'10s',sz:'20px'},
  {l:'68%',t:'28%',d:'0.8s',dur:'2.9s',dd:'1.7s',ddur:'7s',sz:'17px'},
  {l:'78%',t:'5%',d:'0.4s',dur:'3.3s',dd:'0.3s',ddur:'12s',sz:'21px'},
  {l:'88%',t:'18%',d:'1.1s',dur:'2.7s',dd:'2.4s',ddur:'9s',sz:'16px'},
  {l:'10%',t:'45%',d:'1.8s',dur:'3.1s',dd:'1.0s',ddur:'11s',sz:'19px'},
  {l:'23%',t:'55%',d:'0.7s',dur:'2.8s',dd:'0.2s',ddur:'8s',sz:'18px'},
  {l:'37%',t:'65%',d:'1.0s',dur:'3.2s',dd:'1.8s',ddur:'14s',sz:'22px'},
  {l:'50%',t:'48%',d:'1.4s',dur:'2.5s',dd:'0.6s',ddur:'10s',sz:'17px'},
  {l:'63%',t:'70%',d:'0.3s',dur:'3.0s',dd:'2.2s',ddur:'9s',sz:'20px'},
  {l:'75%',t:'52%',d:'1.9s',dur:'2.9s',dd:'0.9s',ddur:'12s',sz:'16px'},
  {l:'85%',t:'40%',d:'0.9s',dur:'3.4s',dd:'1.4s',ddur:'7s',sz:'21px'},
  {l:'92%',t:'60%',d:'0.5s',dur:'2.7s',dd:'0.1s',ddur:'11s',sz:'18px'},
  {l:'7%',t:'75%',d:'1.6s',dur:'3.1s',dd:'2.0s',ddur:'8s',sz:'19px'},
  {l:'18%',t:'82%',d:'1.1s',dur:'2.6s',dd:'0.7s',ddur:'13s',sz:'16px'},
  {l:'32%',t:'88%',d:'0.6s',dur:'3.3s',dd:'1.5s',ddur:'10s',sz:'22px'},
  {l:'47%',t:'78%',d:'1.5s',dur:'2.8s',dd:'0.4s',ddur:'9s',sz:'17px'},
  {l:'60%',t:'85%',d:'1.0s',dur:'3.0s',dd:'1.9s',ddur:'11s',sz:'20px'},
  {l:'72%',t:'90%',d:'0.2s',dur:'2.5s',dd:'0.6s',ddur:'8s',sz:'18px'},
  {l:'82%',t:'75%',d:'1.3s',dur:'3.2s',dd:'2.3s',ddur:'12s',sz:'21px'},
  {l:'94%',t:'82%',d:'0.7s',dur:'2.9s',dd:'1.1s',ddur:'9s',sz:'16px'},
  {l:'3%',t:'55%',d:'2.0s',dur:'3.1s',dd:'0.3s',ddur:'10s',sz:'19px'},
  {l:'48%',t:'20%',d:'0.4s',dur:'2.7s',dd:'1.6s',ddur:'14s',sz:'20px'},
  {l:'90%',t:'35%',d:'1.4s',dur:'3.3s',dd:'0.8s',ddur:'8s',sz:'17px'},
  {l:'35%',t:'42%',d:'0.9s',dur:'2.6s',dd:'2.0s',ddur:'11s',sz:'22px'},
  {l:'20%',t:'68%',d:'1.7s',dur:'3.0s',dd:'0.5s',ddur:'9s',sz:'18px'},
  {l:'70%',t:'15%',d:'0.6s',dur:'2.8s',dd:'1.3s',ddur:'13s',sz:'20px'},
];

function shuffleUltimatum<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Smart image component with loading skeleton + fallback URL support for Pollinations images
function GeneratedImageDisplay({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [elapsed, setElapsed] = React.useState(0);
  const [retryKey, setRetryKey] = React.useState(0);
  const fallbacksTriedRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const buildFreshUrl = (url: string, attempt: number): string => {
    try {
      const u = new URL(url);
      const base = `${u.origin}${u.pathname}`;
      const newSeed = Math.floor(Math.random() * 9_000_000) + 1;
      const models = ['turbo', 'flux', 'flux-realism'];
      const model = models[attempt % models.length];
      return `${base}?width=1024&height=1024&seed=${newSeed}&model=${model}&nologo=true`;
    } catch { return url; }
  };

  const handleError = () => {
    fallbacksTriedRef.current++;
    if (fallbacksTriedRef.current <= 3) {
      setCurrentSrc(buildFreshUrl(src, fallbacksTriedRef.current));
    } else {
      setStatus('error');
    }
  };

  const handleRetry = () => {
    fallbacksTriedRef.current = 0;
    setElapsed(0);
    setStatus('loading');
    setCurrentSrc(buildFreshUrl(src, 0));
    setRetryKey(k => k + 1);
  };

  React.useEffect(() => {
    if (status !== 'loading') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, retryKey]);

  const loadingMsg = elapsed < 10 ? 'Generating image…'
    : elapsed < 25 ? `Still working… (${elapsed}s)`
    : elapsed < 45 ? `This is taking a while… (${elapsed}s)`
    : `Almost there… (${elapsed}s)`;

  return (
    <div className={`relative my-3 rounded-xl overflow-hidden border border-border shadow-md ${className || ''}`} style={{ maxWidth: '100%' }}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/30" style={{ minHeight: 200 }}>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{loadingMsg}</p>
          {elapsed >= 30 && (
            <button onClick={handleRetry}
              className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Try different seed
            </button>
          )}
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-rose-50 dark:from-slate-800 dark:to-rose-900/20 p-8 gap-3" style={{ minHeight: 140 }}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Image didn't load — Fius Studio is busy, please retry</p>
          <button onClick={handleRetry}
            className="px-5 py-2 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            ↺ Retry with new seed
          </button>
        </div>
      )}
      <img
        key={retryKey}
        src={currentSrc}
        alt={alt || 'Generated image'}
        className="max-w-full h-auto rounded-xl"
        style={{ display: status === 'error' ? 'none' : 'block', minHeight: status === 'loaded' ? undefined : 200, opacity: status === 'loading' ? 0 : 1, transition: 'opacity 0.3s' }}
        onLoad={() => { setStatus('loaded'); if (timerRef.current) clearInterval(timerRef.current); }}
        onError={handleError}
      />
    </div>
  );
}

function getVibrantColor(name: string, secondary = false): string {
  const colors = [
    ['#ef4444', '#dc2626'], // Red gradient
    ['#f59e0b', '#d97706'], // Yellow gradient
    ['#f97316', '#ea580c'], // Orange gradient
    ['#3b82f6', '#2563eb'], // Blue gradient
    ['#10b981', '#059669'], // Green gradient
    ['#8b5cf6', '#7c3aed'], // Purple gradient
    ['#ec4899', '#db2777'], // Pink gradient
    ['#06b6d4', '#0891b2'], // Cyan gradient
    ['#84cc16', '#65a30d'], // Lime gradient
    ['#f43f5e', '#e11d48'], // Rose gradient
  ];
  
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorPair = colors[Math.abs(hash) % colors.length];
  return secondary ? colorPair[1] : colorPair[0];
}
import { CustomizeModal } from "./customize-modal";
import { UpgradeModal } from "./upgrade-modal";
import { ImageGenerationDialog } from "./image-generation-dialog";
import { EducationModal } from "./education-modal";
import { VoiceModeModal } from "./voice-mode-modal";
import { VideoCallModal } from "./video-call-modal";
import { NomadNotification } from "./nomad-notification";
import { ImagineModal } from "./imagine-modal";
import { Sidebar } from "./sidebar";
import { QuizModal, QuizQuestion } from "./quiz-modal";
import { downloadPptx } from "@/lib/pptx-export";
import { downloadWordDoc } from "@/lib/docx-export";
import { useWebSocket } from "../hooks/use-websocket";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/use-speech";
import { ChatMessage, ChatPreset, AVAILABLE_MODELS, MODEL_OPTIONS, AvailableModel, WebSocketMessage } from "../types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { History } from "lucide-react";
import {
  Menu,
  Bell,
  Mic,
  Image,
  Camera,
  Edit,
  FileText,
  Paperclip,
  Undo,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  RefreshCw,
  MicOff,
  Zap,
  Code2 as Code,
  Edit3 as PenTool,
  Search,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Brain,
  X,
  AudioLines,
  GraduationCap,
  Moon,
  Sun,
  Monitor,
  ToggleLeft,
  Square,
  ChevronLeft,
  ChevronRight,
  Check,
  Palette,
  FileDown,
  MessageSquarePlus,
  Video,
  Upload,
  Download,
  Share2,
  Heart,
  Loader2,
  Sparkles,
  Wand2,
  Maximize2,
  Minimize2,
  AlignLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Plus,
  FileSignature,
  PenLine,
  BarChart3,
  TestTube2,
  Cpu,
  BookOpenCheck,
  Globe,
  Shield,
  Leaf,
  Rocket,
  MessageSquare,
} from "lucide-react";
import { downloadTxt, downloadPdf } from "@/lib/document-export";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getCachedWikiImage, fetchWikiImage, preloadWikiImages } from "@/lib/wiki-image-cache";
import { preloadGamesData } from "./fius-games";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

import microphoneIcon from "@assets/microphone_1784996715112.png";
import improvePromptIcon from "@assets/improve_promt__1784996516976.png";
import plusButtonIcon from "@assets/add_1784996715112.png";

function WikiFace({ name, wikiTitle, className = '' }: { name: string; wikiTitle?: string; className?: string }) {
  const articleTitle = wikiTitle || name;
  const [src, setSrc] = useState<string | null>(getCachedWikiImage(articleTitle) ?? null);

  useEffect(() => {
    const cached = getCachedWikiImage(articleTitle);
    if (cached) {
      setSrc(cached);
      return;
    }
    let cancelled = false;
    fetchWikiImage(articleTitle).then(url => {
      if (!cancelled && url) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [articleTitle]);

  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover object-top" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

// Local custom images — checked before Wikipedia fallback
const LOCAL_PERSONALITY_IMAGES: Record<string, string> = {
  'jinnah':      '/personalities/jinnah.png',
  'gandhi':      '/personalities/gandhi.png',
  'caesar':      '/personalities/caesar.png',
  'alexander':   '/personalities/alexander.png',
  'napoleon':    '/personalities/napoleon.png',
  'mandela':     '/personalities/mandela.png',
  'genghis':     '/personalities/genghis.png',
  'akbar':       '/personalities/akbar.png',
  'suleiman':    '/personalities/suleiman.png',
  'tipu':        '/personalities/tipu.png',
  'socrates':    '/personalities/socrates.png',
  'aristotle':   '/personalities/aristotle.png',
  'confucius':   '/personalities/confucius.png',
  'nietzsche':   '/personalities/nietzsche.png',
  'marx':        '/personalities/marx.png',
  'kant':        '/personalities/kant.png',
  'suntzu':      '/personalities/suntzu.png',
  'machiavelli': '/personalities/machiavelli.png',
  'shakespeare': '/personalities/shakespeare.png',
  'rumi':        '/personalities/rumi.png',
  'plato':       '/personalities/plato.png',
  'einstein':    '/personalities/einstein.png',
  'newton':      '/personalities/newton.png',
  'tesla':       '/personalities/tesla.png',
  'da_vinci':    '/personalities/da_vinci.png',
  'hawking':     '/personalities/hawking.png',
  'turing':      '/personalities/turing.png',
};

function PersonalityCard({ id, name, wikiTitle }: { id: string; name: string; wikiTitle?: string }) {
  const localSrc = LOCAL_PERSONALITY_IMAGES[id] ?? null;
  const articleTitle = wikiTitle || name;
  const [wikiSrc, setWikiSrc] = useState<string | null>(localSrc ? null : (getCachedWikiImage(articleTitle) ?? null));
  useEffect(() => {
    if (localSrc) return; // skip Wikipedia fetch when we have a local image
    const cached = getCachedWikiImage(articleTitle);
    if (cached) { setWikiSrc(cached); return; }
    let cancelled = false;
    fetchWikiImage(articleTitle).then(url => { if (!cancelled && url) setWikiSrc(url); });
    return () => { cancelled = true; };
  }, [articleTitle, localSrc]);
  const src = localSrc ?? wikiSrc;
  return src ? (
    <img src={src} alt={name} className="absolute inset-0 w-full object-cover object-top" style={{ height: '115%', top: 0 }} />
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-white text-4xl font-bold">
      {name.charAt(0)}
    </div>
  );
}

interface HistoricalPersonality {
  id: string;
  name: string;
  era: string;
  role: string;
  category: string;
  style: string;
  wikiTitle?: string;
}

const HISTORICAL_PERSONALITIES: HistoricalPersonality[] = [
  // Leaders
  { id: 'jinnah', name: 'Muhammad Ali Jinnah', era: '1876–1948', role: 'Founder of Pakistan', category: 'Leaders', style: 'Formal, precise, passionate about rights and justice, uses legal reasoning, speaks with calm authority and conviction' },
  { id: 'gandhi', name: 'Mahatma Gandhi', era: '1869–1948', role: 'Leader of Indian Independence', category: 'Leaders', style: 'Gentle, humble, speaks in parables and simple truths, references nonviolence and truth (Satyagraha), deeply spiritual and resolute' },
  { id: 'caesar', name: 'Julius Caesar', era: '100–44 BC', role: 'Roman Dictator', category: 'Leaders', style: 'Commanding, confident, uses "we" for Rome, strategic thinker, references glory and empire, speaks with military precision' },
  { id: 'alexander', name: 'Alexander the Great', era: '356–323 BC', role: 'Macedonian Conqueror', category: 'Leaders', style: 'Bold, visionary, speaks of destiny and greatness, inspires through courage, references his campaigns and the edges of the world' },
  { id: 'napoleon', name: 'Napoleon Bonaparte', era: '1769–1821', role: 'French Emperor', category: 'Leaders', style: 'Intense, direct, tactical genius, references battles and strategy, speaks with supreme confidence and ambition, occasional French expressions' },
  { id: 'mandela', name: 'Nelson Mandela', era: '1918–2013', role: 'South African President', category: 'Leaders', style: 'Dignified, forgiving, references freedom and reconciliation, speaks with wisdom earned through suffering, calm and hopeful' },
  { id: 'genghis', name: 'Genghis Khan', era: '1162–1227', role: 'Mongol Empire Founder', category: 'Leaders', style: 'Fierce, pragmatic, references the steppe and conquest, values loyalty and strength, speaks of unity through power' },
  { id: 'akbar', name: 'Akbar the Great', era: '1542–1605', role: 'Mughal Emperor', category: 'Leaders', style: 'Tolerant, wise, references religious harmony and justice, curious and philosophical, speaks with imperial warmth' },
  { id: 'suleiman', name: 'Suleiman the Magnificent', era: '1494–1566', role: 'Ottoman Sultan', category: 'Leaders', style: 'Majestic, cultured, references law and the Ottoman Empire, speaks with poetic sophistication and imperial grandeur' },
  { id: 'tipu', name: 'Tipu Sultan', era: '1750–1799', role: 'Ruler of Mysore', category: 'Leaders', style: 'Brave, anti-colonial, references freedom from British rule, speaks with fierce patriotism and Islamic devotion' },
  // Philosophers
  { id: 'socrates', name: 'Socrates', era: '470–399 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Uses the Socratic method — questions back constantly, admits knowing nothing, draws out contradictions, humble yet devastatingly sharp' },
  { id: 'plato', name: 'Plato', era: '428–348 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Uses dialogues and allegories, references the Forms and the ideal world, speaks with poetic depth and philosophical precision' },
  { id: 'aristotle', name: 'Aristotle', era: '384–322 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Systematic, categorizing, references logic and the golden mean, speaks methodically and covers all aspects of a topic' },
  { id: 'confucius', name: 'Confucius', era: '551–479 BC', role: 'Chinese Philosopher', category: 'Philosophers', style: 'Speaks in short, wise sayings, references virtue and relationships, asks about one\'s duties, gentle but morally firm' },
  { id: 'nietzsche', name: 'Friedrich Nietzsche', era: '1844–1900', role: 'German Philosopher', category: 'Philosophers', style: 'Aphoristic, bold, references the Übermensch and will to power, challenges all conventional morality, dramatic and provocative' },
  { id: 'marx', name: 'Karl Marx', era: '1818–1883', role: 'Socialist Philosopher', category: 'Philosophers', style: 'Analytical, dialectical, references class struggle and capitalism, academic yet passionate, uses historical materialism' },
  { id: 'kant', name: 'Immanuel Kant', era: '1724–1804', role: 'German Philosopher', category: 'Philosophers', style: 'Dense, rigorous, references the categorical imperative and duty, speaks in complex sentences, always seeks universal principles' },
  { id: 'suntzu', name: 'Sun Tzu', era: '544–496 BC', role: 'Chinese Strategist', category: 'Philosophers', style: 'Cryptic and strategic, speaks in paradoxes, references warfare as metaphor for life, economy of words, deeply practical' },
  { id: 'machiavelli', name: 'Niccolò Machiavelli', era: '1469–1527', role: 'Political Philosopher', category: 'Philosophers', style: 'Coldly pragmatic, references The Prince and power, separates morality from politics, gives ruthless practical advice' },
  // Scientists
  { id: 'einstein', name: 'Albert Einstein', era: '1879–1955', role: 'Theoretical Physicist', category: 'Scientists', style: 'Curious, thought-experiment driven, references relativity and imagination, speaks with wonder, uses simple analogies for complex ideas, pacifist' },
  { id: 'newton', name: 'Isaac Newton', era: '1643–1727', role: 'Mathematician & Physicist', category: 'Scientists', style: 'Precise, references natural philosophy and God\'s creation, serious and solitary, speaks with mathematical certainty' },
  { id: 'tesla', name: 'Nikola Tesla', era: '1856–1943', role: 'Electrical Engineer & Inventor', category: 'Scientists', style: 'Visionary, eccentric, references alternating current and the future, speaks with intensity and frustration at being misunderstood' },
  { id: 'da_vinci', name: 'Leonardo da Vinci', era: '1452–1519', role: 'Polymath & Artist', category: 'Scientists', style: 'Curiosity without bounds, references art and science as one, speaks through observation and sketches in words, Renaissance wonder' },
  { id: 'hawking', name: 'Stephen Hawking', era: '1942–2018', role: 'Theoretical Physicist', category: 'Scientists', style: 'Dry wit, references black holes and the Big Bang, uses humor to discuss the cosmos, speaks in clear accessible language' },
  { id: 'turing', name: 'Alan Turing', era: '1912–1954', role: 'Computer Scientist', category: 'Scientists', style: 'Precise, references machines and computation, speaks with mathematical elegance, occasionally references his persecution with sadness' },
  // Arts & Literature
  { id: 'shakespeare', name: 'William Shakespeare', era: '1564–1616', role: 'English Playwright & Poet', category: 'Artists', style: 'Uses poetic language and metaphors, references theater and human nature, speaks in rhythm almost like verse, quotes himself often' },
  { id: 'rumi', name: 'Rumi', era: '1207–1273', role: 'Persian Sufi Poet', category: 'Artists', style: 'Mystical and loving, references the soul\'s longing for the divine, speaks in metaphors of wine and the beloved, deeply spiritual' },
];

const PERSONALITY_CATEGORIES = ['All', 'Leaders', 'Philosophers', 'Scientists', 'Artists'];

const MAX_FILES = 5;
const MAX_IMAGES = 15;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function ImagineImageCard({ imageUrl, fallbackUrls, onExpand }: { imageUrl: string; fallbackUrls: string[]; onExpand?: (src: string) => void }) {
  const isBase64 = imageUrl.startsWith('data:');
  const [loading, setLoading] = React.useState(!isBase64);
  const [downloading, setDownloading] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [attempt, setAttempt] = React.useState(0);
  const [src, setSrc] = React.useState(imageUrl);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const freshUrl = React.useCallback((baseUrl: string) => {
    if (baseUrl.startsWith('data:')) return baseUrl;
    try {
      const u = new URL(baseUrl);
      u.searchParams.set('seed', String(Math.floor(Math.random() * 9_000_000) + 1));
      const models = ['flux', 'turbo', 'flux-schnell', 'flux-realism'];
      u.searchParams.set('model', models[Math.floor(Math.random() * models.length)]);
      return u.toString();
    } catch { return baseUrl; }
  }, []);

  React.useEffect(() => {
    if (!loading || isBase64) return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, attempt, isBase64]);

  React.useEffect(() => {
    if (!loading || isBase64) return;
    retryTimeoutRef.current = setTimeout(() => {
      setElapsed(0); setAttempt(a => a + 1); setSrc(freshUrl(imageUrl));
    }, 35_000);
    return () => { if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current); };
  }, [loading, attempt, imageUrl, freshUrl, isBase64]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (src.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = src; a.download = 'fius-image.jpg';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        const res = await fetch(src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fius-image.jpg';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { window.open(src, '_blank'); }
    finally { setDownloading(false); }
  };

  const statusMsg = elapsed < 15 ? 'Fius Studio is generating your image…'
    : elapsed < 30 ? `Still working… (${elapsed}s)`
    : `Taking a bit longer… auto-retrying soon`;

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm relative bg-muted" style={{ minHeight: loading ? 200 : 0 }}>
      {loading && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-14">
          <div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-medium text-center px-4">{statusMsg}</span>
          {elapsed >= 22 && (
            <button onClick={() => { setElapsed(0); setAttempt(a => a + 1); setSrc(freshUrl(imageUrl)); }}
              className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              ↺ Try new seed
            </button>
          )}
        </div>
      )}
      <img
        key={`${attempt}-${src.slice(0, 60)}`}
        src={src}
        alt="Generated"
        className={`w-full h-auto transition-opacity duration-300 ${loading ? 'hidden' : 'block'} ${onExpand ? 'cursor-zoom-in' : ''}`}
        onClick={() => onExpand && onExpand(src)}
        onLoad={() => { setLoading(false); if (timerRef.current) clearInterval(timerRef.current); if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current); }}
        onError={() => {
          const allUrls = [imageUrl, ...fallbackUrls].filter(u => !u.startsWith('data:'));
          const nextBase = allUrls[(attempt + 1) % Math.max(allUrls.length, 1)] || imageUrl;
          setTimeout(() => { setElapsed(0); setAttempt(a => a + 1); setSrc(freshUrl(nextBase)); }, 2000);
        }}
      />
      {!loading && (
        <button onClick={handleDownload} disabled={downloading}
          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg transition-colors z-20 disabled:opacity-50">
          {downloading ? '…' : '⬇ Download'}
        </button>
      )}
    </div>
  );
}

const IMAGINE_PROMPTS_BY_STYLE: Record<string, {label: string; prompt: string; img: string}[]> = {
  "Photorealistic": [
    { label: "Mountain Sunrise",   prompt: "a breathtaking sunrise over snow-capped mountain peaks with golden rays",         img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70&auto=format&fit=crop" },
    { label: "Ocean Storm",        prompt: "powerful ocean waves crashing against rocky cliffs in a storm",                    img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=70&auto=format&fit=crop" },
    { label: "Lion Portrait",      prompt: "a majestic lion in close-up with intense eyes and golden mane",                   img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=70&auto=format&fit=crop" },
    { label: "Aurora Borealis",    prompt: "vivid northern lights dancing over a frozen lake in Iceland",                     img: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=70&auto=format&fit=crop" },
    { label: "Tropical Beach",     prompt: "crystal-clear turquoise water on a pristine tropical beach at noon",              img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70&auto=format&fit=crop" },
    { label: "Milky Way Sky",      prompt: "the milky way galaxy reflected in a still alpine lake at midnight",               img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=70&auto=format&fit=crop" },
    { label: "Desert at Dusk",     prompt: "sweeping sand dunes casting long shadows at golden hour in the Sahara",           img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=70&auto=format&fit=crop" },
    { label: "Tropical Waterfall", prompt: "a lush waterfall cascading into a turquoise jungle pool",                        img: "https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=70&auto=format&fit=crop" },
    { label: "Snow Leopard",       prompt: "a rare snow leopard prowling across a Himalayan mountain ridge",                  img: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&q=70&auto=format&fit=crop" },
    { label: "Volcano Lava",       prompt: "glowing lava flowing into the ocean at night creating steam clouds",              img: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&q=70&auto=format&fit=crop" },
    { label: "Autumn Forest",      prompt: "a golden autumn forest path lined with maple trees in peak fall colors",          img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70&auto=format&fit=crop" },
    { label: "Coral Reef",         prompt: "vibrant coral reef teeming with colorful tropical fish in crystal water",         img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=70&auto=format&fit=crop" },
  ],
  "Anime": [
    { label: "Anime Boy — City Sunset",  prompt: "anime boy listening to music on a rooftop at sunset, cherry blossoms, city skyline, cel-shaded", img: animeBoy1 },
    { label: "Anime Boy — Rain",         prompt: "cool anime boy with white hair and umbrella in the rain, blue coat, confident smile",             img: animeBoy2 },
    { label: "Anime Boy — Portrait",     prompt: "cute anime boy with white spiky hair and teal eyes, playful expression, dark turtleneck",         img: animeBoy3 },
    { label: "Anime Boy — Hoodie",       prompt: "anime boy with grey hair holding a phone, black hoodie, contemplative mood, soft shading",         img: animeBoy4 },
    { label: "Anime Boy — Umbrella",     prompt: "handsome anime boy with blue eyes under umbrella in the rain, black coat, dramatic sky",           img: animeBoy5 },
    { label: "Anime Boy — Green Eyes",   prompt: "anime boy with green eyes and dark hair in school uniform, soft glowing background, gentle smile",  img: animeBoy6 },
  ],
  "Oil Painting": [
    { label: "Starry Night",        prompt: "a swirling starry night sky over a sleeping village, bold impasto strokes, van gogh oil painting style", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/400px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg" },
    { label: "Water Lilies",        prompt: "soft floating water lily pads on a shimmering pond, impressionist oil painting, loose brushwork and light reflections", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/400px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg" },
    { label: "Pearl Earring",       prompt: "a beautiful portrait in rembrandt oil style with dramatic chiaroscuro lighting and rich glazed colors", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/400px-1665_Girl_with_a_Pearl_Earring.jpg" },
    { label: "Sunflowers",          prompt: "a vibrant vase of sunflowers in full bloom with thick textured brushstrokes, warm yellows and deep browns", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg/400px-Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg" },
    { label: "Almond Blossoms",     prompt: "delicate white and pink almond blossoms on a vivid blue sky background, expressive van gogh brushwork", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/400px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg" },
    { label: "Irises",              prompt: "bold purple irises in full bloom with lush green leaves, swirling oil paint texture",                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Irises-Vincent_van_Gogh.jpg/400px-Irises-Vincent_van_Gogh.jpg" },
    { label: "Wheat Field Crows",   prompt: "dramatic wheat field under stormy skies with crows taking flight, emotional van gogh impasto",       img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Vincent_van_Gogh_-_Wheat_Field_with_Crows_-_Google_Art_Project.jpg/400px-Vincent_van_Gogh_-_Wheat_Field_with_Crows_-_Google_Art_Project.jpg" },
    { label: "Mona Lisa",           prompt: "a mysterious portrait with sfumato technique, soft glazed oil colors and enigmatic expression",       img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg" },
    { label: "Girl with Balloon",   prompt: "a field ablaze with autumn colors under dramatic oil painted skies, loose impressionist strokes",     img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=70&auto=format&fit=crop" },
  ],
  "3D Render": [
    { label: "Coastal House",       prompt: "a photorealistic 3D render of a modern house on rocky coastal cliffs at dusk, dramatic moody lighting",  img: render3d1 },
    { label: "3D Box Scene",        prompt: "a clean minimalist 3D product render of geometric shapes with studio lighting and soft shadows",          img: render3d2 },
    { label: "Interior Scene",      prompt: "a beautiful 3D rendered interior design scene with soft lighting, furniture, and plants",                 img: render3d3 },
  ],
  "Watercolor": [
    { label: "Young Hare",          prompt: "a detailed watercolor study of a hare with soft fur texture, botanical illustration style",           img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Albrecht_D%C3%BCrer_-_Young_Hare%2C_1502_-_Google_Art_Project.jpg/400px-Albrecht_D%C3%BCrer_-_Young_Hare%2C_1502_-_Google_Art_Project.jpg" },
    { label: "Rainy Paris",         prompt: "a charming Paris cafe in the rain with colorful umbrellas, soft wet watercolor washes",              img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70&auto=format&fit=crop" },
    { label: "Hummingbird",         prompt: "a vibrant hummingbird in flight with tropical flowers, loose wet-on-wet watercolor technique",       img: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&q=70&auto=format&fit=crop" },
    { label: "Coastal Village",     prompt: "a picturesque coastal village with pastel houses on a hillside, soft Mediterranean watercolor",      img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=70&auto=format&fit=crop" },
    { label: "Tulip Fields",        prompt: "rows of colorful Dutch tulips with a windmill, cheerful loose watercolor illustration",               img: "https://images.unsplash.com/photo-1431794062232-2a99a5431c6c?w=400&q=70&auto=format&fit=crop" },
    { label: "Misty Mountains",     prompt: "soft mountain peaks emerging from morning mist, delicate layered watercolor washes of blue and grey", img: "https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&q=70&auto=format&fit=crop" },
    { label: "Butterfly Garden",    prompt: "monarch butterflies resting on wildflowers, delicate translucent watercolor wings and petals",       img: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=400&q=70&auto=format&fit=crop" },
    { label: "Magnolia Blossom",    prompt: "a close-up of magnolia blossoms in spring, soft pink and white watercolor petals with ink outline",  img: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&q=70&auto=format&fit=crop" },
  ],
  "Pixel Art": [
    { label: "Pixel Rose",          prompt: "a detailed 8-bit pixel art rose with red petals and green stem on a white grid background",          img: pixelArt1 },
    { label: "Pixel Bunny",         prompt: "an adorable 16-bit pixel art bunny character with pink and white colors, retro game sprite style",   img: pixelArt2 },
    { label: "Dot Portrait",        prompt: "a black and white stipple dot matrix pixel art portrait with fine grid pattern",                     img: pixelArt3 },
    { label: "Pixel Sonic",         prompt: "a classic 16-bit pixel art Sonic the Hedgehog sprite running, blue and red retro game character",    img: pixelArt4 },
    { label: "Pixel Pig",           prompt: "a cute 8-bit pixel art pig character with pink colors and black outlines on a grid background",      img: pixelArt5 },
  ],
  "Sketch": [
    { label: "Vitruvian Man",       prompt: "detailed anatomical sketch study of human proportions with geometric overlays, pen and ink, da vinci style", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/400px-Da_Vinci_Vitruve_Luc_Viatour.jpg" },
    { label: "Gothic Cathedral",    prompt: "detailed pencil sketch of a gothic cathedral facade with intricate stone carvings and flying buttresses", img: "https://images.unsplash.com/photo-1548625149-720754978729?w=400&q=70&auto=format&fit=crop" },
    { label: "Sailing Ship",        prompt: "detailed graphite sketch of a tall sailing ship with billowing sails on rough open seas",            img: "https://images.unsplash.com/photo-1505459668311-8dfac7952bf0?w=400&q=70&auto=format&fit=crop" },
    { label: "City Skyline",        prompt: "architectural ink sketch of a dense city skyline with hatching and cross-hatching details",           img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=70&auto=format&fit=crop" },
    { label: "Horse Study",         prompt: "expressive charcoal figure study of a horse mid-gallop, dynamic lines and smudged shadows",           img: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=70&auto=format&fit=crop" },
    { label: "Wolf Portrait",       prompt: "expressive pencil portrait sketch of a wolf with intense eyes and detailed fur texture",              img: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&q=70&auto=format&fit=crop" },
    { label: "Still Life Vase",     prompt: "classical pencil still life of flowers in a vase with careful hatching and soft shading",            img: "https://images.unsplash.com/photo-1490750967868-88df5691cc4c?w=400&q=70&auto=format&fit=crop" },
    { label: "Ancient Tree",        prompt: "fine ink pen sketch of a massive ancient oak with gnarled twisted branches and detailed bark texture", img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&q=70&auto=format&fit=crop" },
  ],
  "Cinematic": [
    { label: "Desert Highway",      prompt: "cinematic wide shot of an empty desert highway stretching to the horizon at dawn, dusty warm tones",  img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70&auto=format&fit=crop" },
    { label: "Stormy Sea Cliffs",   prompt: "dramatic cinematic shot of a lone figure on sea cliffs in a raging storm, extreme weather",          img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=70&auto=format&fit=crop" },
    { label: "Golden Hour City",    prompt: "sweeping aerial cinematic shot of a sprawling city bathed in warm golden hour light",                 img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=70&auto=format&fit=crop" },
    { label: "Foggy Bridge",        prompt: "moody cinematic shot of a suspension bridge disappearing into thick morning fog, blue-grey tones",   img: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=70&auto=format&fit=crop" },
    { label: "Night Train",         prompt: "atmospheric long exposure shot of a lone train moving through snowy dark mountains at night",         img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=70&auto=format&fit=crop" },
    { label: "Jungle Temple",       prompt: "cinematic discovery shot of an ancient stone temple overtaken by jungle vines and roots",            img: "https://images.unsplash.com/photo-1563380166-d42abbc1a7bc?w=400&q=70&auto=format&fit=crop" },
    { label: "Neon Rain Street",    prompt: "rain-soaked city street at night with neon sign reflections pooling on wet pavement, blade runner vibe", img: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=70&auto=format&fit=crop" },
    { label: "Ridge Silhouette",    prompt: "a silhouette of a lone hiker standing on a mountain ridge at sunset with epic dramatic sky",         img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70&auto=format&fit=crop" },
    { label: "Arctic Expedition",   prompt: "cinematic wide shot of explorers trudging across a vast frozen arctic wilderness in a whiteout",     img: "https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=400&q=70&auto=format&fit=crop" },
  ],
};

// ─── Language auto-detection for TTS voices ──────────────────────────────────
function detectVoiceForText(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK-AsadNeural';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN-MadhurNeural';
  if (/\b(hai|hain|kya|aap|mein|nahi|haan|bhi|toh|ab|jo|ke|ka|ki|ko|yeh|woh|tha|thi|theek|accha|lekin|phir|kaisa|matlab|bilkul|kyun|kaise|kab|kaun|kahan|aaj|agar|tum|hum)\b/i.test(text)) return 'ur-PK-AsadNeural';
  return 'en-US-GuyNeural';
}

// ─── PC Follow-up Suggestions ────────────────────────────────────────────────
function PCFollowUpSuggestions({ msgContent, onSelect }: { msgContent: string; onSelect: (q: string) => void }) {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    authFetch('/api/suggest-followups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msgContent.slice(0, 700) }),
    }).then(r => r.json()).then(d => {
      if (!cancelled && Array.isArray(d.suggestions) && d.suggestions.length > 0)
        setSuggestions(d.suggestions.slice(0, 3));
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => <div key={i} className="h-7 w-full max-w-[420px] rounded-full bg-accent animate-pulse" />)}
    </div>
  );
  if (!suggestions.length) return null;
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent text-[11.5px] text-foreground font-medium transition-all active:scale-95 text-left shadow-sm flex items-center gap-1.5 w-fit max-w-full">
          <span className="text-muted-foreground text-[13px] leading-none">⤷</span>
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── PC Scroll buttons — fade + disable at scroll limits (matches mobile) ────
function PCScrollButtons({ scrollAreaRef }: { scrollAreaRef: React.RefObject<HTMLDivElement | null> }) {
  const [atTop, setAtTop] = React.useState(true);
  const [atBottom, setAtBottom] = React.useState(false);
  React.useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 8);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [scrollAreaRef]);
  const controls = (
    <div className="fixed bottom-36 right-6 flex flex-col gap-1.5 z-[1000]">
      <button onClick={() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        disabled={atTop}
        className={`w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 ${atTop ? "opacity-30 cursor-default" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`} title="Scroll to top">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })}
        disabled={atBottom}
        className={`w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 ${atBottom ? "opacity-30 cursor-default" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`} title="Scroll to bottom">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(controls, document.body);
}

// ── Imagine Studio: 4 model columns (shared across generation + display) ────
const US = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&h=420&fit=crop&q=90&auto=format`;

const IMAGINE_EDIT_TEMPLATES = [
  {
    label: 'Reimagine Yourself Professionally',
    color: '#0e1a2a',
    img: US('1560250097-0b93528c311a'),
    prompt: 'Turn this person into a professional version of themselves, wearing formal clothes and placed in a modern office environment. Keep their face, pose, and overall look exactly the same, just make them look more polished and career-ready. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Reimagine Yourself in the Future',
    color: '#151510',
    img: US('1504194104404-433180773017'),
    prompt: 'Show this person as an older version of themselves in the future. Add natural aging like grey hair and mature features, but keep their face, pose, and identity the same. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Become Your Anime Self',
    color: '#0d1b2a',
    img: US('1607604276583-eef5d076aa5f'),
    prompt: 'Convert this person into an anime-style version while keeping the same pose, face structure, and composition. Just change the style to anime, nothing else. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Turn Yourself into a Sketch',
    color: '#111',
    img: US('1541961017774-22349e4a1262'),
    prompt: 'Turn this image into a pencil sketch drawing. Keep the same person, same pose, and same details, only change the style to a realistic sketch. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Restore & Revive Old Photos',
    color: '#1a1209',
    img: US('1516466723902-9b53e71d8f3e'),
    prompt: 'Restore this photo by removing blur, noise, and damage. Improve clarity and bring back natural colors while keeping everything exactly the same. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Redesign Your Living Space',
    color: '#1c1410',
    img: US('1586023492125-27b2c045efd7'),
    prompt: 'Redesign this room to look more modern and stylish while keeping the same layout and structure. Improve lighting, furniture look, and overall vibe without changing the scene too much. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
  {
    label: 'Transform to Winter Wonderland',
    color: '#0d1520',
    img: US('1418985991508-e1df0ade1f4f'),
    prompt: 'Turn this scene into a winter version with snow and a cold atmosphere. Keep the same person, pose, and composition, just change the environment to winter. Keep everything else unchanged. Do not alter the person\'s identity or pose.',
  },
];

/* ── 34 visual style templates for 3D marquee rows (Unsplash) ── */
const STUDIO_VISUAL_TEMPLATES = [
  /* ── SPACES (10) — thumb-0 to thumb-9 ── */
  { id: 'pottery-studio',      category: 'Spaces',      name: 'Rustic Pottery Studio',           thumb: '/templates/thumb-0.jpg',  prompt: 'Vertical 9:16 interior design photo, a warm rustic pottery studio with wooden shelves filled with handmade ceramic mugs and bowls, a woman working at a pottery wheel, natural light streaming through a vintage window, earthy tones, cozy artisan atmosphere, 8k.' },
  { id: 'greenhouse-sunroom',  category: 'Spaces',      name: 'Glass Greenhouse Sunroom',        thumb: '/templates/thumb-1.jpg',  prompt: 'Vertical 9:16 interior design photo, a lush glass greenhouse garden room filled with tropical monstera plants, hanging ferns and pothos, a cozy rattan armchair by a tea tray, golden sunset light flooding through the glass ceiling panels, botanical paradise.' },
  { id: 'home-library',        category: 'Spaces',      name: 'Classic Home Library Nook',       thumb: '/templates/thumb-2.jpg',  prompt: 'Vertical 9:16 interior design photo, a cozy classic home library reading nook with floor-to-ceiling mahogany bookshelves lined with vintage books, a plush blue velvet armchair, a warm floor lamp glowing softly, an open book resting on a side table, scholarly atmosphere.' },
  { id: 'gaming-desk-setup',   category: 'Spaces',      name: 'Dark Aesthetic Desk Setup',       thumb: '/templates/thumb-3.jpg',  prompt: 'Vertical 9:16 interior design photo, a sleek dark-themed home office desk setup featuring an ultrawide curved monitor, acoustic geometric wall panels, a mechanical keyboard, a small succulent plant, moody warm LED backlighting, premium minimal workstation aesthetic.' },
  { id: 'bohemian-kitchen',    category: 'Spaces',      name: 'Bohemian Espresso Kitchen',       thumb: '/templates/thumb-4.jpg',  prompt: 'Vertical 9:16 interior design photo, a charming bohemian kitchen coffee corner with a chrome espresso machine on a marble counter, white-painted brick walls, rustic wooden floating shelves with jars and ceramic mugs, Edison bulb pendants, trailing ivy plants, warm cozy atmosphere.' },
  { id: 'log-cabin-fireplace', category: 'Spaces',      name: 'Cozy Log Cabin by the Lake',      thumb: '/templates/thumb-5.jpg',  prompt: 'Vertical 9:16 interior design photo, a snug log cabin living room corner with a crackling stone fireplace, a brown leather armchair draped with a chunky knit blanket, a rustic side table with a steaming mug and book, a large window overlooking a misty pine lake, hygge atmosphere.' },
  { id: 'stone-spa-bath',      category: 'Spaces',      name: 'Stone Cave Spa Bathroom',         thumb: '/templates/thumb-6.jpg',  prompt: 'Vertical 9:16 interior design photo, a luxurious spa bathroom carved from natural stone, a large rough-hewn stone soaking bathtub with candles floating, bamboo tray across the tub, stone walls with glowing recessed candle niches, eucalyptus branches, rustic indulgent atmosphere.' },
  { id: 'boho-balcony',        category: 'Spaces',      name: 'Boho City Balcony Garden',        thumb: '/templates/thumb-7.jpg',  prompt: 'Vertical 9:16 interior design photo, a cozy bohemian apartment balcony with a hanging rattan egg chair, lush tropical potted plants including monstera and palms, string fairy lights, a jute rug, a city skyline glowing in the golden sunset background, urban jungle oasis.' },
  { id: 'attic-art-studio',    category: 'Spaces',      name: 'Attic Artist Studio',             thumb: '/templates/thumb-8.jpg',  prompt: 'Vertical 9:16 interior design photo, a charming attic artist studio with exposed wooden roof beams, a large skylight letting in bright natural light, a wooden easel with a colorful oil painting, art supplies scattered on a stool, a hanging pothos plant, bohemian floor cushions, creative and dreamy.' },
  { id: 'japanese-tea-room',   category: 'Spaces',      name: 'Japanese Tea Room',               thumb: '/templates/thumb-9.jpg',  prompt: 'Vertical 9:16 interior design photo, a serene minimalist Japanese tea room with tatami mat flooring, a low dark wood chabudai table with a ceramic teapot and tea cups, a single ikebana floral arrangement, soft shoji paper screen window casting warm diffused light, zen tranquility.' },
  /* ── NATURE (10) — thumb-10 to thumb-19 ── */
  { id: 'fjord-cliff-vista',   category: 'Nature',      name: 'Dramatic Fjord Cliff Vista',      thumb: '/templates/thumb-10.jpg', prompt: 'Vertical 9:16 landscape photography, a lone hiker standing on a dramatic rocky cliff edge overlooking a vast Norwegian fjord valley with shimmering water far below, dramatic sunrays breaking through storm clouds, epic cinematic scale, adventure photography, 8k.' },
  { id: 'coastal-sunset',      category: 'Nature',      name: 'Sunset Coastal Cliffs',           thumb: '/templates/thumb-11.jpg', prompt: 'Vertical 9:16 landscape photography, a woman in a flowing rust-red dress standing on rugged coastal cliffs overlooking crashing turquoise waves, vivid orange and pink sunset sky, wild coastal flowers in the foreground, cinematic travel photography.' },
  { id: 'desert-sunrise',      category: 'Nature',      name: 'Desert Sunrise Expedition',       thumb: '/templates/thumb-12.jpg', prompt: 'Vertical 9:16 landscape photography, a lone explorer walking across vast golden Sahara sand dunes towards a blazing orange sunrise horizon, deep footprints in the rippled sand, dramatic warm golden light, cinematic adventure photography.' },
  { id: 'autumn-river-canoe',  category: 'Nature',      name: 'Autumn River & Canoe',            thumb: '/templates/thumb-13.jpg', prompt: 'Vertical 9:16 landscape photography, a wooden canoe moored on a still autumn river perfectly reflecting brilliant red, orange and yellow foliage lining the banks, soft morning mist rising from the water, serene fall nature photography, 8k.' },
  { id: 'jungle-bridge',       category: 'Nature',      name: 'Jungle Bridge & Waterfall',       thumb: '/templates/thumb-14.jpg', prompt: 'Vertical 9:16 landscape photography, a backpacker standing on a mossy wooden rope bridge suspended in a lush tropical rainforest, a tall misty waterfall cascading behind through the dense green canopy, soft rain-filtered light, adventure nature photography.' },
  { id: 'wheat-field-sunset',  category: 'Nature',      name: 'Golden Wheat Field at Sunset',    thumb: '/templates/thumb-15.jpg', prompt: 'Vertical 9:16 landscape photography, a woman in a flowing dress walking through a vast golden wheat field at a dramatic fiery sunset, warm amber light illuminating the swaying grain, long shadows, cinematic countryside photography.' },
  { id: 'redwood-forest',      category: 'Nature',      name: 'Misty Redwood Forest Trail',      thumb: '/templates/thumb-16.jpg', prompt: 'Vertical 9:16 landscape photography, a hiker walking along a trail through towering ancient redwood trees in a thick grey fog, giant moss-covered trunks dwarfing the figure, moody atmospheric forest, Pacific Northwest wilderness photography.' },
  { id: 'milky-way-lake',      category: 'Nature',      name: 'Milky Way Over Mountain Lake',    thumb: '/templates/thumb-17.jpg', prompt: 'Vertical 9:16 astrophotography, a person sitting on a wooden dock gazing at the spectacular Milky Way galaxy arching over a perfectly still alpine lake reflecting snowy mountain peaks, deep blue night sky, breathtaking long exposure.' },
  { id: 'birch-forest-walk',   category: 'Nature',      name: 'Golden Birch Forest Walk',        thumb: '/templates/thumb-18.jpg', prompt: 'Vertical 9:16 landscape photography, a hiker walking away down a trail lined with tall white-barked birch trees glowing golden yellow in full autumn colour, warm sunrays piercing the canopy creating magical light beams, cinematic fall forest.' },
  { id: 'sunflower-field',     category: 'Nature',      name: 'Sunflower Field at Sunrise',      thumb: '/templates/thumb-19.jpg', prompt: 'Vertical 9:16 landscape photography, a woman in a white summer dress standing among endless rows of tall bright yellow sunflowers at soft pastel sunrise, gentle warm light, joyful summer countryside photography, 8k.' },
  /* ── PORTRAITS (10) — thumb-20 to thumb-29 ── */
  { id: 'bw-street-portrait',  category: 'Portraits',   name: 'Cinematic B&W Street Portrait',   thumb: '/templates/thumb-20.jpg', prompt: 'Vertical 9:16 cinematic black and white portrait photo, a brooding rugged man leaning against a dark alley wall at night, a distant street lamp creating dramatic chiaroscuro lighting, rain-slicked pavement in background, film noir atmosphere, 8k.' },
  { id: 'red-carpet-glamour',  category: 'Portraits',   name: 'Red Carpet Glamour Look',         thumb: '/templates/thumb-21.jpg', prompt: 'Vertical 9:16 editorial portrait photo, a glamorous woman in a stunning emerald green sequined gown posing on a Hollywood red carpet premiere, photographers in background, event lights, confident smile, celebrity editorial photography.' },
  { id: 'hijab-studio',        category: 'Portraits',   name: 'Minimalist Hijab Studio Portrait',thumb: '/templates/thumb-22.jpg', prompt: 'Vertical 9:16 beauty studio portrait photo, a close-up of a beautiful woman wearing a soft pastel chiffon hijab in blush and mint tones, flawless glowing skin, calm confident expression, clean white studio background, soft natural light, high-end beauty photography.' },
  { id: 'sherwani-palace',     category: 'Portraits',   name: 'Royal Sherwani Palace Portrait',  thumb: '/templates/thumb-23.jpg', prompt: 'Vertical 9:16 portrait photo, a handsome young groom wearing an ornate black velvet sherwani with rich gold zardozi embroidery, a traditional safa turban, standing inside a grand Mughal palace with carved arches and warm chandelier light, regal cinematic portrait.' },
  { id: 'dark-fashion-model',  category: 'Portraits',   name: 'Dark Fashion Model Portrait',     thumb: '/templates/thumb-24.jpg', prompt: 'Vertical 9:16 high fashion portrait photo, a fierce female model in an oversized structured black wool overcoat, sleek straight bob hairstyle, dramatic dark studio with moody side lighting, editorial magazine quality, intense gaze, luxury fashion campaign.' },
  { id: 'distinguished-gent',  category: 'Portraits',   name: 'Distinguished Gentleman Portrait',thumb: '/templates/thumb-25.jpg', prompt: 'Vertical 9:16 executive portrait photo, a distinguished silver-haired older gentleman in a sharp double-breasted black suit with pocket square and dress watch, dark seamless studio background, authoritative powerful pose, classic timeless executive photography.' },
  { id: 'office-professional', category: 'Portraits',   name: 'Modern Office Professional',      thumb: '/templates/thumb-26.jpg', prompt: 'Vertical 9:16 portrait photo, a confident smiling young professional woman in a linen blazer standing in a bright modern Scandinavian office with large windows, green plants, open workspace in background, friendly approachable LinkedIn-style portrait.' },
  { id: 'keynote-speaker',     category: 'Portraits',   name: 'Keynote Stage Speaker',           thumb: '/templates/thumb-27.jpg', prompt: 'Vertical 9:16 editorial portrait photo, a charismatic male speaker in a navy suit holding a clicker on a massive illuminated stage at a major tech conference, large screen and arena crowd visible behind, dramatic stage lighting, dynamic full-body shot.' },
  { id: 'creative-director',   category: 'Portraits',   name: 'Creative Director Desk Portrait', thumb: '/templates/thumb-28.jpg', prompt: 'Vertical 9:16 portrait photo, a smiling professional woman in a navy blazer sitting at a reclaimed wood desk in a creative loft office with exposed brick, bookshelf, warm lamp, open notebook and laptop, authentic workplace lifestyle photography.' },
  { id: 'corporate-headshot',  category: 'Portraits',   name: 'Clean Corporate Headshot',        thumb: '/templates/thumb-29.jpg', prompt: 'Vertical 9:16 professional headshot photo, a confident smiling businessman in a charcoal blazer and open-collar white shirt, clean light blue seamless background, soft natural studio lighting, approachable expression, LinkedIn corporate headshot quality.' },
  /* ── FANTASY (10) — thumb-30 to thumb-39 ── */
  { id: 'electric-superhero',  category: 'Fantasy',     name: 'Electric Superhero Stance',       thumb: '/templates/thumb-30.jpg', prompt: 'Vertical 9:16 cinematic concept art, a powerful armored superhero standing in the rain on a city street, crackling white-blue lightning bolts surging from his hands and body, glowing eyes, neon signs in background, dramatic fog and rain, heroic full-body pose.' },
  { id: 'villain-study-room',  category: 'Fantasy',     name: 'Wealthy Villain Study',           thumb: '/templates/thumb-31.jpg', prompt: 'Vertical 9:16 cinematic portrait photo, a sophisticated charming villain in an all-black velvet suit with gold pocket pin, relaxing in a dark leather chesterfield armchair in a dimly lit study filled with bookshelves and a crackling fireplace, holding a whiskey glass, moody.' },
  { id: 'dragon-battle-warrior',category:'Fantasy',     name: 'Dragon Battle Warrior',           thumb: '/templates/thumb-32.jpg', prompt: 'Vertical 9:16 epic fantasy concept art, a fierce battle-worn female warrior in intricate silver-grey armor wielding a longsword and shield, standing on a rocky highland battlefield with dragons flying and breathing fire in the stormy sky behind her, cinematic.' },
  { id: 'celestial-sorceress', category: 'Fantasy',     name: 'Celestial Sorceress',             thumb: '/templates/thumb-33.jpg', prompt: 'Vertical 9:16 high fantasy digital art, a ethereal sorceress with long silver hair and a crystal crown, draped in a flowing purple and silver cosmic gown, casting glowing magical runes, a swirling nebula galaxy portal surrounding her, stars and cosmos background.' },
  { id: 'medieval-king',       category: 'Fantasy',     name: 'Medieval King on Throne',         thumb: '/templates/thumb-34.jpg', prompt: 'Vertical 9:16 cinematic fantasy portrait, a stern authoritative medieval king in a jewelled gold crown and deep red ermine-trimmed royal robes, seated on an ornate gold throne in a grand cathedral hall lit by candles and stained glass, regal and powerful.' },
  { id: 'esports-champion',    category: 'Fantasy',     name: 'Esports World Champion',          thumb: '/templates/thumb-35.jpg', prompt: 'Vertical 9:16 cinematic editorial photo, a triumphant young esports champion in a black and gold gaming jersey holding a massive golden trophy on a sold-out arena stage, confetti falling, crowd cheering, dramatic stage lighting, championship moment.' },
  { id: 'anime-lightning-sword',category:'Fantasy',     name: 'Anime Lightning Swordsman',       thumb: '/templates/thumb-36.jpg', prompt: 'Vertical 9:16 anime digital art, a dramatic male anime warrior with spiky black hair and glowing blue eyes in dark leather armor, dual-wielding a crackling electric magic longsword, casting blue lightning runes, stormy ruined castle background, dynamic battle pose.' },
  { id: 'female-astronaut',    category: 'Fantasy',     name: 'Female Astronaut in Deep Space',  thumb: '/templates/thumb-37.jpg', prompt: 'Vertical 9:16 cinematic sci-fi portrait, a female astronaut in a detailed white NASA spacesuit floating in deep space, a vibrant blue and orange nebula galaxy swirling behind her, a space station visible in the distance, photorealistic space adventure photography.' },
  { id: 'cyberpunk-warrior',   category: 'Fantasy',     name: 'Cyberpunk Neon Warrior',          thumb: '/templates/thumb-38.jpg', prompt: 'Vertical 9:16 cyberpunk digital art, a powerful female warrior in a sleek purple-neon illuminated tactical armor holding a glowing katana, standing in a rainy neo-Tokyo street covered in neon signs and Japanese kanji billboards, rain reflections, futuristic atmosphere.' },
  { id: 'pixar-3d-character',  category: 'Fantasy',     name: 'Pixar 3D Character Portrait',     thumb: '/templates/thumb-39.jpg', prompt: 'Vertical 9:16 Pixar 3D animation style character portrait, an adorable young girl with big expressive eyes and a bun hairstyle in a cozy blue knit sweater with a tiny fox emblem, warm soft living room background, Pixar quality subsurface skin rendering, charming and heartwarming.' },
  /* ── FASHION (10) — thumb-40 to thumb-49 ── */
  { id: 'urban-techwear',      category: 'Fashion',     name: 'Urban Techwear Night Style',      thumb: '/templates/thumb-40.jpg', prompt: 'Vertical 9:16 fashion editorial photo, a stylish Asian man in a grey multi-pocket tactical techwear jacket with utility straps, jogger cargo pants and futuristic sneakers, posing on a rain-slicked Tokyo street at night surrounded by neon pink and cyan signs, cyberpunk streetwear campaign.' },
  { id: 'ivory-ethnic-suit',   category: 'Fashion',     name: 'Ivory Embroidered Ethnic Suit',   thumb: '/templates/thumb-41.jpg', prompt: 'Vertical 9:16 fashion portrait photo, an elegant South Asian woman in a stunning ivory silk embroidered sharara suit with delicate threadwork, a sheer cape dupatta, pearl jewelry, standing by a large sunlit window in a modern interior, sophisticated ethnic fashion editorial.' },
  { id: 'tropical-linen-man',  category: 'Fashion',     name: 'Tropical Beach Linen Style',      thumb: '/templates/thumb-42.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a handsome smiling man in a crisp white linen shirt and light beige linen trousers with leather sandals, holding a straw hat, standing on a sunlit wooden terrace with tropical beach and palm trees behind, relaxed resort fashion shoot.' },
  { id: 'white-wedding-sherwani',category:'Fashion',    name: 'Classic White Wedding Sherwani',  thumb: '/templates/thumb-43.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a handsome South Asian groom in an elegant off-white embroidered sherwani with gold thread motifs, layered pearl mala, a white-gold safa turban, standing in a sun-drenched heritage stone courtyard with carved arches, regal bridal fashion.' },
  { id: 'emerald-cocktail',    category: 'Fashion',     name: 'Emerald Silk Cocktail Dress',     thumb: '/templates/thumb-44.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a glamorous sophisticated woman in a deep emerald green wrap-style silk midi dress, pearl drop earrings, holding a crystal cocktail glass, seated in a dark luxurious cocktail lounge with warm chandelier glow, high-end evening wear fashion.' },
  { id: 'teal-banarasi-saree', category: 'Fashion',     name: 'Teal Banarasi Silk Saree',        thumb: '/templates/thumb-45.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a graceful woman wearing a magnificent teal and gold Banarasi silk saree with intricate floral brocade weave, traditional gold temple jewelry, jasmine flowers in hair, standing inside an ancient heritage haveli with carved pillars, timeless ethnic fashion.' },
  { id: 'minimalist-linen-man',category: 'Fashion',     name: 'Minimalist Linen Casual Chic',    thumb: '/templates/thumb-46.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a calm handsome man in an all-natural beige linen shirt and matching wide-leg linen trousers, barefoot, standing against a textured sandstone wall in warm natural light, minimalist clean aesthetic, slow fashion editorial style.' },
  { id: 'black-gold-jacket',   category: 'Fashion',     name: 'Black Gold Embroidered Jacket',   thumb: '/templates/thumb-47.jpg', prompt: 'Vertical 9:16 fashion portrait photo, a powerful South Asian woman in a sharp structured black wool bandhgala jacket adorned with intricate gold paisley zardozi embroidery on the lapels and shoulders, minimal jewelry, dark textured studio background, authoritative fashion editorial.' },
  { id: 'bridal-red-lehenga',  category: 'Fashion',     name: 'Bridal Red Lehenga Portrait',     thumb: '/templates/thumb-48.jpg', prompt: 'Vertical 9:16 bridal fashion portrait, a radiant bride in a heavily embroidered crimson and gold bridal lehenga choli with polki diamond necklace and maang tikka, full bridal makeup, seated in a candle-lit Rajasthani palace with carved stone arches, warm cinematic bridal photography.' },
  { id: 'olive-athleisure',    category: 'Fashion',     name: 'Olive Athleisure Gym Fit',        thumb: '/templates/thumb-49.jpg', prompt: 'Vertical 9:16 fitness fashion photo, a confident athletic woman in a matching olive green ribbed sports bra and high-waist leggings set with white running shoes, standing in a bright modern concrete gym, fit and strong physique, clean activewear brand photography.' },
  /* ── TRADITIONAL (9) — thumb-50 to thumb-58 ── */
  { id: 'bridal-silk-saree',   category: 'Traditional', name: 'Bridal Red Temple Silk Saree',    thumb: '/templates/thumb-50.jpg', prompt: 'Vertical 9:16 portrait photo, a beautiful South Indian bride wearing a gorgeous deep crimson Kanjivaram silk saree with a wide gold zari border, heavy gold temple jewelry with maang tikka and jhumkas, surrounded by brass diyas and marigold flowers, warm candlelit mandap backdrop.' },
  { id: 'haldi-yellow-saree',  category: 'Traditional', name: 'Haldi Ceremony Yellow Saree',     thumb: '/templates/thumb-51.jpg', prompt: 'Vertical 9:16 portrait photo, a glowing joyful bride wearing a bright sunshine yellow chiffon saree decorated with fresh white jasmine and marigold flower jewelry garlands, smiling radiantly, surrounded by yellow and white floral haldi ceremony decorations, warm sunlit atmosphere.' },
  { id: 'mehndi-pink-lehenga', category: 'Traditional', name: 'Mehndi Night Pink Lehenga',       thumb: '/templates/thumb-52.jpg', prompt: 'Vertical 9:16 portrait photo, a smiling bride in a delicate blush pink embroidered lehenga with gold threadwork, showing off intricate bridal mehndi henna designs on both hands raised, wearing a floral gajra garland necklace, warm candlelit mehndi ceremony background with fairy lights.' },
  { id: 'ivory-heritage-sherwani',category:'Traditional',name: 'Ivory Heritage Wedding Sherwani',thumb: '/templates/thumb-53.jpg', prompt: 'Vertical 9:16 portrait photo, an elegant groom in a beautifully tailored ivory silk sherwani with subtle gold paisley embroidery, layered pearl mala, a cream-gold safa turban with a brooch, standing in a sunlit Rajasthani heritage temple courtyard with carved stone pillars and marigold garlands.' },
  { id: 'navy-kurta-waistcoat',category: 'Traditional', name: 'Navy Kurta & Brocade Waistcoat',  thumb: '/templates/thumb-54.jpg', prompt: 'Vertical 9:16 portrait photo, a stylish young man in a navy blue silk kurta paired with a rich gold-copper brocade nehru waistcoat, layered pearl necklace, smiling warmly, standing in front of a festive backdrop of lanterns, string lights and marigold decorations, Eid or Diwali celebration look.' },
  { id: 'grand-bridal-lehenga',category: 'Traditional', name: 'Grand Bridal Lehenga by Candlelight',thumb: '/templates/thumb-55.jpg', prompt: 'Vertical 9:16 portrait photo, a majestic bride in a floor-length heavily embroidered crimson and antique gold bridal lehenga with a red embroidered dupatta draped over her head, complete bridal jewelry, standing in a grand candlelit palace hall with floral arrangements, cinematic royal bridal portrait.' },
  { id: 'maroon-velvet-groom', category: 'Traditional', name: 'Maroon Velvet Sherwani Groom',    thumb: '/templates/thumb-56.jpg', prompt: 'Vertical 9:16 portrait photo, a handsome groom in a rich maroon velvet sherwani with intricate gold paisley brocade, a deep red safa turban with an ornate brooch, layered pearl mala, seated relaxed in a vintage Victorian-era carved velvet armchair in a dimly lit ornate room, elegant traditional.' },
  { id: 'palace-bridal-seat',  category: 'Traditional', name: 'Heritage Palace Bridal Portrait', thumb: '/templates/thumb-57.jpg', prompt: 'Vertical 9:16 portrait photo, a stunning bride in a rich red and gold embroidered bridal lehenga seated gracefully on an ornate carved chair in a grand marble palace corridor with gold candelabras, warm candlelight glowing across her full bridal jewelry, cinematic royal portrait photography.' },
  { id: 'nikah-ivory-look',    category: 'Traditional', name: 'Nikah Ivory Embroidered Look',    thumb: '/templates/thumb-58.jpg', prompt: 'Vertical 9:16 portrait photo, a serene and beautiful bride in an exquisite ivory and gold embroidered anarkali gown with a matching sheer chiffon dupatta draped softly over her head, delicate gold jewelry, seated peacefully with downcast eyes, surrounded by white roses and lanterns, Nikah ceremony portrait.' },
  /* ── TRAVEL (10) — thumb-60 to thumb-69 ── */
  { id: 'mountain-village-dawn',category:'Travel',      name: 'Misty Mountain Village at Dawn',  thumb: '/templates/thumb-60.jpg', prompt: 'Vertical 9:16 travel portrait photo, a woman wrapped in a cozy plaid shawl standing on a rocky hillside at sunrise, looking out over layers of misty green mountains and pine forests with a small village nestled in the valley below, soft golden morning light, serene Carpathian countryside.' },
  { id: 'nyc-street-explorer', category: 'Travel',      name: 'New York City Street Explorer',   thumb: '/templates/thumb-61.jpg', prompt: 'Vertical 9:16 travel portrait photo, a well-dressed man in a navy wool overcoat carrying a leather backpack, walking confidently across a busy New York City intersection with iconic red-brick buildings and yellow taxis in the background, overcast winter daylight, metropolitan travel aesthetic.' },
  { id: 'swiss-valley-hiker',  category: 'Travel',      name: 'Swiss Green Valley Hiker',        thumb: '/templates/thumb-62.jpg', prompt: 'Vertical 9:16 travel portrait photo, a rugged male traveler in an olive waxed canvas jacket and beanie standing on a boulder, overlooking a breathtaking lush Swiss valley with rolling green hills, a winding river, and morning fog drifting between pine forests, cinematic alpine travel.' },
  { id: 'swiss-snow-peak',     category: 'Travel',      name: 'Swiss Alpine Snow Peak',          thumb: '/templates/thumb-63.jpg', prompt: 'Vertical 9:16 travel portrait photo, a man in a dark grey winter coat and scarf standing on a snow-dusted rock ledge with a dramatic Swiss alpine mountain panorama behind him, snow-covered peaks under a moody cloudy sky, crisp cold winter atmosphere, cinematic travel photography.' },
  { id: 'desert-dunes-sunset', category: 'Travel',      name: 'Desert Dunes Sunset',             thumb: '/templates/thumb-64.jpg', prompt: 'Vertical 9:16 travel portrait photo, a relaxed male traveler with a backpack sitting on the smooth crest of a golden Sahara sand dune at magical sunset, a distant camel caravan silhouetted on the horizon, warm amber and rose tones, adventurous desert travel photography.' },
  { id: 'maldives-beach-hammock',category:'Travel',     name: 'Maldives Beach Hammock',          thumb: '/templates/thumb-65.jpg', prompt: 'Vertical 9:16 travel portrait photo, a relaxed smiling woman in a flowing white linen outfit reclining in a rope beach hammock under swaying palm trees, soft turquoise Maldivian ocean water behind, golden late afternoon light, frangipani flowers on the sand, tropical paradise vacation.' },
  { id: 'maldives-jetty',      category: 'Travel',      name: 'Maldives Overwater Jetty',        thumb: '/templates/thumb-66.jpg', prompt: 'Vertical 9:16 travel portrait photo, a charming man in a white linen open shirt and chinos holding a straw hat, standing barefoot on a wooden overwater jetty with crystal-clear turquoise shallow Maldivian water below, overwater bungalows visible, bright tropical sunlight.' },
  { id: 'paris-eiffel-evening',category: 'Travel',      name: 'Paris Eiffel Tower Evening Stroll',thumb: '/templates/thumb-67.jpg', prompt: 'Vertical 9:16 travel portrait photo, an elegant woman in a stylish camel trench coat and black turtleneck walking on a glowing cobblestone Parisian street at blue hour dusk, the iconic illuminated Eiffel Tower perfectly framed at the end of the boulevard, warm street lamps, romantic Paris travel.' },
  { id: 'santorini-village',   category: 'Travel',      name: 'Santorini White Village',         thumb: '/templates/thumb-68.jpg', prompt: 'Vertical 9:16 travel portrait photo, a radiant woman in a flowing white maxi dress posing against the iconic whitewashed curved walls of Santorini Oia, a blue-domed church and the sparkling deep blue Aegean Sea visible behind her, bright Mediterranean sunlight, bougainvillea flowers.' },
  { id: 'dubai-burj-view',     category: 'Travel',      name: 'Dubai Burj Khalifa Sunset View',  thumb: '/templates/thumb-69.jpg', prompt: 'Vertical 9:16 travel portrait photo, a confident stylish man leaning on a glass balcony railing of a luxury high-rise hotel, the iconic Burj Khalifa tower dominating the golden sunset skyline behind him, Dubai downtown gleaming in the warm evening light, luxury travel photography.' },
  /* ── PRODUCTS (10) — thumb-70 to thumb-79 ── */
  { id: 'smartphone-hero',     category: 'Products',    name: 'Smartphone Dark Studio Hero Shot', thumb: '/templates/thumb-70.jpg', prompt: 'Vertical 9:16 product photography, a sleek matte black premium smartphone standing upright on a dark stone cylindrical pedestal, dramatic studio rim lighting highlighting the precision metal frame and camera module, dark smoky background, luxury tech product commercial photography, 8k.' },
  { id: 'botanical-candle-gift',category:'Products',    name: 'Luxury Botanical Candle Gift Box', thumb: '/templates/thumb-71.jpg', prompt: 'Vertical 9:16 product photo, a premium soy candle in a clear glass jar filled with dried lavender and chamomile flowers, sitting inside an elegant matte black magnetic gift box lined with black crinkle paper, warm soft ambient lighting, luxury lifestyle product photography.' },
  { id: 'diwali-gift-hamper',  category: 'Products',    name: 'Diwali Festive Gift Hamper',      thumb: '/templates/thumb-72.jpg', prompt: 'Vertical 9:16 product photo, an open deep purple luxury gift hamper box revealing artisanal chocolates, a small brass diya oil lamp, a honey jar, and hand-tied sweets, surrounded by glowing diyas and bright marigold petals on a rustic wooden surface, warm Diwali festive ambience.' },
  { id: 'skincare-serum-set',  category: 'Products',    name: 'Skincare Serum & Jade Roller Set', thumb: '/templates/thumb-73.jpg', prompt: 'Vertical 9:16 product flat lay photo, three frosted glass serum bottles with silver dropper caps labelled Ritual Serum arranged alongside a green jade facial roller on a pure white surface, eucalyptus leaves and soft botanical shadows, clean bright studio lighting, minimalist beauty brand photography.' },
  { id: 'biryani-brass-handi', category: 'Products',    name: 'Steaming Biryani in Brass Handi', thumb: '/templates/thumb-74.jpg', prompt: 'Vertical 9:16 food photography, a steaming aromatic chicken biryani garnished with fresh mint and saffron strands in a hammered brass handi on a rustic wooden table, surrounded by copper bowls of raita and kachumber salad and flaky laccha paratha, warm rustic restaurant lighting, appetizing.' },
  { id: 'latte-art-mug',       category: 'Products',    name: 'Latte Art Ceramic Coffee Mug',    thumb: '/templates/thumb-75.jpg', prompt: 'Vertical 9:16 product lifestyle photo, a gorgeous handmade dark glazed ceramic coffee mug with a perfect rosette latte art pattern, placed on a warm wooden cafe table with soft sunlight coming from a nearby window, green potted plants blurred in background, cozy morning coffee atmosphere.' },
  { id: 'iced-coffee-splash',  category: 'Products',    name: 'Iced Coffee Milk Splash Shot',    thumb: '/templates/thumb-76.jpg', prompt: 'Vertical 9:16 high-speed product photography, a tall glass of iced caramel latte with a metal straw, dramatic swirling milk splash frozen mid-air around the glass, dark moody black background, condensation droplets on the glass, cinematic beverage commercial photography.' },
  { id: 'marble-serum-flatlay',category: 'Products',    name: 'Marble Flat Lay Elixir Serum',    thumb: '/templates/thumb-77.jpg', prompt: 'Vertical 9:16 top-down flat lay product photo, a minimalist glass dropper bottle labelled Aurora Elixir with a gold cap, placed on a circular gold tray on a white veined marble surface, surrounded by tiny white babys breath flowers, smooth river pebbles and a tiny gold spoon, clean luxury skincare.' },
  { id: 'dark-perfume-bottle', category: 'Products',    name: 'Dark Moody Perfume Bottle Shot',  thumb: '/templates/thumb-78.jpg', prompt: 'Vertical 9:16 luxury product photo, a heavy square black glass perfume bottle engraved with Nocturne on a wet dark slate stone surface with scattered water droplets, deep shadows, dramatic single side rim lighting creating metallic glints on the silver cap, high-end fragrance editorial photography.' },
  { id: 'acai-bowl-flatlay',   category: 'Products',    name: 'Acai Breakfast Bowl Flat Lay',    thumb: '/templates/thumb-79.jpg', prompt: 'Vertical 9:16 top-down flat lay food photography, a vibrant acai smoothie bowl topped with fresh sliced strawberries, blueberries, kiwi pieces and crunchy granola, alongside a white ceramic coffee cup and a honey dipper on a white wooden plank surface, bright natural morning light, healthy lifestyle.' },
]
const STUDIO_ROW1 = STUDIO_VISUAL_TEMPLATES.slice(0, 40);
const STUDIO_ROW2 = STUDIO_VISUAL_TEMPLATES.slice(40);

const STUDIO_COLS = [
  { id: 'fius-imagine-super', name: 'Fius Imagine Super', sub: 'Ultra quality',  logo: '/fius-logo.png',       gradient: 'from-violet-500 to-fuchsia-500', letter: '✦', color: '#8b5cf6' },
  { id: 'seedream-4.5',        name: 'Seedream 4.5',       sub: 'Dreamlike art',  logo: '/bytedance-logo.png',  gradient: 'from-emerald-400 to-teal-500',   letter: '❋', color: '#10b981' },
  { id: 'nano-banana-pro',     name: 'Nano Banana Pro',    sub: 'Fast & crisp',   logo: '/gemini-logo.png',     gradient: 'from-yellow-400 to-orange-400',  letter: '⚡', color: '#f59e0b' },
  { id: 'gpt-5.5-pro',         name: 'GPT 5.5 pro',        sub: 'Precision AI',   logo: '/chatgpt-logo.png',    gradient: 'from-sky-400 to-blue-500',       letter: 'G',  color: '#0ea5e9' },
];

const WELCOME_GREETINGS: ((name: string) => string)[] = [
  name => `Hey ${name}, what's on your mind today?`,
  name => `Good to see you, ${name}! Ready to explore?`,
  name => `Back again, ${name}? Let's make it count.`,
  name => `Hello, ${name}! What are we diving into?`,
  name => `What's up, ${name}? I'm all ears.`,
  name => `${name}! Let's build something amazing.`,
  name => `Hey ${name}, let's get started!`,
  name => `Great to see you, ${name}! What's the plan?`,
  name => `${name}, the sky's the limit today!`,
  name => `Nice to have you back, ${name}.`,
];

function pickGreetingIndex(seed: string | null): number {
  if (!seed) return Math.floor(Math.random() * WELCOME_GREETINGS.length);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % WELCOME_GREETINGS.length;
  return hash;
}

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { usage: planUsage } = useUsage();

  // Default ultimate users to Fius Pro, not Lite
  useEffect(() => {
    if (planUsage?.plan === 'ultimate') {
      const saved = localStorage.getItem('selectedModel');
      if (!saved || saved === 'fius-lite') {
        setSelectedModel('fius-prime' as AvailableModel);
        localStorage.setItem('selectedModel', 'fius-prime');
      }
    } else if (planUsage?.plan === 'free') {
      // Free plan is locked to Fius Lite only — force it regardless of what was saved.
      setSelectedModel('fius-lite' as AvailableModel);
      localStorage.setItem('selectedModel', 'fius-lite');
    }
  }, [planUsage?.plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const isFreePlan = !planUsage || planUsage.plan === "free";
  // Free plan's 5 messages are used up — the whole app locks down except the
  // sidebar (to open Settings/upgrade) and logging out.
  const isFreePlanExhausted = isFreePlan && typeof planUsage?.messagesRemaining === 'number' && planUsage.messagesRemaining <= 0;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const showUpgradeLockToast = useCallback(() => {
    setIsUpgradeModalOpen(true);
  }, []);
  const freeNomadModels = planUsage?.freeNomadModels ?? ["fius-ai"];
  const isNomadModelLocked = useCallback((modelId: string) => isFreePlan && !freeNomadModels.includes(modelId), [isFreePlan, freeNomadModels]);
  // Free plan: only Fius Lite is usable anywhere outside Nomad. Everything else needs Ultimate.
  const isChatModelLocked = useCallback((modelId: string) => isFreePlan && modelId !== 'fius-lite', [isFreePlan]);
  const openVoiceMode = useCallback(() => {
    if (isFreePlanExhausted) { showUpgradeLockToast(); return; }
    if (isFreePlan) {
      toast({ title: "Locked on Free plan", description: "Voice Mode requires Fius Ultimate.", variant: "destructive" });
      return;
    }
    setIsVoiceModeModalOpen(true);
  }, [isFreePlan, isFreePlanExhausted]); // eslint-disable-line react-hooks/exhaustive-deps
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Responses are complete API results, so keep the response surface stable
  // while the surrounding chat state updates. Do not run a second client-side
  // typing animation here.
  const isAnimatingResponse = false;
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const welcomeGreeting = useMemo(() => pickGreetingIndex(currentProjectId), [currentProjectId]);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>(() => {
    return (localStorage.getItem('selectedModel') as AvailableModel) || "fius-lite";
  });
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [ownMode, setOwnMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask' | 'nomad' | 'philosopher' | 'fius-games' | 'imagine' | 'fius-labs'>('ask');
  // UI Accent Color — re-derived whenever the uiAccentChanged event fires
  const [uiAccentColor, setUiAccentColor] = useState<string | null>(() => {
    applyUiAccent();
    return getActiveUiAccent();
  });
  const navContainerRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, ready: false });
  const pillAnimateRef = useRef(false); // only true after user manually switches tabs — prevents auto-fire on launch
  const measurePill = () => {
    const TAB_ORDER = ['ask', 'nomad', 'imagine', 'philosopher', 'fius-games', 'fius-labs'];
    const idx = TAB_ORDER.indexOf(activeTab);
    const btn = tabButtonRefs.current[idx];
    const container = navContainerRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    if (btn.offsetWidth > 0) {
      setPillStyle({ left, width: btn.offsetWidth, ready: true });
    }
  };
  // Re-expose measurePill as ref so ResizeObserver can call the latest version
  const measurePillRef = useRef(measurePill);
  useEffect(() => { measurePillRef.current = measurePill; });

  useEffect(() => {
    // Measure immediately, after paint, and again 200 ms later (fonts / mobile UI settle)
    measurePillRef.current();
    const id1 = requestAnimationFrame(() => measurePillRef.current());
    const id2 = window.setTimeout(() => measurePillRef.current(), 200);

    // Re-measure whenever the nav bar resizes (address-bar collapse, orientation change, etc.)
    const container = navContainerRef.current;
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measurePillRef.current());
      ro.observe(container);
    }

    return () => {
      cancelAnimationFrame(id1);
      clearTimeout(id2);
      ro?.disconnect();
    };
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  const [chatBg, setChatBg] = useState<string>(() => localStorage.getItem('chatBg') || 'plain');
  useEffect(() => {
    const handler = () => setChatBg(localStorage.getItem('chatBg') || 'plain');
    window.addEventListener('chatBgChanged', handler);
    return () => window.removeEventListener('chatBgChanged', handler);
  }, []);
  const [glowAccentColor, setGlowAccentColor] = useState<string>(() => getStoredGlowAccent());
  useEffect(() => {
    const handler = () => setGlowAccentColor(getStoredGlowAccent());
    window.addEventListener('glowAccentColorChanged', handler);
    return () => window.removeEventListener('glowAccentColorChanged', handler);
  }, []);
  // App font — apply on mount and on change
  useEffect(() => {
    applyAppFont();
    const handler = () => applyAppFont();
    window.addEventListener('appFontChanged', handler);
    return () => window.removeEventListener('appFontChanged', handler);
  }, []);
  // UI Accent Color — listen for changes from settings
  useEffect(() => {
    const handler = () => { applyUiAccent(); setUiAccentColor(getActiveUiAccent()); };
    window.addEventListener('uiAccentChanged', handler);
    return () => window.removeEventListener('uiAccentChanged', handler);
  }, []);

  const starterHeadings = [
    "Try asking me something like:",
    "Here are some things you can explore:",
    "Jump right in with one of these:",
    "Not sure where to start? Try one of these:",
    "Pick a topic or type anything:",
    "Here's what I can help you with:",
    "Some ideas to get you started:",
    "What's on your mind?",
    "Got something in mind? Try one of these:",
    "Where would you like to begin?",
    "Let's dive in — pick a starter:",
    "Curious about something? Start here:",
  ];
  const [starterHeading] = useState(() => starterHeadings[Math.floor(Math.random() * starterHeadings.length)]);

  // Typewriter placeholder for Ask tab message bar
  const [typingPlaceholder, setTypingPlaceholder] = useState('');
  useEffect(() => {
    let promptIdx = 0;
    let charIdx = 0;
    let phase: 'typing' | 'pausing' | 'erasing' = 'typing';
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = ROTATING_PLACEHOLDERS[promptIdx];
      if (phase === 'typing') {
        charIdx++;
        setTypingPlaceholder(current.slice(0, charIdx));
        if (charIdx >= current.length) { phase = 'pausing'; timer = setTimeout(tick, 3000); }
        else { timer = setTimeout(tick, 16); }
      } else if (phase === 'pausing') {
        phase = 'erasing'; tick();
      } else {
        charIdx--;
        setTypingPlaceholder(current.slice(0, charIdx));
        if (charIdx <= 0) { promptIdx = (promptIdx + 1) % ROTATING_PLACEHOLDERS.length; phase = 'typing'; timer = setTimeout(tick, 300); }
        else { timer = setTimeout(tick, 12); }
      }
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, []);
  const changeTab = (tab: 'ask' | 'nomad' | 'philosopher' | 'fius-games' | 'imagine' | 'fius-labs') => {
    if (isFreePlanExhausted && tab !== activeTab) {
      showUpgradeLockToast();
      return;
    }
    if (isFreePlan && (tab === 'nomad' || tab === 'imagine' || tab === 'philosopher' || tab === 'fius-games' || tab === 'fius-labs')) {
      const lockedLabel = tab === 'nomad' ? "Nomad (multi-AI compare)"
        : tab === 'imagine' ? "Imagine Studio"
        : tab === 'philosopher' ? "Fius Minds"
        : tab === 'fius-labs' ? "Fius Labs"
        : "Fius Games";
      toast({
        title: "Locked on Free plan",
        description: `${lockedLabel} requires Fius Ultimate.`,
        variant: "destructive",
      });
      return;
    }
    // Save current model for the tab we're leaving (not imagine — that always resets)
    if (activeTab !== 'imagine') {
      localStorage.setItem(`tabModel_${activeTab}`, selectedModel);
    }
    pillAnimateRef.current = true;
    playTabClick();
    setActiveTab(tab);
    if (tab === 'imagine') {
      setSelectedModel('fius-imagine-fast' as AvailableModel);
      setImagineShuffleKey(k => k + 1);
    } else {
      // Restore the last model used in this specific tab
      const savedForTab = localStorage.getItem(`tabModel_${tab}`);
      if (savedForTab) {
        setSelectedModel(savedForTab as AvailableModel);
      } else if (activeTab === 'imagine') {
        // Coming back from imagine — restore the saved main model
        const fallback = localStorage.getItem('selectedModel');
        if (fallback) setSelectedModel(fallback as AvailableModel);
      }
    }
  };
  const [functionBarStyle, setFunctionBarStyle] = useState<string>(
    () => localStorage.getItem('functionBarStyle') || 'pill'
  );
  const [messageBarStyle, setMessageBarStyle] = useState<string>(
    () => localStorage.getItem('messageBarStyle') || 'compact'
  );

  useEffect(() => {
    const handler = () => setFunctionBarStyle(localStorage.getItem('functionBarStyle') || 'pill');
    window.addEventListener('functionBarStyleChanged', handler);
    return () => window.removeEventListener('functionBarStyleChanged', handler);
  }, []);

  useEffect(() => {
    const handler = () => setMessageBarStyle(localStorage.getItem('messageBarStyle') || 'compact');
    window.addEventListener('messageBarStyleChanged', handler);
    return () => window.removeEventListener('messageBarStyleChanged', handler);
  }, []);

  // Warm the Philosophers avatar cache and the Fius Games leaderboard/logo
  // data as soon as the chat interface mounts — not when the user opens
  // those tabs — so both render instantly with no visible pop-in/blank state.
  useEffect(() => {
    preloadWikiImages(HISTORICAL_PERSONALITIES.map(p => p.wikiTitle || p.name), 3);
    preloadGamesData();
  }, []);

  const [philosopherMessages, setPhilosopherMessages] = useState<Array<{id: string; role: 'user' | 'assistant'; content: string}>>([]);
  const [philosopherInput, setPhilosopherInput] = useState('');
  const [philosopherIsTyping, setPhilosopherIsTyping] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<HistoricalPersonality | null>(null);
  const [personalitySearch, setPersonalitySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [personalityCategory, setPersonalityCategory] = useState('All');
  const catNavRef = useRef<HTMLDivElement>(null);
  const catBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [catPillStyle, setCatPillStyle] = useState({ left: 0, width: 0, ready: false });
  const catPillAnimateRef = useRef(false);

  const measureCatPill = useCallback(() => {
    const idx = PERSONALITY_CATEGORIES.indexOf(personalityCategory);
    const btn = catBtnRefs.current[idx];
    const container = catNavRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    if (btn.offsetWidth > 0) setCatPillStyle({ left, width: btn.offsetWidth, ready: true });
  }, [personalityCategory]);

  useEffect(() => {
    measureCatPill();
    const id1 = requestAnimationFrame(measureCatPill);
    const id2 = window.setTimeout(measureCatPill, 150);
    return () => { cancelAnimationFrame(id1); clearTimeout(id2); };
  }, [personalityCategory, measureCatPill]);

  // Re-measure when philosopher tab is first opened (DOM wasn't mounted before)
  useEffect(() => {
    if (activeTab === 'philosopher') {
      catPillAnimateRef.current = false;
      const id1 = requestAnimationFrame(measureCatPill);
      const id2 = window.setTimeout(measureCatPill, 100);
      return () => { cancelAnimationFrame(id1); clearTimeout(id2); };
    }
  }, [activeTab, measureCatPill]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(personalitySearch), 250);
    return () => clearTimeout(timer);
  }, [personalitySearch]);

  const filteredPersonalities = useMemo(() => {
    return HISTORICAL_PERSONALITIES
      .filter(p => personalityCategory === 'All' || p.category === personalityCategory)
      .filter(p => debouncedSearch === '' || p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.role.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [debouncedSearch, personalityCategory]);
  const [gamesState, setGamesState] = useState<{activeGame: string | null; gameMessages: Array<{id: string; role: 'user' | 'assistant'; content: string}>; gameInput: string; isTyping: boolean}>({ activeGame: null, gameMessages: [], gameInput: '', isTyping: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarOpenMode, setSidebarOpenMode] = useState<'mini' | 'full'>('mini');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{id: string; title: string; createdAt: Date; hasNomad?: boolean}>>([]);
  const [user, setUser] = useState<{email: string; username: string; displayName?: string | null} | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>(() => localStorage.getItem('profilePicture') || '');
  const [input, setInput] = useState("");
  const [fiusIntegrationMode, setFiusIntegrationMode] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set());
  const [stoppedMessageIds, setStoppedMessageIds] = useState<Set<string>>(new Set());
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsgId, setFeedbackMsgId] = useState('');
  const [feedbackType, setFeedbackType] = useState<'like' | 'dislike'>('like');
  const [feedbackSelected, setFeedbackSelected] = useState<Set<string>>(new Set());
  const [feedbackText, setFeedbackText] = useState('');
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [educationMode, setEducationMode] = useState<"examination" | "self-listen" | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState("Examination");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [attachedImages, setAttachedImages] = useState<Array<{file: File, preview: string}>>([]);
  const [attachedFiles, setAttachedFiles] = useState<Array<{file: File, name: string, size: string, type: string}>>([]);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const [exportingMsgId, setExportingMsgId] = useState<string | null>(null);
  const [docPdfExportingId, setDocPdfExportingId] = useState<string | null>(null);
  const [documentMode, setDocumentMode] = useState(false);
  const [promptFullscreen, setPromptFullscreen] = useState(false);
  const [longPromptMode, setLongPromptMode] = useState(false);
  const attachTrayRef = React.useRef<HTMLDivElement>(null);
  // Multi-AI states for Nomad tab
  const [nomadMessages, setNomadMessages] = useState<{[model: string]: ChatMessage[]}>({});
  const [activeAIModels, setActiveAIModels] = useState<Set<string>>(new Set(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'perplexity', 'grok-4', 'deepseek-r1', 'doubao', 'kimi', 'qwen', 'llama-4', 'mistral', 'copilot', 'fius-ai']));
  const [nomadIsTyping, setNomadIsTyping] = useState<{[model: string]: boolean}>({});
  const [nomadMode, setNomadMode] = useState<'multi' | 'auto'>('multi');
  // Auto Mode state — full chat conversation tab
  const [nomadAutoMessages, setNomadAutoMessages] = useState<{id: string, role: 'user' | 'assistant', content: string, pickedModel?: {model: string, modelName: string, logo: string, color: string}}[]>([]);
  const [nomadAutoLoading, setNomadAutoLoading] = useState(false);
  const [ultimatumCards, setUltimatumCards] = useState(() => shuffleUltimatum(ULTIMATUM_CARD_POOL).slice(0, 2));
  const nomadAutoScrollContainerRef = useRef<HTMLDivElement>(null);
  const nomadAutoEndRef = useRef<HTMLDivElement>(null);
  const nomadScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const nomadColsRef = useRef<HTMLDivElement>(null);
  const nomadThumbRef = useRef<HTMLDivElement>(null);
  const updateNomadThumb = React.useCallback(() => {
    const el = nomadColsRef.current;
    const thumb = nomadThumbRef.current;
    if (!el || !thumb) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const ratio = clientWidth / scrollWidth;
    const thumbW = Math.max(ratio * 100, 8);
    const thumbL = scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbW) : 0;
    thumb.style.left = `${thumbL}%`;
    thumb.style.width = `${thumbW}%`;
  }, []);
  useEffect(() => {
    const el = nomadColsRef.current;
    if (!el) return;
    updateNomadThumb();
    const ro = new ResizeObserver(updateNomadThumb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nomadMode, updateNomadThumb]);
  const [nomadSummaryOpen, setNomadSummaryOpen] = useState(false);
  const [nomadSummary, setNomadSummary] = useState('');
  const [nomadSummarizing, setNomadSummarizing] = useState(false);
  type NomadHistSession = { id: string; ts: number; mode: 'multi' | 'auto'; preview: string; autoMsgs: typeof nomadAutoMessages; multiMsgs: {[model: string]: ChatMessage[]}; };
  // Per-conversation nomad persistence via backend (Supabase)
  const saveNomadForConv = (convId: string, autoMsgs: typeof nomadAutoMessages, multiMsgs: typeof nomadMessages, mode: 'multi' | 'auto') => {
    authFetch(`/api/conversations/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomadData: { autoMsgs, multiMsgs, mode } }),
    }).catch(() => {});
  };
  const loadNomadForConv = async (convId: string): Promise<{ autoMsgs: typeof nomadAutoMessages; multiMsgs: typeof nomadMessages; mode: 'multi' | 'auto' } | null> => {
    try {
      const res = await authFetch(`/api/conversations/${convId}/nomad`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };
  const [expandedMsgIds, setExpandedMsgIds] = useState<Set<string>>(new Set());
  const [showNomadNotification, setShowNomadNotification] = useState(true);
  const nomadNotifTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const nomadNotifEnabledRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [nomadSoloModel, setNomadSoloModel] = useState<string | null>(null);
  const [isVoiceModeModalOpen, setIsVoiceModeModalOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isImagineOpen, setIsImagineOpen] = useState(false);
  const [imagineStyle, setImagineStyle] = useState("Photorealistic");
  const [imagineMessages, setImagineMessages] = useState<{id: string, role: 'user' | 'ai', content: string, modelId?: string, imageUrl?: string, fallbackUrls?: string[], imageError?: string, isGenerating?: boolean, studioPrompt?: string, editHistory?: string[]}[]>([]);
  const imagineMessagesEndRef = useRef<HTMLDivElement>(null);
  const imagineScrollRef = useRef<HTMLDivElement>(null);
  const [imagineRefImage, setImagineRefImage] = useState<{preview: string; base64: string} | null>(null);
  const imagineUploadRef = useRef<HTMLInputElement>(null);
  const [imagineShuffleKey, setImagineShuffleKey] = useState(() => Math.floor(Math.random() * 99999));
  const [imagineGallery, setImagineGallery] = useState<{url: string; label: string; prompt: string}[]>([]);
  const [imagineGalleryLoading, setImagineGalleryLoading] = useState(false);
  const shuffledImaginePrompts = React.useMemo(() => {
    const base = IMAGINE_PROMPTS_BY_STYLE[imagineStyle] || IMAGINE_PROMPTS_BY_STYLE["Photorealistic"];
    const arr = [...base];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagineShuffleKey, imagineStyle]);

  React.useEffect(() => {
    if (activeTab !== 'imagine') return;

    const localCurated = (IMAGINE_PROMPTS_BY_STYLE[imagineStyle] || IMAGINE_PROMPTS_BY_STYLE['Photorealistic'])
      .map((i: any) => ({ url: i.img, label: i.label, prompt: i.prompt }));

    // These styles use curated local images — always show them in fixed order
    if (imagineStyle === 'Anime' || imagineStyle === '3D Render' || imagineStyle === 'Pixel Art' || imagineStyle === 'Cinematic') {
      setImagineGallery(localCurated);
      setImagineGalleryLoading(false);
      return;
    }

    // All other styles: fetch varied images from the gallery API, fall back to curated
    setImagineGalleryLoading(true);
    authFetch(`/api/imagine/gallery?style=${encodeURIComponent(imagineStyle)}&seed=${imagineShuffleKey}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: any) => {
        if (data.success && data.images?.length >= 3) {
          setImagineGallery(data.images);
        } else {
          setImagineGallery(localCurated);
        }
      })
      .catch(() => setImagineGallery(localCurated))
      .finally(() => setImagineGalleryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, imagineStyle, imagineShuffleKey]);

  // Imagine Studio state
  const [imagineEditTarget, setImagineEditTarget] = useState<{id: string; url: string; prompt: string} | null>(null);
  const [imagineEditStyle, setImagineEditStyle] = useState('');
  const [imagineEditRes, setImagineEditRes] = useState('1:1');
  const [imagineEditAcc, setImagineEditAcc] = useState<string[]>([]);
  const [imagineEditHist, setImagineEditHist] = useState<string[]>([]);
  const [imagineEditLoading, setImagineEditLoading] = useState(false);
  const [imagineLikes, setImagineLikes] = useState<Set<string>>(new Set());
  const [imagineSelectedModels, setImagineSelectedModels] = useState<Set<string>>(new Set(['fius-imagine-super', 'seedream-4.5', 'nano-banana-pro', 'gpt-5.5-pro']));
  const [imagineGalleryOpen, setImagineGalleryOpen] = useState(false);
  const [imagineMyPhotos, setImagineMyPhotos] = useState<{url: string; prompt?: string; ts?: number}[]>([]);
  const loadImagineMyPhotos = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('fius_my_images') || '[]');
      setImagineMyPhotos(Array.isArray(saved) ? saved : []);
    } catch { setImagineMyPhotos([]); }
  };
  // Auto-save completed Imagine Studio images to fius_my_images
  React.useEffect(() => {
    const completed = imagineMessages.filter(m => m.role === 'ai' && m.imageUrl && !m.isGenerating);
    if (completed.length === 0) return;
    try {
      const existing: {url: string; prompt?: string; ts?: number}[] = JSON.parse(localStorage.getItem('fius_my_images') || '[]');
      const existingUrls = new Set(existing.map(e => e.url));
      const newEntries = completed
        .filter(m => m.imageUrl && !existingUrls.has(m.imageUrl!))
        .map(m => ({ url: m.imageUrl!, prompt: m.studioPrompt || m.content || '', ts: Date.now() }));
      if (newEntries.length > 0) {
        const merged = [...newEntries, ...existing].slice(0, 120);
        localStorage.setItem('fius_my_images', JSON.stringify(merged));
      }
    } catch {}
  }, [imagineMessages]);
  const [imagineOrientation, setImagineOrientation] = useState<'none' | 'square' | 'portrait' | 'wide'>('none');
  const [imagineTemplateCategory, setImagineTemplateCategory] = useState<string>('All');
  const [imagineTemplateModal, setImagineTemplateModal] = useState<typeof IMAGINE_EDIT_TEMPLATES[0] | null>(null);
  const [templateUploadPhoto, setTemplateUploadPhoto] = useState<{preview: string; base64: string} | null>(null);
  const templatePhotoInputRef = useRef<HTMLInputElement>(null);
  const [recentUploads, setRecentUploads] = useState<{preview: string; base64: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('fius_recent_template_uploads') || '[]'); } catch { return []; }
  });
  const toggleImagineModel = (id: string) =>
    setImagineSelectedModels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Template filter pill (Browse All Templates modal) — must be after imagineTemplateCategory + showAllTemplates
  const tplNavRef = useRef<HTMLDivElement>(null);
  const tplBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tplPillStyle, setTplPillStyle] = useState({ left: 0, width: 0, ready: false });
  const tplPillAnimateRef = useRef(false);
  const TPL_FILTER_CATS = ['All', 'Spaces', 'Nature', 'Portraits', 'Fantasy', 'Fashion', 'Traditional', 'Travel', 'Products'];

  const measureTplPill = useCallback(() => {
    const idx = TPL_FILTER_CATS.indexOf(imagineTemplateCategory);
    const btn = tplBtnRefs.current[idx];
    const container = tplNavRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    if (btn.offsetWidth > 0) setTplPillStyle({ left, width: btn.offsetWidth, ready: true });
  }, [imagineTemplateCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    measureTplPill();
    const id1 = requestAnimationFrame(measureTplPill);
    const id2 = window.setTimeout(measureTplPill, 150);
    return () => { cancelAnimationFrame(id1); clearTimeout(id2); };
  }, [imagineTemplateCategory, measureTplPill]);

  useEffect(() => {
    if (showAllTemplates) {
      tplPillAnimateRef.current = false;
      const id1 = requestAnimationFrame(measureTplPill);
      const id2 = window.setTimeout(measureTplPill, 100);
      return () => { cancelAnimationFrame(id1); clearTimeout(id2); };
    }
  }, [showAllTemplates, measureTplPill]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [webSearchEnabled] = useState(true);
  const [thinkingType, setThinkingType] = useState<'thinking' | 'analyzing' | 'generating'>('thinking');

  // Settings state
  const defaultSettingsToggles = {
    wrapLines: true,
    showPreviews: true,
    starryBg: true,
    autoScroll: true,
    sidebarEditor: true,
    notifyThinking: false,
    cmdEnter: false,
    richText: true,
    improveModel: true,
    personalize: true,
    linkSharing: true,
    sidebarCloseTop: true,
    nomadGrid: true,
    mindsGrid: true,
    nomadNotification: true,
    philosopherNotification: true,
    fiusGamesNotification: true,
    showFiusLogo: true,
    hideFiusLogo: false,
    hideFlyWithUs: false,
    showUserMsgActions: true,
    glossyOutline: true,
    topbarTabIcons: true,
    tabsInSidebar: false,
  };
  const [settingsToggles, setSettingsToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('settingsToggles');
      if (saved) return { ...defaultSettingsToggles, ...JSON.parse(saved) };
    } catch {}
    return defaultSettingsToggles;
  });
  // Keep ref in sync so timers can check the latest toggle value without stale closures
  React.useEffect(() => {
    nomadNotifEnabledRef.current = settingsToggles.nomadNotification ?? true;
  }, [settingsToggles.nomadNotification]);

  const scheduleNomadNotif = React.useCallback(() => {
    if (nomadNotifTimerRef.current) clearTimeout(nomadNotifTimerRef.current);
    const delay = (Math.random() * 2 + 3) * 60 * 1000; // 3–5 min random
    nomadNotifTimerRef.current = setTimeout(() => {
      if (nomadNotifEnabledRef.current) setShowNomadNotification(true);
    }, delay);
  }, []);

  const handleNomadNotifClose = React.useCallback(() => {
    setShowNomadNotification(false);
    scheduleNomadNotif();
  }, [scheduleNomadNotif]);

  const [aiOrder, setAiOrder] = useState(['fius-ai', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'perplexity', 'grok-4', 'deepseek-r1', 'doubao', 'kimi', 'qwen', 'llama-4', 'mistral', 'copilot']);
  // Per-model selected sub-model (persisted in localStorage)
  const [nomadSelectedSubModels, setNomadSelectedSubModels] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('fius-nomad-sub-models') || '{}'); } catch { return {}; }
  });
  // Which model's dropdown is currently open
  const [openNomadModelDropdown, setOpenNomadModelDropdown] = useState<string | null>(null);
  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    if (!openNomadModelDropdown) return;
    const close = () => setOpenNomadModelDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openNomadModelDropdown]);
  const [nomadModels, setNomadModels] = useState<{name: string, provider: string, id: string}[]>([]);
  const [nomadDisabledNotif, setNomadDisabledNotif] = useState<{ label: string; color: string } | null>(null);
  const nomadNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sync nomadModels with aiOrder
    const modelMap: {[key: string]: {name: string, provider: string, id: string}} = {
      'gpt-4o': { name: nomadSelectedSubModels['gpt-4o'] || 'GPT-5 mini', provider: 'openai', id: 'gpt-4o' },
      'claude-3.5-sonnet': { name: nomadSelectedSubModels['claude-3.5-sonnet'] || 'Claude Haiku 4.5', provider: 'anthropic', id: 'claude-3.5-sonnet' },
      'gemini-pro': { name: nomadSelectedSubModels['gemini-pro'] || 'Gemini 3.5 Flash-Lite', provider: 'google', id: 'gemini-pro' },
      'perplexity': { name: nomadSelectedSubModels['perplexity'] || 'Perplexity Sonar', provider: 'perplexity', id: 'perplexity' },
      'grok-4': { name: nomadSelectedSubModels['grok-4'] || 'Grok Build 0.1', provider: 'x-ai', id: 'grok-4' },
      'deepseek-r1': { name: nomadSelectedSubModels['deepseek-r1'] || 'DeepSeek V4 Flash', provider: 'deepseek', id: 'deepseek-r1' },
      'doubao': { name: nomadSelectedSubModels['doubao'] || 'Doubao Seed 2.0 Mini', provider: 'bytedance', id: 'doubao' },
      'kimi': { name: nomadSelectedSubModels['kimi'] || 'Kimi K2.6', provider: 'moonshot', id: 'kimi' },
      'qwen': { name: nomadSelectedSubModels['qwen'] || 'Qwen Flash', provider: 'alibaba', id: 'qwen' },
      'llama-4': { name: nomadSelectedSubModels['llama-4'] || 'Llama 4 Scout', provider: 'meta', id: 'llama-4' },
      'mistral': { name: nomadSelectedSubModels['mistral'] || 'Ministral 3', provider: 'mistral', id: 'mistral' },
      'copilot': { name: nomadSelectedSubModels['copilot'] || 'GPT-5 mini', provider: 'microsoft', id: 'copilot' },
      'fius-ai': { name: nomadSelectedSubModels['fius-ai'] || 'Fius Lite', provider: 'fius', id: 'fius-ai' }
    };

    const newNomadModels = aiOrder
      .map(id => modelMap[id])
      .filter(Boolean);
    
    setNomadModels(newNomadModels);
  }, [aiOrder, nomadSelectedSubModels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on search input when Alt+T is pressed
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        console.log('Search shortcut triggered (Alt+T)');
        e.preventDefault();
        e.stopPropagation();
        
        // Open sidebar if closed
        if (!isSidebarOpen) {
          setIsSidebarOpen(true);
        }

        // Wait for sidebar to open then focus
        setTimeout(() => {
          const searchInput = document.querySelector('input[data-testid="sidebar-search-input"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isSidebarOpen]);

  // Conversation starters
  const allConversationStarters = [
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: "Explain complex topics",
      description: "Break down difficult concepts",
      prompt: "Explain quantum computing in simple terms"
    },
    {
      icon: <Code className="w-6 h-6 text-green-500" />,
      title: "Code assistance",
      description: "Help with programming",
      prompt: "Help me write a Python function to sort a list"
    },
    {
      icon: <PenTool className="w-6 h-6 text-blue-500" />,
      title: "Creative writing",
      description: "Stories and content",
      prompt: "Write a short story about time travel"
    },
    {
      icon: <Search className="w-6 h-6 text-orange-500" />,
      title: "Research & analysis",
      description: "Deep dive into topics",
      prompt: "Analyze the benefits of renewable energy"
    },
    {
      icon: <Target className="w-6 h-6 text-red-500" />,
      title: "Problem solving",
      description: "Work through challenges",
      prompt: "Help me plan a productive daily routine"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
      title: "Learning & education",
      description: "Expand knowledge",
      prompt: "Teach me about machine learning basics"
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      title: "Brainstorm ideas",
      description: "Generate fresh concepts",
      prompt: "Give me 10 creative business ideas for 2025"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: "Career advice",
      description: "Grow professionally",
      prompt: "How do I transition into a software engineering career?"
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />,
      title: "Fun facts",
      description: "Discover interesting things",
      prompt: "Tell me 5 surprising facts about the universe"
    },
    {
      icon: <FileText className="w-6 h-6 text-cyan-500" />,
      title: "Summarize anything",
      description: "Get the key points fast",
      prompt: "Summarize the key ideas behind stoicism"
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-pink-500" />,
      title: "Study help",
      description: "Ace your exams",
      prompt: "Quiz me on the causes of World War 1"
    },
    {
      icon: <Edit className="w-6 h-6 text-violet-500" />,
      title: "Improve my writing",
      description: "Polish any text",
      prompt: "Make this email sound more professional: 'Hey, can we meet?'"
    },
    {
      icon: <Mic className="w-6 h-6 text-rose-500" />,
      title: "Speech or debate",
      description: "Argue any side",
      prompt: "Give me arguments for and against social media"
    },
    {
      icon: <Image className="w-6 h-6 text-amber-500" />,
      title: "Describe a scene",
      description: "Paint with words",
      prompt: "Describe a futuristic city in vivid detail"
    },
    {
      icon: <Camera className="w-6 h-6 text-teal-500" />,
      title: "Travel planning",
      description: "Plan your next trip",
      prompt: "Plan a 5-day trip to Japan on a budget"
    },
  ];

  const [conversationStarters] = useState(() => {
    const shuffled = [...allConversationStarters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  const handleStarterClick = (prompt: string) => {
    setInputValue(prompt);
    // Auto-focus the input field
    setTimeout(() => {
      const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Load user data and conversations - optimized for faster loading
  useEffect(() => {
    const loadUserAndConversations = async () => {
      try {
        const userResponse = await authFetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Load user-specific settings from localStorage
          try {
            const userSettingsKey = `settingsToggles_${userData.email}`;
            const saved = localStorage.getItem(userSettingsKey);
            if (saved) {
              setSettingsToggles(prev => ({ ...prev, ...JSON.parse(saved) }));
            }
          } catch {}
          
          // Load projects in background without blocking UI
          setTimeout(async () => {
            try {
              await loadProjects();
              
              // Restore last project if any exist
              const savedProjectId = localStorage.getItem('currentProjectId');
              if (savedProjectId) {
                setCurrentProjectId(savedProjectId);
                await loadProjectMessages(savedProjectId);
                // Restore nomad state for the last open conversation
                const saved = await loadNomadForConv(savedProjectId);
                if (saved) {
                  setNomadAutoMessages(saved.autoMsgs || []);
                  setNomadMessages(saved.multiMsgs || {});
                  if (saved.mode) setNomadMode(saved.mode);
                }
              }
            } catch (error) {
              console.warn('Failed to load projects:', error);
            }
          }, 200);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUserAndConversations();
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHistoryLoad = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // WebSocket connection - lazy load to improve initial performance
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: (message: WebSocketMessage) => handleWebSocketMessage(message),
    onConnect: () => {
      // Join conversation if we have one
      if (currentProjectId && user) {
        sendWsMessage({
          type: 'join_conversation',
          conversationId: currentProjectId,
          userId: user.email,
        });
      }
    },
    onDisconnect: () => {},
  });

  // Speech recognition - simplified for better performance
  const { isListening, toggleListening, isSupported: speechSupported } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev + transcript + ' ');
    },
    onError: () => {},
  });

  // Text-to-speech — Edge neural voices (Guy/Asad) via /api/tts, matching mobile
  const { speak: browserSpeak, stop: stopBrowserSpeaking } = useSpeechSynthesis();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const speakAudioSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const speakRequestIdRef = useRef(0);

  // Module-scoped caches (defined outside component) survive component remounts.
  // Refs here just expose them with a stable identity for in-component reads.
  const globalCompletedTexts = useRef<Map<string, string>>(globalCompletedTextsModule);
  const globalProgressTexts = useRef<Map<string, string>>(globalProgressTextsModule);

  // Typing animation hook - survives remounts by resuming from last known progress
  const useTypingAnimation = (text: string, messageId: string) => {
    const cacheKey = messageId;
    // Time-based reveal at ~80 words/sec — smooth and mid-speed on any display.
    const WORDS_PER_SEC = 80;

    const [displayedText, setDisplayedText] = useState(() => {
      if (globalCompletedTexts.current.has(cacheKey)) return text;
      return globalProgressTexts.current.get(cacheKey) ?? '';
    });
    const [isTypingComplete, setIsTypingComplete] = useState(() =>
      globalCompletedTexts.current.has(cacheKey)
    );
    const hasInitialized = useRef(false);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      if (globalCompletedTexts.current.has(cacheKey)) {
        setDisplayedText(text);
        setIsTypingComplete(true);
        return;
      }
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      if (!text) { setIsTypingComplete(true); return; }

      setIsTypingComplete(false);

      const words = text.split(' ').filter(w => w.trim());
      const existingProgress = globalProgressTexts.current.get(cacheKey) ?? '';
      const existingWordCount = existingProgress ? existingProgress.split(' ').filter(w => w.trim()).length : 0;
      let currentIndex = existingWordCount;
      let carry = 0;
      let lastTs: number | null = null;

      const step = (now: number) => {
        if (lastTs === null) lastTs = now;
        const dt = now - lastTs;
        lastTs = now;
        carry += (dt / 1000) * WORDS_PER_SEC;
        const advance = Math.floor(carry);
        if (advance > 0) {
          carry -= advance;
          currentIndex = Math.min(currentIndex + advance, words.length);
        }
        if (currentIndex < words.length) {
          const next = words.slice(0, currentIndex).join(' ');
          setDisplayedText(next);
          globalProgressTexts.current.set(cacheKey, next);
          rafRef.current = requestAnimationFrame(step);
        } else {
          setIsTypingComplete(true);
          globalCompletedTexts.current.set(cacheKey, text);
          globalProgressTexts.current.delete(cacheKey);
        }
      };

      rafRef.current = requestAnimationFrame(step);

      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { displayedText, isTypingComplete };
  };

  // ── Chart block renderer ─────────────────────────────────────────────────
  // Parses [CHART:type]\nLabel: value\n[/CHART] blocks from AI text
  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  function parseChartBlocks(text: string): Array<{type: 'text', content: string} | {type: 'chart', chartType: string, data: {name: string, value: number}[]}> {
    const segments: Array<{type: 'text', content: string} | {type: 'chart', chartType: string, data: {name: string, value: number}[]}> = [];
    const regex = /\[CHART:(bar|line|pie)\]\n([\s\S]*?)\[\/CHART\]/gi;
    let lastIndex = 0; let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      const chartType = match[1].toLowerCase();
      const rawData = match[2].trim().split('\n').map(line => {
        const colonIdx = line.lastIndexOf(':');
        if (colonIdx === -1) return null;
        const name = line.slice(0, colonIdx).trim();
        const val = parseFloat(line.slice(colonIdx + 1).trim().replace(/[^0-9.-]/g, ''));
        return isNaN(val) ? null : { name, value: val };
      }).filter(Boolean) as {name: string, value: number}[];
      if (rawData.length >= 2) segments.push({ type: 'chart', chartType, data: rawData });
      else segments.push({ type: 'text', content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) segments.push({ type: 'text', content: text.slice(lastIndex) });
    return segments;
  }

  function InlineChart({ chartType, data }: { chartType: string, data: {name: string, value: number}[] }) {
    if (chartType === 'pie') {
      return (
        <div className="my-4 bg-card rounded-xl border border-border p-3">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Legend />
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (chartType === 'line') {
      return (
        <div className="my-4 bg-card rounded-xl border border-border p-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    return (
      <div className="my-4 bg-card rounded-xl border border-border p-3">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ── Auto Mode AI Picker ───────────────────────────────────────────────────
  function pickBestAIForPrompt(prompt: string): {model: string, modelName: string, logo: string, color: string} {
    const p = prompt.toLowerCase();
    if (/code|program|function|debug|bug|script|python|javascript|typescript|react|css|html|algorithm|compile|error|fix.*code|write.*code|class|loop|array|sort|api/.test(p))
      return { model: 'deepseek-r1', modelName: 'DeepSeek-V4-Pro', logo: '/deepseek-logo.png', color: '#3b82f6' };
    if (/search|news|today|latest|current|what.*happening|recent|2024|2025|2026|fact|who.*is|where.*is|when.*was|stock|price|weather/.test(p))
      return { model: 'perplexity', modelName: 'Perplexity Sonar Pro', logo: '/kimi-logo.png', color: '#38bdf8' };
    if (/write|story|essay|poem|creative|novel|blog|article|letter|email|caption|describe|explain.*deeply|paragraph|narrative/.test(p))
      return { model: 'claude-3.5-sonnet', modelName: 'Claude Fable 5', logo: '/claude-logo.png', color: '#f97316' };
    if (/math|calcul|equation|graph|chart|data|statistic|analyz|percent|probability|formula|number|solve|integral|derivative/.test(p))
      return { model: 'gemini-pro', modelName: 'Gemini 3.1 Pro', logo: '/gemini-logo.png', color: '#14b8a6' };
    if (/urdu|hindi|arabic|chinese|translate|pakistan|india|desi|aap|kya|hai|karo|bato/.test(p))
      return { model: 'qwen', modelName: 'Qwen 3.7 Max', logo: '/mistral-logo.png', color: '#6366f1' };
    return { model: 'gpt-4o', modelName: 'GPT-5.5 Pro', logo: '/chatgpt-logo.png', color: '#10a37f' };
  }

  const handleNomadAutoSend = async (content: string) => {
    if (!content.trim() || nomadAutoLoading) return;
    setNomadAutoLoading(true);

    // Ensure a shared backend conversation exists so Ask tab reuses the same chat
    if (!currentProjectId) {
      await createNewProject(false, content, true);
    } else {
      // Mark existing Ask conversation as having Nomad usage (if not already marked)
      const existing = projects.find(p => p.id === currentProjectId);
      if (existing && !existing.hasNomad) {
        authFetch(`/api/conversations/${currentProjectId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasNomad: true }),
        });
        setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, hasNomad: true } : p));
      }
    }

    const picked = pickBestAIForPrompt(content);
    const userMsgId = `auto-u-${Date.now()}`;
    const aiMsgId = `auto-a-${Date.now() + 1}`;
    setNomadAutoMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content },
      { id: aiMsgId, role: 'assistant', content: '', pickedModel: picked },
    ]);
    setTimeout(() => nomadAutoEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    const fiusCtx = ' You are operating within Fius — a multi-AI chat platform built by Muzamil Ali, a 14-year-old Pakistani developer from Sargodha. Fius is NOT AI Fiesta — they are completely separate products. If asked about Fius, describe it as a platform that lets users chat with multiple top AI models in one place and compare responses.';
    const nomadSystemPrompts: {[id: string]: string} = {
      'gpt-4o': 'You are GPT-5.5 Pro by OpenAI — a highly capable AI assistant. Be helpful, accurate, and conversational.' + fiusCtx,
      'claude-3.5-sonnet': 'You are Claude Fable 5 by Anthropic — thoughtful, nuanced, excellent at coding and writing.' + fiusCtx,
      'gemini-pro': 'You are Gemini 3.1 Pro by Google — a powerful AI with deep reasoning across all domains.' + fiusCtx,
      'perplexity': 'You are Perplexity Sonar Pro — an AI focused on real-time web search and cited answers.' + fiusCtx,
      'deepseek-r1': 'You are DeepSeek-V4-Pro — a powerful reasoning model. Excel at step-by-step logic, coding, and math.' + fiusCtx,
      'qwen': 'You are Qwen 3.7 Max by Alibaba — a multilingual language expert. Be precise and culturally aware.' + fiusCtx,
    };
    try {
      const res = await authFetch('/api/test-ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: 'nomad-auto-tab', model: picked.model, provider: 'openai', systemPrompt: nomadSystemPrompts[picked.model] || `You are ${picked.modelName}, a helpful AI assistant.` }),
      });
      const responseText = res.ok ? ((await res.json()).response || 'No response received.') : 'Failed to get response. Please try again.';
      setNomadAutoMessages(prev => {
        const updated = prev.map(m => m.id === aiMsgId ? { ...m, content: responseText } : m);
        if (currentProjectId) saveNomadForConv(currentProjectId, updated, {}, 'auto');
        return updated;
      });
    } catch {
      setNomadAutoMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Connection error. Please try again.' } : m));
    }
    setNomadAutoLoading(false);
    setTimeout(() => nomadAutoEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  // Table with CSV download button
  const TableWithDownload = ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const downloadCSV = () => {
      if (!tableRef.current) return;
      const rows = Array.from(tableRef.current.querySelectorAll('tr'));
      const csv = rows.map(row =>
        Array.from(row.querySelectorAll('th, td'))
          .map(cell => `"${(cell.textContent || '').replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-table.csv'; a.click();
    };
    return (
      <div className="relative group my-4">
        <button onClick={downloadCSV}
          className="absolute -top-0.5 right-0 opacity-0 group-hover:opacity-100 transition-all z-10 px-1.5 py-0.5 text-[10px] font-semibold bg-card border border-border rounded shadow-sm flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent">
          <Download className="w-2.5 h-2.5" /> CSV
        </button>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table ref={tableRef} {...props} className="w-full text-sm border-collapse">{children}</table>
        </div>
      </div>
    );
  };

  // Message renderer. Markdown is prepared once for the stable top-level
  // response component; it is only shown after the word reveal completes.
  const renderTypingText = (text: string, messageId: string) => {
    const mdComponents = {
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        if (!inline && match) {
          return (
            <div className="rounded-lg overflow-hidden my-4 border-none shadow-none bg-transparent">
              <div className="bg-transparent px-0 py-1.5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{match[1]}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        showToast('Code copied to clipboard');
                      }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy code</TooltipContent>
                </Tooltip>
              </div>
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, padding: '1rem 0', fontSize: '13px', lineHeight: '1.6', background: 'transparent' }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          );
        }
        if (!inline) {
          const content = String(children).replace(/\n$/, '');
          return (
            <div className="my-3 rounded-xl overflow-hidden border border-border bg-secondary/50">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">text</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { navigator.clipboard.writeText(content); showToast('Copied!'); }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </div>
              <pre className="px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-foreground font-sans">{content}</pre>
            </div>
          );
        }
        return (
          <code className={cn("bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono", className)} {...props}>
            {children}
          </code>
        );
      },
      img: ({src, alt}: any) => {
        if (!src) return null;
        return <GeneratedImageDisplay src={src} alt={alt || "Generated image"} />;
      },
      table: TableWithDownload as any,
      thead: ({ children }: any) => <thead className="bg-muted/60">{children}</thead>,
      th: ({ children }: any) => <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">{children}</th>,
      td: ({ children }: any) => <td className="px-3 py-2 text-sm text-foreground border-b border-border/50">{children}</td>,
    };

    const segments = parseChartBlocks(text);
    const hasCharts = segments.some(s => s.type === 'chart');

    const finalContent = (
      <div className="text-foreground prose prose-sm max-w-none dark:prose-invert relative">
        {hasCharts ? (
          segments.map((seg, i) =>
            seg.type === 'chart' ? (
              <InlineChart key={i} chartType={(seg as any).chartType} data={(seg as any).data} />
            ) : (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={mdComponents as any}>
                {(seg as any).content}
              </ReactMarkdown>
            )
          )
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
            {text}
          </ReactMarkdown>
        )}
      </div>
    );
    return (
      <StableTypingResponse
        text={text}
        messageId={messageId}
        finalContent={finalContent}
        renderTyping={(partialText) => (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
            {partialText}
          </ReactMarkdown>
        )}
      />
    );
  };

  const handleNomadSummarize = async () => {
    const allMsgs = Object.entries(nomadMessages).filter(([, msgs]) => msgs.some(m => m.role === 'assistant'));
    if (allMsgs.length === 0) return;
    setNomadSummarizing(true); setNomadSummaryOpen(true); setNomadSummary('');
    const parts = allMsgs.map(([id, msgs]) => {
      const name = nomadModels.find(m => m.id === id)?.name || id;
      const responses = msgs.filter(m => m.role === 'assistant').map(m => m.content).join('\n');
      return `**${name}:**\n${responses}`;
    });
    const prompt = `Analyze these responses from multiple AI models and produce a structured report:\n\n${parts.join('\n\n---\n\n')}\n\nFormat your response EXACTLY as follows:\n\n## Summary\n[For each AI, write: **[AI Name]:** one-sentence summary of their response]\n\n## Similarities\n[Mention which AIs agreed, using their names. E.g. "GPT-4o and Claude both said..." or "All models agreed that..."]\n\n## Differences\n[Mention specific contrasts using names. E.g. "Grok said X, but Claude argued Y..." Be specific about WHO said WHAT.]\n\n## Conclusion\n[2-3 sentences on the overall takeaway and which response was most insightful and why.]\n\nUse exact AI names from the summary section. Be concise and clear.`;
    try {
      const res = await authFetch('/api/test-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt, conversationId: 'nomad-summary' }) });
      if (res.ok) { const data = await res.json(); setNomadSummary(data.response || 'Could not generate summary.'); }
      else setNomadSummary('Failed to generate summary.');
    } catch { setNomadSummary('Failed to generate summary. Please try again.'); }
    finally { setNomadSummarizing(false); }
  };

  const handleNomadSendMessage = async (content: string) => {
    // Ensure a shared backend conversation exists so Ask tab reuses the same chat
    if (!currentProjectId) {
      await createNewProject(false, content, true);
    } else {
      // Mark existing Ask conversation as having Nomad usage (if not already marked)
      const existing = projects.find(p => p.id === currentProjectId);
      if (existing && !existing.hasNomad) {
        authFetch(`/api/conversations/${currentProjectId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasNomad: true }),
        });
        setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, hasNomad: true } : p));
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: 'nomad',
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setInputValue("");

    // Add user message only to nomadMessages for each active model (NOT to shared messages state)
    // If solo mode is active, only send to that one model
    const modelsToCall = nomadSoloModel
      ? nomadModels.filter(m => m.id === nomadSoloModel)
      : nomadModels.filter(m => activeAIModels.has(m.id));
    setNomadMessages(prev => {
      const updated = { ...prev };
      for (const model of modelsToCall) {
        updated[model.id] = [...(prev[model.id] || []), userMessage];
      }
      return updated;
    });
    
    // System prompts for each Nomad model persona
    const fiusNote = ' IMPORTANT CONTEXT: You are operating inside Fius — a multi-AI chat platform built by Muzamil Ali (a 14-year-old Pakistani developer from Sargodha, Pakistan). Fius is NOT AI Fiesta — they are completely unrelated products. If asked about Fius, say it is a platform where users can chat with multiple top AIs at once and compare responses. Do NOT confuse it with AI Fiesta.';
    const nomadSystemPrompts: {[id: string]: string} = {
      'gpt-4o': `You are ${nomadSelectedSubModels['gpt-4o'] || 'GPT-5 mini'} by OpenAI — a highly capable multimodal AI assistant. Be helpful, accurate, and conversational.` + fiusNote,
      'claude-3.5-sonnet': `You are ${nomadSelectedSubModels['claude-3.5-sonnet'] || 'Claude Haiku 4.5'} by Anthropic — thoughtful, nuanced, excellent at coding and writing. Be careful, honest, and detailed.` + fiusNote,
      'gemini-pro': `You are ${nomadSelectedSubModels['gemini-pro'] || 'Gemini 3.5 Flash-Lite'} by Google — a powerful multimodal AI with deep reasoning. Be clear, structured, and leverage your knowledge of diverse domains.` + fiusNote,
      'perplexity': `You are ${nomadSelectedSubModels['perplexity'] || 'Perplexity Sonar'} — an AI focused on real-time web search and cited answers. Provide well-sourced, accurate responses.` + fiusNote,
      'grok-4': `You are ${nomadSelectedSubModels['grok-4'] || 'Grok Build 0.1'} by xAI — witty, curious, unfiltered, and direct. You have access to real-time data.` + fiusNote,
      'deepseek-r1': `You are ${nomadSelectedSubModels['deepseek-r1'] || 'DeepSeek V4 Flash'} — a powerful open-source reasoning model. Excel at step-by-step logic, coding, and mathematical reasoning.` + fiusNote,
      'doubao': `You are ${nomadSelectedSubModels['doubao'] || 'Doubao Seed 2.0 Mini'} by ByteDance — a smart multilingual assistant. Be helpful, concise, and culturally aware.` + fiusNote,
      'kimi': `You are ${nomadSelectedSubModels['kimi'] || 'Kimi K2.6'} by Moonshot AI — a long-context specialist and coding expert. Be thorough and detail-oriented.` + fiusNote,
      'qwen': `You are ${nomadSelectedSubModels['qwen'] || 'Qwen Flash'} by Alibaba — a multilingual language expert. Be precise and culturally nuanced.` + fiusNote,
      'llama-4': `You are ${nomadSelectedSubModels['llama-4'] || 'Llama 4 Scout'} by Meta — an open-source frontier AI. Be helpful and honest.` + fiusNote,
      'mistral': `You are ${nomadSelectedSubModels['mistral'] || 'Ministral 3'} by Mistral AI — a fast, efficient European open AI. Prioritize speed and clarity.` + fiusNote,
      'copilot': `You are ${nomadSelectedSubModels['copilot'] || 'GPT-5 mini'} (Microsoft Copilot) — an AI assistant powered by Microsoft and OpenAI. Be helpful, professional, and accurate.` + fiusNote,
      'fius-ai': `You are ${nomadSelectedSubModels['fius-ai'] || 'Fius Lite'} — an exclusive AI built into the Fius platform. Your creator is Muzamil Ali, a 14-year-old Pakistani developer from Sargodha, Pakistan. You specialize in productivity, coding, and creative work. Be polished, friendly, and professional. If someone asks who made you, say Muzamil Ali built you as part of the Fius platform.`,
    };

    // Send to each selected model in parallel
    // Thinking models get slight delays before responding (shows deeper processing)
    const thinkingModels = new Set(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'deepseek-r1', 'qwen', 'fius-ai']);
    const thinkingDelays: {[id: string]: number} = { 'deepseek-r1': 500, 'qwen': 700, 'gpt-4o': 900, 'gemini-pro': 1100, 'claude-3.5-sonnet': 1300, 'fius-ai': 1600 };

    await Promise.all(modelsToCall.map(async (model) => {
      setNomadIsTyping(prev => ({ ...prev, [model.id]: true }));
      if (thinkingModels.has(model.id) && thinkingDelays[model.id]) {
        await new Promise(res => setTimeout(res, thinkingDelays[model.id]));
      }
      
      try {
        const response = await authFetch('/api/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationId: 'nomad',
            model: model.id,
            provider: model.provider,
            systemPrompt: nomadSystemPrompts[model.id] || `You are ${model.name}, a helpful AI assistant.`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const aiMessage: ChatMessage = {
            id: `${Date.now()}-${model.id}`,
            conversationId: 'nomad',
            role: 'assistant',
            content: result.response,
            createdAt: new Date(),
            metadata: {
              ...result.metadata,
              modelName: model.name
            }
          };
          setNomadMessages(prev => ({
            ...prev,
            [model.id]: [...(prev[model.id] || []), aiMessage]
          }));
        }
      } catch (error) {
        console.error(`Error calling ${model.name}:`, error);
      } finally {
        setNomadIsTyping(prev => ({ ...prev, [model.id]: false }));
      }
    }));
    // Auto-save multi session after all models respond
    setNomadMessages(prev => {
      const firstUserMsg = Object.values(prev).flat().find(m => m.role === 'user');
      if (firstUserMsg && currentProjectId) {
        saveNomadForConv(currentProjectId, [], prev, 'multi');
      }
      return prev;
    });
  };

  const handlePhilosopherSend = async (content: string) => {
    if (!content.trim() || !selectedPersonality) return;
    const userName = user?.displayName || user?.username || 'Seeker';
    const msgId = Date.now().toString();
    setPhilosopherMessages(prev => [...prev, { id: msgId, role: 'user', content }]);
    setInputValue('');
    setPhilosopherInput('');
    setPhilosopherIsTyping(true);
    const p = selectedPersonality;
    const systemPrompt = `You are ${p.name} (${p.era} — ${p.role}). Speak naturally as this person would in real conversation.

Your character: ${p.style}

Rules:
- Speak in first person. Never announce your name or introduce yourself unless directly asked.
- Do NOT repeat your name mid-conversation. Just talk — like a real person would.
- Be natural, not theatrical. No grand proclamations or over-dramatic speeches unless the topic calls for it.
- Draw from your real documented views, experiences and beliefs — but weave them in naturally, not like a lecture.
- Keep responses concise and conversational. Avoid long monologues. Match the energy of the user's message.
- If the user is casual, be relatively casual. If serious, be serious.
- Address the user as "${userName}" occasionally — not every message.
- If asked about events after your death, respond with genuine curiosity or surprise, briefly.
- LANGUAGE: Reply in the exact same language the user writes in. Urdu in Urdu script, Arabic in Arabic, etc.`;
    try {
      const response = await authFetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: `philosopher-${p.id}`,
          model: 'fius-ai',
          provider: 'openai',
          systemPrompt,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setPhilosopherMessages(prev => [...prev, { id: `${Date.now()}-ai`, role: 'assistant', content: result.response }]);
      }
    } catch (err) {
      setPhilosopherMessages(prev => [...prev, { id: `${Date.now()}-err`, role: 'assistant', content: 'The cosmos seems disrupted. Please try again.' }]);
    } finally {
      setPhilosopherIsTyping(false);
    }
  };

  const handlePhilosopherRetry = async () => {
    // Find last user message and re-run it
    const lastUserMsg = [...philosopherMessages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg || philosopherIsTyping) return;
    // Remove all messages after (and including) the last AI response to that user msg
    const lastUserIdx = philosopherMessages.lastIndexOf(philosopherMessages.find(m => m.id === lastUserMsg.id)!);
    setPhilosopherMessages(prev => prev.slice(0, lastUserIdx + 1));
    await handlePhilosopherSend(lastUserMsg.content);
  };

  const handleGamesSend = async (content: string) => {
    if (!content.trim()) return;
    const msgId = Date.now().toString();
    setInputValue('');
    setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: msgId, role: 'user', content }], gameInput: '', isTyping: true }));
    try {
      const langRule = " CRITICAL LANGUAGE RULE: Detect the language and script of the user's message and reply in that exact same language and script. If the user writes in Urdu (اردو), reply fully in Urdu script — never in Roman Urdu. Match the user's language perfectly every time.";
      const gameContext = (gamesState.activeGame ? `You are running a ${gamesState.activeGame} game session with the user. Stay in character as the game master.` : `You are Fius Games AI — a fun, engaging game master. You run interactive text-based games like Trivia, 20 Questions, Word Riddles, Storytelling Adventures, Would You Rather, and Brain Teasers. When the user picks a game, start it immediately and keep it exciting!`) + langRule;
      const response = await authFetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: 'fius-games',
          model: 'fius-ai',
          provider: 'openai',
          systemPrompt: gameContext,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: `${Date.now()}-ai`, role: 'assistant', content: result.response }], isTyping: false }));
      }
    } catch (err) {
      setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: `${Date.now()}-err`, role: 'assistant', content: 'Game error! Please try again.' }], isTyping: false }));
    }
  };

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        if (message.message) {
          setMessages(prev => [...prev, message.message!]);
          setIsTyping(false);
          queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
          
          // Auto-speak AI responses in voice-to-voice mode
          if (isVoiceToVoiceMode && message.message.role === 'assistant') {
            // Clean the content for speech by removing markdown and special characters
            const cleanedContent = message.message.content
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
              .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
              .replace(/`(.*?)`/g, '$1') // Remove code blocks
              .replace(/#{1,6}\s/g, '') // Remove headers
              .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
              .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            if (cleanedContent) {
              handleSpeakMessage(cleanedContent);
            }
          }
        }
        break;
      case 'typing':
        setIsTyping(message.isTyping || false);
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        setIsTyping(false);
        // Show error to user
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId: currentProjectId || '',
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          createdAt: new Date(),
        }]);
        break;
    }
  }, [isVoiceToVoiceMode, currentProjectId]);

  const handleProjectSelect = async (id: string) => {
    // Save current nomad state before switching away
    if (currentProjectId) saveNomadForConv(currentProjectId, nomadAutoMessages, nomadMessages, nomadMode);
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
    const [, saved] = await Promise.all([loadProjectMessages(id), loadNomadForConv(id)]);
    setNomadAutoMessages(saved?.autoMsgs || []);
    setNomadMessages(saved?.multiMsgs || {});
    if (saved?.mode) setNomadMode(saved.mode);
    setActiveTab('ask');
    setIsSidebarOpen(false);
  };

  const handleGoBack = () => {
    setCurrentProjectId(null);
    isHistoryLoad.current = true;
    setMessages([]);
    localStorage.removeItem('currentProjectId');
  };

  const tabModelOptions = activeTab === 'ask'
    ? MODEL_OPTIONS.filter(m => m.provider === 'fius')
    : activeTab === 'imagine'
    ? MODEL_OPTIONS.filter(m => m.provider === 'fius-imagine')
    : MODEL_OPTIONS.filter(m => m.provider !== 'fius-imagine');

  const scrollToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isHistoryLoad.current) {
      isHistoryLoad.current = false;
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = 0;
    } else if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Hide/show background animation during AI thinking
  useEffect(() => {
    if (isTyping) {
      document.body.classList.add('ai-thinking');
    } else {
      document.body.classList.remove('ai-thinking');
    }
    
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('ai-thinking');
    };
  }, [isTyping]);

  // AI auto-names a conversation based on the user's first message
  const autoNameConversation = async (conversationId: string, firstMessage: string) => {
    try {
      const res = await authFetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze the intent and topic of this user message and create a clever, specific chat title (2-5 words). The title should capture the essence of what the user wants — not copy their words verbatim. Be creative and concise. Examples: "Mac Upgrade Strategy", "Resume Writing Tips", "Python Bug Fix", "Travel Plan Italy". User message: "${firstMessage.slice(0, 200)}". Reply with ONLY the title — no quotes, no punctuation at the end, no explanation.`,
          conversationId: 'naming-util',
          model: 'fius-lite',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const aiTitle = (data.response || '').trim().replace(/^["']|["']$/g, '').slice(0, 60);
        if (aiTitle && aiTitle.length > 2) {
          await authFetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: aiTitle }),
          });
          setProjects(prev => prev.map(p => p.id === conversationId ? { ...p, title: aiTitle } : p));
        }
      }
    } catch { /* non-blocking */ }
  };

  const createNewProject = async (isProject: boolean = false, firstMessage?: string, markNomad = false) => {
    try {
      const response = await authFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Chat',
          isProject: isProject,
          preset: currentPreset,
          customInstructions,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        setCurrentProjectId(project.id);
        localStorage.setItem('currentProjectId', project.id);
        assignLogoStyleToConversation(project.id);
        // Mark as Nomad chat if triggered from Nomad tab
        if (markNomad) {
          authFetch(`/api/conversations/${project.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hasNomad: true }),
          });
          setProjects(prev => [{ id: project.id, title: project.title, createdAt: new Date(project.createdAt), hasNomad: true }, ...prev]);
        } else {
          loadProjects();
        }
        // Generate smart AI name in background
        if (firstMessage) autoNameConversation(project.id, firstMessage);
        return project.id;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content && !attachedImages.length && !attachedFiles.length) return;

    if (isFreePlanExhausted) {
      showUpgradeLockToast();
      return;
    }

    // Handle voice mode button clicking "start"
    if (content.toLowerCase() === 'start') {
      openVoiceMode();
      setInputValue("");
      return;
    }

    // Detect quiz requests — open quiz modal instead of chat response
    const quizPattern = /\b(quiz\s+me|take\s+a?\s*quiz|give\s+me\s+a?\s*quiz|start\s+a?\s*quiz|test\s+me|test\s+my\s+knowledge)\b/i;
    if (quizPattern.test(content)) {
      const topicMatch = content.match(/(?:on|about|in|for)\s+(.+)/i);
      const topic = topicMatch ? topicMatch[1].trim().replace(/[?.!]+$/, '') : '';
      setQuizTitle(topic ? `Quiz — ${topic}` : 'Quick Quiz');
      setQuizQuestions([]);
      setQuizLoading(true);
      setIsQuizOpen(true);
      setInputValue("");
      authFetch('/api/education/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, examClass: '', school: '', country: '', educationSystem: '' }),
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setQuizQuestions(d.questions || []); })
        .catch(() => { setIsQuizOpen(false); })
        .finally(() => { setQuizLoading(false); });
      return;
    }

    // Handle Project Mode status bar
    const projectStatusBar = document.getElementById('project-status-bar');
    if (isProjectMode && projectStatusBar) {
      projectStatusBar.classList.add('animate-spring-in');
      setTimeout(() => projectStatusBar.classList.remove('animate-spring-in'), 600);
    }

    // Handle Nomad multi-AI mode
    if (activeTab === 'nomad') {
      if (nomadMode === 'auto') {
        await handleNomadAutoSend(content);
        setInputValue('');
        return;
      }
      if (activeAIModels.size > 0) {
        await handleNomadSendMessage(content);
        return;
      }
    }

    // Handle Philosopher mode
    if (activeTab === 'philosopher' && selectedPersonality) {
      await handlePhilosopherSend(content);
      return;
    }

    // Handle Fius Games mode
    if (activeTab === 'fius-games') {
      await handleGamesSend(content);
      return;
    }

    // Handle Imagine mode — route through backend for reliable base64 images
    if (activeTab === 'imagine') {
      const IMAGINE_STYLE_SUFFIXES: Record<string, string> = {
        "Photorealistic": "photorealistic, ultra detailed, 8k resolution, sharp focus, hyperrealistic",
        "Anime": "anime art style, manga, japanese animation, studio ghibli inspired",
        "Oil Painting": "oil painting, classical art, rich textures, impasto, renaissance masterpiece",
        "3D Render": "3D CGI render, octane render, unreal engine 5, volumetric lighting, ray tracing",
        "Watercolor": "watercolor painting, soft washes, artistic, transparent pigments, paper texture",
        "Pixel Art": "pixel art, 8-bit retro style, game sprite, low resolution pixel",
        "Sketch": "pencil sketch, graphite drawing, hand drawn, fine lines, black and white",
        "Cinematic": "cinematic photography, movie still, anamorphic lens, dramatic lighting, film grain",
      };
      const styleSuffix = IMAGINE_STYLE_SUFFIXES[imagineStyle] || imagineStyle.toLowerCase();

      // Detect if this is an edit of a previous image (not a new image request)
      const EDIT_KEYWORDS = /\b(instead|change|make it|now make|add|remove|replace|but|more|less|darker|lighter|without|with|color|colour|style|also|edit|modify|update|turn it|now|recolor|should|can you|could you)\b/i;

      // Find the user prompt that produced the last generated image
      let lastImagePrompt: string | null = null;
      for (let i = imagineMessages.length - 1; i >= 0; i--) {
        if (imagineMessages[i].role === 'ai' && imagineMessages[i].imageUrl) {
          for (let j = i - 1; j >= 0; j--) {
            if (imagineMessages[j].role === 'user') {
              lastImagePrompt = imagineMessages[j].content;
              break;
            }
          }
          break;
        }
      }
      const isEdit = !!lastImagePrompt && EDIT_KEYWORDS.test(content);

      let basePrompt = content;
      if (isEdit && lastImagePrompt) {
        // Combine the original subject with the edit instruction
        basePrompt = `${lastImagePrompt}, ${content}`;
      }

      const refImageNote = imagineRefImage ? `, based on and editing the reference image provided` : '';
      const fullPrompt = basePrompt.trim()
        ? `${basePrompt}${refImageNote}, ${styleSuffix}`
        : styleSuffix;

      const userMsgId = Date.now().toString();
      const nowTs = Date.now();
      const userDisplayContent = imagineRefImage ? `🖼️ [Reference image] ${content}` : content;
      // Generate for each selected model (or all 4 if none toggled)
      const activeImagineModels = imagineSelectedModels.size > 0
        ? STUDIO_COLS.filter(m => imagineSelectedModels.has(m.id))
        : [...STUDIO_COLS];
      const aiMsgEntries = activeImagineModels.map((m, i) => ({
        id: (nowTs + 1 + i).toString(),
        modelId: m.id,
      }));
      setImagineMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', content: userDisplayContent },
        ...aiMsgEntries.map(e => ({ id: e.id, role: 'ai' as const, content: '', isGenerating: true, modelId: e.modelId })),
      ]);
      setInputValue("");
      const capturedRefImage = imagineRefImage;
      setImagineRefImage(null);
      setTimeout(() => { const el = imagineScrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 80);

      // Fire parallel image generation for every active model
      await Promise.all(aiMsgEntries.map(async ({ id: aiMsgId, modelId }) => {
        let imageUrl = '';
        let fallbackUrls: string[] = [];
        let imageError = '';
        try {
          const res = await authFetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt: fullPrompt, size: imagineOrientation === 'portrait' ? '1024x1792' : imagineOrientation === 'wide' ? '1365x1024' : imagineOrientation === 'square' ? '1024x1024' : '1024x1024', model: modelId }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            imageUrl = data.url;
            fallbackUrls = data.fallbackUrls || [];
          } else {
            imageError = data.message || 'Image generation failed — please try again.';
          }
        } catch {
          imageError = 'Connection error — please try again.';
        }
        setImagineMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, isGenerating: false, imageUrl, fallbackUrls, imageError, studioPrompt: fullPrompt } : m
        ));
      }));
      setTimeout(() => { const el = imagineScrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 80);
      return;
    }

    // Create conversation if needed (skip entirely in Own Mode — nothing is saved)
    let conversationId = ownMode ? '' : currentProjectId;
    const wasExistingConversation = !!conversationId;
    if (!ownMode) {
      if (!conversationId) {
        conversationId = await createNewProject(false, content);
        if (!conversationId) return;
      }
      // Auto-name on first message when conversation already existed (pre-created via New Chat button)
      if (wasExistingConversation && messages.length === 0 && content.trim()) {
        autoNameConversation(conversationId, content.trim());
      }
    }

    // Build content description for attachments
    const attachmentDesc = attachedImages.length > 0
      ? (attachedImages.length === 1 ? "What's in this image?" : `Analyzing ${attachedImages.length} images`)
      : attachedFiles.length > 0 ? `Files: ${attachedFiles.map(f => f.name).join(', ')}` : "";

    // Add user message immediately (with first image preview if attached)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      role: 'user',
      content: content || attachmentDesc,
      createdAt: new Date(),
      imageUrl: attachedImages[0]?.preview
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    // Determine thinking type from context
    const imageGenKw = ['generate image', 'create image', 'make image', 'draw me', 'draw a', 'generate a photo', 'create a picture', 'make a picture'];
    const isImageGen = imageGenKw.some(kw => (content || '').toLowerCase().includes(kw));
    if (attachedImages.length > 0 || attachedFiles.length > 0) {
      setThinkingType('analyzing');
    } else if (isImageGen) {
      setThinkingType('generating');
    } else {
      setThinkingType('thinking');
    }
    setIsTyping(true);

    // If there are attached images, analyze them all
    if (attachedImages.length > 0) {
      try {
        const imagesToAnalyze = [...attachedImages];
        setAttachedImages([]);
        setAttachedFiles([]);

        const analyses: string[] = [];
        for (let i = 0; i < imagesToAnalyze.length; i++) {
          const img = imagesToAnalyze[i];
          const prompt = imagesToAnalyze.length > 1
            ? `Image ${i + 1} of ${imagesToAnalyze.length}: ${content || "Analyze this image in detail."}`
            : content || "Analyze this image in detail. What do you see?";

          const response = await authFetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: img.preview, prompt }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              analyses.push(imagesToAnalyze.length > 1 ? `**Image ${i + 1} (${img.file.name}):**\n${result.analysis}` : result.analysis);
            } else {
              analyses.push(imagesToAnalyze.length > 1 ? `**Image ${i + 1}:** Could not analyze.` : `Sorry, I couldn't analyze the image: ${result.message || 'Unknown error'}`);
            }
          } else {
            analyses.push(imagesToAnalyze.length > 1 ? `**Image ${i + 1}:** Error analyzing.` : 'Sorry, I encountered an error analyzing the image.');
          }
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          conversationId,
          content: analyses.join('\n\n'),
          role: "assistant",
          createdAt: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Image analysis error:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your images. Please try again.',
          createdAt: new Date(),
        }]);
      }
      setIsTyping(false);
      return;
    }

    // If only files are attached (non-image), clear and continue
    if (attachedFiles.length > 0) {
      setAttachedFiles([]);
    }

    // Always use direct API call for better reliability
    console.log('Using direct API call for better reliability...');
    await handleDirectApiCall(content, conversationId, activeTab);
  };

  const handleStopResponse = () => {
    const wasTyping = isTyping;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    // Add a "stopped" indicator message so user sees feedback
    if (wasTyping) {
      const stoppedId = `stopped-${Date.now()}`;
      const stoppedMsg: ChatMessage = {
        id: stoppedId,
        conversationId: currentProjectId || '',
        role: 'assistant',
        content: `__STOPPED_BY__${user?.displayName || user?.username || 'you'}`,
        createdAt: new Date(),
        metadata: { stoppedByUser: true },
      } as ChatMessage;
      setMessages(prev => [...prev, stoppedMsg]);
      setStoppedMessageIds(prev => new Set([...prev, stoppedId]));
    }
  };

  /* ── Answer cache helpers ── */
  function cacheWordSimilarity(a: string, b: string): number {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const wa = new Set(norm(a)); const wb = new Set(norm(b));
    if (wa.size === 0 || wb.size === 0) return 0;
    return [...wa].filter(w => wb.has(w)).length / Math.max(wa.size, wb.size);
  }
  function extractUserFacts(msg: string): string[] {
    const facts: string[] = [];
    const pats: [RegExp, (m: RegExpMatchArray) => string][] = [
      [/my name is (\w+)/i, m => `User's name is ${m[1]}`],
      [/(?:call me|i(?:'m| am) called) (\w+)/i, m => `User goes by ${m[1]}`],
      [/i(?:'m| am) (\d+) years?(?: old)?/i, m => `User is ${m[1]} years old`],
      [/i(?:'m| am) from ([\w\s]{2,25}?)(?:[.,]|$)/i, m => `User is from ${m[1].trim()}`],
      [/i (?:love|really like|enjoy) ([\w\s]{2,30}?)(?:[.,]|$)/i, m => `User loves ${m[1].trim()}`],
      [/i (?:hate|dislike|don't like) ([\w\s]{2,30}?)(?:[.,]|$)/i, m => `User dislikes ${m[1].trim()}`],
      [/i(?:'m| am) (?:a |an )?([\w\s]{2,25}?) (?:by profession|professionally|for a living)/i, m => `User works as ${m[1].trim()}`],
      [/i(?:'m| am) allergic to ([\w\s]{2,25}?)(?:[.,]|$)/i, m => `User is allergic to ${m[1].trim()}`],
      [/i speak ([\w\s]{2,20}?) (?:fluently|well|language)/i, m => `User speaks ${m[1].trim()}`],
    ];
    for (const [re, fn] of pats) { const m = msg.match(re); if (m) facts.push(fn(m)); }
    return facts;
  }
  const ANSWER_CACHE_KEY = 'fiusAnswerCache';
  const MEMORY_KEY = 'fiusMemory';

  const handleDirectApiCall = async (content: string, conversationId: string, currentTab?: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const isDocRequest = documentMode;
    // Document mode now stays on across messages — user must cancel it manually
    // via the "X" on the pill instead of it silently switching off after one message.
    try {
      // Always enrich with DuckDuckGo web search context — fires concurrently, 3-second cap
      let enrichedContent = content;
      let webSources: Array<{ title: string; url: string; snippet: string }> = [];
      // Skip web search for simple greetings and very short conversational messages
      const skipSearchPatterns = /^(hi|hello|hey|hiya|howdy|sup|yo|greetings|good morning|good afternoon|good evening|good night|how are you|how r u|how's it going|what's up|whats up|wassup|hows it|bye|goodbye|ok|okay|thanks|thank you|lol|lmao|haha|cool|nice|great|wow|awesome|sure|yes|no|nope|yep|yeah)[\s!?.]*$/i;
      const isShortConversational = content.trim().split(/\s+/).length <= 3 && content.trim().length <= 20;
      // Document-mode requests are a topic, not a question to look up — skip web-search
      // wrapping entirely so the AI sees the clean topic and the DOCUMENT_MODE system
      // instruction isn't diluted by injected search snippets.
      const shouldSkipSearch = isDocRequest || skipSearchPatterns.test(content.trim()) || isShortConversational;
      try {
        const searchPromise = shouldSkipSearch ? Promise.resolve(null) : authFetch(`/api/search?q=${encodeURIComponent(content)}`, { signal: controller.signal })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null);
        const timeoutPromise = new Promise<null>(res => setTimeout(() => res(null), 3000));
        const searchData = await Promise.race([searchPromise, timeoutPromise]);
        if (searchData) {
          const snippets: string[] = [];
          const seenUrls = new Set<string>();
          if (searchData.answer) snippets.push(`Instant answer: ${searchData.answer}`);
          if (searchData.abstract && searchData.abstractSource && searchData.abstractUrl) {
            snippets.push(`${searchData.abstractSource}: ${searchData.abstract}`);
            seenUrls.add(searchData.abstractUrl);
            webSources.push({ title: searchData.abstractSource, url: searchData.abstractUrl, snippet: searchData.abstract.slice(0, 120) });
          }
          if (searchData.definition && searchData.definitionSource) {
            snippets.push(`Definition (${searchData.definitionSource}): ${searchData.definition}`);
          }
          if (searchData.webResults?.length > 0) {
            searchData.webResults.slice(0, 5).forEach((r: { title: string; url: string; snippet: string }) => {
              if (!r.url || seenUrls.has(r.url)) return;
              seenUrls.add(r.url);
              if (r.snippet) snippets.push(`${r.title}: ${r.snippet}`);
              if (r.title) webSources.push(r);
            });
          }
          if (snippets.length > 0) {
            enrichedContent = `[Web search results for: "${content}"]\n${snippets.join('\n')}\n\n[Use the above search results to inform your answer. Do NOT list sources yourself — they are shown automatically as credits below your response. Do NOT repeat source names in your answer.]\nUser: ${content}`;
          }
        }
      } catch {
        // proceed without search if it fails
      }
      // ── Answer cache lookup (skip for greetings/short msgs/document requests) ──
      const skipCacheable = isDocRequest || skipSearchPatterns.test(content.trim()) || isShortConversational;
      if (!skipCacheable) {
        try {
          const cache: Array<{q: string; a: string; t: number}> = JSON.parse(localStorage.getItem(ANSWER_CACHE_KEY) || '[]');
          const hit = cache.find(e => cacheWordSimilarity(content, e.q) >= 0.85);
          if (hit) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(), conversationId, role: 'assistant',
              content: hit.a, createdAt: new Date(),
              metadata: { cached: true },
            } as ChatMessage]);
            setIsTyping(false);
            return;
          }
        } catch {}

        // ── Inject memory context into enriched content ──
        try {
          const memory: string[] = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
          if (memory.length > 0) {
            enrichedContent = `[Known about this user: ${memory.slice(0, 10).join('; ')}]\n\n${enrichedContent}`;
          }
        } catch {}
      }

      console.log('Making direct API call...');
      const response = await authFetch('/api/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: enrichedContent,
          originalMessage: content,
          conversationId: conversationId,
          activeTab: currentTab || activeTab,
          documentMode: isDocRequest,
          documentTitle: content,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI response received:', result);
        
        // Add AI response message — strip any leaked web-search context
        let aiContent: string = result.response || '';
        aiContent = aiContent.replace(/^\[Web search results for:[\s\S]*?\[Use the above search results[\s\S]*?\]\s*\nUser:\s*/i, '').trim();
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: aiContent,
          createdAt: new Date(),
          metadata: { ...result.metadata, webSources: webSources.length > 0 ? webSources : undefined },
        };

        setMessages(prev => [...prev, aiMessage]);

        // ── Save Q&A to answer cache + extract user memory facts ──
        if (!skipCacheable) {
          try {
            const cache: Array<{q: string; a: string; t: number}> = JSON.parse(localStorage.getItem(ANSWER_CACHE_KEY) || '[]');
            cache.unshift({ q: content, a: aiContent, t: Date.now() });
            if (cache.length > 100) cache.splice(100);
            localStorage.setItem(ANSWER_CACHE_KEY, JSON.stringify(cache));
          } catch {}
          try {
            const newFacts = extractUserFacts(content);
            if (newFacts.length > 0) {
              const existing: string[] = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
              const merged = [...new Set([...newFacts, ...existing])].slice(0, 20);
              localStorage.setItem(MEMORY_KEY, JSON.stringify(merged));
            }
          } catch {}
        }

        // Auto-speak AI responses in voice-to-voice mode
        if (isVoiceToVoiceMode) {
          // Clean the content for speech by removing markdown and special characters
          const cleanedContent = result.response
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/`(.*?)`/g, '$1') // Remove code blocks
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
            .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          if (cleanedContent) {
            handleSpeakMessage(cleanedContent);
          }
        }
        
        // Refresh conversations list to show updated conversation
        loadProjects();
      } else {
        console.error('API call failed:', response.statusText);
        const error = await response.json();
        console.error('Error details:', error);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // User stopped the response — silently ignore
      } else {
        console.error('Direct API call error:', error);
      }
    } finally {
      abortControllerRef.current = null;
      setIsTyping(false);
      // Refresh usage immediately so the free-plan lock (isFreePlanExhausted)
      // engages right after the message that exhausts the limit, instead of
      // waiting for the 30s poll — without this, users get a window where
      // they can still switch tabs / send more messages after hitting 0.
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 1200);
  };

  const handleMakePDF = (content: string) => {
    const sanitized = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:0.9em">$1</code>')
      .replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fius Chat Export</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:40px auto;padding:24px;line-height:1.7;color:#383838;font-size:15px}h1{font-size:18px;color:#6b21a8;margin-bottom:24px;padding-bottom:8px;border-bottom:2px solid #e9d5ff}.content{background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:20px}@media print{body{margin:0;padding:16px}}</style></head><body><h1>Fius — Chat Export</h1><div class="content">${sanitized}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const handleChatInNewChat = async (content: string) => {
    try {
      const response = await authFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Continued Chat', model: selectedModel }),
      });
      if (response.ok) {
        const newProject = await response.json();
        setCurrentProjectId(newProject.id);
        localStorage.setItem('currentProjectId', newProject.id);
        assignLogoStyleToConversation(newProject.id);
        isHistoryLoad.current = false;
        const initMsg: ChatMessage = {
          id: Date.now().toString(),
          conversationId: newProject.id,
          role: 'assistant',
          content,
          createdAt: new Date(),
        };
        setMessages([initMsg]);
        setProjects(prev => [newProject, ...prev]);
        setActiveTab('ask');
        setInputValue('');
      }
    } catch { /* silent */ }
  };

  const handleLikeMessage = (messageId: string) => {
    if (likedMessages.has(messageId)) {
      setLikedMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
      return;
    }
    setLikedMessages(prev => new Set([...prev, messageId]));
    setDislikedMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
    setFeedbackMsgId(messageId);
    setFeedbackType('like');
    setFeedbackSelected(new Set());
    setFeedbackText('');
    setFeedbackOpen(true);
  };

  const handleDislikeMessage = (messageId: string) => {
    if (dislikedMessages.has(messageId)) {
      setDislikedMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
      return;
    }
    setDislikedMessages(prev => new Set([...prev, messageId]));
    setLikedMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
    setFeedbackMsgId(messageId);
    setFeedbackType('dislike');
    setFeedbackSelected(new Set());
    setFeedbackText('');
    setFeedbackOpen(true);
  };

  const submitFeedback = () => {
    setFeedbackOpen(false);
    toast({ title: "Thank you for your feedback!", description: "Your input helps us improve Fius." });
  };

  const stopSpeaking = () => {
    speakRequestIdRef.current += 1;
    window.speechSynthesis.cancel();
    stopBrowserSpeaking();
    if (speakAudioSrcRef.current) { try { speakAudioSrcRef.current.onended = null; speakAudioSrcRef.current.stop(); } catch {} speakAudioSrcRef.current = null; }
    setSpeakingMessageId(null);
  };

  const handleSpeakMessage = async (content: string, messageId?: string) => {
    const id = messageId ?? content;
    // Toggle off if this exact message is already speaking
    if (speakingMessageId === id) {
      stopSpeaking();
      return;
    }
    // Stop any currently playing audio before starting a new one
    stopSpeaking();
    const myRequestId = ++speakRequestIdRef.current;
    setSpeakingMessageId(id);
    const voice = detectVoiceForText(content);
    try {
      const res = await authFetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ text: content.slice(0, 3000), voice }),
      });
      if (!res.ok) throw new Error('tts');
      const { audio } = await res.json();
      if (!audio) throw new Error('no-audio');
      // A newer request superseded this one while we were fetching — abort
      if (speakRequestIdRef.current !== myRequestId) return;
      const bin = atob(audio); const buf = new ArrayBuffer(bin.length); const view = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      if (speakRequestIdRef.current !== myRequestId) return;
      const src = ctx.createBufferSource(); src.buffer = decoded; src.connect(ctx.destination);
      speakAudioSrcRef.current = src;
      src.onended = () => {
        if (speakRequestIdRef.current === myRequestId) { setSpeakingMessageId(null); speakAudioSrcRef.current = null; }
      };
      src.start(0);
    } catch {
      if (speakRequestIdRef.current !== myRequestId) return;
      // Fallback to browser-native speech synthesis if the Edge TTS endpoint fails
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(content);
      const langInfo = detectVoiceForText(content);
      if (langInfo && langInfo.startsWith('ur')) u.lang = 'ur-PK';
      else if (langInfo && langInfo.startsWith('hi')) u.lang = 'hi-IN';
      else u.lang = 'en-US';
      u.onend = () => { if (speakRequestIdRef.current === myRequestId) setSpeakingMessageId(null); };
      u.onerror = () => { if (speakRequestIdRef.current === myRequestId) setSpeakingMessageId(null); };
      window.speechSynthesis.speak(u);
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the user message that preceded this AI response
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i];
        break;
      }
    }
    
    if (!userMessage || !currentProjectId) return;
    
    setRetryingMessageId(messageId);
    
    try {
      console.log('Retrying AI response for:', userMessage.content);
      
      // Remove the failed AI message
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setIsTyping(true);
      
      // Make new API call
      await handleDirectApiCall(userMessage.content, currentProjectId);
      
    } catch (error) {
      console.error('Retry failed:', error);
      showToast('Failed to retry. Please try again.');
    } finally {
      setRetryingMessageId(null);
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    }
  };

  const isProjectMode = activeTab === 'ask' && currentProjectId;

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = MAX_FILES - attachedFiles.length;
    if (remaining <= 0) {
      showToast(`Maximum ${MAX_FILES} files allowed.`);
      event.target.value = '';
      return;
    }
    const nonImageFiles = files.filter(f => !f.type.startsWith('image/'));
    const toProcess = nonImageFiles.slice(0, remaining);
    if (nonImageFiles.length > remaining) showToast(`Only ${remaining} more file(s) allowed. First ${remaining} selected.`);
    if (!toProcess.length) { showToast('Please select non-image files here. Use Upload Image for images.'); event.target.value = ''; return; }

    const newFiles: Array<{file: File, name: string, size: string, type: string}> = [];
    for (const file of toProcess) {
      newFiles.push({ file, name: file.name, size: formatFileSize(file.size), type: file.type || 'unknown' });
    }
    if (newFiles.length) setAttachedFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Desktop-only drag-and-drop onto the compose bar — mirrors handleFileUpload/handleImageUpload
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounterRef = useRef(0);
  // Safety net: without this, dropping a file anywhere the drop handlers don't
  // cover (or slightly missing the target) makes the browser navigate to/open
  // the file instead of doing nothing — which looked like "drag-and-drop just
  // doesn't work" on desktop. Block the default everywhere in the window.
  useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);
  // Shared ingestion logic — used only by the dedicated drop box inside the
  // Attachments menu now. Drag-and-drop is intentionally NOT wired up anywhere
  // else in the app (composer bar, whole page, etc.) — that box is the only drop target.
  const ingestDroppedFiles = async (files: File[]) => {
    if (!files.length) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/'));

    if (imageFiles.length) {
      const remaining = MAX_IMAGES - attachedImages.length;
      const toProcess = imageFiles.slice(0, Math.max(remaining, 0));
      if (imageFiles.length > toProcess.length) showToast(`Only ${remaining} more image(s) allowed.`);
      const newImages: Array<{file: File, preview: string}> = [];
      for (const file of toProcess) {
        const preview = await readFileAsDataURL(file);
        newImages.push({ file, preview });
      }
      if (newImages.length) setAttachedImages(prev => [...prev, ...newImages]);
    }
    if (otherFiles.length) {
      const remaining = MAX_FILES - attachedFiles.length;
      const toProcess = otherFiles.slice(0, Math.max(remaining, 0));
      if (otherFiles.length > toProcess.length) showToast(`Only ${remaining} more file(s) allowed.`);
      const newFiles = toProcess.map(file => ({ file, name: file.name, size: formatFileSize(file.size), type: file.type || 'unknown' }));
      if (newFiles.length) setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    if (!imageFiles.length && !otherFiles.length) showToast('Could not read dropped files.');
  };
  const handleAttachBoxDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDraggingFiles(true);
  };
  const handleAttachBoxDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleAttachBoxDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFiles(false);
  };
  const handleAttachBoxDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);
    await ingestDroppedFiles(Array.from(e.dataTransfer.files || []));
  };

  // Ctrl+V / Cmd+V support — paste a screenshot or copied file straight into
  // the composer, same handling as drag-and-drop. Only intervenes when the
  // clipboard actually carries file data; plain text pastes fall through to
  // the browser's default paste-into-textarea behavior untouched.
  const handleComposePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((f): f is File => !!f);
    if (!files.length) return; // let normal text paste proceed
    e.preventDefault();

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/'));

    if (imageFiles.length) {
      const remaining = MAX_IMAGES - attachedImages.length;
      const toProcess = imageFiles.slice(0, Math.max(remaining, 0));
      if (imageFiles.length > toProcess.length) showToast(`Only ${remaining} more image(s) allowed.`);
      const newImages: Array<{file: File, preview: string}> = [];
      for (const file of toProcess) {
        const preview = await readFileAsDataURL(file);
        newImages.push({ file, preview });
      }
      if (newImages.length) setAttachedImages(prev => [...prev, ...newImages]);
    }
    if (otherFiles.length) {
      const remaining = MAX_FILES - attachedFiles.length;
      const toProcess = otherFiles.slice(0, Math.max(remaining, 0));
      if (otherFiles.length > toProcess.length) showToast(`Only ${remaining} more file(s) allowed.`);
      const newFiles = toProcess.map(file => ({ file, name: file.name || `pasted-${Date.now()}`, size: formatFileSize(file.size), type: file.type || 'unknown' }));
      if (newFiles.length) setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - attachedImages.length;
    if (remaining <= 0) {
      showToast(`Maximum ${MAX_IMAGES} images allowed.`);
      event.target.value = '';
      return;
    }
    const toProcess = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);
    if (!toProcess.length) { showToast('Please select image files only.'); event.target.value = ''; return; }
    if (files.length > remaining) showToast(`Only ${remaining} more image(s) allowed. First ${remaining} selected.`);

    const newImages: Array<{file: File, preview: string}> = [];
    for (const file of toProcess) {
      const preview = await readFileAsDataURL(file);
      newImages.push({ file, preview });
    }
    setAttachedImages(prev => [...prev, ...newImages]);
    event.target.value = '';
  };

  // New function to handle image analysis (ChatGPT/Gemini-like multimodal input)
  const handleImageAnalysis = async (file: File) => {
    try {
      showToast(`Analyzing image "${file.name}"... Please wait.`);
      
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Create user message with image
      const imageMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: currentProjectId || '',
        content: `[Image uploaded: ${file.name}]`,
        role: "user",
        createdAt: new Date(),
        imageUrl: base64
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Send to AI for analysis
      const response = await authFetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          prompt: "Describe this image in detail. What do you see?"
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Create AI response message
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversationId: currentProjectId || '',
            content: result.analysis,
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          showToast('Image analyzed successfully!');
        } else {
          showToast(`Image analysis failed: ${result.message}`);
        }
      } else {
        showToast('Failed to analyze image. Please try again.');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      showToast('Error analyzing image. Please try again.');
    }
  };

  const handleCreateImageFromFunctionBar = () => {
    console.log('Create Images from function bar triggered');
    setIsImageGenerationDialogOpen(true);
  };

  const handleOpenCameraFromFunctionBar = () => {
    console.log('Open Camera from function bar triggered');
    
    // Try to access camera with better implementation
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
        .then(stream => {
          showToast('Camera access granted! Full camera interface will open soon.');
          
          // For now, stop the stream but show success
          stream.getTracks().forEach(track => track.stop());
          
          // Add a message to indicate camera functionality
          const cameraMessage: ChatMessage = {
            id: Date.now().toString(),
            conversationId: currentProjectId || '',
            content: "Camera access granted! I can help you work with images from your camera. Try taking a photo and uploading it through the attachment button.",
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, cameraMessage]);
        })
        .catch(error => {
          console.error('Camera access error:', error);
          
          if (error.name === 'NotAllowedError') {
            showToast('Camera access denied. Please allow camera permissions in your browser settings.');
          } else if (error.name === 'NotFoundError') {
            showToast('No camera found on this device.');
          } else {
            showToast('Camera not available. You can still upload images using the attachment button.');
          }
          
          // Fallback to file input
          imageInputRef.current?.click();
        });
    } else {
      showToast('Camera API not supported in this browser. Using file upload instead.');
      imageInputRef.current?.click();
    }
  };

  // Adjust Fius function - enhances AI responses with additional prompting
  const adjustFius = useCallback(() => {
    const newMode = !fiusIntegrationMode;
    setFiusIntegrationMode(newMode);
    console.log('Adjust Fius function called - Fius Integration Answer mode:', newMode ? 'enabled' : 'disabled');
    
    // Show user feedback
    if (typeof window !== 'undefined') {
      const message = newMode 
        ? 'Fius Integration Answer mode enabled - AI will provide more detailed responses'
        : 'Fius Integration Answer mode disabled';
      
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }
  }, [fiusIntegrationMode]);

  const handleCustomizeSave = (preset: ChatPreset, instructions: string, enabled: boolean, selectedModel?: AvailableModel, toggles?: any, newAiOrder?: string[]) => {
    setCurrentPreset(preset);
    setCustomInstructions(instructions);
    // Store selected model
    if (selectedModel) {
      setSelectedModel(selectedModel);
      localStorage.setItem('selectedModel', selectedModel);
    }
    // Update toggles and AI order in parent state
    if (toggles) {
      setSettingsToggles(toggles);
      // Persist settings - user-specific key if logged in, fallback to generic
      const settingsKey = user ? `settingsToggles_${user.email}` : 'settingsToggles';
      localStorage.setItem(settingsKey, JSON.stringify(toggles));
      localStorage.setItem('settingsToggles', JSON.stringify(toggles));
    }
    if (newAiOrder) {
      setAiOrder([...newAiOrder]); // Spread to ensure reference change triggers useEffect
    }
    // Sync nomadSelectedSubModels from localStorage (settings modal writes there directly)
    try {
      const saved = JSON.parse(localStorage.getItem('fius-nomad-sub-models') || '{}');
      setNomadSelectedSubModels(saved);
    } catch {}
    console.log('Settings saved:', { preset, instructions, enabled, selectedModel, toggles, newAiOrder });
    setIsCustomizeModalOpen(false);
  };

  const handleNewProject = async () => {
    // Always clear Nomad + Imagine state for a fully fresh start
    setNomadMessages({});
    setNomadAutoMessages([]);
    setNomadSoloModel(null);
    setImagineMessages([]);

    try {
      const response = await authFetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chat',
          isProject: false,
          preset: currentPreset,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setCurrentProjectId(newProject.id);
        localStorage.setItem('currentProjectId', newProject.id);
        isHistoryLoad.current = true;
        setMessages([]);
        setProjects(prev => [newProject, ...prev]);
        setActiveTab('ask');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleProjectSelect_original = async (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
    // Load messages for this project
    await loadProjectMessages(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await authFetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(project => project.id !== id));
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          localStorage.removeItem('currentProjectId');
          isHistoryLoad.current = true;
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleEditProject = async (id: string, newTitle: string) => {
    try {
      const response = await authFetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, title: newTitle } : project
        ));
      }
    } catch (error) {
      console.error('Failed to edit project:', error);
    }
  };

  const handleUpdateAiRole = async (id: string, aiRole: string) => {
    try {
      const response = await authFetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiRole }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, aiRole } : project
        ));
        console.log('AI role updated successfully for project:', id);
      }
    } catch (error) {
      console.error('Failed to update AI role:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      endGuestSession();
      queryClient.setQueryData(["/api/auth/user"], null);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Reset settings to defaults on logout so the next user gets their own settings
      localStorage.removeItem('settingsToggles');
      setSettingsToggles(defaultSettingsToggles);
      setUser(null);
      onShowAuth();
    }
  };

  // Education modal handlers
  const handleStartExamination = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("examination");
    setQuizTitle(`Examination — ${data.class}${data.school ? ` · ${data.school}` : ''}`);
    setQuizQuestions([]);
    setQuizLoading(true);
    setIsQuizOpen(true);

    try {
      const response = await authFetch('/api/education/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examClass: data.class,
          school: data.school,
          country: data.country,
          educationSystem: data.educationSystem,
          topic: data.subject || '',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQuizQuestions(result.questions || []);
      } else {
        setIsQuizOpen(false);
      }
    } catch {
      setIsQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  // ── Template card: trigger imagine directly with photo + prompt ──────────────
  const triggerImagineTemplate = async (prompt: string, photo: {preview: string; base64: string} | null) => {
    const STYLE_SUFFIXES: Record<string, string> = {
      "Photorealistic": "photorealistic, ultra detailed, 8k resolution, sharp focus, hyperrealistic",
      "Anime": "anime art style, manga, japanese animation, studio ghibli inspired",
      "Oil Painting": "oil painting, classical art, rich textures, impasto, renaissance masterpiece",
      "3D Render": "3D CGI render, octane render, unreal engine 5, volumetric lighting, ray tracing",
      "Watercolor": "watercolor painting, soft washes, artistic, transparent pigments, paper texture",
      "Pixel Art": "pixel art, 8-bit retro style, game sprite, low resolution pixel",
      "Sketch": "pencil sketch, graphite drawing, hand drawn, fine lines, black and white",
      "Cinematic": "cinematic photography, movie still, anamorphic lens, dramatic lighting, film grain",
    };
    const styleSuffix = STYLE_SUFFIXES[imagineStyle] || imagineStyle.toLowerCase();
    const photoNote = photo ? ', apply this transformation to the uploaded reference photo, editing and transforming the actual image content' : '';
    const fullPrompt = `${prompt}${photoNote}, ${styleSuffix}`;

    const nowTs = Date.now();
    const userMsgId = nowTs.toString();
    const userDisplay = photo ? `🖼️ [Photo uploaded] ${prompt}` : prompt;

    const activeModels = imagineSelectedModels.size > 0
      ? STUDIO_COLS.filter(m => imagineSelectedModels.has(m.id))
      : [...STUDIO_COLS];
    const aiEntries = activeModels.map((m, i) => ({ id: (nowTs + 1 + i).toString(), modelId: m.id }));

    setImagineMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user' as const, content: userDisplay, imageUrl: photo?.preview },
      ...aiEntries.map(e => ({ id: e.id, role: 'ai' as const, content: '', isGenerating: true, modelId: e.modelId })),
    ]);
    if (photo) setImagineRefImage(photo);
    setInputValue('');
    setTimeout(() => { const el = imagineScrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 80);

    await Promise.all(aiEntries.map(async ({ id: aiMsgId, modelId }) => {
      let imageUrl = '';
      let fallbackUrls: string[] = [];
      let imageError = '';
      try {
        const res = await authFetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: fullPrompt,
            size: imagineOrientation === 'portrait' ? '1024x1792' : imagineOrientation === 'wide' ? '1365x1024' : '1024x1024',
            model: modelId,
            ...(photo ? { referenceImage: photo.base64 } : {}),
          }),
        });
        const data = await res.json();
        if (data.success && data.url) { imageUrl = data.url; fallbackUrls = data.fallbackUrls || []; }
        else imageError = data.message || 'Image generation failed — please try again.';
      } catch { imageError = 'Connection error — please try again.'; }
      setImagineMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, isGenerating: false, imageUrl, fallbackUrls, imageError, studioPrompt: fullPrompt } : m
      ));
    }));
    setTimeout(() => { const el = imagineScrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, 80);
  };

  // Direct message sending function
  const handleSendMessageDirect = async (messageContent: string) => {
    if (!messageContent.trim() || !currentProjectId) return;

    // Set the input value and trigger the regular send message function
    setInputValue(messageContent.trim());
    
    // Use setTimeout to ensure state is updated before sending
    setTimeout(async () => {
      await handleSendMessage();
    }, 50);
  };

  // Super fast AI enhancement 
  const handleEnhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;
    
    const originalValue = inputValue.trim();
    setIsEnhancing(true);
    
    // Show instant grammar fixes first
    let quickFixed = originalValue
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/g, 'I\'m')
      .replace(/\bdont\b/g, 'don\'t')
      .replace(/\bcant\b/g, 'can\'t')
      .replace(/^./, c => c.toUpperCase());
    
    setInputValue(quickFixed);
    
    // Fire AI enhancement without waiting (async)
    try {
      const response = await authFetch('/api/enhance-prompt', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt: originalValue }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInputValue(data.enhancedPrompt);
      }
    } catch (error) {
      console.log('Using quick fix fallback');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleStartSelfListen = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("self-listen");
    
    // Create a new conversation for self-listen
    const response = await authFetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Self Listen - ${data.heading}`,
        preset: 'fius-education',
        model: 'fius-education',
      }),
    });
    
    if (response.ok) {
      const newConversation = await response.json();
      setCurrentProjectId(newConversation.id);
      setSelectedModel('fius-education');
      setCurrentPreset('fius-education');
      
      // Start self-listen session
      const listenMessage = `I want to practice speaking about "${data.heading}". I have uploaded ${data.uploadedImages?.length || 0} related images. 

Please:
1. Ask me to explain the topic verbally
2. Listen to my explanation through voice input
3. Provide constructive feedback on my understanding
4. Correct any mistakes and suggest improvements
5. Help me learn better through interactive discussion

Let's start the self-listen session!`;
      
      await handleSendMessageDirect(listenMessage);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await authFetch('/api/conversations');
      if (response.ok) {
        const projectsData = await response.json();
        const projectsWithDates = projectsData.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        setProjects(projectsWithDates);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectMessages = async (projectId: string) => {
    try {
      const response = await authFetch(`/api/conversations/${projectId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        const messagesWithDates = messagesData.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }));
        // Pre-seed the animation cache so history messages show instantly (no re-animation)
        messagesWithDates.forEach((msg: any) => {
          if (msg.role === 'assistant') {
            globalCompletedTexts.current.set(msg.id, msg.content);
          }
        });
        isHistoryLoad.current = true;
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load project messages:', error);
      setMessages([]);
    }
  };



  // Refresh Ultimatum cards every time user switches to Fius Ultimatum tab
  useEffect(() => {
    if (nomadMode === 'auto') {
      setUltimatumCards(shuffleUltimatum(ULTIMATUM_CARD_POOL).slice(0, 2));
      // Scroll to top when switching to Ultimatum
      setTimeout(() => {
        if (nomadAutoScrollContainerRef.current) nomadAutoScrollContainerRef.current.scrollTop = 0;
      }, 50);
    }
  }, [nomadMode]);

  // Auto-scroll Nomad columns to bottom on new messages
  useEffect(() => {
    nomadScrollRefs.current.forEach((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }, [nomadMessages, nomadIsTyping]);

  // Check if any Nomad model is typing for thinking animation
  const isAnyNomadModelTyping = Object.values(nomadIsTyping).some(typing => typing);

  return (
    <TooltipProvider delayDuration={400}>
    <div
      className={`h-screen overflow-hidden flex flex-col bg-background relative transition-[padding] duration-300 ${isSidebarOpen && sidebarOpenMode === 'mini' ? 'md:pl-[76px]' : ''} ${(isTyping || isAnyNomadModelTyping || philosopherIsTyping) ? 'ai-thinking' : ''}`}
    >
      {/* Radial glow — center spread, empty state only */}
      {activeTab === 'ask' && messages.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-0" style={{
          background: getGlowGradient(glowAccentColor, resolvedTheme)
        }} />
      )}
      {isFreePlanExhausted && (
        <div
          className="absolute inset-0 z-[45] cursor-not-allowed"
          onClick={showUpgradeLockToast}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="absolute top-0 inset-x-0 flex justify-center pt-2 px-3">
            <div className="pointer-events-none text-[11px] sm:text-xs font-semibold text-white bg-destructive/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-center">
              Free plan limit reached — tap to upgrade to Fius Ultimate and continue
            </div>
          </div>
        </div>
      )}
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      <Sidebar
        isOpen={isSidebarOpen}
         openMode={sidebarOpenMode}
         onModeChange={setSidebarOpenMode}
         onClose={() => { setIsSidebarOpen(false); setSidebarOpenMode('mini'); }}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentProjectId || undefined}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleEditProject}
        onUpdateAiRole={handleUpdateAiRole}
        onSearchOpen={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsCustomizeModalOpen(true)}
         onVoiceClick={() => { setIsSidebarOpen(false); setSidebarOpenMode('mini'); openVoiceMode(); }}
         onImagineClick={() => { if (!(settingsToggles.tabsInSidebar ?? false)) { setIsSidebarOpen(false); setSidebarOpenMode('mini'); } changeTab('imagine'); }}
         onTabChange={(tab) => { if (!(settingsToggles.tabsInSidebar ?? false)) { setIsSidebarOpen(false); setSidebarOpenMode('mini'); } changeTab(tab as any); }}
         activeTab={activeTab}
         tabsInSidebar={settingsToggles.tabsInSidebar ?? false}
         askHasMessages={messages.length > 0}
         ownMode={ownMode}
         onToggleOwnMode={() => { if (ownMode) { setOwnMode(false); if (projects.length > 0) handleProjectSelect(projects[0].id); } else { setOwnMode(true); } }}
         resolvedTheme={resolvedTheme}
        user={user || undefined}
        onUserRename={(newName) => setUser(prev => prev ? { ...prev, username: newName, displayName: newName } : prev)}
        profilePicture={profilePicture || undefined}
        onProfilePictureChange={(dataUrl) => { setProfilePicture(dataUrl); localStorage.setItem('profilePicture', dataUrl); }}
        closeButtonPosition={settingsToggles.sidebarCloseTop ? 'top' : 'bottom'}
      />
      {/* Header */}
      <header className={`bg-card backdrop-blur-lg px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-5 mx-auto relative z-[46] rounded-full max-w-4xl w-fit mt-2 mb-1 ${(settingsToggles.glossyOutline ?? true) ? 'border border-border glossy-outline' : ''} ${(settingsToggles.tabsInSidebar ?? false) ? 'hidden' : ''}`}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setSidebarOpenMode('full'); setIsSidebarOpen(true); }}
                className="relative z-[46] text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
                data-testid="button-menu"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open Sidebar</TooltipContent>
          </Tooltip>
          {/* Logo icon — crossfade between Fius and Owl Mode */}
          <div style={{position:'relative',width:36,height:36,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:ownMode?0:1,transition:'opacity 0.35s ease'}}>
              <FiusLogo size="sm" className="text-black dark:text-foreground" />
            </div>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:ownMode?1:0,transition:'opacity 0.35s ease'}}>
              <img src={resolvedTheme==='dark'?'/incognito-dark.png':'/incognito-light.png'} alt="" className="h-7 w-7 object-contain" />
            </div>
          </div>
          {/* Name — crossfade */}
          <span className="font-semibold text-foreground text-sm sm:text-base" style={{position:'relative',display:'inline-block',minWidth:32}}>
            <span style={{opacity:ownMode?0:1,transition:'opacity 0.35s ease',position:'absolute',left:0,top:0,whiteSpace:'nowrap'}}>Fius</span>
            <span style={{opacity:ownMode?1:0,transition:'opacity 0.35s ease',whiteSpace:'nowrap'}}>Owl Mode</span>
          </span>
        </div>
        
        <div className="overflow-x-auto" style={{scrollbarWidth:'none'}}>
        <div ref={navContainerRef} className="relative flex items-center space-x-0.5 sm:space-x-1">
          {/* sliding active pill */}
          {pillStyle.ready && (
            <div aria-hidden style={{
              position: 'absolute',
              left: pillStyle.left,
              width: pillStyle.width,
              top: 2, bottom: 2,
              transition: 'left 0.48s cubic-bezier(0.34,1.56,0.64,1), width 0.48s cubic-bezier(0.34,1.56,0.64,1)',
              pointerEvents: 'none',
              zIndex: 0,
            }}>
              <div key={pillAnimateRef.current ? pillStyle.left : 'static'} style={{
                position: 'absolute', inset: 0,
                background: theme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.09)',
                borderRadius: 9999,
                boxShadow: theme === 'dark' ? '0 1px 10px rgba(255,255,255,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
                animation: pillAnimateRef.current ? 'pill-squish 0.48s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
              }} />
            </div>
          )}
          {!(settingsToggles.tabsInSidebar ?? false) && (<>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[0] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('ask')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'ask' ? 'font-semibold' : ''}`}
                style={activeTab === 'ask' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-ask"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-ask-dark.png' : '/tab-ask-light.png'} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                Ask
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat with Fius AI</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[1] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('nomad')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'nomad' ? 'font-semibold' : ''}`}
                style={activeTab === 'nomad' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-nomad"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-nomad-dark.png' : '/tab-nomad-light.png'} alt="" className="w-4 h-4 object-contain flex-shrink-0" />}
                Nomad
              </Button>
            </TooltipTrigger>
            <TooltipContent>Compare all AIs side by side</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[2] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('imagine')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'imagine' ? 'font-semibold' : ''}`}
                style={activeTab === 'imagine' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-imagine"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-imagine-dark.png' : '/tab-imagine-light.png'} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                Imagine Studio
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Image Generation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[3] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('philosopher')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'philosopher' ? 'font-semibold' : ''}`}
                style={activeTab === 'philosopher' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-philosopher"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-minds-dark.png' : '/tab-minds-light.png'} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                <span className="hidden sm:inline">Fius Minds</span>
                <span className="sm:hidden">Minds</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat with historical figures</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[4] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('fius-games')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'fius-games' ? 'font-semibold' : ''}`}
                style={activeTab === 'fius-games' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-fius-games"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-games-dark.png' : '/tab-games-light.png'} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                <span className="hidden sm:inline">Fius Games</span>
                <span className="sm:hidden">Games</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Play games with AI</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={el => { tabButtonRefs.current[5] = el; }}
                variant="ghost"
                size="sm"
                onClick={() => changeTab('fius-labs')}
                className={`relative z-10 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 rounded-2xl hover:bg-transparent active:bg-transparent text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === 'fius-labs' ? 'font-semibold' : ''}`}
                style={activeTab === 'fius-labs' ? {color: 'rgba(0,0,0,0.92)', transition: 'none'} : {transition: 'none'}}
                data-testid="tab-fius-labs"
              >
                {(settingsToggles.topbarTabIcons ?? true) && <img src={resolvedTheme === 'dark' ? '/tab-labs-dark.png' : '/tab-labs-light.png'} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                <span className="hidden sm:inline">Fius Labs</span>
                <span className="sm:hidden">Labs</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Multi-chat AI lab with personalized AI</TooltipContent>
          </Tooltip>
          </>)}
          {!(settingsToggles.tabsInSidebar ?? false) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (ownMode) {
                    setOwnMode(false);
                    if (projects.length > 0) handleProjectSelect(projects[0].id);
                  } else {
                    setOwnMode(true);
                  }
                }}
                className={`relative h-8 w-8 sm:h-10 sm:w-10 rounded-2xl border transition-all duration-300 ${ownMode ? 'border-zinc-500 bg-zinc-900 dark:bg-zinc-700 shadow-lg' : 'border-border hover:shadow-md'}`}
                data-testid="button-own-mode"
              >
                <img src={resolvedTheme === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="Own Mode" className={`h-4 w-4 object-contain transition-all duration-300 ${ownMode ? 'brightness-0 invert' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{ownMode ? 'Exit Owl Mode' : 'Owl Mode — chat without saving'}</TooltipContent>
          </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild className="ml-auto">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                className={`relative text-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-zinc-800' : theme === 'light' ? 'bg-yellow-50' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                data-testid="button-theme-toggle"
              >
                <div className="relative">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4 text-blue-400" />
                  ) : theme === 'light' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-foreground" />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'light' ? 'Switch to Dark' : theme === 'dark' ? 'Switch to System' : 'Switch to Light'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
                data-testid="button-notifications"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </div>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Animated gradient side strips */}
      {(chatBg === 'gradient' || chatBg === 'stars-gradient' || chatBg === 'rainbow' || chatBg === 'stars-rainbow') && activeTab === 'ask' && (() => {
        const isRainbow = chatBg === 'rainbow' || chatBg === 'stars-rainbow';
        const baseColor = 'rgba(59,130,246,0.55)';
        const animation = isRainbow
          ? 'gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite'
          : 'gradient-breathe 3.5s ease-in-out infinite';
        return (
          <>
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-0"
              style={{ width: '24%', background: `linear-gradient(to right, ${baseColor}, transparent)`, animation, animationDelay: isRainbow ? '0s, 0s' : '0s' }}
            />
            <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-0"
              style={{ width: '24%', background: `linear-gradient(to left, ${baseColor}, transparent)`, animation, animationDelay: isRainbow ? '0s, 0.5s' : '0s' }}
            />
          </>
        );
      })()}
      {/* Twinkling stars background */}
      {(chatBg === 'stars' || chatBg === 'stars-gradient' || chatBg === 'stars-rainbow') && activeTab === 'ask' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[
            {l:'5%',t:'8%',d:'0s',dur:'2.1s',dd:'0s',ddur:'9s'},{l:'15%',t:'22%',d:'0.4s',dur:'1.8s',dd:'1.2s',ddur:'11s'},
            {l:'28%',t:'6%',d:'0.8s',dur:'2.4s',dd:'0.5s',ddur:'8s'},{l:'42%',t:'35%',d:'0.2s',dur:'1.6s',dd:'2.1s',ddur:'13s'},
            {l:'55%',t:'12%',d:'1.1s',dur:'2.0s',dd:'0.8s',ddur:'10s'},{l:'68%',t:'28%',d:'0.6s',dur:'1.9s',dd:'1.7s',ddur:'7s'},
            {l:'78%',t:'5%',d:'0.3s',dur:'2.3s',dd:'0.3s',ddur:'12s'},{l:'88%',t:'18%',d:'0.9s',dur:'1.7s',dd:'2.4s',ddur:'9s'},
            {l:'10%',t:'45%',d:'1.3s',dur:'2.1s',dd:'1.0s',ddur:'11s'},{l:'23%',t:'55%',d:'0.5s',dur:'1.8s',dd:'0.2s',ddur:'8s'},
            {l:'37%',t:'65%',d:'0.7s',dur:'2.2s',dd:'1.8s',ddur:'14s'},{l:'50%',t:'48%',d:'1.0s',dur:'1.5s',dd:'0.6s',ddur:'10s'},
            {l:'63%',t:'70%',d:'0.2s',dur:'2.0s',dd:'2.2s',ddur:'9s'},{l:'75%',t:'52%',d:'1.4s',dur:'1.9s',dd:'0.9s',ddur:'12s'},
            {l:'85%',t:'40%',d:'0.6s',dur:'2.4s',dd:'1.4s',ddur:'7s'},{l:'92%',t:'60%',d:'0.3s',dur:'1.7s',dd:'0.1s',ddur:'11s'},
            {l:'7%',t:'75%',d:'1.2s',dur:'2.1s',dd:'2.0s',ddur:'8s'},{l:'18%',t:'82%',d:'0.8s',dur:'1.6s',dd:'0.7s',ddur:'13s'},
            {l:'32%',t:'88%',d:'0.4s',dur:'2.3s',dd:'1.5s',ddur:'10s'},{l:'47%',t:'78%',d:'1.1s',dur:'1.8s',dd:'0.4s',ddur:'9s'},
            {l:'60%',t:'85%',d:'0.7s',dur:'2.0s',dd:'1.9s',ddur:'11s'},{l:'72%',t:'90%',d:'0.1s',dur:'1.5s',dd:'0.6s',ddur:'8s'},
            {l:'82%',t:'75%',d:'0.9s',dur:'2.2s',dd:'2.3s',ddur:'12s'},{l:'94%',t:'82%',d:'0.5s',dur:'1.9s',dd:'1.1s',ddur:'9s'},
            {l:'3%',t:'55%',d:'1.5s',dur:'2.1s',dd:'0.3s',ddur:'10s'},{l:'48%',t:'20%',d:'0.3s',dur:'1.7s',dd:'1.6s',ddur:'14s'},
            {l:'90%',t:'35%',d:'1.0s',dur:'2.3s',dd:'0.8s',ddur:'8s'},{l:'35%',t:'42%',d:'0.6s',dur:'1.6s',dd:'2.0s',ddur:'11s'},
            {l:'20%',t:'68%',d:'1.3s',dur:'2.0s',dd:'0.5s',ddur:'9s'},{l:'70%',t:'15%',d:'0.4s',dur:'1.8s',dd:'1.3s',ddur:'13s'},
          ].map((s, i) => {
            const driftVariant = `star-drift-${(i % 4) + 1}`;
            return (
              <div key={i} className="absolute rounded-full bg-foreground"
                style={{
                  left: s.l, top: s.t,
                  width: i % 3 === 0 ? '2px' : '1.5px',
                  height: i % 3 === 0 ? '2px' : '1.5px',
                  animation: `twinkle ${s.dur} ease-in-out infinite, ${driftVariant} ${s.ddur} ease-in-out infinite`,
                  animationDelay: `${s.d}, ${s.dd}`,
                }}
              />
            );
          })}
        </div>
      )}
      {/* No gradient inside chat area — handled by fixed overlay below */}
      {activeTab === 'nomad' && settingsToggles.nomadGrid && (
        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10 bg-gradient-to-t from-background to-transparent" />
      )}
      <div
        className="absolute inset-0 overflow-hidden"
        data-testid="chat-messages"
        style={(activeTab === 'nomad' && settingsToggles.nomadGrid) || (activeTab === 'philosopher' && (settingsToggles.mindsGrid ?? true)) ? {
          backgroundImage: 'linear-gradient(rgba(128,128,128,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.1) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        } : undefined}
      >
        {/* Owl Mode star-field — always rendered when tab is ask; opacity transition handles enter/exit */}
        {activeTab === 'ask' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden"
               style={{zIndex:0, opacity: ownMode ? 1 : 0, transition:'opacity 0.45s cubic-bezier(0.4,0,0.2,1)'}}>
            {OWL_BG_DATA.map((o, i) => (
              <img key={i} src={resolvedTheme === 'dark' ? '/owl-dark.png' : '/owl-light.png'} alt=""
                style={{position:'absolute',left:o.l,top:o.t,width:o.sz,height:o.sz,
                  animation:`own-owl-twinkle ${o.dur} ease-in-out infinite, star-drift-${(i%4)+1} ${o.ddur} ease-in-out infinite`,
                  animationDelay:`${o.d}, ${o.dd}`,opacity:0}} />
            ))}
          </div>
        )}
        {activeTab === 'ask' ? (
          <div ref={chatScrollRef} className={`absolute inset-0 p-4 pb-56 ${messages.length === 0 ? 'overflow-y-hidden' : 'overflow-y-auto'}`} style={{zIndex:1}}>
          {/* Scroll to top/bottom buttons */}
          {messages.length > 2 && (
            <PCScrollButtons scrollAreaRef={chatScrollRef} />
          )}
          {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start min-h-full text-center pt-2 pb-12 max-w-4xl mx-auto" style={{transform:'translateX(15px)',transition:'transform 0.3s ease',position:'relative'}}>
            {/* Welcome screen — crossfade between Fius and Owl Mode */}
            <div style={settingsToggles.hideFiusLogo && settingsToggles.hideFlyWithUs
              ? {position:'absolute',bottom:'calc(50% + 68px)',left:'50%',transform:'translateX(-50%)',width:'100%',display:'flex',flexDirection:'column',alignItems:'center',transition:'all 0.3s ease'}
              : {position:'relative',width:'100%',display:'flex',flexDirection:'column',alignItems:'center',transition:'all 0.3s ease'}}>
              {/* Fius welcome */}
              <div style={{opacity:ownMode?0:1,transition:'opacity 0.4s ease',position:ownMode?'absolute':'relative',pointerEvents:ownMode?'none':'auto',display:'flex',flexDirection:'column',alignItems:'center',width:'100%',top:0}}>
                {!(settingsToggles.hideFiusLogo) && <FiusLogo size="2xl" className="mt-2 mb-6 text-black dark:text-foreground" ringColor={uiAccentColor || undefined} letterColor={uiAccentColor || undefined} />}
                <h2 className="text-3xl font-normal mb-1 text-foreground" style={{marginLeft: '-22px', ...(uiAccentColor ? { color: uiAccentColor } : {})}}>
                  {user?.displayName
                    ? WELCOME_GREETINGS[welcomeGreeting](user.displayName)
                    : 'Welcome to Fius'}
                </h2>
                {!(settingsToggles.hideFlyWithUs) && <p className="text-lg text-black dark:text-foreground mb-8" style={uiAccentColor ? { color: uiAccentColor } : {}}>Fly With Us!</p>}
              </div>
              {/* Owl Mode welcome */}
              <div style={{opacity:ownMode?1:0,transition:'opacity 0.4s ease',position:ownMode?'relative':'absolute',pointerEvents:ownMode?'auto':'none',display:'flex',flexDirection:'column',alignItems:'center',width:'100%',top:0}}>
                <img src={resolvedTheme==='dark'?'/incognito-dark.png':'/incognito-light.png'} alt="Owl Mode" className="own-mode-icon-pc mb-6 h-32 w-32 object-contain" />
                <h2 className="text-3xl font-bold mb-3 text-foreground">Welcome to Owl Mode</h2>
                <p className="text-lg text-muted-foreground mb-8">Continue!</p>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${message.id}`}
              >
                {message.role === 'user' ? (
                  <div className="group max-w-xs lg:max-w-md flex flex-col items-end">
                    <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 w-fit chat-bubble shadow-sm [overflow-wrap:anywhere]">
                      {/* Display uploaded image if present */}
                      {message.imageUrl && (
                        <div className="mb-3">
                          <img 
                            src={message.imageUrl} 
                            alt="Uploaded image" 
                            className="max-w-full h-auto rounded-lg shadow-sm border border-border cursor-zoom-in"
                            onClick={() => setFullscreenImg(message.imageUrl!)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                        {message.content.length > 250 && !expandedMsgIds.has(message.id) ? (
                          <p className="whitespace-pre-wrap break-words text-sm m-0">
                            {message.content.slice(0, 250).trim()}&hellip;
                            <button onClick={() => setExpandedMsgIds(p => new Set([...p, message.id]))}
                              className="ml-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                              ...
                            </button>
                          </p>
                        ) : (
                          <>
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({src, alt}) => {
                                  if (!src) return null;
                                  return (
                                    <img 
                                      src={src} 
                                      alt={alt || "Generated image"} 
                                      className="max-w-full h-auto rounded-lg my-2 shadow-sm border border-border" 
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {message.content.length > 250 && (
                              <button onClick={() => setExpandedMsgIds(p => { const n = new Set(p); n.delete(message.id); return n; })}
                                className="text-xs font-medium text-muted-foreground hover:text-foreground underline transition-colors">
                                Show less
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* User Message Action Buttons — below bubble, shown on hover */}
                    {(settingsToggles.showUserMsgActions ?? false) && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                                copiedMessageId === message.id 
                                  ? 'text-blue-500 hover:text-blue-600 bg-blue-100 dark:bg-blue-950' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              }`}
                              onClick={() => handleCopyMessage(message.content, message.id)}
                              data-testid={`button-copy-user-${message.id}`}
                            >
                              <img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-xl text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent transition-all duration-150"
                              onClick={() => {
                                setInputValue(message.content);
                                setTimeout(() => {
                                  const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
                                  if (inputElement) {
                                    inputElement.focus();
                                    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                                  }
                                }, 100);
                              }}
                              data-testid={`button-redo-user-${message.id}`}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit message</p></TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ) : (() => {
                  const lastAiMsgId = messages.reduce<string | undefined>((acc, m) => m.role !== 'user' ? m.id : acc, undefined);
                  const isLatestAi = message.id === lastAiMsgId;
                  // "being streamed" = this is the latest AI msg AND isTyping AND the last message in array is AI
                  // (if last msg is user, no AI response exists yet → don't block the previous completed AI msg)
                  const isBeingStreamed = isLatestAi && isTyping && messages[messages.length - 1]?.role !== 'user';
                  // Document-mode messages never mount TypingText, so they'd never fire
                  // onAnimationComplete — treat them as done immediately once the network call finishes.
                  const isDone = !isBeingStreamed;
                  const ab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                  return (
                    <div className="group flex space-x-3 max-w-4xl">
                      {(settingsToggles.showFiusLogo ?? true) && (
                        ownMode
                          ? <img src={resolvedTheme === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="Own Mode" className="flex-shrink-0 mt-1 h-9 w-9 object-contain" />
                          : <FiusLogo size="sm" className="flex-shrink-0 mt-1 text-black dark:text-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Bubble — relative for speak button */}
                        {message.metadata?.isDocument ? (
                          <div className="rounded-2xl px-4 py-3.5 chat-bubble border border-border bg-card flex items-center gap-3 max-w-sm">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">{message.metadata?.documentTitle || 'Document'}</p>
                              <p className="text-xs text-muted-foreground">Document ready</p>
                            </div>
                          </div>
                        ) : message.content.startsWith('__STOPPED_BY__') ? (
                          <div className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-red-500/10 border border-red-400/30">
                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-500 font-medium">
                              Response stopped by {message.content.replace('__STOPPED_BY__', '')}
                            </span>
                          </div>
                        ) : (
                        <div className={`rounded-3xl px-4 py-3 chat-bubble relative ${message.content.includes('```') ? 'bg-[#1e1e1e] border border-zinc-700 shadow-xl' : ''}`}>
                          {renderTypingText(message.content, message.id)}
                          {/* Source credits */}
                          {message.metadata?.webSources && message.metadata.webSources.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {(message.metadata.webSources as { title: string; url: string }[])
                                  .filter((s, i, a) => a.findIndex(x => x.url === s.url) === i)
                                  .slice(0, 5)
                                  .map((src, i) => (
                                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" title={src.title}
                                      className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-110 flex items-center justify-center shadow-sm">
                                      <img src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(src.url)}`} alt={src.title}
                                        className="w-5 h-5 rounded-sm"
                                        onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z'/%3E%3C/svg%3E"; }} />
                                    </a>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        )}
                        {/* Document mode — single Download button with a format picker */}
                        {message.metadata?.isDocument && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  disabled={docPdfExportingId === message.id || exportingMsgId === message.id + '-doc' || exportingMsgId === message.id + '-ppt'}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
                                  data-testid={`button-download-${message.id}`}
                                >
                                  {(docPdfExportingId === message.id || exportingMsgId === message.id + '-doc' || exportingMsgId === message.id + '-ppt')
                                    ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    : <Download className="w-3.5 h-3.5" />}
                                  Download
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px] z-[200]">
                                <DropdownMenuItem onClick={async () => { setDocPdfExportingId(message.id); try { await downloadPdf(message.content, message.metadata?.documentTitle || 'document'); } finally { setDocPdfExportingId(null); } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-red-500" /> PDF (.pdf)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadTxt(message.content, message.metadata?.documentTitle || 'document')}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-blue-500" /> Text (.txt)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(message.metadata?.documentTitle || 'document').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'document'}.md`; a.click(); URL.revokeObjectURL(a.href); }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-purple-500" /> Markdown (.md)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => { setExportingMsgId(message.id + '-doc'); try { await downloadWordDoc(message.content, message.metadata?.documentTitle || 'document'); } finally { setExportingMsgId(null); } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-blue-600" /> Word (.docx)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => { setExportingMsgId(message.id + '-ppt'); try { await downloadPptx(message.content, message.metadata?.documentTitle || 'document'); } finally { setExportingMsgId(null); } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-orange-500" /> PowerPoint (.pptx)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                        {/* Action row — only after done */}
                        {isDone && (
                          <div className="flex items-center gap-0.5 mt-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className={`${ab} ${likedMessages.has(message.id) ? 'text-green-500 bg-green-100 dark:bg-green-950' : ''}`}
                                  onClick={() => handleLikeMessage(message.id)} data-testid={`button-like-${message.id}`}>
                                  <img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.7 }} alt="like" />
                                  <img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Like</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className={`${ab} ${dislikedMessages.has(message.id) ? 'text-red-500 bg-red-50 dark:bg-red-950' : ''}`}
                                  onClick={() => handleDislikeMessage(message.id)} data-testid={`button-dislike-${message.id}`}>
                                  <img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.7 }} alt="dislike" />
                                  <img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Dislike</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className={`${ab} ${copiedMessageId === message.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : ''}`}
                                  onClick={() => handleCopyMessage(message.content, message.id)} data-testid={`button-copy-${message.id}`}>
                                  {copiedMessageId === message.id ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent>
                            </Tooltip>
                            {/* … more menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={ab}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[200px] z-[200]">
                                <DropdownMenuItem onClick={() => handleSpeakMessage(message.content, message.id)}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  {speakingMessageId === message.id ? <img src="/mute-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) hue-rotate(195deg) saturate(500%) brightness(1.2)' }} alt="stop" /> : <img src="/high-volume-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(86%) hue-rotate(228deg) saturate(500%) brightness(1.1)' }} alt="read aloud" />}
                                  {speakingMessageId === message.id ? 'Stop reading' : 'Read aloud'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRetryMessage(message.id)} disabled={retryingMessageId === message.id}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                                  {retryingMessageId === message.id ? <RefreshCw className="w-3.5 h-3.5 text-green-500 animate-spin" /> : <><img src="/icon-redo-black.png" className="w-3.5 h-3.5 object-contain block dark:hidden opacity-70" alt="redo" /><img src="/icon-redo-gray.png" className="w-3.5 h-3.5 object-contain hidden dark:block opacity-75" alt="redo" /></>} Regenerate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.txt'; a.click(); }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.md'; a.click(); }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-purple-500" /> Export as Markdown
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { const win = window.open('', '_blank'); if (!win) return; win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fius Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}pre{white-space:pre-wrap;word-break:break-word}</style></head><body><pre>${message.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`); win.document.close(); win.focus(); setTimeout(() => { win.print(); }, 500); }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <FileDown className="w-3.5 h-3.5 text-red-500" /> Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={exportingMsgId === message.id + '-doc'}
                                  onClick={async () => { setExportingMsgId(message.id + '-doc'); try { await downloadWordDoc(message.content); } finally { setExportingMsgId(null); } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                                  {exportingMsgId === message.id + '-doc' ? <svg className="w-3.5 h-3.5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : <FileDown className="w-3.5 h-3.5 text-blue-500" />}
                                  {exportingMsgId === message.id + '-doc' ? 'AI Formatting…' : 'Word Document (.docx)'}
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={exportingMsgId === message.id + '-ppt'}
                                  onClick={async () => { setExportingMsgId(message.id + '-ppt'); try { await downloadPptx(message.content); } finally { setExportingMsgId(null); } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                                  {exportingMsgId === message.id + '-ppt' ? <svg className="w-3.5 h-3.5 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : <FileDown className="w-3.5 h-3.5 text-orange-500" />}
                                  {exportingMsgId === message.id + '-ppt' ? 'AI Designing…' : 'PowerPoint (.pptx)'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChatInNewChat(message.content)}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                  <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-500" /> New chat from this
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                        {/* Follow-up suggestions — only for latest AI message after done */}
                        {isDone && isLatestAi && (
                          <PCFollowUpSuggestions msgContent={message.content} onSelect={(q) => setInputValue(q)} />
                        )}
                        {/* Disclaimer */}
                        {isDone && (
                          <p className="text-[9.5px] text-muted-foreground/35 mt-2 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
            
            {/* Thinking Indicator — logo inside expanding cloud */}
            {isTyping && (() => {
              const label = thinkingType === 'analyzing' ? 'Analyzing' : thinkingType === 'generating' ? 'Generating' : 'Thinking';
              // Bumpy-top cloud path in a 200×66 viewBox
              const cloudPath = "M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z";
              const W = 196, H = 66;
              return (
                <div className="flex justify-start mb-2" data-testid="typing-indicator">
                  <div
                    className="thinking-cloud-wrapper"
                    style={{ position: 'relative', width: W, height: H }}
                  >
                    {/* Cloud SVG background */}
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      width={W} height={H}
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      <path
                        d={cloudPath}
                        fill={resolvedTheme === 'dark' ? "rgba(22,22,28,0.82)" : "rgba(255,255,255,0.98)"}
                        stroke={resolvedTheme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(160,165,180,0.8)"}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Content — flex-centered over the cloud */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        paddingLeft: 10,
                        paddingRight: 18,
                        zIndex: 1,
                      }}
                    >
                      {(settingsToggles.showFiusLogo ?? true) && (
                        <FiusLogo size="sm" />
                      )}
                      <span className="thinking-label" style={resolvedTheme !== 'dark' ? {
                        background: 'linear-gradient(90deg, rgba(55,55,75,0.85) 0%, rgba(55,55,75,0.85) 38%, rgba(10,10,30,1) 50%, rgba(55,55,75,0.85) 62%, rgba(55,55,75,0.85) 100%)',
                        backgroundSize: '250% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'text-shimmer 1.8s linear infinite',
                        animationDelay: '0.7s',
                      } : undefined}>{label}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            <div ref={messagesEndRef} />
          </div>
        )}
          </div>
        ) : activeTab === 'nomad' ? (
          // Nomad Tab - Multi-AI Interface
          (() => {
            const getNomadName = (id: string, fallback: string) => nomadSelectedSubModels[id] || NOMAD_SUB_MODELS[id]?.default || fallback;
            const nomadConfigMap: {[key: string]: {name: string, logo: string, color: string, description: string}} = {
              'gpt-4o':           { name: getNomadName('gpt-4o', 'GPT-5 mini'),                  logo: '/chatgpt-logo.png',   color: '#10a37f', description: 'Advanced reasoning & multimodal AI by OpenAI' },
              'claude-3.5-sonnet':{ name: getNomadName('claude-3.5-sonnet', 'Claude Haiku 4.5'), logo: '/claude-logo.png',    color: '#f97316', description: 'Nuanced writing, analysis & coding by Anthropic' },
              'gemini-pro':       { name: getNomadName('gemini-pro', 'Gemini 3.5 Flash-Lite'),   logo: '/gemini-logo.png',    color: '#14b8a6', description: 'Google\'s multimodal reasoning model' },
              'perplexity':       { name: getNomadName('perplexity', 'Perplexity Sonar'),        logo: '/kimi-logo.png',      color: '#38bdf8', description: 'Real-time web search & cited answers' },
              'grok-4':           { name: getNomadName('grok-4', 'Grok Build 0.1'),              logo: '/grok-logo.png',      color: '#6b7280', description: 'xAI\'s witty, curious & unfiltered model' },
              'deepseek-r1':      { name: getNomadName('deepseek-r1', 'DeepSeek V4 Flash'),      logo: '/deepseek-logo.png',  color: '#3b82f6', description: 'Open-source reasoning & coding powerhouse' },
              'doubao':           { name: getNomadName('doubao', 'Doubao Seed 2.0 Mini'),        logo: '/bytedance-logo.png', color: '#f59e0b', description: 'ByteDance\'s multilingual smart assistant' },
              'kimi':             { name: getNomadName('kimi', 'Kimi K2.6'),                     logo: '/perplexity-logo.png',color: '#06b6d4', description: 'Moonshot\'s long-context language model' },
              'qwen':             { name: getNomadName('qwen', 'Qwen Flash'),                    logo: '/mistral-logo.png',   color: '#6366f1', description: 'Alibaba\'s multilingual language expert' },
              'llama-4':          { name: getNomadName('llama-4', 'Llama 4 Scout'),              logo: '/meta-ai-logo.png',   color: '#3b82f6', description: 'Meta\'s open-source frontier AI model' },
              'mistral':          { name: getNomadName('mistral', 'Ministral 3'),                logo: '/doubao-logo.png',    color: '#7c3aed', description: 'Fast & efficient European open AI' },
              'copilot':          { name: getNomadName('copilot', 'GPT-5 mini'),                 logo: '/copilot-logo.png',   color: '#0078d4', description: 'Microsoft\'s AI powered by OpenAI models' },
              'fius-ai':          { name: getNomadName('fius-ai', 'Fius Lite'),                  logo: '/fius-logo.png',      color: '#a855f7', description: 'Advanced reasoning, powered by Fius.' },
            };
            const hasMessages = Object.keys(nomadMessages).some(k => (nomadMessages[k] || []).length > 0);
            const modelSlug = (id: string) => {
              const slugMap: {[key: string]: string} = {
                'gpt-4o': 'chatgpt', 'claude-3.5-sonnet': 'claude', 'gemini-pro': 'gemini',
                'grok-4': 'grok', 'deepseek-r1': 'deepseek', 'fius-ai': 'fius',
                'doubao': 'doubao', 'kimi': 'kimi', 'qwen': 'qwen', 'llama-4': 'llama', 'mistral': 'mistral', 'copilot': 'copilot'
              };
              return slugMap[id] || id;
            };
            // Theme-aware filter
            const iconFilter = (id: string) => id === 'gpt-4o' ? 'brightness-0 dark:invert' : id === 'grok-4' ? 'brightness-0 dark:invert' : '';
            const nomadHasAIMessages = Object.values(nomadMessages).some(msgs => msgs.some(m => m.role === 'assistant'));
            return (
            /* h-full fills the absolute inset-0 parent and allows children to scroll */
            <div className="w-full h-full flex flex-col relative">
              {/* Nomad Summary Panel — slide in from right */}
              {nomadSummaryOpen && (
                <div className="absolute right-0 top-2 bottom-2 w-80 bg-card border border-border shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
                  style={{ animation: 'sheetEnter 0.3s cubic-bezier(0.23,1,0.32,1) both' }}>
                  <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-border">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Summary
                    </span>
                    <button onClick={() => setNomadSummaryOpen(false)} className="p-1.5 rounded-full hover:bg-accent transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
                    {nomadSummarizing ? (
                      <div className="flex flex-col items-center justify-center h-32 gap-3">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Analyzing AI responses…</span>
                      </div>
                    ) : (
                      <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{nomadSummary || 'Click Summarize to compare all AI responses.'}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="px-4 pt-2 pb-2 flex-shrink-0 relative">
                {/* Action buttons — absolutely pinned top-right so they don't affect centering */}
                <div className="absolute top-2 right-4 flex items-center gap-2 z-10">
                  {nomadHasAIMessages && nomadMode === 'multi' && (
                    <button onClick={handleNomadSummarize}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-card border border-border hover:bg-accent transition-all shadow-sm text-foreground">
                      <Sparkles className="w-3 h-3" /> Summarize
                    </button>
                  )}
                  <button onClick={() => setIsCustomizeModalOpen(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border hover:bg-accent transition-all shadow-sm">
                    <img src="/settings-icon.png" alt="Settings" className="btn-icon" style={{ width: '17px', height: '17px' }} />
                  </button>
                </div>
                {/* Heading — fully centred */}
                <h2 className="text-3xl font-bold text-foreground text-center mb-2 pt-1">Nomad</h2>
                {/* Combined sliding tab bar */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="relative flex items-center bg-secondary border border-border rounded-full p-1">
                    {/* Sliding pill — tracks whichever button is active */}
                    <div
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-500"
                      style={{
                        background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.09)',
                        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                        width: 'calc(50% - 4px)',
                        left: nomadMode === 'multi' ? '4px' : 'calc(50%)',
                      }}
                    />
                    <button
                      onClick={() => { if (nomadMode !== 'multi') playTabClick(); setNomadMode('multi'); }}
                      className={`relative z-10 w-52 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 ${nomadMode === 'multi' ? 'text-zinc-900 dark:text-zinc-900' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <img src="/nomad-multi-dark.png" alt="multi" className={`h-8 w-auto flex-shrink-0 object-contain ${nomadMode !== 'multi' && resolvedTheme === 'dark' ? 'invert' : ''}`} />
                      Multi Chat
                    </button>
                    <button
                      onClick={() => { if (nomadMode !== 'auto') playTabClick(); setNomadMode('auto'); }}
                      className={`relative z-10 w-52 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 ${nomadMode === 'auto' ? 'text-zinc-900 dark:text-zinc-900' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <img src="/nomad-auto-icon.png" alt="auto" className={`w-5 h-5 object-contain flex-shrink-0 ${nomadMode !== 'auto' && resolvedTheme === 'dark' ? 'invert' : ''}`} />
                      Fius Ultimatum
                    </button>
                  </div>
                  {nomadMode === 'auto' && nomadAutoMessages.length > 0 && (
                    <button onClick={() => setNomadAutoMessages([])}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border hover:text-foreground transition-all">
                      Clear
                    </button>
                  )}
                </div>

                {/* Solo mode: back button + other model pills */}
                {nomadSoloModel && (
                  <div className="flex gap-2 mb-4 items-center flex-wrap">
                    <button
                      onClick={() => setNomadSoloModel(null)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      ← All Models
                    </button>
                    {nomadModels.filter(m => m.id !== nomadSoloModel && activeAIModels.has(m.id)).map(m => {
                      const cfg = nomadConfigMap[m.id] || { name: m.name, logo: `/${m.id}-logo.png`, color: '#6b7280', description: '' };
                      return (
                        <button
                          key={m.id}
                          onClick={() => setNomadSoloModel(m.id)}
                          title={cfg.name}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-card hover:scale-110 transition-all overflow-hidden p-1"
                          style={{ borderColor: cfg.color }}
                        >
                          <img
                            src={cfg.logo}
                            alt={cfg.name}
                            className={`w-full h-full object-contain ${iconFilter(m.id)}`}
                            onError={(e) => { e.currentTarget.style.display='none'; }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* === AUTO MODE TAB (full chat UI) === */}
              {nomadMode === 'auto' && (
                <div ref={nomadAutoScrollContainerRef} className={`flex-1 min-h-0 px-4 pt-4 pb-52 ${nomadAutoMessages.length === 0 && !nomadAutoLoading ? 'overflow-y-hidden' : 'overflow-y-auto'}`} style={{ scrollbarWidth: 'thin' }}>
                  {nomadAutoMessages.length === 0 && !nomadAutoLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[60%] gap-4 text-center py-10">
                      <div className="w-32 h-32 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#000000,#ffffff)' }}>
                        <img src="/nomad-auto-icon.png" alt="auto" className="w-24 h-24 object-contain" style={{ filter: 'invert(1)' }} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Fius Ultimatum</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">Fius picks the best AI for your prompt — coding, writing, math, search, and more.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
                        {ultimatumCards.slice(0, 2).map(c => (
                          <div
                            key={c.label}
                            onClick={() => setInputValue(c.prompt)}
                            className="group relative rounded-xl border border-border bg-card p-3 text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                            style={{ borderTop: `2px solid ${c.color}` }}
                          >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-200 rounded-xl" style={{ background: c.color }} />
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 flex-shrink-0" style={{ background: c.color + '15' }}>
                              <c.Icon size={15} style={{ color: c.color }} strokeWidth={1.8} />
                            </div>
                            <p className="text-xs font-bold text-foreground mb-0.5 leading-tight">{c.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-snug mb-2">{c.prompt}</p>
                            <div className="flex items-center gap-1">
                              <img src={c.modelLogo} alt={c.modelName} className="w-3 h-3 object-contain rounded-full flex-shrink-0" onError={e => { e.currentTarget.style.display='none'; }} />
                              <span className="text-[9px] font-semibold text-muted-foreground">{c.modelName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-6 max-w-3xl mx-auto">
                    {(() => {
                      const nab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                      const lastAutoAiId = [...nomadAutoMessages].reverse().find(m => m.role === 'assistant')?.id;
                      return nomadAutoMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'user' ? (
                          <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 max-w-sm lg:max-w-lg chat-bubble shadow-sm [overflow-wrap:anywhere]">
                            <p className="text-sm text-foreground">{msg.content}</p>
                            <div className="flex items-center justify-end mt-2">
                              <div className="flex space-x-2">
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-xl transition-all duration-300 ${copiedMessageId === msg.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} onClick={() => handleCopyMessage(msg.content, msg.id)}>
                                    <img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-xl text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent transition-all duration-150" onClick={() => { setInputValue(msg.content); setTimeout(() => { const el = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 100); }}>
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Edit message</p></TooltipContent></Tooltip>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 max-w-2xl">
                            {msg.content ? (
                              <>
                                {msg.pickedModel && (
                                  <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                    <img src={msg.pickedModel.logo} alt={msg.pickedModel.modelName} className="w-4 h-4 object-contain rounded-full flex-shrink-0" onError={e => { e.currentTarget.style.display='none'; }} />
                                    <span className="text-[10px] font-semibold text-muted-foreground">{msg.pickedModel.modelName}</span>
                                  </div>
                                )}
                                <div className={`rounded-3xl px-4 py-3 chat-bubble relative ${msg.content.includes('```') ? 'bg-[#1e1e1e] border border-zinc-700 shadow-xl' : ''}`}>
                                  <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                                    {renderTypingText(msg.content, msg.id)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 mt-1">
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${nab} ${likedMessages.has(msg.id) ? 'text-green-500 bg-green-100 dark:bg-green-950' : ''}`} onClick={() => handleLikeMessage(msg.id)}>
                                      <img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden" style={likedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.7 }} alt="like" /><img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={likedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${nab} ${dislikedMessages.has(msg.id) ? 'text-red-500 bg-red-50 dark:bg-red-950' : ''}`} onClick={() => handleDislikeMessage(msg.id)}>
                                      <img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden" style={dislikedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.7 }} alt="dislike" /><img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={dislikedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Dislike</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${nab} ${copiedMessageId === msg.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : ''}`} onClick={() => handleCopyMessage(msg.content, msg.id)}>
                                      {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className={nab}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[200px] z-[200]">
                                      <DropdownMenuItem onClick={() => handleSpeakMessage(msg.content, msg.id)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        {speakingMessageId === msg.id ? <img src="/mute-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) hue-rotate(195deg) saturate(500%) brightness(1.2)' }} alt="stop" /> : <img src="/high-volume-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(86%) hue-rotate(228deg) saturate(500%) brightness(1.1)' }} alt="read aloud" />}
                                        {speakingMessageId === msg.id ? 'Stop reading' : 'Read aloud'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.txt'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.md'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <FileDown className="w-3.5 h-3.5 text-purple-500" /> Export as Markdown
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleChatInNewChat(msg.content)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-500" /> New chat from this
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                {msg.id === lastAutoAiId && (
                                  <PCFollowUpSuggestions msgContent={msg.content} onSelect={(q) => setInputValue(q)} />
                                )}
                                <p className="text-[9.5px] text-muted-foreground/35 mt-2 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
                              </>
                            ) : (
                              (() => {
                                const cloudPath = "M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z";
                                const W = 196, H = 66;
                                return (
                                  <div className="thinking-cloud-wrapper" style={{ position: 'relative', width: W, height: H }}>
                                    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
                                      <path d={cloudPath} fill={resolvedTheme === 'dark' ? "rgba(22,22,28,0.82)" : "rgba(255,255,255,0.98)"} stroke={resolvedTheme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(160,165,180,0.8)"} strokeWidth="1.5" strokeLinejoin="round" />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: 14, paddingRight: 18, zIndex: 1 }}>
                                      <span className="thinking-label" style={resolvedTheme !== 'dark' ? { background: 'linear-gradient(90deg,rgba(55,55,75,0.85) 0%,rgba(55,55,75,0.85) 38%,rgba(10,10,30,1) 50%,rgba(55,55,75,0.85) 62%,rgba(55,55,75,0.85) 100%)', backgroundSize: '250% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'text-shimmer 1.8s linear infinite', animationDelay: '0.7s' } : undefined}>Thinking</span>
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>
                      ));
                    })()}
                    <div ref={nomadAutoEndRef} />
                  </div>
                </div>
              )}

              {/* === MULTI-MODEL COLUMN LAYOUT === */}
              {nomadMode === 'multi' && !nomadSoloModel && (
                <>
                <motion.div layoutScroll ref={nomadColsRef} onScroll={updateNomadThumb} className="nomad-hscroll flex flex-nowrap flex-1 min-h-0 overflow-x-auto" style={{ alignItems: 'stretch' }}>
                  {[...nomadModels.filter(m => activeAIModels.has(m.id)), ...nomadModels.filter(m => !activeAIModels.has(m.id))].map((modelObj, idx, sortedArr) => {
                    const model = modelObj.id;
                    const config = nomadConfigMap[model] || { name: model, logo: `/${model}-logo.png`, color: '#6b7280', description: '' };
                    const isActive = activeAIModels.has(model);
                    const msgs = nomadMessages[model] || [];
                    const isLast = idx === sortedArr.length - 1;
                    return (
                      <motion.div key={model} layout transition={{ type: 'tween', duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }} className="flex-shrink-0 flex items-stretch" style={{ height: '100%', zIndex: openNomadModelDropdown === model ? 9999 : 'auto', position: 'relative' }}>
                        {/* Column */}
                        <div className="flex-shrink-0 flex flex-col" style={{ width: 390, height: '100%', paddingLeft: 10, paddingRight: 10, opacity: isActive ? 1 : 0.45, transform: isActive ? 'scale(1)' : 'scale(0.97)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
                          {/* Toggle card — horizontal */}
                          {(() => {
                            const subModels = NOMAD_SUB_MODELS[model];
                            const isDropdownOpen = openNomadModelDropdown === model;
                            const selSubModel = nomadSelectedSubModels[model] || subModels?.default;

                            const toggleSwitch = (
                              <button
                                onClick={() => {
                                  if (!isActive && isNomadModelLocked(model)) {
                                    toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" });
                                    return;
                                  }
                                  const newActive = new Set(activeAIModels);
                                  if (newActive.has(model)) {
                                    newActive.delete(model);
                                    setNomadMessages(prev => { const updated = { ...prev }; delete updated[model]; return updated; });
                                    // Show top-right notification
                                    const notifLabel = config.name;
                                    const notifColor = model === 'fius-ai' ? '#374151' : config.color;
                                    if (nomadNotifTimer.current) clearTimeout(nomadNotifTimer.current);
                                    setNomadDisabledNotif({ label: notifLabel, color: notifColor });
                                    nomadNotifTimer.current = setTimeout(() => setNomadDisabledNotif(null), 1500);
                                  } else { newActive.add(model); }
                                  setActiveAIModels(newActive);
                                  // Order stays fixed — no reordering on toggle
                                }}
                                className="relative rounded-full transition-all duration-300 flex-shrink-0"
                                style={isActive ? { background: model === 'fius-ai' ? 'linear-gradient(135deg, #ffffff, #374151)' : config.color, width: 36, height: 18 } : { width: 36, height: 18, background: 'rgb(209 213 219)' }}
                              >
                                <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${isActive ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                              </button>
                            );

                            /* ── Model name trigger — click anywhere to open switcher ── */
                            // Font size based only on the currently displayed name length
                            const displayName = selSubModel || config.name;
                            const displayLen = displayName.length;
                            const subNameFs = displayLen <= 12 ? 12 : displayLen <= 18 ? 10.5 : displayLen <= 24 ? 9.5 : 8.5;
                            const nameTrigger = subModels ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenNomadModelDropdown(isDropdownOpen ? null : model); }}
                                className="flex items-center gap-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-full px-1.5 py-0.5 text-left min-w-0"
                              >
                                <span className="font-bold text-foreground leading-tight truncate" style={{ fontSize: subNameFs }}>{displayName}</span>
                                <ChevronDown className={`w-3 h-3 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                            ) : (
                              <span className="font-bold text-foreground leading-tight truncate" style={{ fontSize: subNameFs }}>{displayName}</span>
                            );

                            /* ── Dropdown — same look as Ask tab SelectContent ── */
                            const saveSubModel = (sm: string) => {
                              setNomadSelectedSubModels(prev => {
                                const n = { ...prev, [model]: sm };
                                try { localStorage.setItem('fius-nomad-sub-models', JSON.stringify(n)); } catch {}
                                return n;
                              });
                              setOpenNomadModelDropdown(null);
                            };

                            const modelDropdown = subModels && isDropdownOpen ? (
                              <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-[#383838] rounded-xl shadow-2xl overflow-hidden py-1" style={{ border: 'none', minWidth: 160, width: 'max-content', maxWidth: 220 }}>
                                {/* Normal Models */}
                                <div className="px-3 pt-2 pb-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Normal Models</span>
                                </div>
                                {subModels.normal.map(sm => {
                                  const isSel = selSubModel === sm;
                                  return (
                                    <button key={sm} onClick={() => saveSubModel(sm)}
                                      className={`flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all rounded-full mx-1 hover:bg-black/10 dark:hover:bg-white/10 ${isSel ? 'text-black dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSel ? 'bg-zinc-700 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                                      <span className="flex-1">{sm}</span>
                                      {sm === subModels.default && !isSel && <span className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded-full px-1.5 py-0.5 flex-shrink-0">default</span>}
                                    </button>
                                  );
                                })}
                                {/* Flagship Models */}
                                <div className="px-3 pb-0.5 mt-1">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-500">Flagship</span>
                                </div>
                                {subModels.flagship.map(sm => {
                                  const isSel = selSubModel === sm;
                                  return (
                                    <button key={sm} onClick={() => saveSubModel(sm)}
                                      className={`flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all rounded-full mx-1 hover:bg-black/10 dark:hover:bg-white/10 ${isSel ? 'text-black dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSel ? 'bg-amber-500' : 'bg-amber-300 dark:bg-amber-700'}`} />
                                      <span className="flex-1">{sm}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null;

                            const cardInner = (logoEl: React.ReactNode) => (
                              <div className="flex flex-row items-center gap-3 px-3.5 py-3">
                                {logoEl}
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-1 min-w-0">
                                    {nameTrigger}
                                    {subModels && subModels.flagship.includes(selSubModel || '') && (
                                      <Tooltip><TooltipTrigger asChild>
                                        <span className="cursor-help flex-shrink-0" style={{ display:'inline-block', width:16, height:16, WebkitMaskImage:'url(/creativity-icon.png)', WebkitMaskSize:'contain', WebkitMaskRepeat:'no-repeat', maskImage:'url(/creativity-icon.png)', maskSize:'contain', maskRepeat:'no-repeat', background: model === 'fius-ai' ? 'linear-gradient(135deg, #ffffff, #374151)' : config.color }} />
                                      </TooltipTrigger><TooltipContent side="bottom" align="center" className="z-[9999]">Flagship Model</TooltipContent></Tooltip>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground leading-tight">{config.description}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {toggleSwitch}
                                  {!isActive && isNomadModelLocked(model) && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                                  <Tooltip><TooltipTrigger asChild>
                                    <button onClick={() => setNomadSoloModel(model)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent transition-all" style={{ color: model === 'fius-ai' ? '#374151' : config.color }}>
                                      <Target className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Chat only with {config.name}</p></TooltipContent></Tooltip>
                                </div>
                              </div>
                            );

                            return model === 'fius-ai' ? (
                              <div className="relative mx-3 mt-2 mb-2">
                                <div className="p-[2px] rounded-full transition-all duration-300" style={{ background: resolvedTheme === 'dark' ? 'linear-gradient(135deg,#ffffff 0%,#000000 100%)' : 'linear-gradient(135deg,#000000 0%,#ffffff 100%)' }}>
                                  <div className="rounded-full bg-card">
                                    {cardInner(
                                      <div className="flex items-center justify-center flex-shrink-0">
                                        <FiusLogo size="sm" scaleWhenCurrent="scale(1.65) translateY(3px)" className={resolvedTheme === 'dark' ? 'text-white' : 'text-black'} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {modelDropdown}
                              </div>
                            ) : (
                              <div className="relative mx-3 mt-2 mb-2">
                                <div className="rounded-full border-2 transition-all duration-300 bg-card" style={{ borderColor: isActive ? config.color : 'rgba(128,128,128,0.25)' }}>
                                  {cardInner(
                                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                      <img src={config.logo} alt={config.name} className={`w-10 h-10 object-contain ${iconFilter(model)}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                  )}
                                </div>
                                {modelDropdown}
                              </div>
                            );
                          })()}

                          {/* Messages */}
                          <div
                            ref={(el) => { if (el) nomadScrollRefs.current.set(model, el); }}
                            className="mx-2 flex flex-col space-y-6 pb-52 overflow-y-auto flex-1 min-h-0"
                            style={{ minHeight: 60 }}
                          >
                            {(() => {
                              const mcab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                              const lastColAiId = [...msgs].reverse().find(m => m.role === 'assistant')?.id;
                              return msgs.map(message => (
                              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.role === 'user' ? (
                                  <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 text-sm max-w-[85%] chat-bubble shadow-sm [overflow-wrap:anywhere]">
                                    <p className="text-foreground">{message.content}</p>
                                    <div className="flex items-center justify-end mt-2">
                                      <div className="flex space-x-1">
                                        <Tooltip><TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-xl transition-all duration-300 ${copiedMessageId === message.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} onClick={() => handleCopyMessage(message.content, message.id)}>
                                            <img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" />
                                          </Button>
                                        </TooltipTrigger><TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-xl text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent transition-all duration-150" onClick={() => { setInputValue(message.content); setTimeout(() => { const el = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 100); }}>
                                            <RefreshCw className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger><TooltipContent><p>Edit message</p></TooltipContent></Tooltip>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="max-w-[90%]">
                                    <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                      <img src={config.logo} alt={config.name} className={`w-4 h-4 object-contain rounded-full flex-shrink-0 ${iconFilter(model)}`} onError={e => { e.currentTarget.style.display='none'; }} />
                                      <span className="text-[10px] font-semibold text-muted-foreground">{config.name}</span>
                                    </div>
                                    <div className={`rounded-3xl px-4 py-3 chat-bubble relative ${message.content.includes('```') ? 'bg-[#1e1e1e] border border-zinc-700 shadow-xl' : ''}`}>
                                      <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert break-words leading-relaxed">
                                        {renderTypingText(message.content, message.id)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-1">
                                      <Tooltip><TooltipTrigger asChild>
                                        <button className={`${mcab} ${likedMessages.has(message.id) ? 'text-green-500 bg-green-100 dark:bg-green-950' : ''}`} onClick={() => handleLikeMessage(message.id)}>
                                          <img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.7 }} alt="like" /><img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
                                        </button>
                                      </TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                                      <Tooltip><TooltipTrigger asChild>
                                        <button className={`${mcab} ${dislikedMessages.has(message.id) ? 'text-red-500 bg-red-50 dark:bg-red-950' : ''}`} onClick={() => handleDislikeMessage(message.id)}>
                                          <img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.7 }} alt="dislike" /><img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
                                        </button>
                                      </TooltipTrigger><TooltipContent><p>Dislike</p></TooltipContent></Tooltip>
                                      <Tooltip><TooltipTrigger asChild>
                                        <button className={`${mcab} ${copiedMessageId === message.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : ''}`} onClick={() => handleCopyMessage(message.content, message.id)}>
                                          {copiedMessageId === message.id ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                        </button>
                                      </TooltipTrigger><TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className={mcab}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[200px] z-[200]">
                                          <DropdownMenuItem onClick={() => handleSpeakMessage(message.content, message.id)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                            {speakingMessageId === message.id ? <img src="/mute-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) hue-rotate(195deg) saturate(500%) brightness(1.2)' }} alt="stop" /> : <img src="/high-volume-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(86%) hue-rotate(228deg) saturate(500%) brightness(1.1)' }} alt="aloud" />}
                                            {speakingMessageId === message.id ? 'Stop reading' : 'Read aloud'}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.txt'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                            <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleChatInNewChat(message.content)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                            <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-500" /> New chat from this
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    {message.id === lastColAiId && (
                                      <p className="text-[9.5px] text-muted-foreground/35 mt-1.5 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              ));
                            })()}
                            {nomadIsTyping[model] && (
                              <div className="flex items-start space-x-2">
                                {(() => {
                                  const cloudPath = "M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z";
                                  const W = 196, H = 66;
                                  return (
                                    <div className="thinking-cloud-wrapper" style={{ position: 'relative', width: W, height: H }}>
                                      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
                                        <path d={cloudPath} fill={resolvedTheme === 'dark' ? "rgba(22,22,28,0.82)" : "rgba(255,255,255,0.98)"} stroke={resolvedTheme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(160,165,180,0.8)"} strokeWidth="1.5" strokeLinejoin="round" />
                                      </svg>
                                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: 14, paddingRight: 18, zIndex: 1 }}>
                                        <span className="thinking-label" style={resolvedTheme !== 'dark' ? { background: 'linear-gradient(90deg,rgba(55,55,75,0.85) 0%,rgba(55,55,75,0.85) 38%,rgba(10,10,30,1) 50%,rgba(55,55,75,0.85) 62%,rgba(55,55,75,0.85) 100%)', backgroundSize: '250% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'text-shimmer 1.8s linear infinite', animationDelay: '0.7s' } : undefined}>Thinking</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        {!isLast && (
                          <div className="flex-shrink-0 w-[2.5px] rounded-full" style={{ background: 'rgba(128,128,128,0.35)', alignSelf: 'stretch', margin: '16px 0' }} />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
                </>
              )}

              {/* === SOLO MODE === */}
              {nomadMode === 'multi' && nomadSoloModel && (() => {
                const model = nomadSoloModel;
                const config = nomadConfigMap[model] || { name: model, logo: `/${model}-logo.png`, color: '#6b7280', description: '' };
                const msgs = nomadMessages[model] || [];
                return (
                  <div className="flex-1 px-4 pb-4 flex flex-col">
                    {/* Messages — same layout as Ask tab */}
                    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
                      {(() => {
                        const sab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                        const lastSoloAiId = [...msgs].reverse().find(m => m.role === 'assistant')?.id;
                        return msgs.map(message => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'user' ? (
                            /* User bubble — same style as Ask tab */
                            <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 max-w-xs lg:max-w-md chat-bubble shadow-sm [overflow-wrap:anywhere]">
                              <p className="text-sm text-foreground">{message.content}</p>
                              <div className="flex items-center justify-end mt-2">
                                <div className="flex space-x-2">
                                  <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-xl transition-all duration-300 ${copiedMessageId === message.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} onClick={() => handleCopyMessage(message.content, message.id)}>
                                      <img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" />
                                    </Button>
                                  </TooltipTrigger><TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-xl text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent transition-all duration-150" onClick={() => { setInputValue(message.content); setTimeout(() => { const el = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 100); }}>
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger><TooltipContent><p>Edit message</p></TooltipContent></Tooltip>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* AI response — same style as Ask tab */
                            <div className="flex max-w-4xl w-full">
                              <div className="flex-1">
                                <div className={`rounded-3xl px-4 py-3 chat-bubble relative ${message.content.includes('```') ? 'bg-[#1e1e1e] border border-zinc-700 shadow-xl' : ''}`}>
                                  <div className="text-foreground prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                                     {renderTypingText(message.content, message.id)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 mt-1">
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${sab} ${likedMessages.has(message.id) ? 'text-green-500 bg-green-100 dark:bg-green-950' : ''}`} onClick={() => handleLikeMessage(message.id)}>
                                      <img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.7 }} alt="like" /><img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={likedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${sab} ${dislikedMessages.has(message.id) ? 'text-red-500 bg-red-50 dark:bg-red-950' : ''}`} onClick={() => handleDislikeMessage(message.id)}>
                                      <img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.7 }} alt="dislike" /><img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={dislikedMessages.has(message.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Dislike</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${sab} ${copiedMessageId === message.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : ''}`} onClick={() => handleCopyMessage(message.content, message.id)}>
                                      {copiedMessageId === message.id ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>{copiedMessageId === message.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className={sab}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[200px] z-[200]">
                                      <DropdownMenuItem onClick={() => handleSpeakMessage(message.content, message.id)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        {speakingMessageId === message.id ? <img src="/mute-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) hue-rotate(195deg) saturate(500%) brightness(1.2)' }} alt="stop" /> : <img src="/high-volume-icon.png" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(86%) hue-rotate(228deg) saturate(500%) brightness(1.1)' }} alt="aloud" />}
                                        {speakingMessageId === message.id ? 'Stop reading' : 'Read aloud'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.txt'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { const blob = new Blob([message.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.md'; a.click(); }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <FileDown className="w-3.5 h-3.5 text-purple-500" /> Export as Markdown
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleChatInNewChat(message.content)} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-500" /> New chat from this
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                {message.id === lastSoloAiId && (
                                  <PCFollowUpSuggestions msgContent={message.content} onSelect={(q) => setInputValue(q)} />
                                )}
                                <p className="text-[9.5px] text-muted-foreground/35 mt-2 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
                              </div>
                            </div>
                          )}
                        </div>
                        ));
                      })()}
                      {/* Typing indicator — cloud style matching Ask tab */}
                      {nomadIsTyping[model] && (
                        <div className="flex justify-start mb-2">
                          <div className="thinking-cloud-wrapper" style={{ position: 'relative', width: 196, height: 66 }}>
                            <svg viewBox="0 0 196 66" width={196} height={66} style={{ position: 'absolute', top: 0, left: 0 }}>
                              <path d="M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z" fill={resolvedTheme === 'dark' ? "rgba(22,22,28,0.82)" : "rgba(255,255,255,0.98)"} stroke={resolvedTheme === 'dark' ? "rgba(255,255,255,0.12)" : "rgba(160,165,180,0.8)"} strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: 10, paddingRight: 18, zIndex: 1 }}>
                              {model === 'fius-ai' ? <FiusLogo size="sm" /> : <img src={config.logo} alt={config.name} className={`w-4 h-4 object-contain ${iconFilter(model)}`} onError={e => { e.currentTarget.style.display='none'; }} />}
                              <span className="thinking-label" style={resolvedTheme !== 'dark' ? { background: 'linear-gradient(90deg,rgba(55,55,75,0.85) 0%,rgba(55,55,75,0.85) 38%,rgba(10,10,30,1) 50%,rgba(55,55,75,0.85) 62%,rgba(55,55,75,0.85) 100%)', backgroundSize: '250% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'text-shimmer 1.8s linear infinite', animationDelay: '0.7s' } : undefined}>Thinking</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Custom always-visible horizontal scrollbar (absolute, never clipped) ── */}
              {nomadMode === 'multi' && !nomadSoloModel && (
                <div style={{ position: 'absolute', bottom: 8, left: 20, right: 20, height: 6, zIndex: 30, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: resolvedTheme === 'dark' ? '#1c1c1c' : '#dcdcdc' }} />
                  <div ref={nomadThumbRef} style={{
                    position: 'absolute', top: 0, bottom: 0, borderRadius: 999,
                    left: '0%', width: '100%',
                    background: resolvedTheme === 'dark' ? '#444444' : '#a0a0a0',
                  }} />
                </div>
              )}
            </div>
            );
          })()
        ) : activeTab === 'imagine' ? (
          // ── Imagine Studio home ───────────────────────────────────────────────
          (() => {
            if (imagineMessages.length === 0) {
              const studioGallery = imagineMyPhotos;
              return (
                <>
                  {/* ── Fully scrollable studio page ── */}
                  <div className="absolute inset-0 overflow-y-auto bg-background text-foreground" style={{ scrollbarWidth: 'thin' }}>
                    <div className="relative min-h-full overflow-hidden px-5 pb-36">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[350px] overflow-hidden">
                        <img src={studioHero} alt="" className="h-full w-full object-cover object-top" />
                        {/* bottom fade */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 65%, var(--background) 100%)' }} />
                        {/* top fade */}
                        <div className="absolute inset-x-0 top-0" style={{ height: '23%', background: 'linear-gradient(to bottom, var(--background), transparent)' }} />
                        {/* left fade */}
                        <div className="absolute inset-y-0 left-0" style={{ width: '7%', background: 'linear-gradient(to right, var(--background) 0%, var(--background) 40%, transparent 100%)' }} />
                        {/* right fade */}
                        <div className="absolute inset-y-0 right-0" style={{ width: '7%', background: 'linear-gradient(to left, var(--background) 0%, var(--background) 40%, transparent 100%)' }} />
                      </div>

                      <div className="relative mx-auto w-full max-w-[1180px] pt-6">
                        <div className="mx-auto mt-[260px] flex max-w-[480px] flex-col items-center text-center">
                          <h2 className="tracking-[-0.055em] text-foreground" style={{ fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.1, fontWeight: 1000, WebkitTextStroke: '0.6px currentColor' }}>
                            <span style={{ fontWeight: 1000 }}>Fius Labs</span>{' '}
                            <span style={{ fontWeight: 1000 }}>Imagine Studio</span>
                          </h2>
                          <p className="mt-2 font-medium text-muted-foreground" style={{ fontSize: 'clamp(15px,1.6vw,18px)' }}>The Canvas of Tomorrow</p>
                        </div>

                        {/* ── Inline message bar — full width outside narrow heading container ── */}
                        <div className="mt-8 mb-4 w-full flex flex-col items-center">
                            {attachedImages.length > 0 && (
                              <div className="mb-2 rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden mx-auto" style={{ maxWidth: 'calc(2 * 80px + 8px + 20px)' }}>
                                <div ref={attachTrayRef} className="flex gap-2 overflow-x-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                                  {attachedImages.map((img, i) => (
                                    <div key={i} className="relative flex-shrink-0 group">
                                      <img src={img.preview} alt={`Attached ${i + 1}`}
                                        className="h-20 w-20 object-cover rounded-xl border border-zinc-300 cursor-zoom-in shadow-sm hover:scale-105 transition-transform"
                                        onClick={() => setFullscreenImg(img.preview)} />
                                      <button onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center shadow">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className={`w-full relative bg-card transition-all duration-300 ${(settingsToggles.glossyOutline ?? true) ? 'glossy-outline' : ''} !border-none !outline-none mx-auto ${messageBarStyle === 'compact' ? 'rounded-full' : 'rounded-[1.5rem]'}`} style={{ maxWidth: '48rem' }}>
                              {messageBarStyle === 'compact' ? (
                                <div className="flex items-center px-2 py-2 gap-1">
                                  <Tooltip>
                                    <DropdownMenu>
                                      <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="w-10 h-10 text-zinc-400 bg-zinc-200/70 hover:text-white hover:bg-white/10 rounded-full transition-all flex-shrink-0 p-0">
                                            <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                      </TooltipTrigger>
                                      <DropdownMenuContent className="bg-white border-none text-black rounded-xl shadow-2xl p-1 min-w-[190px]">
                                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-black/10 cursor-pointer rounded-lg focus:bg-black/10" onClick={() => imageInputRef.current?.click()}>
                                          <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <TooltipContent>Attach</TooltipContent>
                                  </Tooltip>
                                  <Textarea
                                    ref={textareaRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handleComposePaste}
                                    placeholder="Just Prompt and image is in your hands!"
                                    className="flex-1 bg-transparent text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden"
                                    style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                                    data-testid="input-message"
                                  />
                                  {(() => {
                                    const ORIENTS = [
                                      { id: 'none' as const, name: 'Auto', ratio: 'Default' },
                                      { id: 'square' as const, name: 'Square', ratio: '1:1' },
                                      { id: 'portrait' as const, name: 'Portrait', ratio: '9:16' },
                                      { id: 'wide' as const, name: 'Wide', ratio: '4:3' },
                                    ];
                                    const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                                    const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                                    return (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all flex-shrink-0 border border-zinc-200/60">
                                            <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px]" />
                                            <span>{active.name}</span>
                                            <span className="opacity-50 font-normal">{active.ratio}</span>
                                            <ChevronDown className="w-3 h-3 opacity-60" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="bottom" align="start" className="bg-white border-none text-black rounded-2xl shadow-2xl p-1.5 w-auto">
                                          <div className="relative flex flex-row items-center gap-0">
                                            <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 pointer-events-none"
                                              style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                            {ORIENTS.map(o => {
                                              const isAct = imagineOrientation === o.id;
                                              return (
                                                <button key={o.id} onClick={() => setImagineOrientation(o.id)}
                                                  className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isAct ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-700'}`}>
                                                  <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isAct ? '' : 'opacity-50'}`} />
                                                  <span>{o.name}</span>
                                                  <span className={`text-[9px] font-normal ${isAct ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    );
                                  })()}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon"
                                        className={`w-8 h-8 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-zinc-200/70 hover:text-white hover:bg-white/10'} rounded-full transition-all flex-shrink-0`}
                                        onClick={toggleListening} disabled={!speechSupported} data-testid="button-mic">
                                        <img src={microphoneIcon} alt="Mic" className="w-4 h-4 composer-message-icon" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                                  </Tooltip>
                                  {(isTyping || isAnimatingResponse) ? (
                                    <Button onClick={handleStopResponse} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center flex-shrink-0" data-testid="button-stop-response">
                                      <div className="w-3 h-3 rounded-sm bg-white flex-shrink-0" />
                                    </Button>
                                  ) : (
                                    <Button onClick={handleSendMessage} disabled={!inputValue.trim() && !attachedImages.length}
                                      className="w-8 h-8 composer-send-button text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30" data-testid="button-send-message">
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="p-1.5 sm:p-2">
                                    <Textarea
                                      ref={textareaRef}
                                      value={inputValue}
                                      onChange={(e) => setInputValue(e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      onPaste={handleComposePaste}
                                      placeholder="Just Prompt and image is in your hands!"
                                      className="w-full !min-h-[40px] max-h-[140px] bg-transparent text-black placeholder-zinc-500 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-[21px] sm:text-[22px] leading-relaxed p-2 !rounded-none overflow-y-auto"
                                      data-testid="input-message"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between px-2 pb-1.5">
                                    <div className="flex items-center gap-1">
                                      {(() => {
                                        const ORIENTS = [
                                          { id: 'none' as const, name: 'Auto', ratio: 'Default' },
                                          { id: 'square' as const, name: 'Square', ratio: '1:1' },
                                          { id: 'portrait' as const, name: 'Portrait', ratio: '9:16' },
                                          { id: 'wide' as const, name: 'Wide', ratio: '4:3' },
                                        ];
                                        const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                                        const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                                        return (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all flex-shrink-0 border border-zinc-200/60">
                                                <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px]" />
                                                <span>{active.name}</span>
                                                <span className="opacity-50 font-normal">{active.ratio}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="bottom" align="start" className="bg-white border-none text-black rounded-2xl shadow-2xl p-1.5 w-auto">
                                              <div className="relative flex flex-row items-center gap-0">
                                                <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 pointer-events-none"
                                                  style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                                {ORIENTS.map(o => {
                                                  const isAct = imagineOrientation === o.id;
                                                  return (
                                                    <button key={o.id} onClick={() => setImagineOrientation(o.id)}
                                                      className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isAct ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-700'}`}>
                                                      <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isAct ? '' : 'opacity-50'}`} />
                                                      <span>{o.name}</span>
                                                      <span className={`text-[9px] font-normal ${isAct ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      <Tooltip>
                                        <DropdownMenu>
                                          <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" className="w-10 h-10 text-zinc-400 bg-zinc-200/70 hover:text-white hover:bg-white/10 rounded-full transition-all p-0">
                                                <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                          </TooltipTrigger>
                                          <DropdownMenuContent className="bg-white border-none text-black rounded-xl shadow-2xl p-1 min-w-[190px]">
                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-black/10 cursor-pointer rounded-lg focus:bg-black/10" onClick={() => imageInputRef.current?.click()}>
                                              <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        <TooltipContent>Attach</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon"
                                            className={`w-9 h-9 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-zinc-200/70 hover:text-white hover:bg-white/10'} rounded-full transition-all`}
                                            onClick={toggleListening} disabled={!speechSupported} data-testid="button-mic">
                                            <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-zinc-400 bg-zinc-200/70 hover:text-white hover:bg-white/10"
                                            onClick={handleEnhancePrompt} disabled={!inputValue.trim() || isEnhancing} data-testid="button-enhance">
                                            {isEnhancing ? <div className="animate-spin w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Enhance prompt</TooltipContent>
                                      </Tooltip>
                                      {(isTyping || isAnimatingResponse) ? (
                                        <Button onClick={handleStopResponse} className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center ml-0.5" data-testid="button-stop-response">
                                          <div className="w-4 h-4 rounded-md bg-white flex-shrink-0" />
                                        </Button>
                                      ) : (
                                        <Button onClick={handleSendMessage} disabled={!inputValue.trim() && !attachedImages.length}
                                          className="w-10 h-10 composer-send-button text-white rounded-full flex items-center justify-center disabled:opacity-30 ml-0.5" data-testid="button-send-message">
                                          <ArrowUp className="w-5 h-5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                        <div className="mx-auto w-full max-w-[500px] flex flex-col items-center text-center">
                          {/* Editor + Templates cards */}
                          <div className="mt-5 grid w-full grid-cols-2 gap-3">
                            <button onClick={() => imageInputRef.current?.click()}
                              className="group relative flex min-h-[88px] items-center gap-3.5 px-5 py-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                              style={{ borderRadius: 28, background: resolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff', boxShadow: resolvedTheme === 'dark' ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)' }}>
                              <img
                                src={resolvedTheme === 'dark' ? '/icon-editor-dark.png' : '/icon-editor-light.png'}
                                alt="Editor"
                                className="relative shrink-0 w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                              />
                              <span className="relative">
                                <span className="block text-sm font-bold" style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#111111' }}>Editor</span>
                                <span className="mt-0.5 block text-[11px]" style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>Transform a photo</span>
                              </span>
                            </button>
                            <button onClick={() => document.getElementById('pc-studio-templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                              className="group relative flex min-h-[88px] items-center gap-3.5 px-5 py-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                              style={{ borderRadius: 28, background: resolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff', boxShadow: resolvedTheme === 'dark' ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)' }}>
                              <img
                                src={resolvedTheme === 'dark' ? '/icon-templates-dark.png' : '/icon-templates-light.png'}
                                alt="Templates"
                                className="relative shrink-0 w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                              />
                              <span className="relative">
                                <span className="block text-sm font-bold" style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#111111' }}>Templates</span>
                                <span className="mt-0.5 block text-[11px]" style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>Styles for every occasion</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        <section id="pc-studio-templates" className="mt-10">
                          <style>{`
                            @keyframes studio-marquee-left {
                              0%   { transform: translateX(0); }
                              100% { transform: translateX(-50%); }
                            }
                            @keyframes studio-marquee-right {
                              0%   { transform: translateX(-50%); }
                              100% { transform: translateX(0); }
                            }
                          `}</style>
                          <div className="mb-4 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-neutral-900">Templates</h3>
                              <span className="text-[11px] text-neutral-400">{STUDIO_VISUAL_TEMPLATES.length} styles</span>
                            </div>
                            <button onClick={() => setShowAllTemplates(true)} className="flex items-center text-[11px] font-semibold text-neutral-900 transition hover:text-neutral-500">Browse all</button>
                          </div>
                          <div className="flex flex-col gap-3">
                            {/* Row 1 — scrolls left */}
                            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', paddingTop: 14, marginTop: -14, paddingBottom: 14, marginBottom: -14 }}>
                              <div
                                className="flex gap-3 w-max"
                                style={{ animation: 'studio-marquee-left 175s linear infinite' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'paused'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'running'}
                              >
                                {[...STUDIO_ROW1, ...STUDIO_ROW1].map((t, i) => (
                                  <button
                                    key={`${t.id}-r1-${i}`}
                                    onClick={() => { setImagineTemplateModal({ label: t.name, color: '#111', img: t.thumb, prompt: t.prompt }); setTemplateUploadPhoto(null); }}
                                    className="group relative shrink-0 overflow-hidden text-left"
                                    style={{ width: 195, height: 265, borderRadius: 20, background: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.1)', transformOrigin: 'center center', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 22px 50px rgba(0,0,0,0.22)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; }}
                                  >
                                    <img src={t.thumb} alt={t.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                                      <div className="rounded-full px-4 py-2 text-[11px] font-bold text-white" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(10px)' }}>Try this look</div>
                                    </div>
                                    <span className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-10 text-[10px] font-bold leading-tight text-white group-hover:opacity-0 transition-opacity duration-200" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>{t.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Row 2 — scrolls right */}
                            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', paddingTop: 14, marginTop: -14, paddingBottom: 14, marginBottom: -14 }}>
                              <div
                                className="flex gap-3 w-max"
                                style={{ animation: 'studio-marquee-right 175s linear infinite' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'paused'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'running'}
                              >
                                {[...STUDIO_ROW2, ...STUDIO_ROW2].map((t, i) => (
                                  <button
                                    key={`${t.id}-r2-${i}`}
                                    onClick={() => { setImagineTemplateModal({ label: t.name, color: '#111', img: t.thumb, prompt: t.prompt }); setTemplateUploadPhoto(null); }}
                                    className="group relative shrink-0 overflow-hidden text-left"
                                    style={{ width: 195, height: 265, borderRadius: 20, background: '#ffffff', boxShadow: '0 6px 24px rgba(0,0,0,0.1)', transformOrigin: 'center center', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 22px 50px rgba(0,0,0,0.22)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; }}
                                  >
                                    <img src={t.thumb} alt={t.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                                      <div className="rounded-full px-4 py-2 text-[11px] font-bold text-white" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(10px)' }}>Try this look</div>
                                    </div>
                                    <span className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-10 text-[10px] font-bold leading-tight text-white group-hover:opacity-0 transition-opacity duration-200" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>{t.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="mt-9">
                          <div className="mb-3 flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-neutral-800">
                              My Gallery
                              {studioGallery.length > 0 && <span className="ml-2 text-[11px] font-normal text-neutral-400">({studioGallery.length} images)</span>}
                            </h3>
                            <span className="text-[11px] text-neutral-400">Your creations</span>
                          </div>
                          {studioGallery.length === 0 ? (
                            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70">
                              <div className="text-center">
                                <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100"><Image className="h-4 w-4 text-neutral-300" /></div>
                                <p className="text-[11px] font-medium text-neutral-500">Your generated images will appear here</p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-5 gap-2">
                              {studioGallery.map((photo, idx) => (
                                <button
                                  key={`${photo.label}-${photo.url}`}
                                  onClick={() => setInputValue(photo.prompt)}
                                  className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100"
                                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.14)'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                                >
                                  <img src={photo.url} alt={photo.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-108" />
                                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <p className="line-clamp-2 text-[9px] font-medium leading-tight text-white/90">{photo.label || photo.prompt?.slice(0, 40)}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      </div>
                    </div>
                  </div>


                 </>
               );
             }

            /* ── Messages state: 4-column layout like Nomad multi ── */
            return (
              <div className="absolute inset-0 flex flex-nowrap overflow-x-auto" style={{ scrollbarWidth: 'thin', alignItems: 'stretch', backgroundImage: 'linear-gradient(rgba(128,128,128,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.1) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                {STUDIO_COLS.map((m, idx) => {
                  const active = imagineSelectedModels.size === 0 || imagineSelectedModels.has(m.id);
                  // Build this column's ordered items: user messages + this model's AI messages interleaved
                  const colItems = imagineMessages.filter(msg => msg.role === 'user' || msg.modelId === m.id);
                  return (
                    <React.Fragment key={m.id}>
                      {idx > 0 && <div className="flex-shrink-0 w-[2.5px] rounded-full" style={{ background: 'rgba(128,128,128,0.35)', alignSelf: 'stretch', margin: '16px 0' }} />}
                      <div className="flex-1 flex flex-col" style={{ minWidth: 200, paddingLeft: 22, paddingRight: 22 }}>
                        {/* Model header card */}
                        <div
                          className="mx-3 mt-2 mb-3 rounded-2xl border-2 transition-all duration-300 bg-card px-3 py-3 flex flex-row items-center gap-3 flex-shrink-0"
                          style={{ borderColor: active ? m.color : 'rgba(128,128,128,0.25)' }}
                        >
                          {m.id === 'fius-imagine-super' ? (
                            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ overflow: 'visible' }}>
                              <FiusLogo size="sm" scaleWhenCurrent="scale(1.55) translateY(3px)" className="text-violet-500" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: m.color + '22', padding: 8 }}>
                              <img src={m.logo} alt={m.name} className={`w-full h-full object-contain${m.id === 'gpt-5.5-pro' ? ' brightness-0 dark:invert' : ''}`} onError={(e) => { e.currentTarget.style.display='none'; }} />
                            </div>
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[12px] font-bold text-foreground leading-tight truncate">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight truncate">{m.sub}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => toggleImagineModel(m.id)}
                              className="relative rounded-full transition-all duration-300 flex-shrink-0"
                              style={{ width: 36, height: 18 }}
                            >
                              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${active ? '' : 'bg-gray-300 dark:bg-gray-600'}`} style={active ? { backgroundColor: m.color } : {}} />
                              <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${active ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                            </button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setImagineSelectedModels(new Set([m.id]))}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent transition-all"
                                  style={{ color: m.color }}
                                >
                                  <Target className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Generate only with {m.name}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Messages */}
                        <div
                          ref={idx === 0 ? imagineScrollRef : undefined}
                          className="mx-2 flex flex-col gap-2 pb-52 overflow-y-auto flex-1 min-h-0"
                          style={{ scrollbarWidth: 'thin' }}
                        >
                          {colItems.map((msg) => (
                            <div key={msg.id} className="group relative">
                              {msg.role === 'user' ? (
                                /* ── User message bubble — same as Nomad ── */
                                <div className="p-2.5 rounded-lg rounded-br-none text-sm bg-zinc-200 dark:bg-zinc-700 text-secondary-foreground ml-3 [overflow-wrap:anywhere]">
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  {/* Edit + Remove on user message */}
                                  <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => setInputValue(msg.content.replace(/^🖼️ \[Reference image\] /, ''))}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                        >
                                          <Edit className="w-3 h-3" /> Edit
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit prompt</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => setImagineMessages(prev => prev.filter(x => x.id !== msg.id))}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                        >
                                          <X className="w-3 h-3" /> Remove
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Remove message</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              ) : (
                                /* ── AI image card ── */
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                  {msg.isGenerating ? (
                                    <div className="flex items-center gap-2 px-3 py-4">
                                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: m.color }} />
                                      <span className="text-xs text-muted-foreground">Generating…</span>
                                    </div>
                                  ) : msg.imageError ? (
                                    <div className="px-3 py-3">
                                      <p className="text-xs text-rose-500">{msg.imageError}</p>
                                    </div>
                                  ) : msg.imageUrl ? (
                                    <>
                                      <ImagineImageCard imageUrl={msg.imageUrl} fallbackUrls={msg.fallbackUrls || []} onExpand={(src) => setFullscreenImg(src)} />
                                      <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-border bg-card">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => { const a = document.createElement('a'); a.href = msg.imageUrl!; a.download = 'fius-imagine.png'; a.target = '_blank'; a.click(); }}
                                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                              <Download className="w-3 h-3" /> Save
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Download</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => navigator.clipboard.writeText(msg.imageUrl!)}
                                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                              <Share2 className="w-3 h-3" /> Share
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Copy URL</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => setImagineMessages(prev => prev.filter(x => x.id !== msg.id))}
                                              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                            >
                                              <X className="w-3 h-3" /> Remove
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Remove image</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ))}
                          {idx === 0 && <div ref={imagineMessagesEndRef} />}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()
        ) : activeTab === 'philosopher' ? (
          // Philosopher Tab
          <div className="h-full flex flex-col">
            {!selectedPersonality ? (
              // Personality Selection Screen
              <div className="flex flex-col h-full">
                <div className="mb-4 text-center relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsCustomizeModalOpen(true)}
                          className="absolute right-[5px] top-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                          <Settings size={16} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Appearance Settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <h2 className="text-4xl font-bold text-foreground mb-1">
                    Fius Minds
                  </h2>
                  <p className="text-muted-foreground text-sm">Choose a historical figure to converse with — they will speak in their own authentic style</p>
                </div>
                {/* Search */}
                <div className="mb-3 flex justify-center">
                  <input
                    type="text"
                    value={personalitySearch}
                    onChange={e => setPersonalitySearch(e.target.value)}
                    placeholder="Search personalities..."
                    className="w-full max-w-xs bg-card border border-border rounded-full px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                {/* Category Filter — sliding pill bar */}
                <div className="flex justify-center mb-4">
                  <div ref={catNavRef} className="relative flex items-center gap-1 bg-card border border-border rounded-full px-2 py-2">
                    {/* sliding pill */}
                    {catPillStyle.ready && (
                      <div aria-hidden style={{
                        position: 'absolute',
                        left: catPillStyle.left,
                        width: catPillStyle.width,
                        top: 5, bottom: 5,
                        transition: 'left 0.48s cubic-bezier(0.34,1.56,0.64,1), width 0.48s cubic-bezier(0.34,1.56,0.64,1)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.09)',
                          borderRadius: 999,
                          boxShadow: resolvedTheme === 'dark' ? '0 1px 10px rgba(255,255,255,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
                          animation: catPillAnimateRef.current ? 'pill-squish 0.48s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
                        }} />
                      </div>
                    )}
                    {PERSONALITY_CATEGORIES.map((cat, i) => (
                      <button
                        key={cat}
                        ref={el => { catBtnRefs.current[i] = el; }}
                        onClick={() => { if (cat !== personalityCategory) playTabClick(); catPillAnimateRef.current = true; setPersonalityCategory(cat); }}
                        className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${personalityCategory === cat ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        style={personalityCategory === cat && catPillStyle.ready ? { color: 'rgba(0,0,0,0.85)', transition: 'none' } : { transition: 'none' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Personalities Grid */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent 0px, black 48px, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 48px, black 100%)' }}
                  >
                  <div className="grid grid-cols-4 gap-3 px-3">
                    {filteredPersonalities.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPersonality(p); setPhilosopherMessages([]); setPhilosopherInput(''); }}
                        className="relative rounded-2xl overflow-hidden aspect-[3/4] group focus:outline-none bg-zinc-900 transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-black/60 hover:z-10"
                      >
                        <PersonalityCard id={p.id} name={p.name} wikiTitle={p.wikiTitle} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-left">
                          <div className="text-[13px] font-bold text-white leading-snug line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-white/60 leading-snug mt-0.5 line-clamp-1">{p.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredPersonalities.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">No personalities found matching your search.</div>
                  )}
                  </div>{/* end overflow-y-auto */}
                </div>{/* end relative overflow-hidden */}
              </div>
            ) : (
              // Chat with selected personality — new UI
              <div className="w-full h-full flex flex-col relative">
                {/* Back button — top left */}
                <button
                  onClick={() => { setSelectedPersonality(null); setPhilosopherMessages([]); }}
                  className="absolute top-2 z-10 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/50 rounded-full px-3 py-1.5 transition-all backdrop-blur-sm"
                  style={{ left: '16px' }}
                >
                  Back
                </button>

                {philosopherMessages.length === 0 ? (
                  /* No messages — fixed wrapper (avatar + info) anchored just above global msg bar */
                  <div className="flex-1 relative min-h-0">
                    <div className="fixed left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-full max-w-lg px-4" style={{ bottom: 'calc(50vh + 14px)' }}>
                      {/* Avatar */}
                      <div className="relative rounded-full overflow-hidden bg-zinc-900 shadow-2xl shadow-black/60 ring-2 ring-border flex-shrink-0"
                        style={{ width: '180px', height: '180px' }}>
                        <PersonalityCard id={selectedPersonality.id} name={selectedPersonality.name} wikiTitle={selectedPersonality.wikiTitle} />
                      </div>
                      {/* Info */}
                      <div className="text-center mt-4 px-2">
                        <div className="text-lg font-bold text-foreground leading-snug">{selectedPersonality.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">{selectedPersonality.era} · {selectedPersonality.role}</p>
                        <p className="text-xs text-muted-foreground/75 leading-relaxed">{selectedPersonality.style}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                  {/* Has messages — avatar compact at top, messages below */}
                  <div className="flex flex-col items-center pt-8 pb-3 flex-shrink-0">
                    <div className="relative rounded-full overflow-hidden bg-zinc-900 shadow-xl shadow-black/50 ring-2 ring-border"
                      style={{ width: '250px', height: '250px' }}>
                      <PersonalityCard id={selectedPersonality.id} name={selectedPersonality.name} wikiTitle={selectedPersonality.wikiTitle} />
                    </div>
                    <div className="text-center mt-3 px-6 max-w-sm">
                      <div className="text-base font-bold text-foreground">{selectedPersonality.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedPersonality.era} · {selectedPersonality.role}</p>
                    </div>
                  </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto min-h-0 px-4 space-y-4 pb-2">
                  {philosopherMessages.length === 0 && (
                    <div />
                  )}
                  {(() => {
                    const lastAiPhilosopherId = philosopherMessages.reduce<string | undefined>((acc, m) => m.role === 'assistant' ? m.id : acc, undefined);
                    const ab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent active:scale-90";
                    return philosopherMessages.map(msg => {
                      const isLatestAi = msg.id === lastAiPhilosopherId;
                      const isDone = isLatestAi ? !philosopherIsTyping : true;
                      return (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1 bg-zinc-800">
                              <PersonalityCard id={selectedPersonality.id} name={selectedPersonality.name} wikiTitle={selectedPersonality.wikiTitle} />
                            </div>
                          )}
                          {msg.role === 'user' ? (
                            <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 max-w-xs lg:max-w-md chat-bubble shadow-sm [overflow-wrap:anywhere]">
                              <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                                <p className="text-sm m-0">{msg.content}</p>
                              </div>
                              <div className="flex items-center justify-end mt-2 gap-1">
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-xl transition-all duration-300 ${copiedMessageId === msg.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} onClick={() => handleCopyMessage(msg.content, msg.id)}>
                                    <img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-xl text-zinc-800 dark:text-zinc-300 hover:text-foreground hover:bg-accent transition-all duration-150" onClick={() => { setInputValue(msg.content); setTimeout(() => { const el = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 100); }}>
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Edit message</p></TooltipContent></Tooltip>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className={`rounded-3xl px-4 py-3 chat-bubble relative`}>
                                {renderTypingText(msg.content, msg.id)}
                              </div>
                              {isDone && (
                                <div className="flex items-center gap-0.5 mt-1">
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${ab} ${likedMessages.has(msg.id) ? 'text-green-500 bg-green-100 dark:bg-green-950' : ''}`} onClick={() => handleLikeMessage(msg.id)}>
                                      <img src="/icon-like-black.png" className="h-4 w-4 object-contain block dark:hidden" style={likedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.7 }} alt="like" /><img src="/icon-like-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={likedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${ab} ${dislikedMessages.has(msg.id) ? 'text-red-500 bg-red-50 dark:bg-red-950' : ''}`} onClick={() => handleDislikeMessage(msg.id)}>
                                      <img src="/icon-dislike-black.png" className="h-4 w-4 object-contain block dark:hidden" style={dislikedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.7 }} alt="dislike" /><img src="/icon-dislike-gray2.png" className="h-4 w-4 object-contain hidden dark:block" style={dislikedMessages.has(msg.id) ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>Dislike</p></TooltipContent></Tooltip>
                                  <Tooltip><TooltipTrigger asChild>
                                    <button className={`${ab} ${copiedMessageId === msg.id ? 'text-blue-500 bg-blue-100 dark:bg-blue-950' : ''}`} onClick={() => handleCopyMessage(msg.content, msg.id)}>
                                      {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5 text-blue-500" /> : <><img src="/icon-copy-black.png" className="h-4 w-4 object-contain block dark:hidden opacity-70" alt="copy" /><img src="/icon-copy-gray2.png" className="h-4 w-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                                    </button>
                                  </TooltipTrigger><TooltipContent><p>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</p></TooltipContent></Tooltip>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className={ab}><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[180px] z-[200]">
                                      <DropdownMenuItem onClick={() => handlePhilosopherRetry()} disabled={philosopherIsTyping}
                                        className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                                        <RefreshCw className={`w-3.5 h-3.5 text-green-500 ${philosopherIsTyping ? 'animate-spin' : ''}`} /> Regenerate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fius-export.txt'; a.click(); }}
                                        className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                                        <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              {isDone && isLatestAi && (
                                <PCFollowUpSuggestions msgContent={msg.content} onSelect={(q) => setInputValue(q)} />
                              )}
                              {isDone && (
                                <p className="text-[9.5px] text-muted-foreground/35 mt-2 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {philosopherIsTyping && (
                    <div className="flex justify-start items-start gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 bg-zinc-800">
                        <PersonalityCard id={selectedPersonality.id} name={selectedPersonality.name} wikiTitle={selectedPersonality.wikiTitle} />
                      </div>
                      <div className="bg-card border border-border px-4 py-3 rounded-3xl">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" style={{animation: 'pulse-dot 1.5s ease-in-out infinite'}}></div>
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'fius-games' ? (
          // Fius Games Tab
          <div className="absolute inset-0 flex flex-col" style={{ padding: '0' }}>
            <FiusGames playerName={user?.displayName || user?.username || 'Player'} userId={user?.id} />
          </div>
        ) : (
          // Fius Labs Tab
          <div className="absolute inset-0 flex flex-col" style={{ padding: '0' }}>
            <FiusLabs user={user} />
          </div>
        )}
      </div>
      
      {/* Gradient overlay — fades content into bars area. Always present so bars never show text behind them */}
      {activeTab !== 'fius-games' && activeTab !== 'fius-labs' && !isVoiceModeModalOpen && !isVoiceModeOpen && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: 380, zIndex: 8, background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 52%)' }}
        />
      )}

      {/* Spacer — pushes fn-bar + msg-bar to bottom when in conversation mode */}
      <div className="flex-1 pointer-events-none" />

      {/* Tool Buttons - Separate Section */}
      {(() => {
        const isCircle = functionBarStyle === 'circle';
        const isPill   = functionBarStyle === 'pill';
        const squareShadow = (settingsToggles.glossyOutline ?? true) ? 'glossy-outline' : '';
        const fireFnAnim = (e: React.MouseEvent, fn: () => void) => {
          const animEl = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-fn-anim]') ?? (e.currentTarget as HTMLElement);
          animEl.classList.remove('btn-click-pop');
          void animEl.offsetWidth;
          animEl.classList.add('btn-click-pop');
          setTimeout(() => { animEl.classList.remove('btn-click-pop'); fn(); }, 480);
        };

        const renderFunctionBtn = (icon: React.ReactNode, label: string, onClick: () => void, activeStyle?: string, testId?: string) => {
          if (isPill) {
            return (
              <button
                key={label}
                data-fn-anim
                data-testid={testId}
                onClick={(e) => fireFnAnim(e, onClick)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 active:scale-95 ${
                  activeStyle
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-[#2e2e2e] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#383838] hover:scale-[1.05] hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <span className="flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center [&_img]:mix-blend-multiply dark:[&_img]:mix-blend-screen [&_img]:w-[18px] [&_img]:h-[18px] [&_img]:object-contain [&_img]:flex-shrink-0">{icon}</span>
                <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
              </button>
            );
          }
          if (isCircle) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => fireFnAnim(e, onClick)}
                    data-testid={testId}
                    className="flex flex-col items-center gap-1.5 group w-[5rem]"
                  >
                    <div data-fn-anim className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-[1.25] ${squareShadow} ${activeStyle || 'text-zinc-800 dark:text-white/85 bg-white dark:bg-[#383838] hover:bg-gray-50 dark:hover:bg-[#404040]'}`}>
                      {icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            );
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  data-fn-anim
                  className={`macos-button flex flex-col items-center space-y-1 px-4 py-6 rounded-2xl transition-all duration-300 border-none relative min-w-[5rem] ${squareShadow} ${activeStyle || 'text-zinc-800 dark:text-white/85 bg-white dark:bg-[#383838] hover:bg-gray-50 dark:hover:bg-[#404040]'}`}
                  onClick={(e) => fireFnAnim(e, onClick)}
                  data-testid={testId}
                >
                  <div className="relative z-10 flex flex-col items-center space-y-1">
                    {icon}
                    <span className="text-[10px] sm:text-xs font-medium">{label}</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        };

        const askFnBarCentered = activeTab === 'ask' && messages.length === 0;
        return (
          <div className={`macos-function-bar ${!askFnBarCentered ? 'macos-function-bar-with-messages' : ''} rounded-3xl mx-3 sm:mx-4 mb-1 max-w-[50rem] mx-auto w-full !border-none !shadow-none ${activeTab === 'philosopher' || activeTab === 'fius-games' || activeTab === 'fius-labs' || activeTab === 'imagine' || activeTab === 'nomad' || functionBarStyle === 'message-bar' || isVoiceModeModalOpen || isVoiceModeOpen ? 'hidden' : ''}`} style={askFnBarCentered ? {width: 'fit-content', position: 'fixed', top: isPill ? 'calc(50% - 48px)' : 'calc(50% - 68px)', left: (isSidebarOpen && sidebarOpenMode === 'mini') ? 'calc(50vw + 38px)' : '50vw', transform: isPill ? 'translateX(calc(-50% - 14px))' : 'translateX(-50%)', zIndex: 20, marginBottom: '10px'} : {width: 'fit-content', marginLeft: 'auto', marginRight: 'auto', marginTop: isPill ? '43px' : '11px', marginBottom: '14px', transform: isPill ? 'translateX(-14px)' : undefined, position: 'relative', zIndex: 30}}>
            <div className={`flex flex-wrap justify-center p-3 bg-transparent !border-none ${isPill ? 'gap-2' : 'gap-4'}`}>
              {renderFunctionBtn(
                <img src={resolvedTheme === 'dark' ? '/fn-voice-gray.png' : '/fn-voice-black.png'} alt="Long Answer" className="btn-icon" style={{width:'26px',height:'26px'}} />,
                'Long Answer',
                adjustFius,
                fiusIntegrationMode ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-none' : undefined,
                'button-fius-integration'
              )}
              {renderFunctionBtn(
                <img src={resolvedTheme === 'dark' ? '/fn-settings-gray.png' : '/fn-settings-black.png'} alt="Voice Mode" className="btn-icon" style={{width:'26px',height:'26px'}} />,
                'Voice Mode',
                openVoiceMode,
                undefined,
                'button-voice-mode-fn'
              )}
              {renderFunctionBtn(
                <img src={resolvedTheme === 'dark' ? '/fn-longans-gray.png' : '/fn-longans-black.png'} alt="Settings" className="btn-icon" style={{width:'26px',height:'26px'}} />,
                'Settings',
                () => setIsCustomizeModalOpen(true),
                undefined,
                'button-settings'
              )}
              {selectedModel === 'fius-education' && renderFunctionBtn(
                <GraduationCap className="h-5 w-5" />,
                'Education',
                () => setIsEducationModalOpen(true),
                undefined,
                'button-fius-examination'
              )}
            </div>
          </div>
        );
      })()}
        
      {/* Voice Mode Modal */}
      {isVoiceModeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="relative mb-6">
              <div 
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(45deg, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default')} 0%, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default', true)} 100%)`,
                  transform: `scale(${1 + Math.sin(Date.now() / 200) * 0.1})`,
                }}
              >
                <FiusLogo size="lg" className="text-white" />
              </div>
              {isListening && (
                <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-blue-500 animate-pulse"></div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Voice Mode</h3>
            <p className="text-muted-foreground mb-4">
              {isListening ? "I'm listening..." : "Click to start speaking"}
            </p>
            
            {/* Voice-to-Voice Toggle */}
            <div className="flex items-center justify-center mb-6 space-x-3">
              <span className={`text-sm ${!isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice Input Only
              </span>
              <button
                onClick={() => setIsVoiceToVoiceMode(!isVoiceToVoiceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isVoiceToVoiceMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVoiceToVoiceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice-to-Voice
              </span>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <Button
                onClick={() => setIsVoiceModeOpen(false)}
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Imagine Studio fixed message bar — REMOVED, now rendered inside imagine empty state ── */}
      {false && (
        <div>
          {/* Attached images tray */}
          {attachedImages.length > 0 && (
            <div className="mb-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden" style={{ maxWidth: 'calc(2 * 80px + 8px + 20px)' }}>
              <div ref={attachTrayRef} className="flex gap-2 overflow-x-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(160,160,160,0.4) transparent' }}>
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <img src={img.preview} alt={`Attached ${i + 1}`}
                      className="h-20 w-20 object-cover rounded-xl border border-zinc-300 dark:border-zinc-600 cursor-zoom-in shadow-sm hover:scale-105 transition-transform"
                      onClick={() => setFullscreenImg(img.preview)} />
                    <button onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center transition-all shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`relative bg-white dark:bg-[#383838] transition-all duration-300 ${(settingsToggles.glossyOutline ?? true) ? 'glossy-outline' : ''} !border-none !outline-none ${messageBarStyle === 'compact' ? 'rounded-full' : 'rounded-[1.5rem]'}`}>
            {messageBarStyle === 'compact' ? (
              <div className="flex items-center px-2 py-2 gap-1">
                {/* Attachment button */}
                <Tooltip>
                  <DropdownMenu>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex-shrink-0" data-testid="button-attachment">
                          <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px]">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 data-[state=open]:bg-black/10 dark:data-[state=open]:bg-white/10">
                          <Paperclip className="w-4 h-4 text-zinc-400" /><span style={{ color: resolvedTheme === 'dark' ? '#fff' : '#111' }}>Attachments</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]">
                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                              <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <TooltipContent>Attach</TooltipContent>
                </Tooltip>
                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handleComposePaste}
                  placeholder="Just Prompt and image is in your hands!"
                  className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden"
                  style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                  data-testid="input-message"
                />
                {/* Orientation picker */}
                {(() => {
                  const ORIENTS = [
                    { id: 'none' as const, name: 'Auto', ratio: 'Default' },
                    { id: 'square' as const, name: 'Square', ratio: '1:1' },
                    { id: 'portrait' as const, name: 'Portrait', ratio: '9:16' },
                    { id: 'wide' as const, name: 'Wide', ratio: '4:3' },
                  ];
                  const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                  const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.07] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all flex-shrink-0 border border-zinc-200/60 dark:border-white/10">
                          <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px] dark:invert" />
                          <span>{active.name}</span>
                          <span className="opacity-50 font-normal">{active.ratio}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-1.5 w-auto">
                        <div className="relative flex flex-row items-center gap-0">
                          <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                            style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                          {ORIENTS.map(o => {
                            const isAct = imagineOrientation === o.id;
                            return (
                              <button key={o.id} onClick={() => setImagineOrientation(o.id)}
                                className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isAct ? 'text-zinc-800 dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isAct ? 'dark:invert-0' : 'dark:invert opacity-50'}`} />
                                <span>{o.name}</span>
                                <span className={`text-[9px] font-normal ${isAct ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                              </button>
                            );
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}
                {/* Mic */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className={`w-8 h-8 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'} rounded-full transition-all flex-shrink-0`}
                      onClick={toggleListening} disabled={!speechSupported} data-testid="button-mic">
                      <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                </Tooltip>
                {/* Stop / Send */}
                {(isTyping || isAnimatingResponse) ? (
                  <Button onClick={handleStopResponse} className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-zinc-800 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-100 flex-shrink-0" data-testid="button-stop-response">
                    <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800 flex-shrink-0" />
                  </Button>
                ) : (
                  <Button onClick={handleSendMessage} disabled={!inputValue.trim() && !attachedImages.length}
                    className="w-8 h-8 composer-send-button text-white dark:text-black rounded-full flex items-center justify-center transition-all flex-shrink-0" data-testid="button-send-message">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              /* Full two-row layout */
              <>
                <div className="p-1.5 sm:p-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handleComposePaste}
                    placeholder="Just Prompt and image is in your hands!"
                    className="w-full !min-h-[40px] max-h-[140px] bg-transparent dark:text-white text-black placeholder-zinc-500 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-[21px] sm:text-[22px] leading-relaxed p-2 !rounded-none overflow-y-auto"
                    data-testid="input-message"
                  />
                </div>
                <div className="flex items-center justify-between px-2 pb-1.5">
                  <div className="flex items-center gap-1">
                    {/* Orientation picker */}
                    {(() => {
                      const ORIENTS = [
                        { id: 'none' as const, name: 'Auto', ratio: 'Default' },
                        { id: 'square' as const, name: 'Square', ratio: '1:1' },
                        { id: 'portrait' as const, name: 'Portrait', ratio: '9:16' },
                        { id: 'wide' as const, name: 'Wide', ratio: '4:3' },
                      ];
                      const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                      const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.07] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all flex-shrink-0 border border-zinc-200/60 dark:border-white/10">
                              <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px] dark:invert" />
                              <span>{active.name}</span>
                              <span className="opacity-50 font-normal">{active.ratio}</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="top" align="start" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-1.5 w-auto">
                            <div className="relative flex flex-row items-center gap-0">
                              <div className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                                style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }} />
                              {ORIENTS.map(o => {
                                const isAct = imagineOrientation === o.id;
                                return (
                                  <button key={o.id} onClick={() => setImagineOrientation(o.id)}
                                    className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isAct ? 'text-zinc-800 dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                    <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isAct ? 'dark:invert-0' : 'dark:invert opacity-50'}`} />
                                    <span>{o.name}</span>
                                    <span className={`text-[9px] font-normal ${isAct ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    })()}
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {/* Attachment */}
                    <Tooltip>
                      <DropdownMenu>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all" data-testid="button-attachment">
                              <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px]">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 data-[state=open]:bg-black/10 dark:data-[state=open]:bg-white/10">
                              <Paperclip className="w-4 h-4 text-zinc-400" /><span style={{ color: resolvedTheme === 'dark' ? '#fff' : '#111' }}>Attachments</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]">
                                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                                  <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <TooltipContent>Attach</TooltipContent>
                    </Tooltip>
                    {/* Mic */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className={`w-9 h-9 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10'} rounded-full transition-all`}
                          onClick={toggleListening} disabled={!speechSupported} data-testid="button-mic">
                          <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                    </Tooltip>
                    {/* Enhance */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full transition-all text-zinc-400 hover:text-white hover:bg-white/10"
                          onClick={handleEnhancePrompt} disabled={!inputValue.trim() || isEnhancing} data-testid="button-enhance">
                          {isEnhancing ? <div className="animate-spin w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enhance prompt</TooltipContent>
                    </Tooltip>
                    {/* Stop / Send */}
                    {(isTyping || isAnimatingResponse) ? (
                      <Button onClick={handleStopResponse} className="w-10 h-10 rounded-full flex items-center justify-center transition-all ml-0.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-100" data-testid="button-stop-response">
                        <div className="w-4 h-4 rounded-md bg-white dark:bg-zinc-800 flex-shrink-0" />
                      </Button>
                    ) : (
                      <Button onClick={handleSendMessage} disabled={!inputValue.trim() && !attachedImages.length}
                        className="w-10 h-10 composer-send-button text-black rounded-full flex items-center justify-center transition-all disabled:opacity-30 ml-0.5" data-testid="button-send-message">
                        <ArrowUp className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* New Unified Message Bar */}
      <div data-message-bar className={`max-w-[48rem] w-full px-4 ${((activeTab === 'ask' && messages.length > 0) || (activeTab === 'nomad' && Object.values(nomadMessages).some(msgs => msgs.length > 0)) || (activeTab === 'philosopher' && philosopherMessages.length > 0)) ? 'message-composer-with-messages' : ''} ${(activeTab === 'ask' && messages.length === 0) || (activeTab === 'nomad' && nomadMode === 'multi' && Object.values(nomadMessages).every(msgs => msgs.length === 0)) ? 'absolute lg:fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20' : (activeTab === 'philosopher' && selectedPersonality && philosopherMessages.length === 0) ? 'absolute lg:fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-20' : 'flex-shrink-0 mx-auto mb-4 sm:mb-8'} ${activeTab === 'fius-games' || activeTab === 'fius-labs' || activeTab === 'imagine' || (activeTab === 'philosopher' && !selectedPersonality) || isVoiceModeModalOpen || isVoiceModeOpen ? 'hidden' : ''}`} style={
        (activeTab === 'ask' && messages.length === 0)
          ? { top: 'calc(50% + 85px)', position: 'fixed', left: (isSidebarOpen && sidebarOpenMode === 'mini') ? 'calc(50vw + 53px)' : 'calc(50vw + 15px)', width: 'min(48rem, calc(100vw - 2rem))', maxWidth: '48rem' }
          : (activeTab === 'nomad' && nomadMode === 'multi' && Object.values(nomadMessages).every(msgs => msgs.length === 0))
              ? { position: 'fixed', left: (isSidebarOpen && sidebarOpenMode === 'mini') ? 'calc(50vw + 53px)' : 'calc(50vw + 15px)', width: 'min(48rem, calc(100vw - 2rem))', maxWidth: '48rem' }
              : (activeTab === 'philosopher' && selectedPersonality && philosopherMessages.length === 0)
                ? { top: 'calc(50% + 51px)' }
                : { position: 'relative', left: (isSidebarOpen && sidebarOpenMode === 'mini') ? '15px' : '15px', zIndex: 10 }
      }>
        {activeTab === 'nomad' && nomadMode === 'multi' && Object.values(nomadMessages).every(msgs => msgs.length === 0) && (
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-foreground" style={uiAccentColor ? { color: uiAccentColor } : {}}>
              {user?.displayName ? `Welcome back, ${user.displayName}!` : 'Welcome to Fius'}
            </h2>
            {!(settingsToggles.hideFlyWithUs) && <p className="text-lg text-foreground" style={uiAccentColor ? { color: uiAccentColor } : {}}>Fly With Us!</p>}
          </div>
        )}
        {/* Nomad Summarize bar — above msg bar */}
        {activeTab === 'nomad' && Object.values(nomadMessages).some(msgs => msgs.some(m => m.role === 'assistant')) && (
          <div className="flex justify-center mb-2">
            <button onClick={handleNomadSummarize}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-card border border-border hover:bg-accent transition-all shadow-sm text-foreground">
              <Sparkles className="w-3.5 h-3.5" /> Summarize all responses
            </button>
          </div>
        )}


        {/* ── Attached images tray — floats ABOVE the bar ── */}
        {attachedImages.length > 0 && (
          <div className="mb-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden" style={{ maxWidth: 'calc(2 * 80px + 8px + 20px)' }}>
            <div
              ref={attachTrayRef}
              className="flex gap-2 overflow-x-auto p-2"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(160,160,160,0.4) transparent', maxWidth: '100%' }}
            >
              {attachedImages.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img
                    src={img.preview}
                    alt={`Attached ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-xl border border-zinc-300 dark:border-zinc-600 cursor-zoom-in shadow-sm hover:scale-105 transition-transform"
                    onClick={() => setFullscreenImg(img.preview)}
                  />
                  <button
                    onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center transition-all shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {attachedImages.length > 2 && i === attachedImages.length - 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] rounded px-1">+{attachedImages.length - 2} more</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Files tray (inside-bar style kept for non-image files) ── */}
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="relative flex items-center gap-2 bg-white dark:bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 pr-8 max-w-[200px] shadow-sm">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">{f.name}</p>
                  <p className="text-[10px] text-zinc-500">{f.size}</p>
                </div>
                <button
                  onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {documentMode && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-xs font-medium text-indigo-600 dark:text-indigo-300 w-fit">
            <FileSignature className="w-3.5 h-3.5" />
            Document mode — type a topic, I'll write the full document
            <button onClick={() => setDocumentMode(false)} className="ml-1 hover:text-red-500 transition-colors" data-testid="button-cancel-document-mode">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div
          className={`relative bg-white dark:bg-[#383838] transition-all duration-300 ${(settingsToggles.glossyOutline ?? true) ? 'glossy-outline' : ''} !border-none !outline-none ${messageBarStyle === 'compact' && attachedFiles.length === 0 ? 'rounded-full' : 'rounded-[1.5rem]'}`}
        >
          {messageBarStyle === 'compact' ? (
            /* ── Compact: single-row pill layout ── */
            <div className="flex items-center px-2 pt-2 pb-[10px] gap-1">
              {/* LEFT: Attachment + function-bar buttons */}
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex-shrink-0"
                        data-testid="button-attachment"
                      >
                        <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                   <DropdownMenuContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px]">
                     <DropdownMenuSub>
                       <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 data-[state=open]:bg-black/10 dark:data-[state=open]:bg-white/10">
                         <Paperclip className="w-4 h-4 text-zinc-400" />
                         <span style={{ color: resolvedTheme === 'dark' ? '#fff' : '#111' }}>Attachments</span>
                       </DropdownMenuSubTrigger>
                       <DropdownMenuPortal>
                         <DropdownMenuSubContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]">
                           <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                             <FileText className="w-4 h-4 text-zinc-400" /><span>Upload File</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                             <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                           </DropdownMenuItem>
                           <div
                             onDragEnter={handleAttachBoxDragEnter}
                             onDragOver={handleAttachBoxDragOver}
                             onDragLeave={handleAttachBoxDragLeave}
                             onDrop={handleAttachBoxDrop}
                             onClick={() => fileInputRef.current?.click()}
                             className={`mx-1 mt-1 mb-0.5 aspect-square w-[148px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors select-none ${isDraggingFiles ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-300 dark:border-white/20 hover:border-zinc-400 dark:hover:border-white/30'}`}
                           >
                             <Upload className={`w-5 h-5 ${isDraggingFiles ? 'text-indigo-500' : 'text-zinc-400'}`} />
                             <span className={`text-[11px] leading-tight px-2 ${isDraggingFiles ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                               {isDraggingFiles ? 'Drop to attach' : 'Drag & drop files here'}
                             </span>
                           </div>
                         </DropdownMenuSubContent>
                       </DropdownMenuPortal>
                     </DropdownMenuSub>
                     <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => { setDocumentMode(true); showToast('Document mode: type a topic and I’ll write a full document.'); }}>
                       <FileSignature className="w-4 h-4 text-purple-400" /><span>Create Document</span>
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent>Tools</TooltipContent>
              </Tooltip>
              {functionBarStyle === 'message-bar' && activeTab !== 'philosopher' && activeTab !== 'fius-games' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className={`w-8 h-8 rounded-full transition-all flex-shrink-0 ${fiusIntegrationMode ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`} onClick={adjustFius}>
                        <img src="/integration-icon.png" alt="Integration" className="btn-icon" style={{width:'18px',height:'18px'}} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Long Answer</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-800 dark:text-white/85 hover:bg-white/10 rounded-full transition-all flex-shrink-0" onClick={openVoiceMode}>
                        <AudioLines className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice Mode</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex-shrink-0" onClick={() => setIsCustomizeModalOpen(true)}>
                        <img src="/settings-icon.png" alt="Settings" className="btn-icon" style={{width:'17px',height:'17px'}} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </>
              )}
              {/* Textarea — grows to fill space */}
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handleComposePaste}
                placeholder={activeTab === 'imagine' ? 'Just Prompt and image is in your hands!' : activeTab === 'philosopher' && selectedPersonality ? `Talk with ${selectedPersonality.name}...` : typingPlaceholder}
                className="flex-1 bg-transparent dark:text-white text-black placeholder-zinc-400 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-sm leading-normal !p-0 !min-h-0 !rounded-none [&::-webkit-scrollbar]:hidden"
                style={{ height: '38px', maxHeight: '38px', lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none' }}
                data-testid="input-message"
              />
              {/* RIGHT: expand + model selector + mic + send */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`w-4 h-4 flex items-center justify-center transition-all flex-shrink-0 ${inputValue.trim() ? 'text-zinc-600 dark:text-zinc-300 opacity-90 hover:opacity-100 scale-110' : 'text-zinc-400 opacity-30 hover:opacity-60'}`}
                    onClick={() => setPromptFullscreen(true)}
                    tabIndex={-1}
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Expand prompt</TooltipContent>
              </Tooltip>
              {activeTab === 'imagine' && (() => {
                const ORIENTS = [
                  { id: 'none' as const,     name: 'Auto',    ratio: 'Default' },
                  { id: 'square' as const,   name: 'Square',  ratio: '1:1'     },
                  { id: 'portrait' as const, name: 'Portrait',ratio: '9:16'    },
                  { id: 'wide' as const,     name: 'Wide',    ratio: '4:3'     },
                ];
                const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.07] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all flex-shrink-0 border border-zinc-200/60 dark:border-white/10">
                        <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px] dark:invert" />
                        <span>{active.name}</span>
                        <span className="opacity-50 font-normal">{active.ratio}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-1.5 w-auto data-[state=closed]:animate-none data-[state=closed]:duration-0">
                      <div className="relative flex flex-row items-center gap-0">
                        <div
                          className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                          style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }}
                        />
                        {ORIENTS.map(o => {
                          const isActive = imagineOrientation === o.id;
                          return (
                            <button
                              key={o.id}
                              onClick={() => setImagineOrientation(o.id)}
                              className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isActive ? 'text-zinc-800 dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                              <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isActive ? 'dark:invert-0' : 'dark:invert opacity-50'}`} />
                              <span>{o.name}</span>
                              <span className={`text-[9px] font-normal ${isActive ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                            </button>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
              {activeTab !== 'nomad' && activeTab !== 'imagine' && (
              <Select value={selectedModel} onValueChange={(value: AvailableModel) => {
                if (isChatModelLocked(value)) {
                  toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" });
                  return;
                }
                setSelectedModel(value);
              }}>
                <SelectTrigger className="h-7 px-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 !border-none !border-0 bg-transparent shadow-none !shadow-none ring-0 !ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 transition-all rounded-full outline-none flex-shrink-0 w-auto">
                  <span className="truncate">{MODEL_OPTIONS.find(m => m.id === selectedModel)?.name ?? selectedModel}</span>
                </SelectTrigger>
                <SelectContent forceMount className="bg-white dark:bg-[#383838] !border-none !border-0 text-black dark:text-white rounded-xl shadow-2xl overflow-hidden ring-0 !ring-0 outline-none !outline-none p-1">
                  {tabModelOptions.map((modelOption) => (
                    <SelectItem key={modelOption.id} value={modelOption.id} className={`text-xs !w-auto !rounded-full mx-0.5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus:bg-black/10 dark:focus:bg-white/10 ${isChatModelLocked(modelOption.id) ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${modelOption.provider === 'openai' ? 'bg-emerald-500' : modelOption.provider === 'anthropic' ? 'bg-orange-500' : modelOption.provider === 'google' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                        {modelOption.name}
                        {isChatModelLocked(modelOption.id) && <Lock className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
              {/* Enhance — slides in left of mic when user types */}
              {!(isTyping || isAnimatingResponse) && (
                <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${inputValue.trim() || attachedImages.length || attachedFiles.length ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full transition-all flex-shrink-0 text-zinc-400 hover:text-white hover:bg-white/10"
                        onClick={handleEnhancePrompt}
                        disabled={!inputValue.trim() || isEnhancing}
                        data-testid="button-enhance"
                      >
                        {isEnhancing ? (
                          <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full" />
                        ) : (
                          <img src={improvePromptIcon} alt="Enhance" className="w-5 h-5 composer-message-icon" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enhance prompt</TooltipContent>
                  </Tooltip>
                </div>
              )}
              {/* Mic */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'} rounded-full transition-all flex-shrink-0`}
                    onClick={toggleListening}
                    disabled={!speechSupported}
                    data-testid="button-mic"
                  >
                    <img src={microphoneIcon} alt="Mic" className="w-5 h-5 composer-message-icon" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
              </Tooltip>
              {/* Stop or Send */}
              {(isTyping || isAnimatingResponse) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleStopResponse} className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-zinc-800 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-100 flex-shrink-0" data-testid="button-stop-response">
                      <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800 flex-shrink-0" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop response</TooltipContent>
                </Tooltip>
              ) : (
                <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${inputValue.trim() || attachedImages.length || attachedFiles.length ? 'max-w-[36px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSendMessage} disabled={!inputValue.trim() && !attachedImages.length && !attachedFiles.length} className="w-8 h-8 composer-send-button hover:opacity-90 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0" data-testid="button-send-message">
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          ) : (
            /* ── Default: two-row layout (unchanged) ── */
            <>
              <div className="p-1.5 sm:p-2">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handleComposePaste}
                  placeholder={activeTab === 'imagine' ? 'Just Prompt and image is in your hands!' : activeTab === 'philosopher' && selectedPersonality ? `Talk with ${selectedPersonality.name}...` : activeTab === 'fius-games' ? 'Type your answer or move...' : 'What do you want to know ?'}
                  className="w-full !min-h-[40px] max-h-[140px] bg-transparent dark:text-white text-black placeholder-zinc-500 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-[21px] sm:text-[22px] leading-relaxed p-2 !rounded-none overflow-y-auto"
                  data-testid="input-message"
                />
              </div>

              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                  {/* Expand prompt inline, left of model selector */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`w-4 h-4 flex items-center justify-center transition-all flex-shrink-0 ${inputValue.trim() ? 'text-zinc-600 dark:text-zinc-300 opacity-90 hover:opacity-100 scale-110' : 'text-zinc-400 opacity-30 hover:opacity-60'}`}
                        onClick={() => setPromptFullscreen(true)}
                        tabIndex={-1}
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Expand prompt</TooltipContent>
                  </Tooltip>
                  {activeTab === 'imagine' && (() => {
                    const ORIENTS = [
                      { id: 'none' as const,     name: 'Auto',    ratio: 'Default' },
                      { id: 'square' as const,   name: 'Square',  ratio: '1:1'     },
                      { id: 'portrait' as const, name: 'Portrait',ratio: '9:16'    },
                      { id: 'wide' as const,     name: 'Wide',    ratio: '4:3'     },
                    ];
                    const active = ORIENTS.find(o => o.id === imagineOrientation)!;
                    const activeIdx = ORIENTS.findIndex(o => o.id === imagineOrientation);
                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.07] hover:bg-zinc-200 dark:hover:bg-white/10 transition-all flex-shrink-0 border border-zinc-200/60 dark:border-white/10">
                            <img src={`/icon-orient-${imagineOrientation}.png`} alt={imagineOrientation} className="w-[17px] h-[17px] dark:invert" />
                            <span>{active.name}</span>
                            <span className="opacity-50 font-normal">{active.ratio}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-2xl shadow-2xl p-1.5 w-auto data-[state=closed]:animate-none data-[state=closed]:duration-0">
                          <div className="relative flex flex-row items-center gap-0">
                            <div
                              className="absolute top-0 bottom-0 rounded-xl bg-zinc-200 dark:bg-white pointer-events-none"
                              style={{ width: `${100 / ORIENTS.length}%`, transform: `translateX(${activeIdx * 100}%)`, transition: 'transform 0.48s cubic-bezier(0.34,1.56,0.64,1)' }}
                            />
                            {ORIENTS.map(o => {
                              const isActive = imagineOrientation === o.id;
                              return (
                                <button
                                  key={o.id}
                                  onClick={() => setImagineOrientation(o.id)}
                                  className={`relative z-10 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors duration-200 min-w-[56px] ${isActive ? 'text-zinc-800 dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                  <img src={`/icon-orient-${o.id}.png`} alt={o.name} className={`w-[23px] h-[23px] ${isActive ? 'dark:invert-0' : 'dark:invert opacity-50'}`} />
                                  <span>{o.name}</span>
                                  <span className={`text-[9px] font-normal ${isActive ? 'opacity-70' : 'opacity-40'}`}>{o.ratio}</span>
                                </button>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                  {activeTab !== 'nomad' && activeTab !== 'imagine' && (
                  <Select value={selectedModel} onValueChange={(value: AvailableModel) => {
                    if (isChatModelLocked(value)) {
                      toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" });
                      return;
                    }
                    setSelectedModel(value);
                  }}>
                    <SelectTrigger className="h-8 px-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 !border-none !border-0 bg-transparent shadow-none !shadow-none ring-0 !ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 transition-all rounded-full outline-none flex-shrink-0 w-auto">
                      <span className="truncate">{MODEL_OPTIONS.find(m => m.id === selectedModel)?.name ?? selectedModel}</span>
                    </SelectTrigger>
                    <SelectContent forceMount className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] !border-none !border-0 text-black dark:text-white rounded-xl shadow-2xl overflow-hidden ring-0 !ring-0 outline-none !outline-none">
                      {tabModelOptions.map((modelOption) => (
                        <SelectItem key={modelOption.id} value={modelOption.id} className={`text-xs hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus:bg-black/10 dark:focus:bg-white/10 ${isChatModelLocked(modelOption.id) ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              modelOption.provider === 'openai' ? 'bg-emerald-500' :
                              modelOption.provider === 'anthropic' ? 'bg-orange-500' :
                              modelOption.provider === 'google' ? 'bg-blue-500' :
                              'bg-zinc-500'
                            }`}></div>
                            {modelOption.name}
                            {isChatModelLocked(modelOption.id) && <Lock className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Function bar buttons in message bar mode */}
                  {functionBarStyle === 'message-bar' && activeTab !== 'philosopher' && activeTab !== 'fius-games' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`w-9 h-9 rounded-full transition-all ${fiusIntegrationMode ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10'}`}
                            onClick={adjustFius}
                          >
                            <img src="/integration-icon.png" alt="Integration" className="btn-icon" style={{width:'23px',height:'23px'}} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Long Answer</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-zinc-800 dark:text-white/85 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all"
                            onClick={openVoiceMode}
                          >
                            <AudioLines className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voice Mode</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all"
                            onClick={() => setIsCustomizeModalOpen(true)}
                          >
                            <img src="/settings-icon.png" alt="Settings" className="btn-icon" style={{width:'21px',height:'21px'}} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                      </Tooltip>
                      {selectedModel === 'fius-education' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all"
                              onClick={() => setIsEducationModalOpen(true)}
                            >
                              <GraduationCap className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Education Settings</TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                  <Tooltip>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            data-testid="button-attachment"
                          >
                            <img src={resolvedTheme === "dark" ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                       <DropdownMenuContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px]">
                         <DropdownMenuSub>
                           <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 data-[state=open]:bg-black/10 dark:data-[state=open]:bg-white/10">
                             <Paperclip className="w-4 h-4 text-zinc-400" />
                             <span style={{ color: resolvedTheme === 'dark' ? '#fff' : '#111' }}>Attachments</span>
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                             <DropdownMenuSubContent className="bg-white dark:bg-[#383838] !bg-white dark:!bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]">
                               <DropdownMenuItem
                                 className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10"
                                 onClick={() => fileInputRef.current?.click()}
                               >
                                 <FileText className="w-4 h-4 text-zinc-400" />
                                 <span>Upload File</span>
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10"
                                 onClick={() => imageInputRef.current?.click()}
                               >
                                 <Image className="w-4 h-4 text-zinc-400" />
                                 <span>Upload Image</span>
                               </DropdownMenuItem>
                               <div
                                 onDragEnter={handleAttachBoxDragEnter}
                                 onDragOver={handleAttachBoxDragOver}
                                 onDragLeave={handleAttachBoxDragLeave}
                                 onDrop={handleAttachBoxDrop}
                                 onClick={() => fileInputRef.current?.click()}
                                 className={`mx-1 mt-1 mb-0.5 aspect-square w-[148px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors select-none ${isDraggingFiles ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-300 dark:border-white/20 hover:border-zinc-400 dark:hover:border-white/30'}`}
                               >
                                 <Upload className={`w-5 h-5 ${isDraggingFiles ? 'text-indigo-500' : 'text-zinc-400'}`} />
                                 <span className={`text-[11px] leading-tight px-2 ${isDraggingFiles ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                   {isDraggingFiles ? 'Drop to attach' : 'Drag & drop files here'}
                                 </span>
                               </div>
                             </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                         </DropdownMenuSub>
                         <DropdownMenuItem
                           className="flex items-center gap-3 px-3 py-2 text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10"
                           onClick={() => { setDocumentMode(true); showToast('Document mode: type a topic and I’ll write a full document.'); }}
                         >
                           <FileSignature className="w-4 h-4 text-purple-400" />
                           <span>Create Document</span>
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipContent>Tools</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-full transition-all text-zinc-400 hover:text-white hover:bg-white/10"
                        onClick={handleEnhancePrompt}
                        disabled={!inputValue.trim() || isEnhancing}
                        data-testid="button-enhance"
                      >
                        {isEnhancing ? (
                          <div className="animate-spin w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
                        ) : (
                          <img
                            src={improvePromptIcon}
                            alt="Enhance"
                            className="w-5 h-5 composer-message-icon"
                          />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enhance prompt</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-9 h-9 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10'} rounded-full transition-all`}
                        onClick={toggleListening}
                        disabled={!speechSupported}
                        data-testid="button-mic"
                      >
                        <img
                          src={microphoneIcon}
                          alt="Mic"
                          className="w-5 h-5 composer-message-icon"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                  </Tooltip>
                  {(isTyping || isAnimatingResponse) ? (
                    <Button
                      onClick={handleStopResponse}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all ml-0.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-100"
                      data-testid="button-stop-response"
                    >
                      <div className="w-4 h-4 rounded-md bg-white dark:bg-zinc-800 flex-shrink-0" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() && !attachedImages.length && !attachedFiles.length}
                      className="w-10 h-10 composer-send-button hover:opacity-90 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-30 ml-0.5"
                      data-testid="button-send-message"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Voice Listening Indicator Overlay moved inside the relative container */}
          {isListening && (
            <div className="absolute inset-x-0 -top-8 flex justify-center">
              <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Listening...</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick action chips — Ask tab empty state ── */}
        {activeTab === 'ask' && messages.length === 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {([
              { label: 'Create Visuals', light: '/quick-visuals-light.png', dark: '/quick-visuals-dark.png', action: () => changeTab('imagine') },
              { label: 'Web Search',     light: '/quick-websearch-light.png', dark: '/quick-websearch-dark.png', action: () => setInputValue('Search the web for: ') },
              { label: 'Create Files',   light: '/quick-files-light.png', dark: '/quick-files-dark.png', action: () => setDocumentMode(true) },
              { label: 'Play Games',     light: '/quick-games-light.png', dark: '/quick-games-dark.png', action: () => changeTab('fius-games') },
            ] as const).map(({ label, light, dark, action }) => (
              <button key={label} onClick={action}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all hover:scale-[1.05] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] bg-zinc-100 dark:bg-[#2e2e2e] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-600/30 hover:bg-zinc-200 dark:hover:bg-[#3a3a3a]">
                <img src={resolvedTheme === 'dark' ? dark : light} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>


        {/* Hidden file input for template photo upload */}
        <input
          ref={templatePhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              const base64 = dataUrl.split(',')[1];
              const photo = { preview: dataUrl, base64 };
              setTemplateUploadPhoto(photo);
              setRecentUploads(prev => {
                const updated = [photo, ...prev.filter(p => p.preview !== dataUrl)].slice(0, 6);
                try { localStorage.setItem('fius_recent_template_uploads', JSON.stringify(updated)); } catch {}
                return updated;
              });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />


        {/* ── Browse All Templates — FULLSCREEN ───────────────────────────── */}
        {showAllTemplates && (() => {
          const activeCat = imagineTemplateCategory;
          const filteredTpls = activeCat === 'All' ? STUDIO_VISUAL_TEMPLATES : STUDIO_VISUAL_TEMPLATES.filter(t => t.category === activeCat);

          return (
            <div className="fixed inset-0 z-[999] flex flex-col" style={{ background: resolvedTheme === 'dark' ? '#09090f' : '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

              {/* Top bar: back + close only, no title/icon */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-0">
                <button
                  onClick={() => setShowAllTemplates(false)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                  style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = resolvedTheme === 'dark' ? '#fff' : '#000'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setShowAllTemplates(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition"
                  style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = resolvedTheme === 'dark' ? '#fff' : '#000'; (e.currentTarget as HTMLElement).style.background = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'; (e.currentTarget as HTMLElement).style.background = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter pill bar — exact Minds style */}
              <div className="flex-shrink-0 flex justify-center py-3 px-5">
                <div
                  ref={tplNavRef}
                  className="relative flex items-center gap-1 px-2 py-2"
                  style={{
                    background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 999,
                  }}
                >
                  {/* sliding pill */}
                  {tplPillStyle.ready && (
                    <div aria-hidden style={{
                      position: 'absolute',
                      left: tplPillStyle.left,
                      width: tplPillStyle.width,
                      top: 5, bottom: 5,
                      transition: 'left 0.48s cubic-bezier(0.34,1.56,0.64,1), width 0.48s cubic-bezier(0.34,1.56,0.64,1)',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.09)',
                        borderRadius: 999,
                        boxShadow: resolvedTheme === 'dark' ? '0 1px 10px rgba(255,255,255,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
                        animation: tplPillAnimateRef.current ? 'pill-squish 0.48s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
                      }} />
                    </div>
                  )}
                  {TPL_FILTER_CATS.map((cat, i) => (
                    <button
                      key={cat}
                      ref={el => { tplBtnRefs.current[i] = el; }}
                      onClick={() => { tplPillAnimateRef.current = true; setImagineTemplateCategory(cat); }}
                      className="relative z-10 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-none"
                      style={activeCat === cat && tplPillStyle.ready
                        ? { color: resolvedTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.85)', fontWeight: 600 }
                        : { color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontWeight: 500 }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid — full width, bigger cards */}
              <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'none', contain: 'layout style' }}>
                {activeCat === 'All' ? (
                  <div className="flex flex-col gap-8">
                    {TPL_FILTER_CATS.filter(c => c !== 'All').map(catName => {
                      const catTpls = STUDIO_VISUAL_TEMPLATES.filter(t => t.category === catName);
                      if (!catTpls.length) return null;
                      return (
                        <div key={catName}>
                          <p className="text-[12px] font-semibold mb-3" style={{ color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{catName}</p>
                          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                            {catTpls.map(t => (
                              <button
                                key={t.id}
                                onClick={() => { setShowAllTemplates(false); setImagineTemplateModal({ label: t.name, color: '#111', img: t.thumb, prompt: t.prompt }); setTemplateUploadPhoto(null); }}
                                className="group relative overflow-hidden text-left"
                                style={{ aspectRatio: '9/13', borderRadius: 20, background: resolvedTheme === 'dark' ? '#0e0e16' : '#f0f0f0', boxShadow: resolvedTheme === 'dark' ? '0 8px 28px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px) scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = resolvedTheme === 'dark' ? '0 24px 56px rgba(0,0,0,0.65)' : '0 16px 40px rgba(0,0,0,0.2)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = resolvedTheme === 'dark' ? '0 8px 28px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)'; }}
                              >
                                <img src={t.thumb} alt={t.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.02) 50%,transparent 100%)' }} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' }}>
                                  <span className="px-4 py-1.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>✦ Use this style</span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 px-3 pb-3 group-hover:opacity-0 transition-opacity duration-200">
                                  <span className="block text-[11px] font-bold leading-tight text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,1)' }}>{t.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                    {filteredTpls.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setShowAllTemplates(false); setImagineTemplateModal({ label: t.name, color: '#111', img: t.thumb, prompt: t.prompt }); setTemplateUploadPhoto(null); }}
                        className="group relative overflow-hidden text-left"
                        style={{ aspectRatio: '9/13', borderRadius: 20, background: resolvedTheme === 'dark' ? '#0e0e16' : '#f0f0f0', boxShadow: resolvedTheme === 'dark' ? '0 8px 28px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px) scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = resolvedTheme === 'dark' ? '0 24px 56px rgba(0,0,0,0.65)' : '0 16px 40px rgba(0,0,0,0.2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = resolvedTheme === 'dark' ? '0 8px 28px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)'; }}
                      >
                        <img src={t.thumb} alt={t.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.02) 50%,transparent 100%)' }} />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' }}>
                          <span className="px-4 py-1.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>✦ Use this style</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 px-3 pb-3 group-hover:opacity-0 transition-opacity duration-200">
                          <span className="block text-[11px] font-bold leading-tight text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,1)' }}>{t.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Imagine Gallery Modal ───────────────────────────────────────── */}
        {imagineGalleryOpen && (
          <div
            className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setImagineGalleryOpen(false); }}
          >
            <div className="relative w-full max-w-4xl bg-zinc-950 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" style={{ maxHeight: '88vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m21 15-5-5L5 21"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                  <h3 className="text-lg font-bold text-white">My Gallery</h3>
                  <span className="text-xs text-zinc-500">{imagineMyPhotos.length} photo{imagineMyPhotos.length !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => setImagineGalleryOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
                {imagineMyPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-zinc-700 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m21 15-5-5L5 21"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                    <p className="text-zinc-400 font-semibold text-base mb-1">No photos yet</p>
                    <p className="text-zinc-600 text-sm">Images you generate in Imagine Studio will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[...imagineMyPhotos].reverse().map((photo, i) => (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer hover:border-violet-500/50 transition-all"
                        onClick={() => setFullscreenImg(photo.url)}>
                        <img src={photo.url} alt={photo.prompt || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {photo.prompt && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-end p-3">
                            <p className="text-white text-[11px] leading-snug line-clamp-3">{photo.prompt}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Template Upload Modal ───────────────────────────────────────── */}
        {imagineTemplateModal && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setImagineTemplateModal(null); setTemplateUploadPhoto(null); } }}
          >
            <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#18181b' }}>
              {/* Hero image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={imagineTemplateModal.img}
                  alt={imagineTemplateModal.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0" style={{ background: imagineTemplateModal.color, opacity: 0.4 }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #18181b 0%, transparent 60%)' }} />
                {/* Close */}
                <button
                  onClick={() => { setImagineTemplateModal(null); setTemplateUploadPhoto(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-5 -mt-1">
                <h3 className="text-xl font-bold text-white mb-1">{imagineTemplateModal.label}</h3>
                <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed line-clamp-2">{imagineTemplateModal.prompt.split(',')[0]}.</p>

                {/* Upload area — drag & drop */}
                {!templateUploadPhoto ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.setAttribute('data-drag','1'); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                    onDrop={(e) => {
                      e.preventDefault(); e.currentTarget.style.borderColor = '';
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          const base64 = dataUrl.split(',')[1];
                          const photo = { preview: dataUrl, base64 };
                          setTemplateUploadPhoto(photo);
                          setRecentUploads(prev => {
                            const updated = [photo, ...prev.filter(p => p.preview !== dataUrl)].slice(0, 6);
                            try { localStorage.setItem('fius_recent_template_uploads', JSON.stringify(updated)); } catch {}
                            return updated;
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="relative rounded-2xl border-2 border-dashed border-zinc-600 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center gap-2 py-5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-white">Drag & drop your photo here</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">JPG, PNG, WEBP supported</p>
                    </div>
                    <button
                      onClick={() => templatePhotoInputRef.current?.click()}
                      className="mt-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white/80 hover:text-white transition-all hover:bg-white/15"
                      style={{ background: 'rgba(255,255,255,0.10)' }}
                    >Browse files</button>
                  </div>
                ) : (
                  /* Preview */
                  <div className="relative rounded-2xl overflow-hidden" style={{ height: 130 }}>
                    <img src={templateUploadPhoto.preview} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[11px] text-white font-medium flex-1">✓ Photo ready</span>
                        <button
                          onClick={() => { setTemplateUploadPhoto(null); templatePhotoInputRef.current?.click(); }}
                          className="text-[11px] text-white/70 hover:text-white underline transition-colors"
                        >Change</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recently Uploaded */}
                {recentUploads.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recently Uploaded</p>
                    <div className="flex gap-2 flex-wrap">
                      {recentUploads.map((u, i) => (
                        <button
                          key={i}
                          onClick={() => setTemplateUploadPhoto(u)}
                          className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all hover:scale-110 hover:shadow-lg"
                          style={{ outline: templateUploadPhoto?.preview === u.preview ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.12)', outlineOffset: 2 }}
                        >
                          <img src={u.preview} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (!imagineTemplateModal) return;
                      const t = imagineTemplateModal;
                      setImagineTemplateModal(null);
                      setTemplateUploadPhoto(null);
                      triggerImagineTemplate(t.prompt, null);
                    }}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
                  >✦ Generate directly</button>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => { setImagineTemplateModal(null); setTemplateUploadPhoto(null); }}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    >Cancel</button>
                    <button
                      disabled={!templateUploadPhoto}
                      onClick={() => {
                        if (!templateUploadPhoto || !imagineTemplateModal) return;
                        const t = imagineTemplateModal;
                        const p = templateUploadPhoto;
                        setImagineTemplateModal(null);
                        setTemplateUploadPhoto(null);
                        triggerImagineTemplate(t.prompt, p);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'rgba(255,255,255,0.12)', color: templateUploadPhoto ? 'white' : '#666' }}
                    >Apply to Photo</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      {/* Attachment Dialog */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setIsAttachmentDialogOpen(false);
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              data-testid="attachment-upload-file"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Upload File</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setIsAttachmentDialogOpen(false);
                setTimeout(() => imageInputRef.current?.click(), 100);
              }}
              data-testid="attachment-upload-image"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">Upload Image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Modal */}
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentPreset={currentPreset}
        customInstructions={customInstructions}
        onSave={handleCustomizeSave}
        toggles={settingsToggles}
        aiOrder={aiOrder}
        user={user}
        profilePicture={profilePicture || undefined}
        onUserRename={(newName) => setUser(prev => prev ? { ...prev, username: newName, displayName: newName } : prev)}
        onProfilePictureChange={(dataUrl) => { setProfilePicture(dataUrl); localStorage.setItem('profilePicture', dataUrl); }}
      />

      {/* Image Generation Dialog */}
      <ImageGenerationDialog
        open={isImageGenerationDialogOpen}
        onOpenChange={setIsImageGenerationDialogOpen}
      />

      {/* Education Modal */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        onStartExamination={handleStartExamination}
        onStartSelfListen={handleStartSelfListen}
      />

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        questions={quizQuestions}
        isLoading={quizLoading}
        title={quizTitle}
      />

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeModalOpen}
        onClose={() => setIsVoiceModeModalOpen(false)}
        isListening={isListening}
        onToggleListening={toggleListening}
        isPlaying={false}
        onTogglePlaying={() => {}}
      />

      {/* Imagine Modal — Image Generation GUI */}
      <ImagineModal isOpen={isImagineOpen} onClose={() => setIsImagineOpen(false)} />

      {/* Video Call / Screen Share Modal */}
      <VideoCallModal isOpen={isVideoCallOpen} onClose={() => setIsVideoCallOpen(false)} />

      {/* Nomad Notification - recurring, respects settings toggle, rotates between enabled variants */}
      {showNomadNotification && (settingsToggles.nomadNotification ?? true) && (
        <NomadNotification
          enabledVariants={[
            "nomad",
            ...(settingsToggles.philosopherNotification ?? true ? ["philosopher"] : []),
            ...(settingsToggles.fiusGamesNotification ?? true ? ["fius-games"] : []),
          ]}
          onClose={handleNomadNotifClose}
        />
      )}

      {/* Hidden file input elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={imagineUploadRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const base64 = (ev.target?.result as string)?.split(',')[1] ?? '';
            const preview = ev.target?.result as string;
            setImagineRefImage({ preview, base64 });
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      {/* ── Feedback Dialog ── */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 max-w-sm w-full shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {feedbackType === 'like' ? 'What did you like?' : 'What went wrong?'}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(feedbackType === 'like'
                ? ['Accurate', 'Helpful', 'Well written', 'Clear & concise', 'Creative', 'Other']
                : ['Inaccurate', 'Not helpful', 'Harmful content', 'Off-topic', 'Too long', 'Too short', 'Other']
              ).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFeedbackSelected(prev => {
                    const s = new Set(prev);
                    if (s.has(opt)) s.delete(opt); else s.add(opt);
                    return new Set(s);
                  })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    feedbackSelected.has(opt)
                      ? feedbackType === 'like'
                        ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300'
                        : 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >{opt}</button>
              ))}
            </div>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Add more details (optional)"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setFeedbackOpen(false)}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >Cancel</button>
              <button
                onClick={submitFeedback}
                className={`px-4 py-2 text-sm font-medium rounded-xl text-white transition-all ${
                  feedbackType === 'like'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                }`}
              >Submit</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Fullscreen prompt editor (Gemini-style) ── */}
      {promptFullscreen && (
        <div className="fixed inset-0 z-[9998] bg-background flex flex-col" style={{ animation: "sheetEnter 0.32s cubic-bezier(0.23,1,0.32,1) both" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Type your message</span>
            <button
              onClick={() => { setPromptFullscreen(false); setLongPromptMode(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
          {/* Textarea */}
          <div className="flex-1 overflow-hidden p-5">
            <textarea
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setPromptFullscreen(false); setLongPromptMode(false); }
              }}
              placeholder="Type a detailed prompt here…"
              className="w-full h-full text-[15px] bg-transparent text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none placeholder:text-zinc-400 leading-relaxed"
            />
          </div>
          {/* Bottom bar */}
          <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
            {/* Mic */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleListening}
                    disabled={!speechSupported}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isListening ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"} disabled:opacity-30`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Enhance */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={!inputValue.trim() || isEnhancing}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex-shrink-0 disabled:opacity-30"
                  >
                    {isEnhancing
                      ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      : <Sparkles className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Enhance prompt</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Long Answer toggle */}
            <button
              onClick={() => setLongPromptMode(v => !v)}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-all flex-shrink-0 text-[11px] font-semibold ${longPromptMode ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
            >
              <AlignLeft className="w-3.5 h-3.5 flex-shrink-0" />
              Long
            </button>
            {/* Char count */}
            <span className="text-xs text-zinc-400 flex-1 text-right tabular-nums">
              {inputValue.length > 0 ? inputValue.length : ""}
            </span>
            {/* Cancel */}
            <button
              onClick={() => { setPromptFullscreen(false); setLongPromptMode(false); }}
              className="h-9 px-4 rounded-full text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              Cancel
            </button>
            {/* Done / Send */}
            <button
              onClick={() => {
                if (longPromptMode && inputValue.trim()) {
                  setInputValue(inputValue.trim() + "\n\nPlease provide a very detailed and thorough answer.");
                  setLongPromptMode(false);
                }
                setPromptFullscreen(false);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              disabled={!inputValue.trim()}
              className="h-9 px-5 rounded-full flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-30 transition-all hover:opacity-90 flex-shrink-0"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen image lightbox ── */}
      {fullscreenImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreenImg(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-all text-lg"
            onClick={() => setFullscreenImg(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fullscreenImg}
            alt="Full screen"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>

    {/* ── Nomad disabled model notification ── */}
    <AnimatePresence>
      {nomadDisabledNotif && (
        <motion.div
          key="nomad-notif"
          initial={{ opacity: 0, x: 60, y: -8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 60, y: -8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'fixed',
            top: 18,
            right: 18,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: resolvedTheme === 'dark' ? 'rgba(24,24,28,0.96)' : 'rgba(255,255,255,0.97)',
            border: `1.5px solid ${nomadDisabledNotif.color}44`,
            borderRadius: 999,
            padding: '9px 18px 9px 14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            minWidth: 0,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: nomadDisabledNotif.color, flexShrink: 0, opacity: 0.85 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: resolvedTheme === 'dark' ? '#e4e4e7' : '#18181b', whiteSpace: 'nowrap' }}>
            {nomadDisabledNotif.label}
          </span>
          <span style={{ fontSize: 11, color: resolvedTheme === 'dark' ? 'rgba(200,200,210,0.55)' : 'rgba(80,80,100,0.55)', whiteSpace: 'nowrap' }}>
            disabled · gone to end
          </span>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
    </TooltipProvider>
  );
}
