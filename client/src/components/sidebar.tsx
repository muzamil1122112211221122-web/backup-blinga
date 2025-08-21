import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus,
  Trash2,
  X,
  Edit3,
  PenTool,
  Check,
  User,
  Moon,
  Sun
} from "lucide-react";
import { Logo } from "./logo";

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
  user?: {
    email: string;
    username: string;
  };
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
  onUpdateAiRole,
  user
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editingAiRole, setEditingAiRole] = useState<string | null>(null);
  const [aiRoleText, setAiRoleText] = useState<string>('');
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 flex flex-col rounded-r-3xl shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="sm" />
            <span className="font-semibold text-foreground">Forus Heavy API</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground rounded-2xl"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-2xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Conversation */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={onNewProject}
            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative p-3 rounded-lg transition-all duration-200 border ${
                    currentProjectId === project.id
                      ? 'bg-accent text-foreground border-foreground border-opacity-30'
                      : 'hover:bg-accent text-foreground hover:border-foreground hover:border-opacity-20 border-border border-opacity-50'
                  }`}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                  data-testid={`project-${project.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0" onClick={() => editingProject !== project.id && onProjectSelect(project.id)} style={{ cursor: editingProject === project.id ? 'default' : 'pointer' }}>
                      {editingProject === project.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-sm h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onEditProject?.(project.id, editTitle);
                                setEditingProject(null);
                              } else if (e.key === 'Escape') {
                                setEditingProject(null);
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                onEditProject?.(project.id, editTitle);
                                setEditingProject(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingProject(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : editingAiRole === project.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={aiRoleText}
                            onChange={(e) => setAiRoleText(e.target.value)}
                            className="text-xs min-h-[60px] resize-none"
                            placeholder="Define how the AI should behave for this project..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                onUpdateAiRole?.(project.id, aiRoleText);
                                setEditingAiRole(null);
                              } else if (e.key === 'Escape') {
                                setEditingAiRole(null);
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                onUpdateAiRole?.(project.id, aiRoleText);
                                setEditingAiRole(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingAiRole(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium truncate text-current">
                            {project.title || 'New Project'}
                          </h3>
                          <p className="text-xs mt-1 opacity-70 text-current">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                          {project.aiRole && (
                            <p className="text-xs mt-1 opacity-60 text-current truncate">
                              AI: {project.aiRole.substring(0, 50)}...
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {hoveredProject === project.id && editingProject !== project.id && editingAiRole !== project.id && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-400 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitle(project.title);
                            setEditingProject(project.id);
                          }}
                          data-testid={`edit-project-${project.id}`}
                          title="Edit project name"
                        >
                          <div className="relative">
                            <PenTool className="h-3 w-3" />
                            <div className="absolute -inset-1 bg-blue-400/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300"></div>
                          </div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-green-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiRoleText(project.aiRole || 'You are a helpful AI assistant. Be informative, accurate, and concise in your responses.');
                            setEditingAiRole(project.id);
                          }}
                          data-testid={`edit-ai-role-${project.id}`}
                          title="Edit AI role for this project"
                        >
                          <User className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                          }}
                          data-testid={`delete-project-${project.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


        {/* User Profile */}
        <div className="p-4 border-t border-border">
          {user && (
            <div className="flex items-center space-x-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{
                  background: `linear-gradient(45deg, ${getVibrantColor((user as any).displayName || user.username || user.email)}, ${getVibrantColor((user as any).displayName || user.username || user.email, true)})`
                }}
              >
                {((user as any).displayName || user.username || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {(user as any).displayName || user.username || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {(user as any).displayName ? user.username || user.email : user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}