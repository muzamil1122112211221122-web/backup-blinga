import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus,
  Trash2,
  X,
  Edit3,
  Check,
  User
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
  }>;
  currentProjectId?: string;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onEditProject?: (id: string, newTitle: string) => void;
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
  user
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [aiRole, setAiRole] = useState<string>('You are a helpful AI assistant. Be informative, accurate, and concise in your responses.');

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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-2xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Conversation */}
        <div className="p-4 border-b border-[var(--border)]">
          <Button
            onClick={onNewProject}
            className="w-full bg-[var(--text-primary)] text-[var(--dark-primary)] hover:bg-[var(--text-secondary)]"
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
              <div className="text-center text-[var(--text-secondary)] py-8">
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
                      ? 'bg-[var(--dark-accent)] text-[var(--text-primary)] border-[var(--text-primary)] border-opacity-30'
                      : 'hover:bg-[var(--dark-accent)] text-[var(--foreground)] hover:border-[var(--text-primary)] hover:border-opacity-20 border-[var(--border)] border-opacity-50'
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
                      ) : (
                        <>
                          <h3 className="text-sm font-medium truncate text-current">
                            {project.title || 'New Project'}
                          </h3>
                          <p className="text-xs mt-1 opacity-70 text-current">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                    {hoveredProject === project.id && editingProject !== project.id && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitle(project.title);
                            setEditingProject(project.id);
                          }}
                          data-testid={`edit-project-${project.id}`}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400"
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

        {/* AI Role & Requirements */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-[var(--text-primary)]" />
              <h4 className="text-sm font-medium text-[var(--text-primary)]">AI Role & Requirements</h4>
            </div>
            <Textarea
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              placeholder="Define how the AI should behave and respond to your requirements..."
              className="text-xs min-h-[80px] resize-none"
            />
            <p className="text-xs text-[var(--text-secondary)] opacity-70">
              This helps the AI understand its role and how it should respond to your specific needs.
            </p>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--border)]">
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
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {(user as any).displayName || user.username || user.email}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
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