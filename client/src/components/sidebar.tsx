import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Plus, ChevronLeft, Edit3 as PenTool } from "lucide-react";
import { Logo } from "./logo";

import searchIcon from "@assets/search_button_1766857136554.png";
import chatIcon from "@assets/chats_button_1766857136554.png";
import voiceIcon from "@assets/voice_button_1766857136553.png";
import imagineIcon from "@assets/imagine_button_1766857136552.png";

import searchIconCopy from "@assets/search_button_-_Copy_1766857136547.png";
import chatIconCopy from "@assets/chats_button_-_Copy_1766857136548.png";
import voiceIconCopy from "@assets/voice_button_-_Copy_1766857136548.png";
import imagineIconCopy from "@assets/imagine_button_-_Copy_1766857136549.png";

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
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const chatItems = projects.filter(p => !p.isProject);

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
        <div className="p-4 flex items-center justify-between">
          <Logo size="sm" />
        </div>

        <div className="px-3 space-y-1 mt-2">
          {/* New Chat */}
          <div className="flex items-center space-x-1 group">
            <button
              onClick={() => onNewProject?.(false)}
              className="flex-1 flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group/btn"
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

          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <img src={isDark ? voiceIconCopy : voiceIcon} className="h-[22px] w-[22px] object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Voice" />
            <span className="text-[15px] font-medium">Voice</span>
          </button>

          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 group">
            <div className="flex items-center space-x-3">
              <img src={isDark ? imagineIconCopy : imagineIcon} className="h-[22px] w-[22px] object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Imagine" />
              <span className="text-[15px] font-medium">Imagine</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/80 mr-1" />
          </button>
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer relative z-[100]"
              >
                <ChevronLeft className="h-5 w-5 pointer-events-none" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
