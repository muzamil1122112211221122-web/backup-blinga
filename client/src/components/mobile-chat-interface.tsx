import React, { useState, useRef, useEffect, useCallback, Component, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiusGames } from "./fius-games";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { VoiceModeModal } from "./voice-mode-modal";
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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getVibrantColor } from "@/lib/utils";
import enhancePromptDark from "@assets/enhance_promt_button_-_Copy_1766904971885.png";
import enhancePromptLight from "@assets/enhance_promt_button_1766904971889.png";
import attachmentDark from "@assets/attachment_button_-_Copy_1766904971886.png";
import attachmentLight from "@assets/attachment_button_1766904971888.png";
import micDark from "@assets/mic_button_-_Copy_1766904971887.png";
import micLight from "@assets/mic_button_1766904971887.png";

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

interface Msg { id: string; role: "user" | "ai"; content: string; imageUrl?: string; timestamp: Date; isGenerating?: boolean; images?: string[]; attachedFiles?: Array<{name: string; size: string; content?: string}>; }
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
  "gpt-4o":          { name: "GPT-5.5 Pro",           logo: "/chatgpt-logo.png",    color: "#10a37f", description: "Advanced reasoning & multimodal AI by OpenAI" },
  "claude-3.5-sonnet":{ name: "Claude Fable 5",       logo: "/claude-logo.png",     color: "#f97316", description: "Nuanced writing, analysis & coding" },
  "gemini-pro":      { name: "Gemini 3.1 Ultra",       logo: "/gemini-logo.png",     color: "#14b8a6", description: "Google's multimodal reasoning model" },
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

// ─── Typing animation cache (module-level so it survives re-renders) ──────────
const _completedMsgs = new Map<string, boolean>();
const _progressMsgs = new Map<string, string>();

