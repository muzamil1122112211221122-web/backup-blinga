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
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-exp',
  'meta-llama/llama-3.1-70b-instruct',
  'openrouter/auto',
] as const;

export type AvailableModel = typeof AVAILABLE_MODELS[number];

export const CHAT_PRESETS = {
  custom: {
    name: "Custom",
    description: "Customize how LineusAPI responds.",
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
