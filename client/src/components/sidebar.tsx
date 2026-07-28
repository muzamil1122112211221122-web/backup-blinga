import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Settings, UserPen, LogOut, ChevronUp, ChevronLeft, Bot, ChefHat, Dumbbell, GraduationCap, Compass, Globe, TrendingUp, Pin, PinOff, Search, MessageSquare, Clock } from "lucide-react";
import { useUsage } from "@/hooks/use-usage";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FiusLogo } from "./logo";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getVibrantColor } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { SIDEBAR_ASSETS } from "@/lib/sidebar-assets";

// ── Sidebar usage strip ────────────────────────────────────────────────────
function UsageBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

function SidebarUsage() {
  const { usage, isLoading } = useUsage();
  if (isLoading || !usage) return null;

  const isUltimate = usage.plan === "ultimate";

  // 30-day rolling reset from plan activation date
  const now = new Date();
  const activatedAt = (usage as any).planActivatedAt ? new Date((usage as any).planActivatedAt) : null;
  const resetDate = activatedAt
    ? new Date(activatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const msLeft = Math.max(0, resetDate.getTime() - now.getTime());
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // Token / message row
  const tokensRemaining = isUltimate ? (usage.tokensRemaining ?? 0) : (usage.messagesRemaining ?? 0);
  const tokensUsed      = isUltimate ? (usage.tokensUsed ?? 0)      : (usage.messagesUsed ?? 0);
  const tokensLimit     = isUltimate ? (usage.tokensLimit ?? 1)     : (usage.messagesLimit ?? 1);
  const tokensLabel     = isUltimate ? "Tokens" : "Messages";
  const tokensPct       = tokensLimit > 0 ? (tokensUsed / tokensLimit) * 100 : 0;

  // Images row
  const imagesRemaining = usage.imagesRemaining ?? 0;
  const imagesUsed      = usage.imagesUsed ?? 0;
  const imagesLimit     = usage.imagesLimit ?? 1;
  const imagesPct       = imagesLimit > 0 ? (imagesUsed / imagesLimit) * 100 : 0;

  const fmtNum = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000    ? `${(n / 1000).toFixed(0)}k`
    : `${n}`;

  return (
    <div className="mx-3 mb-2 px-3 py-2.5 space-y-3">
      {/* ── Tokens / Messages ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">{tokensLabel}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{fmtNum(tokensRemaining)} left</span>
        </div>
        <UsageBar pct={tokensPct} color="#f59e0b" />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{fmtNum(tokensUsed)} of {fmtNum(tokensLimit)}</p>
      </div>

      {/* ── Images ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Images</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{imagesRemaining} left</span>
        </div>
        <UsageBar pct={imagesPct} color="#ec4899" />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{imagesUsed} of {imagesLimit}</p>
      </div>

      {/* ── Reset countdown ── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Resets in</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{daysLeft}d {hoursLeft}h</span>
      </div>
    </div>
  );
}

// ── Spotlight Search Component ────────────────────────────────────────────────
function SpotlightSearch({
  query,
  onQueryChange,
  onClose,
  chats,
  onSelect,
  isDark,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  chats: Array<{ id: string; title: string; createdAt: Date; aiRole?: string }>;
  onSelect: (id: string) => void;
  isDark: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = [...chats]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(c => !query.trim() || c.title?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  const bg   = isDark ? '#1a1a1a' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const inputColor = isDark ? '#f0f0f0' : '#111111';
  const subColor = isDark ? '#888' : '#999';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 1rem',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'spotlight-fade-in 0.15s ease',
      }}
    >
      <style>{`
        @keyframes spotlight-fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes spotlight-slide-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .spotlight-item:hover { background: ${hoverBg} !important; }
        .spotlight-item { transition: background 0.1s ease; }
        .spotlight-input, .spotlight-input:focus, .spotlight-input:active {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
          -webkit-box-shadow: none !important;
        }
        .spotlight-dialog, .spotlight-dialog:focus, .spotlight-dialog *:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <div
        className="spotlight-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580,
          borderRadius: 18,
          overflow: 'hidden',
          background: bg,
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.4)'
            : '0 24px 80px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)',
          animation: 'spotlight-slide-up 0.18s ease',
        }}
      >
        {/* ── Search Input Row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
        }}>
          <Search style={{ width: 18, height: 18, flexShrink: 0, color: subColor }} />
          <input
            ref={inputRef}
            className="spotlight-input"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search chats..."
            style={{
              flex: 1, minWidth: 0,
              fontSize: 16, lineHeight: '1.4',
              color: inputColor,
              background: 'none',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              caretColor: isDark ? '#ffffff' : '#000000',
            }}
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                padding: 4, display: 'flex', alignItems: 'center', color: subColor }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* ── Chat List ── */}
        <div style={{
          maxHeight: 'min(60vh, 440px)',
          overflowY: 'auto',
          padding: '6px',
        }}>
          {filtered.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '48px 0', gap: 10, color: subColor,
            }}>
              <MessageSquare style={{ width: 28, height: 28, opacity: 0.4 }} />
              <span style={{ fontSize: 14 }}>
                {query ? 'No chats found' : 'No chats yet'}
              </span>
            </div>
          ) : (
            <>
              {query.trim() === '' && (
                <div style={{ padding: '6px 12px 4px', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.07em', textTransform: 'uppercase', color: subColor }}>
                  Recent Chats
                </div>
              )}
              {filtered.map(chat => {
                const dateStr = (() => {
                  const d = new Date(chat.createdAt);
                  if (isToday(d)) return 'Today';
                  if (isYesterday(d)) return 'Yesterday';
                  return format(d, 'MMM d');
                })();
                return (
                  <button
                    key={chat.id}
                    className="spotlight-item"
                    onClick={() => onSelect(chat.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      borderRadius: 12, padding: '10px 12px', textAlign: 'left',
                      background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                      color: inputColor,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageSquare style={{ width: 14, height: 14, color: subColor }} />
                    </div>
                    <span style={{
                      flex: 1, minWidth: 0, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontSize: 14, fontWeight: 500,
                    }}>
                      {chat.title || 'New Chat'}
                    </span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: subColor, flexShrink: 0,
                    }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      <span>{dateStr}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  openMode?: 'mini' | 'full';
  onModeChange?: (mode: 'mini' | 'full') => void;
  onClose: () => void;
  onLogout: () => void;
  projects: Array<{
    id: string;
    title: string;
    createdAt: Date;
    aiRole?: string;
    isProject?: boolean;
    hasNomad?: boolean;
  }>;
  currentProjectId?: string;
  onProjectSelect: (id: string) => void;
  onNewProject?: (isProject?: boolean) => void;
  onDeleteProject: (id: string) => void;
  onEditProject?: (id: string, newTitle: string) => void;
  onUpdateAiRole?: (id: string, newAiRole: string) => void;
  onSearchOpen?: () => void;
  onOpenSettings?: () => void;
  onVoiceClick?: () => void;
  onImagineClick?: () => void;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  tabsInSidebar?: boolean;
  askHasMessages?: boolean;
  ownMode?: boolean;
  onToggleOwnMode?: () => void;
  resolvedTheme?: string;
  user?: {
    email: string;
    username: string;
  };
  onUserRename?: (newUsername: string) => void;
  profilePicture?: string;
  onProfilePictureChange?: (dataUrl: string) => void;
  nomadHistory?: Array<{ id: string; ts: number; mode: string; preview: string }>;
  onNomadHistorySelect?: (id?: string) => void;
  closeButtonPosition?: 'top' | 'bottom';
}

export function Sidebar({
  isOpen,
  openMode = 'mini',
  onModeChange,
  onClose,
  onLogout,
  projects,
  currentProjectId,
  onProjectSelect,
  onNewProject,
  onDeleteProject,
  onEditProject,
  onUpdateAiRole,
  onSearchOpen,
  onOpenSettings,
  onVoiceClick,
  onImagineClick,
  onTabChange,
  activeTab,
  tabsInSidebar = false,
  askHasMessages = false,
  ownMode,
  onToggleOwnMode,
  resolvedTheme,
  user,
  onUserRename,
  profilePicture,
  onProfilePictureChange,
  closeButtonPosition = 'top',
}: SidebarProps) {
  const { theme } = useTheme();
  const [isMini, setIsMini] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllGroups, setShowAllGroups] = useState<Set<string>>(new Set());
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("pinnedChats") || "[]")); } catch { return new Set(); }
  });
  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedChats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("pinnedChats", JSON.stringify(Array.from(next)));
      return next;
    });
  };
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const picInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isDarkTheme = theme === "dark" || (
    theme === "system" &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const sidebarAsset = (key: keyof typeof SIDEBAR_ASSETS) =>
    SIDEBAR_ASSETS[key][isDarkTheme ? "dark" : "light"];

  useEffect(() => {
    if (!isOpen) {
      setIsMini(true);
      setSpotlightOpen(false);
    } else {
      setIsMini(openMode !== 'full');
    }
  }, [isOpen, openMode]);

  const openSpotlight = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSpotlightQuery("");
    setSpotlightOpen(true);
  }, []);

  useEffect(() => {
    onModeChange?.(isMini ? 'mini' : 'full');
  }, [isMini, onModeChange]);

  const closeSidebarStage = () => {
    if (isMini) {
      onClose();
    } else {
      setIsMini(true);
      onModeChange?.('mini');
    }
  };

  // Chat config dialog
  const [chatConfigOpen, setChatConfigOpen] = useState(false);
  const [chatConfigId, setChatConfigId] = useState('');
  const [chatConfigTitle, setChatConfigTitle] = useState('');
  const [chatConfigRole, setChatConfigRole] = useState('General');
  const [roleAnswers, setRoleAnswers] = useState<Record<string, string>>({});

  type RoleIcon = { Icon: React.ComponentType<{className?: string; style?: React.CSSProperties}>; color: string };
  const AI_ROLES: Array<{id: string; label: string; iconDef: RoleIcon; questions: Array<{key: string; label: string}>}> = [
    { id: 'General', label: 'General AI', iconDef: { Icon: Bot, color: '#6366f1' }, questions: [
      { key: 'name', label: 'What should I call you?' },
      { key: 'style', label: 'Preferred tone (friendly / formal / concise)' },
      { key: 'focus', label: 'Main topics you discuss most' },
    ]},
    { id: 'Chef', label: 'Chef', iconDef: { Icon: ChefHat, color: '#f59e0b' }, questions: [
      { key: 'diet', label: 'Dietary restrictions (vegetarian, halal, vegan, etc.)' },
      { key: 'allergies', label: 'Any food allergies or intolerances?' },
      { key: 'cuisine', label: 'Favorite cuisine style (Italian, Asian, Middle-Eastern, etc.)' },
      { key: 'skill', label: 'Cooking level (beginner / intermediate / advanced)' },
      { key: 'servings', label: 'Usual number of people you cook for' },
      { key: 'equipment', label: 'Kitchen tools available (oven, air fryer, stovetop only, etc.)' },
    ]},
    { id: 'Trainer', label: 'Trainer', iconDef: { Icon: Dumbbell, color: '#ef4444' }, questions: [
      { key: 'goal', label: 'Primary goal (lose weight / build muscle / improve endurance)' },
      { key: 'days', label: 'Days per week available to train' },
      { key: 'equipment', label: 'Equipment access (full gym / home / no equipment)' },
      { key: 'level', label: 'Fitness level (beginner / intermediate / advanced)' },
      { key: 'injuries', label: 'Any injuries or physical limitations?' },
      { key: 'age', label: 'Your age range (helps tailor intensity)' },
    ]},
    { id: 'Tutor', label: 'Tutor', iconDef: { Icon: GraduationCap, color: '#3b82f6' }, questions: [
      { key: 'subject', label: 'Subject or topic to focus on' },
      { key: 'level', label: 'Education level (school / college / self-study)' },
      { key: 'style', label: 'Learning style (explanations / quizzes / examples / all)' },
      { key: 'pace', label: 'Preferred pace (slow & thorough / fast & focused)' },
      { key: 'exam', label: 'Any specific exam or curriculum? (e.g. O-levels, SAT, IGCSE)' },
      { key: 'weak', label: 'Weakest area in this subject?' },
    ]},
    { id: 'LifeCoach', label: 'Life Coach', iconDef: { Icon: Compass, color: '#10b981' }, questions: [
      { key: 'focus', label: 'Focus area (career / relationships / mindset / health / productivity)' },
      { key: 'goal', label: 'Main goal you want to achieve' },
      { key: 'challenge', label: 'Biggest challenge you face right now' },
      { key: 'timeline', label: 'Timeline you are working with' },
      { key: 'style', label: 'Coaching style preference (motivational / analytical / gentle / direct)' },
    ]},
    { id: 'LangTutor', label: 'Language Tutor', iconDef: { Icon: Globe, color: '#8b5cf6' }, questions: [
      { key: 'lang', label: 'Language to learn' },
      { key: 'native', label: 'Your native language' },
      { key: 'level', label: 'Current level (beginner / intermediate / advanced)' },
      { key: 'goal', label: 'Goal (travel / business / fluency / just basics)' },
      { key: 'method', label: 'Preferred method (grammar rules / conversation / vocab drills)' },
      { key: 'minutes', label: 'Daily practice time available (in minutes)' },
    ]},
    { id: 'Finance', label: 'Finance Advisor', iconDef: { Icon: TrendingUp, color: '#059669' }, questions: [
      { key: 'goal', label: 'Financial goal (save / invest / budget / pay off debt)' },
      { key: 'income', label: 'Income type (salary / freelance / business / student)' },
      { key: 'risk', label: 'Risk tolerance (low / medium / high)' },
      { key: 'timeline', label: 'Timeline for your goal (months / years)' },
      { key: 'currency', label: 'Your country / currency (helps with local context)' },
    ]},
  ];

  function openChatConfig(chat: { id: string; title: string; aiRole?: string }) {
    setChatConfigId(chat.id);
    setChatConfigTitle(chat.title || '');
    const currentRole = chat.aiRole?.split('\n')[0] || 'General';
    setChatConfigRole(currentRole);
    const answers: Record<string, string> = {};
    if (chat.aiRole) {
      chat.aiRole.split('\n').slice(1).forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) answers[k.trim()] = v.join(':').trim();
      });
    }
    setRoleAnswers(answers);
    setChatConfigOpen(true);
  }

  function saveChatConfig() {
    if (chatConfigTitle.trim()) onEditProject?.(chatConfigId, chatConfigTitle.trim());
    const role = AI_ROLES.find(r => r.id === chatConfigRole);
    const lines = [chatConfigRole];
    if (role) role.questions.forEach(q => { if (roleAnswers[q.key]) lines.push(`${q.key}: ${roleAnswers[q.key]}`); });
    onUpdateAiRole?.(chatConfigId, lines.join('\n'));
    setChatConfigOpen(false);
    toast({ title: 'Chat settings saved' });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
        setIsCustomizing(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  async function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await apiRequest('PUT', '/api/user/rename', { username: trimmed });
      onUserRename?.(trimmed);
      toast({ title: 'Profile updated', description: `Your name is now "${trimmed}"` });
      setIsCustomizing(false);
      setProfileMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch {
      toast({ title: 'Rename failed', description: 'Could not update your name.', variant: 'destructive' });
    }
  }

  function handlePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onProfilePictureChange?.(dataUrl);
      toast({ title: 'Photo updated' });
    };
    reader.readAsDataURL(file);
  }

  // Detect touch device so we always show action buttons on mobile
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const getDateGroup = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisMonth(date)) return 'This Month';
    return format(date, 'MMMM');
  };

  const groupItemsByDate = (items: typeof projects) => {
    const groups: { [key: string]: typeof projects } = {
      'Today': [],
      'Yesterday': [],
      'This Month': [],
    };

    const filteredItems = items.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedItems = [...filteredItems].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedItems.forEach(item => {
      const groupName = getDateGroup(new Date(item.createdAt));
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });

    return groups;
  };

  // Only show regular chats (not projects)
  const chatItems = projects.filter(p => !p.isProject);
  const pinnedItems = chatItems.filter(p => pinnedChats.has(p.id));
  const unpinnedItems = chatItems.filter(p => !pinnedChats.has(p.id));
  const chatGroups = groupItemsByDate(unpinnedItems);

  // All date group keys (chats only)
  const allGroupKeys = Object.keys(chatGroups).filter(g => (chatGroups[g]?.length ?? 0) > 0);
  const MiniNavButton = ({
    asset,
    label,
    onClick,
    active,
    iconSize,
  }: {
    asset: keyof typeof SIDEBAR_ASSETS;
    label: string;
    onClick: () => void;
    active?: boolean;
    iconSize?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${active ? 'bg-zinc-200 dark:bg-zinc-700' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
        >
          <img src={sidebarAsset(asset)} alt="" className="object-contain" style={{width: iconSize ?? '19px', height: iconSize ?? '19px'}} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen && !isMini ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full ${isMini ? 'w-[76px]' : 'w-72'} bg-background text-zinc-900 dark:text-zinc-100 z-50 flex flex-col transition-[width,transform] duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ pointerEvents: 'auto' }}
        onMouseEnter={() => isMini && setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
      >
        <div className={`p-3 flex items-center ${isMini ? 'justify-center' : 'justify-between'}`}>
          {isMini ? (
            /* Mini mode: logo crossfades to close icon on hover */
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Close sidebar"
                  onMouseEnter={() => setIsLogoHovered(true)}
                  onMouseLeave={() => setIsLogoHovered(false)}
                  onClick={(e) => { e.stopPropagation(); closeSidebarStage(); }}
                  className="relative rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 p-1.5 transition-colors"
                  style={{width: 48, height: 48, display:'flex', alignItems:'center', justifyContent:'center'}}
                >
                  {/* Fius logo — fades out on hover */}
                  <div style={{
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    opacity: isLogoHovered ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                    transform: 'scale(1.15)', transformOrigin:'center',
                  }}>
                    <FiusLogo size="sm" className="text-black dark:text-white" />
                  </div>
                  {/* Close icon — fades in on hover */}
                  <div style={{
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    opacity: isLogoHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  }}>
                    <img src={sidebarAsset("close")} alt="" style={{width:26,height:26}} className="object-contain" />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Close sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                type="button"
                aria-label="Sidebar logo"
                onClick={(event) => event.stopPropagation()}
                className="cursor-default"
              >
                <div style={{ transform: 'scale(1.35)', transformOrigin: 'center' }}>
                  <FiusLogo size="sm" className="text-black dark:text-white" />
                </div>
              </button>
              <button
                type="button"
                aria-label="Minimize sidebar"
                onClick={closeSidebarStage}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <img src={sidebarAsset("close")} alt="" className="h-6 w-6 object-contain" />
              </button>
            </>
          )}
        </div>

        {isMini ? (
          <div className="flex-1 flex flex-col items-center pt-1">
            <MiniNavButton asset="search" label="Search Chats" onClick={openSpotlight} />
            <MiniNavButton asset="chat" label="New Chat" onClick={() => onNewProject?.(false)} active={tabsInSidebar && activeTab === 'ask' && !askHasMessages} />
            <MiniNavButton asset="imagine" label="Imagine Studio" onClick={() => onImagineClick?.()} active={tabsInSidebar && activeTab === 'imagine'} />
            {tabsInSidebar && (<>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Owl Mode"
                    onClick={(e) => { e.stopPropagation(); onToggleOwnMode?.(); }}
                    className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-90 ${ownMode ? 'bg-zinc-900 dark:bg-zinc-700' : ''}`}
                  >
                    <img src={(resolvedTheme ?? (isDarkTheme ? 'dark' : 'light')) === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="" className={`object-contain ${ownMode ? 'brightness-0 invert' : ''}`} style={{width:'23px',height:'23px'}} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{ownMode ? 'Exit Owl Mode' : 'Owl Mode'}</TooltipContent>
              </Tooltip>
              <MiniNavButton asset="ask" label="Ask" onClick={() => onTabChange?.('ask')} active={activeTab === 'ask' && askHasMessages} iconSize="25px" />
              <MiniNavButton asset="nomad" label="Nomad" onClick={() => onTabChange?.('nomad')} active={activeTab === 'nomad'} />
              <MiniNavButton asset="minds" label="Fius Minds" onClick={() => onTabChange?.('philosopher')} active={activeTab === 'philosopher'} iconSize="23px" />
              <MiniNavButton asset="games" label="Fius Games" onClick={() => onTabChange?.('fius-games')} active={activeTab === 'fius-games'} iconSize="26px" />
              <MiniNavButton asset="labs" label="Fius Labs" onClick={() => onTabChange?.('fius-labs')} active={activeTab === 'fius-labs'} iconSize="26px" />
            </>)}
            <MiniNavButton asset="history" label="Chats" onClick={() => setIsMini(false)} />
            {/* Free space — tooltip + click to expand, only fires on empty area since buttons stopPropagation */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex-1 w-full cursor-pointer"
                  onClick={() => setIsMini(false)}
                  aria-label="Expand sidebar"
                />
              </TooltipTrigger>
              <TooltipContent side="right">Click to expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="px-3 space-y-0.5 mt-1">
              <button
                type="button"
                onClick={openSpotlight}
                className="w-full flex items-center gap-3 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300 transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left"
              >
                <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("search")} alt="" className="object-contain" style={{width:'19px',height:'19px'}} /></span>
                <span className="text-[14px] font-medium">Search Chats</span>
              </button>

              <button
                type="button"
                onClick={() => onNewProject?.(false)}
                className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${tabsInSidebar && activeTab === 'ask' && !askHasMessages ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
              >
                <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("chat")} alt="" className="object-contain" style={{width:'19px',height:'19px'}} /></span>
                <span className="text-[14px] font-medium">New Chat</span>
              </button>

              <button
                type="button"
                onClick={() => onImagineClick?.()}
                className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'imagine' && tabsInSidebar ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
              >
                <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("imagine")} alt="" className="object-contain" style={{width:'19px',height:'19px'}} /></span>
                <span className="text-[14px] font-medium">Imagine Studio</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-500/80" />
              </button>

              {/* Extra tab items when tabsInSidebar is enabled */}
              {tabsInSidebar && (<>
                {/* Own Mode toggle */}
                <button
                  type="button"
                  onClick={() => onToggleOwnMode?.()}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${ownMode ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={(resolvedTheme ?? (isDarkTheme ? 'dark' : 'light')) === 'dark' ? '/incognito-dark.png' : '/incognito-light.png'} alt="" className={`object-contain ${ownMode ? 'brightness-0 invert' : ''}`} style={{width:'23px',height:'23px'}} /></span>
                  <span className="text-[14px] font-medium">Owl Mode</span>
                  {ownMode && <span className="ml-auto text-[11px] font-medium opacity-70">ON</span>}
                </button>

                <button
                  type="button"
                  onClick={() => { onTabChange?.('ask'); }}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'ask' && askHasMessages ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("ask")} alt="" className="object-contain" style={{width:'25px',height:'25px'}} /></span>
                  <span className="text-[14px] font-medium">Ask</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onTabChange?.('nomad'); }}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'nomad' ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("nomad")} alt="" className="object-contain" style={{width:'19px',height:'19px'}} /></span>
                  <span className="text-[14px] font-medium">Nomad</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onTabChange?.('philosopher'); }}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'philosopher' ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("minds")} alt="" className="object-contain" style={{width:'23px',height:'23px'}} /></span>
                  <span className="text-[14px] font-medium">Fius Minds</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onTabChange?.('fius-games'); }}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'fius-games' ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("games")} alt="" className="object-contain" style={{width:'28px',height:'28px'}} /></span>
                  <span className="text-[14px] font-medium">Fius Games</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onTabChange?.('fius-labs'); }}
                  className={`w-full flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-[0.97] text-left ${activeTab === 'fius-labs' ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0"><img src={sidebarAsset("labs")} alt="" className="object-contain" style={{width:'28px',height:'28px'}} /></span>
                  <span className="text-[14px] font-medium">Fius Labs</span>
                </button>
              </>)}
            </div>

            <div className="flex items-center gap-3 px-6 mb-1 mt-4 text-zinc-900 dark:text-zinc-100 font-semibold flex-shrink-0">
              <img src={sidebarAsset("history")} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
              <span className="text-[15px]">Chats:</span>
            </div>
          </>
        )}
        {!isMini && <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-2">
            {/* ── Pinned section ── */}
            {pinnedItems.length > 0 && (
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1 px-3 flex items-center gap-1.5">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </h4>
                <div className="space-y-1">
                  {pinnedItems.map(chat => (
                    <div key={chat.id}
                      className={`group relative px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${currentProjectId === chat.id ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                      onClick={() => onProjectSelect(chat.id)}
                      onMouseEnter={() => setHoveredProject(`pinned-${chat.id}`)}
                      onMouseLeave={() => setHoveredProject(null)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <p className="text-[13px] font-medium truncate leading-relaxed">{chat.title || 'New Chat'}</p>
                          {chat.hasNomad && (
                            <span className="flex-shrink-0" style={{
                              display: 'inline-block', width: 14, height: 14,
                              WebkitMaskImage: 'url(/creativity-icon.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
                              maskImage: 'url(/creativity-icon.png)', maskSize: 'contain', maskRepeat: 'no-repeat',
                              background: 'linear-gradient(135deg, #ffffff 0%, #374151 100%)',
                            }} />
                          )}
                        </div>
                        {hoveredProject === `pinned-${chat.id}` && (
                          <button onClick={e => togglePin(e, chat.id)}
                            className="ml-2 p-1 text-amber-500 hover:text-amber-600 transition-colors flex-shrink-0">
                            <PinOff className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {allGroupKeys.map(groupName => {
              const groupChats = chatGroups[groupName] ?? [];
              if (groupChats.length === 0) return null;
              return (
                <div key={groupName} className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-3">{groupName}</h4>
                  <div className="space-y-1">
                    {/* Regular chat items */}
                    {(showAllGroups.has(groupName + "_chat") ? groupChats : groupChats.slice(0, 5)).map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          currentProjectId === chat.id
                            ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                        onClick={() => editingProject !== chat.id && onProjectSelect(chat.id)}
                        onMouseEnter={() => setHoveredProject(chat.id)}
                        onMouseLeave={() => setHoveredProject(null)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {editingProject === chat.id ? (
                              <div className="space-y-2 py-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="text-xs h-7 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                  autoFocus
                                />
                                <div className="flex space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" className="h-6 px-2 text-[10px]"
                                        onClick={(e) => { e.stopPropagation(); onEditProject?.(chat.id, editTitle); setEditingProject(null); }}>
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-zinc-200 dark:border-zinc-800"
                                        onClick={(e) => { e.stopPropagation(); setEditingProject(null); }}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[13px] font-medium truncate leading-relaxed">
                                  {chat.title || 'New Chat'}
                                </p>
                                {chat.hasNomad && (
                                  <span className="flex-shrink-0" style={{
                                    display: 'inline-block', width: 14, height: 14,
                                    WebkitMaskImage: 'url(/creativity-icon.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
                                    maskImage: 'url(/creativity-icon.png)', maskSize: 'contain', maskRepeat: 'no-repeat',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #374151 100%)',
                                  }} />
                                )}
                              </div>
                            )}
                          </div>
                          {(hoveredProject === chat.id || isTouchDevice) && editingProject !== chat.id && (
                            <div className="flex items-center space-x-1 ml-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={(e) => togglePin(e, chat.id)}
                                    className={`p-2 transition-colors ${pinnedChats.has(chat.id) ? "text-amber-500 hover:text-amber-600" : "hover:text-zinc-700 dark:hover:text-zinc-200 text-zinc-400"}`}>
                                    {pinnedChats.has(chat.id) ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{pinnedChats.has(chat.id) ? "Unpin" : "Pin chat"}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={(e) => { e.stopPropagation(); openChatConfig(chat); }}
                                    className="p-2 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                                    <Settings className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Chat settings</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {groupChats.length > 5 && !showAllGroups.has(groupName + "_chat") && (
                      <button className="px-3 py-1 text-[11px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors font-bold uppercase tracking-tighter"
                        onClick={() => setShowAllGroups(prev => new Set(prev).add(groupName + "_chat"))}>
                        See more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>}

        {/* ── Usage stats ── */}
        {!isMini && <SidebarUsage />}

        <div className={`p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/30 ${isMini ? 'px-2' : ''}`}>
          {user && (
            <div className="relative" ref={profileMenuRef}>
              {/* Profile menu popup */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10" style={{ animation: 'popup-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  {isCustomizing ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">Customize profile</p>
                        <button onClick={() => setIsCustomizing(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Avatar picker */}
                      <div className="flex flex-col items-center mb-4">
                        <button
                          onClick={() => picInputRef.current?.click()}
                          className="relative group"
                        >
                          {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="h-16 w-16 rounded-full object-cover shadow-lg" />
                          ) : (
                            <div
                              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                              style={{ background: `linear-gradient(45deg, ${getVibrantColor(user.username || user.email)}, ${getVibrantColor(user.username || user.email, true)})` }}
                            >
                              {(user.username || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <UserPen className="h-5 w-5 text-white" />
                          </div>
                        </button>
                        <p className="text-[11px] text-zinc-400 mt-1.5">Click to upload photo</p>
                        <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
                      </div>

                      {/* Name field */}
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Display name</p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setIsCustomizing(false); }}
                          placeholder={user.username || user.email}
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleRenameSubmit}
                              className="p-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Save name</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { onOpenSettings?.(); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        Settings
                      </button>
                      <button
                        onClick={() => { setRenameValue(user.username || user.email); setIsCustomizing(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <UserPen className="h-4 w-4 text-indigo-500" />
                        Customize profile
                      </button>
                      <button
                        onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        Log out
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Profile row (clickable) */}
              {isMini ? (
                <button
                  type="button"
                  aria-label={`Open profile for ${user.username || user.email}`}
                  onClick={() => setIsMini(false)}
                  className="mx-auto flex items-center justify-center rounded-full hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-700 transition-all"
                >
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="h-10 w-10 rounded-full object-cover shadow-lg" />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-[15px] shadow-lg"
                      style={{ background: `linear-gradient(45deg, ${getVibrantColor(user.username || user.email)}, ${getVibrantColor(user.username || user.email, true)})` }}
                    >
                      {(user.username || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setProfileMenuOpen(v => !v)}
                  className="flex items-center space-x-3 flex-1 min-w-0 rounded-xl p-1.5 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="h-9 w-9 rounded-full flex-shrink-0 object-cover shadow-lg" />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[15px] shadow-lg"
                      style={{ background: `linear-gradient(45deg, ${getVibrantColor(user.username || user.email)}, ${getVibrantColor(user.username || user.email, true)})` }}
                    >
                      {(user.username || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.username || user.email}
                    </p>
                  </div>
                  <ChevronUp className={`h-4 w-4 text-zinc-400 transition-transform flex-shrink-0 ${profileMenuOpen ? '' : 'rotate-180'}`} />
                </button>
                {closeButtonPosition === 'bottom' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={closeSidebarStage}
                        className="ml-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <img src={sidebarAsset("close")} alt="" className="h-5 w-5 object-contain" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Close sidebar</TooltipContent>
                  </Tooltip>
                )}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ── Spotlight Search ── */}
      {spotlightOpen && createPortal(
        <SpotlightSearch
          query={spotlightQuery}
          onQueryChange={setSpotlightQuery}
          onClose={() => setSpotlightOpen(false)}
          chats={chatItems}
          onSelect={(id) => { onProjectSelect(id); setSpotlightOpen(false); }}
          isDark={isDarkTheme}
        />,
        document.body
      )}
      {/* ── Chat Config Dialog ── */}
      <Dialog open={chatConfigOpen} onOpenChange={setChatConfigOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-0 max-w-sm w-full overflow-hidden shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Chat Settings</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-0.5">Rename this chat, set an AI role, or delete it.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Chat name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Chat Name</label>
              <Input
                value={chatConfigTitle}
                onChange={e => setChatConfigTitle(e.target.value)}
                placeholder="Chat name"
                className="h-9 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* AI Role */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">AI Role</label>
              <div className="grid grid-cols-4 gap-1.5">
                {AI_ROLES.map(role => {
                  const { Icon, color } = role.iconDef;
                  const active = chatConfigRole === role.id;
                  return (
                    <button key={role.id}
                      onClick={() => setChatConfigRole(role.id)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-center transition-all ${
                        active
                          ? 'border-zinc-300 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}>
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: active ? color + '22' : color + '11' }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <span className="text-[9px] font-semibold text-zinc-600 dark:text-zinc-300 leading-tight">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role questionnaire */}
            {(() => {
              const role = AI_ROLES.find(r => r.id === chatConfigRole);
              if (!role || role.questions.length === 0) return null;
              return (
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tell the AI about you</label>
                  {role.questions.map(q => (
                    <div key={q.key} className="space-y-1">
                      <label className="text-xs text-zinc-500 dark:text-zinc-400">{q.label}</label>
                      <Input
                        value={roleAnswers[q.key] || ''}
                        onChange={e => setRoleAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                        placeholder="Optional"
                        className="h-8 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Danger zone */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <button
                onClick={() => { onDeleteProject(chatConfigId); setChatConfigOpen(false); }}
                className="w-full py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                Delete this chat
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setChatConfigOpen(false)}
              className="rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm">
              Cancel
            </Button>
            <Button size="sm" onClick={saveChatConfig}
              className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 text-sm px-5">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
    </TooltipProvider>
  );
}
