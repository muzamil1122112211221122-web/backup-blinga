import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "./logo";
import { useTheme } from "./theme-provider";

// Generate vibrant colors based on user info (matching sidebar colors)
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
import { CustomizeModal } from "./customize-modal";
import { ImageGenerationDialog } from "./image-generation-dialog";
import { EducationModal } from "./education-modal";
import { VoiceModeModal } from "./voice-mode-modal";
import { LuminNotification } from "./lumin-notification";
import { Sidebar } from "./sidebar";
import { useWebSocket } from "../hooks/use-websocket";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/use-speech";
import { ChatMessage, ChatPreset, AVAILABLE_MODELS, MODEL_OPTIONS, AvailableModel, WebSocketMessage } from "../types/chat";
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
  RefreshCw,
  MicOff,
  Zap,
  Code2 as Code,
  Edit3 as PenTool,
  Search,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Brain,
  Hammer,
  X,
  Radio,
  GraduationCap,
  Moon,
  Sun,
  ToggleLeft,
  Square
} from "lucide-react";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>("forus-prime");
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask' | 'lumin'>('ask');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{id: string; title: string; createdAt: Date}>>([]);
  const [user, setUser] = useState<{email: string; username: string; displayName?: string | null} | null>(null);
  const [input, setInput] = useState("");
  const [forusIntegrationMode, setForusIntegrationMode] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set());
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [educationMode, setEducationMode] = useState<"examination" | "self-listen" | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{file: File, preview: string} | null>(null);
  // Multi-AI states for Lumin tab
  const [luminMessages, setLuminMessages] = useState<{[model: string]: ChatMessage[]}>({});
  const [activeAIModels, setActiveAIModels] = useState<Set<string>>(new Set(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro']));
  const [luminIsTyping, setLuminIsTyping] = useState<{[model: string]: boolean}>({});
  const [showLuminNotification, setShowLuminNotification] = useState(true);
  const [isVoiceModeModalOpen, setIsVoiceModeModalOpen] = useState(false);

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
      icon: <PenTool className="w-6 h-6 text-blue-500" />,
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

  // Load user data and conversations - optimized for faster loading
  useEffect(() => {
    const loadUserAndConversations = async () => {
      try {
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Load projects in background without blocking UI
          setTimeout(async () => {
            try {
              await loadProjects();
              
              // Restore last project if any exist
              const savedProjectId = localStorage.getItem('currentProjectId');
              if (savedProjectId) {
                setCurrentProjectId(savedProjectId);
                await loadProjectMessages(savedProjectId);
              }
            } catch (error) {
              console.warn('Failed to load projects:', error);
            }
          }, 200);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUserAndConversations();
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // WebSocket connection - lazy load to improve initial performance
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      // Join conversation if we have one
      if (currentProjectId && user) {
        sendWsMessage({
          type: 'join_conversation',
          conversationId: currentProjectId,
          userId: user.email,
        });
      }
    },
    onDisconnect: () => {},
  });

  // Speech recognition - simplified for better performance
  const { isListening, toggleListening, isSupported: speechSupported } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev + transcript + ' ');
    },
    onError: () => {},
  });

  // Text-to-speech
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  // Global completed texts cache - shared across all components
  const globalCompletedTexts = useRef<Map<string, string>>(new Map());
  
  // Typing animation hook - BULLETPROOF against re-renders
  const useTypingAnimation = (text: string, messageId: string, speed: number = 20) => {
    // Create a unique key for this specific message
    const cacheKey = `${messageId}-${text}`;
    
    // Initialize state only once based on cache
    const [state] = useState(() => {
      const cached = globalCompletedTexts.current.get(cacheKey);
      if (cached) {
        return {
          displayedText: text,
          isTypingComplete: true
        };
      }
      return {
        displayedText: '',
        isTypingComplete: false
      };
    });
    
    const [displayedText, setDisplayedText] = useState(state.displayedText);
    const [isTypingComplete, setIsTypingComplete] = useState(state.isTypingComplete);
    const hasInitialized = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
      // If already completed, don't animate
      if (globalCompletedTexts.current.has(cacheKey)) {
        setDisplayedText(text);
        setIsTypingComplete(true);
        return;
      }
      
      // Only run animation once per unique message
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;
      
      if (!text) {
        setDisplayedText('');
        setIsTypingComplete(true);
        return;
      }
      
      // Start animation
      setIsTypingComplete(false);
      setDisplayedText('');
      
      const words = text.split(' ').filter(word => word.trim());
      let currentIndex = 0;
      
      const typeWords = () => {
        if (currentIndex < words.length) {
          const currentWords = words.slice(0, currentIndex + 1);
          setDisplayedText(currentWords.join(' '));
          currentIndex++;
          timeoutRef.current = setTimeout(typeWords, speed);
        } else {
          // Animation completed - cache it forever
          setIsTypingComplete(true);
          globalCompletedTexts.current.set(cacheKey, text);
        }
      };
      
      // Start typing
      timeoutRef.current = setTimeout(typeWords, 50);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, []); // Empty dependency array - never re-run
    
    return { displayedText, isTypingComplete };
  };

  // Typing Text Component - Completely isolated from parent re-renders
  const TypingText = ({ text, messageId }: { text: string; messageId: string }) => {
    const { displayedText, isTypingComplete } = useTypingAnimation(text, messageId, 10);

    return (
      <div className="text-foreground prose prose-sm max-w-none dark:prose-invert relative">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({src, alt}) => (
              <img 
                src={src} 
                alt={alt || "Generated image"} 
                className="max-w-full h-auto rounded-lg my-2 shadow-sm border border-border" 
                onError={(e) => {
                  console.error('Image failed to load:', src);
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                }}
                onLoad={() => {
                  console.log('Image loaded successfully in chat:', src);
                }}
              />
            )
          }}
        >
          {displayedText}
        </ReactMarkdown>
        {!isTypingComplete && <span className="inline-block animate-pulse text-foreground">|</span>}
      </div>
    );
  };

  function handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'message':
        if (message.message) {
          setMessages(prev => [...prev, message.message!]);
          setIsTyping(false);
          
          // Auto-speak AI responses in voice-to-voice mode
          if (isVoiceToVoiceMode && message.message.role === 'assistant') {
            // Clean the content for speech by removing markdown and special characters
            const cleanedContent = message.message.content
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
              .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
              .replace(/`(.*?)`/g, '$1') // Remove code blocks
              .replace(/#{1,6}\s/g, '') // Remove headers
              .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
              .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            if (cleanedContent) {
              speak(cleanedContent);
            }
          }
        }
        break;
      case 'typing':
        setIsTyping(message.isTyping || false);
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        setIsTyping(false);
        // Show error to user
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId: currentProjectId || '',
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          createdAt: new Date(),
        }]);
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

  // Hide/show background animation during AI thinking
  useEffect(() => {
    if (isTyping) {
      document.body.classList.add('ai-thinking');
    } else {
      document.body.classList.remove('ai-thinking');
    }
    
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('ai-thinking');
    };
  }, [isTyping]);

  const createNewProject = async (firstMessage?: string) => {
    try {
      const projectTitle = firstMessage 
        ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Project';
        
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          isPrivate: isPrivateMode,
          preset: currentPreset,
          customInstructions,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        setCurrentProjectId(project.id);
        localStorage.setItem('currentProjectId', project.id);
        // Refresh projects list
        loadProjects();
        return project.id;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content && !attachedImage) return;

    // Handle Lumin multi-AI mode
    if (activeTab === 'lumin' && activeAIModels.size > 0) {
      return await handleLuminSendMessage(content);
    }

    // Create conversation if needed
    let conversationId = currentProjectId;
    if (!conversationId) {
      conversationId = await createNewProject(content);
      if (!conversationId) return;
    }

    // Add user message immediately (with image if attached)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      role: 'user',
      content: content || (attachedImage ? "What's in this image?" : ""),
      createdAt: new Date(),
      imageUrl: attachedImage?.preview
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // If there's an attached image, handle it with Gemini analysis
    if (attachedImage) {
      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: attachedImage.preview,
            prompt: content || "Analyze this image in detail. What do you see?"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              conversationId,
              content: result.analysis,
              role: "assistant",
              createdAt: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          } else {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              conversationId,
              role: 'assistant',
              content: `Sorry, I couldn't analyze the image: ${result.message || 'Unknown error'}`,
              createdAt: new Date(),
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            conversationId,
            role: 'assistant',
            content: 'Sorry, I encountered an error analyzing the image. Please try again.',
            createdAt: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Image analysis error:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your image. Please try again.',
          createdAt: new Date(),
        }]);
      }
      
      // Clear attached image and typing indicator
      setAttachedImage(null);
      setIsTyping(false);
      return;
    }

    // Modify content if Forus Integration mode is enabled
    const enhancedContent = forusIntegrationMode 
      ? `${content}\n\n[Please provide the most comprehensive, detailed, and longest possible answer to this question. Include examples, explanations, and any relevant background information.]`
      : content;

    // Always use direct API call for better reliability
    console.log('Using direct API call for better reliability...');
    await handleDirectApiCall(enhancedContent, conversationId);
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
        
        // Auto-speak AI responses in voice-to-voice mode
        if (isVoiceToVoiceMode) {
          // Clean the content for speech by removing markdown and special characters
          const cleanedContent = result.response
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/`(.*?)`/g, '$1') // Remove code blocks
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
            .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          if (cleanedContent) {
            speak(cleanedContent);
          }
        }
        
        // Refresh conversations list to show updated conversation
        loadProjects();
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

  // Handle Lumin multi-AI message sending
  const handleLuminSendMessage = async (content: string) => {
    if (!content || activeAIModels.size === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: currentProjectId || 'lumin-session',
      role: 'user' as const,
      content,
      createdAt: new Date()
    };

    // Add user message to all active AI models
    const newLuminMessages = { ...luminMessages };
    Array.from(activeAIModels).forEach(model => {
      if (!newLuminMessages[model]) {
        newLuminMessages[model] = [];
      }
      newLuminMessages[model].push(userMessage);
    });
    setLuminMessages(newLuminMessages);
    setInputValue("");

    // Set all active models as typing
    const newTypingState = { ...luminIsTyping };
    Array.from(activeAIModels).forEach(model => {
      newTypingState[model] = true;
    });
    setLuminIsTyping(newTypingState);

    // Check for image generation requests for ChatGPT and Gemini models
    const imageKeywords = ['generate image', 'create image', 'make image', 'draw', 'generate picture', 'create picture', 'make picture', 'image of', 'picture of', 'show me', 'create a visual', 'generate visual', 'illustrate'];
    const isImageRequest = imageKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
    
    const imageCapableModels = Array.from(activeAIModels).filter(model => 
      model === 'gpt-4o' || model === 'gemini-pro'
    );

    // Send requests to all active AI models with proper error handling
    const promises = Array.from(activeAIModels).map(async (model) => {
      try {
        // Handle image generation for ChatGPT and Gemini
        if (isImageRequest && imageCapableModels.includes(model as 'gpt-4o' | 'gemini-pro')) {
          try {
            console.log(`${model === 'gpt-4o' ? 'ChatGPT' : 'Gemini'} generating image for: "${content}"`);
            const imageResponse = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: content,
                size: "1024x1024",
                quality: "standard"
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              if (imageData.success && imageData.url) {
                const imageMessage: ChatMessage = {
                  id: Date.now().toString() + '-' + model + '-image',
                  conversationId: currentProjectId || 'lumin-session',
                  role: 'assistant' as const,
                  content: `I've generated an image for you:\n\n![Generated Image](${imageData.url})\n\n*Generated using ${model === 'gpt-4o' ? 'ChatGPT' : 'Gemini'} + ${imageData.revisedPrompt ? 'Gemini Vision API' : 'OpenAI DALL-E'}*`,
                  createdAt: new Date()
                };

                setLuminMessages(prev => ({
                  ...prev,
                  [model]: [...(prev[model] || []), imageMessage]
                }));

                setLuminIsTyping(prev => ({
                  ...prev,
                  [model]: false
                }));
                return;
              }
            }
          } catch (imageError) {
            console.error(`Image generation failed for ${model}:`, imageError);
          }
        }

        // Use model-specific endpoints for authentic responses
        let endpoint = '/api/test-ai';
        let requestBody: any = {
          message: content,
          model: model,
          conversationId: currentProjectId || 'lumin-session'
        };
        
        // Route to specific AI services for authentic responses
        switch(model) {
          case 'gpt-4o':
            // Use OpenAI directly for ChatGPT
            requestBody.provider = 'openai';
            requestBody.model = 'gpt-4o';
            break;
          case 'claude-3.5-sonnet':
            // Use Anthropic via OpenRouter for Claude
            requestBody.provider = 'openrouter';
            requestBody.model = 'anthropic/claude-3.5-sonnet';
            break;
          case 'gemini-pro':
            // Use Google Gemini directly
            requestBody.provider = 'gemini';
            requestBody.model = 'gemini-pro';
            break;
          case 'perplexity':
            // Use Perplexity via OpenRouter
            requestBody.provider = 'openrouter';
            requestBody.model = 'perplexity/llama-3.1-sonar-large-128k-online';
            break;
          case 'grok-4':
            // Use xAI Grok via OpenRouter
            requestBody.provider = 'openrouter';
            requestBody.model = 'x-ai/grok-2-1212';
            break;
          case 'deepseek-r1':
            // Use DeepSeek R1 via OpenRouter
            requestBody.provider = 'openrouter';
            requestBody.model = 'deepseek/deepseek-r1';
            break;
          default:
            // Fallback to Groq
            requestBody.provider = 'groq';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const aiMessage: ChatMessage = {
              id: Date.now().toString() + '-' + model,
              conversationId: currentProjectId || 'lumin-session',
              role: 'assistant' as const,
              content: data.response || data.message || 'No response received',
              createdAt: new Date()
            };

            setLuminMessages(prev => ({
              ...prev,
              [model]: [...(prev[model] || []), aiMessage]
            }));
          } else {
            const errorMessage: ChatMessage = {
              id: Date.now().toString() + '-' + model + '-error',
              conversationId: currentProjectId || 'lumin-session',
              role: 'assistant' as const,
              content: data.message || 'AI service temporarily unavailable',
              createdAt: new Date()
            };

            setLuminMessages(prev => ({
              ...prev,
              [model]: [...(prev[model] || []), errorMessage]
            }));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage: ChatMessage = {
            id: Date.now().toString() + '-' + model + '-error',
            conversationId: currentProjectId || 'lumin-session',
            role: 'assistant' as const,
            content: errorData.message || `API error (${response.status}). Please try again.`,
            createdAt: new Date()
          };

          setLuminMessages(prev => ({
            ...prev,
            [model]: [...(prev[model] || []), errorMessage]
          }));
        }
      } catch (error) {
        console.error(`Connection error with ${model}:`, error);
        const errorMessage: ChatMessage = {
          id: Date.now().toString() + '-' + model + '-error',
          conversationId: currentProjectId || 'lumin-session',
          role: 'assistant' as const,
          content: 'Network connection error. Check your internet and try again.',
          createdAt: new Date()
        };

        setLuminMessages(prev => ({
          ...prev,
          [model]: [...(prev[model] || []), errorMessage]
        }));
      } finally {
        setLuminIsTyping(prev => ({
          ...prev,
          [model]: false
        }));
      }
    });

    await Promise.all(promises);
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    // Auto-clear the copied state
    setTimeout(() => setCopiedMessageId(null), 1200);
  };

  const handleLikeMessage = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        // Clear dislike immediately for this message
        setDislikedMessages(current => {
          const newDisliked = new Set(current);
          newDisliked.delete(messageId);
          return newDisliked;
        });
        // Auto-clear like after 3 seconds to prevent stuck colors
        setTimeout(() => {
          setLikedMessages(current => {
            const updated = new Set(current);
            updated.delete(messageId);
            return updated;
          });
        }, 3000);
      }
      return newSet;
    });
  };

  const handleDislikeMessage = (messageId: string) => {
    setDislikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        // Clear like immediately for this message
        setLikedMessages(current => {
          const newLiked = new Set(current);
          newLiked.delete(messageId);
          return newLiked;
        });
        // Auto-clear dislike after 3 seconds to prevent stuck colors
        setTimeout(() => {
          setDislikedMessages(current => {
            const updated = new Set(current);
            updated.delete(messageId);
            return updated;
          });
        }, 3000);
      }
      return newSet;
    });
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the user message that preceded this AI response
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i];
        break;
      }
    }
    
    if (!userMessage || !currentProjectId) return;
    
    setRetryingMessageId(messageId);
    
    try {
      console.log('Retrying AI response for:', userMessage.content);
      
      // Remove the failed AI message
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setIsTyping(true);
      
      // Make new API call
      await handleDirectApiCall(userMessage.content, currentProjectId);
      
    } catch (error) {
      console.error('Retry failed:', error);
      showToast('Failed to retry. Please try again.');
    } finally {
      setRetryingMessageId(null);
      setIsTyping(false);
    }
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // Handle image files with AI analysis
      if (file.type.startsWith('image/')) {
        await handleImageAnalysis(file);
      } else {
        showToast(`File "${file.name}" selected. Non-image files will be supported soon.`);
      }
    }
    event.target.value = '';
    setIsAttachmentDialogOpen(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Image selected:', file.name, file.type, file.size);
      if (file.type.startsWith('image/')) {
        // Create preview like ChatGPT
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setAttachedImage({ file, preview });
        showToast(`Image "${file.name}" ready to send with your message`);
      } else {
        showToast('Please select an image file.');
      }
    }
    event.target.value = '';
    setIsAttachmentDialogOpen(false);
  };

  // New function to handle image analysis (ChatGPT/Gemini-like multimodal input)
  const handleImageAnalysis = async (file: File) => {
    try {
      showToast(`Analyzing image "${file.name}"... Please wait.`);
      
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Create user message with image
      const imageMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: currentProjectId || '',
        content: `[Image uploaded: ${file.name}]`,
        role: "user",
        createdAt: new Date(),
        imageUrl: base64
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Send to AI for analysis
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          prompt: "Describe this image in detail. What do you see?"
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Create AI response message
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversationId: currentProjectId || '',
            content: result.analysis,
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          showToast('Image analyzed successfully!');
        } else {
          showToast(`Image analysis failed: ${result.message}`);
        }
      } else {
        showToast('Failed to analyze image. Please try again.');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      showToast('Error analyzing image. Please try again.');
    }
  };

  const handleCreateImageFromFunctionBar = () => {
    console.log('Create Images from function bar triggered');
    setIsImageGenerationDialogOpen(true);
  };

  const handleOpenCameraFromFunctionBar = () => {
    console.log('Open Camera from function bar triggered');
    
    // Try to access camera with better implementation
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
        .then(stream => {
          showToast('Camera access granted! Full camera interface will open soon.');
          
          // For now, stop the stream but show success
          stream.getTracks().forEach(track => track.stop());
          
          // Add a message to indicate camera functionality
          const cameraMessage: ChatMessage = {
            id: Date.now().toString(),
            conversationId: currentProjectId || '',
            content: "Camera access granted! I can help you work with images from your camera. Try taking a photo and uploading it through the attachment button.",
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, cameraMessage]);
        })
        .catch(error => {
          console.error('Camera access error:', error);
          
          if (error.name === 'NotAllowedError') {
            showToast('Camera access denied. Please allow camera permissions in your browser settings.');
          } else if (error.name === 'NotFoundError') {
            showToast('No camera found on this device.');
          } else {
            showToast('Camera not available. You can still upload images using the attachment button.');
          }
          
          // Fallback to file input
          imageInputRef.current?.click();
        });
    } else {
      showToast('Camera API not supported in this browser. Using file upload instead.');
      imageInputRef.current?.click();
    }
  };

  // Adjust Forus function - enhances AI responses with additional prompting
  const adjustForus = useCallback(() => {
    const newMode = !forusIntegrationMode;
    setForusIntegrationMode(newMode);
    console.log('Adjust Forus function called - Forus Integration Answer mode:', newMode ? 'enabled' : 'disabled');
    
    // Show user feedback
    if (typeof window !== 'undefined') {
      const message = newMode 
        ? 'Forus Integration Answer mode enabled - AI will provide more detailed responses'
        : 'Forus Integration Answer mode disabled';
      
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }
  }, [forusIntegrationMode]);

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

  const handleNewProject = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Project',
          preset: currentPreset,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setCurrentProjectId(newProject.id);
        localStorage.setItem('currentProjectId', newProject.id);
        setMessages([]);
        setProjects(prev => [newProject, ...prev]);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleProjectSelect = async (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
    // Load messages for this project
    await loadProjectMessages(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(project => project.id !== id));
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          localStorage.removeItem('currentProjectId');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleEditProject = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, title: newTitle } : project
        ));
      }
    } catch (error) {
      console.error('Failed to edit project:', error);
    }
  };

  const handleUpdateAiRole = async (id: string, aiRole: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiRole }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, aiRole } : project
        ));
        console.log('AI role updated successfully for project:', id);
      }
    } catch (error) {
      console.error('Failed to update AI role:', error);
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

  // Education modal handlers
  const handleStartExamination = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("examination");
    
    // Create a new conversation for examination
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Examination - ${data.class} (${data.school})`,
        preset: 'forus-education',
        model: 'forus-education',
      }),
    });
    
    if (response.ok) {
      const newConversation = await response.json();
      setCurrentProjectId(newConversation.id);
      setSelectedModel('forus-education');
      setCurrentPreset('forus-education');
      
      // Start examination process - send message directly
      const examMessage = `I want to take an examination. Here are my details:
- Class: ${data.class}
- School: ${data.school}
- City: ${data.city}, ${data.country}
- Education System: ${data.educationSystem}
- Uploaded ${data.uploadedPages?.length || 0} pages for examination

Please create a comprehensive test based on my school's examination style and the uploaded materials. After I complete the test, provide detailed feedback with marks and corrections.`;
      
      await handleSendMessageDirect(examMessage);
    }
  };

  // Direct message sending function
  const handleSendMessageDirect = async (messageContent: string) => {
    if (!messageContent.trim() || !currentProjectId) return;

    // Set the input value and trigger the regular send message function
    setInputValue(messageContent.trim());
    
    // Use setTimeout to ensure state is updated before sending
    setTimeout(async () => {
      await handleSendMessage();
    }, 50);
  };

  // Super fast AI enhancement 
  const handleEnhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;
    
    const originalValue = inputValue.trim();
    setIsEnhancing(true);
    
    // Show instant grammar fixes first
    let quickFixed = originalValue
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/g, 'I\'m')
      .replace(/\bdont\b/g, 'don\'t')
      .replace(/\bcant\b/g, 'can\'t')
      .replace(/^./, c => c.toUpperCase());
    
    setInputValue(quickFixed);
    
    // Fire AI enhancement without waiting (async)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt: originalValue }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInputValue(data.enhancedPrompt);
      }
    } catch (error) {
      console.log('Using quick fix fallback');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleStartSelfListen = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("self-listen");
    
    // Create a new conversation for self-listen
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Self Listen - ${data.heading}`,
        preset: 'forus-education',
        model: 'forus-education',
      }),
    });
    
    if (response.ok) {
      const newConversation = await response.json();
      setCurrentProjectId(newConversation.id);
      setSelectedModel('forus-education');
      setCurrentPreset('forus-education');
      
      // Start self-listen session
      const listenMessage = `I want to practice speaking about "${data.heading}". I have uploaded ${data.uploadedImages?.length || 0} related images. 

Please:
1. Ask me to explain the topic verbally
2. Listen to my explanation through voice input
3. Provide constructive feedback on my understanding
4. Correct any mistakes and suggest improvements
5. Help me learn better through interactive discussion

Let's start the self-listen session!`;
      
      await handleSendMessageDirect(listenMessage);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const projectsData = await response.json();
        const projectsWithDates = projectsData.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        setProjects(projectsWithDates);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectMessages = async (projectId: string) => {
    try {
      const response = await fetch(`/api/conversations/${projectId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        const messagesWithDates = messagesData.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load project messages:', error);
      setMessages([]);
    }
  };



  // Check if any Lumin model is typing for thinking animation
  const isAnyLuminModelTyping = Object.values(luminIsTyping).some(typing => typing);

  return (
    <div className={`min-h-screen flex flex-col bg-background relative ${(isTyping || isAnyLuminModelTyping) ? 'ai-thinking' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentProjectId || undefined}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleEditProject}
        onUpdateAiRole={handleUpdateAiRole}
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
            variant={activeTab === 'lumin' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('lumin')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'lumin' ? 'bg-secondary' : ''}`}
            data-testid="tab-lumin"
          >
            <Brain className="h-3 w-3 mr-1" />
            Lumin(Coders & Content Creator Heaven)
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative text-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-yellow-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 border border-border hover:shadow-lg transition-all duration-300"
            data-testid="button-theme-toggle"
          >
            <div className="relative">
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-600" />
              )}
            </div>
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
        {activeTab === 'ask' ? (
          messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 max-w-4xl mx-auto">
            <Logo size="xl" className="mb-6" />
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              {user?.displayName ? `Welcome back, ${user.displayName}!` : 'Welcome to Forus Heavy API'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">Forus from Planet M</p>
            
            {/* Conversation Starters */}
            <div className="w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4 text-foreground">💡 Ask me about anything for example:</h3>
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
                    {/* Display uploaded image if present */}
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded image" 
                          className="max-w-full h-auto rounded-lg shadow-sm border border-border" 
                          onError={(e) => {
                            console.error('Uploaded image failed to load:', message.imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                          }}
                          onLoad={() => {
                            console.log('Uploaded image loaded successfully:', message.imageUrl);
                          }}
                        />
                      </div>
                    )}
                    <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({src, alt}) => (
                            <img 
                              src={src} 
                              alt={alt || "Generated image"} 
                              className="max-w-full h-auto rounded-lg my-2 shadow-sm border border-border" 
                              onError={(e) => {
                                console.error('Image failed to load:', src);
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully in chat:', src);
                              }}
                            />
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* User Message Action Buttons */}
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                            copiedMessageId === message.id 
                              ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          data-testid={`button-copy-user-${message.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                          onClick={() => {
                            // Fill input with user message content for re-editing
                            setInputValue(message.content);
                            // Focus the input
                            setTimeout(() => {
                              const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
                              if (inputElement) {
                                inputElement.focus();
                                inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                              }
                            }, 100);
                          }}
                          data-testid={`button-redo-user-${message.id}`}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3 max-w-4xl">
                    <Logo size="sm" className="flex-shrink-0 mt-1" />
                    <div className="bg-card rounded-3xl px-4 py-3 flex-1 chat-bubble shadow-sm border border-border">
                      <TypingText text={message.content} messageId={message.id} />
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              copiedMessageId === message.id 
                                ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            data-testid={`button-copy-${message.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              likedMessages.has(message.id)
                                ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-950'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleLikeMessage(message.id)}
                            data-testid={`button-like-${message.id}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              dislikedMessages.has(message.id)
                                ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleDislikeMessage(message.id)}
                            data-testid={`button-dislike-${message.id}`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-200 ${
                              isSpeaking ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => handleSpeakMessage(message.content)}
                            data-testid={`button-speak-${message.id}`}
                          >
                            {isSpeaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-150 ${
                              retryingMessageId === message.id
                                ? 'text-blue-500 animate-spin'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleRetryMessage(message.id)}
                            disabled={retryingMessageId === message.id}
                            data-testid={`button-retry-${message.id}`}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>

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
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" style={{animation: 'pulse-dot 1.5s ease-in-out infinite'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )
        ) : (
          // Lumin Tab - Multi-AI Interface
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                <Brain className="h-6 w-6 mr-2" />
                Lumin - Multi-AI Paradise (Coders & Content Creator Heaven)
              </h2>
              
              {/* Premium AI Model Toggles with Authentic Logos */}
              <div className="flex flex-wrap gap-4 mb-8">
                {Object.entries({
                  'gpt-4o': { 
                    name: 'ChatGPT', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/chatgpt-logo.png" 
                          alt="ChatGPT" 
                          className="w-full h-full object-contain dark:filter dark:invert"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-green-400 to-blue-500' 
                  },
                  'claude-3.5-sonnet': { 
                    name: 'Claude', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/claude-logo.png" 
                          alt="Claude" 
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-orange-400 to-orange-600' 
                  }, 
                  'gemini-pro': { 
                    name: 'Gemini', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/gemini-logo.png" 
                          alt="Gemini" 
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-teal-400 to-emerald-500' 
                  },
                  'perplexity': { 
                    name: 'Perplexity', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/perplexity-logo.png" 
                          alt="Perplexity" 
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-sky-300 to-blue-400' 
                  },
                  'grok-4': { 
                    name: 'Grok 4', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/grok-logo.png" 
                          alt="Grok" 
                          className="w-full h-full object-contain filter brightness-0 dark:filter dark:brightness-0 dark:invert"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-gray-400 to-black' 
                  },
                  'deepseek-r1': { 
                    name: 'Deepseek V3', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/deepseek-logo.png" 
                          alt="Deepseek V3" 
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-blue-400 to-cyan-500' 
                  },
                  'forus-ai': { 
                    name: 'Forus AI', 
                    logo: (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img 
                          src="/forus-logo.png" 
                          alt="Forus AI" 
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ), 
                    gradient: 'from-purple-400 to-pink-500' 
                  }
                }).map(([model, config]) => (
                  <div key={model} className={`relative overflow-hidden bg-gradient-to-r ${config.gradient} p-[1px] rounded-2xl transition-all duration-300 ${
                    activeAIModels.has(model) ? 'shadow-lg scale-105' : 'hover:scale-102'
                  }`}>
                    <div className="bg-background dark:bg-background/95 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const newActive = new Set(activeAIModels);
                          if (newActive.has(model)) {
                            newActive.delete(model);
                          } else {
                            newActive.add(model);
                          }
                          setActiveAIModels(newActive);
                        }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          activeAIModels.has(model) 
                            ? `bg-gradient-to-r ${config.gradient} shadow-md` 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 absolute top-0.5 flex items-center justify-center ${
                          activeAIModels.has(model) ? 'translate-x-6' : 'translate-x-0.5'
                        }`}>
                          {activeAIModels.has(model) && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                        </div>
                      </button>
                      <div className="flex items-center space-x-3">
                        {config.logo}
                        <span className="text-sm font-semibold text-foreground">{config.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Multi-AI Responses - Horizontal Scrolling */}
              {Object.keys(luminMessages).length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{scrollbarWidth: 'thin'}}>
                    {Array.from(activeAIModels).map(model => {
                      const getModelConfig = (model: string) => {
                        switch(model) {
                          case 'gpt-4o': return { name: 'ChatGPT', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/chatgpt-logo.png" alt="ChatGPT" className="w-full h-full object-contain filter invert" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'claude-3.5-sonnet': return { name: 'Claude', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/claude-logo.png" alt="Claude" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'gemini-pro': return { name: 'Gemini', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/gemini-logo.png" alt="Gemini" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'perplexity': return { name: 'Perplexity', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/perplexity-logo.png" alt="Perplexity" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'grok-4': return { name: 'Grok 4', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/grok-logo.png" alt="Grok" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'deepseek-r1': return { name: 'Deepseek V3', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/deepseek-logo.png" alt="Deepseek V3" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'forus-ai': return { name: 'Forus AI', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/forus-logo.png" alt="Forus AI" className="w-full h-full object-contain rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          default: return { name: model, logo: <div className="w-6 h-6 rounded-lg bg-gray-500"></div> };
                        }
                      };
                      const config = getModelConfig(model);
                      return (
                        <div key={model} className="bg-card border border-border rounded-xl p-4 min-w-80 max-w-96 flex-shrink-0 snap-start">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {config.logo}
                              <h3 className="font-semibold text-foreground">{config.name}</h3>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              luminIsTyping[model] ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                            }`} />
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {(luminMessages[model] || []).map(message => (
                              <div key={message.id} className={`p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-secondary text-secondary-foreground ml-4' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                <div className="text-sm">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ))}
                            {luminIsTyping[model] && (
                              <div className="flex space-x-1 p-3">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Empty State for Lumin */}
              {Object.keys(luminMessages).length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Multi-AI Paradise Awaits
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select AI models above and start chatting to see responses from multiple AIs simultaneously
                  </p>
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                      Perfect for comparing different AI perspectives
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
                      Ideal for coders and content creators
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900/20 dark:to-yellow-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full animate-pulse"></div>
                      All premium models unlocked and ready to use
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Tool Buttons - Separate Section */}
      <div className="macos-function-bar bg-transparent rounded-3xl mx-3 sm:mx-4 mb-1 max-w-[50rem] mx-auto w-full !border-none !shadow-none" style={{width: 'fit-content', margin: '0 auto', marginBottom: '8px'}}>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:gap-7 p-3 sm:p-4 bg-transparent !border-none">
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-[#303030] border-none relative transition-all duration-300"
            style={{
              boxShadow: '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
            }}
            onClick={() => setIsVoiceModeModalOpen(true)}
            data-testid="button-voice-mode"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <div className="flex items-center justify-center space-x-0.5 h-5 w-5">
                <div className="w-0.5 h-1.5 bg-current rounded-full"></div>
                <div className="w-0.5 h-2.5 bg-current rounded-full"></div>
                <div className="w-0.5 h-4 bg-current rounded-full"></div>
                <div className="w-0.5 h-3 bg-current rounded-full"></div>
                <div className="w-0.5 h-1 bg-current rounded-full"></div>
              </div>
              <span className="text-[10px] sm:text-xs font-medium">Voice Mode</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-[#303030] border-none relative transition-all duration-300"
            style={{
              boxShadow: '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
            }}
            onClick={handleCreateImageFromFunctionBar}
            data-testid="button-create-images"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Image className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Create Images</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-[#303030] border-none relative transition-all duration-300"
            style={{
              boxShadow: '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
            }}
            onClick={handleOpenCameraFromFunctionBar}
            data-testid="button-open-camera"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Camera className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Open Camera</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className={`macos-button flex flex-col items-center space-y-1 px-4 py-6 rounded-2xl transition-all duration-300 border-none relative ${
              forusIntegrationMode 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-muted-foreground bg-[#303030] hover:bg-[#353535]'
            }`}
            style={{
              boxShadow: forusIntegrationMode ? 'none' : '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
            }}
            onClick={adjustForus}
            data-testid="button-forus-integration"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Hammer className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Integration Answer</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-[#303030] border-none relative transition-all duration-300"
            style={{
              boxShadow: '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
            }}
            onClick={() => setIsCustomizeModalOpen(true)}
            data-testid="button-adjust-forus"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Settings className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Adjust</span>
            </div>
          </Button>

          {selectedModel === 'forus-education' && (
            <Button
              variant="ghost"
              className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-[#303030] border-none relative transition-all duration-300"
              style={{
                boxShadow: '0 8px 20px -4px rgba(255, 255, 255, 0.15)'
              }}
              onClick={() => setIsEducationModalOpen(true)}
              data-testid="button-forus-examination"
            >
              <div className="relative z-10 flex flex-col items-center space-y-1">
                <GraduationCap className="h-5 w-5" />
                <span className="text-[10px] sm:text-xs font-medium">Education</span>
              </div>
            </Button>
          )}
        </div>
      </div>
        
      {/* Voice Mode Modal */}
      {isVoiceModeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="relative mb-6">
              <div 
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(45deg, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default')} 0%, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default', true)} 100%)`,
                  transform: `scale(${1 + Math.sin(Date.now() / 200) * 0.1})`,
                }}
              >
                <Logo size="lg" className="text-white" />
              </div>
              {isListening && (
                <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-blue-500 animate-pulse"></div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Voice Mode</h3>
            <p className="text-muted-foreground mb-4">
              {isListening ? "I'm listening..." : "Click to start speaking"}
            </p>
            
            {/* Voice-to-Voice Toggle */}
            <div className="flex items-center justify-center mb-6 space-x-3">
              <span className={`text-sm ${!isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice Input Only
              </span>
              <button
                onClick={() => setIsVoiceToVoiceMode(!isVoiceToVoiceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isVoiceToVoiceMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVoiceToVoiceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice-to-Voice
              </span>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <Button
                onClick={() => setIsVoiceModeOpen(false)}
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input - Separate Section */}
      <div className="p-1 sm:p-2 message-input-container max-w-[50rem] mx-auto w-full rounded-3xl !bg-[#303030] relative" style={{
        boxShadow: '0 10px 30px -5px rgba(255, 255, 255, 0.2), 0 4px 10px -2px rgba(255, 255, 255, 0.1)'
      }}>
        <div className="relative bg-[#303030] rounded-3xl">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="message-input w-full min-h-[48px] max-h-[140px] bg-[#303030] rounded-3xl pb-10 pr-16 sm:pb-14 sm:pr-20 text-white placeholder-muted-foreground resize-none focus:outline-none border-none !bg-[#303030] shadow-none ring-0 focus-visible:ring-0"
            style={{
              paddingRight: '64px',
              fontSize: '18px',
              lineHeight: '27px'
            }}
            data-testid="input-message"
          />
          
          {/* Bottom Overlay to hide scrolling text behind buttons */}
          <div className="absolute bottom-1 left-1 right-1 h-12 bg-[#303030] rounded-b-3xl pointer-events-none z-10"></div>
          
          {/* Custom Placeholder */}
          {!inputValue && !attachedImage && (
            <div 
              className="absolute font-medium text-muted-foreground pointer-events-none"
              style={{
                top: '8px',
                left: '18px',
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

          {/* Image Preview - Positioned above input area for better visibility */}
          {attachedImage && (
            <div className="absolute -top-16 left-2 flex items-center space-x-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-2 border border-gray-200 dark:border-gray-600 max-w-[300px] shadow-lg z-10">
              <img 
                src={attachedImage.preview} 
                alt="Attached image" 
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 dark:text-gray-300 max-w-[150px] truncate font-medium">
                  {attachedImage.file.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Image attached - Ready to analyze
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 text-gray-400 hover:text-red-500 ml-2"
                onClick={() => setAttachedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Model Switcher - Bottom Left */}
          <div className="absolute left-1 bottom-1 sm:left-2 sm:bottom-2 z-20">
            <Select value={selectedModel} onValueChange={(value: AvailableModel) => setSelectedModel(value)}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs !border-0 !border-none !bg-transparent !shadow-none !ring-0 !ring-offset-0 !outline-none hover:bg-white/10 transition-all px-2 focus:!ring-0 focus:!ring-offset-0 shadow-none border-transparent">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="!border-0 !border-none rounded-lg shadow-lg backdrop-blur-md bg-[#252525]/90 overflow-hidden !ring-0 !outline-none border-transparent">
                {MODEL_OPTIONS.map((modelOption) => (
                  <SelectItem key={modelOption.id} value={modelOption.id} className="text-xs hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        modelOption.provider === 'openai' ? 'bg-green-500' :
                        modelOption.provider === 'anthropic' ? 'bg-orange-500' :
                        modelOption.provider === 'google' ? 'bg-blue-500' :
                        modelOption.provider === 'meta' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}></div>
                      {modelOption.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 flex items-end space-x-1 sm:space-x-2 z-20">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="macos-button text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
              onClick={() => setIsAttachmentDialogOpen(true)}
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
              className="macos-button text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 h-8 w-8 sm:h-10 sm:w-10 rounded-2xl transition-colors"
              onClick={handleEnhancePrompt}
              disabled={!inputValue.trim() || isEnhancing}
              data-testid="button-enhance-prompt"
              title={isEnhancing ? "AI is enhancing prompt..." : "Enhance your prompt 1000x better"}
            >
              {isEnhancing ? (
                <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
              ) : (
                <span className="text-lg font-bold">✦</span>
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && !attachedImage}
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
      


      {/* Attachment Dialog */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="attachment-upload-file"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Upload File</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => imageInputRef.current?.click()}
              data-testid="attachment-upload-image"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">Upload Image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Modal */}
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentPreset={currentPreset}
        customInstructions={customInstructions}
        onSave={handleCustomizeSave}
      />

      {/* Image Generation Dialog */}
      <ImageGenerationDialog
        open={isImageGenerationDialogOpen}
        onOpenChange={setIsImageGenerationDialogOpen}
      />

      {/* Education Modal */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        onStartExamination={handleStartExamination}
        onStartSelfListen={handleStartSelfListen}
      />

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeModalOpen}
        onClose={() => setIsVoiceModeModalOpen(false)}
        isListening={isListening}
        onToggleListening={toggleListening}
        isPlaying={false}
        onTogglePlaying={() => {}}
      />

      {/* Lumin Notification - Show in both tabs */}
      {showLuminNotification && (
        <LuminNotification onClose={() => setShowLuminNotification(false)} />
      )}
    </div>
  );
}
