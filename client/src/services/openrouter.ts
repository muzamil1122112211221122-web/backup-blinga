import { AvailableModel } from "../types/chat";

// API Keys for different Forus models
const FORUS_API_KEYS = {
  'forus-prime': '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',
  'forus-code': import.meta.env.VITE_FORUS_CODE_API_KEY || '',
  'forus-flash': import.meta.env.VITE_FORUS_FLASH_API_KEY || '',
  'forus-creative': import.meta.env.VITE_FORUS_CREATIVE_API_KEY || '',
  'forus-lite': import.meta.env.VITE_FORUS_LITE_API_KEY || '',
  'forus-speed': import.meta.env.VITE_FORUS_SPEED_API_KEY || '',
  'forus-context': import.meta.env.VITE_FORUS_CONTEXT_API_KEY || '',
  'forus-auto': import.meta.env.VITE_FORUS_AUTO_API_KEY || '',
};

// Map Forus model names to actual OpenRouter models
const MODEL_MAPPING = {
  'forus-prime': 'anthropic/claude-3.5-sonnet',
  'forus-code': 'openai/gpt-4o',
  'forus-flash': 'google/gemini-2.0-flash-exp',
  'forus-creative': 'meta-llama/llama-3.1-70b-instruct',
  'forus-lite': 'openai/gpt-4o-mini',
  'forus-speed': 'anthropic/claude-3-haiku',
  'forus-context': 'google/gemini-pro-1.5',
  'forus-auto': 'openrouter/auto',
};

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private baseURL = 'https://openrouter.ai/api/v1';

  private getApiKey(model: AvailableModel): string {
    const apiKey = FORUS_API_KEYS[model];
    if (!apiKey) {
      throw new Error(`API key not configured for model: ${model}`);
    }
    return apiKey;
  }

  private mapModel(forusModel: AvailableModel): string {
    return MODEL_MAPPING[forusModel] || forusModel;
  }

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    model: AvailableModel = 'forus-prime',
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse> {
    const apiKey = this.getApiKey(model);
    const mappedModel = this.mapModel(model);
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Forus API',
      },
      body: JSON.stringify({
        model: mappedModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async *streamCompletion(
    messages: Array<{ role: string; content: string }>,
    model: AvailableModel = 'forus-prime',
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const apiKey = this.getApiKey(model);
    const mappedModel = this.mapModel(model);
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Forus API',
      },
      body: JSON.stringify({
        model: mappedModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get response reader');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getModels(): Promise<Array<{ id: string; name: string; description?: string }>> {
    // Return Forus branded models
    return [
      { id: 'forus-prime', name: 'Forus Prime', description: 'Advanced reasoning & analysis' },
      { id: 'forus-code', name: 'Forus Code', description: 'Programming & development' },
      { id: 'forus-flash', name: 'Forus Flash', description: 'Fast responses & multimodal' },
      { id: 'forus-creative', name: 'Forus Creative', description: 'Creative writing & storytelling' },
      { id: 'forus-lite', name: 'Forus Lite', description: 'Quick tasks & efficiency' },
      { id: 'forus-speed', name: 'Forus Speed', description: 'Ultra-fast processing' },
      { id: 'forus-context', name: 'Forus Context', description: 'Long document processing' },
      { id: 'forus-auto', name: 'Forus Auto', description: 'Intelligent model selection' },
    ];
  }
}

// Singleton instance
let openRouterService: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    openRouterService = new OpenRouterService();
  }
  return openRouterService;
}
