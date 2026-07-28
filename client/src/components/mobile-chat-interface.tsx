import React, { useState, useRef, useEffect, useCallback, Component, useMemo } from "react";
import { motion } from "framer-motion";

// ── Fius Ultimatum card pool (mirrors desktop) ────────────────────────────────
type UltimatumCardM = { Icon: React.ElementType; label: string; prompt: string; modelName: string; modelLogo: string; color: string };
const ULTIMATUM_CARD_POOL_M: UltimatumCardM[] = [
  { Icon: Brain,         label: 'Deep Reasoning',  prompt: 'Break down a complex problem step by step',    modelName: 'DeepSeek R1', modelLogo: '/deepseek-logo.png',   color: '#6366f1' },
  { Icon: Search,        label: 'Live Search',      prompt: 'Find the latest news and real-time info',      modelName: 'Perplexity',  modelLogo: '/perplexity-logo.png', color: '#0ea5e9' },
  { Icon: PenLine,       label: 'Creative Writing', prompt: 'Write a compelling story or article',          modelName: 'Claude',      modelLogo: '/claude-logo.png',     color: '#ec4899' },
  { Icon: Code,          label: 'Coding',           prompt: 'Debug, explain or write code for me',          modelName: 'GPT-5',       modelLogo: '/chatgpt-logo.png',    color: '#10b981' },
  { Icon: BarChart3,     label: 'Data Analysis',    prompt: 'Analyse data and uncover hidden insights',     modelName: 'Gemini',      modelLogo: '/gemini-logo.png',     color: '#f59e0b' },
  { Icon: Palette,       label: 'Design Ideas',     prompt: 'Generate UI/UX or visual concepts',            modelName: 'Claude',      modelLogo: '/claude-logo.png',     color: '#8b5cf6' },
  { Icon: TestTube2,     label: 'Science & Math',   prompt: 'Explain complex concepts in simple terms',     modelName: 'Gemini',      modelLogo: '/gemini-logo.png',     color: '#06b6d4' },
  { Icon: AlignLeft,     label: 'Summarise',        prompt: 'Condense a long text into key points',         modelName: 'GPT-5',       modelLogo: '/chatgpt-logo.png',    color: '#64748b' },
  { Icon: Lightbulb,     label: 'Brainstorm',       prompt: 'Generate a flood of creative ideas',           modelName: 'Claude',      modelLogo: '/claude-logo.png',     color: '#eab308' },
  { Icon: Cpu,           label: 'AI Strategy',      prompt: 'How to automate and scale using AI',           modelName: 'GPT-5',       modelLogo: '/chatgpt-logo.png',    color: '#a855f7' },
  { Icon: TrendingUp,    label: 'Business Plan',    prompt: 'Build a go-to-market or growth strategy',      modelName: 'Grok 4',      modelLogo: '/grok-logo.png',       color: '#ef4444' },
  { Icon: BookOpenCheck, label: 'Research',         prompt: 'Deep-dive research with cited sources',        modelName: 'Perplexity',  modelLogo: '/perplexity-logo.png', color: '#3b82f6' },
  { Icon: Globe,         label: 'Translation',      prompt: 'Translate with cultural nuance intact',        modelName: 'DeepSeek',    modelLogo: '/deepseek-logo.png',   color: '#f97316' },
  { Icon: Zap,           label: 'Quick Answer',     prompt: 'Fast, precise answer to any question',         modelName: 'Fius',        modelLogo: '/fius-logo.png',       color: '#fbbf24' },
  { Icon: Target,        label: 'Problem Solving',  prompt: 'Find the best path through any challenge',     modelName: 'DeepSeek R1', modelLogo: '/deepseek-logo.png',   color: '#f43f5e' },
  { Icon: GraduationCap, label: 'Learning',         prompt: 'Teach me something new from scratch',          modelName: 'Gemini',      modelLogo: '/gemini-logo.png',     color: '#0891b2' },
  { Icon: MessageSquare, label: 'Debate & Argue',   prompt: 'Build the strongest case for a position',      modelName: 'Claude',      modelLogo: '/claude-logo.png',     color: '#d946ef' },
  { Icon: Shield,        label: 'Security',         prompt: 'Audit or explain security vulnerabilities',    modelName: 'GPT-5',       modelLogo: '/chatgpt-logo.png',    color: '#475569' },
  { Icon: Leaf,          label: 'Life Advice',      prompt: 'Help me think through a life decision',        modelName: 'Claude',      modelLogo: '/claude-logo.png',     color: '#16a34a' },
  { Icon: Rocket,        label: 'Startup Ideas',    prompt: 'Validate or refine my startup concept',        modelName: 'Grok 4',      modelLogo: '/grok-logo.png',       color: '#7c3aed' },
];
function shuffleUltimatumM<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
import { useQuery } from "@tanstack/react-query";
import { FiusGames, preloadGamesData } from "./fius-games";
import { getCachedWikiImage, fetchWikiImage, preloadWikiImages } from "@/lib/wiki-image-cache";
import { FiusLogo, Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
import { UpgradeModal } from "./upgrade-modal";
import { EducationModal } from "./education-modal";
import { QuizModal, type QuizQuestion } from "./quiz-modal";
import { NomadNotification } from "./nomad-notification";
import { useTheme } from "./theme-provider";
import {
  X, ArrowUp, Menu, Check, ChevronRight, Download, ChevronLeft,
  Mic, FileText, Image, Sun, Moon, Monitor, AudioLines, Globe,
  RefreshCcw, Palette, ChevronDown, Trash2, Camera, Sparkles,
  Brain, Search, PenTool, Filter, ChevronUp, Database, Sliders,
  User, Pencil, Laptop, GraduationCap, RefreshCw, Target, Share2,
  Heart, Wand2, Edit, Maximize2, Minimize2, Copy, ThumbsUp, ThumbsDown, Volume2,
  MessageSquarePlus, FileDown, Square, AlignLeft, History, MoreHorizontal, Loader2,
  GripVertical, Plus, Paperclip, FileSignature, Zap, BookOpen, TrendingUp, Lightbulb,
  Code, MessageSquare, Lock, Upload, LayoutGrid,
  PenLine, BarChart3, TestTube2, Cpu, BookOpenCheck, Shield, Leaf, Rocket,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { downloadTxt, downloadPdf } from "@/lib/document-export";
import { downloadWordDoc } from "@/lib/docx-export";
import { downloadPptx } from "@/lib/pptx-export";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUsage } from "@/hooks/use-usage";
import { getStoredGlowAccent, getGlowGradient, getStoredLogoStyle, getStoredAutoRotateLogo, persistLogoStyle, persistAutoRotateLogo, assignLogoStyleToConversation, LOGO_STYLE_OPTIONS, DEFAULT_LOGO_STYLE, type LogoStyle } from "@/lib/appearance-settings";
import { queryClient, apiRequest, authFetch, endGuestSession } from "@/lib/queryClient";
import { getVibrantColor } from "@/lib/utils";
import microphoneIcon from "@assets/microphone__1784996516975.png";
import improvePromptIcon from "@assets/improve_promt__1784996516976.png";
import plusButtonIcon from "@assets/plus_button__1784996516977.png";
import studioHero from "@assets/Gemini_Generated_Image_rdsaverdsaverdsa_1784927084436.png";

// ─── Minimal Mode context — kept for compatibility, always false ──────────────
const MinimalModeCtx = React.createContext(false);
const useMinimalMode = () => false;

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

interface Msg { id: string; role: "user" | "ai"; content: string; imageUrl?: string; timestamp: Date; isGenerating?: boolean; images?: string[]; attachedFiles?: Array<{name: string; size: string; content?: string}>; isDocument?: boolean; documentTitle?: string; }
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

const MUS = (id: string) => `https://images.unsplash.com/photo-${id}?w=240&h=320&fit=crop&q=90&auto=format`;

/* Mobile studio templates — Unsplash high-quality images (30+) */
const MOBILE_STUDIO_TEMPLATES = [
  { label: "Monsoon Mood",      image: MUS('1534438327276-14e5300c3a48'), prompt: "cozy rainy day scene, steaming hot coffee cup on wooden windowsill, warm candlelight glow, moody atmospheric lighting" },
  { label: "Portrait",          image: MUS('1531746020798-e6953c6e8e04'), prompt: "A polished realistic portrait with soft studio lighting" },
  { label: "Pro Headshot",      image: MUS('1560250097-0b93528c311a'),    prompt: "professional business headshot, neutral background, confident expression, sharp focus" },
  { label: "Anime",             image: MUS('1607604276583-eef5d076aa5f'), prompt: "A cozy anime café on a rainy evening" },
  { label: "Ghibli Style",      image: MUS('1518020382113-a7e8fc38eac9'), prompt: "Studio Ghibli art style, soft warm colors, magical atmosphere" },
  { label: "Cinematic",         image: MUS('1478720568477-152d9b164e26'), prompt: "cinematic wide shot, anamorphic lens flare, dramatic film lighting, Hollywood quality" },
  { label: "3D Render",         image: MUS('1633356122544-f134324a6cee'), prompt: "3D CGI rendered artwork, Blender Cycles render, ray tracing, HDRI lighting" },
  { label: "Cyberpunk",         image: MUS('1515630278258-407f994537ee'), prompt: "cyberpunk aesthetic, neon lights on rain-slicked streets, electric blues and magentas" },
  { label: "Fantasy Art",       image: MUS('1518709268805-4e9042af9f05'), prompt: "epic fantasy illustration, dramatic magical lighting, painterly digital art masterpiece" },
  { label: "Nature Photo",      image: MUS('1506905925346-21bda4d32df4'), prompt: "golden hour nature photography, National Geographic quality, breathtaking landscape" },
  { label: "Travel",            image: MUS('1476514525535-07fb3b4ae5f1'), prompt: "travel photography, iconic landmark, deep blue sky, vibrant colors, wanderlust" },
  { label: "Fashion",           image: MUS('1515886657613-9f3515b0c78f'), prompt: "high fashion editorial photography, Vogue quality, dramatic studio lighting" },
  { label: "Wedding",           image: MUS('1519741497674-611481863552'), prompt: "romantic wedding photography, golden hour backlight, soft bokeh, elegant" },
  { label: "Interior",          image: MUS('1586023492125-27b2c045efd7'), prompt: "interior design visualization, cozy atmosphere, Architectural Digest quality" },
  { label: "Architecture",      image: MUS('1487958449943-2429e8be8625'), prompt: "modern architecture visualization, photorealistic, natural lighting" },
  { label: "Food Photo",        image: MUS('1476224203421-9ac39bcb3327'), prompt: "professional food photography, appetizing golden lighting, restaurant quality" },
  { label: "Product Photo",     image: MUS('1523275335684-37898b6baf30'), prompt: "professional product photography, clean studio background, commercial quality" },
  { label: "Street Photo",      image: MUS('1477959858617-67f85cf4f1df'), prompt: "urban street photography, candid documentary style, city life" },
  { label: "Oil Painting",      image: MUS('1578321272176-b7bbc0679853'), prompt: "classical oil painting, impressionist brushwork, old master technique, museum quality" },
  { label: "Watercolor",        image: MUS('1579783902614-a3fb3927b6a5'), prompt: "delicate watercolor painting, soft transparent washes, artistic brushstrokes" },
  { label: "Sketch",            image: MUS('1541961017774-22349e4a1262'), prompt: "A detailed hand-drawn pencil sketch with fine shading" },
  { label: "Pixel Art",         image: MUS('1550745165-9bc0b252726f'), prompt: "pixel art style, 8-bit retro game art, pixelated aesthetic, vibrant flat colors" },
  { label: "Vintage Film",      image: MUS('1516466723902-9b53e71d8f3e'), prompt: "vintage film photography, grain texture, warm sepia tones, analog camera" },
  { label: "Neon Art",          image: MUS('1563089145-4e46e3f6f0e2'), prompt: "neon art aesthetic, glowing electric neon signs, vivid electric colors" },
  { label: "Abstract",          image: MUS('1541701494-b6c18b2b97c1'), prompt: "abstract digital art, vibrant flowing colors, geometric organic patterns" },
  { label: "Surrealist",        image: MUS('1518020382113-a7e8fc38eac9'), prompt: "surrealist art style, dreamlike impossible scenario, Salvador Dali inspired" },
  { label: "Steampunk",         image: MUS('1535083534998-4d2e7f4fd0fe'), prompt: "steampunk Victorian aesthetic, brass gears, goggles, copper tones, mechanical" },
  { label: "Vaporwave",         image: MUS('1519389950473-47ba0277781c'), prompt: "vaporwave aesthetic, pastel pinks and purples, retro 80s nostalgia" },
  { label: "Claymation",        image: MUS('1558618666-fcd25c85cd64'), prompt: "claymation stop motion style, tactile clay texture, playful 3D characters" },
  { label: "Comic Book",        image: MUS('1612036782180-6b785e6c7a12'), prompt: "comic book art style, bold ink outlines, halftone dots, dynamic action lines" },
  { label: "Pop Art",           image: MUS('1561070791-2526bdc3d2f5'), prompt: "Andy Warhol pop art style, bold flat colors, halftone pattern, high contrast" },
  { label: "Poster Art",        image: MUS('1547891654-e66ed7ebb968'), prompt: "graphic design poster art, bold striking composition, high impact visual design" },
  { label: "Impressionist",     image: MUS('1592621385612-4d7129426394'), prompt: "impressionist painting, loose expressive brushstrokes, Monet technique" },
  { label: "Style Upgrade",     image: MUS('1560250097-0b93528c311a'), prompt: "Upgrade this photo into a refined editorial image" },
];

const NOMAD_CONFIG: Record<string, { name: string; logo: string; color: string; description: string }> = {
  "gpt-4o":          { name: "GPT-5.5 Pro",           logo: "/chatgpt-logo.png",    color: "#10a37f", description: "Advanced reasoning & multimodal AI by OpenAI" },
  "claude-3.5-sonnet":{ name: "Claude Fable 5",       logo: "/claude-logo.png",     color: "#f97316", description: "Nuanced writing, analysis & coding" },
  "gemini-pro":      { name: "Gemini 3.1 Pro",       logo: "/gemini-logo.png",     color: "#14b8a6", description: "Google's multimodal reasoning model" },
  "perplexity":      { name: "Perplexity Sonar Pro",   logo: "/kimi-logo.png",       color: "#38bdf8", description: "Real-time web search & cited answers" },
  "grok-4":          { name: "Grok 4.3",               logo: "/grok-logo.png",       color: "#6b7280", description: "xAI's witty, curious & unfiltered model" },
  "deepseek-r1":     { name: "DeepSeek-V4-Pro",        logo: "/deepseek-logo.png",   color: "#3b82f6", description: "Open-source reasoning & coding" },
  "doubao":          { name: "Doubao Seed 2.0 Pro",    logo: "/qwen-logo.png",       color: "#f59e0b", description: "ByteDance's multilingual smart assistant" },
  "kimi":            { name: "Kimi K2.7 Code",         logo: "/perplexity-logo.png", color: "#06b6d4", description: "Moonshot's long-context language model" },
  "qwen":            { name: "Qwen 3.7 Max",           logo: "/mistral-logo.png",    color: "#6366f1", description: "Alibaba's multilingual language expert" },
  "llama-4":         { name: "Llama 4 Maverick",       logo: "/llama-logo.png",      color: "#3b82f6", description: "Meta's open-source frontier AI model" },
  "mistral":         { name: "Mistral Medium 3.5",     logo: "/doubao-logo.png",     color: "#7c3aed", description: "Fast & efficient European open AI" },
  "fius-ai":         { name: "Fius Pro",               logo: "/fius-logo.png",       color: "#a855f7", description: "Specialized productivity AI by Muzamil Ali" },
};

const NOMAD_DEFAULT_MODELS = ["fius-ai", "gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "doubao", "kimi", "qwen", "llama-4", "mistral"];

// ─── Nomad session type (shared between NomadTab and parent) ─────────────────
type NomadSession = {
  id: string; ts: number; mode: 'multi' | 'auto'; preview: string;
  autoMsgs: { id: string; role: 'user' | 'ai'; content: string; pickedModel?: { model: string; modelName: string; logo: string; color: string } }[];
  multiMsgs: Record<string, { id: string; role: string; content: string }[]>;
};

const PRESETS = [
  { id: "custom", label: "Custom", desc: "Default style" },
  { id: "concise", label: "Concise", desc: "Brief & direct" },
  { id: "formal", label: "Formal", desc: "Professional tone" },
  { id: "socratic", label: "Socratic", desc: "Asks questions" },
];

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

const ALL_SUGGESTION_CARDS = [
  { icon: <Search className="w-4 h-4 text-orange-400" />, title: "Research & analysis", desc: "Deep dive into any topic", prompt: "Analyze the benefits of renewable energy sources" },
  { icon: <PenTool className="w-4 h-4 text-blue-400" />, title: "Creative writing", desc: "Stories, essays, content", prompt: "Write a short story about time travel" },
  { icon: <Brain className="w-4 h-4 text-purple-400" />, title: "Brainstorm ideas", desc: "Generate fresh concepts", prompt: "Give me 10 creative business ideas for 2025" },
  { icon: <Zap className="w-4 h-4 text-yellow-400" />, title: "Explain anything", desc: "Break down complex topics", prompt: "Explain quantum computing in simple terms" },
  { icon: <BookOpen className="w-4 h-4 text-indigo-400" />, title: "Learn something new", desc: "Expand your knowledge", prompt: "Teach me about machine learning basics" },
  { icon: <Target className="w-4 h-4 text-red-400" />, title: "Problem solving", desc: "Work through challenges", prompt: "Help me plan a productive daily routine" },
  { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, title: "Career advice", desc: "Grow professionally", prompt: "How do I transition into a software engineering career?" },
  { icon: <Lightbulb className="w-4 h-4 text-amber-400" />, title: "Fun facts", desc: "Discover interesting things", prompt: "Tell me 5 surprising facts about the universe" },
  { icon: <Code className="w-4 h-4 text-green-400" />, title: "Code help", desc: "Debug or write code", prompt: "Help me write a Python function to sort a list" },
  { icon: <MessageSquare className="w-4 h-4 text-cyan-400" />, title: "Improve writing", desc: "Polish any text", prompt: "Make this email sound more professional: 'Hey, can we meet?'" },
  { icon: <Globe className="w-4 h-4 text-teal-400" />, title: "Travel planning", desc: "Plan your next trip", prompt: "Plan a 5-day trip to Japan on a budget" },
  { icon: <GraduationCap className="w-4 h-4 text-pink-400" />, title: "Study help", desc: "Ace your exams", prompt: "Quiz me on the causes of World War 1" },
];

const WELCOME_HEADINGS = [
  "What's on your mind?",
  "What would you like to explore?",
  "Ready to dive in?",
  "Where shall we begin?",
  "Got something to ask?",
  "Let's get started:",
  "What can I help with?",
  "Pick a topic or ask anything:",
];

const getRandomCards = () => {
  const shuffled = [...ALL_SUGGESTION_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const getRandomHeading = () => WELCOME_HEADINGS[Math.floor(Math.random() * WELCOME_HEADINGS.length)];

const WELCOME_GREETINGS_M: ((name: string) => string)[] = [
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

function pickGreetingIndexM(seed: string | undefined): number {
  if (!seed) return Math.floor(Math.random() * WELCOME_GREETINGS_M.length);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % WELCOME_GREETINGS_M.length;
  return hash;
}

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
// Uses the shared cache (client/src/lib/wiki-image-cache.ts) so avatars warmed
// by the desktop surface or by this component's own eager preload (see the
// PHILOSOPHERS preload effect below) are instantly available here too —
// avatars no longer pop in one-by-one only after the tab is opened.
function WikiFace({ name, wikiTitle, size = 36 }: { name: string; wikiTitle?: string; size?: number }) {
  const articleTitle = wikiTitle || name;
  const [src, setSrc] = useState<string | null>(getCachedWikiImage(articleTitle) ?? null);
  useEffect(() => {
    const cached = getCachedWikiImage(articleTitle);
    if (cached) { setSrc(cached); return; }
    let cancelled = false;
    fetchWikiImage(articleTitle).then(url => { if (!cancelled && url) setSrc(url); });
    return () => { cancelled = true; };
  }, [articleTitle]);
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 border border-border/50"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover object-top" />
        : <span className="text-white font-bold" style={{ fontSize: size * 0.42 }}>{name.charAt(0)}</span>}
    </div>
  );
}

// ─── Typing animation cache (module-level so it survives re-renders) ──────────
const _completedMsgs = new Map<string, boolean>();
const _progressMsgs = new Map<string, string>();

function useTypingAnimation(text: string, msgId: string, wordsPerSec: number = 80) {
  // Time-based reveal — speed stays identical on 60Hz or 120Hz+ displays.
  // 80 words/sec: comfortable mid-speed with smooth per-word fade-in.
  const [displayed, setDisplayed] = useState(() =>
    _completedMsgs.has(msgId) ? text : (_progressMsgs.get(msgId) ?? "")
  );
  const [done, setDone] = useState(() => _completedMsgs.has(msgId));
  // freshWordIdx tracks where newly-revealed words start so the renderer
  // can apply a CSS fade-in only to words that just appeared.
  const [freshWordIdx, setFreshWordIdx] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (_completedMsgs.has(msgId)) { setDisplayed(text); setDone(true); return; }
    if (!text) { setDisplayed(""); setDone(false); return; }
    setDone(false);
    const words = text.split(" ").filter(w => w.trim());
    const existing = _progressMsgs.get(msgId) ?? "";
    let idx = existing ? existing.split(" ").filter(w => w.trim()).length : 0;
    let carry = 0;
    let last: number | null = null;
    const step = (now: number) => {
      if (last === null) last = now;
      const dt = now - last;
      last = now;
      carry += (dt / 1000) * wordsPerSec;
      const advance = Math.floor(carry);
      if (advance > 0) {
        carry -= advance;
        const prevIdx = idx;
        idx = Math.min(idx + advance, words.length);
        setFreshWordIdx(prevIdx);
      }
      if (idx < words.length) {
        const next = words.slice(0, idx).join(" ");
        setDisplayed(next); _progressMsgs.set(msgId, next);
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(text); _progressMsgs.delete(msgId);
        setDone(true); _completedMsgs.set(msgId, true);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [text, msgId, wordsPerSec]);
  return { displayed, done, freshWordIdx };
}

// ─── Micro components ─────────────────────────────────────────────────────────
function ThinkingCloud({ label = "Thinking" }: { label?: string }) {
  const { theme } = useTheme();
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  const isLight = resolvedTheme !== 'dark';
  const cloudPath = "M 12 58 Q 2 58 2 48 Q 2 36 14 33 Q 10 16 28 13 Q 41 2 58 13 Q 71 2 90 13 Q 104 2 121 13 Q 136 2 151 14 Q 165 6 169 24 Q 182 24 184 41 Q 186 58 170 60 Z";
  const W = 196, H = 66;
  return (
    <div className="flex justify-start mb-2">
      <div className="thinking-cloud-wrapper" style={{ position: "relative", width: W, height: H }}>
        <svg
          viewBox={`0 0 ${W} ${H}`} width={W} height={H}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path
            d={cloudPath}
            fill={isLight ? "rgba(255,255,255,0.98)" : "rgba(22,22,28,0.78)"}
            stroke={isLight ? "rgba(160,165,180,0.8)" : "rgba(255,255,255,0.12)"}
            strokeWidth="1.5" strokeLinejoin="round"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingLeft: 10, paddingRight: 18, zIndex: 1 }}>
          <span className="thinking-label" style={isLight ? {
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
}

// ─── Scroll buttons with fade when at limit ────────────────────────────────────
function ScrollButtons({ scrollAreaRef }: { scrollAreaRef: React.RefObject<HTMLDivElement | null> }) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  useEffect(() => {
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
  const btnBase = "w-7 h-7 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-200 active:scale-90";
  return (
    <div className="fixed bottom-28 right-3 flex flex-col gap-1.5 z-50">
      <button
        onClick={() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        disabled={atTop}
        className={`${btnBase} ${atTop ? "opacity-30 cursor-default" : "text-muted-foreground hover:text-foreground"}`}>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })}
        disabled={atBottom}
        className={`${btnBase} ${atBottom ? "opacity-30 cursor-default" : "text-muted-foreground hover:text-foreground"}`}>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Settings scroll-to-top/bottom buttons — hide completely at limits ────────
function SettingsScrollButtons({ scrollAreaRef }: { scrollAreaRef: React.RefObject<HTMLDivElement | null> }) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 8);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
      setScrollable(el.scrollHeight - el.clientHeight > 20);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [scrollAreaRef]);
  if (!scrollable || (atTop && atBottom)) return null;
  const btnBase = "w-8 h-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-200 active:scale-90 text-muted-foreground hover:text-foreground";
  return (
    <div className="sticky bottom-3 float-right mr-1 flex flex-col gap-1.5 z-20">
      {!atTop && (
        <button onClick={() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} className={btnBase}>
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
      {!atBottom && (
        <button onClick={() => scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: 'smooth' })} className={btnBase}>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Syntax highlighter ───────────────────────────────────────────────────────
const LANG_KW: Record<string, string[]> = {
  js:   ['const','let','var','function','return','if','else','for','while','class','import','export','from','of','in','new','this','true','false','null','undefined','async','await','try','catch','throw','switch','case','break','continue','typeof','instanceof','default','void','delete','do'],
  ts:   ['const','let','var','function','return','if','else','for','while','class','import','export','from','of','in','new','this','true','false','null','undefined','async','await','try','catch','throw','type','interface','extends','implements','readonly','public','private','protected','enum','string','number','boolean','void','any','never','unknown','switch','case','break','continue','default','keyof','as','is','declare'],
  py:   ['def','class','import','from','return','if','elif','else','for','while','in','not','and','or','True','False','None','pass','break','continue','with','as','try','except','finally','lambda','yield','self','print','is','del','global','nonlocal','raise','assert','async','await'],
  java: ['public','private','protected','class','interface','extends','implements','return','if','else','for','while','new','this','static','void','int','String','boolean','import','package','try','catch','throw','finally','abstract','final','super','null','true','false'],
  bash: ['echo','cd','ls','mkdir','rm','cp','mv','cat','grep','awk','sed','chmod','sudo','apt','npm','pip','git','curl','wget','if','then','fi','for','do','done','while','function','return','exit','export','source'],
  css:  ['display','flex','grid','position','absolute','relative','fixed','sticky','color','background','border','margin','padding','width','height','overflow','opacity','transform','transition','animation','content','cursor'],
  html: ['html','head','body','div','span','p','a','img','ul','ol','li','h1','h2','h3','nav','header','footer','main','section','form','input','button','textarea','select'],
};
function tokenizeLine(line: string, kwSet: Set<string>, lang: string, base: number): React.ReactNode[] {
  const toks: React.ReactNode[] = [];
  let i = 0;
  while (i < line.length) {
    if ((lang !== 'py' && lang !== 'bash' && line[i] === '/' && line[i+1] === '/') ||
        ((lang === 'py' || lang === 'bash') && line[i] === '#')) {
      toks.push(<span key={base+i} style={{ color:'#6b7280', fontStyle:'italic' }}>{line.slice(i)}</span>);
      return toks;
    }
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i]; let j = i + 1;
      while (j < line.length) { if (line[j] === '\\') { j += 2; continue; } if (line[j] === q) { j++; break; } j++; }
      toks.push(<span key={base+i} style={{ color:'#86efac' }}>{line.slice(i, j)}</span>);
      i = j; continue;
    }
    if (/\d/.test(line[i]) && (i === 0 || /\W/.test(line[i-1]))) {
      let j = i; while (j < line.length && /[\d._]/.test(line[j])) j++;
      toks.push(<span key={base+i} style={{ color:'#fb923c' }}>{line.slice(i, j)}</span>);
      i = j; continue;
    }
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i; while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (kwSet.has(word)) toks.push(<span key={base+i} style={{ color:'#818cf8' }}>{word}</span>);
      else if (/^[A-Z]/.test(word) && word.length > 1) toks.push(<span key={base+i} style={{ color:'#67e8f9' }}>{word}</span>);
      else toks.push(<span key={base+i} style={{ color:'#e2e8f0' }}>{word}</span>);
      i = j; continue;
    }
    if (/[{}()[\]=<>!+\-*/%&|^~?,;:]/.test(line[i])) {
      toks.push(<span key={base+i} style={{ color:'#94a3b8' }}>{line[i]}</span>);
    } else { toks.push(<span key={base+i}>{line[i]}</span>); }
    i++;
  }
  return toks;
}
function tokenizeCode(code: string, lang: string): React.ReactNode {
  const nl = lang.toLowerCase().replace('typescript','ts').replace('javascript','js').replace('python','py').replace(/^sh$|^shell$/,'bash');
  const kwSet = new Set(LANG_KW[nl] || LANG_KW['js'] || []);
  const lines = code.split('\n');
  const result: React.ReactNode[] = [];
  lines.forEach((line, li) => {
    result.push(...tokenizeLine(line, kwSet, nl, li * 10000));
    if (li < lines.length - 1) result.push('\n');
  });
  return result;
}

// ─── Mobile markdown renderer — parses bold, lists, code/text copy-boxes ──────
function MobileMarkdown({ text }: { text: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copyBlock = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500);
  };

  // Split on ``` fences
  const parts: Array<{ type: 'text' | 'code' | 'block'; content: string; lang?: string }> = [];
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIdx = 0; let m;
  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push({ type: 'text', content: text.slice(lastIdx, m.index) });
    const lang = m[1].trim();
    parts.push({ type: lang ? 'code' : 'block', content: m[2].replace(/\n$/, ''), lang: lang || undefined });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push({ type: 'text', content: text.slice(lastIdx) });

  let blockIdx = 0;
  return (
    <div className="text-[13.5px] leading-relaxed text-foreground py-1">
      {parts.map((part, pi) => {
        if (part.type === 'code' || part.type === 'block') {
          const idx = blockIdx++;
          const isCode = part.type === 'code';
          return (
            <div key={pi} className={`my-2 rounded-xl overflow-hidden border ${isCode ? "border-zinc-700/80" : "border-border bg-secondary/60"}`} style={isCode ? { background: '#0d1117' } : {}}>
              <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isCode ? "bg-zinc-800/80 border-zinc-700/60" : "bg-muted/60 border-border"}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isCode ? "text-zinc-400" : "text-muted-foreground"}`}>
                  {isCode ? (part.lang || "code") : "text"}
                </span>
                <button onClick={() => copyBlock(part.content, idx)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-all active:scale-90 ${isCode ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                  {copiedIdx === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedIdx === idx ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className={`px-3 py-3 text-[12px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] font-mono ${isCode ? "bg-[#0d1117]" : ""}`}>
                {isCode ? tokenizeCode(part.content, part.lang || '') : part.content}
              </pre>
            </div>
          );
        }
        // Render text segments with basic markdown
        const lines = part.content.split('\n');
        return (
          <div key={pi}>
            {lines.map((line, li) => {
              // Numbered list
              const numMatch = line.match(/^(\d+)\.\s+(.+)/);
              if (numMatch) return (
                <div key={li} className="flex gap-2 mb-0.5">
                  <span className="text-muted-foreground font-medium flex-shrink-0 min-w-[1.2rem]">{numMatch[1]}.</span>
                  <span className="[overflow-wrap:anywhere]">{renderInline(numMatch[2])}</span>
                </div>
              );
              // Bullet list
              const bulletMatch = line.match(/^[\*\-•]\s+(.+)/);
              if (bulletMatch) return (
                <div key={li} className="flex gap-2 mb-0.5">
                  <span className="text-muted-foreground flex-shrink-0 mt-0.5">•</span>
                  <span className="[overflow-wrap:anywhere]">{renderInline(bulletMatch[1])}</span>
                </div>
              );
              // Heading
              const h3 = line.match(/^###\s+(.+)/);
              if (h3) return <p key={li} className="font-semibold text-[14px] mt-2 mb-0.5 [overflow-wrap:anywhere]">{renderInline(h3[1])}</p>;
              const h2 = line.match(/^##\s+(.+)/);
              if (h2) return <p key={li} className="font-bold text-[15px] mt-2 mb-1 [overflow-wrap:anywhere]">{renderInline(h2[1])}</p>;
              const h1 = line.match(/^#\s+(.+)/);
              if (h1) return <p key={li} className="font-extrabold text-[16px] mt-3 mb-1 [overflow-wrap:anywhere]">{renderInline(h1[1])}</p>;
              // Horizontal rule
              if (/^---+$/.test(line.trim())) return <hr key={li} className="my-2 border-border/50" />;
              // Empty line → spacing
              if (!line.trim()) return <div key={li} className="h-2" />;
              return <p key={li} className="mb-0.5 [overflow-wrap:anywhere]">{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0; let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith('**')) parts.push(<strong key={m.index} className="font-semibold">{m[2]}</strong>);
    else if (m[0].startsWith('*')) parts.push(<em key={m.index}>{m[3]}</em>);
    else parts.push(<code key={m.index} className="bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

// ─── File chip with tap-to-preview content ────────────────────────────────────
function FileChips({ files }: { files: Array<{name: string; size: string; content?: string}> }) {
  const [preview, setPreview] = useState<{name: string; content: string} | null>(null);
  return (
    <>
      <div className="flex flex-col gap-1 w-full items-end">
        {files.map((f, i) => (
          <button key={i} onClick={() => f.content ? setPreview({ name: f.name, content: f.content }) : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-card border border-border shadow-sm max-w-[220px] text-left transition-all active:scale-95 ${f.content ? "cursor-pointer hover:bg-accent" : "cursor-default"}`}>
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground">{f.size}{f.content ? " · tap to view" : ""}</p>
            </div>
          </button>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex flex-col" onClick={() => setPreview(null)}>
          <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 bg-zinc-900" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-white truncate flex-1 mr-3">{preview.name}</p>
            <button onClick={() => setPreview(null)} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4" onClick={e => e.stopPropagation()}>
            <pre className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap break-words font-mono">{preview.content}</pre>
          </div>
        </div>
      )}
    </>
  );
}

function detectVoiceForText(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK-AsadNeural';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN-MadhurNeural';
  if (/\b(hai|hain|kya|aap|mein|nahi|haan|bhi|toh|ab|jo|ke|ka|ki|ko|yeh|woh|tha|thi|theek|accha|lekin|phir|kaisa|matlab|bilkul|kyun|kaise|kab|kaun|kahan|aaj|agar|tum|hum)\b/i.test(text)) return 'ur-PK-AsadNeural';
  return 'en-US-GuyNeural';
}

function FollowUpSuggestions({ msgContent, onSelect }: { msgContent: string; onSelect: (q: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    authFetch('/api/suggest-followups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msgContent.slice(0, 700) }),
    }).then(r => r.json()).then(d => {
      if (!cancelled && Array.isArray(d.suggestions) && d.suggestions.length > 0) setSuggestions(d.suggestions.slice(0, 3));
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => <div key={i} className="h-7 w-full rounded-full bg-accent animate-pulse" />)}
    </div>
  );
  if (!suggestions.length) return null;
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent text-[11.5px] text-foreground font-medium transition-all active:scale-95 text-left shadow-sm flex items-center gap-1.5">
          <span className="text-muted-foreground text-[13px] leading-none">⤷</span>
          {s}
        </button>
      ))}
    </div>
  );
}