function useTypingAnimation(text: string, msgId: string, speed = 35) {
  const [displayed, setDisplayed] = useState(() =>
    _completedMsgs.has(msgId) ? text : (_progressMsgs.get(msgId) ?? "")
  );
  const [done, setDone] = useState(() => _completedMsgs.has(msgId));
  const init = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (_completedMsgs.has(msgId)) { setDisplayed(text); setDone(true); return; }
    if (init.current) return;
    init.current = true;
    if (!text) { setDone(true); return; }
    setDone(false);
    const words = text.split(" ").filter(w => w.trim());
    const existing = _progressMsgs.get(msgId) ?? "";
    let idx = existing ? existing.split(" ").filter(w => w.trim()).length : 0;
    const step = () => {
      if (idx < words.length) {
        const next = words.slice(0, idx + 1).join(" ");
        setDisplayed(next); _progressMsgs.set(msgId, next); idx++;
        timer.current = setTimeout(step, speed);
      } else {
        setDone(true); _completedMsgs.set(msgId, true); _progressMsgs.delete(msgId);
      }
    };
    timer.current = setTimeout(step, idx === 0 ? 50 : 0);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []); // eslint-disable-line
  return { displayed, done };
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
          <Logo size="sm" />
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
    fetch('/api/suggest-followups', {
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

function MsgBubble({ msg, onExpandImg, onNewChat, onRetry, onRetryUser, isLatest, onFollowUp, isStreaming }: { msg: Msg; onExpandImg?: (s: string) => void; onNewChat?: (content: string) => void; onRetry?: () => void; onRetryUser?: (content: string) => void; isLatest?: boolean; onFollowUp?: (q: string) => void; isStreaming?: boolean }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [msgExpanded, setMsgExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"up" | "down">("up");
  const [feedbackSelected, setFeedbackSelected] = useState<Set<string>>(new Set());
  const [feedbackText, setFeedbackText] = useState("");
  const audioSrcRef = useRef<AudioBufferSourceNode | null>(null);

  const { displayed, done } = useTypingAnimation(
    !isUser && isLatest ? msg.content : "",
    msg.id
  );
  const shownText = (!isUser && isLatest) ? displayed : msg.content;

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
      const res = await fetch('/api/tts', {
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
      <div className={`flex gap-3 mb-2 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200 relative`}>
        {!isUser && <Logo size="sm" className="flex-shrink-0 mt-1 ml-1" />}
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
                <div className={`bg-card rounded-3xl px-4 py-3 shadow-sm border border-border chat-bubble text-foreground text-[13.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] break-all`}>
                  {msg.content}
                  <div className="flex items-center justify-end gap-0.5 mt-1.5">
                    <button onClick={handleCopy}
                      className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                      {copied ? <Check className="w-4 h-4 text-blue-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onRetryUser?.(msg.content)}
                      className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {/* Copy/retry when no text */}
              {!msg.content && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <button onClick={() => onRetryUser?.("")}
                    className="h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90">
                    <RefreshCw className="w-4 h-4" />
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
                    <div className={`${!done ? "typing-message" : ""}`}>
                      {isUser ? (
                        <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-foreground py-1">
                          {mainText.length > 200 && !msgExpanded ? `${mainText.slice(0, 200).trim()}…` : mainText}
                        </div>
                      ) : (
                        <MobileMarkdown text={mainText} />
                      )}
                      {!done && <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-middle" />}
                    </div>
                    {!isUser && parsedSrcs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          Sources
                        </p>
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

          {!isUser && done && (
            <div className="flex items-center gap-0.5 mt-1">
              <button onClick={handleLike} className={`${ab} ${liked === "up" ? "text-green-500 bg-green-50 dark:bg-green-950" : ""}`}>
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button onClick={handleDislike} className={`${ab} ${liked === "down" ? "text-red-500 bg-red-50 dark:bg-red-950" : ""}`}>
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button onClick={handleCopy} className={`${ab} ${copied ? "text-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={ab}><MoreHorizontal className="w-4 h-4" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[185px] z-[200]">
                  <DropdownMenuItem onClick={handleSpeak}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                    {speaking ? <Square className="w-3.5 h-3.5 text-blue-500" /> : <Volume2 className="w-3.5 h-3.5 text-violet-500" />}
                    {speaking ? 'Stop reading' : 'Read aloud'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRetry} disabled={!onRetry}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white disabled:opacity-40">
                    <RefreshCw className="w-3.5 h-3.5 text-green-500" /> Regenerate
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
function ModelSheet({ models, current, onSelect, onClose }: {
  models: { id: string; name: string }[]; current: string; onSelect: (id: string) => void; onClose: () => void;
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
          {models.map((opt, i) => (
            <button key={opt.id} onClick={() => { onSelect(opt.id); handleClose(); }}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors active:bg-accent/60 ${opt.id === current ? "bg-accent/70" : "hover:bg-accent/40"} ${i > 0 ? "border-t border-border/30" : ""}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.id === current ? "bg-foreground" : "bg-zinc-400"}`} />
              <span className="text-[14px] font-semibold text-foreground flex-1 text-left">{opt.name}</span>
              {opt.id === current && <Check className="w-4 h-4 text-foreground" />}
            </button>
          ))}
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
  model?: string; onModelChange?: (m: string) => void;
  fiusIntegrationMode?: boolean; onIntegration?: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  showEnhance?: boolean; showModel?: boolean; onCameraRef?: () => void;
  hidden?: boolean;
  onAttachmentSend?: (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => void;
}

function MobileMessageBar({ value, onChange, onSend, onStop, isTyping, placeholder, tab, model, onModelChange, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, showEnhance = true, showModel = true, hidden = false, onAttachmentSend }: MsgBarProps) {
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
  const [fnBarStyle, setFnBarStyle] = useState(() => localStorage.getItem("functionBarStyle") || "circle");
  const [msgBarStyle, setMsgBarStyle] = useState(() => localStorage.getItem("messageBarStyle") || "compact");
  const [expandOpen, setExpandOpen] = useState(false);
  const [longAnswer, setLongAnswer] = useState(false);
  const [promptInlineExpanded, setPromptInlineExpanded] = useState(false);
  const expandTaRef = useRef<HTMLTextAreaElement>(null);
  const overlayDrag = useDragDismiss(() => setExpandOpen(false), 60);

  useEffect(() => {
    const h1 = () => setFnBarStyle(localStorage.getItem("functionBarStyle") || "circle");
    const h2 = () => setMsgBarStyle(localStorage.getItem("messageBarStyle") || "compact");
    window.addEventListener("functionBarStyleChanged", h1);
    window.addEventListener("messageBarStyleChanged", h2);
    return () => { window.removeEventListener("functionBarStyleChanged", h1); window.removeEventListener("messageBarStyleChanged", h2); };
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
      const res = await fetch("/api/enhance-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalPrompt: value }) });
      const data = await res.json();
      if (data.enhancedPrompt) onChange(data.enhancedPrompt);
    } catch { } finally { setIsEnhancing(false); }
  };

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
    const formatSize = (b: number) => b > 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
    const newFiles = toProcess.map(f => ({ file: f, name: f.name, size: formatSize(f.size) }));
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
  const iconBtnCls = "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 bg-zinc-200/70 dark:bg-white/[0.07] hover:bg-zinc-300/70 dark:hover:bg-white/[0.12]";
  // Theme-aware icon: btn-icon applies brightness(0)+drop-shadow in light, brightness(0)+invert in dark — same as PC
  const imgCls = "w-4 h-4 btn-icon";
  const showFnBar = tab !== "philosopher" && tab !== "games";

  // Function bar button: matches PC renderFunctionBtn style, scaled for mobile
  const isCircleFn = fnBarStyle !== "square";
  const FnBtn = ({ onClick, icon, label, active, activeStyle }: {
    onClick?: () => void; icon: React.ReactNode; label: string;
    active?: boolean; activeStyle?: string;
  }) => {
    const defaultStyle = "text-zinc-800 dark:text-white/85 bg-white dark:bg-[#303030]";
    const resolvedActive = active ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-none" : undefined;
    const btnStyle = activeStyle || resolvedActive || defaultStyle;
    return (
      <button onClick={onClick}
        className="flex flex-col items-center gap-1 group flex-shrink-0 px-1 py-0.5">
        <div className={`w-11 h-11 ${isCircleFn ? "rounded-full" : "rounded-[10px]"} flex items-center justify-center transition-all duration-300 group-active:scale-[1.2] macos-button glossy-outline ${btnStyle}`}>
          {icon}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </button>
    );
  };

  return (
    <>
    <div className="relative flex-shrink-0 bg-background" style={{ zIndex: 1 }}>
      {/* Fade feather — invisible for first 70%, solidifies only at the very bottom */}
      <div
        className="absolute left-0 right-0 pointer-events-none bg-gradient-to-b from-transparent from-0% via-transparent via-[70%] to-background"
        style={{ top: -85, height: 85 }}
      />
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
        <div className="macos-function-bar flex items-center justify-center mb-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <FnBtn
              onClick={onIntegration}
              active={fiusIntegrationMode}
              icon={<img src="/integration-icon.png" alt="" className="w-5 h-5 btn-icon" />}
              label="Long Answer"
            />
            <FnBtn onClick={onVoiceMode} icon={<AudioLines className="w-5 h-5" />} label="Voice Mode" />
            <FnBtn onClick={onSettings} icon={<img src="/settings-icon.png" alt="" className="w-5 h-5 btn-icon" />} label="Settings" />
            {model === "fius-education" && onEducation && (
              <FnBtn onClick={onEducation}
                activeStyle="text-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-none"
                active
                icon={<GraduationCap className="w-5 h-5" />} label="Education" />
            )}
          </div>
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
      <div className={`bg-white dark:bg-[#303030] glossy-outline overflow-hidden relative ${msgBarStyle === "default" ? "rounded-[1.5rem]" : "rounded-full"}`}>

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
              <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKey}
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
                      <img src={attachmentLight} alt="Attach" className={imgCls} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]" side="top" align="start">
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                      <FileText className="w-4 h-4 text-zinc-400" /><span>Upload File</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                      <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                    </DropdownMenuItem>
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
                  <img src={micLight} alt="Mic" className={imgCls} />
                </button>
                {showEnhance && (
                  <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing} className={`${iconBtnCls} disabled:opacity-30`}>
                    {isEnhancing ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      : <img src={enhancePromptLight} alt="Enhance" className={imgCls} />}
                  </button>
                )}
                {isTyping ? (
                  <button onClick={onStop} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 transition-all">
                    <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
                  </button>
                ) : (
                  <button onClick={handleSend} disabled={!value.trim() && !attachedImages.length && !attachedFiles.length}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 disabled:opacity-30 transition-all">
                    <ArrowUp className="w-4 h-4 text-white dark:text-black" />
                  </button>
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
                    <img src={attachmentLight} alt="Attach" className={imgCls} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#303030] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]" side="top" align="start">
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                    <FileText className="w-4 h-4 text-zinc-400" /><span>Upload File</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                    <Image className="w-4 h-4 text-zinc-400" /><span>Upload Image</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative flex-1">
                <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKey}
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
                <img src={micLight} alt="Mic" className={imgCls} />
              </button>
              {showEnhance && (
                <button onClick={handleEnhance} disabled={!value.trim() || isEnhancing} className={`${iconBtnCls} flex-shrink-0 disabled:opacity-30`}>
                  {isEnhancing ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    : <img src={isDark ? enhancePromptDark : enhancePromptLight} alt="Enhance" className={imgCls} />}
                </button>
              )}
              {isTyping ? (
                <button onClick={onStop} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 transition-all">
                  <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-800" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!value.trim() && !attachedImages.length && !attachedFiles.length}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white flex-shrink-0 active:scale-90 disabled:opacity-30 transition-all hover:bg-zinc-700 dark:hover:bg-zinc-100">
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
                  : <img src={isDark ? enhancePromptDark : enhancePromptLight} alt="Enhance" className="w-4 h-4 btn-icon" />}
              </button>
            )}
            {/* Long Answer toggle */}
            <button onClick={() => setLongAnswer(v => !v)}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-all active:scale-90 flex-shrink-0 text-[11px] font-semibold ${longAnswer ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
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
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-white active:scale-90 disabled:opacity-30 transition-all flex-shrink-0">
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
  });
  const [functionBarStyle, setFunctionBarStyle] = useState(() => localStorage.getItem("functionBarStyle") || "circle");
  const [messageBarStyle, setMessageBarStyle] = useState(() => localStorage.getItem("messageBarStyle") || "compact");
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
    functionBarStyle: "circle", messageBarStyle: "compact",
    togglesRaw: {} as Record<string, string>,
  });

  const TOGGLE_KEYS = ["autoScroll","richText","improveModel","personalize","nomadGrid","nomadNotification","philosopherNotification","fiusGamesNotification","wrapLines","showPreviews","showFiusLogo"];

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
      const togglesRaw: Record<string,string> = {};
      TOGGLE_KEYS.forEach(k => { togglesRaw[k] = localStorage.getItem(k) ?? ""; });

      originalValuesRef.current = { aiPreset: preset, customInstructions: instructions, chatBg: bg, functionBarStyle: fnStyle, messageBarStyle: msgStyle, togglesRaw };

      setSelectedPreset(preset);
      setCustomInstructions(instructions);
      setChatBg(bg);
      setFunctionBarStyle(fnStyle);
      setMessageBarStyle(msgStyle);
      setLocalToggles(makeTogglesBool());
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
    Object.entries(orig.togglesRaw).forEach(([k, v]) => {
      if (v === "") localStorage.removeItem(k); else localStorage.setItem(k, v);
    });
    onChatBgChange?.(orig.chatBg);
    window.dispatchEvent(new Event("chatBgChanged"));
    window.dispatchEvent(new Event("functionBarStyleChanged"));
    window.dispatchEvent(new Event("messageBarStyleChanged"));
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
    Object.entries(localToggles).forEach(([k, v]) => localStorage.setItem(k, String(v)));
    window.dispatchEvent(new Event("functionBarStyleChanged"));
    window.dispatchEvent(new Event("messageBarStyleChanged"));
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
  };

  const MODEL_NAMES: Record<string, string> = { "gpt-4o": "ChatGPT 5", "claude-3.5-sonnet": "Claude Sonnet 4", "gemini-pro": "Gemini 2.5 Pro", "perplexity": "Perplexity Sonar Pro", "grok-4": "Grok 4", "deepseek-r1": "Deepseek v3", "fius-ai": "Fius Pro" };
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
                    background: "var(--foreground)",
                    borderRadius: 12,
                    boxShadow: "0 1px 8px rgba(0,0,0,0.18)",
                    transition: "left 0.35s cubic-bezier(0.23,1,0.32,1), width 0.35s cubic-bezier(0.23,1,0.32,1)",
                    pointerEvents: "none",
                    zIndex: 0,
                  }} />
                )}
                {menuItems.map((item, i) => (
                  <button key={item.id}
                    ref={el => { settingsTabRefs.current[i] = el; }}
                    onClick={() => setActiveSection(item.id)}
                    className={`relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-[12px] font-semibold transition-colors duration-200 ${activeSection === item.id ? "text-background" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground"}`}>
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={settingsContentScrollRef} key={activeSection} className="flex-1 overflow-y-auto p-4 relative" style={{ animation: "fadeSlideIn 0.18s cubic-bezier(0.23,1,0.32,1) both" }}>
            <SettingsScrollButtons scrollAreaRef={settingsContentScrollRef} />
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
                <div className="p-4 bg-zinc-50 dark:bg-[#1a1a1a] rounded-2xl border border-border/50">
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
                      { key: "wrapLines", label: "Wrap Long Lines", desc: "Wrap code blocks by default" },
                      { key: "showPreviews", label: "Conversation Previews", desc: "Show previews in history sidebar" },
                      { key: "showFiusLogo", label: "Show Fius Logo in Responses", desc: "Display logo next to AI replies" },
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
                      { key: "philosopherNotification", label: "Philosophers Notifications", desc: "Include Philosophers variant" },
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
                      { value: "plain", label: "Plain" },
                      { value: "gradient", label: "Blue Sides" },
                      { value: "rainbow", label: "Rainbow" },
                      { value: "stars", label: "Stars" },
                      { value: "stars-gradient", label: "Stars + Blue" },
                      { value: "stars-rainbow", label: "Stars + Rainbow" },
                    ].map(v => (
                      <button key={v.value} onClick={() => { setChatBg(v.value); onChatBgChange?.(v.value); markDirty(); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 ${chatBg === v.value ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "border-border/50 bg-card hover:bg-accent/50"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 ${chatBg === v.value ? "bg-foreground border-foreground" : "border-muted-foreground/40"}`} />
                        <span className={`text-[12px] font-semibold ${chatBg === v.value ? "text-foreground" : "text-muted-foreground"}`}>{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nomad Order */}
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Nomad AI Order</p>
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

  const navR = 14;
  return (
    <header className="flex-shrink-0 bg-card border border-border px-2 py-1.5 flex items-center gap-1 z-10 rounded-full mx-3 mt-2 mb-1 glossy-outline">
      <button onClick={onMenuClick} className="w-8 h-8 flex items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0">
        <Menu className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div ref={navRef} className="relative flex items-center min-w-max">
          {pill.ready && (
            <div aria-hidden style={{ position: "absolute", left: pill.left, width: pill.width, top: 1, bottom: 1, background: theme === "dark" ? "rgba(255,255,255,0.92)" : "white", borderRadius: navR, boxShadow: theme === "dark" ? "0 1px 12px rgba(255,255,255,0.2)" : "0 1px 8px rgba(0,0,0,0.14)", transition: "left 0.35s cubic-bezier(0.23,1,0.32,1), width 0.35s cubic-bezier(0.23,1,0.32,1)", pointerEvents: "none", zIndex: 0 }} />
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
function AskTab({ messages, isTyping, input, setInput, onSend, onStop, onNewChat, onRetry, model, setModel, user, fiusIntegrationMode, onIntegration, onVoiceMode, onSettings, onEducation, onAttachmentSend }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void;
  onSend: () => void; onStop: () => void; onNewChat?: (content: string) => void; onRetry?: () => void;
  model: string; setModel: (m: string) => void;
  user?: { username: string; email: string; displayName?: string };
  fiusIntegrationMode?: boolean; onIntegration?: () => void; onVoiceMode?: () => void; onSettings?: () => void; onEducation?: () => void;
  onAttachmentSend?: (images: Array<{file: File; preview: string}>, files: Array<{file: File; name: string; size: string}>, text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
      {/* Scroll to top/bottom buttons — fade when already at that extreme */}
      {messages.length > 2 && (
        <ScrollButtons scrollAreaRef={scrollAreaRef} />
      )}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
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
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-white dark:bg-zinc-900 text-left active:scale-[0.97] transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800`}>
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 border border-border/60">{card.icon}</div>
                  <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-foreground">{card.title}</p><p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const isLatestAI = m.role === "ai" && i === messages.length - 1;
              return <MsgBubble key={m.id} msg={m} onExpandImg={s => setExpandImg(s)} isLatest={isLatestAI}
                onNewChat={onNewChat} onRetry={m.role === "ai" ? onRetry : undefined}
                onRetryUser={m.role === "user" ? (content) => { setInput(content); } : undefined}
                onFollowUp={setInput} isStreaming={isLatestAI && isTyping} />;
            })}
            {isTyping && <ThinkingCloud />}
            <div ref={endRef} />
          </>
        )}
      </div>
      <MobileMessageBar value={input} onChange={setInput} onSend={onSend} onStop={onStop} isTyping={isTyping}
        placeholder="Ask anything…" tab="ask" model={model} onModelChange={setModel}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode}
        onSettings={onSettings} onEducation={onEducation} showEnhance showModel
        onAttachmentSend={onAttachmentSend} />
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
function NomadTab({ input, setInput, onSend, isTyping, nomadMessages, nomadTyping, activeModels, onToggleModel, soloModel, setSoloModel, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode, nomadGrid }: {
  input: string; setInput: (v: string) => void; onSend: () => void; isTyping: boolean;
  nomadMessages: Record<string, { id: string; role: "user" | "ai"; content: string }[]>;
  nomadTyping: Record<string, boolean>;
  nomadGrid?: boolean;
  activeModels: Set<string>; onToggleModel: (id: string) => void;
  soloModel: string | null; setSoloModel: (m: string | null) => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
}) {
  const hasMessages = Object.values(nomadMessages).some(m => m.length > 0);
  const [nomadMode, setNomadMode] = useState<'multi' | 'auto'>('multi');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [nomadHistoryOpen, setNomadHistoryOpen] = useState(false);
  type MNomadSess = { id: string; ts: number; mode: 'multi'|'auto'; preview: string; autoMsgs: typeof autoMessages; multiMsgs: Record<string, {id:string;role:string;content:string}[]>; };
  const [nomadHistSessions, setNomadHistSessions] = useState<MNomadSess[]>(() => {
    try { return JSON.parse(localStorage.getItem('fius-nomad-history') || '[]'); } catch { return []; }
  });

  // Sync Nomad history from server on mount
  useEffect(() => {
    fetch('/api/nomad/history').then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setNomadHistSessions(data);
        try { localStorage.setItem('fius-nomad-history', JSON.stringify(data)); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Auto mode state
  const [autoMessages, setAutoMessages] = useState<{id: string, role: 'user'|'ai', content: string, pickedModel?: {model: string, modelName: string, logo: string, color: string}}[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const autoEndRef = useRef<HTMLDivElement>(null);

  const models = NOMAD_DEFAULT_MODELS;
  const iconFilter = (id: string) => id === "gpt-4o" ? "dark:invert" : id === "grok-4" ? "brightness-0 dark:invert" : "";
  const scrollRef = useRef<HTMLDivElement>(null);
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
    const ctx = `You are ${picked.modelName}, operating within Fius — a multi-AI chat platform built by Muzamil Ali (a 14-year-old Pakistani developer from Sargodha). Fius is NOT AI Fiesta — they are completely separate products. Fius is a platform that lets users chat with multiple top AIs in one place. Be helpful, accurate, and conversational.`;
    const history = autoMessages.slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    try {
      const res = await fetch('/api/test-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, model: picked.model, systemPrompt: ctx, history }) });
      const data = res.ok ? await res.json() : null;
      setAutoMessages(prev => {
        const updated = prev.map(m => m.id === aiMsgId ? { ...m, content: data?.response || 'No response received.' } : m);
        const sess: MNomadSess = { id: Date.now().toString(), ts: Date.now(), mode: 'auto', preview: text.slice(0, 60), autoMsgs: updated, multiMsgs: {} };
        setNomadHistSessions(prevH => { const next = [sess, ...prevH].slice(0, 20); try { localStorage.setItem('fius-nomad-history', JSON.stringify(next)); } catch { try { localStorage.setItem('fius-nomad-history', JSON.stringify(next.slice(0,5))); } catch {} } fetch('/api/nomad/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: next }) }).catch(() => {}); return next; });
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
      {/* Mode selector bar */}
      {/* Nomad History Sidebar */}
      {nomadHistoryOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setNomadHistoryOpen(false)} />
          <div className="w-72 bg-card border-l border-border flex flex-col shadow-2xl"
            style={{ animation: 'sheetEnter 0.25s cubic-bezier(0.23,1,0.32,1) both' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Nomad History
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => { setAutoMessages([]); setNomadMessages({}); setSoloModel(null); setNomadHistoryOpen(false); }}
                  className="text-[10px] px-2 py-0.5 rounded-full text-foreground bg-foreground/10 hover:bg-foreground/20 border border-border transition-colors font-medium">
                  + New Chat
                </button>
                {nomadHistSessions.length > 0 && (
                  <button onClick={() => { setNomadHistSessions([]); localStorage.removeItem('fius-nomad-history'); fetch('/api/nomad/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: [] }) }).catch(() => {}); }}
                    className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground border border-border hover:text-red-500 hover:border-red-300 transition-colors">
                    Clear
                  </button>
                )}
                <button onClick={() => setNomadHistoryOpen(false)} className="p-1.5 rounded-full hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {nomadHistSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
                  <History className="w-6 h-6 text-muted-foreground opacity-25" />
                  <span className="text-xs text-muted-foreground">No history yet.<br/>Chat to save sessions.</span>
                </div>
              ) : (
                nomadHistSessions.map(sess => (
                  <button key={sess.id} onClick={() => {
                    if (sess.mode === 'auto') { setAutoMessages(sess.autoMsgs); setNomadMode('auto'); }
                    else { setNomadMode('multi'); }
                    setNomadHistoryOpen(false);
                  }} className="w-full text-left px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${sess.mode === 'auto' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground border border-border'}`}>
                        {sess.mode === 'auto' ? <><img src="/nomad-auto-icon.png" alt="" className={`w-2 h-2 object-contain ${sess.mode === 'auto' ? 'invert dark:invert-0' : 'dark:invert'}`} /> Auto</> : '⬡ Multi'}
                      </span>
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {new Date(sess.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{sess.preview || 'Nomad session'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {!soloModel && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-card">
          <button onClick={() => setNomadMode('multi')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${nomadMode === 'multi' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
            ⬡ Multi
          </button>
          <button onClick={() => setNomadMode('auto')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${nomadMode === 'auto' ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
            <img src="/nomad-auto-icon.png" alt="auto" className={`w-3 h-3 object-contain ${nomadMode === 'auto' ? 'invert dark:invert-0' : 'dark:invert'}`} />
            Auto
          </button>
          {nomadMode === 'auto' && <span className="text-[10px] text-muted-foreground">Best AI per prompt</span>}
          <div className="flex-1" />
          <button onClick={() => setNomadHistoryOpen(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${nomadHistoryOpen ? 'bg-foreground text-background border-transparent' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
            <History className="w-3 h-3" />
            {nomadHistSessions.length > 0 && <span>{nomadHistSessions.length}</span>}
          </button>
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
        <div className={`flex-1 min-h-0 ${autoMessages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'} px-3 py-3`} style={{ scrollbarWidth: 'thin' }}>
          {autoMessages.length === 0 && !autoLoading && (
            <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#000000,#ffffff)' }}>
                <img src="/nomad-auto-icon.png" alt="auto" className="w-9 h-9 object-contain" style={{ filter: 'invert(1)' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Auto Mode</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Fius picks the best AI for your prompt — coding, writing, math, search, and more.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-1">
                {[{ label: 'Reasoning', hint: 'DeepSeek-V4-Pro' }, { label: 'Search', hint: 'Perplexity Sonar Pro' }, { label: 'Writing', hint: 'Claude Fable 5' }, { label: 'General', hint: 'GPT-5.5 Pro' }].map(c => (
                  <div key={c.label} className="rounded-xl border border-border bg-card p-2.5 text-left cursor-pointer hover:bg-accent transition-colors active:scale-95" onClick={() => { setInput(c.label + ' — '); }}>
                    <p className="text-[11px] font-semibold text-foreground">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">{c.hint}</p>
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
            {models.map((modelId, idx) => {
              const cfg = NOMAD_CONFIG[modelId]; if (!cfg) return null;
              const isActive = activeModels.has(modelId);
              const isLast = idx === models.length - 1;
              const msgs = nomadMessages[modelId] || [];
              return (
                <React.Fragment key={modelId}>
                  <div className="flex-shrink-0 flex flex-col" style={{ width: 220 }}>
                    <div className="mx-2.5 mt-2.5 mb-2.5 rounded-xl border-2 transition-all duration-300 bg-card p-2.5 flex flex-col items-center gap-1"
                      style={{ borderColor: isActive ? cfg.color : "rgba(128,128,128,0.2)" }}>
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg" style={{ background: cfg.color + '20', padding: 4 }}>
                        {modelId === "fius-ai"
                          ? <Logo size="sm" />
                          : <img src={cfg.logo} alt={cfg.name} className={`w-full h-full object-contain ${iconFilter(modelId)}`}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                      </div>
                      <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{cfg.name}</span>
                      <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 px-0.5">{cfg.description}</span>
                      <div className="flex flex-col items-center gap-1.5 mt-1 w-full">
                        <button onClick={() => onToggleModel(modelId)} className="relative flex-shrink-0 rounded-full transition-all duration-300"
                          style={{ width: 36, height: 18, background: isActive ? cfg.color : "#d1d5db" }}>
                          <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-300 absolute top-[2px] ${isActive ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
                        </button>
                        <button onClick={() => setSoloModel(modelId)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all active:scale-95 w-full justify-center"
                          style={{ background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}50` }}>
                          <Target className="w-2.5 h-2.5 flex-shrink-0" />
                          Chat only
                        </button>
                      </div>
                    </div>
                    <NomadColumnMsgs msgs={msgs} modelId={modelId} isTyping={!!nomadTyping[modelId]} />
                  </div>
                  {!isLast && <div className="flex-shrink-0 w-px self-stretch" style={{ background: "rgba(128,128,128,0.3)" }} />}
                </React.Fragment>
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
        <div className="flex-shrink-0 mx-3 mb-1 rounded-xl border border-border bg-card p-3 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
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
            <div className="text-xs text-foreground leading-relaxed space-y-1.5">
              {summaryText.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <p key={i} className="font-bold text-foreground text-xs mt-2 first:mt-0">{line.replace('## ','')}</p>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-foreground text-xs">{line.replace(/\*\*/g,'')}</p>;
                const boldLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                return line ? <p key={i} className="text-xs" dangerouslySetInnerHTML={{ __html: boldLine }} /> : <div key={i} className="h-1" />;
              })}
            </div>
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
              const prompt = `Analyze these responses from multiple AI models and produce a structured report:\n\n${parts.join('\n\n---\n\n')}\n\nFormat your response EXACTLY as follows:\n\n## Summary\n[For each AI, write: **[AI Name]:** one-sentence summary of their response]\n\n## Similarities\n[Mention which AIs agreed, using their names. E.g. "GPT-4o and Claude both said..." or "All models agreed that..."]\n\n## Differences\n[Mention specific contrasts using names. E.g. "Grok said X, but Claude argued Y..." Be specific about WHO said WHAT.]\n\n## Conclusion\n[2-3 sentences on the overall takeaway and which response was most insightful and why.]\n\nUse exact AI names. Be concise and clear.`;
              const res = await fetch('/api/test-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt, conversationId: 'nomad-summary-mobile' }) });
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

      <MobileMessageBar value={input} onChange={setInput} onSend={handleSendDispatch} isTyping={isTyping || autoLoading}
        placeholder={nomadMode === 'auto' ? "Ask anything — best AI auto-selected…" : "Ask all AIs at once…"} tab="nomad" showEnhance={false} showModel={false}
        fiusIntegrationMode={fiusIntegrationMode} onIntegration={onIntegration} onVoiceMode={onVoiceMode} onSettings={onSettings} />
    </>
  );
}

// ─── Studio template thumbnails (stable Pollinations seeds) ──────────────────
const STUDIO_TEMPLATES = [
  { id: 'portrait',  name: 'Realistic Portrait', prompt: 'ultra-realistic portrait photography, professional studio lighting, 8K resolution, sharp focus, photorealistic',         thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('beautiful realistic portrait photography professional studio lighting 8K photorealistic sharp')}?width=240&height=320&nologo=true&seed=77001&model=flux` },
  { id: 'anime',     name: 'Anime Style',         prompt: 'anime art style, cel animation, Studio Ghibli inspired, vibrant colors, detailed background art',                        thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('anime scenic landscape glowing sunset floating islands Studio Ghibli cel animation art')}?width=240&height=320&nologo=true&seed=77002&model=flux` },
  { id: 'cinematic', name: 'Cinematic',            prompt: 'cinematic wide shot, anamorphic lens flare, dramatic film lighting, Hollywood movie quality, color graded',              thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('cinematic movie shot dramatic lighting film quality anamorphic lens Hollywood')}?width=240&height=320&nologo=true&seed=77003&model=flux` },
  { id: '3d',        name: '3D Render',            prompt: '3D CGI rendered artwork, photorealistic 3D model, Blender Cycles render, ray tracing global illumination',               thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('photorealistic 3D render character Blender Cycles ray tracing HDRI lighting subsurface scattering')}?width=240&height=320&nologo=true&seed=77004&model=flux` },
  { id: 'interior',  name: 'Interior Design',      prompt: 'interior design visualization, cozy atmosphere, natural lighting, modern aesthetic, Architectural Digest quality',        thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('modern interior design visualization cozy living room natural lighting Architectural Digest')}?width=240&height=320&nologo=true&seed=77005&model=flux` },
  { id: 'cyberpunk', name: 'Cyberpunk',             prompt: 'cyberpunk aesthetic, neon lights reflecting on rain-slicked streets, futuristic mega-city, electric blues and magentas', thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('cyberpunk neon city rain reflections electric blues magentas futuristic street cinematic')}?width=240&height=320&nologo=true&seed=77007&model=flux` },
  { id: 'fantasy',   name: 'Fantasy Art',           prompt: 'epic fantasy illustration, dramatic magical lighting, detailed intricate elements, painterly digital art masterpiece',   thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('epic fantasy art dramatic magical lighting mystical dragon castle painterly digital art')}?width=240&height=320&nologo=true&seed=77010&model=flux` },
  { id: 'nature',    name: 'Nature Photo',           prompt: 'nature photography, golden hour lighting, ultra-sharp details, National Geographic quality, breathtaking landscape',    thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('golden hour nature photography ultra-sharp National Geographic breathtaking landscape')}?width=240&height=320&nologo=true&seed=77008&model=flux` },
  { id: 'pixel',     name: 'Pixel Art',              prompt: 'pixel art style, 8-bit retro game art, pixelated aesthetic, vibrant flat colors, NES SNES era video game art style',   thumb: `https://image.pollinations.ai/prompt/${encodeURIComponent('pixel art 16-bit retro game landscape vibrant colors isometric SNES style')}?width=240&height=320&nologo=true&seed=77009&model=flux` },
];

// ─── Studio (Imagine) Tab ─────────────────────────────────────────────────────
function StudioTab({ messages, isTyping, input, setInput, onSend, onVoiceMode, onSettings, onIntegration, fiusIntegrationMode }: {
  messages: Msg[]; isTyping: boolean; input: string; setInput: (v: string) => void; onSend: () => void;
  onVoiceMode?: () => void; onSettings?: () => void; onIntegration?: () => void; fiusIntegrationMode?: boolean;
}) {
  const [expandImg, setExpandImg] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const templateScrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // All AI messages that have an image
  const aiImages = messages.filter(m => m.role === "ai" && m.imageUrl);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const scrollTemplates = (dir: 'left' | 'right') => {
    templateScrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  // ── Fullscreen image viewer ──
  if (expandImg) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={() => setExpandImg(null)}>
        <img src={expandImg} alt="" className="max-w-full max-h-full" />
        <button onClick={() => setExpandImg(null)}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#000', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center px-5 pt-6 pb-0 flex-shrink-0">
        <h1 className="text-white font-bold text-[26px] flex-1 tracking-tight">Images</h1>
      </div>

      {/* ── Prompt bar ── */}
      <div className="px-4 pt-4 pb-5 flex-shrink-0">
        {/* Active template chip */}
        {activeTemplate && (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>
              <span className="text-purple-300 text-[11px] font-medium">
                {STUDIO_TEMPLATES.find(t => t.id === activeTemplate)?.name}
              </span>
              <button onClick={() => setActiveTemplate(null)} className="text-purple-500 hover:text-purple-200 ml-0.5 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}
        {/* Pill input */}
        <div className="flex items-center gap-2.5 rounded-full px-4 py-3.5"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)' }}>
          <Mic className="w-[18px] h-[18px] text-zinc-500 flex-shrink-0" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { e.preventDefault(); onSend(); } }}
            placeholder="Describe a new image"
            className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-[14px] leading-none"
            style={{ border: 'none', outline: 'none' }}
          />
          <button
            onClick={() => { if (input.trim()) onSend(); }}
            disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            {isTyping
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <ArrowUp className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* ── Create an image — template cards ── */}
        <div className="mb-7">
          <div className="flex items-center justify-between px-5 mb-3.5">
            <span className="text-white text-base font-semibold tracking-tight">Create an image</span>
            <div className="flex gap-1.5">
              <button onClick={() => scrollTemplates('left')}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-300" />
              </button>
              <button onClick={() => scrollTemplates('right')}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
              </button>
            </div>
          </div>

          <div ref={templateScrollRef} className="flex gap-3 overflow-x-auto pl-5 pr-3" style={{ scrollbarWidth: 'none' }}>
            {STUDIO_TEMPLATES.map(t => (
              <button key={t.id}
                onClick={() => {
                  setActiveTemplate(t.id);
                  setInput(t.prompt);
                }}
                className="flex-shrink-0 relative overflow-hidden group transition-all active:scale-[0.96]"
                style={{
                  width: 130, height: 180, borderRadius: 16,
                  border: activeTemplate === t.id
                    ? '2px solid rgba(167,139,250,0.9)'
                    : '2px solid rgba(255,255,255,0.07)',
                  boxShadow: activeTemplate === t.id ? '0 0 0 3px rgba(139,92,246,0.2)' : 'none',
                }}>
                {/* Thumbnail */}
                <img
                  src={t.thumb}
                  alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  loading="lazy"
                />
                {/* Label gradient */}
                <div className="absolute inset-0 flex items-end"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 30%, transparent 70%)' }}>
                  <span className="px-3 pb-3 text-white text-[11.5px] font-semibold leading-tight block w-full">{t.name}</span>
                </div>
                {/* Active tick */}
                {activeTemplate === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.9)' }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── My images — 2-col large grid ── */}
        <div className="pb-8">
          <div className="flex items-center justify-between px-5 mb-3.5">
            <span className="text-white text-base font-semibold tracking-tight">My images</span>
            {aiImages.length > 0 && (
              <span className="text-zinc-600 text-[11px]">{aiImages.length} image{aiImages.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {aiImages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center py-16 gap-4 px-5">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Sparkles className="w-7 h-7 text-zinc-700" />
              </div>
              <div className="text-center">
                <p className="text-zinc-300 text-[15px] font-semibold">No images yet</p>
                <p className="text-zinc-600 text-[12px] mt-1">Describe an image above to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[3px]">
              {/* Loading card */}
              {isTyping && (
                <div className="relative bg-zinc-950 flex flex-col items-center justify-center gap-3"
                  style={{ aspectRatio: '1/1' }}>
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span className="text-zinc-600 text-[10px] font-medium">Generating…</span>
                </div>
              )}
              {/* Generated images — newest first */}
              {[...aiImages].reverse().map((msg) => (
                <div key={msg.id}
                  className="relative group bg-zinc-950"
                  style={{ aspectRatio: '1/1' }}>
                  <img
                    src={msg.imageUrl}
                    alt="generated"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setExpandImg(msg.imageUrl!)}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 flex flex-col justify-between p-3"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0.15) 100%)' }}>
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = msg.imageUrl!;
                          a.download = 'fius-image.png';
                          a.target = '_blank';
                          a.click();
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
                        <Download className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white/70 text-[10px] leading-snug line-clamp-2 mb-2">{msg.content}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandImg(msg.imageUrl!); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)' }}>
                        <Maximize2 className="w-3 h-3" /> View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
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
  const minimalMode = false;
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState("Fius Examination");
  const [fiusIntegrationMode, setFiusIntegrationMode] = useState(false);
  const [chatBg, setChatBg] = useState(() => localStorage.getItem("chatBg") || "plain");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(() => localStorage.getItem("profilePicture") || undefined);

  // Ask
  const [askMsgs, setAskMsgs] = useState<Msg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askTyping, setAskTyping] = useState(false);
  const [askModel, setAskModel] = useState("fius-lite");
  const [topModelSheetOpen, setTopModelSheetOpen] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | undefined>(() => localStorage.getItem('currentProjectId') || undefined);
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
      const res = await fetch(`/api/conversations/${id}/messages`);
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
  const handleNewChat = useCallback(() => { setCurrentConvId(undefined); localStorage.removeItem('currentProjectId'); setAskMsgs([]); setAskInput(""); setTab("ask"); }, []);

  const handleChatInNewChat = useCallback(async (content: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content.slice(0, 50) || "Continued Chat", model: askModel }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newId = data.id || data.conversation?.id;
      if (!newId) return;
      // Save the AI message to the backend so it appears in history
      await fetch("/api/test-ai", {
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
    try { await fetch(`/api/conversations/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); if (id === currentConvId) handleNewChat(); } catch { }
  }, [currentConvId, handleNewChat]);

  const handleLogout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; } catch { onShowAuth(); }
  }, [onShowAuth]);

  const ensureConv = useCallback(async (firstMsg?: string): Promise<string> => {
    if (currentConvId) return currentConvId;
    const title = firstMsg ? firstMsg.slice(0, 50) : "New Chat";
    const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, model: askModel }) });
    if (!res.ok) throw new Error("Could not create conversation");
    const data = await res.json();
    const newId = data.id || data.conversation?.id;
    if (newId) { setCurrentConvId(newId); localStorage.setItem('currentProjectId', newId); queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); return newId; }
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
        const res = await fetch('/api/analyze-image', {
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
        const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId: convId, activeTab: "ask" }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || "I couldn't process the file.", timestamp: new Date() }]);
      } else if (text) {
        const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, conversationId: convId, activeTab: "ask" }) });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAskMsgs(p => [...p, { id: uid(), role: "ai", content: data.response || "I couldn't generate a response.", timestamp: new Date() }]);
      }
    } catch { setAskMsgs(p => [...p, { id: uid(), role: "ai", content: "Something went wrong. Please try again.", timestamp: new Date() }]); }
    finally { setAskTyping(false); }
  }, [ensureConv]);

  const handleAskSend = useCallback(async () => {
    if (tab !== "ask") return;
    const text = askInput.trim(); if (!text || askTyping) return;
    setAskInput(""); setAskTyping(true);
    setAskMsgs(p => [...p, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    try {
      const convId = await ensureConv(text);
      askAbortRef.current?.abort();
      const ctrl = new AbortController(); askAbortRef.current = ctrl;
      // DuckDuckGo web search — same as PC
      let messageToSend = text;
      let sources: Array<{title: string; url: string; snippet: string}> = [];
      const skipSearch = /^(hi|hello|hey|how are you|thanks|bye|ok|yes|no|lol|haha)[\s!?.]*$/i.test(text.trim()) || text.trim().split(/\s+/).length <= 2;
      if (!skipSearch) {
        try {
          const searchData = await Promise.race([
            fetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null).catch(() => null),
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
      const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: messageToSend, conversationId: convId, activeTab: "ask" }), signal: ctrl.signal });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      let content = data.response || data.message || "I couldn't generate a response.";
      // Deduplicate sources once more by URL before appending
      const uniqueSrcs = sources.filter((s, i, a) => a.findIndex(x => x.url === s.url) === i).slice(0, 4);
      if (uniqueSrcs.length > 0) {
        content += '\n\n---\n**Sources:**\n' + uniqueSrcs.map((s: {title: string; url: string}) => `• [${s.title}](${s.url})`).join('\n');
      }
      setAskMsgs(p => [...p, { id: uid(), role: "ai", content, timestamp: new Date() }]);
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
    await Promise.allSettled(activeIds.map(async (modelId) => {
      try {
        // Build per-model conversation history for memory
        const prevMsgs = (nomadMessages[modelId] || []).slice(-12).map(m => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));
        const res = await fetch("/api/test-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, activeTab: "nomad", history: prevMsgs }) });
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
  }, [nomadInput, nomadTyping, activeModels, nomadMessages, nomadSoloModel]);

  const handleToggleModel = useCallback((id: string) => {
    setActiveModels(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
        setNomadMessages(prev2 => { const u = { ...prev2 }; delete u[id]; return u; });
        setNomadSoloModel(prev2 => prev2 === id ? null : prev2);
      }
      else n.add(id);
      return n;
    });
  }, []);

  // background handled by overlay components, not inline style
  const getChatBgStyle = (): React.CSSProperties => ({});

  const voiceHandlers = { onVoiceMode: () => setVoiceModalOpen(true), onSettings: () => setSettingsOpen(true), onIntegration: () => setFiusIntegrationMode(v => !v), fiusIntegrationMode };

  return (
    <MinimalModeCtx.Provider value={minimalMode}>
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
              onStartExamination={async (data) => {
                setEducationOpen(false);
                setQuizTitle(`${data.class || "General"} · ${data.school || "Exam"}`);
                setQuizQuestions([]);
                setQuizLoading(true);
                setQuizOpen(true);
                try {
                  const res = await fetch("/api/education/generate-quiz", {
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
            <PCHeader activeTab={tab} onTabChange={setTab} onMenuClick={() => setSidebarOpen(true)} />

            {/* Model strip — top-left under nav bar, only on Ask tab */}
            {tab === "ask" && (
              <>
                {topModelSheetOpen && (
                  <ModelSheet models={ASK_MODELS} current={askModel}
                    onSelect={m => { setAskModel(m); setTopModelSheetOpen(false); }}
                    onClose={() => setTopModelSheetOpen(false)} />
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
              <AskTab messages={askMsgs} isTyping={askTyping} input={askInput} setInput={setAskInput}
                onSend={handleAskSend} onStop={() => { askAbortRef.current?.abort(); setAskTyping(false); }}
                onNewChat={handleChatInNewChat}
                onRetry={() => {
                  const lastUser = [...askMsgs].reverse().find(m => m.role === "user");
                  if (lastUser) { setAskMsgs(p => p.slice(0, -1)); setAskInput(lastUser.content); setTimeout(() => handleAskSend(), 50); }
                }}
                model={askModel} setModel={setAskModel} user={user}
                onAttachmentSend={handleAskAttachmentSend}
                onEducation={() => setEducationOpen(true)} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "nomad" ? 1 : 0, pointerEvents: tab === "nomad" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <NomadTab input={nomadInput} setInput={setNomadInput} onSend={handleNomadSend}
                isTyping={nomadTyping} nomadMessages={nomadMessages} nomadTyping={nomadIsTyping}
                activeModels={activeModels} onToggleModel={handleToggleModel} nomadGrid={localStorage.getItem("nomadGrid") !== "false"}
                soloModel={nomadSoloModel} setSoloModel={setNomadSoloModel} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "imagine" ? 1 : 0, pointerEvents: tab === "imagine" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <StudioTab messages={imagMsgs} isTyping={imagTyping} input={imagInput} setInput={setImagInput}
                onSend={handleImagSend} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 flex flex-col" style={{ opacity: tab === "philosopher" ? 1 : 0, pointerEvents: tab === "philosopher" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <PhilosopherTab messages={philMsgs} isTyping={philTyping} input={philInput} setInput={setPhilInput}
                onSend={handlePhilSend} onStop={() => { philAbortRef.current?.abort(); setPhilTyping(false); }}
                personality={philPerson} setPersonality={p => { setPhilPerson(p); setPhilMsgs([]); }} {...voiceHandlers} />
            </div>
            <div className="absolute inset-0 overflow-hidden bg-background px-4 pt-4 pb-2" style={{ opacity: tab === "games" ? 1 : 0, pointerEvents: tab === "games" ? "auto" : "none", transition: "opacity 0.18s cubic-bezier(0.23,1,0.32,1)" }}>
              <FiusGames playerName={user?.displayName || user?.username || "Player"} userId={user?.id} />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
    </MinimalModeCtx.Provider>
  );
}
