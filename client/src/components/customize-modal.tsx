import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FiusLogo, Logo } from "./logo";
import { getVibrantColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, User, Palette, Zap, Sliders, Database, Laptop, Sun, Moon, ChevronUp, ChevronDown, Pencil, Camera, Check, Plus, Brain, Trash2, GripVertical } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { useUsage } from "@/hooks/use-usage";
import { Crown, Sparkles as SparklesIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UltimatePlanCard } from "@/components/ultimate-plan-card";
import {
  APP_FONT_OPTIONS,
  DEFAULT_APP_FONT,
  DEFAULT_GLOW_ACCENT,
  GLOW_ACCENT_OPTIONS,
  UI_ACCENT_OPTIONS,
  applyAppFont,
  applyUiAccent,
  getStoredGlowAccent,
  getStoredUiAccentEnabled,
  getStoredUiAccentColor,
  getStoredLogoStyle,
  getStoredAutoRotateLogo,
  persistLogoStyle,
  persistAutoRotateLogo,
  LOGO_STYLE_OPTIONS,
  type LogoStyle,
  persistGlowAccent,
  playTabClick,
} from "@/lib/appearance-settings";

// ─── Settings scroll-to-top/bottom buttons — hide completely at limits ──────
function SettingsScrollButtons({ scrollAreaRef }: { scrollAreaRef: { current: HTMLDivElement | null } }) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const check = () => {
      setAtTop(el.scrollTop <= 4);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
      setScrollable(el.scrollHeight - el.clientHeight > 20);
    };
    check();
    el.addEventListener("scroll", check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  });

  if (!scrollable || (atTop && atBottom)) return null;

  const btnBase = "w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 text-muted-foreground hover:text-foreground hover:bg-accent";

  return (
    <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2">
      {!atTop && (
        <button onClick={() => scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className={btnBase} title="Scroll to top">
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
      {!atBottom && (
        <button onClick={() => scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: "smooth" })} className={btnBase} title="Scroll to bottom">
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Learned Behaviors Section ─────────────────────────────────────────────────
function LearnedBehaviorsSection() {
  const STORAGE_KEY = 'fius_learned_behaviors';
  const [behaviors, setBehaviors] = useState<{ id: string; text: string; addedAt: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const save = (list: typeof behaviors) => {
    setBehaviors(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const add = () => {
    if (!newText.trim()) return;
    save([...behaviors, { id: Date.now().toString(), text: newText.trim(), addedAt: new Date().toLocaleDateString() }]);
    setNewText(''); setAdding(false);
  };

  const remove = (id: string) => save(behaviors.filter(b => b.id !== id));

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-white">Learned Behaviors</span>
        </div>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <p className="text-xs text-zinc-400 mb-3">Things Fius remembers about you across conversations.</p>

      {adding && (
        <div className="flex gap-2 mb-3">
          <Input value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="e.g. Prefers short concise answers"
            className="h-8 text-xs bg-zinc-50 dark:bg-[#161616] border-zinc-200 dark:border-zinc-800" autoFocus />
          <button onClick={add}
            className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-white text-zinc-900 dark:text-black text-xs font-semibold hover:opacity-80 transition-opacity">
            Save
          </button>
        </div>
      )}

      {behaviors.length === 0 ? (
        <p className="text-xs text-zinc-400 italic py-2">No behaviors learned yet. Add one above or chat with Fius.</p>
      ) : (
        <div className="space-y-2">
          {behaviors.map(b => (
            <div key={b.id} className="flex items-start justify-between gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-700 dark:text-zinc-200 break-words">{b.text}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{b.addedAt}</p>
              </div>
              <button onClick={() => remove(b.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan & Usage Section — shown at the bottom of Account settings ────────
function PlanUsageSection() {
  const { usage, isLoading, upgrade } = useUsage();
  const { toast } = useToast();

  if (isLoading || !usage) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-[#161616] rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isUltimate = usage.plan === "ultimate";

  const handleUpgrade = async () => {
    try {
      await upgrade.mutateAsync();
      toast({ title: "Fius Ultimate activated", description: "You now have 3M tokens and 250 images this month." });
    } catch {
      toast({ title: "Couldn't activate plan", description: "Please try again in a moment.", variant: "destructive" });
    }
  };

  const Bar = ({ used, limit }: { used: number; limit: number }) => {
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    return (
      <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  if (!isUltimate) {
    // ── Free plan: exact same Fius Ultimate card as the landing page ────────
    return (
      <div className="space-y-3">
        <UltimatePlanCard onUpgrade={handleUpgrade} ctaBusy={upgrade.isPending} />

        {/* Current free usage */}
        <div className="space-y-2.5 px-1">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Current Usage</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Messages</span>
              <span className="font-medium text-zinc-900 dark:text-white">{usage.messagesRemaining} / {usage.messagesLimit}</span>
            </div>
            <Bar used={usage.messagesUsed ?? 0} limit={usage.messagesLimit ?? 1} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Images</span>
              <span className="font-medium text-zinc-900 dark:text-white">{usage.imagesRemaining} / {usage.imagesLimit}</span>
            </div>
            <Bar used={usage.imagesUsed} limit={usage.imagesLimit} />
          </div>
        </div>
      </div>
    );
  }

  // ── Ultimate plan: exact same perks card, "activated" state with usage ──────
  return (
    <UltimatePlanCard
      activated
      usage={{
        tokensRemaining: usage.tokensRemaining ?? 0,
        tokensLimit: usage.tokensLimit ?? 0,
        imagesRemaining: usage.imagesRemaining,
        imagesLimit: usage.imagesLimit,
      }}
    />
  );
}

// ── Nomad sub-model options (Normal & Flagship) ────────────────────────────
const NOMAD_SUB_MODELS: Record<string, { normal: string[]; flagship: string[]; default: string }> = {
  'fius-ai':          { normal: ['Fius Lite'],                                                                  flagship: ['Fius Pro'],                                                default: 'Fius Lite' },
  'gpt-4o':           { normal: ['GPT-5 mini'],                                                                 flagship: ['GPT-5', 'GPT-5 Pro'],                                      default: 'GPT-5 mini' },
  'claude-3.5-sonnet':{ normal: ['Claude Haiku 4.5'],                                                           flagship: ['Claude Sonnet 5', 'Claude Opus 4.8'],                      default: 'Claude Haiku 4.5' },
  'gemini-pro':       { normal: ['Gemini 3.5 Flash-Lite', 'Gemini 3.6 Flash'],                                 flagship: ['Gemini 3.1 Pro'],                                          default: 'Gemini 3.5 Flash-Lite' },
  'perplexity':       { normal: ['Perplexity Sonar', 'Perplexity Sonar Pro'],                                  flagship: ['Perplexity Sonar Reasoning Pro', 'Perplexity Sonar Deep Research'], default: 'Perplexity Sonar' },
  'grok-4':           { normal: ['Grok Build 0.1', 'Grok 4.3'],                                                flagship: ['Grok 4.5'],                                                default: 'Grok Build 0.1' },
  'deepseek-r1':      { normal: ['DeepSeek V4 Flash'],                                                          flagship: ['DeepSeek V4 Pro'],                                         default: 'DeepSeek V4 Flash' },
  'doubao':           { normal: ['Doubao Seed 2.0 Mini', 'Doubao Seed 2.0 Lite'],                              flagship: ['Doubao Seed 2.0 Pro'],                                     default: 'Doubao Seed 2.0 Mini' },
  'kimi':             { normal: ['Kimi K2.6', 'Kimi K2.7 Code'],                                               flagship: ['Kimi K3'],                                                 default: 'Kimi K2.6' },
  'qwen':             { normal: ['Qwen Flash', 'Qwen Plus', 'Qwen Coder'],                                     flagship: ['Qwen Max'],                                                default: 'Qwen Flash' },
  'llama-4':          { normal: ['Llama 4 Scout', 'Llama 4 Maverick'],                                         flagship: ['Llama 4 Behemoth'],                                        default: 'Llama 4 Scout' },
  'mistral':          { normal: ['Ministral 3', 'Ministral 3 14B', 'Mistral Small 4', 'Mistral Medium 3.5'],   flagship: ['Mistral Large 3'],                                         default: 'Ministral 3' },
  'copilot':          { normal: ['GPT-5 mini', 'GPT-5.4 mini / GPT-5.4 nano', 'GPT-5.5'],                     flagship: ['Claude Haiku / Sonnet'],                                   default: 'GPT-5 mini' },
};

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, selectedModel?: AvailableModel, toggles?: any, aiOrder?: string[]) => void;
  toggles: any;
  aiOrder: string[];
  user?: { email: string; username: string; displayName?: string | null } | null;
  profilePicture?: string;
  onUserRename?: (name: string) => void;
  onProfilePictureChange?: (dataUrl: string) => void;
}

type SettingsSection = 'profile' | 'looks' | 'general' | 'nomad' | 'subscription';

// ─── Shared sliding-pill selector ────────────────────────────────────────────
function SlidingPillSelector({
  value,
  onChange,
  options,
  isDark,
  tall = false,
  withSound = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; iconBlack?: string; iconGray?: string }[];
  isDark: boolean;
  tall?: boolean;
  withSound?: boolean;
}) {
  const activeIdx = Math.max(0, options.findIndex(o => o.value === value));
  const n = options.length;
  return (
    <div className="relative flex items-center rounded-full bg-zinc-200 dark:bg-[#2a2a2a] p-1">
      {/* sliding pill */}
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          width: `${100 / n}%`,
          left: `${(activeIdx / n) * 100}%`,
          transition: 'left 0.55s cubic-bezier(0.34,1.56,0.64,1)',
          background: isDark ? '#ffffff' : 'rgba(0,0,0,0.09)',
          boxShadow: isDark ? '0 2px 12px rgba(255,255,255,0.18), 0 1px 4px rgba(0,0,0,0.15)' : '0 2px 10px rgba(0,0,0,0.12)',
        }}
      />
      {options.map((opt) => {
        const active = value === opt.value;
        const iconSrc = (!active && isDark && opt.iconGray) ? opt.iconGray : opt.iconBlack;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => { if (withSound && opt.value !== value) playTabClick(); onChange(opt.value); }}
            style={{ width: `${100 / n}%` }}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 ${tall ? 'py-3' : 'py-2.5'} rounded-xl transition-all duration-300 select-none ${
              active ? 'text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {iconSrc && (
              <img src={iconSrc} alt={opt.label} className="w-5 h-5 object-contain transition-all duration-300" />
            )}
            <span className="text-[12px] font-semibold leading-none transition-all duration-300">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Theme Segmented Tab ─────────────────────────────────────────────────────
function ThemeSegmentedTab({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const options = [
    { value: 'light',  label: 'Light',  iconBlack: '/icon-sun-black.png',    iconGray: '/icon-sun-gray.png'    },
    { value: 'dark',   label: 'Dark',   iconBlack: '/icon-moon-black.png',   iconGray: '/icon-moon-gray.png'   },
    { value: 'system', label: 'System', iconBlack: '/icon-laptop-black.png', iconGray: '/icon-laptop-gray.png' },
  ];
  return (
    <div>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Theme</span>
      <div className="mt-3 rounded-full bg-zinc-200 dark:bg-[#2a2a2a]">
        <SlidingPillSelector value={value} onChange={onChange} options={options} isDark={isDark} tall withSound />
      </div>
    </div>
  );
}

export function CustomizeModal({
  isOpen,
  onClose,
  currentPreset,
  customInstructions,
  onSave,
  toggles,
  aiOrder,
  user,
  profilePicture,
  onUserRename,
  onProfilePictureChange
}: CustomizeModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [selectedPreset, setSelectedPreset] = useState<ChatPreset>(currentPreset);
  const [instructions, setInstructions] = useState(customInstructions);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('fius-prime');
  const [localAiOrder, setLocalAiOrder] = useState(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'perplexity', 'grok-4', 'deepseek-r1', 'doubao', 'kimi', 'qwen', 'llama-4', 'mistral', 'copilot', 'fius-ai']);
  // Per-model default sub-model selection (synced with localStorage)
  const [nomadDefaultModels, setNomadDefaultModels] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('fius-nomad-sub-models') || '{}'); } catch { return {}; }
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [localTheme, setLocalTheme] = useState<string>(theme);
  const [functionBarStyle, setFunctionBarStyle] = useState<string>(
    () => localStorage.getItem('functionBarStyle') || 'pill'
  );
  const [messageBarStyle, setMessageBarStyle] = useState<string>(
    () => localStorage.getItem('messageBarStyle') || 'compact'
  );
  const [logoStyle, setLogoStyle] = useState<string>(() => getStoredLogoStyle());
  const [autoRotateLogo, setAutoRotateLogo] = useState<boolean>(() => getStoredAutoRotateLogo());
  const [chatBg, setChatBg] = useState<string>(
    () => localStorage.getItem('chatBg') || 'plain'
  );
  const [glowAccentColor, setGlowAccentColor] = useState<string>(
    () => getStoredGlowAccent()
  );
  const [appFont, setAppFont] = useState<string>(
    () => localStorage.getItem('appFont') || DEFAULT_APP_FONT
  );
  const [uiAccentEnabled, setUiAccentEnabled] = useState<boolean>(
    () => getStoredUiAccentEnabled()
  );
  const [uiAccentColor, setUiAccentColor] = useState<string>(
    () => getStoredUiAccentColor()
  );
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState<boolean>(
    () => localStorage.getItem('uiSoundsEnabled') !== 'false'
  );
  const originalTheme = useRef<string>(theme);
  const originalFunctionBarStyle = useRef<string>(localStorage.getItem('functionBarStyle') || 'pill');
  const originalMessageBarStyle = useRef<string>(localStorage.getItem('messageBarStyle') || 'compact');
  const originalLogoStyle = useRef<string>(getStoredLogoStyle());
  const originalAutoRotateLogo = useRef<boolean>(getStoredAutoRotateLogo());
  const originalChatBg = useRef<string>(localStorage.getItem('chatBg') || 'plain');
  const originalGlowAccentColor = useRef<string>(getStoredGlowAccent());
  const originalAppFont = useRef<string>(localStorage.getItem('appFont') || DEFAULT_APP_FONT);
  const [openSettingsModelDropdown, setOpenSettingsModelDropdown] = useState<string | null>(null);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [editName, setEditName] = useState('');
  const [previewPic, setPreviewPic] = useState('');
  const picInputRef = useRef<HTMLInputElement>(null);

  const [localToggles, setLocalToggles] = useState({
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
    showFiusLogo: true,
    hideFiusLogo: false,
    hideFlyWithUs: false,
    showUserMsgActions: true,
    glossyOutline: true,
    topbarTabIcons: true,
    tabsInSidebar: false,
  });

  const settingsContentRef = useRef<HTMLDivElement | null>(null);

  // ── Vertical sliding pill for settings sidebar ────────────────────────────
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Pre-initialised so the pill renders on the very first paint (never null).
  // The approximate height (36 px) is overwritten by the first useLayoutEffect.
  const [settingsPill, setSettingsPill] = useState<{ top: number; height: number }>({ top: 0, height: 36 });
  // Tracks whether the pill has been measured at least once this open session.
  // While false we suppress the CSS transition so the pill snaps to its
  // correct position on mount instead of sliding in from (0,0).
  // Must be state (not ref) so the pill div re-renders with transition enabled.
  const [pillMeasured, setPillMeasured] = useState(false);

  // Measure the pill position after the dialog has fully animated in.
  // useLayoutEffect alone fires too early when Radix Dialog has an open
  // animation — the buttons are in the DOM but offsetTop can be stale/0.
  // Double-rAF ensures we measure after the browser has painted the final
  // dialog layout, so the pill snaps exactly onto the active tab button.
  useEffect(() => {
    if (!isOpen) return;
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const idx = menuItems.findIndex(m => m.id === activeSection);
        const el = tabButtonRefs.current[idx];
        if (!el) return;
        setSettingsPill({ top: el.offsetTop, height: el.offsetHeight });
        setPillMeasured(true);
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isOpen]);

  // Reset measured flag when modal closes so next open starts fresh
  useEffect(() => {
    if (!isOpen) { setPillMeasured(false); setSettingsPill({ top: 0, height: 36 }); }
  }, [isOpen]);

  // Only reset local state when modal transitions from closed → open
  const prevIsOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setActiveSection('profile');
      setSelectedPreset(currentPreset);
      setInstructions(customInstructions);
      setLocalToggles({ ...toggles });
      setLocalAiOrder([...aiOrder]);
      setLocalTheme(theme);
      originalTheme.current = theme;
      const savedStyle = localStorage.getItem('functionBarStyle') || 'pill';
      setFunctionBarStyle(savedStyle);
      originalFunctionBarStyle.current = savedStyle;
      const savedMsgStyle = localStorage.getItem('messageBarStyle') || 'compact';
      setMessageBarStyle(savedMsgStyle);
      originalMessageBarStyle.current = savedMsgStyle;
       const savedLogoStyle = getStoredLogoStyle();
       setLogoStyle(savedLogoStyle);
       originalLogoStyle.current = savedLogoStyle;
       const savedAutoRotateLogo = getStoredAutoRotateLogo();
       setAutoRotateLogo(savedAutoRotateLogo);
       originalAutoRotateLogo.current = savedAutoRotateLogo;
       const savedChatBg = localStorage.getItem('chatBg') || 'plain';
       setChatBg(savedChatBg);
       originalChatBg.current = savedChatBg;
       const savedGlowAccent = getStoredGlowAccent();
       setGlowAccentColor(savedGlowAccent);
       originalGlowAccentColor.current = savedGlowAccent;
       const savedFont = localStorage.getItem('appFont') || DEFAULT_APP_FONT;
       setAppFont(savedFont);
       originalAppFont.current = savedFont;
      setIsDirty(false);
      setShowExitDialog(false);
    }
    prevIsOpen.current = isOpen;
  });

  const handleToggle = (key: string) => {
    setLocalToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    setIsDirty(true);
  };

  const handleFunctionBarStyleChange = (val: string) => {
    setFunctionBarStyle(val);
    setIsDirty(true);
  };

  const handleMessageBarStyleChange = (val: string) => {
    setMessageBarStyle(val);
    setIsDirty(true);
  };

  const handleLogoStyleChange = (val: string) => {
    setLogoStyle(val);
    persistLogoStyle(val as LogoStyle);
    window.dispatchEvent(new Event('logoStyleChanged'));
    setIsDirty(true);
  };

  const handleAutoRotateLogoChange = (enabled: boolean) => {
    setAutoRotateLogo(enabled);
    persistAutoRotateLogo(enabled);
    window.dispatchEvent(new Event('logoStyleChanged'));
    setIsDirty(true);
  };

  const handleChatBgChange = (val: string) => {
    setChatBg(val);
    setIsDirty(true);
    // Apply immediately so user sees the change without hitting Save
    localStorage.setItem('chatBg', val);
    window.dispatchEvent(new Event('chatBgChanged'));
  };

  const handleGlowAccentColorChange = (val: string) => {
    setGlowAccentColor(val);
    setIsDirty(true);
    persistGlowAccent(val);
    window.dispatchEvent(new Event('glowAccentColorChanged'));
  };

  const handleUiAccentEnabledChange = (enabled: boolean) => {
    setUiAccentEnabled(enabled);
    setIsDirty(true);
    localStorage.setItem('uiAccentEnabled', enabled ? 'true' : 'false');
    applyUiAccent();
    window.dispatchEvent(new Event('uiAccentChanged'));
  };

  const handleUiAccentColorChange = (val: string) => {
    setUiAccentColor(val);
    setIsDirty(true);
    localStorage.setItem('uiAccentColor', val);
    applyUiAccent();
    window.dispatchEvent(new Event('uiAccentChanged'));
  };

  const handleUiSoundsChange = (enabled: boolean) => {
    setUiSoundsEnabled(enabled);
    setIsDirty(true);
    localStorage.setItem('uiSoundsEnabled', enabled ? 'true' : 'false');
    if (enabled) playTabClick();
  };

  const handleAppFontChange = (val: string) => {
    setAppFont(val);
    setIsDirty(true);
    localStorage.setItem('appFont', val);
    applyAppFont(val);
    window.dispatchEvent(new Event('appFontChanged'));
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localAiOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setLocalAiOrder(newOrder);
    setIsDirty(true);
  };

  // Drag-and-drop reordering for the Nomad order list — swaps the dragged
  // item to the drop target's position. Kept alongside the up/down buttons
  // (not a replacement) so keyboard/accessibility use still works.
  // Uses Pointer Events (not native HTML5 draggable) — native drag requires
  // dataTransfer wiring and is unreliable inside Radix Dialog overlays, and
  // Pointer Events also unify mouse + touch for free.
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const orderRowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleOrderPointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragIndexRef.current = index;
    setDraggingIndex(index);
    setDragOverIndex(index);
    setDragOffsetY(0);
    const startY = e.clientY;

    // Snapshot the other rows' midpoints once, before any movement. Sibling
    // rows don't reflow while dragging (only the dragged row gets a CSS
    // translateY), so re-measuring live via getBoundingClientRect() would
    // include the dragged row's own translating rect — which tracks the
    // cursor and therefore "wins" almost every comparison, making drops
    // silently no-op or land on the wrong slot. Exclude it and use a static
    // snapshot instead.
    const staticMids = orderRowRefs.current.map((el, idx) => {
      if (!el || idx === index) return null;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });

    const findIndexAtY = (clientY: number): number => {
      let best = index;
      let bestDist = Infinity;
      staticMids.forEach((mid, idx) => {
        if (mid === null) return;
        const dist = Math.abs(clientY - mid);
        if (dist < bestDist) { bestDist = dist; best = idx; }
      });
      return best;
    };

    const onMove = (ev: PointerEvent) => {
      setDragOffsetY(ev.clientY - startY);
      const idx = findIndexAtY(ev.clientY);
      setDragOverIndex(prev => (prev === idx ? prev : idx));
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const from = dragIndexRef.current;
      const to = findIndexAtY(ev.clientY);
      dragIndexRef.current = null;
      setDraggingIndex(null);
      setDragOverIndex(null);
      setDragOffsetY(0);
      if (from === null || from === to) return;
      const newOrder = [...localAiOrder];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, moved);
      setLocalAiOrder(newOrder);
      setIsDirty(true);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    setTheme(localTheme);
    localStorage.setItem('functionBarStyle', functionBarStyle);
    window.dispatchEvent(new Event('functionBarStyleChanged'));
    localStorage.setItem('messageBarStyle', messageBarStyle);
    window.dispatchEvent(new Event('messageBarStyleChanged'));
    persistLogoStyle(logoStyle as LogoStyle);
    persistAutoRotateLogo(autoRotateLogo);
    window.dispatchEvent(new Event('logoStyleChanged'));
    localStorage.setItem('chatBg', chatBg);
    window.dispatchEvent(new Event('chatBgChanged'));
    persistGlowAccent(glowAccentColor);
    window.dispatchEvent(new Event('glowAccentColorChanged'));
    localStorage.setItem('appFont', appFont);
    applyAppFont(appFont);
    window.dispatchEvent(new Event('appFontChanged'));
    onSave(selectedPreset, instructions, isEnabled, selectedModel, localToggles, localAiOrder);
    setIsDirty(false);
    onClose();
    setShowExitDialog(false);
  };

  const handleDontSave = () => {
    setTheme(originalTheme.current);
    setFunctionBarStyle(originalFunctionBarStyle.current);
    setMessageBarStyle(originalMessageBarStyle.current);
    setLogoStyle(originalLogoStyle.current);
    persistLogoStyle(originalLogoStyle.current as LogoStyle);
    setAutoRotateLogo(originalAutoRotateLogo.current);
    persistAutoRotateLogo(originalAutoRotateLogo.current);
    window.dispatchEvent(new Event('logoStyleChanged'));
    setChatBg(originalChatBg.current);
    setGlowAccentColor(originalGlowAccentColor.current);
    persistGlowAccent(originalGlowAccentColor.current);
    window.dispatchEvent(new Event('glowAccentColorChanged'));
    setAppFont(originalAppFont.current);
    localStorage.setItem('appFont', originalAppFont.current);
    applyAppFont(originalAppFont.current);
    window.dispatchEvent(new Event('appFontChanged'));
    setIsDirty(false);
    setShowExitDialog(false);
    onClose();
  };

  // Icon paths: gray = dark theme, black = light theme (as specified)
  const menuItems = [
    { id: 'profile',      label: 'Profile',            imgD: '/settings-account-gray.png',      imgL: '/settings-account-black.png' },
    { id: 'looks',        label: 'Looks',              imgD: '/settings-appearance-gray.png',   imgL: '/settings-appearance-black.png' },
    { id: 'general',      label: 'General',            imgD: '/settings-general-gray.png',      imgL: '/settings-general-black.png' },
    { id: 'nomad',        label: 'Nomad Preferences',  imgD: '/settings-nomad-gray.png',        imgL: '/settings-nomad-black.png' },
    { id: 'subscription', label: 'Subscription Plan',  imgD: '/settings-subscription-gray.png', imgL: '/settings-subscription-black.png' },
  ];

  // Save button label & visibility per section
  const saveLabel: Record<SettingsSection, string | null> = {
    profile: 'Save Profile',
    looks: 'Save Looks',
    general: 'Save Changes',
    nomad: 'Save Preferences',
    subscription: null,
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseAttempt();
    }}>
      <DialogContent className="macos-dialog-content bg-[#f5f5f5] dark:bg-[#1e1e1e] border-zinc-200 dark:border-zinc-800/50 max-w-4xl h-[680px] shadow-2xl rounded-3xl [&>button]:hidden p-0 overflow-hidden flex flex-row z-[50]">
        {/* Close button — absolute top-right of whole modal */}
        <div className="absolute top-1 right-1 z-[70]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseAttempt}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-7 w-7 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Sidebar */}
        <div className="w-56 bg-[#ebebeb] dark:bg-[#252525] p-4 flex flex-col border-r border-zinc-200/60 dark:border-[#333] flex-shrink-0 z-[60]">
          <div className="flex items-center mb-5 px-2">
            <h2 className="text-zinc-900 dark:text-white text-xl font-bold">Settings</h2>
          </div>
          <div className="flex-1 flex flex-col space-y-1 overflow-y-auto min-h-0 relative [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {/* vertical sliding pill — spring overshoot on top gives the "fast brake" feel */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: settingsPill.top,
                height: settingsPill.height,
                // Suppress transition on first placement so pill snaps to the
                // correct position; enable it after the first measurement so
                // subsequent tab clicks slide smoothly.
                transition: pillMeasured
                  ? 'top 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
                pointerEvents: 'none',
                zIndex: 0,
                background: theme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.09)',
                borderRadius: 10,
              }}
            />
            {menuItems.map((item, idx) => {
              const isActive = activeSection === item.id;
              // Always use the black icon as base; invert to white when active in light theme
              // Active dark theme  → black pill is white  → show black icon (imgL)
              // Active light theme → black pill           → show white icon (imgL + invert)
              // Inactive dark      → show gray icon (imgD)
              // Inactive light     → show black icon (imgL, dimmed)
              return (
                <button
                  key={item.id}
                  ref={el => { tabButtonRefs.current[idx] = el; }}
                  onClick={() => { playTabClick(); setActiveSection(item.id as SettingsSection); }}
                  className={`relative z-10 w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-none ${isActive ? 'text-zinc-900' : 'text-zinc-900 dark:text-zinc-100'}`}
                >
                  <img
                    src={theme === 'dark' && !isActive ? item.imgD : item.imgL}
                    alt=""
                    className={`object-contain flex-shrink-0 ${item.id === 'subscription' ? 'w-6 h-6' : 'w-5 h-5'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-4 flex flex-col space-y-2 border-t border-zinc-200 dark:border-[#2a2a2a]">
            {saveLabel[activeSection] !== null && (
              <Button
                onClick={handleSave}
                className="w-full bg-zinc-200 dark:bg-white text-zinc-900 dark:text-black hover:bg-zinc-300 dark:hover:bg-zinc-200 text-xs h-9 font-bold"
              >
                {saveLabel[activeSection]}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCloseAttempt}
              className="w-full bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs h-9"
            >
              {activeSection === 'subscription' ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div ref={settingsContentRef} className="settings-content-scroll flex-1 p-8 overflow-y-auto relative bg-[#f5f5f5] dark:bg-[#1e1e1e] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {/* SettingsScrollButtons removed — max-up/max-down disabled */}
          {activeSection === 'looks' && (
            <div className="space-y-8">
              <ThemeSegmentedTab
                value={localTheme}
                onChange={(v) => { setLocalTheme(v); setTheme(v as any); setIsDirty(true); }}
                isDark={theme === 'dark'}
              />

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Message Bar Glow Color</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the soft glow behind the message bar on the Ask tab</p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {GLOW_ACCENT_OPTIONS.map(opt => {
                    const selected = glowAccentColor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-label={opt.label}
                        aria-pressed={selected}
                        onClick={() => handleGlowAccentColorChange(opt.value)}
                        className={`group flex flex-col items-center gap-2 rounded-xl border bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent p-3 transition-all ${
                          selected
                            ? 'border-zinc-500 dark:border-zinc-400'
                            : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                        }`}
                      >
                        <span
                          className={`relative h-12 w-12 rounded-full border border-black/10 dark:border-white/15 transition-transform group-hover:scale-105 ${opt.swatch ? '' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                          style={opt.swatch ? { backgroundColor: opt.swatch } : undefined}
                        >
                          {!opt.swatch && <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-zinc-500" />}
                        </span>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">{opt.label.replace('Light ', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Accent Color ─────────────────────────────────────────────── */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Accent Color</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Color for messages, toggles, logo &amp; welcome text</p>
                  </div>
                  <Switch checked={uiAccentEnabled} onCheckedChange={handleUiAccentEnabledChange} />
                </div>
                {uiAccentEnabled && (
                  <div className="space-y-3">
                    {/* Multicolor option */}
                    <button
                      type="button"
                      aria-label="Multicolor"
                      aria-pressed={uiAccentColor === 'multicolor'}
                      onClick={() => handleUiAccentColorChange('multicolor')}
                      className={`w-full text-left rounded-xl border px-4 py-2.5 transition-all flex items-center gap-3 ${
                        uiAccentColor === 'multicolor'
                          ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-900'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      {/* Rainbow swatch */}
                      <span className="h-8 w-8 rounded-full flex-shrink-0 border border-black/10 dark:border-white/15" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Multicolor <span className="text-xs font-normal text-zinc-400">(same as default)</span></span>
                    </button>
                    {/* Color options grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {UI_ACCENT_OPTIONS.map(opt => {
                        const selected = uiAccentColor === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-label={opt.label}
                            aria-pressed={selected}
                            onClick={() => handleUiAccentColorChange(opt.value)}
                            className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                              selected
                                ? 'border-zinc-500 dark:border-zinc-400'
                                : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                            }`}
                          >
                            <span
                              className="h-8 w-8 rounded-full border border-black/10 dark:border-white/15 transition-transform group-hover:scale-105"
                              style={{ backgroundColor: opt.swatch }}
                            />
                            <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Global App Font</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Use this font throughout Fius</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {APP_FONT_OPTIONS.map(opt => {
                    const selected = appFont === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-label={`Use ${opt.label}`}
                        aria-pressed={selected}
                        onClick={() => handleAppFontChange(opt.value)}
                        className={`text-left rounded-xl border px-4 py-3 transition-all ${
                          selected
                            ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-900'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{opt.label}</span>
                          {opt.value === DEFAULT_APP_FONT && (
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Default</span>
                          )}
                        </div>
                        <div className="text-xl text-zinc-900 dark:text-zinc-100 truncate" style={{ fontFamily: opt.css }}>
                          Aa Bb Cc 123
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 truncate" style={{ fontFamily: opt.css }}>
                          The quick brown fox jumps
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                {/* ── Sounds ─────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Glossy Outline</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Shiny border effect on the message bar, function bar &amp; top bar</p>
                  </div>
                  <Switch checked={localToggles.glossyOutline ?? true} onCheckedChange={() => handleToggle('glossyOutline')} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Top Bar Tab Icons</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show icons alongside tab names in the top navigation bar</p>
                  </div>
                  <Switch checked={localToggles.topbarTabIcons ?? true} onCheckedChange={() => handleToggle('topbarTabIcons')} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Tabs in Sidebar</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Move Ask, Nomad, Imagine Studio, Fius Minds, Fius Games &amp; Labs to the sidebar; hides them from the top bar</p>
                  </div>
                  <Switch checked={localToggles.tabsInSidebar ?? true} onCheckedChange={() => handleToggle('tabsInSidebar')} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">UI Sounds</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Play a click sound when switching tabs &amp; pill options</p>
                  </div>
                  <Switch checked={uiSoundsEnabled} onCheckedChange={handleUiSoundsChange} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Show Actions on User Messages</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show copy &amp; redo buttons when hovering over your messages</p>
                  </div>
                  <Switch checked={localToggles.showUserMsgActions ?? false} onCheckedChange={() => handleToggle('showUserMsgActions')} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">Wrap Long Lines For Code Blocks By Default</span>
                  <Switch checked={localToggles.wrapLines} onCheckedChange={() => handleToggle('wrapLines')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">Show Conversation Previews in History</span>
                  <Switch checked={localToggles.showPreviews} onCheckedChange={() => handleToggle('showPreviews')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Show Fius Logo in Responses</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Display the Fius logo next to AI responses in chat</p>
                  </div>
                  <Switch checked={localToggles.showFiusLogo ?? true} onCheckedChange={() => handleToggle('showFiusLogo')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Hide Fius Logo</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Hide the Fius logo from the welcome screen</p>
                  </div>
                  <Switch checked={localToggles.hideFiusLogo ?? false} onCheckedChange={() => handleToggle('hideFiusLogo')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Hide Fly With Us</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Hide the "Fly With Us!" tagline from the welcome screen</p>
                  </div>
                  <Switch checked={localToggles.hideFlyWithUs ?? false} onCheckedChange={() => handleToggle('hideFlyWithUs')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Nomad Grid Background</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show an animated grid pattern in the Nomad multi-AI tab</p>
                  </div>
                  <Switch checked={localToggles.nomadGrid ?? true} onCheckedChange={() => handleToggle('nomadGrid')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Fius Minds Grid Background</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show a subtle grid pattern behind the Fius Minds personality cards</p>
                  </div>
                  <Switch checked={localToggles.mindsGrid ?? true} onCheckedChange={() => handleToggle('mindsGrid')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Nomad Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show a periodic pop-up notification every 3–5 minutes</p>
                  </div>
                  <Switch checked={localToggles.nomadNotification ?? true} onCheckedChange={() => handleToggle('nomadNotification')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Fius Minds Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Include the Fius Minds variant in periodic pop-ups</p>
                  </div>
                  <Switch checked={localToggles.philosopherNotification ?? true} onCheckedChange={() => handleToggle('philosopherNotification')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Fius Games Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Include the Fius Games variant in periodic pop-ups</p>
                  </div>
                  <Switch checked={localToggles.fiusGamesNotification ?? true} onCheckedChange={() => handleToggle('fiusGamesNotification')} />
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Function Bar Style</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose how the quick-action buttons appear</p>
                </div>
                {/* Function bar style — 4-option grid with shape previews */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'square',      label: 'Square' },
                    { value: 'circle',      label: 'Circle' },
                    { value: 'message-bar', label: 'In Bar'  },
                    { value: 'pill',        label: 'Pill Row'},
                  ].map(opt => {
                    const active = functionBarStyle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleFunctionBarStyleChange(opt.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          active
                            ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        {opt.value === 'square' && (
                          <div className="w-8 h-8 bg-zinc-400 dark:bg-zinc-500 rounded" />
                        )}
                        {opt.value === 'circle' && (
                          <div className="w-8 h-8 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                        )}
                        {opt.value === 'message-bar' && (
                          <div className="w-8 h-8 flex items-center justify-center gap-0.5">
                            <div className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                            <div className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                          </div>
                        )}
                        {opt.value === 'pill' && (
                          <div className="w-8 h-8 flex items-center justify-center gap-1">
                            <div className="h-2 w-3 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                            <div className="h-2 w-3 bg-zinc-400 dark:bg-zinc-500 rounded-full opacity-50" />
                          </div>
                        )}
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Message Bar Style</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the height and layout of the message input area</p>
                </div>
                <SlidingPillSelector
                  value={messageBarStyle}
                  onChange={handleMessageBarStyleChange}
                  isDark={theme === 'dark'}
                  withSound
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'compact', label: 'Compact' },
                  ]}
                />
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Logo Style</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the Fius logo shown in welcome screens and responses</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LOGO_STYLE_OPTIONS.map(opt => {
                    const active = logoStyle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleLogoStyleChange(opt.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          active
                            ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <FiusLogo
                          size="md"
                          styleOverride={opt.value}
                          className={theme === 'dark' ? 'text-white' : 'text-black'}
                        />
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Auto-rotate Logo</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Use a different logo style for each new chat</p>
                  </div>
                  <Switch checked={autoRotateLogo} onCheckedChange={handleAutoRotateLogoChange} />
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Sidebar Close Button Position</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Choose where the close button appears in the sidebar</p>
                  </div>
                  <Select
                    value={localToggles.sidebarCloseTop ? 'top' : 'bottom'}
                    onValueChange={(val) => { setLocalToggles(prev => ({ ...prev, sidebarCloseTop: val === 'top' })); setIsDirty(true); }}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs bg-zinc-50 dark:bg-[#161616] border-zinc-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Chat Background</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the background style for the chat area</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'plain', label: 'Plain' },
                    { value: 'gradient', label: 'Blue Sides' },
                    { value: 'rainbow', label: 'Rainbow Sides' },
                    { value: 'stars', label: 'Stars' },
                    { value: 'stars-gradient', label: 'Stars + Blue' },
                    { value: 'stars-rainbow', label: 'Stars + Rainbow' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChatBgChange(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        chatBg === opt.value
                          ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {opt.value === 'plain' && (
                        <div className="w-24 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700" />
                      )}
                      {opt.value === 'gradient' && (
                        <div className="w-24 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                          style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.35) 0%, white 35%, white 65%, rgba(59,130,246,0.35) 100%)' }} />
                      )}
                      {opt.value === 'stars' && (
                        <div className="w-24 h-10 bg-zinc-900 rounded-lg relative overflow-hidden border border-zinc-700">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-80" style={{
                              left: `${10 + (i * 12) % 90}%`,
                              top: `${15 + (i * 17) % 70}%`,
                              animation: `twinkle ${1.2 + (i * 0.3) % 1.5}s ease-in-out infinite`,
                              animationDelay: `${(i * 0.2) % 1.5}s`
                            }} />
                          ))}
                        </div>
                      )}
                      {opt.value === 'stars-gradient' && (
                        <div className="w-24 h-10 rounded-lg relative overflow-hidden border border-blue-300 dark:border-blue-900"
                          style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.35) 0%, white 35%, white 65%, rgba(59,130,246,0.35) 100%)' }}>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-0.5 bg-blue-500 rounded-full opacity-80" style={{
                              left: `${8 + (i * 15) % 84}%`,
                              top: `${20 + (i * 19) % 60}%`,
                              animation: `twinkle ${1.2 + (i * 0.3) % 1.5}s ease-in-out infinite`,
                              animationDelay: `${(i * 0.25) % 1.5}s`
                            }} />
                          ))}
                        </div>
                      )}
                      {opt.value === 'rainbow' && (
                        <div className="w-24 h-10 rounded-lg relative overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                          <div className="absolute top-0 left-0 bottom-0 w-8 rounded-l-lg" style={{
                            background: 'linear-gradient(to right, rgba(59,130,246,0.6), transparent)',
                            animation: 'gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite',
                          }} />
                          <div className="absolute top-0 right-0 bottom-0 w-8 rounded-r-lg" style={{
                            background: 'linear-gradient(to left, rgba(59,130,246,0.6), transparent)',
                            animation: 'gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite',
                            animationDelay: '0s, 0.5s',
                          }} />
                        </div>
                      )}
                      {opt.value === 'stars-rainbow' && (
                        <div className="w-24 h-10 rounded-lg relative overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                          <div className="absolute top-0 left-0 bottom-0 w-8 rounded-l-lg" style={{
                            background: 'linear-gradient(to right, rgba(59,130,246,0.6), transparent)',
                            animation: 'gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite',
                          }} />
                          <div className="absolute top-0 right-0 bottom-0 w-8 rounded-r-lg" style={{
                            background: 'linear-gradient(to left, rgba(59,130,246,0.6), transparent)',
                            animation: 'gradient-breathe 3.5s ease-in-out infinite, rainbow-shift 5s linear infinite',
                            animationDelay: '0s, 0.5s',
                          }} />
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-0.5 bg-zinc-600 dark:bg-zinc-300 rounded-full" style={{
                              left: `${15 + (i * 17) % 70}%`,
                              top: `${20 + (i * 19) % 60}%`,
                              animation: `twinkle ${1.2 + (i * 0.3) % 1.5}s ease-in-out infinite`,
                              animationDelay: `${(i * 0.25) % 1.5}s`
                            }} />
                          ))}
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeSection === 'general' && (
            <div className="space-y-6 text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Auto Scroll</span>
                <Switch checked={localToggles.autoScroll ?? true} onCheckedChange={() => handleToggle('autoScroll')} />
              </div>

              {/* Learned Behaviors */}
              <LearnedBehaviorsSection />
            </div>
          )}


          {activeSection === 'nomad' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Order Switcher</h4>
                {(() => {
                  const modelDisplayNames: Record<string, string> = {
                    'gpt-4o': 'ChatGPT',
                    'claude-3.5-sonnet': 'Claude',
                    'gemini-pro': 'Gemini',
                    'perplexity': 'Perplexity',
                    'grok-4': 'Grok',
                    'deepseek-r1': 'DeepSeek',
                    'doubao': 'Doubao',
                    'kimi': 'Kimi',
                    'qwen': 'Qwen',
                    'llama-4': 'Llama',
                    'mistral': 'Mistral',
                    'copilot': 'Copilot',
                    'fius-ai': 'Fius',
                  };
                  const modelLogos: Record<string, string | null> = {
                    'gpt-4o': theme === 'dark' ? '/chatgpt-logo-white.png' : '/chatgpt-logo.png',
                    'claude-3.5-sonnet': '/claude-logo.png',
                    'gemini-pro': '/gemini-logo.png',
                    'perplexity': '/perplexity-logo.png',
                    'grok-4': '/grok-logo.png',
                    'deepseek-r1': '/deepseek-logo.png',
                    'doubao': '/doubao-logo.png',
                    'kimi': '/kimi-logo.png',
                    'qwen': '/qwen-logo.png',
                    'llama-4': '/llama-logo.png',
                    'mistral': '/mistral-logo.png',
                    'copilot': '/copilot-logo.png',
                    'fius-ai': null,
                  };
                  return (
                <div className="space-y-2">
                  {localAiOrder.map((name, index) => {
                    const subModels = NOMAD_SUB_MODELS[name];
                    const selectedModel = nomadDefaultModels[name] || subModels?.default || '';
                    const isOpen = openSettingsModelDropdown === name;
                    return (
                    <div key={name} className="relative">
                    <div
                      ref={el => { orderRowRefs.current[index] = el; }}
                      className={`flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#161616] rounded-lg border ${draggingIndex === index ? '' : 'transition-all'} ${dragOverIndex === index && draggingIndex !== index ? 'border-indigo-400 dark:border-indigo-500' : 'border-zinc-200 dark:border-zinc-800'} ${draggingIndex === index ? 'opacity-90 scale-[1.02] shadow-2xl ring-2 ring-indigo-400/60 relative z-10 cursor-grabbing' : ''}`}
                      style={draggingIndex === index ? { transform: `translateY(${dragOffsetY}px)` } : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          onPointerDown={handleOrderPointerDown(index)}
                          style={{ touchAction: 'none' }}
                          className="cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-600 p-1 -m-1 flex-shrink-0"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        {name === 'fius-ai'
                          ? <Logo size="sm" />
                          : modelLogos[name] && (
                            <img
                              src={modelLogos[name]!}
                              alt=""
                              className="w-5 h-5 object-contain flex-shrink-0"
                              style={(name === 'grok-4' || name === 'gpt-4o') && theme !== 'dark' ? { filter: 'invert(1)' } : undefined}
                            />
                          )
                        }
                        <span className="text-sm text-zinc-900 dark:text-white flex-shrink-0">{modelDisplayNames[name] || name.replace(/-/g, ' ')}</span>
                        {subModels && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenSettingsModelDropdown(isOpen ? null : name); }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-transparent text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all"
                          >
                            <span>{selectedModel}</span>
                            <ChevronDown className={`h-2.5 w-2.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === localAiOrder.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Model sub-selector dropdown */}
                    {isOpen && subModels && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#383838] rounded-xl shadow-2xl overflow-hidden py-1" style={{ border: 'none' }}>
                        <div className="px-3 pt-2 pb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Normal Models</span>
                        </div>
                        {subModels.normal.map(sm => {
                          const isSel = selectedModel === sm;
                          return (
                            <button key={sm}
                              onClick={() => {
                                const updated = { ...nomadDefaultModels, [name]: sm };
                                setNomadDefaultModels(updated);
                                try { localStorage.setItem('fius-nomad-sub-models', JSON.stringify(updated)); } catch {}
                                setOpenSettingsModelDropdown(null);
                                setIsDirty(true);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-all rounded-full mx-1 hover:bg-black/10 dark:hover:bg-white/10 ${isSel ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSel ? 'bg-zinc-900 dark:bg-white' : 'border border-zinc-400'}`} />
                              <span className="flex-1">{sm}</span>
                              {sm === subModels.default && !isSel && <span className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-1.5 py-0.5">default</span>}
                            </button>
                          );
                        })}
                        <div className="px-3 pb-1 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Flagship Models</span>
                        </div>
                        {subModels.flagship.map(sm => {
                          const isSel = selectedModel === sm;
                          return (
                            <button key={sm}
                              onClick={() => {
                                const updated = { ...nomadDefaultModels, [name]: sm };
                                setNomadDefaultModels(updated);
                                try { localStorage.setItem('fius-nomad-sub-models', JSON.stringify(updated)); } catch {}
                                setOpenSettingsModelDropdown(null);
                                setIsDirty(true);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-all rounded-full mx-1 hover:bg-black/10 dark:hover:bg-white/10 ${isSel ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSel ? 'bg-amber-500' : 'border border-amber-400'}`} />
                              <span className="flex-1">{sm}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  );
                  })}
                </div>
                  );
                })()}

                <div className="pt-6 border-t border-zinc-200 dark:border-[#2a2a2a] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-zinc-900 dark:text-white">Improve the Model</span>
                      <p className="text-xs text-zinc-500 mt-1">By allowing your data to be used for training our models, you help enhance your own experience and improve the quality of the model for all users.</p>
                    </div>
                    <Switch checked={localToggles.improveModel} onCheckedChange={() => handleToggle('improveModel')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-zinc-900 dark:text-white">Personalize Fius with your conversation history <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">beta</span></span>
                      <p className="text-xs text-zinc-500 mt-1">Allow Fius to remember details from your previous conversations.</p>
                    </div>
                    <Switch checked={localToggles.personalize} onCheckedChange={() => handleToggle('personalize')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-900 dark:text-white">Allow chat link sharing</span>
                    <Switch checked={localToggles.linkSharing} onCheckedChange={() => handleToggle('linkSharing')} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-[#161616] rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Storage Usage</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-zinc-500 dark:bg-zinc-400 h-full w-[2%]" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">13.59 MB used of 1.07 GB</p>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-[#161616] rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {(previewPic || profilePicture) ? (
                        <img src={previewPic || profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ background: getVibrantColor(user?.displayName || user?.username || 'U') }}>
                          {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase">{user?.displayName || user?.username || 'User'}</p>
                      <p className="text-xs text-zinc-500">{user?.email || ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs h-8 flex items-center gap-1.5"
                    onClick={() => {
                      setEditName(user?.displayName || user?.username || '');
                      setPreviewPic('');
                      setShowCustomizePanel(v => !v);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Profile
                  </Button>
                </div>

                {showCustomizePanel && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Display Name</label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-8 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Profile Picture</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {(previewPic || profilePicture) ? (
                            <img src={previewPic || profilePicture} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ background: getVibrantColor(user?.displayName || user?.username || 'U') }}>
                              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                          onClick={() => picInputRef.current?.click()}
                        >
                          <Camera className="w-3 h-3" />
                          Upload Photo
                        </Button>
                        <input
                          ref={picInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setPreviewPic(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => { setShowCustomizePanel(false); setPreviewPic(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-zinc-200 dark:bg-white text-zinc-900 dark:text-zinc-900 flex items-center gap-1.5"
                        onClick={() => {
                          if (editName.trim()) onUserRename?.(editName.trim());
                          if (previewPic) onProfilePictureChange?.(previewPic);
                          setShowCustomizePanel(false);
                        }}
                      >
                        <Check className="w-3 h-3" />
                        Save Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'subscription' && (
            <div className="space-y-4">
              <PlanUsageSection />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    {showExitDialog && (
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 max-w-sm shadow-2xl rounded-2xl p-6 z-[200] opacity-100">
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
              className="bg-zinc-200 dark:bg-white text-zinc-900 dark:text-black hover:bg-zinc-300 dark:hover:bg-zinc-200 font-bold"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}

