import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { 
  Plus,
  Trash2,
  X,
  PenTool,
  Check,
  Search,
  Mic,
  Image as ImageIcon,
  FolderOpen,
  History,
  ChevronLeft
} from "lucide-react";
import { Logo } from "./logo";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";

// Generate vibrant colors based on name
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  projects: Array<{
    id: string;
    title: string;
    createdAt: Date;
    aiRole?: string;
  }>;
  currentProjectId?: string;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
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
  onSearchOpen,
  user
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const { theme } = useTheme();

  if (!isOpen) return null;

  // Group projects by date
  const groupProjectsByDate = () => {
    const groups: { [key: string]: typeof projects } = {
      'Today': [],
      'Yesterday': [],
      'This Month': [],
    };

    const sortedProjects = [...projects].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedProjects.forEach(project => {
      const date = new Date(project.createdAt);
      if (isToday(date)) {
        groups['Today'].push(project);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(project);
      } else if (isThisMonth(date)) {
        groups['This Month'].push(project);
      } else {
        const monthYear = format(date, 'MMMM');
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(project);
      }
    });

    return groups;
  };

  const projectGroups = groupProjectsByDate();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-72 bg-[#0d0d0d] text-zinc-100 z-50 flex flex-col border-r border-zinc-800/50">
        {/* Header - Logo Only */}
        <div className="p-4 flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-3 space-y-1 mt-2">
          {/* Search */}
          <button
            onClick={onSearchOpen}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group border border-zinc-800/30"
          >
            <div className="flex items-center space-x-3 text-zinc-400">
              <Search className="h-4.5 w-4.5" />
              <span className="text-[15px]">Search</span>
            </div>
            <span className="text-[10px] font-medium text-zinc-600 group-hover:text-zinc-500">Shift + F</span>
          </button>

          {/* New Chat */}
          <button
            onClick={onNewProject}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <PenTool className="h-4.5 w-4.5" />
            <span className="text-[15px] font-medium">Chat</span>
          </button>

          {/* Voice */}
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-100">
            <Mic className="h-4.5 w-4.5" />
            <span className="text-[15px] font-medium">Voice</span>
          </button>

          {/* Imagine */}
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-100">
            <div className="flex items-center space-x-3">
              <ImageIcon className="h-4.5 w-4.5" />
              <span className="text-[15px] font-medium">Imagine</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/80 mr-1" />
          </button>

          {/* Projects */}
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-100">
            <FolderOpen className="h-4.5 w-4.5" />
            <span className="text-[15px] font-medium">Projects</span>
          </button>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto mt-6 px-3">
          <div className="flex items-center space-x-3 px-3 mb-4 text-zinc-100 font-semibold">
            <History className="h-4.5 w-4.5" />
            <span className="text-[15px]">History</span>
          </div>

          <div className="space-y-6">
            {Object.entries(projectGroups).map(([groupName, groupProjects]) => (
              groupProjects.length > 0 && (
                <div key={groupName} className="space-y-1">
                  <h4 className="px-10 text-[13px] font-semibold text-zinc-500 mb-2">{groupName}</h4>
                  <div className="border-l border-zinc-800/50 ml-[1.35rem] pl-4 space-y-1">
                    {groupProjects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className={`group relative px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          currentProjectId === project.id
                            ? 'bg-zinc-800/50 text-zinc-100'
                            : 'hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-100'
                        }`}
                        onClick={() => editingProject !== project.id && onProjectSelect(project.id)}
                        onMouseEnter={() => setHoveredProject(project.id)}
                        onMouseLeave={() => setHoveredProject(null)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {editingProject === project.id ? (
                              <div className="space-y-2 py-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="text-xs h-7 bg-zinc-900 border-zinc-800 text-zinc-100"
                                  autoFocus
                                />
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditProject?.(project.id, editTitle);
                                      setEditingProject(null);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px] border-zinc-800"
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
                              <p className="text-[14px] font-medium truncate leading-relaxed">
                                {project.title || 'New Project'}
                              </p>
                            )}
                          </div>
                          
                          {hoveredProject === project.id && editingProject !== project.id && (
                            <div className="flex items-center space-x-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTitle(project.title);
                                  setEditingProject(project.id);
                                }}
                                className="p-1 hover:text-blue-400 transition-colors"
                              >
                                <PenTool className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProject(project.id);
                                }}
                                className="p-1 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {groupProjects.length > 5 && (
                      <button 
                        className="px-3 py-1 text-[13px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
                        onClick={() => {/* Implement full history view if needed */}}
                      >
                        See all
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 mt-auto border-t border-zinc-800/30">
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
                  <p className="text-[14px] font-semibold text-zinc-100 truncate">
                    {user.username || user.email}
                  </p>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}