import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, ChevronLeft, Settings, UserPen, LogOut, ChevronUp, Search, MessageSquare, Mic, Sparkles, Clock, Bot, ChefHat, Dumbbell, GraduationCap, Compass, Globe, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Logo } from "./logo";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function getVibrantColor(name: string, secondary = false): string {
  const colors = [
    ['#ef4444', '#dc2626'],
    ['#f59e0b', '#d97706'],
    ['#f97316', '#ea580c'],
    ['#3b82f6', '#2563eb'],
    ['#10b981', '#059669'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777'],
    ['#06b6d4', '#0891b2'],
    ['#84cc16', '#65a30d'],
    ['#f43f5e', '#e11d48'],
  ];
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorPair = colors[Math.abs(hash) % colors.length];
  return secondary ? colorPair[1] : colorPair[0];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  projects: Array<{
    id: string;
    title: string;
    createdAt: Date;
    aiRole?: string;
    isProject?: boolean;
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
  user?: {
    email: string;
    username: string;
  };
  onUserRename?: (newUsername: string) => void;
  profilePicture?: string;
  onProfilePictureChange?: (dataUrl: string) => void;
  closeButtonPosition?: 'top' | 'bottom';
}

export function Sidebar({
  isOpen,
  onClose,
  onLogout,
  projects,
  currentProjectId,
  onProjectSelect,
  onNewProject,
  onDeleteProject,
  onEditProject,
  onOpenSettings,
  onVoiceClick,
  onImagineClick,
  user,
  onUserRename,
  profilePicture,
  onProfilePictureChange,
  closeButtonPosition = 'top'
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllGroups, setShowAllGroups] = useState<Set<string>>(new Set());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const picInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      const date = new Date(item.createdAt);
      if (isToday(date)) {
        groups['Today'].push(item);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(item);
      } else if (isThisMonth(date)) {
        groups['This Month'].push(item);
      } else {
        const monthYear = format(date, 'MMMM');
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(item);
      }
    });

    return groups;
  };

  // Only show regular chats (not projects)
  const chatItems = projects.filter(p => !p.isProject);
  const chatGroups = groupItemsByDate(chatItems);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 z-50 flex flex-col border-r border-zinc-200 dark:border-zinc-800/50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="p-3 flex items-center justify-between">
          <Logo size="sm" />
          {closeButtonPosition === 'top' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-3 space-y-0.5 mt-1">
          {/* Search */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/30">
              <Search className="h-3.5 w-3.5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="sidebar-search-input"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-200/80 dark:focus:bg-zinc-800/80 transition-all outline-none border border-zinc-200 dark:border-zinc-800/30 focus:border-zinc-300 dark:focus:border-zinc-700/50 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {/* New Chat */}
          <div className="flex items-center space-x-1 group">
            <button
              onClick={() => onNewProject?.(false)}
              className="flex-1 flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group/btn"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-500/30 flex-shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[15px] font-medium">Chat</span>
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewProject?.(false);
                  }}
                  className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </div>

          <button
            onClick={() => { onVoiceClick?.(); }}
            className="w-full flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm shadow-emerald-500/30 flex-shrink-0">
              <Mic className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[15px] font-medium">Voice</span>
          </button>

          <button
            onClick={() => { onImagineClick?.(); }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm shadow-pink-500/30 flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[15px] font-medium">Imagine</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-pink-500/80 mr-1" />
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto mt-3 px-3">
          <div className="flex items-center space-x-3 px-3 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/30 flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[15px]">History</span>
          </div>

          <div className="space-y-2">
            {Object.entries(chatGroups).map(([groupName, groupChats]) => (
              groupChats.length > 0 && (
                <div key={groupName} className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-3">{groupName}</h4>
                  <div className="space-y-1">
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
                                      <Button
                                        size="sm"
                                        className="h-6 px-2 text-[10px]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditProject?.(chat.id, editTitle);
                                          setEditingProject(null);
                                        }}
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[10px] border-zinc-200 dark:border-zinc-800"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingProject(null);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[13px] font-medium truncate leading-relaxed">
                                {chat.title || 'New Chat'}
                              </p>
                            )}
                          </div>
                          {hoveredProject === chat.id && editingProject !== chat.id && (
                            <div className="flex items-center space-x-1 ml-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openChatConfig(chat); }}
                                    className="p-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                  >
                                    <Settings className="h-3 w-3" />
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
                      <button
                        className="px-3 py-1 text-[11px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors font-bold uppercase tracking-tighter"
                        onClick={() => setShowAllGroups(prev => new Set(prev).add(groupName + "_chat"))}
                      >
                        See more
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/30">
          {user && (
            <div className="relative" ref={profileMenuRef}>
              {/* Profile menu popup */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
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
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-slate-500 to-slate-700 shadow-sm flex-shrink-0">
                          <Settings className="h-3.5 w-3.5 text-white" />
                        </div>
                        Settings
                      </button>
                      <button
                        onClick={() => { setRenameValue(user.username || user.email); setIsCustomizing(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm flex-shrink-0">
                          <UserPen className="h-3.5 w-3.5 text-white" />
                        </div>
                        Customize profile
                      </button>
                      <button
                        onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-rose-600 shadow-sm flex-shrink-0">
                          <LogOut className="h-3.5 w-3.5 text-white" />
                        </div>
                        Log out
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Profile row (clickable) */}
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
                        onClick={onClose}
                        className="ml-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Close sidebar</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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
  );
}
