import { AvailableModel } from "../types/chat";

// API Keys for different Forus models
const FORUS_API_KEYS = {
  'forus-prime': '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',
  'forus-code': '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',
  'forus-flash': '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',
  'forus-creative': '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',
  'forus-lite': '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',
  'forus-speed': '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',
  'forus-context': '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',
  'forus-auto': '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',
  'forus-education': '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',
  'gpt-4o': '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',
  'claude-3.5-sonnet': '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',
  'gemini-pro': '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',
  'llama-3.3-70b-versatile': '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',
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
  'forus-education': 'anthropic/claude-3.5-sonnet',
  'gpt-4o': 'openai/gpt-4o',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'gemini-pro': 'google/gemini-pro',
  'llama-3.3-70b-versatile': 'meta-llama/llama-3.3-70b-versatile',
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
  ): Promise<OpenRouterResponse & { thinking?: string }> {
    const apiKey = this.getApiKey(model);
    const mappedModel = this.mapModel(model);

    // Generate thinking process for Forus Pro (forus-prime) model
    const thinking = model === 'forus-prime' ? this.generateThinkingProcess(messages[messages.length - 1]?.content || '') : undefined;

    // Add thinking system prompt for Forus Pro
    let finalMessages = messages;
    if (thinking) {
      const systemPrompt = `You are Forus Pro, an advanced AI with deep reasoning capabilities. Think step by step about the user's question.

Thinking process (internal reasoning):
${thinking}

Based on this analysis, provide your response:`;
      
      finalMessages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
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
        messages: finalMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 300,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return { ...result, thinking };
  }

  private generateThinkingProcess(userMessage: string): string {
    // Simulate DeepSeek-style chain of thought reasoning
    const thinkingSteps = [
      "1. Understanding the user's question:",
      `   - Analyzing: "${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}"`,
      "   - Identifying key concepts and intent",
      "   - Determining the type of response needed",
      "",
      "2. Knowledge retrieval and analysis:",
      "   - Accessing relevant information from training data",
      "   - Cross-referencing multiple sources for accuracy",
      "   - Evaluating the reliability of information",
      "",
      "3. Reasoning and synthesis:",
      "   - Breaking down complex concepts into understandable parts",
      "   - Drawing logical connections between ideas",
      "   - Considering multiple perspectives and approaches",
      "",
      "4. Response formulation:",
      "   - Structuring information for clarity",
      "   - Ensuring comprehensiveness while maintaining focus",
      "   - Adapting language to user's apparent knowledge level",
      "",
      "5. Quality check:",
      "   - Verifying accuracy of claims",
      "   - Ensuring response addresses all aspects of the question",
      "   - Checking for potential ambiguities or misunderstandings"
    ];

    return thinkingSteps.join('\n');
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
        max_tokens: options.maxTokens ?? 300,
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
      { id: 'forus-prime', name: 'Forus Pro', description: 'Advanced reasoning & analysis' },
      { id: 'forus-code', name: 'Forus Code', description: 'Programming & development' },
      { id: 'forus-flash', name: 'Forus Flash', description: 'Fast responses & multimodal' },
      { id: 'forus-creative', name: 'Forus Creative', description: 'Creative writing & storytelling' },
      { id: 'forus-lite', name: 'Forus Lite', description: 'Quick tasks & efficiency' },
      { id: 'forus-speed', name: 'Forus Speed', description: 'Ultra-fast processing' },
      { id: 'forus-context', name: 'Forus Context', description: 'Long document processing' },
      { id: 'forus-auto', name: 'Forus Auto', description: 'Intelligent model selection' },
      { id: 'forus-education', name: 'Forus Education', description: 'Educational content & tutoring' },
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
