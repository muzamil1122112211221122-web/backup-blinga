// Advanced API Manager for Fius
// Primary: Gemini (up to 3 keys, round-robin)
// Secondary: Groq (1-2 keys)

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
  private geminiIndex = 0;
  private groqIndex = 0;
  private failureCooldown = 60000; // 1 minute cooldown after failure

  constructor() {
    this.initializeAPIs();
  }

  private initializeAPIs() {
    console.log('Debug: Initializing APIs...');
    console.log('Debug: GROQ_API_KEY exists?', !!process.env.GROQ_API_KEY);
    console.log('Debug: GEMINI_API_KEY exists?', !!process.env.GEMINI_API_KEY);
    console.log('Debug: GEMINI_API_KEY_2 exists?', !!process.env.GEMINI_API_KEY_2);
    console.log('Debug: GEMINI_API_KEY_3 exists?', !!process.env.GEMINI_API_KEY_3);

    // Primary: Gemini (up to 3 keys)
    for (const envVar of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']) {
      const key = process.env[envVar];
      if (key) {
        this.apis.push({ key, provider: 'gemini', isWorking: true, failureCount: 0, requestCount: 0 });
        console.log(`Debug: Added Gemini key (${envVar})`);
      }
    }

    // Secondary: Groq (2 keys)
    for (const envVar of ['GROQ_API_KEY', 'GROQ_API_KEY_2']) {
      const key = process.env[envVar];
      if (key) {
        this.apis.push({ key, provider: 'groq', isWorking: true, failureCount: 0, requestCount: 0 });
        console.log(`Debug: Added Groq key (${envVar})`);
      }
    }

    // OpenRouter keys (legacy fallback)
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`OPENROUTER_API_KEY_${i}`];
      if (key) {
        this.apis.push({ key, provider: 'openrouter', isWorking: true, failureCount: 0, requestCount: 0 });
      }
    }

    // OpenAI (legacy fallback)
    if (process.env.OPENAI_API_KEY) {
      this.apis.push({ key: process.env.OPENAI_API_KEY, provider: 'openai', isWorking: true, failureCount: 0, requestCount: 0 });
    }

    console.log(`API Manager initialized with ${this.apis.length} APIs:`,
      this.apis.map(api => `${api.provider} (${api.key.slice(0, 8)}...)`));
  }

  // Add a Gemini key at runtime (called when keys are saved via GUI)
  addGeminiKey(key: string): void {
    const trimmed = key.trim();
    if (!trimmed) return;
    const existing = this.apis.find(a => a.key === trimmed && a.provider === 'gemini');
    if (existing) {
      // Re-enable if it was marked failed
      existing.isWorking = true;
      existing.failureCount = 0;
      return;
    }
    this.apis.push({ key: trimmed, provider: 'gemini', isWorking: true, failureCount: 0, requestCount: 0 });
    console.log(`Gemini key added at runtime: ${trimmed.slice(0, 8)}...`);
  }

  // Replace all gemini keys with new set
  setGeminiKeys(keys: string[]): void {
    this.apis = this.apis.filter(a => a.provider !== 'gemini');
    this.geminiIndex = 0;
    for (const k of keys) {
      if (k.trim()) this.addGeminiKey(k.trim());
    }
  }

  // Get status of all configured keys
  getKeyStatus(): Array<{ provider: string; maskedKey: string; isWorking: boolean; failureCount: number }> {
    return this.apis.map(api => ({
      provider: api.provider,
      maskedKey: api.key.slice(0, 8) + '...' + api.key.slice(-4),
      isWorking: this.isAPIAvailable(api),
      failureCount: api.failureCount,
    }));
  }

  getGeminiKeys(): string[] {
    return this.apis.filter(a => a.provider === 'gemini').map(a => a.key);
  }

  // Get the best available API — Gemini first, then Groq, then others
  getBestChatAPI(): APIKey | null {
    const gemini = this.getNextGeminiAPI();
    if (gemini) return gemini;

    const groq = this.getNextGroqAPI();
    if (groq) return groq;

    const openRouter = this.getNextOpenRouterAPI();
    if (openRouter) return openRouter;

    const openai = this.getWorkingAPI('openai');
    if (openai) return openai;

    console.error('No working chat APIs available!');
    return null;
  }

  // Get Gemini API (round-robin across up to 3 keys)
  private getNextGeminiAPI(): APIKey | null {
    const geminiAPIs = this.apis.filter(api => api.provider === 'gemini' && this.isAPIAvailable(api));
    if (geminiAPIs.length === 0) return null;
    const selected = geminiAPIs[this.geminiIndex % geminiAPIs.length];
    this.geminiIndex++;
    this.markAPIUsed(selected);
    return selected;
  }

  // Get Groq API (round-robin)
  private getNextGroqAPI(): APIKey | null {
    const groqAPIs = this.apis.filter(api => api.provider === 'groq' && this.isAPIAvailable(api));
    if (groqAPIs.length === 0) return null;
    const selected = groqAPIs[this.groqIndex % groqAPIs.length];
    this.groqIndex++;
    this.markAPIUsed(selected);
    return selected;
  }

  // Get Gemini API for image generation
  getImageAPI(): APIKey | null {
    return this.getNextGeminiAPI() || this.getWorkingAPI('openai');
  }

  private getWorkingAPI(provider: 'groq' | 'openrouter' | 'openai' | 'gemini'): APIKey | null {
    const api = this.apis.find(api => api.provider === provider && this.isAPIAvailable(api));
    if (api) this.markAPIUsed(api);
    return api || null;
  }

  private getNextOpenRouterAPI(): APIKey | null {
    const available = this.apis.filter(api => api.provider === 'openrouter' && this.isAPIAvailable(api));
    if (available.length === 0) {
      this.resetFailedAPIs('openrouter');
      const reset = this.apis.filter(api => api.provider === 'openrouter' && this.isAPIAvailable(api));
      if (reset.length === 0) return null;
      this.markAPIUsed(reset[0]);
      return reset[0];
    }
    const selected = available[0];
    this.markAPIUsed(selected);
    return selected;
  }

  private isAPIAvailable(api: APIKey): boolean {
    if (!api.isWorking) {
      if (api.lastFailure && Date.now() - api.lastFailure.getTime() > this.failureCooldown) {
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

  markAPIFailed(api: APIKey, error: string) {
    api.failureCount++;
    api.lastFailure = new Date();
    if (api.failureCount >= 3) {
      api.isWorking = false;
      console.log(`Marking API as failed: ${api.provider} (${api.failureCount} failures)`);
    }
    console.log(`API failure recorded: ${api.provider} - ${error}`);
  }

  private resetFailedAPIs(provider: 'groq' | 'openrouter' | 'openai' | 'gemini') {
    const failed = this.apis.filter(api => api.provider === provider && !api.isWorking);
    failed.forEach(api => { api.isWorking = true; api.failureCount = Math.max(0, api.failureCount - 2); });
    if (failed.length > 0) console.log(`Reset ${failed.length} failed ${provider} APIs`);
  }

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

  getAvailableCount(provider?: 'groq' | 'openrouter' | 'openai' | 'gemini'): number {
    const filtered = provider ? this.apis.filter(api => api.provider === provider) : this.apis;
    return filtered.filter(api => this.isAPIAvailable(api)).length;
  }
}

export const apiManager = new APIManager();

export function getNextApiKey(preferGroq: boolean = true): { key: string; provider: 'groq' | 'openrouter' | 'openai' | 'gemini' } {
  const api = apiManager.getBestChatAPI();
  if (!api) throw new Error('No working APIs available');
  return { key: api.key, provider: api.provider };
}

export function markKeyFailed(key: string, error: string) {
  const api = (apiManager as any)['apis'].find((a: any) => a.key === key);
  if (api) apiManager.markAPIFailed(api, error);
}

export function getAvailableKeyCount(): number {
  return apiManager.getAvailableCount();
}
