import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "./logo";
import { CustomizeModal } from "./customize-modal";
import { useWebSocket } from "../hooks/use-websocket";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/use-speech";
import { ChatMessage, ChatPreset, AVAILABLE_MODELS, AvailableModel, WebSocketMessage } from "../types/chat";
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
  Lightbulb,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  MicOff,
  Zap
} from "lucide-react";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>("anthropic/claude-3.5-sonnet");
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask' | 'imagine'>('ask');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('Connected to chat server'),
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

    // Send via WebSocket
    sendWsMessage({
      type: 'send_message',
      conversationId,
      content,
    });
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

  const handleCustomizeSave = (preset: ChatPreset, instructions: string, enabled: boolean) => {
    setCurrentPreset(preset);
    setCustomInstructions(instructions);
    // TODO: Save to conversation settings
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--dark-primary)]">
      {/* Header */}
      <header className="bg-[var(--dark-secondary)] border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo size="sm" />
          <span className="font-semibold text-[var(--text-primary)]">LineusAPI</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === 'ask' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ask')}
            className={activeTab === 'ask' ? 'bg-[var(--dark-accent)]' : ''}
            data-testid="tab-ask"
          >
            Ask
          </Button>
          <Button
            variant={activeTab === 'imagine' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('imagine')}
            className={activeTab === 'imagine' ? 'bg-[var(--dark-accent)]' : ''}
            data-testid="tab-imagine"
          >
            Imagine
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Logo size="xl" className="mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Welcome to LineusAPI</h2>
            <p className="text-[var(--text-secondary)]">Ask anything Lineus will do till death</p>
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
                  <div className="bg-[var(--dark-secondary)] rounded-2xl px-4 py-3 max-w-xs lg:max-w-md chat-bubble">
                    <p className="text-[var(--text-primary)]">{message.content}</p>
                  </div>
                ) : (
                  <div className="flex space-x-3 max-w-4xl">
                    <Logo size="sm" className="flex-shrink-0 mt-1" />
                    <div className="bg-[var(--dark-secondary)] rounded-2xl px-4 py-3 flex-1 chat-bubble">
                      <p className="text-[var(--text-primary)]">{message.content}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            onClick={() => handleCopyMessage(message.content)}
                            data-testid={`button-copy-${message.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            data-testid={`button-like-${message.id}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            data-testid={`button-dislike-${message.id}`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            onClick={() => handleSpeakMessage(message.content)}
                            data-testid={`button-speak-${message.id}`}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">
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
                  <div className="bg-[var(--dark-secondary)] rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Tool Buttons */}
      <div className="bg-[var(--dark-secondary)] border-t border-[var(--border)] p-4">
        <div className="flex justify-center space-x-6 mb-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={toggleListening}
            disabled={!speechSupported}
            data-testid="button-voice-mode"
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="text-xs">Voice Mode</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-create-images"
          >
            <Image className="h-5 w-5" />
            <span className="text-xs">Create Images</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-open-camera"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Open Camera</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-edit-image"
          >
            <Edit className="h-5 w-5" />
            <span className="text-xs">Edit Image</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-analyze-docs"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Analyze Docs</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={() => setIsCustomizeModalOpen(true)}
            data-testid="button-customize"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Customize LineusAPI</span>
          </Button>
        </div>
        
        {/* Message Input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Anything"
            className="message-input w-full bg-[var(--dark-primary)] border border-[var(--border)] rounded-2xl px-4 py-4 pr-20 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--text-primary)]"
            data-testid="input-message"
          />
          
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              data-testid="button-attach-file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`${isListening ? 'text-green-400' : 'text-[var(--text-secondary)]'} hover:text-[var(--text-primary)]`}
              onClick={toggleListening}
              disabled={!speechSupported}
              data-testid="button-voice-input"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              data-testid="button-ideas"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-[var(--text-primary)] text-[var(--dark-primary)] rounded-full p-2 hover:bg-[var(--text-secondary)]"
              data-testid="button-send-message"
            >
              <ArrowUp className="h-4 w-4" />
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
        
        {/* Model Selector */}
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mt-2">
          <div className="flex items-center space-x-2">
            <span>Model:</span>
            <Select value={selectedModel} onValueChange={(value: AvailableModel) => setSelectedModel(value)}>
              <SelectTrigger className="w-auto bg-[var(--dark-secondary)] border-[var(--border)] text-[var(--text-primary)]" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--dark-secondary)] border-[var(--border)]">
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model} value={model} className="text-[var(--text-primary)]">
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-testid="button-fast-mode"
          >
            <Zap className="h-3 w-3 mr-1" />
            Fast
          </Button>
        </div>
      </div>
      
      {/* Attribution */}
      <div className="text-right p-2 attribution text-[var(--text-secondary)]">
        Made by Muzamil
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
