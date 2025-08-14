import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "./logo";
import { CustomizeModal } from "./customize-modal";
import { Sidebar } from "./sidebar";
import { useWebSocket } from "../hooks/use-websocket";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/use-speech";
import { ChatMessage, ChatPreset, AVAILABLE_MODELS, AvailableModel, WebSocketMessage } from "../types/chat";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Menu,
  Bell,
  Mic,
  Image,
  Camera,
  Edit,
  FileText,
  Settings,
  Paperclip,
  Undo,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  MicOff,
  Zap,
  Code2 as Code,
  Edit3 as PenTool,
  Search,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Brain
} from "lucide-react";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>("forus-prime");
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask'>('ask');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Array<{id: string; title: string; createdAt: Date}>>([]);
  const [user, setUser] = useState<{email: string; username: string; displayName?: string | null} | null>(null);
  const [input, setInput] = useState("");

  // Conversation starters
  const conversationStarters = [
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: "Explain complex topics",
      description: "Break down difficult concepts",
      prompt: "Explain quantum computing in simple terms"
    },
    {
      icon: <Code className="w-6 h-6 text-green-500" />,
      title: "Code assistance",
      description: "Help with programming",
      prompt: "Help me write a Python function to sort a list"
    },
    {
      icon: <PenTool className="w-6 h-6 text-purple-500" />,
      title: "Creative writing",
      description: "Stories and content",
      prompt: "Write a short story about time travel"
    },
    {
      icon: <Search className="w-6 h-6 text-orange-500" />,
      title: "Research & analysis",
      description: "Deep dive into topics",
      prompt: "Analyze the benefits of renewable energy"
    },
    {
      icon: <Target className="w-6 h-6 text-red-500" />,
      title: "Problem solving",
      description: "Work through challenges",
      prompt: "Help me plan a productive daily routine"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
      title: "Learning & education",
      description: "Expand knowledge",
      prompt: "Teach me about machine learning basics"
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />,
      title: "Creative ideas",
      description: "Brainstorm solutions",
      prompt: "Give me 5 creative business ideas for 2025"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-teal-500" />,
      title: "Strategy & planning",
      description: "Strategic thinking",
      prompt: "Help me create a marketing strategy"
    },
    {
      icon: <Brain className="w-6 h-6 text-pink-500" />,
      title: "Critical thinking",
      description: "Analyze and reason",
      prompt: "What are the pros and cons of remote work?"
    }
  ];

  const handleStarterClick = (prompt: string) => {
    setInputValue(prompt);
    // Auto-focus the input field
    setTimeout(() => {
      const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Load user data and conversations
  useEffect(() => {
    const loadUserAndConversations = async () => {
      try {
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Load conversations after user is loaded
          const conversationsResponse = await fetch('/api/conversations');
          if (conversationsResponse.ok) {
            const conversationsData = await conversationsResponse.json();
            setConversations(conversationsData.map((conv: any) => ({
              ...conv,
              createdAt: new Date(conv.createdAt)
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load user and conversations:', error);
      }
    };
    loadUserAndConversations();
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Connected to chat server');
      // Join conversation if we have one
      if (currentConversationId && user) {
        sendWsMessage({
          type: 'join_conversation',
          conversationId: currentConversationId,
          userId: user.email, // Use email as user identifier since that's what we have
        });
      }
    },
    onDisconnect: () => console.log('Disconnected from chat server'),
  });

  // Speech recognition
  const { isListening, toggleListening, isSupported: speechSupported } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev + transcript + ' ');
    },
    onError: (error) => console.error('Speech recognition error:', error),
  });

  // Text-to-speech
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  function handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'message':
        if (message.message) {
          setMessages(prev => [...prev, message.message!]);
          setIsTyping(false);
        }
        break;
      case 'typing':
        setIsTyping(message.isTyping || false);
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        setIsTyping(false);
        break;
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          isPrivate: isPrivateMode,
          preset: currentPreset,
          customInstructions,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        setCurrentConversationId(conversation.id);
        return conversation.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content) return;

    // Create conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Try WebSocket first, if that fails, use direct API call
    if (isConnected) {
      console.log('Sending via WebSocket...');
      sendWsMessage({
        type: 'send_message',
        conversationId,
        content,
        userId: user?.email,
      });
    } else {
      console.log('WebSocket not connected, using direct API...');
      await handleDirectApiCall(content, conversationId);
    }
  };

  const handleDirectApiCall = async (content: string, conversationId: string) => {
    try {
      console.log('Making direct API call...');
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: conversationId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI response received:', result);
        
        // Add AI response message
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: result.response,
          createdAt: new Date(),
          metadata: result.metadata,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('API call failed:', response.statusText);
        const error = await response.json();
        console.error('Error details:', error);
      }
    } catch (error) {
      console.error('Direct API call error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const handleCustomizeSave = (preset: ChatPreset, instructions: string, enabled: boolean, selectedModel?: any) => {
    setCurrentPreset(preset);
    setCustomInstructions(instructions);
    // Store selected model
    if (selectedModel) {
      setSelectedModel(selectedModel);
      localStorage.setItem('selectedModel', selectedModel);
    }
    // TODO: Save to conversation settings
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Conversation',
          preset: currentPreset,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        setCurrentConversationId(newConversation.id);
        setMessages([]);
        setConversations(prev => [newConversation, ...prev]);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleConversationSelect = (id: string) => {
    setCurrentConversationId(id);
    // Load messages for this conversation
    loadConversationMessages(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onShowAuth();
    } catch (error) {
      console.error('Logout failed:', error);
      onShowAuth();
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        conversations={conversations}
        currentConversationId={currentConversationId || undefined}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        user={user || undefined}
      />
      {/* Header */}
      <header className="bg-card border-b border-border p-3 sm:p-4 flex items-center justify-between rounded-b-3xl shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
            data-testid="button-menu"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Logo size="sm" />
          <span className="font-semibold text-foreground text-sm sm:text-base">Forus Heavy API</span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant={activeTab === 'ask' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ask')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'ask' ? 'bg-secondary' : ''}`}
            data-testid="tab-ask"
          >
            Ask
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
            data-testid="button-notifications"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 max-w-4xl mx-auto">
            <Logo size="xl" className="mb-6" />
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              {user?.displayName ? `Welcome back, ${user.displayName}!` : 'Welcome to Forus Heavy API'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">Forus from Planet M</p>
            
            {/* Conversation Starters */}
            <div className="w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4 text-foreground">💡 Try asking me about:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {conversationStarters.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(starter.prompt)}
                    className="group p-4 bg-card border border-border rounded-xl text-left hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">{starter.icon}</div>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-accent-foreground">{starter.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{starter.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${message.id}`}
              >
                {message.role === 'user' ? (
                  <div className="bg-card rounded-3xl px-4 py-3 max-w-xs lg:max-w-md chat-bubble shadow-sm border border-border">
                    <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({src, alt}) => (
                            <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-2" />
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3 max-w-4xl">
                    <Logo size="sm" className="flex-shrink-0 mt-1" />
                    <div className="bg-card rounded-3xl px-4 py-3 flex-1 chat-bubble shadow-sm border border-border">
                      <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({src, alt}) => (
                              <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-2" />
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-xl"
                            onClick={() => handleCopyMessage(message.content)}
                            data-testid={`button-copy-${message.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-xl"
                            data-testid={`button-like-${message.id}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-xl"
                            data-testid={`button-dislike-${message.id}`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-xl"
                            onClick={() => handleSpeakMessage(message.content)}
                            data-testid={`button-speak-${message.id}`}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Via OpenRouter
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start" data-testid="typing-indicator">
                <div className="flex space-x-3">
                  <Logo size="sm" className="flex-shrink-0 mt-1" />
                  <div className="bg-card rounded-3xl px-4 py-3 border border-border">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Tool Buttons - Separate Section */}
      <div className="bg-card macos-function-bar rounded-3xl mx-3 sm:mx-4 mb-1 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-6">
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={toggleListening}
            disabled={!speechSupported}
            data-testid="button-voice-mode"
          >
            {isListening ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
            <span className="text-xs hidden sm:block">Voice Mode</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            data-testid="button-create-images"
          >
            <Image className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Create Images</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            data-testid="button-open-camera"
          >
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Open Camera</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            data-testid="button-edit-image"
          >
            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Edit Image</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            data-testid="button-analyze-docs"
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Analyze Docs</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={() => {
              // Create macOS app opening line animation
              const line = document.createElement('div');
              line.className = 'macos-app-line';
              document.body.appendChild(line);
              
              // Remove line after animation
              setTimeout(() => {
                document.body.removeChild(line);
              }, 800);
              
              // Show dialog with delay for authentic macOS timing
              setTimeout(() => {
                setIsCustomizeModalOpen(true);
                // Add opening class to dialog content
                setTimeout(() => {
                  const dialog = document.querySelector('.macos-dialog-content');
                  if (dialog) dialog.classList.add('opening');
                }, 50);
              }, 600);
            }}
            data-testid="button-customize"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Customize Forus</span>
          </Button>
        </div>
      </div>
        
      {/* Message Input - Separate Section */}
      <div className="bg-card p-3 sm:p-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="message-input w-full min-h-[80px] max-h-[200px] bg-background rounded-3xl pb-12 pr-16 sm:pb-16 sm:pr-20 text-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none border-0"
            data-testid="input-message"
            style={{
              paddingRight: '64px'
            }}
          />
          
          {/* Custom Placeholder */}
          {!inputValue && (
            <div 
              className="absolute font-medium text-muted-foreground pointer-events-none"
              style={{
                top: '8px',
                left: '16px',
                lineHeight: '27px',
                fontSize: '18px',
                letterSpacing: '0px',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              Ask Anything
            </div>
          )}
          
          <div className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 flex items-end space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="macos-button text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
              data-testid="button-attach-file"
            >
              <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`macos-button ${isListening ? 'text-green-400' : 'text-muted-foreground'} hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl`}
              onClick={toggleListening}
              disabled={!speechSupported}
              data-testid="button-voice-input"
            >
              {isListening ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="macos-button text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl hidden sm:flex"
              data-testid="button-undo"
            >
              <Undo className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="macos-button text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl hidden sm:flex"
              data-testid="button-ideas"
            >
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="macos-button bg-black hover:bg-gray-800 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              data-testid="button-send-message"
            >
              <span className="text-white text-sm sm:text-base">➤</span>
            </Button>
          </div>
        </div>
        
        {/* Voice Input Indicator */}
        {isListening && (
          <div className="mt-2 text-center" data-testid="voice-listening-indicator">
            <div className="inline-flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full voice-pulse"></div>
              <span className="text-sm">Listening<span className="loading-dots"></span></span>
            </div>
          </div>
        )}
        

      </div>
      


      {/* Customize Modal */}
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentPreset={currentPreset}
        customInstructions={customInstructions}
        onSave={handleCustomizeSave}
      />
    </div>
  );
}
