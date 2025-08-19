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
  imageUrl?: string; // For multimodal support (ChatGPT/Gemini-like image uploads)
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  isPrivate: boolean;
  preset: 'custom' | 'concise' | 'formal' | 'socratic' | 'forus-education';
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
  'forus-education',    // Educational features with examination & self-listen
  'forus-code',         // Programming & development
  'forus-flash',        // Fast responses & multimodal
  'forus-creative',     // Creative writing & storytelling
  'forus-lite',         // Quick tasks & efficiency
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
  "forus-education": {
    name: "Forus Education",
    description: "Advanced educational assistant with examination and listening features.",
  },
} as const;

export type ChatPreset = keyof typeof CHAT_PRESETS;
