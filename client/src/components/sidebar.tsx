import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus,
  Trash2,
  X
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
  conversations: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
  currentConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  user?: {
    email: string;
    username: string;
  };
}

export function Sidebar({
  isOpen,
  onClose,
  onLogout,
  conversations,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  user
}: SidebarProps) {
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);

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
            onClick={onNewConversation}
            className="w-full bg-[var(--text-primary)] text-[var(--dark-primary)] hover:bg-[var(--text-secondary)]"
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    currentConversationId === conversation.id
                      ? 'bg-[var(--dark-accent)] text-[var(--text-primary)] border-[var(--text-primary)] border-opacity-30'
                      : 'hover:bg-[var(--dark-accent)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:border-opacity-20 border-[var(--border)] border-opacity-50'
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                  data-testid={`conversation-${conversation.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {conversation.title || 'New Conversation'}
                      </h3>
                      <p className="text-xs opacity-80 mt-1 font-medium">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {hoveredConversation === conversation.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        data-testid={`delete-conversation-${conversation.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
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