function MsgBubble({ msg, onExpandImg, onNewChat, onRetry, onRetryUser, isLatest, onFollowUp, isStreaming, ownMode, showUserMsgActions, showAiMsgActions }: { msg: Msg; onExpandImg?: (s: string) => void; onNewChat?: (content: string) => void; onRetry?: () => void; onRetryUser?: (content: string) => void; isLatest?: boolean; onFollowUp?: (q: string) => void; isStreaming?: boolean; ownMode?: boolean; showUserMsgActions?: boolean; showAiMsgActions?: boolean }) {
  const { resolvedTheme } = useTheme();
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [msgExpanded, setMsgExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"up" | "down">("up");
  const [feedbackSelected, setFeedbackSelected] = useState<Set<string>>(new Set());
  const [feedbackText, setFeedbackText] = useState("");
  const [docExportingId, setDocExportingId] = useState<string | null>(null);
  const audioSrcRef = useRef<AudioBufferSourceNode | null>(null);

  // Keep the word reveal in this stable, module-scoped hook. The cache lets a
  // parent update resume from the same word instead of remounting the bubble.
  const typing = useTypingAnimation(msg.content, msg.id, 30);
  const done = isUser ? true : typing.done;
  const shownText = isUser ? msg.content : typing.displayed;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || msg.imageUrl || "");
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const handleSpeak = async () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      if (audioSrcRef.current) { try { audioSrcRef.current.stop(); } catch {} audioSrcRef.current = null; }
      setSpeaking(false); return;
    }
    setSpeaking(true);
    const voice = detectVoiceForText(msg.content);
    try {
      const res = await authFetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ text: msg.content.slice(0, 3000), voice }),
      });
      if (!res.ok) throw new Error('tts');
      const { audio } = await res.json();
      if (!audio) throw new Error('no-audio');
      const bin = atob(audio); const buf = new ArrayBuffer(bin.length); const view = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const src = ctx.createBufferSource(); src.buffer = decoded; src.connect(ctx.destination);
      audioSrcRef.current = src;
      src.onended = () => { setSpeaking(false); audioSrcRef.current = null; };
      src.start(0);
    } catch {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg.content);
      u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  };
  const handleExport = () => {
    const blob = new Blob([msg.content], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fius-export.txt"; a.click();
  };
  const handleLike = () => {
    const next = liked === "up" ? null : "up";
    setLiked(next);
    if (next === "up") { setFeedbackType("up"); setFeedbackSelected(new Set()); setFeedbackText(""); setFeedbackOpen(true); }
  };
  const handleDislike = () => {
    const next = liked === "down" ? null : "down";
    setLiked(next);
    if (next === "down") { setFeedbackType("down"); setFeedbackSelected(new Set()); setFeedbackText(""); setFeedbackOpen(true); }
  };
  const toggleFbOpt = (opt: string) => setFeedbackSelected(prev => { const s = new Set(prev); s.has(opt) ? s.delete(opt) : s.add(opt); return new Set(s); });

  const ab = "h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90";

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
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`group/bubble flex gap-3 mb-2 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200 relative`}>
        {!isUser && (
          ownMode
            ? <img src={resolvedTheme === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="Own Mode" className="flex-shrink-0 mt-1 ml-1 h-9 w-9 object-contain" />
            : <FiusLogo size="sm" className="flex-shrink-0 mt-1 ml-1" />
        )}
        <div className={`flex flex-col ${isUser ? "max-w-[85%] items-end" : "flex-1 min-w-0 items-start"} ${!isUser ? "ml-0.5" : ""}`}>
          {isUser ? (
            <div className="flex flex-col gap-2 items-end">
              {/* Attached images grid */}
              {msg.images && msg.images.length > 0 && (
                <div className={`grid gap-1.5 ${msg.images.length === 1 ? "grid-cols-1" : "grid-cols-2"} max-w-[240px]`}>
                  {msg.images.map((src, i) => (
                    <img key={i} src={src} alt={`attachment-${i}`}
                      className="rounded-2xl object-cover w-full cursor-zoom-in border border-border shadow-sm"
                      style={{ maxHeight: 180 }}
                      onClick={() => onExpandImg?.(src)} />
                  ))}
                </div>
              )}
              {/* Attached file chips — tap to preview content */}
              {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                <FileChips files={msg.attachedFiles} />
              )}
              {/* Text bubble (only if there's text) */}
              {msg.content && (
                <div className="group flex flex-col items-end">
                  <div className="user-msg-bubble bg-zinc-200 dark:bg-zinc-700 rounded-3xl rounded-br-none px-4 py-3 shadow-sm chat-bubble text-foreground text-[13.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] break-all w-fit">
                    {msg.content}
                  </div>
                  {(showUserMsgActions ?? false) && (
                    <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={handleCopy}
                        className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                        {copied ? <Check className="w-4 h-4 text-blue-500" /> : <><img src="/icon-copy-black.png" className="w-4 h-4 object-contain block dark:hidden brightness-0" alt="copy" /><img src="/icon-copy-gray2.png" className="w-4 h-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
                      </button>
                      <button onClick={() => onRetryUser?.(msg.content)}
                        className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                        <img src="/icon-edit-prompt-gray.png" className="w-4 h-4 object-contain brightness-0 dark:brightness-100 dark:opacity-75" alt="edit" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Copy/retry when no text */}
              {!msg.content && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <button onClick={() => onRetryUser?.("")}
                    className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                    <img src="/icon-edit-prompt-gray.png" className="w-4 h-4 object-contain brightness-0 dark:brightness-100 dark:opacity-75" alt="edit" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {(() => {
                const sourceSep = '\n\n---\n**Sources:**\n';
                const sepIdx = shownText.indexOf(sourceSep);
                const mainText = sepIdx !== -1 ? shownText.slice(0, sepIdx) : shownText;
                const sourceLines = sepIdx !== -1 ? shownText.slice(sepIdx + sourceSep.length).split('\n').filter(l => l.startsWith('• ')) : [];
                const parsedSrcs = sourceLines.map(l => { const m = l.match(/• \[(.+?)\]\((.+?)\)/); return m ? { title: m[1], url: m[2] } : null; }).filter(Boolean) as {title: string; url: string}[];
                return (
                  <>
                    {!isUser && msg.isDocument ? (
                      <div className="rounded-2xl px-3.5 py-3 border border-border bg-card flex items-center gap-3 max-w-[280px]">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{msg.documentTitle || 'Document'}</p>
                          <p className="text-[11px] text-muted-foreground">Document ready</p>
                        </div>
                      </div>
                    ) : (
                     <div>
                      {isUser ? (
                        <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-foreground py-1">
                          {mainText.length > 200 && !msgExpanded ? `${mainText.slice(0, 200).trim()}…` : mainText}
                        </div>
                      ) : (
                        done
                          ? <MobileMarkdown text={mainText} />
                          : <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{mainText}</span>
                      )}
                    </div>
                    )}
                    {!isUser && parsedSrcs.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {parsedSrcs.map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                              title={src.title}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:scale-110 transition-all active:scale-90 flex items-center justify-center shadow-sm">
                              <img src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(src.url)}`} alt={src.title}
                                className="w-5 h-5 rounded-sm" onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z'/%3E%3C/svg%3E"; }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {isUser && mainText.length > 200 && (
                      <button onClick={() => setMsgExpanded(!msgExpanded)}
                        className="mt-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                        {msgExpanded ? "‹ Less" : "..."}
                      </button>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {!isUser && done && msg.isDocument && (
            <div className="flex items-center gap-2 mt-2 mb-0.5 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button disabled={!!docExportingId}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500 active:scale-95 text-xs font-semibold text-white transition-all disabled:opacity-60">
                    {docExportingId
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      : <Download className="w-3.5 h-3.5" />}
                    Download
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[190px] z-[200]">
                  <DropdownMenuItem onClick={async () => { setDocExportingId('pdf'); try { await downloadPdf(msg.content, msg.documentTitle || 'document'); } finally { setDocExportingId(null); } }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-red-500" /> PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadTxt(msg.content, msg.documentTitle || 'document')}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-blue-500" /> Text (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { const blob = new Blob([msg.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(msg.documentTitle || 'document').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'document'}.md`; a.click(); URL.revokeObjectURL(a.href); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-purple-500" /> Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { setDocExportingId('docx'); try { await downloadWordDoc(msg.content, msg.documentTitle || 'document'); } finally { setDocExportingId(null); } }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-blue-600" /> Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { setDocExportingId('pptx'); try { await downloadPptx(msg.content, msg.documentTitle || 'document'); } finally { setDocExportingId(null); } }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-orange-500" /> PowerPoint (.pptx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {!isUser && done && (
            <div className="flex items-center gap-0.5 mt-1">
              <button onClick={handleLike} className={`${ab} ${liked === "up" ? "text-green-500 bg-green-50 dark:bg-green-950" : ""}`}>
                <img src="/icon-like-black.png" className="w-4 h-4 object-contain block dark:hidden" style={liked === "up" ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { filter: 'brightness(0)' }} alt="like" /><img src="/icon-like-gray2.png" className="w-4 h-4 object-contain hidden dark:block" style={liked === "up" ? { filter: 'brightness(0) saturate(100%) invert(62%) sepia(100%) hue-rotate(100deg) saturate(500%)' } : { opacity: 0.75 }} alt="like" />
              </button>
              <button onClick={handleDislike} className={`${ab} ${liked === "down" ? "text-red-500 bg-red-50 dark:bg-red-950" : ""}`}>
                <img src="/icon-dislike-black.png" className="w-4 h-4 object-contain block dark:hidden" style={liked === "down" ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { filter: 'brightness(0)' }} alt="dislike" /><img src="/icon-dislike-gray2.png" className="w-4 h-4 object-contain hidden dark:block" style={liked === "down" ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(100%) saturate(600%) hue-rotate(330deg)' } : { opacity: 0.75 }} alt="dislike" />
              </button>
              <button onClick={handleCopy} className={`${ab} ${copied ? "text-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}>
                {copied ? <Check className="w-4 h-4" /> : <><img src="/icon-copy-black.png" className="w-4 h-4 object-contain block dark:hidden brightness-0" alt="copy" /><img src="/icon-copy-gray2.png" className="w-4 h-4 object-contain hidden dark:block opacity-75" alt="copy" /></>}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={ab}><img src="/icon-more-black.png" className="w-4 h-4 object-contain block dark:hidden brightness-0" alt="more" /><img src="/icon-more-gray.png" className="w-4 h-4 object-contain hidden dark:block opacity-75" alt="more" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[185px] z-[200]">
                  <DropdownMenuItem onClick={handleSpeak}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    {speaking ? <Square className="w-3.5 h-3.5 text-blue-500" /> : <Volume2 className="w-3.5 h-3.5 text-violet-500" />}
                    {speaking ? 'Stop reading' : 'Read aloud'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRetry} disabled={!onRetry}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                    <><img src="/icon-redo-black.png" className="w-3.5 h-3.5 object-contain block dark:hidden brightness-0" alt="redo" /><img src="/icon-redo-gray.png" className="w-3.5 h-3.5 object-contain hidden dark:block opacity-75" alt="redo" /></> Regenerate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-blue-500" /> Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const blob = new Blob([msg.content], { type: "text/markdown" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fius-export.md"; a.click();
                  }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-purple-500" /> Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const win = window.open('', '_blank');
                    if (!win) return;
                    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fius Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}pre{white-space:pre-wrap;word-break:break-word}</style></head><body><pre>${msg.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
                    win.document.close(); win.focus(); setTimeout(() => { win.print(); }, 500);
                  }} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <FileDown className="w-3.5 h-3.5 text-red-500" /> Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewChat?.(msg.content)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-500" /> New chat from this
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {!isUser && done && isLatest && !isStreaming && msg.content && (
            <FollowUpSuggestions msgContent={msg.content} onSelect={q => onFollowUp?.(q)} />
          )}
          {!isUser && done && (
            <p className="text-[9.5px] text-muted-foreground/35 mt-2 ml-0.5 select-none">Fius is an AI, it can make mistakes.</p>
          )}
        </div>
      </div>

      {/* Feedback dialog — compact */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 max-w-xs w-full shadow-xl">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {feedbackType === "up" ? "What did you like?" : "What went wrong?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(feedbackType === "up"
                ? ["Accurate", "Helpful", "Well written", "Clear", "Creative", "Other"]
                : ["Inaccurate", "Not helpful", "Harmful", "Off-topic", "Too long", "Too short", "Other"]
              ).map(opt => (
                <button key={opt} onClick={() => toggleFbOpt(opt)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${feedbackSelected.has(opt)
                    ? feedbackType === "up"
                      ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
                      : "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}>
                  {opt}
                </button>
              ))}
            </div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
              placeholder="Add details (optional)" rows={2}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
            <div className="flex gap-1.5 justify-end">
              <button onClick={() => setFeedbackOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={() => setFeedbackOpen(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-all ${feedbackType === "up" ? "bg-green-500 hover:bg-green-600" : "bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"}`}>
                Submit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Drag-to-dismiss hook ─────────────────────────────────────────────────────
function useDragDismiss(onDismiss: () => void, threshold = 80) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      // Freeze the element at its current rendered position before dragging
      const rect = sheetRef.current.getBoundingClientRect();
      const parentRect = sheetRef.current.parentElement?.getBoundingClientRect();
      const offsetY = parentRect ? rect.top - parentRect.top : 0;
      sheetRef.current.style.animation = "none";
      sheetRef.current.style.transform = `translateY(${Math.max(0, offsetY)}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    currentY.current = delta;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    if (currentY.current > threshold) {
      // Snap back first so dialogs (e.g. unsaved changes) remain visible
      sheetRef.current.style.transition = "transform 0.25s cubic-bezier(0.23,1,0.32,1)";
      sheetRef.current.style.transform = "translateY(0)";
      onDismiss();
    } else {
      sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.23,1,0.32,1)";
      sheetRef.current.style.transform = "translateY(0)";
    }
  }, [onDismiss, threshold]);

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd };
}

// ─── Model Sheet ──────────────────────────────────────────────────────────────
function ModelSheet({ models, current, onSelect, onClose, isLocked, onLockedSelect }: {
  models: { id: string; name: string }[]; current: string; onSelect: (id: string) => void; onClose: () => void;
  isLocked?: (id: string) => boolean; onLockedSelect?: (id: string) => void;
}) {
  const drag = useDragDismiss(onClose);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 320);
  };

  const easing = "cubic-bezier(0.23,1,0.32,1)";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        style={{ animation: `${closing ? "overlayExit 0.3s" : "overlayEnter 0.35s"} ${easing} both` }} />
      <div ref={drag.sheetRef}
        className="relative bg-background rounded-t-[24px] shadow-2xl"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
          animation: `${closing ? "sheetExit 0.32s" : "sheetEnter 0.42s"} ${easing} both`,
        }}
        onClick={e => e.stopPropagation()}>
        {/* Drag handle — only this area triggers swipe-to-dismiss */}
        <div className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onTouchStart={drag.onTouchStart} onTouchMove={drag.onTouchMove} onTouchEnd={drag.onTouchEnd}>
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>
        <p className="text-[16px] font-bold text-foreground px-5 mb-2">Select Model</p>
        {/* Scrollable content — touch events here scroll normally */}
        <div className="overflow-y-auto" style={{ maxHeight: "60vh", WebkitOverflowScrolling: "touch" } as any}>
          {models.map((opt, i) => {
            const locked = isLocked?.(opt.id) ?? false;
            return (
            <button key={opt.id} onClick={() => {
              if (locked) { onLockedSelect?.(opt.id); return; }
              onSelect(opt.id); handleClose();
            }}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors active:bg-accent/60 ${opt.id === current ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""} ${locked ? "opacity-50" : ""}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.id === current ? "bg-foreground" : "bg-zinc-400"}`} />
              <span className="text-[14px] font-semibold text-foreground flex-1 text-left">{opt.name}</span>
              {locked && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
              {opt.id === current && <Check className="w-4 h-4 text-foreground" />}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Message Bar (PC compact style) ────────────────────────────────────
const M_MAX_FILES = 5;
const M_MAX_IMAGES = 15;

interface MsgBarProps {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop?: () => void;
  isTyping: boolean; placeholder: string;
  tab: MobileTab;
  centerViewport?: boolean;
  model?: string; onModelChange?: (m: string) => void;
  fiusIntegrationMode?: boolean; onIntegration?: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  showEnhance?: boolean; showModel?: boolean; onCameraRef?: () => void;
  hidden?: boolean;
  onAttachmentSend?: (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => void;
  onDocumentMode?: () => void;
  documentModeActive?: boolean;
  hasMessages?: boolean;
}

function MobileMessageBar({ value, onChange, onSend, onStop, isTyping, placeholder, tab, centerViewport = false, model, onModelChange, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, showEnhance = true, showModel = true, hidden = false, onAttachmentSend, onDocumentMode, documentModeActive = false, hasMessages = false }: MsgBarProps) {
  const { theme: _mbTheme } = useTheme();
  const _mbResolved = _mbTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : _mbTheme;
  const isDark = _mbResolved === "dark";
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showModelSheet, setShowModelSheet] = useState(false);
  const [attachedImages, setAttachedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ file: File; name: string; size: string }>>([]);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const { toast } = useToast();
  const [fnBarStyle, setFnBarStyle] = useState(() => localStorage.getItem("functionBarStyle") || "pill");
  const [msgBarStyle, setMsgBarStyle] = useState(() => localStorage.getItem("messageBarStyle") || "compact");
  const [glossyOutlineEnabled, setGlossyOutlineEnabled] = useState(() => localStorage.getItem("glossyOutline") !== "false");
  const [expandOpen, setExpandOpen] = useState(false);
  const [longAnswer, setLongAnswer] = useState(false);
  const [promptInlineExpanded, setPromptInlineExpanded] = useState(false);
  const expandTaRef = useRef<HTMLTextAreaElement>(null);
  const overlayDrag = useDragDismiss(() => setExpandOpen(false), 60);

  useEffect(() => {
    const h1 = () => setFnBarStyle(localStorage.getItem("functionBarStyle") || "pill");
    const h2 = () => setMsgBarStyle(localStorage.getItem("messageBarStyle") || "compact");
    const h3 = () => setGlossyOutlineEnabled(localStorage.getItem("glossyOutline") !== "false");
    window.addEventListener("functionBarStyleChanged", h1);
    window.addEventListener("messageBarStyleChanged", h2);
    window.addEventListener("settingsSaved", h3);
    return () => { window.removeEventListener("functionBarStyleChanged", h1); window.removeEventListener("messageBarStyleChanged", h2); window.removeEventListener("settingsSaved", h3); };
  }, []);

  const models = ASK_MODELS;
  const currentModel = models.find(m => m.id === model) || models[0];

  useEffect(() => {
    if (!taRef.current) return;
    if (msgBarStyle === "compact") return; // compact: fixed height, internal scroll
    const minH = 62;
    const maxH = 160;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(Math.max(taRef.current.scrollHeight, minH), maxH) + "px";
  }, [value, msgBarStyle]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleMic = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening && (window as any)._sr) { try { (window as any)._sr.stop(); } catch {} (window as any)._sr = null; return; }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return;
    }
    const rec = new SR(); (window as any)._sr = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; onChange(valueRef.current ? `${valueRef.current} ${t}` : t); };
    rec.onend = () => { setIsListening(false); (window as any)._sr = null; };
    rec.onerror = () => { setIsListening(false); (window as any)._sr = null; };
    rec.start(); setIsListening(true);
  };

  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const handleEnhance = async () => {
    if (!value.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await authFetch("/api/enhance-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalPrompt: value }) });
      const data = await res.json();
      if (data.enhancedPrompt) onChange(data.enhancedPrompt);
    } catch { } finally { setIsEnhancing(false); }
  };

  const formatFileSize = (b: number) => b > 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = M_MAX_FILES - attachedFiles.length;
    if (remaining <= 0) {
      toast({ title: `Max ${M_MAX_FILES} files allowed`, variant: "destructive" });
      e.target.value = "";
      return;
    }
    const nonImg = files.filter(f => !f.type.startsWith('image/'));
    if (!nonImg.length) { toast({ title: "Use Upload Image for image files" }); e.target.value = ""; return; }
    const toProcess = nonImg.slice(0, remaining);
    if (nonImg.length > remaining) toast({ title: `Only ${remaining} more file(s) allowed` });
    const newFiles = toProcess.map(f => ({ file: f, name: f.name, size: formatFileSize(f.size) }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = M_MAX_IMAGES - attachedImages.length;
    if (remaining <= 0) {
      toast({ title: `Max ${M_MAX_IMAGES} images allowed`, variant: "destructive" });
      e.target.value = "";
      return;
    }
    const imgFiles = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);
    if (!imgFiles.length) { toast({ title: "Please select image files only" }); e.target.value = ""; return; }
    if (files.length > remaining) toast({ title: `Only ${remaining} more image(s) allowed` });
    imgFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        setAttachedImages(prev => [...prev, { file: f, preview: ev.target?.result as string }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  // Shared handling for files that arrive via drag-and-drop or clipboard
  // paste (desktop/PC browsers land on this component whenever the window
  // is under the 1024px breakpoint — it's not just a phone-only view — so it
  // needs the same drop/paste support as the wide desktop composer).
  const ingestDroppedOrPastedFiles = async (files: File[]) => {
    if (!files.length) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/'));

    if (imageFiles.length) {
      const remaining = M_MAX_IMAGES - attachedImages.length;
      const toProcess = imageFiles.slice(0, Math.max(remaining, 0));
      if (imageFiles.length > toProcess.length) toast({ title: `Only ${remaining} more image(s) allowed` });
      toProcess.forEach(f => {
        const reader = new FileReader();
        reader.onload = ev => setAttachedImages(prev => [...prev, { file: f, preview: ev.target?.result as string }]);
        reader.readAsDataURL(f);
      });
    }
    if (otherFiles.length) {
      const remaining = M_MAX_FILES - attachedFiles.length;
      const toProcess = otherFiles.slice(0, Math.max(remaining, 0));
      if (otherFiles.length > toProcess.length) toast({ title: `Only ${remaining} more file(s) allowed` });
      const newFiles = toProcess.map(f => ({ file: f, name: f.name, size: formatFileSize(f.size) }));
      if (newFiles.length) setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    if (!imageFiles.length && !otherFiles.length) toast({ title: "Could not read files" });
  };

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounterRef = useRef(0);
  const handleComposeDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current++; setIsDraggingFiles(true); };
  const handleComposeDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleComposeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFiles(false);
  };
  const handleComposeDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);
    await ingestDroppedOrPastedFiles(Array.from(e.dataTransfer.files || []));
  };
  const handleComposePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items.filter(item => item.kind === 'file').map(item => item.getAsFile()).filter((f): f is File => !!f);
    if (!files.length) return; // let normal text paste proceed
    e.preventDefault();
    await ingestDroppedOrPastedFiles(files);
  };

  const handleSend = () => {
    if (attachedImages.length > 0 || attachedFiles.length > 0) {
      if (onAttachmentSend) {
        onAttachmentSend([...attachedImages], [...attachedFiles], value);
        setAttachedImages([]);
        setAttachedFiles([]);
        onChange("");
        return;
      }
    }
    onSend();
  };

  if (hidden) return null;

  // Shared button class for the input pill buttons — match PC style
  const iconBtnCls = "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 bg-zinc-200/70 dark:bg-white/[0.07] hover:bg-zinc-300/70 dark:hover:bg-white/[0.12]";
  // Theme-aware icon: btn-icon applies brightness(0)+drop-shadow in light, brightness(0)+invert in dark — same as PC
  const imgCls = "w-4 h-4 btn-icon";
  const showFnBar = tab !== "philosopher" && tab !== "games";

  // Function bar button: matches PC renderFunctionBtn style, scaled for mobile
  const isCircleFn = fnBarStyle !== "square";
  const FnBtn = ({ onClick, icon, label, active, activeStyle }: {
    onClick?: () => void; icon: React.ReactNode; label: string;
    active?: boolean; activeStyle?: string;
  }) => {
    const defaultStyle = "text-zinc-800 dark:text-white/85 bg-white dark:bg-[#383838]";
    const resolvedActive = active ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-none" : undefined;
    const btnStyle = activeStyle || resolvedActive || defaultStyle;
    return (
      <button onClick={onClick}
        className="flex flex-col items-center gap-1 group flex-shrink-0 px-1 py-0.5">
        <div className={`w-11 h-11 ${isCircleFn ? "rounded-full" : "rounded-[10px]"} flex items-center justify-center transition-all duration-300 group-active:scale-[1.2] macos-button ${glossyOutlineEnabled ? 'glossy-outline' : ''} ${btnStyle}`}>
          {icon}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </button>
    );
  };

  return (
    <>
    <div className={`relative flex-shrink-0 ${centerViewport ? 'md:left-[-38px]' : ''} ${tab === 'imagine' ? 'bg-black' : hasMessages ? 'bg-background message-composer-with-messages' : ''}`}
      style={{ zIndex: 1 }}
      onDragEnter={handleComposeDragEnter} onDragOver={handleComposeDragOver} onDragLeave={handleComposeDragLeave} onDrop={handleComposeDrop}>
      {/* Fade feather — only when messages exist, fades content smoothly into the solid bar area */}
      {(hasMessages || tab === 'imagine') && (
        <div
          className={`absolute left-0 right-0 pointer-events-none ${tab === 'imagine' ? 'bg-gradient-to-b from-transparent to-black' : 'bg-gradient-to-b from-transparent to-background'}`}
          style={{ top: -120, height: 120 }}
        />
      )}
      {isDraggingFiles && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-indigo-500/10 border-2 border-dashed border-indigo-500 pointer-events-none rounded-2xl">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 bg-background/90 px-3 py-1.5 rounded-full shadow-lg">
            <Upload className="w-3.5 h-3.5" /> Drop to attach
          </span>
        </div>
      )}
      <div className="px-3 pb-3 pt-0">
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

      {/* ── Function bar: centered icon + label buttons — hidden when "In Bar" style ── */}
      {showFnBar && fnBarStyle !== "message-bar" && (
        <div className="macos-function-bar flex items-center justify-center mb-1.5 px-0.5" style={{ marginTop: fnBarStyle === 'pill' ? '38px' : '11px', transform: fnBarStyle === 'pill' ? 'translateX(-14px)' : undefined }}>
          {fnBarStyle === "pill" ? (
            /* ── Pill row style ── */
            <div className="flex items-center flex-wrap justify-center gap-2">
              {[
                { icon: <img src={isDark ? '/fn-voice-gray.png' : '/fn-voice-black.png'} alt="" className="w-[18px] h-[18px] btn-icon" />, label: "Long Answer", onClick: onIntegration, active: fiusIntegrationMode },
                { icon: <img src={isDark ? '/fn-settings-gray.png' : '/fn-settings-black.png'} alt="" className="w-[18px] h-[18px] btn-icon" />, label: "Voice Mode", onClick: onVoiceMode, active: false },
                { icon: <img src={isDark ? '/fn-longans-gray.png' : '/fn-longans-black.png'} alt="" className="w-[18px] h-[18px] btn-icon" />, label: "Settings", onClick: onSettings, active: false },
              ].map(({ icon, label, onClick, active }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 active:scale-95 ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-[#2e2e2e] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#383838]'
                  }`}
                >
                  <span className="flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center [&_img]:mix-blend-multiply dark:[&_img]:mix-blend-screen [&_img]:w-[18px] [&_img]:h-[18px] [&_img]:object-contain [&_img]:flex-shrink-0">{icon}</span>
                  <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
                </button>
              ))}
              {model === "fius-education" && onEducation && (
                <button onClick={onEducation} className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[13px] font-medium active:scale-95 transition-all">
                  <GraduationCap className="w-[18px] h-[18px]" /><span>Education</span>
                </button>
              )}
            </div>
          ) : (
            /* ── Circle / Square style ── */
            <div className="flex items-center gap-1.5">
              <FnBtn
                onClick={onIntegration}
                active={fiusIntegrationMode}
                icon={<img src={isDark ? '/fn-voice-gray.png' : '/fn-voice-black.png'} alt="" className="w-5 h-5 btn-icon" />}
                label="Long Answer"
              />
              <FnBtn onClick={onVoiceMode} icon={<img src={isDark ? '/fn-settings-gray.png' : '/fn-settings-black.png'} alt="" className="w-5 h-5 btn-icon" />} label="Voice Mode" />
              <FnBtn onClick={onSettings} icon={<img src={isDark ? '/fn-longans-gray.png' : '/fn-longans-black.png'} alt="" className="w-5 h-5 btn-icon" />} label="Settings" />
              {model === "fius-education" && onEducation && (
                <FnBtn onClick={onEducation}
                  activeStyle="text-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-none"
                  active
                  icon={<GraduationCap className="w-5 h-5" />} label="Education" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden file inputs — outside overflow-hidden so they always work */}
      <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleImageChange} />

      {/* ── Attached images preview tray — horizontal scroll ── */}
      {attachedImages.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2 px-1 pb-2 overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(155,155,155,0.4) transparent" }}>
            {attachedImages.map((img, i) => (
              <div key={i} className="relative flex-shrink-0 group">
                <img src={img.preview} alt={`img-${i}`}
                  className="w-16 h-16 rounded-xl object-cover border border-border cursor-zoom-in hover:scale-105 transition-transform shadow-sm"
                  onClick={() => setFullscreenImg(img.preview)} />
                <button onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center shadow">
                  <X className="w-2.5 h-2.5 text-white dark:text-zinc-800" />
                </button>
              </div>
            ))}
          </div>
          {attachedImages.length > 3 && (
            <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          )}
          {attachedImages.length > 1 && (
            <div className="flex justify-center gap-1 pb-0.5">
              {attachedImages.map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-zinc-400/60 dark:bg-zinc-500/60" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Attached files preview tray ── */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-1">
          {attachedFiles.map((f, i) => (
            <div key={i} className="relative flex items-center gap-2 px-3 py-2 pr-8 rounded-xl bg-white dark:bg-zinc-800 border border-border shadow-sm max-w-[200px]">
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">{f.size}</p>
              </div>
              <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main input pill ── */}
      <div className={`bg-white dark:bg-[#383838] ${glossyOutlineEnabled ? 'glossy-outline' : ''} overflow-hidden relative ${msgBarStyle === "default" ? "rounded-[1.5rem]" : "rounded-full"}`}>

        {msgBarStyle === "default" ? (
          /* ── Default: two-row layout matching PC (scaled for mobile) ── */
          <>
            {/* "In Bar" icon strip inside pill top when function bar is hidden */}
            {showFnBar && fnBarStyle === "message-bar" && (
              <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
                <button onClick={onIntegration} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${fiusIntegrationMode ? "bg-blue-500/15" : "bg-zinc-100 dark:bg-zinc-700/80"}`}>
                  <img src="/integration-icon.png" alt="" style={{ width: 14, height: 14 }} className={imgCls} />
                </button>
                <button onClick={onVoiceMode} className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                  <AudioLines className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>
                <button onClick={onSettings} className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                  <img src="/settings-icon.png" alt="" style={{ width: 14, height: 14 }} className={imgCls} />
                </button>
              </div>
            )}
            {/* Row 1: full-width textarea */}
            <div className="px-3 pt-2.5 pb-1">
              <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKey} onPaste={handleComposePaste}
                placeholder={placeholder}
                className="w-full bg-transparent text-[16px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
                style={{ minHeight: 52, maxHeight: 120, overflowY: "auto", scrollbarWidth: "none" }} />
            </div>
            {/* Row 2: attach + model left | mic + enhance + send right */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={iconBtnCls}>
                      <img src={isDark ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none rounded-xl shadow-2xl p-1 min-w-[190px]" side="top" align="start">
                     <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={() => fileInputRef.current?.click()}>
                       <FileText className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }} /><span>Upload File</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={() => imageInputRef.current?.click()}>
                       <Image className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }} /><span>Upload Image</span>
                     </DropdownMenuItem>
                     {onDocumentMode && (
                       <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={onDocumentMode}>
                         <FileSignature className="w-4 h-4 flex-shrink-0 text-purple-400" /><span>Create Document</span>
                       </DropdownMenuItem>
                     )}
                   </DropdownMenuContent>
                </DropdownMenu>
                {showModel && tab !== "nomad" && model && onModelChange && (
                  <button onClick={() => setShowModelSheet(true)}
                    className="h-7 px-2.5 rounded-full flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                    <span className="text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">{currentModel.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleMic} className={`${iconBtnCls} ${isListening ? "!bg-emerald-500/10 !text-emerald-400" : ""}`}>
                  <img src={microphoneIcon} alt="Mic" className={`${imgCls} composer-message-icon`} />
                </button>
                {isTyping ? (
                  <button onClick={onStop} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 transition-all">
                    <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
                  </button>
                ) : (
                  <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out ${value.trim() || attachedImages.length || attachedFiles.length ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
                    {showEnhance && (
                      <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing} className={`${iconBtnCls} disabled:opacity-30`}>
                        {isEnhancing ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                          : <img src={improvePromptIcon} alt="Enhance" className={`${imgCls} composer-message-icon`} />}
                      </button>
                    )}
                    <button onClick={handleSend} disabled={!value.trim() && !attachedImages.length && !attachedFiles.length}
                      className="w-8 h-8 rounded-full flex items-center justify-center composer-send-button flex-shrink-0 active:scale-90 transition-all">
                      <ArrowUp className="w-4 h-4 text-white dark:text-black" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── Compact: single-row pill (original mobile layout) ── */
          <>
            {/* "In Bar" icon strip inside pill top */}
            {showFnBar && fnBarStyle === "message-bar" && (
              <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                <button onClick={onIntegration} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${fiusIntegrationMode ? "bg-blue-500/15" : "bg-zinc-100 dark:bg-zinc-700/80"}`}>
                  <img src="/integration-icon.png" alt="" style={{ width: 14, height: 14 }} className={imgCls} />
                </button>
                <button onClick={onVoiceMode} className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                  <AudioLines className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>
                <button onClick={onSettings} className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                  <img src="/settings-icon.png" alt="" style={{ width: 14, height: 14 }} className={imgCls} />
                </button>
                {model === "fius-education" && onEducation && (
                  <button onClick={onEducation} className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/15 transition-all active:scale-90">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
                <div className="flex-1" />
                {showModel && tab !== "nomad" && model && onModelChange && (
                  <button onClick={() => setShowModelSheet(true)}
                    className="h-7 px-2.5 rounded-full flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700/80 transition-all active:scale-90">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">{currentModel.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center px-2 py-2 gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`${iconBtnCls} flex-shrink-0`}>
                    <img src={isDark ? "/plus-gray.png" : "/plus-black.png"} style={{ width: 18, height: 18 }} alt="attach" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#383838] border-none rounded-xl shadow-2xl p-1 min-w-[190px]" side="top" align="start">
                     <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={() => fileInputRef.current?.click()}>
                       <FileText className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }} /><span>Upload File</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={() => imageInputRef.current?.click()}>
                       <Image className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }} /><span>Upload Image</span>
                     </DropdownMenuItem>
                     {onDocumentMode && (
                       <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" style={{ color: isDark ? '#fff' : '#111' }} onClick={onDocumentMode}>
                         <FileSignature className="w-4 h-4 flex-shrink-0 text-purple-400" /><span>Create Document</span>
                       </DropdownMenuItem>
                     )}
                   </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative flex-1">
                <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKey} onPaste={handleComposePaste}
                  placeholder={placeholder} rows={1}
                  className="w-full bg-transparent text-[14px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-normal py-0 pl-1"
                  style={{
                    height: 38,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    paddingRight: 16,
                  }} />
                {/* Fullscreen open */}
                <button
                  className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  onClick={() => setExpandOpen(true)}>
                  <Maximize2 className="w-2 h-2" />
                </button>
                </div>
              <button onClick={toggleMic} className={`${iconBtnCls} flex-shrink-0 ${isListening ? "!bg-emerald-500/10 !text-emerald-400" : ""}`}>
                <img src={microphoneIcon} alt="Mic" className={`${imgCls} composer-message-icon`} />
              </button>
              {showEnhance && (
                <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing} className={`${iconBtnCls} flex-shrink-0 disabled:opacity-30`}>
                  {isEnhancing ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    : <img src={improvePromptIcon} alt="Enhance" className={`${imgCls} composer-message-icon`} />}
                </button>
              )}
              {isTyping ? (
                <button onClick={onStop} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 transition-all">
                  <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!value.trim() && !attachedImages.length && !attachedFiles.length}
                  className="w-8 h-8 rounded-full flex items-center justify-center composer-send-button flex-shrink-0 active:scale-90 disabled:opacity-30 transition-all hover:opacity-90">
                  <ArrowUp className="w-4 h-4 text-white dark:text-black" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </div>

    {/* ── Full-screen expand overlay ── */}
    {expandOpen && (
      <div className="fixed inset-0 z-[300] bg-background flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.23,1,0.32,1)", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {/* Swipe-down handle — drags the whole overlay down to dismiss */}
        <div ref={overlayDrag.sheetRef} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            onTouchStart={overlayDrag.onTouchStart} onTouchMove={overlayDrag.onTouchMove} onTouchEnd={overlayDrag.onTouchEnd}>
            <div className="w-9 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-2 pb-2">
            <span className="text-sm font-semibold text-foreground">Type your message</span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-foreground hover:bg-accent transition-all active:scale-90"
              onClick={() => setExpandOpen(false)}>
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          {/* Textarea fills available space */}
          <div className="flex-1 px-4 py-2 overflow-hidden">
            <textarea
              ref={expandTaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onPaste={handleComposePaste}
              placeholder={placeholder}
              autoFocus
              className="w-full h-full bg-transparent text-[16px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
              style={{ scrollbarWidth: "none" }}
            />
          </div>
          {/* Bottom bar — action buttons + send */}
          <div className="px-4 pb-4 flex items-center gap-2">
            {/* Mic */}
            <button onClick={toggleMic}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${isListening ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
              <Mic className="w-4 h-4" />
            </button>
            {/* Enhance */}
            {showEnhance && (
              <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all active:scale-90 disabled:opacity-30 flex-shrink-0">
                {isEnhancing
                  ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  : <img src={improvePromptIcon} alt="Enhance" className="w-4 h-4 composer-message-icon" />}
              </button>
            )}
            {/* Long Answer toggle */}
            <button onClick={() => setLongAnswer(v => !v)}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-all active:scale-90 flex-shrink-0 text-[11px] font-semibold ${longAnswer ? "bg-zinc-200 dark:bg-zinc-100 text-zinc-800 dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
              <AlignLeft className="w-3.5 h-3.5 flex-shrink-0" />
              Long
            </button>
            <span className="text-xs text-muted-foreground flex-1 text-right">{value.length > 0 ? `${value.length}` : ""}</span>
            {/* Send / Stop */}
            {isTyping ? (
              <button onClick={() => { onStop?.(); setExpandOpen(false); }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white active:scale-90 transition-all flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-sm bg-white dark:bg-zinc-800" />
              </button>
            ) : (
              <button onClick={() => {
                if (longAnswer && value.trim()) onChange(value.trim() + "\n\nPlease provide a very detailed and thorough answer.");
                setLongAnswer(false);
                setTimeout(() => { handleSend(); setExpandOpen(false); }, 0);
              }} disabled={!value.trim() && !attachedImages.length && !attachedFiles.length}
                className="w-10 h-10 rounded-full flex items-center justify-center composer-send-button active:scale-90 disabled:opacity-30 transition-all flex-shrink-0">
                <ArrowUp className="w-5 h-5 text-white dark:text-black" />
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    {/* ── Fullscreen image lightbox ── */}
    {fullscreenImg && (
      <div
        className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center"
        onClick={() => setFullscreenImg(null)}>
        <img
          src={fullscreenImg}
          alt="Preview"
          className="max-w-[95vw] max-h-[95vh] rounded-2xl object-contain shadow-2xl"
          onClick={e => e.stopPropagation()} />
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          onClick={() => setFullscreenImg(null)}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    )}
    </>
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
  const { usage: planUsage } = useUsage();
  const isUltimatePlan = planUsage?.plan === "ultimate";
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [closing, setClosing] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || user?.username || "");
  const [previewPic, setPreviewPic] = useState("");
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(() => localStorage.getItem("aiPreset") || "custom");
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem("customInstructions") || "");
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [localToggles, setLocalToggles] = useState({
    autoScroll: true, richText: true, improveModel: true, personalize: true,
    nomadGrid: true, nomadNotification: true, philosopherNotification: true, fiusGamesNotification: true,
    wrapLines: false, showPreviews: true, showFiusLogo: true,
    hideFiusLogo: false, hideFlyWithUs: false, glossyOutline: true,
  });
  const [functionBarStyle, setFunctionBarStyle] = useState(() => localStorage.getItem("functionBarStyle") || "pill");
  const [messageBarStyle, setMessageBarStyle] = useState(() => localStorage.getItem("messageBarStyle") || "compact");
  const [logoStyle, setLogoStyle] = useState(() => getStoredLogoStyle());
  const [autoRotateLogo, setAutoRotateLogo] = useState(() => getStoredAutoRotateLogo());
  const [localAiOrder, setLocalAiOrder] = useState(["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai"]);
  const picInputRef = useRef<HTMLInputElement>(null);
  const settingsTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const settingsNavRef = useRef<HTMLDivElement>(null);
  const settingsContentScrollRef = useRef<HTMLDivElement | null>(null);
  const [settingsPill, setSettingsPill] = useState({ left: 0, width: 0, ready: false });

  // ── Dirty / exit-dialog state (mirrors PC CustomizeModal exactly) ──
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Callback-ref: stableHandleClose never changes identity (safe for drag hook),
  // but always delegates to the latest handleCloseAttempt which reads current state.
  const handleCloseRef = useRef<() => void>(() => {});
  const stableHandleClose = useCallback(() => handleCloseRef.current(), []);

  const originalValuesRef = useRef({
    aiPreset: "custom", customInstructions: "", chatBg: "plain",
    functionBarStyle: "pill", messageBarStyle: "compact",
    logoStyle: DEFAULT_LOGO_STYLE, autoRotateLogo: false,
    togglesRaw: {} as Record<string, string>,
    aiOrder: ["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai"] as string[],
  });

  const TOGGLE_KEYS = ["autoScroll","richText","improveModel","personalize","nomadGrid","nomadNotification","philosopherNotification","fiusGamesNotification","wrapLines","showPreviews","showFiusLogo","hideFiusLogo","hideFlyWithUs","glossyOutline"];

  const makeTogglesBool = () => ({
    autoScroll: localStorage.getItem("autoScroll") !== "false",
    richText: localStorage.getItem("richText") !== "false",
    improveModel: localStorage.getItem("improveModel") !== "false",
    personalize: localStorage.getItem("personalize") !== "false",
    nomadGrid: localStorage.getItem("nomadGrid") !== "false",
    nomadNotification: localStorage.getItem("nomadNotification") !== "false",
    philosopherNotification: localStorage.getItem("philosopherNotification") !== "false",
    fiusGamesNotification: localStorage.getItem("fiusGamesNotification") !== "false",
    wrapLines: localStorage.getItem("wrapLines") === "true",
    showPreviews: localStorage.getItem("showPreviews") !== "false",
    showFiusLogo: localStorage.getItem("showFiusLogo") !== "false",
    hideFiusLogo: localStorage.getItem("hideFiusLogo") === "true",
    hideFlyWithUs: localStorage.getItem("hideFlyWithUs") === "true",
    glossyOutline: localStorage.getItem("glossyOutline") !== "false",
  });

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setEditName(user?.displayName || user?.username || "");
      setPreviewPic("");
      setShowCustomizePanel(false);
      setShowExitDialog(false);
      setIsDirty(false);

      const preset = localStorage.getItem("aiPreset") || "custom";
      const instructions = localStorage.getItem("customInstructions") || "";
      const bg = localStorage.getItem("chatBg") || "plain";
      const fnStyle = localStorage.getItem("functionBarStyle") || "circle";
      const msgStyle = localStorage.getItem("messageBarStyle") || "compact";
      const savedLogoStyle = getStoredLogoStyle();
      const savedAutoRotateLogo = getStoredAutoRotateLogo();
      const togglesRaw: Record<string,string> = {};
      TOGGLE_KEYS.forEach(k => { togglesRaw[k] = localStorage.getItem(k) ?? ""; });

      const aiOrderRaw = localStorage.getItem("nomadAiOrder");
      const aiOrder: string[] = aiOrderRaw ? (() => { try { return JSON.parse(aiOrderRaw); } catch { return null; } })() ?? ["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai"] : ["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "fius-ai"];
      originalValuesRef.current = { aiPreset: preset, customInstructions: instructions, chatBg: bg, functionBarStyle: fnStyle, messageBarStyle: msgStyle, logoStyle: savedLogoStyle, autoRotateLogo: savedAutoRotateLogo, togglesRaw, aiOrder };

      setSelectedPreset(preset);
      setCustomInstructions(instructions);
      setChatBg(bg);
      setFunctionBarStyle(fnStyle);
      setMessageBarStyle(msgStyle);
      setLogoStyle(savedLogoStyle);
      setAutoRotateLogo(savedAutoRotateLogo);
      setLocalToggles(makeTogglesBool());
      setLocalAiOrder(aiOrder);
    }
  }, [isOpen, user]);

  const markDirty = () => setIsDirty(true);

  const doClose = () => {
    setClosing(true);
    setTimeout(() => { onClose(); setClosing(false); }, 320);
  };

  // Discard — revert any immediately-applied settings, then close
  const handleDontSave = () => {
    const orig = originalValuesRef.current;
    localStorage.setItem("chatBg", orig.chatBg);
    localStorage.setItem("functionBarStyle", orig.functionBarStyle);
    localStorage.setItem("messageBarStyle", orig.messageBarStyle);
    persistLogoStyle(orig.logoStyle);
    persistAutoRotateLogo(orig.autoRotateLogo);
    localStorage.setItem("nomadAiOrder", JSON.stringify(orig.aiOrder));
    Object.entries(orig.togglesRaw).forEach(([k, v]) => {
      if (v === "") localStorage.removeItem(k); else localStorage.setItem(k, v);
    });
    onChatBgChange?.(orig.chatBg);
    window.dispatchEvent(new Event("chatBgChanged"));
    window.dispatchEvent(new Event("functionBarStyleChanged"));
    window.dispatchEvent(new Event("messageBarStyleChanged"));
    window.dispatchEvent(new Event("logoStyleChanged"));
    setLocalAiOrder(orig.aiOrder);
    setIsDirty(false);
    setShowExitDialog(false);
    doClose();
  };

  // Close attempt — show dialog if dirty, otherwise close immediately
  const handleCloseAttempt = () => {
    if (showExitDialog) return;
    if (isDirty) { setShowExitDialog(true); } else { doClose(); }
  };
  // Update ref every render so stableHandleClose always calls fresh logic
  handleCloseRef.current = handleCloseAttempt;

  const handleSave = () => {
    localStorage.setItem("aiPreset", selectedPreset);
    localStorage.setItem("customInstructions", customInstructions);
    localStorage.setItem("chatBg", chatBg);
    localStorage.setItem("functionBarStyle", functionBarStyle);
    localStorage.setItem("messageBarStyle", messageBarStyle);
    persistLogoStyle(logoStyle);
    persistAutoRotateLogo(autoRotateLogo);
    Object.entries(localToggles).forEach(([k, v]) => localStorage.setItem(k, String(v)));
    localStorage.setItem("nomadAiOrder", JSON.stringify(localAiOrder));
    window.dispatchEvent(new Event("functionBarStyleChanged"));
    window.dispatchEvent(new Event("messageBarStyleChanged"));
    window.dispatchEvent(new Event("logoStyleChanged"));
    onChatBgChange?.(chatBg);
    window.dispatchEvent(new Event("chatBgChanged"));
    window.dispatchEvent(new Event("settingsSaved"));
    setIsDirty(false);
    setShowExitDialog(false);
    doClose();
  };

  const moveOrder = (i: number, dir: "up" | "down") => {
    const n = [...localAiOrder];
    if (dir === "up" && i > 0) [n[i], n[i-1]] = [n[i-1], n[i]];
    else if (dir === "down" && i < n.length - 1) [n[i], n[i+1]] = [n[i+1], n[i]];
    setLocalAiOrder(n);
    markDirty();
  };

  // Drag-and-drop reordering — Pointer Events unify mouse + touch, unlike
  // native HTML5 draggable which does not fire on touch devices at all.
  const dragIndexRef = useRef<number | null>(null);
  const [orderDragOverIndex, setOrderDragOverIndex] = useState<number | null>(null);
  const [orderDraggingIndex, setOrderDraggingIndex] = useState<number | null>(null);
  const [orderDragOffsetY, setOrderDragOffsetY] = useState(0);
  const orderRowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleOrderPointerDown = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragIndexRef.current = i;
    setOrderDraggingIndex(i);
    setOrderDragOverIndex(i);
    setOrderDragOffsetY(0);
    const startY = e.clientY;

    // Snapshot sibling rows' midpoints once, excluding the dragged row —
    // see PC customize-modal.tsx for why measuring live rects (including the
    // dragged row's own translating one) breaks the hit-test.
    const staticMids = orderRowRefs.current.map((el, idx) => {
      if (!el || idx === i) return null;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });

    const findIndexAtY = (clientY: number): number => {
      let best = i;
      let bestDist = Infinity;
      staticMids.forEach((mid, idx) => {
        if (mid === null) return;
        const dist = Math.abs(clientY - mid);
        if (dist < bestDist) { bestDist = dist; best = idx; }
      });
      return best;
    };

    const onMove = (ev: PointerEvent) => {
      setOrderDragOffsetY(ev.clientY - startY);
      const idx = findIndexAtY(ev.clientY);
      setOrderDragOverIndex(prev => (prev === idx ? prev : idx));
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const from = dragIndexRef.current;
      const to = findIndexAtY(ev.clientY);
      dragIndexRef.current = null;
      setOrderDraggingIndex(null);
      setOrderDragOverIndex(null);
      setOrderDragOffsetY(0);
      if (from === null || from === to) return;
      const n = [...localAiOrder];
      const [moved] = n.splice(from, 1);
      n.splice(to, 0, moved);
      setLocalAiOrder(n);
      markDirty();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const MODEL_NAMES: Record<string, string> = { "gpt-4o": "ChatGPT 5", "claude-3.5-sonnet": "Claude Sonnet 4", "gemini-pro": "Gemini 3.1 Pro", "perplexity": "Perplexity Sonar Pro", "grok-4": "Grok 4", "deepseek-r1": "Deepseek v3", "fius-ai": "Fius Pro" };
  const initials = (user?.displayName || user?.username || "?").charAt(0).toUpperCase();

  const menuItems: { id: SettingsSection; label: string; icon: React.ComponentType<any> }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "general", label: "Main Area", icon: Sliders },
    { id: "appearance", label: "Preferences", icon: Palette },
  ];

  const settingsDrag = useDragDismiss(stableHandleClose);

  useEffect(() => {
    const idx = menuItems.findIndex(m => m.id === activeSection);
    const btn = settingsTabRefs.current[idx];
    const nav = settingsNavRef.current;
    if (!btn || !nav) return;
    const nr = nav.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setSettingsPill({ left: br.left - nr.left, width: br.width, ready: true });
  }, [activeSection, isOpen]);

  if (!isOpen && !closing && !showExitDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={showExitDialog ? undefined : stableHandleClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        style={{ animation: `${closing ? "overlayExit 0.3s" : "overlayEnter 0.38s"} cubic-bezier(0.23,1,0.32,1) both` }} />
      <div ref={settingsDrag.sheetRef}
        className="relative bg-background rounded-t-[24px] flex flex-col overflow-hidden"
        style={{
          height: "78vh",
          boxShadow: "0 -10px 60px rgba(0,0,0,0.35)",
          animation: `${closing ? "sheetExit 0.32s" : "sheetEnter 0.45s"} cubic-bezier(0.23,1,0.32,1) both`,
        }}
        onClick={e => e.stopPropagation()}>
        {/* Drag handle — pill-shaped native drawer handle, ONLY this strip triggers drag-to-dismiss */}
        <div className="flex justify-center pt-3.5 pb-2.5 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "none" }}
          onTouchStart={settingsDrag.onTouchStart} onTouchMove={settingsDrag.onTouchMove} onTouchEnd={settingsDrag.onTouchEnd}>
          <div className="rounded-full" style={{ width: 40, height: 4, background: 'var(--border)', opacity: 0.7 }} />
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/50 flex-shrink-0">
          <h2 className="text-[17px] font-bold text-foreground">Settings</h2>
          <button onClick={handleSave} className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold active:scale-95 transition-all">Save</button>
        </div>
        {/* Tab bar — centered tabs with sliding pill + X at right */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-shrink-0 border-b border-border/50 bg-zinc-50 dark:bg-[#161616]">
            <div className="flex items-center px-2 py-1.5">
              {/* Centered nav with pill */}
              <div ref={settingsNavRef} className="relative flex flex-1 items-center justify-center">
                {settingsPill.ready && (
                  <div aria-hidden style={{
                    position: "absolute",
                    left: settingsPill.left,
                    width: settingsPill.width,
                    top: 1, bottom: 1,
                    transition: "left 0.42s cubic-bezier(0.34,1.56,0.64,1), width 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}>
                    <div key={settingsPill.left} style={{
                      position: "absolute", inset: 0,
                      background: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.09)",
                      borderRadius: 12,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                      animation: "pill-squish 0.44s cubic-bezier(0.22,1,0.36,1) 0.32s both",
                    }} />
                  </div>
                )}
                {menuItems.map((item, i) => (
                  <button key={item.id}
                    ref={el => { settingsTabRefs.current[i] = el; }}
                    onClick={() => setActiveSection(item.id)}
                    className={`relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-[12px] font-semibold transition-colors duration-200 ${activeSection === item.id ? "text-zinc-900 dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground"}`}>
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={settingsContentScrollRef} key={activeSection} className="flex-1 overflow-y-auto p-4 relative" style={{ animation: "fadeSlideIn 0.18s cubic-bezier(0.23,1,0.32,1) both" }}>
            {activeSection === "account" && (
              <div className="space-y-4">
                {/* Hidden real file picker */}
                <input ref={picInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const reader = new FileReader();
                    reader.onload = ev => setPreviewPic(ev.target?.result as string);
                    reader.readAsDataURL(f);
                  }} />
                <div className="p-4 bg-zinc-50 dark:bg-[#383838] rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    {/* Tappable avatar — opens photo picker */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-zinc-400 transition-all active:scale-95"
                      onClick={() => picInputRef.current?.click()}>
                      {(previewPic || profilePicture) ? <img src={previewPic || profilePicture} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white" style={{ background: `linear-gradient(45deg, ${getVibrantColor(user?.displayName || user?.username || user?.email || "?")}, ${getVibrantColor(user?.displayName || user?.username || user?.email || "?", true)})` }}>{initials}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{user?.displayName || user?.username || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {previewPic && <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Photo selected — tap Save</p>}
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
                          try { await apiRequest("PATCH", "/api/auth/user", { username: editName.trim() }); onUserRename?.(editName.trim()); queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); } catch {}
                          if (previewPic) onProfilePictureChange?.(previewPic);
                          setShowCustomizePanel(false);
                        }} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold active:scale-95">
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Plan / Usage card ── */}
                <div className="p-4 bg-zinc-50 dark:bg-[#383838] rounded-2xl border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Current Plan</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{isUltimatePlan ? "Fius Ultimate" : "Free"}</p>
                    </div>
                    {isUltimatePlan
                      ? <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white">✦ Ultimate</span>
                      : <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">Free</span>}
                  </div>
                  {planUsage && (
                    <div className="space-y-2">
                      {/* Tokens (Ultimate) or Messages (Free) */}
                      {isUltimatePlan ? (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] text-muted-foreground">Tokens</span>
                            <span className="text-[11px] font-semibold text-foreground">
                              {(planUsage as any).tokensRemaining != null ? `${((planUsage as any).tokensRemaining as number).toLocaleString()} left` : "Unlimited"}
                            </span>
                          </div>
                          {typeof (planUsage as any).tokensRemaining === 'number' && typeof (planUsage as any).tokensLimit === 'number' && (
                            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500 transition-all"
                                style={{ width: `${Math.max(0, Math.min(100, ((planUsage as any).tokensUsed ?? 0) / ((planUsage as any).tokensLimit) * 100))}%` }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] text-muted-foreground">Messages</span>
                            <span className="text-[11px] font-semibold text-foreground">{planUsage.messagesRemaining ?? "∞"} left</span>
                          </div>
                          {typeof planUsage.messagesRemaining === 'number' && typeof planUsage.messagesLimit === 'number' && (
                            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, (planUsage.messagesRemaining / planUsage.messagesLimit) * 100))}%` }} />
                            </div>
                          )}
                        </div>
                      )}
                      {typeof planUsage.imagesRemaining === 'number' && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] text-muted-foreground">Images</span>
                            <span className="text-[11px] font-semibold text-foreground">{planUsage.imagesRemaining} left</span>
                          </div>
                          {typeof planUsage.imagesLimit === 'number' && (
                            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, (planUsage.imagesRemaining / planUsage.imagesLimit) * 100))}%` }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!isUltimatePlan && (
                    <button
                      onClick={() => { window.dispatchEvent(new Event('openUpgradeModal')); }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white active:scale-[0.98] transition-all">
                      ✦ Upgrade to Fius Ultimate
                    </button>
                  )}
                  {isUltimatePlan && (
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 border border-violet-400/20 text-center">
                      <p className="text-[11px] font-bold text-violet-500">✦ Active — Fius Ultimate</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Premium AI access unlocked</p>
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
                      <button key={p.id} onClick={() => { setSelectedPreset(p.id); markDirty(); }}
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
                  <textarea value={customInstructions} onChange={e => { setCustomInstructions(e.target.value); markDirty(); }} placeholder="Tell Fius how to respond…"
                    className="w-full h-24 bg-zinc-50 dark:bg-[#383838] border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors" />
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
                        <Switch checked={localToggles[item.key as keyof typeof localToggles]} onCheckedChange={() => { setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] })); markDirty(); }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Preferences = full PC appearance options ── */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ v: "light" as const, icon: Sun, label: "Light" }, { v: "dark" as const, icon: Moon, label: "Dark" }, { v: "system" as const, icon: Laptop, label: "System" }].map(opt => (
                      <button key={opt.v} onClick={() => { setTheme(opt.v); markDirty(); }}
                        className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border transition-all active:scale-95 ${theme === opt.v ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        <opt.icon className={`w-4 h-4 ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`} />
                        <span className={`text-[11px] font-semibold ${theme === opt.v ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appearance toggles */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Display</p>
                  <div className="space-y-4">
                    {[
                      { key: "glossyOutline", label: "Glossy Outline", desc: "Shiny border on message bar, function bar & top bar" },
                      { key: "wrapLines", label: "Wrap Long Lines", desc: "Wrap code blocks by default" },
                      { key: "showPreviews", label: "Conversation Previews", desc: "Show previews in history sidebar" },
                      { key: "showFiusLogo", label: "Show Fius Logo in Responses", desc: "Display logo next to AI replies" },
                      { key: "hideFiusLogo", label: "Hide Fius Logo", desc: "Hide logo from the welcome screen" },
                      { key: "hideFlyWithUs", label: "Hide Fly With Us", desc: 'Hide the "Fly With Us!" tagline' },
                      { key: "nomadGrid", label: "Nomad Grid Background", desc: "Animated grid in Nomad tab" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[12.5px] font-medium text-foreground">{item.label}</p>
                          {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
                        </div>
                        <Switch checked={localToggles[item.key as keyof typeof localToggles] as boolean}
                          onCheckedChange={() => { setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] })); markDirty(); }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Notifications</p>
                  <div className="space-y-4">
                    {[
                      { key: "nomadNotification", label: "Nomad Notifications", desc: "Pop-up every 3–5 minutes" },
                      { key: "philosopherNotification", label: "Fius Minds Notifications", desc: "Include Fius Minds variant" },
                      { key: "fiusGamesNotification", label: "Fius Games Notifications", desc: "Include Fius Games variant" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[12.5px] font-medium text-foreground">{item.label}</p>
                          {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
                        </div>
                        <Switch checked={localToggles[item.key as keyof typeof localToggles] as boolean}
                          onCheckedChange={() => { setLocalToggles(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] })); markDirty(); }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Function Bar Style */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Function Bar Style</p>
                  <p className="text-[10.5px] text-muted-foreground mb-3">Choose how quick-action buttons appear</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "square", label: "Square", preview: <div className="w-7 h-7 bg-zinc-400 dark:bg-zinc-500 rounded-[6px]" /> },
                      { value: "circle", label: "Circle", preview: <div className="w-7 h-7 bg-zinc-400 dark:bg-zinc-500 rounded-full" /> },
                    ].map(opt => (
                      <button key={opt.value}
                        onClick={() => { setFunctionBarStyle(opt.value); localStorage.setItem("functionBarStyle", opt.value); window.dispatchEvent(new Event("functionBarStyleChanged")); markDirty(); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95 ${functionBarStyle === opt.value ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        {opt.preview}
                        <span className={`text-[11px] font-semibold ${functionBarStyle === opt.value ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Bar Style */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Message Bar Style</p>
                  <p className="text-[10.5px] text-muted-foreground mb-3">Choose the height of the input area</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "default", label: "Default", preview: <div className="w-20 h-7 bg-zinc-300 dark:bg-zinc-600 rounded-xl" /> },
                      { value: "compact", label: "Compact", preview: <div className="w-20 h-4 bg-zinc-300 dark:bg-zinc-600 rounded-lg" /> },
                    ].map(opt => (
                      <button key={opt.value}
                        onClick={() => { setMessageBarStyle(opt.value); localStorage.setItem("messageBarStyle", opt.value); window.dispatchEvent(new Event("messageBarStyleChanged")); markDirty(); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95 ${messageBarStyle === opt.value ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        {opt.preview}
                        <span className={`text-[11px] font-semibold ${messageBarStyle === opt.value ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Background */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Chat Background</p>
                  <p className="text-[10.5px] text-muted-foreground mb-3">Background style for the chat area</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "plain", label: "Plain", preview: <div className="w-full h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-border/40" /> },
                      { value: "gradient", label: "Blue Sides", preview: <div className="w-full h-9 rounded-lg relative overflow-hidden bg-zinc-100 dark:bg-zinc-800"><div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-blue-400/60 to-transparent" /><div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-blue-400/60 to-transparent" /></div> },
                      { value: "rainbow", label: "Rainbow", preview: <div className="w-full h-9 rounded-lg" style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 20%, #eab308 40%, #22c55e 60%, #3b82f6 80%, #8b5cf6 100%)", opacity: 0.75 }} /> },
                      { value: "stars", label: "Stars", preview: <div className="w-full h-9 rounded-lg bg-zinc-900 relative overflow-hidden flex items-center justify-around px-2">{['15%','38%','55%','72%','88%'].map((l,i) => <div key={i} className="rounded-full bg-white/70" style={{ width: i%2===0?3:2, height: i%2===0?3:2 }} />)}</div> },
                      { value: "stars-gradient", label: "Stars + Blue", preview: <div className="w-full h-9 rounded-lg bg-zinc-900 relative overflow-hidden"><div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-blue-500/50 to-transparent" /><div className="absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-blue-500/50 to-transparent" /><div className="absolute inset-0 flex items-center justify-around px-4">{[0,1,2].map(i=><div key={i} className="w-0.5 h-0.5 rounded-full bg-white/60"/>)}</div></div> },
                      { value: "stars-rainbow", label: "Stars + Rainbow", preview: <div className="w-full h-9 rounded-lg relative overflow-hidden bg-zinc-900" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(24,24,27,0.95) 40%, rgba(24,24,27,0.95) 60%, rgba(139,92,246,0.3) 100%)" }}><div className="absolute inset-0 flex items-center justify-around px-4">{[0,1,2].map(i=><div key={i} className="w-0.5 h-0.5 rounded-full bg-white/50"/>)}</div></div> },
                    ].map(v => (
                      <button key={v.value} onClick={() => { setChatBg(v.value); onChatBgChange?.(v.value); markDirty(); }}
                        className={`flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all active:scale-95 ${chatBg === v.value ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        {v.preview}
                        <div className="flex items-center gap-1.5 px-0.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 border-2 ${chatBg === v.value ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                          <span className={`text-[11px] font-semibold ${chatBg === v.value ? "text-foreground" : "text-muted-foreground"}`}>{v.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nomad Order */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Nomad AI Order</p>
                  <div className="space-y-2">
                    {localAiOrder.map((name, i) => (
                      <div
                        key={name}
                        ref={el => { orderRowRefs.current[i] = el; }}
                        className={`flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#383838] rounded-xl border ${orderDraggingIndex === i ? '' : 'transition-all'} ${orderDragOverIndex === i && orderDraggingIndex !== i ? 'border-indigo-400 dark:border-indigo-500' : 'border-border/50'} ${orderDraggingIndex === i ? 'opacity-90 scale-[1.02] shadow-2xl ring-2 ring-indigo-400/60 relative z-10' : ''}`}
                        style={orderDraggingIndex === i ? { transform: `translateY(${orderDragOffsetY}px)` } : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            onPointerDown={handleOrderPointerDown(i)}
                            style={{ touchAction: 'none' }}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground p-1 -m-1"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <span className="text-[12.5px] font-medium text-foreground">{MODEL_NAMES[name] || name}</span>
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

      {/* ── Unsaved Changes Dialog (exact PC copy, centered) ── */}
      <Dialog open={showExitDialog} onOpenChange={open => { if (!open) setShowExitDialog(false); }}>
        <DialogContent className="bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 max-w-sm shadow-2xl rounded-2xl p-6 z-[200]">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white text-lg font-bold">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
              You have unsaved changes. Do you want to save them before leaving?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={handleDontSave}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Don't Save
            </Button>
            <Button
              onClick={handleSave}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Chat Background Overlay — identical to PC ───────────────────────────────
const STAR_DATA = [
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
];

function ChatBg({ bg }: { bg: string }) {
  if (bg === "plain" || !bg) return null;

  const showGradientSides = bg === "gradient" || bg === "stars-gradient" || bg === "rainbow" || bg === "stars-rainbow";
  const showStars = bg === "stars" || bg === "stars-gradient" || bg === "stars-rainbow";
  const isRainbow = bg === "rainbow" || bg === "stars-rainbow";
  const baseColor = "rgba(59,130,246,0.55)";
  const animation = isRainbow
    ? "gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite"
    : "gradient-breathe 3.5s ease-in-out infinite";

  return (
    <>
      {/* Animated gradient side strips — z:-1 so they stay behind all content */}
      {showGradientSides && (
        <>
          <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-[-1]"
            style={{ width: "24%", background: `linear-gradient(to right, ${baseColor}, transparent)`, animation, animationDelay: isRainbow ? "0s, 0s" : "0s" }} />
          <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-[-1]"
            style={{ width: "24%", background: `linear-gradient(to left, ${baseColor}, transparent)`, animation, animationDelay: isRainbow ? "0s, 0.5s" : "0s" }} />
        </>
      )}

      {/* Twinkling star dots — z:-1 so they stay behind all content */}
      {showStars && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-1]">
          {STAR_DATA.map((s, i) => (
            <div key={i} className="absolute rounded-full bg-foreground"
              style={{
                left: s.l, top: s.t,
                width: i % 3 === 0 ? "2px" : "1.5px",
                height: i % 3 === 0 ? "2px" : "1.5px",
                animation: `twinkle ${s.dur} ease-in-out infinite, star-drift-${(i % 4) + 1} ${s.ddur} ease-in-out infinite`,
                animationDelay: `${s.d}, ${s.dd}`,
              }} />
          ))}
        </div>
      )}
    </>
  );
}

// Own Mode owl background positions (mirrors star-bg pattern)
const OWL_BG_DATA_M = [
  {l:'5%',t:'8%',d:'0s',dur:'3.2s',dd:'0s',ddur:'9s',sz:'18px'},
  {l:'15%',t:'22%',d:'0.6s',dur:'2.8s',dd:'1.2s',ddur:'11s',sz:'14px'},
  {l:'28%',t:'6%',d:'1.2s',dur:'3.6s',dd:'0.5s',ddur:'8s',sz:'20px'},
  {l:'42%',t:'35%',d:'0.3s',dur:'2.6s',dd:'2.1s',ddur:'13s',sz:'16px'},
  {l:'55%',t:'12%',d:'1.5s',dur:'3.0s',dd:'0.8s',ddur:'10s',sz:'18px'},
  {l:'68%',t:'28%',d:'0.8s',dur:'2.9s',dd:'1.7s',ddur:'7s',sz:'15px'},
  {l:'78%',t:'5%',d:'0.4s',dur:'3.3s',dd:'0.3s',ddur:'12s',sz:'19px'},
  {l:'88%',t:'18%',d:'1.1s',dur:'2.7s',dd:'2.4s',ddur:'9s',sz:'14px'},
  {l:'10%',t:'45%',d:'1.8s',dur:'3.1s',dd:'1.0s',ddur:'11s',sz:'17px'},
  {l:'23%',t:'55%',d:'0.7s',dur:'2.8s',dd:'0.2s',ddur:'8s',sz:'16px'},
  {l:'37%',t:'65%',d:'1.0s',dur:'3.2s',dd:'1.8s',ddur:'14s',sz:'20px'},
  {l:'50%',t:'48%',d:'1.4s',dur:'2.5s',dd:'0.6s',ddur:'10s',sz:'15px'},
  {l:'63%',t:'70%',d:'0.3s',dur:'3.0s',dd:'2.2s',ddur:'9s',sz:'18px'},
  {l:'75%',t:'52%',d:'1.9s',dur:'2.9s',dd:'0.9s',ddur:'12s',sz:'14px'},
  {l:'85%',t:'40%',d:'0.9s',dur:'3.4s',dd:'1.4s',ddur:'7s',sz:'19px'},
  {l:'92%',t:'60%',d:'0.5s',dur:'2.7s',dd:'0.1s',ddur:'11s',sz:'16px'},
  {l:'7%',t:'75%',d:'1.6s',dur:'3.1s',dd:'2.0s',ddur:'8s',sz:'17px'},
  {l:'18%',t:'82%',d:'1.1s',dur:'2.6s',dd:'0.7s',ddur:'13s',sz:'14px'},
  {l:'32%',t:'88%',d:'0.6s',dur:'3.3s',dd:'1.5s',ddur:'10s',sz:'20px'},
  {l:'47%',t:'78%',d:'1.5s',dur:'2.8s',dd:'0.4s',ddur:'9s',sz:'15px'},
  {l:'60%',t:'85%',d:'1.0s',dur:'3.0s',dd:'1.9s',ddur:'11s',sz:'18px'},
  {l:'72%',t:'90%',d:'0.2s',dur:'2.5s',dd:'0.6s',ddur:'8s',sz:'16px'},
  {l:'82%',t:'75%',d:'1.3s',dur:'3.2s',dd:'2.3s',ddur:'12s',sz:'19px'},
  {l:'3%',t:'55%',d:'2.0s',dur:'3.1s',dd:'0.3s',ddur:'10s',sz:'17px'},
  {l:'48%',t:'20%',d:'0.4s',dur:'2.7s',dd:'1.6s',ddur:'14s',sz:'18px'},
  {l:'90%',t:'35%',d:'1.4s',dur:'3.3s',dd:'0.8s',ddur:'8s',sz:'15px'},
];

// ─── Tab icon map for PCHeader ────────────────────────────────────────────────
const TAB_ICONS: Record<string, { dark: string; light: string; size?: string }> = {
  ask:        { dark: '/tab-ask-dark.png',    light: '/tab-ask-light.png'    },
  nomad:      { dark: '/tab-nomad-dark.png',  light: '/tab-nomad-light.png'  },
  imagine:    { dark: '/tab-imagine-dark.png', light: '/tab-imagine-light.png' },
  philosopher:{ dark: '/tab-minds-dark.png',  light: '/tab-minds-light.png'  },
  games:      { dark: '/tab-games-dark.png',  light: '/tab-games-light.png',  size: 'w-5 h-5' },
  'fius-labs':{ dark: '/tab-labs-dark.png',   light: '/tab-labs-light.png',   size: 'w-5 h-5' },
};

// ─── PC-style Header ──────────────────────────────────────────────────────────
function PCHeader({ activeTab, onTabChange, onMenuClick, ownMode, onToggleOwnMode }: { activeTab: MobileTab; onTabChange: (t: MobileTab) => void; onMenuClick: () => void; ownMode?: boolean; onToggleOwnMode?: () => void; }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const [pcToggles, setPcToggles] = useState(() => { try { const s = localStorage.getItem("settingsToggles"); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  useEffect(() => {
    const h = () => { try { const s = localStorage.getItem("settingsToggles"); setPcToggles(s ? JSON.parse(s) : {}); } catch {} };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const showTabIcons = pcToggles.topbarTabIcons ?? true;
  const tabsHidden = pcToggles.tabsInSidebar ?? false;
  const glossy = pcToggles.glossyOutline ?? true;

  // Only track pill when tabs are visible
  const visibleTabs = tabsHidden ? [] : TABS;

  useEffect(() => {
    const idx = visibleTabs.findIndex(t => t.id === activeTab);
    const btn = tabRefs.current[idx]; const nav = navRef.current;
    if (!btn || !nav) return;
    const nr = nav.getBoundingClientRect(); const br = btn.getBoundingClientRect();
    setPill({ left: br.left - nr.left, width: br.width, ready: true });
  }, [activeTab, tabsHidden]);

  const cycleTheme = () => { if (theme === "light") setTheme("dark"); else if (theme === "dark") setTheme("system"); else setTheme("light"); };

  const navR = 14;
  return (
    <header className={`relative flex-shrink-0 bg-card px-2 py-1.5 flex items-center gap-1 z-[46] rounded-full mx-3 mt-2 mb-1 ${glossy ? 'border border-border glossy-outline' : ''}`}>
      <button onClick={onMenuClick} className="relative z-[46] w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        <Menu className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div ref={navRef} className="relative flex items-center min-w-max">
          {!tabsHidden && pill.ready && (
            <div aria-hidden style={{ position: "absolute", left: pill.left, width: pill.width, top: 1, bottom: 1, transition: "left 0.42s cubic-bezier(0.34,1.56,0.64,1), width 0.35s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none", zIndex: 0 }}>
              <div key={pill.left} style={{ position: "absolute", inset: 0, background: theme === "dark" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.09)", borderRadius: navR, boxShadow: theme === "dark" ? "0 1px 12px rgba(255,255,255,0.2)" : "0 1px 4px rgba(0,0,0,0.08)", animation: "pill-squish 0.44s cubic-bezier(0.22,1,0.36,1) 0.32s both" }} />
            </div>
          )}
          {!tabsHidden && TABS.map(({ id, label }, i) => {
            const iconSet = TAB_ICONS[id];
            return (
              <button key={id} ref={el => { tabRefs.current[i] = el; }} onClick={() => onTabChange(id)}
                className={`relative z-10 flex-shrink-0 text-[12px] px-2.5 py-1.5 rounded-2xl font-medium transition-colors duration-200 text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex flex-row items-center gap-1.5 ${activeTab === id ? "font-semibold" : ""}`}>
                {showTabIcons && iconSet && <img src={resolvedTheme === 'dark' ? iconSet.dark : iconSet.light} alt="" className={`${iconSet.size ?? 'w-3.5 h-3.5'} object-contain flex-shrink-0`} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={onToggleOwnMode}
        className={`w-8 h-8 flex items-center justify-center rounded-2xl transition-colors flex-shrink-0 border ${ownMode ? 'bg-zinc-900 dark:bg-zinc-700 border-zinc-500 shadow-md' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}
        title={ownMode ? 'Exit Owl Mode' : 'Owl Mode'}
      >
        <img src={resolvedTheme === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="Own Mode" className={`w-3.5 h-3.5 object-contain ${ownMode ? 'brightness-0 invert' : ''}`} />
      </button>
      <button onClick={cycleTheme} className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : theme === "system" ? <Monitor className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </button>
    </header>
  );
}

// ─── Welcome Cards (randomised each mount) ────────────────────────────────────

// ─── Ask Tab ──────────────────────────────────────────────────────────────────
function AskTab({ messages, isTyping, input, setInput, onSend, onStop, onNewChat, onRetry, model, setModel, user, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, onAttachmentSend, onDocumentMode, documentModeActive, onCancelDocumentMode, ownMode, onSwitchTab, centerViewport }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; onNewChat?: (content: string) => void; onRetry?: () => void;
  model: string; setModel: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  fiusIntegrationMode?: boolean; onIntegration?: () => void; onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  onAttachmentSend?: (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => void;
  onDocumentMode?: () => void; documentModeActive?: boolean; onCancelDocumentMode?: () => void;
  ownMode?: boolean; onSwitchTab?: (tab: MobileTab) => void;
  centerViewport?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const endRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [typingPlaceholder, setTypingPlaceholder] = useState('');
  const [glowAccentColor, setGlowAccentColor] = useState(() => getStoredGlowAccent());
  const [askLocalToggles] = useState(() => {
    try {
      const saved = localStorage.getItem("settingsToggles");
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        hideFiusLogo: parsed.hideFiusLogo === true,
        hideFlyWithUs: parsed.hideFlyWithUs === true,
      };
    } catch {
      return { hideFiusLogo: false, hideFlyWithUs: false };
    }
  });
  const [askMobileSettingToggles] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("settingsToggles");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);
  useEffect(() => {
    const handler = () => setGlowAccentColor(getStoredGlowAccent());
    window.addEventListener("glowAccentColorChanged", handler);
    return () => window.removeEventListener("glowAccentColorChanged", handler);
  }, []);
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

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}
      {/* Scroll to top/bottom buttons — fade when already at that extreme */}
      {messages.length > 2 && (
        <ScrollButtons scrollAreaRef={scrollAreaRef} />
      )}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-48" style={{ overscrollBehavior: "contain", position: 'relative', zIndex: 1 }}>
        {messages.length === 0 && !isTyping ? (
          <div className="flex flex-col items-center min-h-full text-center relative" style={{justifyContent: askLocalToggles.hideFiusLogo && askLocalToggles.hideFlyWithUs ? 'flex-end' : 'flex-start', paddingTop: askLocalToggles.hideFiusLogo && askLocalToggles.hideFlyWithUs ? 0 : 8, paddingBottom: askLocalToggles.hideFiusLogo && askLocalToggles.hideFlyWithUs ? 20 : 48, transition: 'padding 0.3s ease'}}>
            {/* Radial glow — center spread */}
            <div className="pointer-events-none absolute inset-0 z-0" style={{
              background: getGlowGradient(glowAccentColor, resolvedTheme, true)
            }} />
            {/* Welcome screen — crossfade between Fius and Owl Mode */}
            <div style={{position:'relative',width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
              {/* Fius welcome */}
              <div style={{opacity:ownMode?0:1,transition:'opacity 0.4s ease',position:ownMode?'absolute':'relative',pointerEvents:ownMode?'none':'auto',display:'flex',flexDirection:'column',alignItems:'center',width:'100%',top:0}}>
                {!(askLocalToggles.hideFiusLogo) && <FiusLogo size="xl" className="mt-2 mb-5 text-black dark:text-foreground" />}
                <h2 className="text-[22px] font-normal text-foreground mb-0.5">
                  {user?.displayName || user?.username
                    ? WELCOME_GREETINGS_M[welcomeGreetingM](user.displayName || user.username!)
                    : "Welcome to Fius"}
                </h2>
                {!(askLocalToggles.hideFlyWithUs) && <p className="text-sm text-black dark:text-foreground mb-7">Fly With Us!</p>}
              </div>
              {/* Owl Mode welcome */}
              <div style={{opacity:ownMode?1:0,transition:'opacity 0.4s ease',position:ownMode?'relative':'absolute',pointerEvents:ownMode?'auto':'none',display:'flex',flexDirection:'column',alignItems:'center',width:'100%',top:0}}>
                <img src={resolvedTheme==='dark'?'/incognito-dark.png':'/incognito-light.png'} alt="Owl Mode" className="own-mode-icon-m mb-5 h-24 w-24 object-contain" />
                <h2 className="text-[22px] font-bold text-foreground mb-1">Welcome to Owl Mode</h2>
                <p className="text-sm text-muted-foreground mb-7">Continue!</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const isLatestAI = m.role === "ai" && i === messages.length - 1;
              return <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} isLatest={isLatestAI}
                onNewChat={onNewChat} onRetry={m.role === "ai" ? onRetry : undefined}
                onRetryUser={m.role === "user" ? (content) => { setInput(content); } : undefined}
                onFollowUp={setInput} isStreaming={isLatestAI && isTyping} ownMode={ownMode}
                showUserMsgActions={askMobileSettingToggles.showUserMsgActions ?? false}
                showAiMsgActions={askMobileSettingToggles.showAiMsgActions ?? false} />;
            })}
            {isTyping && <ThinkingCloud />}
            <div ref={endRef} />
          </>
        )}
      </div>
      <div className={messages.length === 0 && !isTyping ? 'absolute left-0 right-0 z-20' : 'flex-shrink-0'} style={messages.length === 0 && !isTyping ? {top: 'calc(50% + 85px)', transform: 'translateY(-50%)'} : undefined}>
        {documentModeActive && (
          <div className="flex items-center gap-2 mx-3 mb-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-[11px] font-medium text-indigo-600 dark:text-indigo-300 w-fit">
            <FileSignature className="w-3.5 h-3.5" />
            Document mode — type a topic
            <button onClick={onCancelDocumentMode} className="ml-1 hover:text-red-500 transition-colors" data-testid="button-cancel-document-mode-mobile">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping} centerViewport={centerViewport && messages.length === 0 && !isTyping}
          placeholder={documentModeActive ? "e.g. Elon Musk — I'll write the full document…" : typingPlaceholder} tab="ask" model={model} onModelChange={setModel}
          fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode}
          onSettings={onSettings} onEducation={onEducation} showEnhance showModel
          onAttachmentSend={onAttachmentSend} onDocumentMode={onDocumentMode} documentModeActive={documentModeActive}
          hasMessages={messages.length > 0 || isTyping} />
        {/* Quick action chips — shown in empty state below msg bar */}
        {messages.length === 0 && !isTyping && (
          <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap px-3">
            {([
              { label: 'Create Visuals', light: '/quick-visuals-light.png', dark: '/quick-visuals-dark.png', action: () => onSwitchTab?.('imagine') },
              { label: 'Web Search',     light: '/quick-websearch-light.png', dark: '/quick-websearch-dark.png', action: () => setInput('Search the web for: ') },
              { label: 'Create Files',   light: '/quick-files-light.png', dark: '/quick-files-dark.png', action: () => onDocumentMode?.() },
              { label: 'Play Games',     light: '/quick-games-light.png', dark: '/quick-games-dark.png', action: () => onSwitchTab?.('games') },
            ] as const).map(({ label, light, dark, action }) => (
              <button key={label} onClick={action}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all active:scale-[0.96] bg-zinc-100 dark:bg-[#2e2e2e] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-600/30">
                <img src={resolvedTheme === 'dark' ? dark : light} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Nomad auto-mode typing text ─────────────────────────────────────────────
function NomadAutoTypingText({ text, msgId }: { text: string; msgId: string }) {
  const { displayed } = useTypingAnimation(text, `nomad-auto-${msgId}`, 28);
  return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{displayed}</p>;
}

// ─── Nomad multi-column message list with auto-scroll + typing animation ──────
function NomadColumnMsgs({ msgs, modelId, isTyping }: {
  msgs: { id: string; role: "user" | "ai"; content: string }[];
  modelId: string;
  isTyping: boolean;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, isTyping]);
  return (
    <div className="mx-2.5 flex-1 flex flex-col space-y-2 pb-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {msgs.map(msg => (
        <div key={msg.id} className={`p-2.5 rounded-lg text-sm relative group ${msg.role === "user" ? "bg-secondary text-secondary-foreground ml-3" : "bg-card border border-border text-foreground"}`}>
          {msg.role === "ai" && (() => { const cfg = NOMAD_CONFIG[modelId]; return cfg ? (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center rounded-full" style={{ background: cfg.color + '20', padding: 2 }}>
                <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${modelId === "gpt-4o" ? "dark:invert" : modelId === "grok-4" ? "brightness-0 dark:invert" : ""}`} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground">{cfg.name}</span>
            </div>
          ) : null; })()}
          {msg.role === "ai" ? <NomadAutoTypingText text={msg.content} msgId={msg.id} /> : msg.content}
          {msg.role === "ai" && (
            <button onClick={() => navigator.clipboard.writeText(msg.content)}
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10">
              <Copy className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
      {isTyping && <div className="flex justify-start"><ThinkingCloud /></div>}
      <div ref={endRef} />
    </div>
  );
}

// ─── Nomad Tab (multi-column + auto mode) ────────────────────────────────────────
function NomadTab({ input, setInput, onSend, isTyping, nomadMessages, nomadTyping, activeModels, onToggleModel, soloModel, setSoloModel, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode, nomadGrid, nomadHistSessionsProp, setNomadHistSessionsProp, centerViewport }: {
  input: string; setInput: (v: string) => void; onSend: () => void; isTyping: boolean;
  nomadMessages: Record<string, { id: string; role: "user" | "ai"; content: string }[]>;
  nomadTyping: Record<string, boolean>;
  nomadGrid?: boolean;
  activeModels: Set<string>; onToggleModel: (id: string) => void;
  soloModel: string | null; setSoloModel: (m: string | null) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
  nomadHistSessionsProp?: NomadSession[];
  setNomadHistSessionsProp?: React.Dispatch<React.SetStateAction<NomadSession[]>>;
  centerViewport?: boolean;
}) {
  const hasMessages = Object.values(nomadMessages).some(m => m.length > 0);
  const [nomadMode, setNomadMode] = useState<'multi' | 'auto'>('multi');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  // Use lifted state from parent if provided, otherwise manage internally
  const [nomadHistSessionsInternal, setNomadHistSessionsInternal] = useState<NomadSession[]>(() => {
    try { return JSON.parse(localStorage.getItem('fius-nomad-history') || '[]'); } catch { return []; }
  });
  const nomadHistSessions = nomadHistSessionsProp ?? nomadHistSessionsInternal;
  const setNomadHistSessions = (nomadHistSessionsProp !== undefined && setNomadHistSessionsProp) ? setNomadHistSessionsProp : setNomadHistSessionsInternal;

  // Sync Nomad history from server on mount
  useEffect(() => {
    authFetch('/api/nomad/history').then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setNomadHistSessions(data as NomadSession[]);
        try { localStorage.setItem('fius-nomad-history', JSON.stringify(data)); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Auto mode state
  const [autoMessages, setAutoMessages] = useState<{id: string, role: 'user'|'ai', content: string, pickedModel?: {model: string, modelName: string, logo: string, color: string}}[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [ultimatumCardsM, setUltimatumCardsM] = useState(() => shuffleUltimatumM(ULTIMATUM_CARD_POOL_M).slice(0, 2));
  const autoEndRef = useRef<HTMLDivElement>(null);
  const autoContainerRef = useRef<HTMLDivElement>(null);
  // Refresh cards every time user switches to Fius Ultimatum; scroll to top
  useEffect(() => {
    if (nomadMode === 'auto') {
      setUltimatumCardsM(shuffleUltimatumM(ULTIMATUM_CARD_POOL_M).slice(0, 2));
      setTimeout(() => { if (autoContainerRef.current) autoContainerRef.current.scrollTop = 0; }, 50);
    }
  }, [nomadMode]);

  // Apply user-saved AI order (from Settings → Preferences → Nomad AI Order)
  // to the front of the display list, appending any remaining default models.
  const savedOrder: string[] = (() => {
    try { const r = localStorage.getItem('nomadAiOrder'); return r ? JSON.parse(r) : []; } catch { return []; }
  })();
  const models = savedOrder.length > 0
    ? [...savedOrder.filter(id => NOMAD_DEFAULT_MODELS.includes(id)), ...NOMAD_DEFAULT_MODELS.filter(id => !savedOrder.includes(id))]
    : NOMAD_DEFAULT_MODELS;
  const iconFilter = (id: string) => id === "gpt-4o" ? "dark:invert" : id === "grok-4" ? "brightness-0 dark:invert" : "";
  const scrollRef = useRef<HTMLDivElement>(null);

  // displayOrder: active models in settings order first, disabled ones at end
  const [displayOrder, setDisplayOrder] = useState<string[]>(() => models);

  const handleToggleWithOrder = useCallback((modelId: string) => {
    const willBeActive = !activeModels.has(modelId);
    if (willBeActive) {
      // Re-enable: restore to settings position among active models
      setDisplayOrder(prev => {
        const withoutThis = prev.filter(id => id !== modelId);
        const activeOnes = withoutThis.filter(id => activeModels.has(id));
        const inactiveOnes = withoutThis.filter(id => !activeModels.has(id));
        const newActive = [...activeOnes, modelId].sort((a, b) => models.indexOf(a) - models.indexOf(b));
        return [...newActive, ...inactiveOnes];
      });
    } else {
      // Disable: animate to end
      setDisplayOrder(prev => [...prev.filter(id => id !== modelId), modelId]);
    }
    onToggleModel(modelId);
  }, [activeModels, models, onToggleModel]);
  const hasAIMessages = Object.values(nomadMessages).some(msgs => msgs.some(m => m.role === "ai"));

  // Ensure Nomad multi-panel starts scrolled to the far left (first model) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  const pickBestAI = (text: string): {model: string, modelName: string, logo: string, color: string} => {
    const t = text.toLowerCase();
    if (/\b(code|function|debug|python|javascript|typescript|algorithm|sql|bug|error|program)\b/.test(t))
      return { model: 'deepseek-r1', modelName: 'DeepSeek-V4-Pro', logo: '/deepseek-logo.png', color: '#3b82f6' };
    if (/\b(search|latest|news|current|today|2025|2026|who is|what is|when did|find me)\b/.test(t))
      return { model: 'perplexity', modelName: 'Perplexity Sonar Pro', logo: '/perplexity-logo.png', color: '#20808d' };
    if (/\b(math|calculate|equation|formula|solve|proof|integral|derivative)\b/.test(t))
      return { model: 'deepseek-r1', modelName: 'DeepSeek-V4-Pro', logo: '/deepseek-logo.png', color: '#3b82f6' };
    if (/\b(write|essay|story|poem|creative|draft|email|letter|blog)\b/.test(t))
      return { model: 'claude-3.5-sonnet', modelName: 'Claude Fable 5', logo: '/claude-logo.png', color: '#d97706' };
    return { model: 'gpt-4o', modelName: 'GPT-5.5 Pro', logo: '/chatgpt-logo.png', color: '#10a37f' };
  };

  const handleAutoSend = async () => {
    if (!input.trim() || autoLoading) return;
    const text = input.trim();
    setInput('');
    setAutoLoading(true);
    const picked = pickBestAI(text);
    const userMsgId = uid();
    const aiMsgId = uid();
    setAutoMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }, { id: aiMsgId, role: 'ai', content: '', pickedModel: picked }]);
    setTimeout(() => autoEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    const ctx = `You are ${picked.modelName}, operating within Fius — a multi-AI chat platform. Fius is NOT AI Fiesta — they are completely separate products. Fius is a platform that lets users chat with multiple top AIs in one place. Be helpful, accurate, and conversational.`;
    const history = autoMessages.slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    try {
      const res = await authFetch('/api/test-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, model: picked.model, systemPrompt: ctx, history }) });
      const data = res.ok ? await res.json() : null;
      setAutoMessages(prev => {
        const updated = prev.map(m => m.id === aiMsgId ? { ...m, content: data?.response || 'No response received.' } : m);
        const sess: NomadSession = { id: Date.now().toString(), ts: Date.now(), mode: 'auto', preview: text.slice(0, 60), autoMsgs: updated, multiMsgs: {} };
        setNomadHistSessions(prevH => { const next = [sess, ...prevH].slice(0, 20); try { localStorage.setItem('fius-nomad-history', JSON.stringify(next)); } catch { try { localStorage.setItem('fius-nomad-history', JSON.stringify(next.slice(0,5))); } catch {} } authFetch('/api/nomad/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: next }) }).catch(() => {}); return next; });
        return updated;
      });
    } catch {
      setAutoMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Connection error. Please try again.' } : m));
    }
    setAutoLoading(false);
    setTimeout(() => autoEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSendDispatch = () => { if (nomadMode === 'auto') handleAutoSend(); else onSend(); };

  return (
    <>
      {!soloModel && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-card">
          <button onClick={() => setNomadMode('multi')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${nomadMode === 'multi' ? 'bg-zinc-200 dark:bg-zinc-100 text-zinc-800 dark:text-zinc-900' : 'bg-secondary text-muted-foreground'}`}>
            ⬡ Multi
          </button>
          <button onClick={() => setNomadMode('auto')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${nomadMode === 'auto' ? 'bg-zinc-200 dark:bg-zinc-100 text-zinc-800 dark:text-zinc-900' : 'bg-secondary text-muted-foreground'}`}>
            <img src="/nomad-auto-icon.png" alt="auto" className={`w-3 h-3 object-contain ${nomadMode !== 'auto' ? 'dark:invert' : ''}`} />
            Fius Ultimatum
          </button>
          {nomadMode === 'auto' && <span className="text-[10px] text-muted-foreground">Best AI per prompt</span>}
        </div>
      )}
      {/* Solo mode back button */}
      {soloModel && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-card overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSoloModel(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4" /> All
          </button>
          {models.filter(id => id !== soloModel && activeModels.has(id)).map(id => {
            const cfg = NOMAD_CONFIG[id]; if (!cfg) return null;
            return (
              <button key={id} onClick={() => setSoloModel(id)} title={cfg.name}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-card hover:scale-110 transition-all overflow-hidden p-1 flex-shrink-0"
                style={{ borderColor: cfg.color }}>
                <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(id)}`}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </button>
            );
          })}
        </div>
      )}

      {/* === AUTO MODE CONTENT === */}
      {nomadMode === 'auto' && !soloModel && (
        <div ref={autoContainerRef} className={`flex-1 min-h-0 ${autoMessages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'} px-3 py-3`} style={{ scrollbarWidth: 'thin' }}>
          {autoMessages.length === 0 && !autoLoading && (
            <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#000000,#ffffff)' }}>
                <img src="/nomad-auto-icon.png" alt="auto" className="w-9 h-9 object-contain" style={{ filter: 'invert(1)' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Fius Ultimatum</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Fius picks the best AI for your prompt — coding, writing, math, search, and more.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {ultimatumCardsM.map(c => (
                  <div
                    key={c.label}
                    onClick={() => setInput(c.prompt)}
                    className="group relative rounded-xl border border-border bg-card p-2.5 text-left cursor-pointer active:scale-95 transition-all duration-150 overflow-hidden"
                    style={{ borderTop: `2px solid ${c.color}` }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 flex-shrink-0" style={{ background: c.color + '15' }}>
                      <c.Icon size={14} style={{ color: c.color }} strokeWidth={1.8} />
                    </div>
                    <p className="text-[11px] font-bold text-foreground mb-0.5 leading-tight">{c.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-snug mb-1.5">{c.prompt}</p>
                    <div className="flex items-center gap-1">
                      <img src={c.modelLogo} alt={c.modelName} className={`${c.modelLogo === '/fius-logo.png' ? 'w-7 h-7' : 'w-3 h-3'} object-contain rounded-full flex-shrink-0`} onError={e => { e.currentTarget.style.display='none'; }} />
                      <span className="text-[8px] font-semibold text-muted-foreground">{c.modelName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {autoMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-card rounded-3xl px-4 py-3 max-w-[85%] border border-border shadow-sm">
                    <p className="text-foreground text-sm">{msg.content}</p>
                  </div>
                ) : (
                  <div className="flex-1">
                    {msg.pickedModel && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 p-0.5" style={{ background: msg.pickedModel.color + '20' }}>
                          <img src={msg.pickedModel.logo} alt={msg.pickedModel.modelName} className={`w-full h-full object-contain ${iconFilter(msg.pickedModel.model)}`} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: msg.pickedModel.color }}>{msg.pickedModel.modelName}</span>
                      </div>
                    )}
                    {msg.content ? (
                      <NomadAutoTypingText text={msg.content} msgId={msg.id} />
                    ) : (
                      <ThinkingCloud />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={autoEndRef} />
          </div>
        </div>
      )}

      {/* === MULTI MODE CONTENT === */}
      {nomadMode === 'multi' && !soloModel && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative"
          style={nomadGrid ? { backgroundImage: 'linear-gradient(rgba(128,128,128,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.1) 1px, transparent 1px)', backgroundSize: '36px 36px' } : undefined}>
          <div ref={scrollRef} className="flex-1 min-h-0 flex flex-nowrap overflow-x-auto" style={{ scrollbarWidth: "thin", alignItems: "stretch", overscrollBehavior: "contain" }}>
            {displayOrder.map((modelId, idx) => {
              const cfg = NOMAD_CONFIG[modelId]; if (!cfg) return null;
              const isActive = activeModels.has(modelId);
              const isLast = idx === displayOrder.length - 1;
              const msgs = nomadMessages[modelId] || [];
              return (
                <motion.div
                  key={modelId}
                  layout
                  layoutId={modelId}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="flex-shrink-0 flex flex-col"
                  style={{ width: 220, opacity: isActive ? 1 : 0.45, borderRight: isLast ? 'none' : '1px solid rgba(128,128,128,0.25)' }}
                >
                  <div className="mx-2.5 mt-2.5 mb-2.5 rounded-xl border-2 transition-all duration-300 bg-card p-2.5 flex flex-col items-center gap-1"
                    style={{ borderColor: isActive ? (modelId === 'fius-ai' ? '#6b7280' : cfg.color) : "rgba(128,128,128,0.2)" }}>
                    <div className={`${modelId === "fius-ai" ? "w-12 h-12" : "w-8 h-8"} flex items-center justify-center flex-shrink-0 rounded-lg`} style={{ background: modelId === 'fius-ai' ? 'rgba(107,114,128,0.15)' : cfg.color + '20', padding: modelId === "fius-ai" ? 2 : 4 }}>
                      {modelId === "fius-ai"
                        ? <FiusLogo size="sm" scaleWhenCurrent="scale(1.65) translateY(3px)" />
                        : <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(modelId)}`}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                    <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{cfg.name}</span>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">{cfg.description}</span>
                    <div className="flex flex-col items-center gap-1.5 mt-1 w-full">
                      <button onClick={() => handleToggleWithOrder(modelId)} className="relative flex-shrink-0 rounded-full transition-all duration-300"
                        style={{ width: 36, height: 18, background: isActive ? (modelId === 'fius-ai' ? 'linear-gradient(135deg,#ffffff,#374151)' : cfg.color) : "#d1d5db" }}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${isActive ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
                      </button>
                      <button onClick={() => setSoloModel(modelId)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-95 w-full justify-center"
                        style={modelId === 'fius-ai' ? { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.3)' } : { background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}50` }}>
                        <Target className="w-2.5 h-2.5 flex-shrink-0" />
                        Chat only
                      </button>
                    </div>
                  </div>
                  <NomadColumnMsgs msgs={msgs} modelId={modelId} isTyping={!!nomadTyping[modelId]} />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Solo mode */}
      {soloModel && (() => {
        const cfg = NOMAD_CONFIG[soloModel];
        const msgs = nomadMessages[soloModel] || [];
        if (!cfg) return null;
        return (
          <div className="flex-1 min-h-0 px-4 pt-3 pb-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
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
                      <div className="rounded-3xl px-4 py-3 flex-1 border bg-card border-border text-foreground text-sm relative group">
                      <NomadAutoTypingText text={msg.content} msgId={msg.id} />
                      <button onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/10">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
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
                  <div className="flex items-center gap-1 py-1">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i*150}ms`, animationDuration:"0.9s" }} />)}
                  </div>
                </div></div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Nomad Summary panel */}
      {showSummary && (
        <div className="flex-shrink-0 mx-3 mb-1 rounded-xl border border-border bg-card p-3 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Summary</span>
            <button onClick={() => setShowSummary(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          {summarizing ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Analyzing AI responses…</span>
            </div>
          ) : (
            <>
              <div className="text-xs text-foreground leading-relaxed space-y-1.5">
                {summaryText.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <p key={i} className="font-bold text-foreground text-xs mt-2 first:mt-0">{line.replace('## ','')}</p>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-foreground text-xs">{line.replace(/\*\*/g,'')}</p>;
                  const boldLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                  return line ? <p key={i} className="text-xs" dangerouslySetInnerHTML={{ __html: boldLine }} /> : <div key={i} className="h-1" />;
                })}
              </div>
              {summaryText && (
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-muted-foreground mr-1 flex items-center gap-1"><Download className="w-3 h-3" />Download:</span>
                  {[
                    { label: 'TXT', action: () => downloadTxt(summaryText, 'nomad-summary') },
                    { label: 'MD', action: () => { const a = document.createElement('a'); a.href = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(summaryText); a.download = 'nomad-summary.md'; a.click(); } },
                    { label: 'PDF', action: () => downloadPdf(summaryText, 'Nomad AI Summary') },
                    { label: 'DOCX', action: () => downloadWordDoc(summaryText, 'nomad-summary') },
                    { label: 'PPTX', action: () => downloadPptx(summaryText, 'nomad-summary') },
                    { label: 'CSV', action: () => {
                      const rows = [['Section','Content']];
                      let section = '';
                      summaryText.split('\n').forEach(line => {
                        if (line.startsWith('## ')) { section = line.replace('## ',''); }
                        else if (line.trim()) { rows.push([section, line.replace(/\*\*/g,'')]);}
                      });
                      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(',')).join('\n');
                      const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'nomad-summary.csv'; a.click();
                    }},
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.action}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Nomad Summarize button — only in multi mode */}
      {hasAIMessages && !soloModel && nomadMode === 'multi' && (
        <div className="flex-shrink-0 px-3 pt-1 pb-0.5">
          <button onClick={async () => {
            if (showSummary) { setShowSummary(false); return; }
            const parts = Object.entries(nomadMessages)
              .filter(([,msgs]) => msgs.some(m => m.role === 'ai'))
              .map(([modelId, msgs]) => {
                const cfg = NOMAD_CONFIG[modelId];
                const aiMsgs = msgs.filter(m => m.role === 'ai').map(m => m.content).join('\n');
                return `**${cfg?.name || modelId}:**\n${aiMsgs}`;
              });
            setSummarizing(true);
            setShowSummary(true);
            setSummaryText('');
            try {
              const prompt = `Analyze these responses from multiple AI models and produce a structured report:\n\n${parts.join('\n\n---\n\n')}\n\nFormat your response EXACTLY as follows:\n\n## Summary\n[For each AI, write: **[AI Name]:** one-sentence summary of their response]\n\n## Similarities\n[Mention which AIs agreed, using their names. E.g. "GPT-4o and Claude both said..." or "All models agreed that..."]\n\n## Differences\n[Mention specific contrasts using names. E.g. "Grok said X, but Claude argued Y..." Be specific about WHO said WHAT.]\n\n## Conclusion\n[2-3 sentences on the overall takeaway and which response was most insightful and why.]\n\n## Best Response\n[Combine the strongest points from all AIs into one unified, corrected, and polished response. Fix any factual errors, fill gaps, and produce the best possible answer to the user's question using all available insights.]\n\nUse exact AI names. Be concise and clear.`;
              const res = await authFetch('/api/test-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt, conversationId: 'nomad-summary-mobile' }) });
              if (res.ok) { const data = await res.json(); setSummaryText(data.response || 'Could not generate summary.'); }
              else setSummaryText('Failed to generate summary.');
            } catch { setSummaryText('Failed to generate summary. Please try again.'); }
            finally { setSummarizing(false); }
          }}
            disabled={summarizing}
            className="w-full py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 flex items-center justify-center gap-2 transition-all">
            <Sparkles className="w-3 h-3" /> {summarizing ? 'Analyzing...' : showSummary ? 'Hide Summary' : 'Summarize Responses'}
          </button>
        </div>
      )}

      <MobileMessageBar value={input} onChange={setInput} onSend={handleSendDispatch} isTyping={isTyping || autoLoading} centerViewport={centerViewport && !hasMessages}
        placeholder={nomadMode === 'auto' ? "Ask anything — best AI auto-selected…" : "Ask all AIs at once…"} tab="nomad" showEnhance={false} showModel={false}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings}
        hasMessages={hasMessages} />
    </>
  );
}

// ─── Studio (Imagine) Tab — mirrors Ask tab UI ────────────────────────────────
function StudioTab({ messages, isTyping, input, setInput, onSend, onStop, onNewChat, onRetry, model, setModel, user, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, onAttachmentSend, onDocumentMode, documentModeActive, onCancelDocumentMode, centerViewport, isActive }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop?: () => void; onNewChat?: (content: string) => void; onRetry?: () => void;
  model?: string; setModel?: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  fiusIntegrationMode?: boolean; onIntegration?: () => void; onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  onAttachmentSend?: (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => void;
  onDocumentMode?: () => void; documentModeActive?: boolean; onCancelDocumentMode?: () => void;
  centerViewport?: boolean; isActive?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [studioGrid, setStudioGrid] = useState(() => localStorage.getItem("studioGrid") !== "false");
  const [studioMobileSettingToggles] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("settingsToggles");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const toggleStudioGrid = () => setStudioGrid(v => { const n = !v; localStorage.setItem("studioGrid", String(n)); return n; });
  const toggleModel = (id: string) =>
    setSelectedModels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);

  const STUDIO_COLS = [
    { id: 'fius-imagine-super', name: 'Fius Imagine Super', abbr: 'Fius',    sub: 'Ultra quality', logo: '/fius-logo.png',      gradient: 'from-violet-500 to-fuchsia-500', letter: '✦', color: '#8b5cf6' },
    { id: 'seedream-4.5',       name: 'Seedream 4.5',       abbr: 'Seedream', sub: 'Dreamlike art', logo: '/bytedance-logo.png', gradient: 'from-emerald-400 to-teal-500',   letter: '❋', color: '#10b981' },
    { id: 'nano-banana-pro',    name: 'Nano Banana Pro',    abbr: 'Nano',     sub: 'Fast & crisp',  logo: '/gemini-logo.png',    gradient: 'from-yellow-400 to-orange-400',  letter: '⚡', color: '#f59e0b' },
    { id: 'gpt-5.5-pro',        name: 'GPT 5.5 pro',        abbr: 'GPT 5.5',  sub: 'Precision AI',  logo: '/chatgpt-logo.png',   gradient: 'from-sky-400 to-blue-500',       letter: 'G',  color: '#0ea5e9' },
  ];

  const isEmpty = messages.length === 0 && !isTyping;
  const hideFiusLogoStudio = localStorage.getItem("hideFiusLogo") === "true";
  const hideFlyWithUsStudio = localStorage.getItem("hideFlyWithUs") === "true";

  return (
    <>
      {expandImg && (
        <div className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandImg(null)}>
          <img src={expandImg} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button onClick={() => setExpandImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
        </div>
      )}
      {isEmpty ? (
        /* ── Light reference-inspired studio home ── */
        <div className="relative flex-1 min-h-0 flex flex-col bg-background text-foreground">
          <div className="relative flex-1 min-h-0 overflow-y-auto px-4 pb-8">
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

            <div className="relative mx-auto flex w-full max-w-[640px] flex-col">
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card shadow-sm ring-1 ring-border"><Sparkles className="h-3.5 w-3.5 text-amber-400" /></span>
                  Fius Studio
                </div>
                <button onClick={toggleStudioGrid} className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm transition hover:bg-card">
                  {studioGrid ? "Models on" : "Models off"}
                </button>
              </div>

              <div className="flex flex-col items-center pt-[220px]">
                <h2 className="text-center tracking-[-0.055em] text-foreground" style={{ fontSize: 'clamp(24px,6vw,32px)', lineHeight: 1.15 }}>
                  <span className="font-extrabold">Fius Labs</span>{' '}
                  <span className="font-extrabold">Imagine Studio</span>
                </h2>
                <p className="mt-2 text-center font-medium text-muted-foreground" style={{ fontSize: 'clamp(13px,3.5vw,16px)' }}>The Canvas of Tomorrow ✦</p>

                <div className="mt-3 grid w-full grid-cols-2 gap-3">
                  <button onClick={onAttachmentSend ? () => onAttachmentSend([], [], "") : undefined}
                    className="group flex min-h-[88px] items-center gap-3 border border-border bg-card px-4 py-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md active:scale-[0.98]"
                    style={{ borderRadius: 22 }}>
                    <PenTool className="h-5 w-5 shrink-0 transition group-hover:scale-110" style={{ color: '#38bdf8' }} />
                    <span><span className="block text-xs font-semibold text-foreground">Editor</span><span className="mt-1 block text-[10px] text-muted-foreground">Transform a photo</span></span>
                  </button>
                  <button onClick={() => document.getElementById("mobile-studio-templates")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="group flex min-h-[88px] items-center gap-3 border border-border bg-card px-4 py-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md active:scale-[0.98]"
                    style={{ borderRadius: 22 }}>
                    <LayoutGrid className="h-5 w-5 shrink-0 transition group-hover:scale-110" style={{ color: '#a78bfa' }} />
                    <span><span className="block text-xs font-semibold text-foreground">Templates</span><span className="mt-1 block text-[10px] text-muted-foreground">Styles for every occasion</span></span>
                  </button>
                </div>
              </div>

              <section id="mobile-studio-templates" className="mt-7">
                <style>{`
                  @keyframes mobile-mq-left { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                  @keyframes mobile-mq-right { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
                `}</style>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-foreground">Templates <span className="ml-1 text-[10px] font-normal text-muted-foreground">{MOBILE_STUDIO_TEMPLATES.length} styles</span></h3>
                </div>
                <div className="flex flex-col gap-2">
                  {/* Row 1 — left */}
                  <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
                    <div className="flex gap-2 w-max" style={{ animation: 'mobile-mq-left 70s linear infinite' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'paused'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'running'}>
                      {[...MOBILE_STUDIO_TEMPLATES.slice(0,17), ...MOBILE_STUDIO_TEMPLATES.slice(0,17)].map((t, i) => (
                        <button key={`m1-${i}`} onClick={() => setInput(t.prompt)}
                          className="group relative shrink-0 overflow-hidden text-left"
                          style={{ width: 82, height: 112, borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', background: '#f0f0f0', transform: 'perspective(600px)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(-5deg) rotateX(3deg) translateY(-3px) scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(0,0,0,0.16)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'perspective(600px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; }}>
                          <img src={t.image} alt={t.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
                            <div className="px-1.5 pb-1.5"><div className="rounded-full py-0.5 text-center text-[8px] font-semibold text-white" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}>✦ Try</div></div>
                          </div>
                          <span className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 pt-6 text-[9px] font-semibold text-white group-hover:opacity-0 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Row 2 — right */}
                  <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
                    <div className="flex gap-2 w-max" style={{ animation: 'mobile-mq-right 85s linear infinite' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'paused'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.animationPlayState = 'running'}>
                      {[...MOBILE_STUDIO_TEMPLATES.slice(17), ...MOBILE_STUDIO_TEMPLATES.slice(17)].map((t, i) => (
                        <button key={`m2-${i}`} onClick={() => setInput(t.prompt)}
                          className="group relative shrink-0 overflow-hidden text-left"
                          style={{ width: 82, height: 112, borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', background: '#f0f0f0', transform: 'perspective(600px)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(5deg) rotateX(-3deg) translateY(-3px) scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(0,0,0,0.16)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'perspective(600px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; }}>
                          <img src={t.image} alt={t.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
                            <div className="px-1.5 pb-1.5"><div className="rounded-full py-0.5 text-center text-[8px] font-semibold text-white" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}>✦ Try</div></div>
                          </div>
                          <span className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 pt-6 text-[9px] font-semibold text-white group-hover:opacity-0 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.length > 2 && <ScrollButtons scrollAreaRef={scrollAreaRef} />}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-48" style={{ overscrollBehavior: "contain" }}>
            <>
              {messages.map((m, i) => {
                const isLatestAI = m.role === "ai" && i === messages.length - 1;
                return <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} isLatest={isLatestAI}
                  onNewChat={onNewChat} onRetry={m.role === "ai" ? onRetry : undefined}
                  onRetryUser={m.role === "user" ? (content) => { setInput(content); } : undefined}
                  onFollowUp={setInput} isStreaming={isLatestAI && isTyping}
                  showUserMsgActions={studioMobileSettingToggles.showUserMsgActions ?? false}
                  showAiMsgActions={studioMobileSettingToggles.showAiMsgActions ?? false} />;
              })}
              {isTyping && <ThinkingCloud />}
              <div ref={endRef} />
            </>
          </div>
          {documentModeActive && (
            <div className="flex items-center gap-2 mx-3 mb-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-[11px] font-medium text-indigo-600 dark:text-indigo-300 w-fit">
              <FileSignature className="w-3.5 h-3.5" />
              Document mode — type a topic
              <button onClick={onCancelDocumentMode} className="ml-1 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping}
            placeholder="Imagine anything…" tab="imagine" model={model} onModelChange={setModel}
            fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode}
            onSettings={onSettings} onEducation={onEducation} showEnhance showModel
            onAttachmentSend={onAttachmentSend} onDocumentMode={onDocumentMode} documentModeActive={documentModeActive}
            hasMessages={messages.length > 0 || isTyping} />
        </>
      )}
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
            <h2 className="text-xl font-bold text-foreground">Minds</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Choose a historical figure to converse with</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search personalities…"
              className="flex-1 bg-card border border-border rounded-2xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0" />
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
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all active:scale-[0.98] hover:bg-accent/50`}>
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
            <div className="flex items-center gap-1 py-2">
              {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i*0.15}s`, animationDuration:"0.9s" }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping}
        placeholder={`Talk with ${personality.name}...`} tab="philosopher" showEnhance={false} showModel={false}
        hasMessages={messages.length > 0 || isTyping} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MobileChatInterface({ onShowAuth }: { onShowAuth: () => void }) {
  const { resolvedTheme: mciTheme } = useTheme();
  const { toast } = useToast();
  const { usage: planUsage } = useUsage();
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
  // Free plan: only Fius Lite is usable in the Ask tab. Everything else needs Ultimate.
  const isChatModelLocked = useCallback((modelId: string) => isFreePlan && modelId !== 'fius-lite', [isFreePlan]);
  const { data: user } = useQuery<{ username: string; email: string; id: string; displayName?: string }>({ queryKey: ["/api/auth/user"], retry: false });
  const { data: convList = [] } = useQuery<Conv[]>({ queryKey: ["/api/conversations"], enabled: !!user });

  const [tab, setTab] = useState<MobileTab>("ask");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarOpenMode, setSidebarOpenMode] = useState<'mini' | 'full'>('mini');
  const centerEmptyBars = sidebarOpen && sidebarOpenMode === 'mini';
  const minimalMode = false;
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState("Fius Examination");
  const [fiusIntegrationMode, setFiusIntegrationMode] = useState(false);
  const [ownMode, setOwnMode] = useState(false);
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(() => localStorage.getItem("profilePicture") || undefined);
  const [mobileSettingToggles, setMobileSettingToggles] = useState(() => { try { const s = localStorage.getItem("settingsToggles"); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  // sync mobile settings when they change
  useEffect(() => { const handler = () => { try { const s = localStorage.getItem("settingsToggles"); setMobileSettingToggles(s ? JSON.parse(s) : {}); } catch {} }; window.addEventListener("storage", handler); return () => window.removeEventListener("storage", handler); }, []);

  // Ask
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askDocumentMode, setAskDocumentMode] = useState(false);
  const [askModel, setAskModelRaw] = useState("fius-lite");
  const setAskModel = useCallback((m: string) => {
    if (isChatModelLocked(m)) {
      toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" });
      return;
    }
    setAskModelRaw(m);
  }, [isChatModelLocked, toast]);
  const [topModelSheetOpen, setTopModelSheetOpen] = useState(false);
  useEffect(() => {
    if (isFreePlan) setAskModelRaw('fius-lite');
  }, [isFreePlan]);
  const [currentConvId, setCurrentConvId] = useState<string | undefined>(() => localStorage.getItem('currentProjectId') || undefined);
  const welcomeGreetingM = useMemo(() => pickGreetingIndexM(currentConvId), [currentConvId]);
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
  // Nomad history — lifted so sidebar can display it
  const [nomadHistSessions, setNomadHistSessions] = useState<NomadSession[]>(() => {
    try { return JSON.parse(localStorage.getItem('fius-nomad-history') || '[]'); } catch { return []; }
  });

  // Warm the Philosophers avatar cache and the Fius Games leaderboard/logo
  // data as soon as the mobile interface mounts — not when the user opens
  // those tabs — so both render instantly with no pop-in/blank state.
  useEffect(() => {
    preloadWikiImages(PHILOSOPHERS.map(p => p.wikiTitle || p.name), 3);
    preloadGamesData();
  }, []);
  const [nomadIsTyping, setNomadIsTyping] = useState<Record<string, boolean>>({});
  const [nomadSoloModel, setNomadSoloModel] = useState<string | null>(null);
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set(["gpt-4o", "claude-3.5-sonnet", "gemini-pro", "perplexity", "grok-4", "deepseek-r1", "doubao", "kimi", "qwen", "llama-4", "mistral", "fius-ai"]));
  const [showNomadNotif, setShowNomadNotif] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => setChatBg(localStorage.getItem("chatBg") || "plain");
    window.addEventListener("chatBgChanged", handler);
    return () => window.removeEventListener("chatBgChanged", handler);
  }, []);

  // Periodic notification — same as PC, starts after 8s then every 3-5 min
  useEffect(() => {
    const nomadNotifEnabled = localStorage.getItem("nomadNotification") !== "false";
    if (!nomadNotifEnabled) return;
    const scheduleNext = () => {
      const delay = 180000 + Math.random() * 120000; // 3–5 min
      notifTimerRef.current = setTimeout(() => {
        setShowNomadNotif(true);
      }, delay);
    };
    const initial = setTimeout(() => { setShowNomadNotif(true); }, 8000);
    return () => { clearTimeout(initial); if (notifTimerRef.current) clearTimeout(notifTimerRef.current); };
  }, []);

  const handleNotifClose = useCallback(() => {
    setShowNomadNotif(false);
    const delay = 180000 + Math.random() * 120000;
    notifTimerRef.current = setTimeout(() => setShowNomadNotif(true), delay);
  }, []);

  const projects = convList.map(c => ({ id: c.id, title: c.title || "New Chat", createdAt: new Date(c.createdAt), aiRole: c.aiRole, isProject: c.isProject }));

  const loadConv = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setAskMsgs(data.map((m: any) => ({ id: m.id || uid(), role: m.role === "assistant" ? "ai" : m.role, content: m.content, timestamp: new Date(m.createdAt || Date.now()) })));
    } catch { }
  }, []);

  // Restore last conversation on mount
  useEffect(() => {
    const saved = localStorage.getItem('currentProjectId');
    if (saved) loadConv(saved);
  }, [loadConv]);

  const handleSelectConv = useCallback((id: string) => { setCurrentConvId(id); localStorage.setItem('currentProjectId', id); setAskMsgs([]); setTab("ask"); loadConv(id); }, [loadConv]);
  const handleToggleOwlMode = useCallback(() => {
    if (ownMode) {
      setOwnMode(false);
      const latest = convList[0];
      if (latest) handleSelectConv(latest.id);
    } else {
      setOwnMode(true);
    }
  }, [ownMode, convList, handleSelectConv]);
  const handleNewChat = useCallback(() => { setCurrentConvId(undefined); localStorage.removeItem('currentProjectId'); setAskMsgs([]); setAskInput(""); setTab("ask"); }, []);

  const handleChatInNewChat = useCallback(async (content: string) => {
    try {
      const res = await authFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content.slice(0, 50) || "Continued Chat", model: askModel }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newId = data.id || data.conversation?.id;
      if (!newId) return;
      // Save the AI message to the backend so it appears in history
      await authFetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "[Continued from previous chat]", conversationId: newId, model: askModel, systemPrompt: `You previously said: "${content.slice(0, 300)}". The user wants to continue this conversation. Greet them and continue naturally.` }),
      }).catch(() => {});
      setCurrentConvId(newId);
      localStorage.setItem('currentProjectId', newId);
      setAskMsgs([{ id: uid(), role: "ai", content, timestamp: new Date() }]);
      setAskInput("");
      setTab("ask");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    } catch { }
  }, [askModel]);

  const handleDeleteConv = useCallback(async (id: string) => {
    try { await authFetch(`/api/conversations/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); if (id === currentConvId) handleNewChat(); } catch { }
  }, [currentConvId, handleNewChat]);

  const handleLogout = useCallback(async () => {
    try { endGuestSession(); await supabase.auth.signOut(); window.location.href = "/"; } catch { onShowAuth(); }
  }, [onShowAuth]);

  const ensureConv = useCallback(async (firstMsg?: string): Promise<string> => {
    if (currentConvId) return currentConvId;
    const title = firstMsg ? firstMsg.slice(0, 50) : "New Chat";
    const res = await authFetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, model: askModel }) });
    if (!res.ok) throw new Error("Could not create conversation");
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) { assignLogoStyleToConversation(newId); setCurrentConvId(newId); localStorage.setItem('currentProjectId', newId); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); return newId; }
    throw new Error("No ID");
  }, [currentConvId, askModel]);

  const handleAskAttachmentSend = useCallback(async (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => {
    setAskTyping(true);
    // Build user message — images shown as grid, files as chips, text as bubble
    const userMsg: Msg = {
      id: uid(), role: "user", content: text,
      images: images.length > 0 ? images.map(i => i.preview) : undefined,
      attachedFiles: files.length > 0 ? files.map(f => ({ name: f.name, size: f.size })) : undefined,
      timestamp: new Date(),
    };
    setAskMsgs(p => [...p, userMsg]);
    try {
      const convId = await ensureConv(text || (images.length > 0 ? "Image analysis" : files[0]?.name || "File"));
      if (images.length > 0) {
        // Analyze images — backend expects `imageData` field
        const imgDataUrl = images[0].preview;
        const res = await authFetch('/api/analyze-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: imgDataUrl, prompt: text || "What is in this image? Describe it in detail." })
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "API error"); }
        const data = await res.json();
        let aiContent = data.analysis || data.response || "I couldn't analyze the image.";
        if (images.length > 1) aiContent = `*(Analyzing image 1 of ${images.length})*\n\n${aiContent}`;
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: aiContent, timestamp: new Date() }]);
      } else if (files.length > 0) {
        // Read text-readable files, store content in msg for tap-to-view
        const readFile = (f: {file: File; name: string; size: string}): Promise<string> => new Promise((resolve) => {
          const isText = f.file.type.startsWith('text/') || /\.(txt|md|csv|json|xml|html|css|js|ts|py|java|c|cpp|sh|yaml|yml)$/i.test(f.name);
          if (!isText) { resolve(""); return; }
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string || "");
          reader.onerror = () => resolve("");
          reader.readAsText(f.file);
        });
        const contents = await Promise.all(files.map(f => readFile(f)));
        // Update msg with file content for tap-to-view
        setAskMsgs(p => p.map(m => m.id === userMsg.id
          ? { ...m, attachedFiles: files.map((f, i) => ({ name: f.name, size: f.size, content: contents[i] || undefined })) }
          : m
        ));
        const fileContext = files.map((f, i) => `--- File: ${f.name} ---\n${(contents[i] || "[binary file]").slice(0, 4000)}`).join('\n\n');
        const message = text ? `${text}\n\n${fileContext}` : `Please analyze the following file(s):\n\n${fileContext}`;
        const res = await authFetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId: convId, activeTab: "ask" }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || "I couldn't process the file.", timestamp: new Date() }]);
      } else if (text) {
        const res = await authFetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || "I couldn't generate a response.", timestamp: new Date() }]);
      }
    } catch { setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]); }
    finally { setAskTyping(false); }
  }, [ensureConv]);

  const handleAskSend = useCallback(async () => {
    if (tab !== "ask") return;
    if (isFreePlanExhausted) { showUpgradeLockToast(); return; }
    const text = askInput.trim(); if (!text || askTyping) return;
    const isDocRequest = askDocumentMode;
    setAskInput(""); setAskTyping(true);
    // Document mode now stays on across messages — user must cancel it manually
    // instead of it silently switching off after one message.
    setAskMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      // In Own Mode skip conversation creation — no data is saved
      const convId = ownMode ? '' : await ensureConv(text);
      askAbortRef.current?.abort();
      const ctrl = new AbortController(); askAbortRef.current = ctrl;
      // DuckDuckGo web search — same as PC
      let messageToSend = text;
      let sources: Array<{title: string; url: string; snippet: string}> = [];
      const skipSearch = isDocRequest || /^(hi|hello|hey|how are you|thanks|bye|ok|yes|no|lol|haha)[\s!?.]*$/i.test(text.trim()) || text.trim().split(/\s+/).length <= 2;
      if (!skipSearch) {
        try {
          const searchData = await Promise.race([
            authFetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null).catch(() => null),
            new Promise<null>(res2 => setTimeout(() => res2(null), 3000))
          ]);
          if (searchData) {
            const snippets: string[] = [];
            const seenUrls = new Set<string>();
            if (searchData.answer) snippets.push(`Instant answer: ${searchData.answer}`);
            if (searchData.abstract && searchData.abstractSource && searchData.abstractUrl) {
              snippets.push(`${searchData.abstractSource}: ${searchData.abstract}`);
              seenUrls.add(searchData.abstractUrl);
              sources.push({ title: searchData.abstractSource, url: searchData.abstractUrl, snippet: searchData.abstract.slice(0, 120) });
            }
            if (searchData.webResults?.length > 0) {
              searchData.webResults.slice(0, 5).forEach((r: { title: string; url: string; snippet: string }) => {
                if (!r.url || seenUrls.has(r.url)) return;
                seenUrls.add(r.url);
                if (r.snippet) snippets.push(`${r.title}: ${r.snippet}`);
                sources.push(r);
              });
            }
            if (snippets.length > 0) {
              messageToSend = `[Web search results for: "${text}"]\n${snippets.join('\n')}\n\n[Use the above search results to inform your answer. Do NOT list sources yourself — they are shown automatically below your response. Do NOT repeat source names inside your answer.]\nUser: ${text}`;
            }
          }
        } catch { }
      }
      const res = await authFetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: messageToSend, conversationId: convId, activeTab: "ask", documentMode: isDocRequest, documentTitle: text }), signal: ctrl.signal });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      let content = data.response || data.message || "I couldn't generate a response.";
      // Deduplicate sources once more by URL before appending
      const uniqueSrcs = sources.filter((s, i, a) => a.findIndex(x => x.url === s.url) === i).slice(0, 4);
      if (uniqueSrcs.length > 0 && !isDocRequest) {
        content += '\n\n---\n**Sources:**\n' + uniqueSrcs.map((s: {title: string; url: string}) => `• [${s.title}](${s.url})`).join('\n');
      }
      setAskMsgs(p => [...p, { id: uid(), role: "ai", content, timestamp: new Date(), isDocument: !!data.metadata?.isDocument, documentTitle: data.metadata?.documentTitle }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]);
    } finally {
      setAskTyping(false);
      // Refresh usage right away so the free-plan lock engages immediately
      // after the message that exhausts the limit, not after the next 30s poll.
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    }
  }, [askInput, askTyping, askDocumentMode, ensureConv, ownMode]);

  const handleImagSend = useCallback(async () => {
    const text = imagInput.trim(); if (!text || imagTyping) return;
    setImagInput(""); setImagTyping(true);
    const userMsgId = uid();
    const aiMsgId = uid();
    setImagMsgs(p => [...p, { id: userMsgId, role: "user", content: text, timestamp: new Date() }, { id: aiMsgId, role: "ai", content: "", imageUrl: "", isGenerating: true, timestamp: new Date() }]);
    try {
      const res = await authFetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text, size: "1024x1024" }) });
      const data = await res.json();
      setImagMsgs(p => p.map(m => m.id === aiMsgId ? { ...m, imageUrl: data.success && data.url ? data.url : undefined, content: data.success && data.url ? "" : "Image generation failed.", isGenerating: false } : m));
    } catch {
      setImagMsgs(p => p.map(m => m.id === aiMsgId ? { ...m, content: "Image generation failed.", imageUrl: undefined, isGenerating: false } : m));
    } finally {
      setImagTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    }
  }, [imagInput, imagTyping]);

  const handlePhilSend = useCallback(async () => {
    const text = philInput.trim(); if (!text || philTyping || !philPerson) return;
    setPhilInput(""); setPhilTyping(true);
    setPhilMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      philAbortRef.current?.abort();
      const ctrl = new AbortController(); philAbortRef.current = ctrl;
      const systemMsg = `You are ${philPerson.name} (${philPerson.era}), the ${philPerson.role}. Style: ${philPerson.style}. Stay in character at all times. User: ${text}`;
      const res = await authFetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: systemMsg, activeTab: "philosopher" }), signal: ctrl.signal });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || data.message || "…", timestamp: new Date() }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") setPhilMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong.", timestamp: new Date() }]);
    } finally {
      setPhilTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    }
  }, [philInput, philTyping, philPerson]);

  const handleNomadSend = useCallback(async () => {
    if (tab !== "nomad") return;
    const text = nomadInput.trim(); if (!text || nomadTyping) return;
    setNomadInput(""); setNomadTyping(true);
    // If Chat Only mode is active, only send to the selected model
    const activeIds = nomadSoloModel
      ? [nomadSoloModel]
      : Array.from(activeModels).filter(id => NOMAD_DEFAULT_MODELS.includes(id));
    // Add user message to each active model
    setNomadMessages(prev => {
      const updated = { ...prev };
      activeIds.forEach(id => { updated[id] = [...(updated[id] || []), { id: uid(), role: "user" as const, content: text }]; });
      return updated;
    });
    // Start typing for all
    setNomadIsTyping(prev => { const u = { ...prev }; activeIds.forEach(id => { u[id] = true; }); return u; });
    // Collect responses for history save
    const multiResponses: Record<string, { id: string; role: "user" | "ai"; content: string }[]> = {};
    await Promise.allSettled(activeIds.map(async (modelId) => {
      try {
        // Build per-model conversation history for memory
        const prevMsgs = (nomadMessages[modelId] || []).slice(-12).map(m => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));
        const res = await authFetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, activeTab: "nomad", history: prevMsgs }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const aiContent = data.response || data.message || "No response";
        setNomadMessages(prev => ({ ...prev, [modelId]: [...(prev[modelId] || []), { id: uid(), role: "ai" as const, content: aiContent }] }));
        multiResponses[modelId] = [
          { id: uid(), role: "user", content: text },
          { id: uid(), role: "ai", content: aiContent.slice(0, 400) },
        ];
      } catch {
        setNomadMessages(prev => ({ ...prev, [modelId]: [...(prev[modelId] || []), { id: uid(), role: "ai" as const, content: "Failed to get response." }] }));
      } finally {
        setNomadIsTyping(prev => ({ ...prev, [modelId]: false }));
      }
    }));
    setNomadTyping(false);
    // Save multi-mode session to history
    if (Object.keys(multiResponses).length > 0) {
      const sess: NomadSession = { id: Date.now().toString(), ts: Date.now(), mode: 'multi', preview: text.slice(0, 60), autoMsgs: [], multiMsgs: multiResponses };
      setNomadHistSessions(prevH => {
        const next = [sess, ...prevH].slice(0, 20);
        try { localStorage.setItem('fius-nomad-history', JSON.stringify(next)); } catch {}
        authFetch('/api/nomad/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: next }) }).catch(() => {});
        return next;
      });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
  }, [nomadInput, nomadTyping, activeModels, nomadMessages, nomadSoloModel]);

  const handleToggleModel = useCallback((id: string) => {
    setActiveModels(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
        setNomadMessages(prev2 => { const u = { ...prev2 }; delete u[id]; return u; });
        setNomadSoloModel(prev2 => prev2 === id ? null : prev2);
      } else {
        if (isNomadModelLocked(id)) {
          toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" });
          return prev;
        }
        n.add(id);
      }
      return n;
    });
  }, [isNomadModelLocked, toast]);

  // background handled by overlay components, not inline style
  const getChatBgStyle = (): React.CSSProperties => ({});

  const openVoiceMode = useCallback(() => {
    if (isFreePlanExhausted) { showUpgradeLockToast(); return; }
    if (isFreePlan) {
      toast({ title: "Locked on Free plan", description: "Voice Mode requires Fius Ultimate.", variant: "destructive" });
      return;
    }
    setVoiceModalOpen(true);
  }, [isFreePlan, isFreePlanExhausted, showUpgradeLockToast, toast]);

  const changeMobileTab = useCallback((t: MobileTab) => {
    if (isFreePlanExhausted && t !== tab) {
      showUpgradeLockToast();
      return;
    }
    if (isFreePlan && (t === "nomad" || t === "imagine" || t === "philosopher" || t === "games")) {
      const lockedLabel = t === "nomad" ? "Nomad (multi-AI compare)"
        : t === "imagine" ? "Imagine Studio"
        : t === "philosopher" ? "Fius Minds"
        : "Fius Games";
      toast({
        title: "Locked on Free plan",
        description: `${lockedLabel} requires Fius Ultimate.`,
        variant: "destructive",
      });
      return;
    }
    setTab(t);
  }, [isFreePlan, isFreePlanExhausted, showUpgradeLockToast, tab, toast]);

  const voiceHandlers = { onVoiceMode: openVoiceMode, onSettings: () => setSettingsOpen(true), onIntegration: () => setFiusIntegrationMode(v => !v), fiusIntegrationMode };

  return (
    <MinimalModeCtx.Provider value={minimalMode}>
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <div className={`fixed inset-0 bg-background flex flex-col overflow-hidden transition-[padding] duration-300 ${sidebarOpen && sidebarOpenMode === 'mini' ? 'md:pl-[76px]' : ''}`}
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

          {isFreePlanExhausted && (
            <div
              className="absolute inset-0 z-[45] cursor-not-allowed"
              onClick={showUpgradeLockToast}
            >
              <div className="absolute top-0 inset-x-0 flex justify-center pt-2 px-3" style={{ marginTop: "env(safe-area-inset-top)" }}>
                <div className="pointer-events-none text-[11px] font-semibold text-white bg-destructive/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-center">
                  Free plan limit reached — tap to upgrade
                </div>
              </div>
            </div>
          )}
          <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

          <Sidebar
            isOpen={sidebarOpen} openMode={sidebarOpenMode} onModeChange={setSidebarOpenMode} onClose={() => { setSidebarOpen(false); setSidebarOpenMode('mini'); }} onLogout={handleLogout}
            projects={projects} currentProjectId={currentConvId}
            onProjectSelect={id => { handleSelectConv(id); setSidebarOpen(false); setSidebarOpenMode('mini'); }}
            onNewProject={() => { handleNewChat(); setSidebarOpen(false); setSidebarOpenMode('mini'); }}
            onDeleteProject={handleDeleteConv}
            onEditProject={async (id, title) => { try { await apiRequest("PATCH", `/api/conversations/${id}`, { title }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { } }}
            onUpdateAiRole={async (id, aiRole) => { try { await apiRequest("PATCH", `/api/conversations/${id}`, { aiRole }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); } catch { } }}
            onOpenSettings={() => setSettingsOpen(true)}
            onVoiceClick={() => { setSidebarOpen(false); setSidebarOpenMode('mini'); openVoiceMode(); }}
            onImagineClick={() => { setSidebarOpen(false); setSidebarOpenMode('mini'); changeMobileTab("imagine"); }}
            onTabChange={(t) => { setSidebarOpen(false); setSidebarOpenMode('mini'); changeMobileTab(t as MobileTab); }}
            activeTab={tab}
            tabsInSidebar={mobileSettingToggles.tabsInSidebar ?? false}
            user={user ? { email: user.email, username: user.username } : undefined}
            onUserRename={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })}
            profilePicture={profilePicture}
            onProfilePictureChange={d => { setProfilePicture(d); localStorage.setItem("profilePicture", d); }}
            nomadHistory={nomadHistSessions.map(s => ({ id: s.id, ts: s.ts, mode: s.mode, preview: s.preview }))}
            onNomadHistorySelect={() => { setSidebarOpen(false); setSidebarOpenMode('mini'); changeMobileTab("nomad"); }}
          />

          <VoiceModeModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

          {educationOpen && (
            <EducationModal isOpen={educationOpen} onClose={() => setEducationOpen(false)}
              onStartExamination={async (data) => {
                setEducationOpen(false);
                setQuizTitle(`${data.class || "General"} · ${data.school || "Exam"}`);
                setQuizQuestions([]);
                setQuizLoading(true);
                setQuizOpen(true);
                try {
                  const res = await authFetch("/api/education/generate-quiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      examClass: data.class,
                      school: data.school,
                      country: data.country,
                      educationSystem: data.educationSystem,
                      topic: data.uploadedPages?.length ? `Based on uploaded study material (${data.uploadedPages.map(f => f.name).join(", ")})` : data.educationSystem || "General Knowledge",
                    }),
                  });
                  if (!res.ok) throw new Error("Failed");
                  const json = await res.json();
                  setQuizQuestions(json.questions || []);
                } catch {
                  setQuizQuestions([]);
                } finally {
                  setQuizLoading(false);
                }
              }}
              onStartSelfListen={() => setEducationOpen(false)} />
          )}

          <QuizModal
            isOpen={quizOpen}
            onClose={() => { setQuizOpen(false); setQuizQuestions([]); setQuizLoading(false); }}
            questions={quizQuestions}
            isLoading={quizLoading}
            title={quizTitle}
          />

          <MobileSettings
            isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
            user={user ? { email: user.email, username: user.username, displayName: user.displayName } : undefined}
            profilePicture={profilePicture}
            onUserRename={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })}
            onProfilePictureChange={d => { setProfilePicture(d); localStorage.setItem("profilePicture", d); }}
            model={askModel} onModelChange={setAskModel}
            onChatBgChange={bg => setChatBg(bg)}
          />

          {/* Notifications — same as PC, top-center pop-in */}
          {showNomadNotif && (
            <NomadNotification onClose={handleNotifClose} />
          )}

          {/* Header + model strip wrapped so we can add the bottom fade */}
          <div className="relative flex-shrink-0">
            <PCHeader activeTab={tab} onTabChange={changeMobileTab} onMenuClick={() => { setSidebarOpenMode('full'); setSidebarOpen(true); }} ownMode={ownMode} onToggleOwnMode={handleToggleOwlMode} />

            {/* Model strip — top-left under nav bar, only on Ask tab */}
            {tab === "ask" && (
              <>
                {topModelSheetOpen && (
                  <ModelSheet models={ASK_MODELS} current={askModel}
                    onSelect={m => { setAskModel(m); setTopModelSheetOpen(false); }}
                    onClose={() => setTopModelSheetOpen(false)}
                    isLocked={isChatModelLocked}
                    onLockedSelect={() => toast({ title: "Locked on Free plan", description: "Upgrade to Fius Ultimate to unlock this model.", variant: "destructive" })} />
                )}
                <div className="flex items-center px-3 pt-1.5 pb-0.5 flex-shrink-0">
                  <button onClick={() => setTopModelSheetOpen(true)}
                    className="h-7 px-3 rounded-full flex items-center gap-1.5 bg-white/80 dark:bg-white/[0.08] border border-black/8 dark:border-white/10 shadow-sm transition-all active:scale-95">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-400" />
                    <span className="text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                      {ASK_MODELS.find(m => m.id === askModel)?.name || askModel}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>
              </>
            )}

            {/* Seamless bottom fade — matches message bar's top fade, same blur feather effect */}
            <div
              className="absolute left-0 right-0 bottom-0 pointer-events-none"
              style={{
                height: 28,
                bottom: -28,
                background: "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
                zIndex: 5,
              }}
            />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "ask" ? 1 : 0, pointerEvents: tab === "ask" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <ChatBg bg={chatBg} />
              {/* Owl Mode star-field — always rendered; opacity transition handles enter/exit */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden"
                   style={{zIndex:0, opacity: ownMode ? 1 : 0, transition:'opacity 0.45s cubic-bezier(0.4,0,0.2,1)'}}>
                {OWL_BG_DATA_M.map((o, i) => (
                  <img key={i} src={mciTheme === 'dark' ? '/owl-dark.png' : '/owl-light.png'} alt=""
                    style={{position:'absolute',left:o.l,top:o.t,width:o.sz,height:o.sz,
                      animation:`own-owl-twinkle ${o.dur} ease-in-out infinite, star-drift-${(i%4)+1} ${o.ddur} ease-in-out infinite`,
                      animationDelay:`${o.d}, ${o.dd}`,opacity:0}} />
                ))}
              </div>
              <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
                onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
                onNewChat={handleChatInNewChat}
                onRetry={() => {
                  const lastUser = [...askMsgs].reverse().find(m => m.role === "user");
                  if (lastUser) { setAskMsgs(p => p.slice(0, -1)); setAskInput(lastUser.content); setTimeout(() => handleAskSend(), 50); }
                }}
                model={askModel} setModel={setAskModel} user={user}
                onAttachmentSend={handleAskAttachmentSend}
                onDocumentMode={() => { setAskDocumentMode(true); toast({ title: "Document mode: type a topic and I'll write the full document." }); }}
                documentModeActive={askDocumentMode}
                onCancelDocumentMode={() => setAskDocumentMode(false)}
                onEducation={() => setEducationOpen(true)} {...voiceHandlers}
                ownMode={ownMode} onSwitchTab={changeMobileTab} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "nomad" ? 1 : 0, pointerEvents: tab === "nomad" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
                isTyping={nomadTyping} nomadMessages={nomadMessages} nomadTyping={nomadIsTyping}
                activeModels={activeModels} onToggleModel={handleToggleModel} nomadGrid={localStorage.getItem("nomadGrid") !== "false"}
                soloModel={nomadSoloModel} setSoloModel={setNomadSoloModel}
                nomadHistSessionsProp={nomadHistSessions} setNomadHistSessionsProp={setNomadHistSessions}
                 {...voiceHandlers} centerViewport={centerEmptyBars} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "imagine" ? 1 : 0, pointerEvents: tab === "imagine" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <StudioTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput}
                 onSend={handleImagSend} {...voiceHandlers} centerViewport={centerEmptyBars} isActive={tab === "imagine"} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "philosopher" ? 1 : 0, pointerEvents: tab === "philosopher" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <PhilosopherTab messages={philMsgs} isTyping={philTyping} input={philInput} setInput={setPhilInput}
                onSend={handlePhilSend} onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
                personality={philPerson} setPersonality={p => { setPhilPerson(p); setPhilMsgs([]); }} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 overflow-hidden bg-background" style={{ opacity: tab === "games" ? 1 : 0, pointerEvents: tab === "games" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <FiusGames playerName={user?.displayName || user?.username || "Player"} userId={user?.id} />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
    </MinimalModeCtx.Provider>
  );
}
