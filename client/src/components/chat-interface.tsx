import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "./logo";

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
  GraduationCap
} from "lucide-react";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>("forus-prime");
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask'>('ask');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{id: string; title: string; createdAt: Date}>>([]);
  const [user, setUser] = useState<{email: string; username: string; displayName?: string | null} | null>(null);
  const [input, setInput] = useState("");
  const [forusIntegrationMode, setForusIntegrationMode] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
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

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleLikeMessage = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        setDislikedMessages(current => {
          const newDisliked = new Set(current);
          newDisliked.delete(messageId);
          return newDisliked;
        });
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
        setLikedMessages(current => {
          const newLiked = new Set(current);
          newLiked.delete(messageId);
          return newLiked;
        });
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



  return (
    <div className="min-h-screen flex flex-col bg-background relative">
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
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-150 ${
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
                            className={`h-6 w-6 rounded-xl transition-all duration-150 ${
                              likedMessages.has(message.id)
                                ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950'
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
                            className={`h-6 w-6 rounded-xl transition-all duration-150 ${
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
                            className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-xl"
                            onClick={() => handleSpeakMessage(message.content)}
                            data-testid={`button-speak-${message.id}`}
                          >
                            <Volume2 className="h-3 w-3" />
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
      <div className="bg-card macos-function-bar rounded-3xl mx-3 sm:mx-4 mb-1 shadow-sm" style={{width: 'fit-content', margin: '0 auto', marginBottom: '4px'}}>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-6 p-3 sm:p-4">
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={() => setIsVoiceModeOpen(true)}
            data-testid="button-voice-mode"
          >
            <div className="flex items-center justify-center space-x-0.5 h-5 w-5">
              <div className="w-0.5 h-1.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-2.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-4 bg-current rounded-full"></div>
              <div className="w-0.5 h-3 bg-current rounded-full"></div>
              <div className="w-0.5 h-1 bg-current rounded-full"></div>
            </div>
            <span className="text-xs hidden sm:block">Voice Mode</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={handleCreateImageFromFunctionBar}
            data-testid="button-create-images"
          >
            <Image className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Create Images</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={handleOpenCameraFromFunctionBar}
            data-testid="button-open-camera"
          >
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Open Camera</span>
          </Button>
          
          <Button
            variant="ghost"
            className={`macos-button flex flex-col items-center space-y-1 px-2 sm:px-3 rounded-2xl transition-colors ${
              forusIntegrationMode 
                ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={adjustForus}
            data-testid="button-forus-integration"
          >
            <Hammer className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Forus Integration Answer</span>
          </Button>
          
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
            onClick={() => setIsCustomizeModalOpen(true)}
            data-testid="button-adjust-forus"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs hidden sm:block">Adjust Forus</span>
          </Button>
          
          {/* Education Buttons - Only show when Forus Education model is selected */}
          {selectedModel === 'forus-education' && (
            <>
              <Button
                variant="ghost"
                className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-2 sm:px-3 rounded-2xl"
                onClick={() => setIsEducationModalOpen(true)}
                data-testid="button-forus-examination"
              >
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs hidden sm:block">Forus Education</span>
              </Button>
            </>
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
            <p className="text-muted-foreground mb-6">
              {isListening ? "I'm listening..." : "Click to start speaking"}
            </p>
            
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
      <div className="bg-card p-3 sm:p-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="message-input w-full min-h-[80px] max-h-[200px] bg-background rounded-3xl pb-12 pr-16 sm:pb-16 sm:pr-20 text-foreground placeholder-muted-foreground resize-none focus:outline-none border-0"
            style={{
              paddingRight: '64px',
              fontSize: '18px',
              lineHeight: '27px'
            }}
            data-testid="input-message"
          />
          
          {/* Custom Placeholder */}
          {!inputValue && !attachedImage && (
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

          {/* Image Preview */}
          {attachedImage && (
            <div className="absolute top-2 left-2 flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200 dark:border-gray-600">
              <img 
                src={attachedImage.preview} 
                alt="Attached image" 
                className="w-12 h-12 object-cover rounded"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
                {attachedImage.file.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 text-gray-400 hover:text-red-500"
                onClick={() => setAttachedImage(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Model Switcher - Bottom Left */}
          <div className="absolute left-2 bottom-2 sm:left-3 sm:bottom-3">
            <Select value={selectedModel} onValueChange={(value: AvailableModel) => setSelectedModel(value)}>
              <SelectTrigger className="w-32 h-8 text-xs border border-gray-300 dark:border-gray-600 bg-background rounded-lg shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model} value={model} className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800">
                    {model.replace('forus-', '').replace('-', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 flex items-end space-x-1 sm:space-x-2">
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
              className="macos-button text-muted-foreground hover:text-purple-500 h-8 w-8 sm:h-10 sm:w-10 rounded-2xl transition-colors"
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
    </div>
  );
}
