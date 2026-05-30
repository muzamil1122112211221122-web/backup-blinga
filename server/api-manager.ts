// Advanced API Manager for Fius Heavy API
// Handles intelligent routing between Groq (primary), OpenRouter (secondary), OpenAI (fallback), and Gemini (image generation)

interface APIKey {
  key: string;
  provider: 'groq' | 'openrouter' | 'openai' | 'gemini';
  isWorking: boolean;
  failureCount: number;
  lastFailure?: Date;
  requestCount: number;
  lastUsed?: Date;
}

class APIManager {
  private apis: APIKey[] = [];
  private currentOpenRouterIndex = 0;
  private failureCooldown = 60000; // 1 minute cooldown after failure

  constructor() {
    this.initializeAPIs();
  }

  private initializeAPIs() {
    console.log('Debug: Initializing APIs...');
    console.log('Debug: GROQ_API_KEY exists?', !!process.env.GROQ_API_KEY);
    console.log('Debug: OPENAI_API_KEY exists?', !!process.env.OPENAI_API_KEY);
    console.log('Debug: GEMINI_API_KEY exists?', !!process.env.GEMINI_API_KEY);

    // Primary: Groq API (two keys for load balancing)
    if (process.env.GROQ_API_KEY) {
      this.apis.push({
        key: process.env.GROQ_API_KEY,
        provider: 'groq',
        isWorking: true,
        failureCount: 0,
        requestCount: 0
      });
      console.log('Debug: Added Groq API key 1');
    }
    if (process.env.GROQ_API_KEY_2) {
      this.apis.push({
        key: process.env.GROQ_API_KEY_2,
        provider: 'groq',
        isWorking: true,
        failureCount: 0,
        requestCount: 0
      });
      console.log('Debug: Added Groq API key 2');
    }

    // Secondary: OpenRouter APIs (10 keys for load balancing)
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`OPENROUTER_API_KEY_${i}`];
      if (key) {
        this.apis.push({
          key,
          provider: 'openrouter',
          isWorking: true,
          failureCount: 0,
          requestCount: 0
        });
        console.log(`Debug: Added OpenRouter API ${i}`);
      }
    }

    // Tertiary: OpenAI API
    if (process.env.OPENAI_API_KEY) {
      this.apis.push({
        key: process.env.OPENAI_API_KEY,
        provider: 'openai',
        isWorking: true,
        failureCount: 0,
        requestCount: 0
      });
      console.log('Debug: Added OpenAI API');
    } else {
      console.log('Debug: OpenAI API key not found or empty');
    }

    // Specialized: Gemini API
    if (process.env.GEMINI_API_KEY) {
      this.apis.push({
        key: process.env.GEMINI_API_KEY,
        provider: 'gemini',
        isWorking: true,
        failureCount: 0,
        requestCount: 0
      });
      console.log('Debug: Added Gemini API');
    } else {
      console.log('Debug: Gemini API key not found or empty');
    }

    console.log(`API Manager initialized with ${this.apis.length} APIs:`, 
      this.apis.map(api => `${api.provider} (${api.key.slice(0, 8)}...)`));
  }

  // Get the best available API for chat requests
  getBestChatAPI(): APIKey | null {
    // Try Groq first (fastest)
    const groqAPI = this.getWorkingAPI('groq');
    if (groqAPI) {
      console.log('Using Groq API for chat');
      return groqAPI;
    }

    // Fall back to OpenRouter with load balancing
    const openRouterAPI = this.getNextOpenRouterAPI();
    if (openRouterAPI) {
      console.log('Using OpenRouter API for chat');
      return openRouterAPI;
    }

    // Final fallback to OpenAI
    const openaiAPI = this.getWorkingAPI('openai');
    if (openaiAPI) {
      console.log('Using OpenAI API for chat');
      return openaiAPI;
    }

    console.error('No working chat APIs available!');
    return null;
  }

  // Get Gemini API for image generation
  getImageAPI(): APIKey | null {
    const geminiAPI = this.getWorkingAPI('gemini');
    if (geminiAPI) {
      console.log('Using Gemini API for image generation');
      return geminiAPI;
    }

    // Fallback to OpenAI for images
    const openaiAPI = this.getWorkingAPI('openai');
    if (openaiAPI) {
      console.log('Falling back to OpenAI for image generation');
      return openaiAPI;
    }

    console.error('No working image APIs available!');
    return null;
  }

  private getWorkingAPI(provider: 'groq' | 'openrouter' | 'openai' | 'gemini'): APIKey | null {
    const api = this.apis.find(api => 
      api.provider === provider && 
      this.isAPIAvailable(api)
    );
    
    if (api) {
      this.markAPIUsed(api);
    }
    
    return api || null;
  }

  private getNextOpenRouterAPI(): APIKey | null {
    const openRouterAPIs = this.apis.filter(api => 
      api.provider === 'openrouter' && 
      this.isAPIAvailable(api)
    );

    if (openRouterAPIs.length === 0) {
      // Reset all OpenRouter APIs if none are working
      this.resetFailedAPIs('openrouter');
      
      // Try again with reset APIs
      const resetAPIs = this.apis.filter(api => 
        api.provider === 'openrouter' && 
        this.isAPIAvailable(api)
      );
      
      if (resetAPIs.length === 0) {
        console.log('No OpenRouter APIs available even after reset');
        return null;
      }
      
      const selectedAPI = resetAPIs[0];
      this.markAPIUsed(selectedAPI);
      return selectedAPI;
    }

    // Round-robin selection with load balancing
    const selectedAPI = openRouterAPIs[this.currentOpenRouterIndex % openRouterAPIs.length];
    this.currentOpenRouterIndex++;
    
    this.markAPIUsed(selectedAPI);
    return selectedAPI;
  }

  private isAPIAvailable(api: APIKey): boolean {
    if (!api.isWorking) {
      // Check if cooldown period has passed
      if (api.lastFailure && Date.now() - api.lastFailure.getTime() > this.failureCooldown) {
        console.log(`Resetting API after cooldown: ${api.provider}`);
        api.isWorking = true;
        api.failureCount = Math.max(0, api.failureCount - 1);
      } else {
        return false;
      }
    }
    return true;
  }

  private markAPIUsed(api: APIKey) {
    api.requestCount++;
    api.lastUsed = new Date();
  }

  // Mark API as failed when request fails
  markAPIFailed(api: APIKey, error: string) {
    api.failureCount++;
    api.lastFailure = new Date();
    
    // Mark as not working if failure count exceeds threshold
    if (api.failureCount >= 3) {
      api.isWorking = false;
      console.log(`Marking API as failed: ${api.provider} (${api.failureCount} failures)`);
    }
    
    console.log(`API failure recorded: ${api.provider} - ${error}`);
  }

  // Reset failed APIs of a specific provider
  private resetFailedAPIs(provider: 'groq' | 'openrouter' | 'openai' | 'gemini') {
    const failedAPIs = this.apis.filter(api => 
      api.provider === provider && !api.isWorking
    );
    
    failedAPIs.forEach(api => {
      api.isWorking = true;
      api.failureCount = Math.max(0, api.failureCount - 2);
    });
    
    if (failedAPIs.length > 0) {
      console.log(`Reset ${failedAPIs.length} failed ${provider} APIs`);
    }
  }

  // Get API statistics for monitoring
  getAPIStats() {
    return this.apis.map(api => ({
      provider: api.provider,
      isWorking: api.isWorking,
      failureCount: api.failureCount,
      requestCount: api.requestCount,
      lastUsed: api.lastUsed,
      lastFailure: api.lastFailure
    }));
  }

  // Get available API count by provider
  getAvailableCount(provider?: 'groq' | 'openrouter' | 'openai' | 'gemini'): number {
    const filtered = provider 
      ? this.apis.filter(api => api.provider === provider)
      : this.apis;
    
    return filtered.filter(api => this.isAPIAvailable(api)).length;
  }
}

// Singleton instance
export const apiManager = new APIManager();

// Helper functions for backward compatibility
export function getNextApiKey(preferGroq: boolean = true): { key: string; provider: 'groq' | 'openrouter' | 'openai' | 'gemini' } {
  const api = apiManager.getBestChatAPI();
  if (!api) {
    throw new Error('No working APIs available');
  }
  return { key: api.key, provider: api.provider };
}

export function markKeyFailed(key: string, error: string) {
  const api = apiManager['apis'].find(api => api.key === key);
  if (api) {
    apiManager.markAPIFailed(api, error);
  }
}

export function getAvailableKeyCount(): number {
  return apiManager.getAvailableCount();
}