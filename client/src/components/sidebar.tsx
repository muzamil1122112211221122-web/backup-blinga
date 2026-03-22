import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { Plus, Trash2, X, Check, ChevronLeft, Edit3 as PenTool } from "lucide-react";
import { Logo } from "./logo";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";

import searchIcon from "@assets/search_button_1766857136554.png";
import chatIcon from "@assets/chats_button_1766857136554.png";
import voiceIcon from "@assets/voice_button_1766857136553.png";
import imagineIcon from "@assets/imagine_button_1766857136552.png";
import historyIcon from "@assets/history_button_1766857136551.png";

import searchIconCopy from "@assets/search_button_-_Copy_1766857136547.png";
import chatIconCopy from "@assets/chats_button_-_Copy_1766857136548.png";
import voiceIconCopy from "@assets/voice_button_-_Copy_1766857136548.png";
import imagineIconCopy from "@assets/imagine_button_-_Copy_1766857136549.png";
import historyIconCopy from "@assets/history_button_-_Copy_1766857136550.png";

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
  user?: {
    email: string;
    username: string;
  };
}

export function Sidebar({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onProjectSelect,
  onNewProject,
  onDeleteProject,
  onEditProject,
  user
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllGroups, setShowAllGroups] = useState<Set<string>>(new Set());
  const { theme } = useTheme();

  const isDark = theme === "dark";

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
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 space-y-0.5 mt-1">
          {/* Search */}
          <div className="relative group">
            <img src={isDark ? searchIconCopy : searchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 h-[22px] w-[22px] object-contain opacity-70 group-focus-within:opacity-100 transition-opacity" alt="Search" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="sidebar-search-input"
              className="w-full pl-12 pr-12 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 focus:bg-zinc-200/80 dark:focus:bg-zinc-800/80 transition-all outline-none border border-zinc-200 dark:border-zinc-800/30 focus:border-zinc-300 dark:focus:border-zinc-700/50 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {/* New Chat */}
          <div className="flex items-center space-x-1 group">
            <button
              onClick={() => onNewProject?.(false)}
              className="flex-1 flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group/btn"
            >
              <img src={isDark ? chatIconCopy : chatIcon} className="h-[22px] w-[22px] object-contain opacity-70 group-hover/btn:opacity-100 transition-opacity" alt="Chat" />
              <span className="text-[15px] font-medium">Chat</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onNewProject?.(false);
              }}
              className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <button className="w-full flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <img src={isDark ? voiceIconCopy : voiceIcon} className="h-[22px] w-[22px] object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Voice" />
            <span className="text-[15px] font-medium">Voice</span>
          </button>

          <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <div className="flex items-center space-x-3">
              <img src={isDark ? imagineIconCopy : imagineIcon} className="h-[22px] w-[22px] object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Imagine" />
              <span className="text-[15px] font-medium">Imagine</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/80 mr-1" />
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto mt-3 px-3">
          <div className="flex items-center space-x-3 px-3 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold">
            <img src={isDark ? historyIconCopy : historyIcon} className="h-[22px] w-[22px] object-contain" alt="History" />
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTitle(chat.title);
                                  setEditingProject(chat.id);
                                }}
                                className="p-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              >
                                <PenTool className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProject(chat.id);
                                }}
                                className="p-1 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
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
            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-[15px] shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${getVibrantColor(user.username || user.email)}, ${getVibrantColor(user.username || user.email, true)})`
                  }}
                >
                  {(user.username || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.username || user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
