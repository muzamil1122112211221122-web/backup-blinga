export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    model?: string;
    usage?: any;
    provider?: string;
  };
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  isPrivate: boolean;
  preset: 'custom' | 'concise' | 'formal' | 'socratic';
  customInstructions?: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatClient {
  userId?: string;
  conversationId?: string;
  isConnected: boolean;
  isTyping: boolean;
}

export interface WebSocketMessage {
  type: 'join_conversation' | 'send_message' | 'message' | 'typing' | 'error';
  conversationId?: string;
  userId?: string;
  content?: string;
  message?: ChatMessage;
  isTyping?: boolean;
  error?: string;
}

export const AVAILABLE_MODELS = [
  'forus-prime',        // Advanced reasoning & analysis
  'forus-code',         // Programming & development
  'forus-flash',        // Fast responses & multimodal
  'forus-creative',     // Creative writing & storytelling
  'forus-lite',         // Quick tasks & efficiency
  'forus-speed',        // Ultra-fast processing
  'forus-context',      // Long document processing
  'forus-auto',         // Intelligent model selection
] as const;

export type AvailableModel = typeof AVAILABLE_MODELS[number];

export const CHAT_PRESETS = {
  custom: {
    name: "Custom",
    description: "Customize how Forus API responds.",
  },
  concise: {
    name: "Concise", 
    description: "Responds briefly and directly.",
  },
  formal: {
    name: "Formal",
    description: "Responds using a formal tone.",
  },
  socratic: {
    name: "Socratic",
    description: "Responds in a way to help you learn.",
  },
} as const;

export type ChatPreset = keyof typeof CHAT_PRESETS;
