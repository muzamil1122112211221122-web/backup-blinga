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
  preset: 'custom' | 'concise' | 'formal' | 'socratic' | 'fius-education';
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

export const MODEL_OPTIONS = [
  { 
    id: 'fius-lite', 
    name: 'Fius Lite', 
    description: 'Fast & efficient for everyday tasks', 
    provider: 'fius',
    speed: 'fastest',
    intelligence: 'high'
  },
  { 
    id: 'fius-prime', 
    name: 'Fius Pro', 
    description: 'Our most advanced general AI', 
    provider: 'fius',
    speed: 'fast',
    intelligence: 'high'
  },
  { 
    id: 'gpt-4o', 
    name: 'ChatGPT 5', 
    description: 'OpenAI\'s most capable model', 
    provider: 'openai',
    speed: 'fast',
    intelligence: 'highest'
  },
  { 
    id: 'claude-3.5-sonnet', 
    name: 'Claude Sonnet 4', 
    description: 'Anthropic\'s most intelligent model', 
    provider: 'anthropic',
    speed: 'fast',
    intelligence: 'highest'
  },
  { 
    id: 'gemini-pro', 
    name: 'Gemini 2.5 Pro', 
    description: 'Google\'s most advanced reasoning model', 
    provider: 'google',
    speed: 'fast',
    intelligence: 'high'
  },
  { 
    id: 'llama-3.3-70b-versatile', 
    name: 'Llama 3.3 70B', 
    description: 'Meta\'s powerful open-source model', 
    provider: 'meta',
    speed: 'fastest',
    intelligence: 'high'
  },
  { 
    id: 'fius-education', 
    name: 'Fius Education', 
    description: 'Specialized for learning and teaching', 
    provider: 'fius',
    speed: 'fast',
    intelligence: 'high'
  },
  { 
    id: 'fius-imagine-super', 
    name: 'Fius Imagine Super', 
    description: 'Highest quality AI image generation', 
    provider: 'fius-imagine',
    speed: 'medium',
    intelligence: 'highest'
  },
  { 
    id: 'fius-imagine-fast', 
    name: 'Fius Imagine Fast', 
    description: 'Rapid AI image generation', 
    provider: 'fius-imagine',
    speed: 'fastest',
    intelligence: 'high'
  }
] as const;

export const AVAILABLE_MODELS = [
  'fius-lite',
  'fius-prime',        
  'gpt-4o',
  'claude-3.5-sonnet',
  'gemini-pro',
  'llama-3.3-70b-versatile',
  'fius-education',
  'fius-imagine-super',
  'fius-imagine-fast',
] as const;

export type AvailableModel = typeof AVAILABLE_MODELS[number];

export const CHAT_PRESETS = {
  custom: {
    name: "Custom",
    description: "Customize how Fius API responds.",
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
  "fius-education": {
    name: "Fius Education",
    description: "Advanced educational assistant with examination and listening features.",
  },
} as const;

export type ChatPreset = keyof typeof CHAT_PRESETS;
