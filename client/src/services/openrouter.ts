import { AvailableModel } from "../types/chat";

// API Keys for different Fius models
const FIUS_API_KEYS = {
  'fius-prime': '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',
  'fius-code': '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',
  'fius-flash': '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',
  'fius-creative': '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',
  'fius-lite': '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',
  'fius-speed': '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',
  'fius-context': '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',
  'fius-auto': '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',
  'fius-education': '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',
  'gpt-4o': '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',
  'claude-3.5-sonnet': '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',
  'gemini-pro': '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',
  'llama-3.3-70b-versatile': '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',
};

// Map Fius model names to actual OpenRouter models
const MODEL_MAPPING = {
  'fius-prime': 'anthropic/claude-3.5-sonnet',
  'fius-code': 'openai/gpt-4o',
  'fius-flash': 'google/gemini-2.0-flash-exp',
  'fius-creative': 'meta-llama/llama-3.1-70b-instruct',
  'fius-lite': 'openai/gpt-4o-mini',
  'fius-speed': 'anthropic/claude-3-haiku',
  'fius-context': 'google/gemini-pro-1.5',
  'fius-auto': 'openrouter/auto',
  'fius-education': 'anthropic/claude-3.5-sonnet',
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
    const apiKey = FIUS_API_KEYS[model];
    if (!apiKey) {
      throw new Error(`API key not configured for model: ${model}`);
    }
    return apiKey;
  }

  private mapModel(fiusModel: AvailableModel): string {
    return MODEL_MAPPING[fiusModel] || fiusModel;
  }

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    model: AvailableModel = 'fius-prime',
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse & { thinking?: string }> {
    const apiKey = this.getApiKey(model);
    const mappedModel = this.mapModel(model);

    // Generate thinking process for Fius Pro (fius-prime) model
    const thinking = model === 'fius-prime' ? this.generateThinkingProcess(messages[messages.length - 1]?.content || '') : undefined;

    // Add DeepSeek-style thinking system prompt for Fius Pro
    let finalMessages = messages;
    if (thinking) {
      const systemPrompt = `You are Fius Pro, an advanced AI with DeepSeek-style reasoning capabilities. You MUST show your thinking process before providing your final answer.

First, display your internal reasoning process exactly as provided below, then give your response.

${thinking}

Important: Always show the <thinking> tags and reasoning steps, then provide your final answer. This demonstrates transparent reasoning like DeepSeek R1.`;
      
      finalMessages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Fius API',
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
    // DeepSeek-style chain of thought reasoning with explicit thinking steps
    const messageWords = userMessage.toLowerCase().split(' ');
    const isQuestion = userMessage.includes('?') || messageWords.some(word => 
      ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should'].includes(word)
    );
    const isComputational = messageWords.some(word => 
      ['calculate', 'solve', 'compute', 'math', 'equation', 'formula', 'number'].includes(word)
    );
    const isCreative = messageWords.some(word => 
      ['write', 'create', 'design', 'story', 'poem', 'creative', 'imagine'].includes(word)
    );
    const isAnalytical = messageWords.some(word => 
      ['analyze', 'compare', 'evaluate', 'assess', 'examine', 'review'].includes(word)
    );

    let thinkingSteps = [
      "<thinking>",
      "Let me break down this request step by step:",
      "",
      "1. PROBLEM ANALYSIS:",
    ];

    if (isQuestion) {
      thinkingSteps.push("   - This is an information-seeking question");
      thinkingSteps.push("   - Need to identify the core information being requested");
    } else if (isComputational) {
      thinkingSteps.push("   - This involves mathematical or computational reasoning");
      thinkingSteps.push("   - Need to identify the problem type and solution method");
    } else if (isCreative) {
      thinkingSteps.push("   - This is a creative task requiring imagination");
      thinkingSteps.push("   - Need to understand style, tone, and requirements");
    } else if (isAnalytical) {
      thinkingSteps.push("   - This requires analytical thinking and evaluation");
      thinkingSteps.push("   - Need to break down components for systematic analysis");
    } else {
      thinkingSteps.push("   - This appears to be a general request or conversation");
      thinkingSteps.push("   - Need to understand context and appropriate response type");
    }

    thinkingSteps.push(`   - Key terms: ${messageWords.slice(0, 5).join(', ')}`);
    thinkingSteps.push(`   - Message length: ${userMessage.length} characters`);
    thinkingSteps.push("");

    thinkingSteps.push("2. KNOWLEDGE ACTIVATION:");
    thinkingSteps.push("   - Retrieving relevant information from training data");
    thinkingSteps.push("   - Cross-referencing multiple knowledge domains");
    thinkingSteps.push("   - Identifying potential gaps or uncertainties");
    thinkingSteps.push("   - Prioritizing most relevant and reliable information");
    thinkingSteps.push("");

    thinkingSteps.push("3. REASONING CHAIN:");
    if (isComputational) {
      thinkingSteps.push("   - Breaking problem into solvable components");
      thinkingSteps.push("   - Applying appropriate mathematical principles");
      thinkingSteps.push("   - Verifying each step in the calculation");
      thinkingSteps.push("   - Checking for logical consistency");
    } else if (isAnalytical) {
      thinkingSteps.push("   - Identifying key factors and variables");
      thinkingSteps.push("   - Establishing evaluation criteria");
      thinkingSteps.push("   - Weighing pros and cons systematically");
      thinkingSteps.push("   - Drawing evidence-based conclusions");
    } else {
      thinkingSteps.push("   - Connecting relevant concepts logically");
      thinkingSteps.push("   - Building from basic to complex ideas");
      thinkingSteps.push("   - Considering multiple perspectives");
      thinkingSteps.push("   - Identifying cause-and-effect relationships");
    }
    thinkingSteps.push("");

    thinkingSteps.push("4. SOLUTION SYNTHESIS:");
    thinkingSteps.push("   - Organizing information in logical sequence");
    thinkingSteps.push("   - Ensuring completeness of coverage");
    thinkingSteps.push("   - Adapting complexity to user's apparent level");
    thinkingSteps.push("   - Preparing clear, actionable response");
    thinkingSteps.push("");

    thinkingSteps.push("5. VERIFICATION & QUALITY CHECK:");
    thinkingSteps.push("   - Double-checking factual accuracy");
    thinkingSteps.push("   - Ensuring response directly addresses the request");
    thinkingSteps.push("   - Checking for potential misinterpretations");
    thinkingSteps.push("   - Verifying logical consistency throughout");
    thinkingSteps.push("   - Confirming appropriate tone and style");
    thinkingSteps.push("");
    thinkingSteps.push("Now I'll provide my response based on this analysis:");
    thinkingSteps.push("</thinking>");

    return thinkingSteps.join('\n');
  }

  async *streamCompletion(
    messages: Array<{ role: string; content: string }>,
    model: AvailableModel = 'fius-prime',
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
        'X-Title': 'Fius API',
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
    // Return Fius branded models
    return [
      { id: 'fius-prime', name: 'Fius Pro', description: 'Advanced reasoning & analysis' },
      { id: 'fius-code', name: 'Fius Code', description: 'Programming & development' },
      { id: 'fius-flash', name: 'Fius Flash', description: 'Fast responses & multimodal' },
      { id: 'fius-creative', name: 'Fius Creative', description: 'Creative writing & storytelling' },
      { id: 'fius-lite', name: 'Fius Lite', description: 'Quick tasks & efficiency' },
      { id: 'fius-speed', name: 'Fius Speed', description: 'Ultra-fast processing' },
      { id: 'fius-context', name: 'Fius Context', description: 'Long document processing' },
      { id: 'fius-auto', name: 'Fius Auto', description: 'Intelligent model selection' },
      { id: 'fius-education', name: 'Fius Education', description: 'Educational content & tutoring' },
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
