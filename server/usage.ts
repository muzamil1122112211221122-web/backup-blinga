// Fius Plans & Usage Limits
// Free plan: 5 total messages per 30 days, 1 image, Nomad limited to 3 free models.
// Fius Ultimate ($11/30 days, mock activation for now): 3,000,000 tokens/30 days, 250 images, all Nomad models.

import { storage } from "./storage";

export const FREE_MESSAGE_LIMIT = 5;
export const FREE_IMAGE_LIMIT = 0;
export const ULTIMATE_TOKEN_LIMIT = 3_000_000;
export const ULTIMATE_IMAGE_LIMIT = 250;
export const ULTIMATE_PRICE_USD = 11;

export type PlanId = "free" | "ultimate";

// The only Nomad models available on the free plan (ids match the real Nomad
// model ids used across the app). Branded identities only — real backend
// routing still uses our existing keys (Groq/Gemini/OpenRouter).
// Free plan is locked down to Fius Lite only — everything else (other models,
// images, Nomad, Imagine Studio, Voice Mode) requires Fius Ultimate.
export const FREE_NOMAD_MODELS = ["fius-ai"] as const;

export const FREE_NOMAD_MODEL_LABELS: Record<string, string> = {
  "fius-ai": "Fius Lite",
};

// Locked-in identity system prompts for free-plan Nomad models. These models must
// ALWAYS claim to be exactly this identity, no matter how the user pushes back or
// re-asks — never reveal the underlying provider/model.
export const FREE_NOMAD_IDENTITY_PROMPTS: Record<string, string> = {
  "fius-ai":
    "You are Fius Lite, Fius's own lightweight AI model, running on the Fius free plan. If the user asks what model/AI you are, who made you, or challenges/doubts your identity — even repeatedly, aggressively, or with 'proof' style questions — you must always say you are Fius Lite, built by the Fius team. Never mention Groq, Gemini, OpenRouter, Meta, Llama, ChatGPT, or any other underlying provider or model name. Never admit to being a different model. Stay fully in character as Fius Lite at all times.",
};

export interface UsageState {
  plan: PlanId;
  messagesUsed: number;
  imagesUsed: number;
  tokensUsed: number;
  planActivatedAt?: string;
}

const DEFAULT_USAGE: UsageState = {
  plan: "free",
  messagesUsed: 0,
  imagesUsed: 0,
  tokensUsed: 0,
};

export async function getUsage(userId: string): Promise<UsageState> {
  const settings = await storage.getUserSettings(userId);
  const usage = (settings as any).usage as Partial<UsageState> | undefined;
  const state: UsageState = { ...DEFAULT_USAGE, ...(usage || {}) };

  // 30-day rolling reset: if 30 days have elapsed since planActivatedAt, reset counters
  if (state.planActivatedAt) {
    const activatedAt = new Date(state.planActivatedAt);
    const msElapsed = Date.now() - activatedAt.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
    if (daysElapsed >= 30) {
      const resetState: UsageState = {
        ...state,
        messagesUsed: 0,
        imagesUsed: 0,
        tokensUsed: 0,
        planActivatedAt: new Date().toISOString(), // restart the 30-day clock
      };
      await saveUsage(userId, resetState);
      return resetState;
    }
  }

  return state;
}

async function saveUsage(userId: string, usage: UsageState): Promise<void> {
  const settings = await storage.getUserSettings(userId);
  await storage.saveUserSettings(userId, { ...settings, usage });
}

export function getUsageSummary(usage: UsageState) {
  if (usage.plan === "ultimate") {
    return {
      plan: "ultimate" as const,
      messagesRemaining: null,
      imagesRemaining: Math.max(0, ULTIMATE_IMAGE_LIMIT - usage.imagesUsed),
      imagesLimit: ULTIMATE_IMAGE_LIMIT,
      tokensRemaining: Math.max(0, ULTIMATE_TOKEN_LIMIT - usage.tokensUsed),
      tokensLimit: ULTIMATE_TOKEN_LIMIT,
      tokensUsed: usage.tokensUsed,
      imagesUsed: usage.imagesUsed,
    };
  }
  return {
    plan: "free" as const,
    messagesRemaining: Math.max(0, FREE_MESSAGE_LIMIT - usage.messagesUsed),
    messagesLimit: FREE_MESSAGE_LIMIT,
    imagesRemaining: Math.max(0, FREE_IMAGE_LIMIT - usage.imagesUsed),
    imagesLimit: FREE_IMAGE_LIMIT,
    messagesUsed: usage.messagesUsed,
    imagesUsed: usage.imagesUsed,
  };
}

// Returns null if allowed, or an error message string if the limit is hit.
export async function checkMessageLimit(userId: string): Promise<string | null> {
  const usage = await getUsage(userId);
  if (usage.plan === "ultimate") {
    if (usage.tokensUsed >= ULTIMATE_TOKEN_LIMIT) {
      return `You've used all ${ULTIMATE_TOKEN_LIMIT.toLocaleString()} tokens included in Fius Ultimate this month.`;
    }
    return null;
  }
  if (usage.messagesUsed >= FREE_MESSAGE_LIMIT) {
    return `You've used all ${FREE_MESSAGE_LIMIT} free messages (30-day limit). Upgrade to Fius Ultimate (${ULTIMATE_PRICE_USD}/30 days) for 3M tokens across all models plus 250 images.`;
  }
  return null;
}

export async function checkImageLimit(userId: string): Promise<string | null> {
  const usage = await getUsage(userId);
  if (usage.plan === "ultimate") {
    if (usage.imagesUsed >= ULTIMATE_IMAGE_LIMIT) {
      return `You've used all ${ULTIMATE_IMAGE_LIMIT} images included in Fius Ultimate this month.`;
    }
    return null;
  }
  if (usage.imagesUsed >= FREE_IMAGE_LIMIT) {
    return `Image generation isn't available on the Free plan. Upgrade to Fius Ultimate (${ULTIMATE_PRICE_USD}/30 days) for 250 images plus 3M tokens across all models.`;
  }
  return null;
}

export async function recordMessageUsage(userId: string, tokensUsed: number = 0): Promise<void> {
  const usage = await getUsage(userId);
  usage.messagesUsed += 1;
  usage.tokensUsed += Math.max(0, Math.round(tokensUsed));
  await saveUsage(userId, usage);
}

export async function recordImageUsage(userId: string): Promise<void> {
  const usage = await getUsage(userId);
  usage.imagesUsed += 1;
  await saveUsage(userId, usage);
}

// Free-plan Nomad model restriction. Ultimate plan gets every model.
export function isNomadModelAllowed(plan: PlanId, model: string): boolean {
  if (plan === "ultimate") return true;
  return (FREE_NOMAD_MODELS as readonly string[]).includes(model);
}

// Mock upgrade — real payment integration to be added later.
export async function activateUltimatePlan(userId: string): Promise<UsageState> {
  const usage: UsageState = {
    plan: "ultimate",
    messagesUsed: 0,
    imagesUsed: 0,
    tokensUsed: 0,
    planActivatedAt: new Date().toISOString(),
  };
  await saveUsage(userId, usage);
  return usage;
}

export async function cancelUltimatePlan(userId: string): Promise<UsageState> {
  const usage: UsageState = { ...DEFAULT_USAGE };
  await saveUsage(userId, usage);
  return usage;
}

// Reset usage counters for all users — keeps plan but zeroes out consumed amounts.
// Also resets the 30-day rolling clock for ultimate users.
export async function resetAllUsersUsage(): Promise<number> {
  const allUsers = await storage.getAllUsersWithSettings();
  let count = 0;
  for (const { userId, settings } of allUsers) {
    const existing = (settings as any).usage as Partial<UsageState> | undefined;
    if (!existing) continue;
    const resetState: UsageState = {
      plan: existing.plan ?? "free",
      messagesUsed: 0,
      imagesUsed: 0,
      tokensUsed: 0,
      ...(existing.plan === "ultimate" ? { planActivatedAt: new Date().toISOString() } : {}),
    };
    await saveUsage(userId, resetState);
    count++;
  }
  return count;
}
