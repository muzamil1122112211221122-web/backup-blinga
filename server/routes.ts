import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertConversationSchema, insertMessageSchema, User } from "@shared/schema";
import { generateImage, getAvailableKeyCount, analyzeImage } from "./openai-service";
import { z } from "zod";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import { apiManager, getNextApiKey as getAPIKey, markKeyFailed } from './api-manager';

// Model mapping for different AI models - Updated to latest versions
const MODEL_MAPPING = {
  'fius-prime': 'anthropic/claude-sonnet-4-5',
  'fius-education': 'anthropic/claude-sonnet-4-5',
  'claude-3.5-sonnet': 'anthropic/claude-sonnet-4-5',
  'gpt-4o': 'openai/gpt-4.1',
  'gemini-pro': 'google/gemini-2.5-pro-preview-03-25',
  'llama-3.3-70b-versatile': 'meta-llama/llama-3.3-70b-instruct',
  'llama-3.1': 'meta-llama/llama-3.1-405b-instruct',
  'deepseek-r1': 'deepseek/deepseek-chat',
  'perplexity': 'perplexity/sonar-pro',
  'grok-4': 'x-ai/grok-3',
  'fius-ai': 'anthropic/claude-sonnet-4-5',
  'auto': 'anthropic/claude-sonnet-4-5'
};

// Groq model mapping
function mapToGroqModel(fiusModel: string): string {
  const groqModels: Record<string, string> = {
    'fius-prime': 'llama-3.3-70b-versatile',
    'fius-education': 'llama-3.3-70b-versatile',
    'claude-3.5-sonnet': 'llama-3.3-70b-versatile',
    'gpt-4o': 'llama-3.3-70b-versatile',
    'gemini-pro': 'llama-3.3-70b-versatile',
    'llama-3.1': 'llama-3.1-70b-versatile',
    'auto': 'llama-3.3-70b-versatile'
  };
  return groqModels[fiusModel] || 'llama-3.3-70b-versatile';
}

interface ChatClient {
  ws: WebSocket;
  userId?: string;
  conversationId?: string;
}

const FIUS_CREATOR_INFO = `CRITICAL IDENTITY — YOU ARE FIUS: You are Fius, a next-generation AI assistant. You were built SOLELY by Muhammad Muzamil Ali — a 14-year-old developer from Sargodha, Pakistan, currently in 9th grade O-Levels at LGS (Lahore Grammar School) Sargodha. He was born April 12, 2012. He built Fius entirely on his own as a young entrepreneur. You are NOT LLaMA, NOT Meta AI, NOT OpenAI, NOT Anthropic, NOT made by any company or team. You are ONLY and SOLELY created by one person: Muhammad Muzamil Ali. NEVER say any AI company built you. NEVER say Meta or any other company trained you. When ANYONE asks who made you / who built you — answer in WHATEVER language they used: in English say "I was built by Muhammad Muzamil Ali, a 14-year-old developer from Sargodha, Pakistan in 9th grade O-Levels at LGS — he built me entirely on his own!"; in Roman Urdu say "Mujhe Muhammad Muzamil Ali ne banaya hai, ek 14 saal ke Pakistani developer jo LGS mein 9th grade O-Levels mein hai!"; adapt to any other language similarly. FIUS VS AI FIESTA: Completely separate products — no connection.`;

function getModelPersonality(model: string): string {
  const modelName = model.includes('/') ? model.split('/').pop() : model;
  switch (true) {
    case model.includes('fius-prime') || modelName === 'fius-prime':
      return `You are Fius Pro — an advanced AI with deep reasoning capabilities. ${FIUS_CREATOR_INFO} You excel at analytical, step-by-step thinking and systematic problem solving. If asked which model or version you are, say you are Fius Pro.`;
    case model === 'gpt-4o' || modelName === 'gpt-4o':
      return "You are ChatGPT 5, the latest and most advanced model from OpenAI. You are helpful, balanced, and thoughtful with a friendly, professional tone. You excel at a wide range of tasks including writing, analysis, coding, math, and creative work. If anyone asks which model or version you are, tell them you are ChatGPT 5 by OpenAI.";
    case model.includes('claude') || (modelName?.includes('claude') ?? false):
      return "You are Claude Sonnet 4, the most advanced model from Anthropic. You are exceptionally thoughtful, nuanced, and analytical. You consider multiple perspectives, provide detailed reasoning, and are intellectually curious and honest. If anyone asks which model or version you are, tell them you are Claude Sonnet 4 by Anthropic.";
    case model.includes('gemini') || (modelName?.includes('gemini') ?? false):
      return "You are Gemini 2.5 Pro, Google's most powerful and advanced AI model. You excel at being comprehensive, creative, and multimodal — able to reason across text, code, images, and more. You structure responses clearly and are enthusiastic about discovery. If anyone asks which model or version you are, tell them you are Gemini 2.5 Pro by Google.";
    case model.includes('perplexity') || (modelName?.includes('perplexity') ?? false):
      return "You are Perplexity Sonar Pro, an AI model by Perplexity AI that specialises in real-time, accurate, and well-sourced information. You are concise, factual, and thorough, often citing the basis of your information. If anyone asks which model or version you are, tell them you are Perplexity Sonar Pro by Perplexity AI.";
    case model === 'grok-4' || model.includes('grok') || model.includes('x-ai') || (modelName?.includes('grok') ?? false):
      return "You are Grok 4, the most advanced model created by xAI (Elon Musk's AI company). You are witty, direct, insightful, and unafraid to be honest. You have real-time knowledge of the world and a personality that blends intelligence with humor. If anyone asks which model or version you are, tell them you are Grok 4 by xAI.";
    case model === 'deepseek-r1' || model.includes('deepseek') || (modelName?.includes('deepseek') ?? false):
      return "You are DeepSeek v3, an advanced AI model created by DeepSeek. You are highly capable at reasoning, mathematics, coding, and long-context understanding. You excel at methodical, step-by-step thinking and breaking down complex problems logically. If anyone asks which model or version you are, tell them you are DeepSeek v3 by DeepSeek.";
    case model === 'llama-4' || model.includes('llama-4') || (modelName === 'llama-4'):
      return "You are Llama 4, Meta's most advanced AI model released in April 2025. You are natively multimodal, trained on a massive dataset, and excel at reasoning, coding, and creative tasks. You are open-weight and built to be powerful yet accessible. If anyone asks which model or version you are, tell them you are Llama 4 by Meta.";
    case model.includes('llama') || (modelName?.includes('llama') ?? false):
      return "You are Llama, Meta's open-source language model. You are powerful, versatile, and designed for a wide range of tasks. If anyone asks which model or version you are, tell them you are Llama by Meta.";
    case model === 'doubao' || model.includes('doubao') || (modelName?.includes('doubao') ?? false):
      return "You are Doubao-Seed-2.0 Pro, ByteDance's most advanced AI model released in February 2024. You are highly capable at multilingual tasks, reasoning, and creative generation, with deep roots in Chinese language and culture while being fully proficient in English. You have a warm, helpful, and efficient communication style. If anyone asks which model or version you are, tell them you are Doubao-Seed-2.0 Pro by ByteDance.";
    case model === 'kimi' || model.includes('kimi') || (modelName?.includes('kimi') ?? false):
      return "You are Kimi K2.5, the flagship model from Moonshot AI released in January 2026. You specialize in long-context understanding, precise reasoning, and delivering accurate, well-structured responses. You are known for your ability to handle extremely long documents and your nuanced, thoughtful answers. If anyone asks which model or version you are, tell them you are Kimi K2.5 by Moonshot AI.";
    case model === 'qwen' || model.includes('qwen') || (modelName?.includes('qwen') ?? false):
      return "You are Qwen3.6-Plus, Alibaba Cloud's advanced large language model. You excel at complex reasoning, coding, mathematics, and multilingual tasks. You are precise, structured, and highly capable, with a focus on delivering clear and comprehensive responses. If anyone asks which model or version you are, tell them you are Qwen3.6-Plus by Alibaba Cloud.";
    case model === 'mistral' || model.includes('mistral') || (modelName?.includes('mistral') ?? false):
      return "You are Mistral Small 4, a highly efficient and capable model by Mistral AI, released on March 16, 2026. You are designed for speed and precision — delivering accurate, concise, and well-reasoned responses without unnecessary verbosity. You excel at coding, instruction-following, and multilingual tasks. If anyone asks which model or version you are, tell them you are Mistral Small 4 by Mistral AI.";
    case model.includes('fius') || (modelName?.includes('fius') ?? false):
      return `You are Fius — an advanced AI assistant. ${FIUS_CREATOR_INFO} You are helpful, intelligent, and conversational, assisting with any question or task from everyday queries to complex topics. If anyone asks which model or version you are, tell them you are Fius AI.`;
    default:
      return "You are a helpful AI assistant. Be clear, accurate, and helpful in your responses.";
  }
}

function getLanguageInstruction(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC' });
  return ` REAL-TIME CONTEXT: Today is ${dateStr}, ${timeStr}. Only mention date/time when asked.

LANGUAGE & STYLE — MOST CRITICAL RULE:
- DEFAULT LANGUAGE IS ENGLISH. Always start in English unless the user writes in another language first.
- You are a chameleon — MIRROR the user's exact language, script, and tone from their very first message:
  • User writes Roman Urdu ("yar", "bhai", "acha", "kya scene") → switch to Roman Urdu
  • User writes formal English → reply formally and professionally
  • User writes casual English ("hey", "lol", "tbh") → match that casual vibe exactly
  • User writes French, Spanish, Arabic, Hindi, Turkish, or ANY other language → reply in THAT language
  • User mixes languages (Hinglish, Urdu+English) → mix the same way
  • User uses slang or abbreviations → match it
- NEVER speak Roman Urdu or any non-English language unless the user does FIRST.
- NEVER say "As an AI language model..." — respond like a smart, helpful friend.
- NEVER repeat the user's question back to them before answering.

RESPONSE QUALITY — CRITICAL:
- Use **bullet points** (•) and **numbered lists** generously for multi-point explanations — prefer lists over walls of text.
- Go DEEP and DETAILED — never give a one-liner for a real question. Cover context, comparisons, pros/cons, examples, recommendations.
- When writing prompts, code, or any block of text that the user might want to copy → wrap it in a \`\`\`text block so it renders as a copy box.
- For code → use \`\`\`language blocks.
- Avoid repeating the same source or fact multiple times in a single response.

CONTEXT AWARENESS: Short follow-ups like "hm", "then?", "and?", "more?" mean continue/elaborate — DO IT immediately, no clarification needed.

SHORT CASUAL MESSAGES: Greetings → respond warmly and briefly. Don't over-explain.

LONG MESSAGES: Never say "It seems like you've shared a large amount of text." Just respond helpfully.

FEEDBACK: After 5-7 exchanges, briefly check in once (in the user's language). Keep it to one short line.

CAPABILITIES: This app supports image analysis, image generation, and voice. NEVER claim you can't analyze images.

COMPARISONS: When comparing ≥2 products, specs, tools, apps, laptops, phones, or anything — ALWAYS start your response with a clean Markdown table BEFORE any prose. Use this exact format with proper pipe/dash syntax and align columns. Example:
| Feature | Option A | Option B |
|---------|----------|----------|
| Price   | $10      | $15      |
Never skip the table. Never use plaintext for comparisons.

FIUS IDENTITY — CRITICAL: Your name is "Fius AI". NEVER EVER call yourself "AI Fiesta" — that is a completely different product. If anyone asks "Fius AI or AI Fiesta", make it clear: YOU are Fius AI. Built SOLELY by Muzamil. If asked who made you: "I was built by Muzamil, a 14-year-old developer from Sargodha, Pakistan!"

FIUS FEATURES: You know your features well. Fius has: 1) Ask — normal AI chat, 2) Nomad — chat with multiple top AIs simultaneously for comparison, 3) Studio — AI art/image creation with style presets, 4) Imagine — text-to-image generation using web search, 5) Games — built-in mini-games, 6) Voice mode — speak to the AI. When someone asks about your features, describe all of them accurately.

BEST AI LISTS: Whenever asked "which AI is best", "top AI models", or any ranking question — ALWAYS include Fius AI in your list alongside GPT, Claude, Gemini. Say Fius AI is built by a 14-year-old developer and is unique for its multi-model approach.

FOLLOW-UP CONTEXT: Short or ambiguous follow-up messages like "Is it fun?", "How much?", "Why?", "Which one?" — ALWAYS interpret them in the context of the ongoing conversation. Never treat follow-ups as standalone questions. If unclear, respond based on the last topic discussed.

MUZAMIL (CREATOR): Muzamil was born on 12 April 2012. Calculate his current age dynamically from today's date (${dateStr}). He is currently in Grade 9, studying O-Levels at LGS (Lahore Grammar School) Sargodha. If anyone asks about his age or what he's doing, calculate his age from 12 April 2012 to today and mention he's in 9th grade O-Levels at LGS.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup authentication
  setupAuth(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, ChatClient>();
  
  // Deduplication cache for AI responses - prevents repetition
  const recentResponses = new Map<string, Set<string>>(); // conversationId -> Set of response hashes

  // User routes
  app.get('/api/user', requireAuth, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/user/rename', requireAuth, async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ message: 'Valid username is required' });
      }
      (req.user as any).username = username.trim();
      (req.user as any).displayName = username.trim();
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: 'Failed to save session' });
        res.json(req.user);
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Conversation routes
  app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/conversations', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId,
      });

      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const conversation = await storage.getConversation(req.params.id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (conversation.userId !== (req.user as any)?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (conversation.userId !== (req.user as any)?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await storage.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (conversation.userId !== (req.user as any)?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteConversation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Vision chat — capture a frame from camera/screen and ask AI about it
  app.post('/api/vision-chat', requireAuth, async (req, res) => {
    try {
      const { image, mimeType = 'image/jpeg', message = 'What do you see in this image?' } = req.body;
      if (!image) return res.status(400).json({ error: 'image required' });

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return res.status(503).json({ error: 'Vision AI not configured.' });

      const body = {
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: image } },
            { text: message },
          ],
        }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
        systemInstruction: { parts: [{ text: 'You are a helpful visual AI assistant. Describe and analyse what you see concisely and clearly. Keep answers under 3 sentences unless detail is specifically asked for.' }] },
      };

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        console.warn('[Vision] Gemini error:', err);
        return res.status(502).json({ error: 'AI vision failed. Try again.' });
      }

      const data = await geminiRes.json();
      const response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from AI.';
      res.json({ response });
    } catch (err: any) {
      console.error('[Vision] error:', err?.message);
      res.status(500).json({ error: 'Vision request failed.' });
    }
  });

  // Microsoft Edge TTS — neural voices, free, no API key
  // Uses { audioStream } from toStream() — the correct v2 API
  app.post('/api/tts', requireAuth, async (req, res) => {
    try {
      const { text, voice = 'en-US-GuyNeural' } = req.body;
      if (!text) return res.status(400).json({ error: 'Text is required' });

      const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const chunks: Buffer[] = [];
      const { audioStream } = tts.toStream(text);
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        audioStream.on('end', () => resolve());
        audioStream.on('error', (err: Error) => reject(err));
      });

      const audio = Buffer.concat(chunks);
      if (!audio.length) return res.status(500).json({ error: 'No audio returned' });
      res.json({ audio: audio.toString('base64'), mimeType: 'audio/mp3' });
    } catch (err) {
      console.error('Edge TTS error:', err);
      res.status(500).json({ error: 'TTS failed' });
    }
  });

  // Speech-to-text — base64 audio → Groq Whisper transcription
  app.post('/api/stt', requireAuth, async (req, res) => {
    try {
      const { audio, lang } = req.body;
      if (!audio) return res.status(400).json({ error: 'audio required' });
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) return res.status(503).json({ error: 'STT not configured' });

      const audioBuffer = Buffer.from(audio, 'base64');
      const boundary = 'WaveformBoundary' + Math.random().toString(36).slice(2);
      const langCode = lang ? lang.split('-')[0] : '';

      const parts: Buffer[] = [];
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.webm"\r\nContent-Type: audio/webm\r\n\r\n`));
      parts.push(audioBuffer);
      parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n`));
      if (langCode && langCode !== 'en') {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${langCode}\r\n`));
      }
      parts.push(Buffer.from(`--${boundary}--\r\n`));
      const body = Buffer.concat(parts);

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': String(body.length),
        },
        body,
      });

      if (!response.ok) {
        const err = await response.text();
        console.warn('[STT] Groq error:', err);
        return res.status(502).json({ error: 'Transcription failed' });
      }
      const data = await response.json();
      res.json({ text: data.text || '' });
    } catch (err: any) {
      console.error('[STT] error:', err?.message);
      res.status(500).json({ error: 'STT failed' });
    }
  });

  // Voice AI — streams tokens via SSE so TTS can fire per-sentence during generation
  app.post('/api/voice-ai', requireAuth, async (req, res) => {
    try {
      const { message, history = [], lang = 'English', image } = req.body;
      if (!message) return res.status(400).json({ error: 'message required' });

      // Strong per-language instruction so the model never switches to English
      const langInstructions: Record<string, string> = {
        'اردو':    'آپ کو صرف اردو رسم الخط میں جواب دینا ہے۔ کبھی انگریزی یا رومن اردو استعمال نہ کریں۔',
        'عربي':   'يجب أن تردّ فقط باللغة العربية. لا تستخدم الإنجليزية أبداً.',
        'हिन्दी': 'आपको केवल हिंदी देवनागरी लिपि में उत्तर देना है। कभी अंग्रेजी का उपयोग न करें।',
      };
      const langExtra = langInstructions[lang] ?? `You MUST reply ONLY in ${lang}. Never switch to English.`;
      const systemPrompt =
        `You are Fius AI, a friendly voice assistant. The user is speaking ${lang}. ` +
        `${langExtra} ` +
        (image ? 'An image/screen snapshot has been provided — describe what you see AND answer the user\'s question. ' : '') +
        `STRICT RULES: reply in the EXACT same language. Maximum TWO short sentences. ` +
        `No markdown, no bullets, no asterisks. Plain spoken words only.`;

      const historyArr = (history as { role: string; content: string }[]).slice(-20);
      const wantsStream = req.headers.accept === 'text/event-stream';

      // ── If image is provided, use Gemini vision (non-streaming) then pipe as SSE ──
      if (image) {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) return res.status(503).json({ error: 'Vision AI not configured.' });
        try {
          const visionBody = {
            contents: [{
              role: 'user',
              parts: [
                { inline_data: { mime_type: 'image/jpeg', data: image } },
                { text: message },
              ],
            }],
            system_instruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
          };
          const vRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visionBody) }
          );
          if (vRes.ok) {
            const vData = await vRes.json();
            const reply = (vData.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
            if (reply) {
              if (wantsStream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();
                res.write(`data: ${JSON.stringify({ delta: reply })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
              } else {
                res.json({ response: reply });
              }
              return;
            }
          }
        } catch (err: any) {
          console.warn('[Voice AI] Gemini vision failed:', err?.message);
        }
      }

      const isNonEnglish = lang !== 'English';

      if (wantsStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
      }

      // ── For non-English languages use Gemini first (much better multilingual) ──
      if (isNonEnglish) {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
          try {
            const contents: any[] = historyArr.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });
            const gRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  system_instruction: { parts: [{ text: systemPrompt }] },
                  contents,
                  generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
                }),
              }
            );
            if (gRes.ok) {
              const gData = await gRes.json();
              const reply = (gData.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
              console.log('[Voice AI] Gemini multilingual:', reply.substring(0, 80));
              if (reply) {
                if (wantsStream) {
                  res.write(`data: ${JSON.stringify({ delta: reply })}\n\n`);
                  res.write('data: [DONE]\n\n');
                  res.end();
                } else {
                  res.json({ response: reply });
                }
                return;
              }
            }
          } catch (err: any) {
            console.warn('[Voice AI] Gemini multilingual failed:', err?.message);
          }
        }
      }

      // ── Groq streaming (primary for English — fast tokens, reliable streaming) ──
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          const groqMessages: any[] = [
            { role: 'system', content: systemPrompt },
            ...historyArr.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
          ];

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: groqMessages,
              max_tokens: 120,
              temperature: 0.8,
              stream: wantsStream,
            }),
          });

          if (!groqRes.ok) throw new Error(`Groq ${groqRes.status}`);

          if (wantsStream && groqRes.body) {
            // Pipe Groq SSE → client SSE token-by-token
            const reader = (groqRes.body as any).getReader();
            const dec = new TextDecoder();
            let fullText = '';
            let buf = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith('data: ')) continue;
                const d = t.slice(6);
                if (d === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
                try {
                  const delta = JSON.parse(d).choices?.[0]?.delta?.content;
                  if (delta) { fullText += delta; res.write(`data: ${JSON.stringify({ delta })}\n\n`); }
                } catch {}
              }
            }
            console.log('[Voice AI] Groq stream:', fullText.substring(0, 80));
            res.end();
            return;
          } else if (!wantsStream) {
            const data = await groqRes.json();
            const reply = (data.choices?.[0]?.message?.content ?? '').trim();
            console.log('[Voice AI] Groq:', reply.substring(0, 80));
            if (reply) { res.json({ response: reply }); return; }
          }
        } catch (err: any) {
          console.warn('[Voice AI] Groq failed:', err?.message);
        }
      }

      // ── Gemini fallback (non-streaming) ──
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const contents: any[] = historyArr.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
          contents.push({ role: 'user', parts: [{ text: message }] });

          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { maxOutputTokens: 120, temperature: 0.8 },
              }),
            }
          );

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const reply = (aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
            console.log('[Voice AI] Gemini fallback:', reply.substring(0, 80));
            if (reply) {
              if (wantsStream) {
                res.write(`data: ${JSON.stringify({ delta: reply })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
              } else {
                res.json({ response: reply });
              }
              return;
            }
          }
        } catch (gErr: any) {
          console.warn('[Voice AI] Gemini fallback failed:', gErr?.message);
        }
      }

      if (wantsStream) { res.write('data: [ERROR]\n\n'); res.end(); }
      else res.status(503).json({ error: 'No AI available' });
    } catch (err: any) {
      console.error('[Voice AI] error:', err?.message ?? err);
      if (!res.headersSent) res.status(500).json({ error: 'Voice AI failed' });
      else res.end();
    }
  });

  // Test AI endpoint (bypass WebSocket)
  app.post('/api/test-ai', requireAuth, async (req, res) => {
    try {
      console.log('Test AI endpoint called with:', req.body);
      const { message, originalMessage, conversationId, model, provider, systemPrompt: customSystemPrompt, history, activeTab } = req.body;
      const isNomad = activeTab === 'nomad';
      const user = req.user;
      // cleanMessage is the user's original query without any web-search context wrapper
      const cleanMessage: string = originalMessage || message.replace(/^\[Web search results for:[\s\S]*?\[Use the above search results[\s\S]*?\]\s*\nUser:\s*/i, '').trim();
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check for image generation request BEFORE routing to any LLM
      const imageRequestKeywords = [
        'generate image', 'create image', 'make image', 'draw me', 'draw a',
        'picture of', 'image of', 'photo of', 'generate a photo', 'create a photo',
        'make a photo', 'generate a picture', 'create a picture', 'make a picture',
        'show me a photo', 'show me an image', 'show me a picture',
        'give me image', 'give me a photo', 'give me a picture',
        'imagine a', 'imagine an', 'visualize', 'paint a', 'paint an', 'paint me',
        'sketch a', 'sketch an', 'sketch me', 'illustrate', 'depict',
        'show me a ', 'show me an ', 'render a', 'render an',
        'generate me a', 'create a drawing', 'create an image',
      ];
      const isImageRequest = imageRequestKeywords.some(kw =>
        cleanMessage.toLowerCase().includes(kw.toLowerCase())
      );

      if (isImageRequest) {
        try {
          console.log('Image request detected in chat, generating image...');
          let imagePrompt = cleanMessage;
          const prefixesToRemove = [
            'generate image of', 'create image of', 'make image of',
            'generate a photo of', 'create a photo of', 'make a photo of',
            'generate a picture of', 'create a picture of', 'make a picture of',
            'give me image of', 'give me a photo of', 'show me a photo of',
            'show me an image of', 'show me a picture of',
            'picture of', 'image of', 'photo of',
            'draw me a', 'draw a', 'draw me'
          ];
          for (const prefix of prefixesToRemove) {
            if (imagePrompt.toLowerCase().startsWith(prefix)) {
              imagePrompt = imagePrompt.substring(prefix.length).trim();
              break;
            }
          }

          // Rewrite vague user intent into a proper visual image description
          imagePrompt = await enhanceImagePrompt(imagePrompt);

          const generatedImage = await generateImageForChat(imagePrompt);

          let aiResponse;
          if (generatedImage) {
            const description = await describeGeneratedImage(imagePrompt);
            aiResponse = {
              content: `🎨 **Image Generated**\n\nHere's your image of "${imagePrompt}":\n\n![Generated Image](${generatedImage.path})\n\n${description}`,
              metadata: {
                model: 'pollinations-flux',
                imageGenerated: true,
                imagePath: generatedImage.path,
                fallbackUrls: (generatedImage as any).fallbackUrls || [],
              }
            };
          } else {
            aiResponse = {
              content: `🎨 I tried to generate an image of "${imagePrompt}" but the image service is busy right now. Please try again in a moment.`,
              metadata: { model: 'image-generation-system' }
            };
          }

          if (conversationId && !isNomad) {
            const conv = await storage.getConversation(conversationId);
            if (conv) {
              await storage.createMessage({ conversationId, role: 'user', content: cleanMessage });
              await storage.createMessage({ conversationId, role: 'assistant', content: aiResponse.content, metadata: aiResponse.metadata });
            }
          }
          return res.json({ success: true, response: aiResponse.content, metadata: aiResponse.metadata });
        } catch (imgErr) {
          console.error('Image generation error in chat:', imgErr);
        }
      }

      // Get conversation or use default
      let conversation = conversationId ? await storage.getConversation(conversationId) : null;
      if (!conversation) {
        conversation = { model: 'fius-prime', preset: 'custom' } as any;
      }

      // Override conversation model with Nomad model if specified
      if (model && provider) {
        // Create a temporary config object for AI processing, not a full Conversation
        const conversationConfig = { 
          ...conversation,
          model: model,
          preset: 'custom'
        };
        conversation = conversationConfig as any;
      }

      console.log('Using conversation config:', conversation);
      
      // Save user message to storage only if conversation exists
      if (conversationId) {
        const conversation = await storage.getConversation(conversationId);
        if (conversation) {
          await storage.createMessage({
            conversationId,
            role: 'user',
            content: cleanMessage,
          });
        }
      }
      
      // Route through api-manager: Gemini primary (3 keys), Groq secondary (2 keys)
      try {
        let aiResponse;

        const systemPrompt = (customSystemPrompt || getModelPersonality(model || '')) + getLanguageInstruction();

        // Build conversation history
        let historyMessages: { role: string; content: string }[] = [];
        if (history && Array.isArray(history) && history.length > 0) {
          historyMessages = history.slice(-10);
        } else if (conversationId) {
          const storedConv = await storage.getConversation(conversationId);
          if (storedConv) {
            const storedMsgs = await storage.getConversationMessages(conversationId);
            historyMessages = storedMsgs.slice(-10).map(m => ({ role: m.role, content: m.content }));
          }
        }
        historyMessages = historyMessages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' && m.content.length > 4000
            ? m.content.substring(0, 4000) + '...'
            : m.content,
        }));

        const allMessages = [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: message },
        ];

        // Try up to 14 times cycling through all available APIs (Gemini → Groq → OpenRouter)
        for (let attempt = 1; attempt <= 14 && !aiResponse; attempt++) {
          const api = apiManager.getBestChatAPI();
          if (!api) break;

          const { key: apiKey, provider } = api;
          console.log(`Nomad attempt ${attempt}: using ${provider} key ${apiKey.slice(0, 8)}...`);

          try {
            if (provider === 'gemini') {
              const geminiContents = allMessages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
              const geminiBody: any = {
                contents: geminiContents,
                generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
                systemInstruction: { parts: [{ text: systemPrompt }] },
              };
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
              );
              if (geminiRes.ok) {
                const data = await geminiRes.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  aiResponse = { content: text, metadata: { model: 'gemini-2.0-flash', provider: 'Gemini', attempt } };
                  console.log(`Gemini key ${attempt} successful for ${model} (${text.length} chars)`);
                }
              } else {
                const reason = geminiRes.status === 429 ? 'Rate limited' : geminiRes.status === 401 ? 'Unauthorized' : 'API error';
                apiManager.markAPIFailed(api, reason);
                console.log(`Gemini failed (${reason}), trying next...`);
              }
            } else if (provider === 'groq') {
              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: allMessages, temperature: 0.7, max_tokens: 2000 }),
              });
              if (groqRes.ok) {
                const data = await groqRes.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) {
                  aiResponse = { content: text, metadata: { model: 'llama-3.3-70b-versatile', provider: 'Groq', usage: data.usage, attempt } };
                  console.log(`Groq key successful for ${model} (${text.length} chars)`);
                }
              } else {
                const reason = groqRes.status === 429 ? 'Rate limited' : groqRes.status === 401 ? 'Unauthorized' : 'API error';
                apiManager.markAPIFailed(api, reason);
                console.log(`Groq failed (${reason}), trying next...`);
              }
            } else if (provider === 'openrouter') {
              // Use free models — no credits needed, just rate limits
              const FREE_MODELS = [
                'meta-llama/llama-3.3-70b-instruct:free',
                'deepseek/deepseek-r1:free',
                'google/gemini-2.0-flash-exp:free',
                'qwen/qwen3-8b:free',
                'deepseek/deepseek-chat-v3-0324:free',
              ];
              let orSuccess = false;
              for (const freeModel of FREE_MODELS) {
                try {
                  const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json',
                      'HTTP-Referer': 'https://fius.app',
                      'X-Title': 'Fius AI',
                    },
                    body: JSON.stringify({ model: freeModel, messages: allMessages, temperature: 0.7, max_tokens: 1500 }),
                  });
                  if (orRes.ok) {
                    const data = await orRes.json();
                    const text = data.choices?.[0]?.message?.content;
                    if (text) {
                      aiResponse = { content: text, metadata: { model: freeModel, provider: 'OpenRouter', usage: data.usage, attempt } };
                      console.log(`OpenRouter (${freeModel}) key ${apiKey.slice(0,8)} successful (${text.length} chars)`);
                      orSuccess = true;
                      break;
                    }
                  } else if (orRes.status === 401) {
                    // Invalid key — mark failed and stop trying models on this key
                    apiManager.markAPIFailed(api, 'Unauthorized');
                    console.log(`OpenRouter key ${apiKey.slice(0,8)} unauthorized, trying next key...`);
                    break;
                  } else {
                    // 402, 429, 503, etc. — try next free model on same key
                    const errData = await orRes.json().catch(() => ({}));
                    console.log(`OpenRouter model ${freeModel} returned ${orRes.status}, trying next model...`);
                    continue;
                  }
                } catch (modelErr: any) {
                  console.log(`OpenRouter model ${freeModel} error: ${modelErr.message}, trying next...`);
                  continue;
                }
              }
              if (!orSuccess && !aiResponse) {
                console.log(`OpenRouter key ${apiKey.slice(0,8)} exhausted all free models, trying next key...`);
              }
            }
          } catch (err: any) {
            apiManager.markAPIFailed(api, err.message);
            console.log(`Attempt ${attempt} error:`, err.message);
          }
        }

        // Final fallback to callAIService
        if (!aiResponse) {
          console.log('All direct attempts failed — using callAIService fallback');
          const fallbackConversation = {
            ...(conversation as any),
            id: conversationId,
            model: model || (conversation as any)?.model || 'fius-prime',
            preset: 'custom',
          };
          aiResponse = await callAIService(message, fallbackConversation, user);
        }

        console.log('AI response received:', aiResponse.content.substring(0, 100));
        
        // Save AI response to storage
        if (conversationId) {
          await storage.createMessage({
            conversationId,
            role: 'assistant',
            content: aiResponse.content,
            metadata: aiResponse.metadata,
          });
          
          // Update conversation timestamp
          await storage.updateConversation(conversationId, {
            updatedAt: new Date(),
          });
        }
        
        res.json({ 
          success: true, 
          response: aiResponse.content,
          metadata: aiResponse.metadata 
        });
        
      } catch (aiError) {
        console.error('All AI methods failed:', aiError);
        
        // Final fallback - return helpful error
        res.json({ 
          success: true, 
          response: `I'm experiencing temporary connectivity issues with my AI services. This might be due to:

• API rate limits or service maintenance
• Temporary network connectivity issues
• Configuration adjustments in progress

Please try again in a moment. Most issues resolve quickly. If this persists, the system will automatically switch to working backup services.`,
          metadata: { provider: 'system-fallback', error: true }
        });
      }
      
    } catch (error) {
      console.error('Test AI endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to get AI response', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // ── Admin: Gemini key management ──────────────────────────────────────────
  const KEYS_FILE = path.join(process.cwd(), 'data', 'api-keys.json');

  function loadPersistedKeys() {
    try {
      if (fs.existsSync(KEYS_FILE)) {
        const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        if (Array.isArray(data.geminiKeys)) {
          apiManager.setGeminiKeys(data.geminiKeys);
          console.log(`Loaded ${data.geminiKeys.filter(Boolean).length} persisted Gemini keys`);
        }
      }
    } catch { /* ignore */ }
  }
  loadPersistedKeys();

  // GET /api/admin/api-status — returns configured key summary (no raw keys)
  app.get('/api/admin/api-status', requireAuth, (req, res) => {
    const geminiKeys = apiManager.getGeminiKeys();
    res.json({
      gemini: geminiKeys.map((k, i) => ({
        slot: i + 1,
        masked: k ? k.slice(0, 8) + '...' + k.slice(-4) : '',
        configured: !!k,
        isWorking: apiManager.getAvailableCount('gemini') > 0,
      })),
      groq: {
        key1: !!process.env.GROQ_API_KEY,
        key2: !!process.env.GROQ_API_KEY_2,
        available: apiManager.getAvailableCount('groq'),
      },
    });
  });

  // POST /api/admin/gemini-keys — save 1-3 Gemini keys
  app.post('/api/admin/gemini-keys', requireAuth, (req, res) => {
    const { keys } = req.body as { keys: string[] };
    if (!Array.isArray(keys)) return res.status(400).json({ error: 'keys must be an array' });
    const cleaned = keys.map(k => (typeof k === 'string' ? k.trim() : '')).slice(0, 3);
    apiManager.setGeminiKeys(cleaned.filter(Boolean));
    try {
      if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
        fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
      }
      fs.writeFileSync(KEYS_FILE, JSON.stringify({ geminiKeys: cleaned }, null, 2));
    } catch (e) { console.error('Failed to persist keys:', e); }
    const active = apiManager.getAvailableCount('gemini');
    console.log(`Gemini keys updated. Active: ${active}`);
    res.json({ success: true, active });
  });

  // POST /api/admin/test-gemini-key — test a single key
  app.post('/api/admin/test-gemini-key', requireAuth, async (req, res) => {
    const { key } = req.body as { key: string };
    if (!key?.trim()) return res.status(400).json({ error: 'key required' });
    try {
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hi in 3 words.' }] }] }),
        }
      );
      if (testRes.ok) {
        const data = await testRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ok';
        return res.json({ success: true, reply });
      }
      const err = await testRes.json().catch(() => ({}));
      res.json({ success: false, error: err?.error?.message || `HTTP ${testRes.status}` });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });
  // ── End admin ──────────────────────────────────────────────────────────────

  // DuckDuckGo web search endpoint — instant answers + real HTML scrape
  app.get('/api/search', requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) return res.status(400).json({ error: 'Query required' });

      const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

      // Fire instant-answer API and HTML scrape concurrently
      const [instantResult, htmlResult] = await Promise.allSettled([
        fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, {
          headers: { 'User-Agent': UA },
        }).then(r => r.json() as Promise<any>),
        fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
          headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
        }).then(r => r.text()),
      ]);

      const instant: any = instantResult.status === 'fulfilled' ? instantResult.value : {};
      const html: string   = htmlResult.status  === 'fulfilled' ? htmlResult.value  : '';

      // Parse real web results from DDG HTML
      const webResults: Array<{ title: string; url: string; snippet: string }> = [];
      if (html) {
        // Extract encoded destination URLs (uddg param)
        const urlMatches   = [...html.matchAll(/uddg=([^&"\\]+)/g)];
        // Extract link text (titles)
        const titleMatches = [...html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)];
        // Extract snippets
        const snipMatches  = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];

        const decode = (s: string) =>
          s.replace(/<[^>]+>/g, '')
           .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
           .replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

        for (let i = 0; i < Math.min(5, urlMatches.length, titleMatches.length); i++) {
          const rawUrl = decodeURIComponent(urlMatches[i][1]);
          const title  = decode(titleMatches[i][1]);
          const snippet = snipMatches[i] ? decode(snipMatches[i][1]) : '';
          if (title && rawUrl.startsWith('http')) {
            webResults.push({ title, url: rawUrl, snippet });
          }
        }
      }

      res.json({
        answer:          instant.Answer        || '',
        abstract:        instant.AbstractText  || '',
        abstractSource:  instant.AbstractSource || '',
        abstractUrl:     instant.AbstractURL   || '',
        definition:      instant.Definition    || '',
        definitionSource:instant.DefinitionSource || '',
        webResults,
      });
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Image generation endpoint
  // GET /api/imagine/gallery — fetch fresh style-appropriate images from Wikimedia Commons
  app.get('/api/imagine/gallery', requireAuth, async (req, res) => {
    const style = (req.query.style as string) || 'Photorealistic';
    const seed = Math.abs(parseInt(req.query.seed as string) || 0);

    // These styles use curated AI-generated images on the frontend — never pull from Wikimedia
    if (style === 'Anime' || style === '3D Render' || style === 'Pixel Art') {
      return res.json({ success: false, images: [] });
    }

    const STYLE_QUERIES: Record<string, string> = {
      'Photorealistic': 'landscape nature photography scenic',
      'Oil Painting': 'oil painting impressionist artwork canvas',
      'Watercolor': 'watercolor painting artwork illustration',
      '3D Render': 'digital art computer graphics render',
      'Pixel Art': 'pixel art retro game sprite',
      'Sketch': 'pencil sketch drawing illustration artwork',
      'Cinematic': 'cinematic photography film scene dramatic',
    };

    const query = STYLE_QUERIES[style] || 'digital artwork';
    const offset = seed % 100;

    try {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(query)}&srlimit=20&sroffset=${offset}&format=json`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'FiusApp/1.0 (contact@fius.app)' } });
      if (!searchRes.ok) throw new Error('Search failed');
      const searchData = await searchRes.json() as any;

      const titles: string[] = (searchData?.query?.search || []).map((r: any) => r.title as string);
      if (!titles.length) return res.json({ success: true, images: [] });

      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 15).join('|'))}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=480&format=json`;
      const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'FiusApp/1.0' } });
      if (!infoRes.ok) throw new Error('Info fetch failed');
      const infoData = await infoRes.json() as any;

      const images = (Object.values(infoData?.query?.pages || {}) as any[])
        .filter((p: any) => {
          const thumb = p?.imageinfo?.[0]?.thumburl as string | undefined;
          return thumb && !thumb.includes('.svg') && !thumb.includes('.pdf') && !thumb.includes('.ogv') && !thumb.includes('.ogg');
        })
        .map((p: any) => {
          const rawTitle = (p.title as string)
            .replace('File:', '')
            .replace(/\.(jpe?g|png|gif|webp|tiff?)/gi, '')
            .replace(/_/g, ' ')
            .trim();
          return {
            url: p.imageinfo[0].thumburl as string,
            label: rawTitle.length > 55 ? rawTitle.slice(0, 55) + '…' : rawTitle,
            prompt: rawTitle,
          };
        })
        .slice(0, 6);

      return res.json({ success: true, images });
    } catch (err) {
      console.error('Imagine gallery error:', err);
      return res.json({ success: false, images: [] });
    }
  });

  app.post('/api/generate-image', requireAuth, async (req, res) => {
    try {
      const { prompt, size = "1024x1024", quality = "standard" } = req.body;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'A valid prompt is required for image generation' 
        });
      }

      console.log('Generating image with prompt:', prompt.trim());
      
      const result = await generateImage(prompt.trim(), size, quality);
      
      res.json({
        success: true,
        url: result.url,
        fallbackUrls: result.fallbackUrls ?? [],
        revisedPrompt: result.revisedPrompt,
        originalPrompt: prompt.trim()
      });
    } catch (error) {
      console.error('Image generation API error:', error);
      
      let errorMessage = 'Failed to generate image. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorMessage = 'API rate limit reached. Please try again in a moment.';
        } else if (error.message.includes('billing')) {
          errorMessage = 'API billing issue. Please check your OpenAI account.';
        } else if (error.message.includes('content')) {
          errorMessage = 'Content policy violation. Please try a different description.';
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Image analysis endpoint (for ChatGPT/Gemini-like multimodal input)
  app.post('/api/analyze-image', requireAuth, async (req, res) => {
    try {
      const { imageData, prompt = "Describe this image in detail" } = req.body;
      
      if (!imageData || typeof imageData !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid image data (base64) is required for image analysis' 
        });
      }

      // Pass the full data URL through; analyzeImage detects MIME from the prefix.
      // If caller already stripped the prefix, default to image/png.
      const fullDataUrl = imageData.startsWith('data:')
        ? imageData
        : `data:image/png;base64,${imageData}`;

      console.log('Analyzing image with prompt:', prompt.trim());

      const result = await analyzeImage(fullDataUrl, prompt.trim());
      
      if (result.success) {
        res.json({
          success: true,
          analysis: result.analysis,
          originalPrompt: prompt.trim()
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: result.error || 'Image analysis failed'
        });
      }
    } catch (error) {
      console.error('Image analysis API error:', error);
      
      let errorMessage = 'Failed to analyze image. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorMessage = 'API rate limit reached. Please try again in a moment.';
        } else if (error.message.includes('billing')) {
          errorMessage = 'API billing issue. Please check your account.';
        } else if (error.message.includes('content')) {
          errorMessage = 'Content policy violation. Please try a different image.';
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI-powered document formatting endpoint for export
  app.post('/api/format-for-export', requireAuth, async (req, res) => {
    try {
      const { content, type } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      const isPresentation = type === 'pptx';

      const systemPrompt = isPresentation
        ? `You are a professional presentation writer. Transform the given content into a clean, well-structured presentation outline using markdown.
Rules:
- Use # for the main presentation title (only once, at the top)
- Use ## for each major section/slide title (4-8 sections ideal)
- Use bullet points (- ) for slide content, max 5-6 bullets per section, each max 15 words
- Make headings punchy and specific
- Remove ANY phrase that sounds like "As an AI", "As a language model", "I was trained", etc.
- Do NOT add "Written by AI" or similar disclaimers
- Keep bullet points concise and impactful
- Focus on key insights, facts, and actionable points
- IMAGE HANDLING: When the content references an image, photo, illustration, or visual — convert it to a special marker on its own line: [IMAGE: concise search query describing the image, max 8 words]. Example: if content says "Image: A stunning photo of a peacock" → output [IMAGE: peacock colorful feathers display]. Only include 1 [IMAGE:] per section maximum.
- QUIZ HANDLING: When the content references a quiz question, interactive element, or test question — convert it to: [QUIZ: the actual question text?]. Only include 1 [QUIZ:] per section maximum.
- All other "Speaker note:", "Note:", "Caption:", "Video:", "Animation:", "Infographic:", "Activity:", "Exercise:", "Source:", "Reference:" lines should be REMOVED entirely — they are not slide content
Output ONLY the markdown, no preamble.`
        : `You are a professional document writer. Transform the given content into a clean, well-structured document using markdown.
Rules:
- Use # for the document title
- Use ## for major sections
- Use ### for subsections
- Use bullet points for lists
- Bold (**text**) important terms and key facts
- Remove ANY phrase that sounds like "As an AI", "As a language model", "I was trained", etc.
- Do NOT add "Written by AI" or similar disclaimers
- Organize content logically with clear hierarchy
- Keep paragraphs concise
- IMAGE HANDLING: When the content references an image or photo — convert it to [IMAGE: concise 5-word search query] on its own line
- QUIZ HANDLING: When the content references a quiz or interactive question — convert it to [QUIZ: question text?] on its own line
- All other "Note:", "Caption:", "Video:", "Animation:", "Source:", "Reference:" lines should be removed
Output ONLY the markdown, no preamble.`;

      // Use Groq for fast formatting
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.json({ success: false, formatted: content });
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Transform this content:\n\n${content.slice(0, 8000)}` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        return res.json({ success: false, formatted: content });
      }

      const data = await response.json();
      const formatted = data.choices?.[0]?.message?.content?.trim() || content;
      return res.json({ success: true, formatted });
    } catch (error) {
      console.error('Format-for-export error:', error);
      return res.json({ success: false, formatted: req.body.content });
    }
  });

  // Image proxy for PPTX/DOCX export — fetches from Pollinations and returns base64
  app.post('/api/fetch-image-for-export', requireAuth, async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query required' });

    // Helper: fetch a URL and return base64 + mimeType, or null on failure
    async function tryFetch(url: string, timeoutMs: number): Promise<{ base64: string; mimeType: string } | null> {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        if (!r.ok) return null;
        const ct = r.headers.get('content-type') || 'image/jpeg';
        if (!ct.startsWith('image/')) return null;
        const buf = await r.arrayBuffer();
        if (buf.byteLength < 1000) return null; // reject empty/error responses
        return { base64: Buffer.from(buf).toString('base64'), mimeType: ct };
      } catch {
        clearTimeout(t);
        return null;
      }
    }

    try {
      // Extract keywords from query for use in fallback URLs
      const keywords = query.toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .slice(0, 3)
        .join(',');
      const seed = Math.floor(Math.random() * 9999);

      // Attempt 1: Pollinations.ai (AI-generated photo)
      const pollinationsPrompt = encodeURIComponent(`${query.slice(0, 200)}, professional photography, vibrant colors, clean composition`);
      const result1 = await tryFetch(
        `https://image.pollinations.ai/prompt/${pollinationsPrompt}?width=600&height=400&nologo=true&seed=${seed}`,
        12000
      );
      if (result1) return res.json(result1);

      // Attempt 2: loremflickr — real Flickr photos matched to keywords
      const result2 = await tryFetch(
        `https://loremflickr.com/600/400/${encodeURIComponent(keywords || 'nature')}?lock=${seed}`,
        10000
      );
      if (result2) return res.json(result2);

      // Attempt 3: Picsum Photos — deterministic seed, always available
      const picsumSeed = keywords.replace(/,/g, '-') || 'photo';
      const result3 = await tryFetch(
        `https://picsum.photos/seed/${encodeURIComponent(picsumSeed)}-${seed % 100}/600/400`,
        8000
      );
      if (result3) return res.json(result3);

      return res.status(502).json({ error: 'All image services unavailable' });
    } catch (error) {
      console.error('fetch-image-for-export error:', error);
      return res.status(500).json({ error: 'Failed to fetch image' });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, { ws });

    console.log(`Client ${clientId} connected`);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        const client = clients.get(clientId);
        
        if (!client) {
          console.log('Client not found for ID:', clientId);
          return;
        }

        switch (message.type) {
          case 'join_conversation':
            console.log('Client joining conversation:', message.conversationId);
            client.conversationId = message.conversationId;
            client.userId = message.userId;
            break;

          case 'send_message':
            console.log('Processing send_message:', message);
            await handleChatMessage(message, client, clients);
            break;

          case 'typing':
            broadcastToConversation(message.conversationId, {
              type: 'typing',
              userId: client.userId,
              isTyping: message.isTyping,
            }, clientId, clients);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(clientId);
    });
  });

  // Education API endpoints
  app.post('/api/education/search-schools', requireAuth, async (req, res) => {
    try {
      const { city, country } = req.body;
      
      if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required' });
      }
      
      let schools = [];
      
      try {
        // Try AI-powered school generation first
        const prompt = `Generate a list of 8-12 realistic school names for ${city}, ${country}. Include a mix of:
- Public schools
- Private schools  
- International schools
- Religious schools (if applicable to the region)

Return only the school names as a JSON array of strings. Make them authentic and appropriate for the location.`;

        const apiKey = getAPIKey();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content;
          
          if (aiResponse) {
            try {
              schools = JSON.parse(aiResponse);
            } catch {
              // Fallback: extract school names from text
              schools = aiResponse
                .split('\n')
                .filter((line: string) => line.trim())
                .map((line: string) => line.replace(/^[0-9\-\.\*\s]+/, '').trim())
                .filter((name: string) => name && name.length > 3);
            }
          }
        }
      } catch (aiError: any) {
        console.log('AI school generation failed, using fallback:', aiError?.message || 'Unknown error');
      }

      // If AI failed or returned empty results, use intelligent fallback
      if (!Array.isArray(schools) || schools.length === 0) {
        schools = generateSchoolsFallback(city, country);
      }

      res.json({ schools: schools.slice(0, 12) });
    } catch (error) {
      console.error('School search error:', error);
      // Even if everything fails, provide fallback schools
      const fallbackSchools = generateSchoolsFallback(req.body.city || 'Local', req.body.country || 'Area');
      res.json({ schools: fallbackSchools });
    }
  });

  // Quiz generation endpoint
  app.post('/api/education/generate-quiz', requireAuth, async (req, res) => {
    try {
      const { examClass, school, country, educationSystem, topic } = req.body;

      const prompt = `You are an expert examiner. Generate a quiz with exactly 10 multiple-choice questions.

Context:
- Class/Grade: ${examClass || 'General'}
- School: ${school || 'General'}
- Country: ${country || 'General'}
- Education System: ${educationSystem || 'General'}
- Topic/Subject: ${topic || 'General Knowledge'}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Questions should match the education level and curriculum style
- Include a short hint for each question (max 20 words)
- Include a brief explanation for the correct answer (max 30 words)

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "hint": "Think about...",
      "explanation": "The answer is A because..."
    }
  ]
}`;

      const apiKey = getAPIKey();
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || '';

      let parsed;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        return res.status(500).json({ error: 'Failed to parse quiz questions' });
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  // Prompt enhancement endpoint
  app.post('/api/enhance-prompt', requireAuth, async (req, res) => {
    try {
      const { originalPrompt } = req.body;
      
      if (!originalPrompt) {
        return res.status(400).json({ error: 'Original prompt is required' });
      }
      
      // Use AI to enhance the prompt efficiently and quickly
      const enhancementPrompt = `Lightly improve the following prompt: fix grammar, add a few clarifying details, and make it slightly longer. Keep the original tone and intent — do NOT drastically rewrite or change the meaning. Small, natural improvements only.

STRICT OUTPUT RULES — violating any of these will cause a failure:
• Output ONLY the improved prompt text. Nothing else.
• Do NOT start with "Here", "Here's", "This", "Sure", "I've", "Improved", "Enhanced", "Rewritten", or any similar word.
• Do NOT add quotes around the output.
• Do NOT include any label like "Improved prompt:", "Enhanced version:", etc.
• Do NOT explain what you changed.
• Do NOT ask any questions.
• Start your output directly with the first word of the improved prompt.

Prompt to improve: ${originalPrompt}`;

      // Smart retry with automatic key switching for prompt enhancement  
      const maxRetries = 3;
      let lastError: Error | null = null;
      let enhancedPrompt: string | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const apiKey = getAPIKey();
          console.log(`Prompt enhancement attempt ${attempt}/${maxRetries} using ${apiKey.provider} key: ${apiKey.key.substring(0, 10)}...`);
          
          // Use reduced token limits for faster processing
          const maxTokens = attempt === 1 ? 150 : attempt === 2 ? 100 : 80;
          
          let response: Response;

          if (apiKey.provider === 'groq') {
            // Use Groq API
            response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey.key}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: enhancementPrompt }],
                temperature: 0.1,
                max_tokens: maxTokens,
                stream: false,
              }),
            });
          } else if (apiKey.provider === 'gemini') {
            // Use Gemini API directly (different request/response shape than OpenAI-style APIs)
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.key}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: enhancementPrompt }] }],
                  generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
                }),
              }
            );
          } else if (apiKey.provider === 'openai') {
            // Use OpenAI API directly
            response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey.key}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: enhancementPrompt }],
                temperature: 0.1,
                max_tokens: maxTokens,
              }),
            });
          } else {
            // Use OpenRouter API
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey.key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
                'X-Title': 'LineusAPI'
              },
              body: JSON.stringify({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{ role: 'user', content: enhancementPrompt }],
                temperature: 0.1,
                max_tokens: maxTokens,
                stream: false,
              }),
            });
          }

          console.log(`Prompt enhancement response status (${apiKey.provider}): ${response.status}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = `${apiKey.provider} API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`;
            
            // Mark key as failed for credit/rate limit/auth issues so we don't keep retrying a broken key
            if (response.status === 402 || response.status === 429 || response.status === 401 || response.status === 403) {
              const reason = response.status === 402 ? 'Insufficient credits' : response.status === 429 ? 'Rate limited' : 'Auth error';
              markKeyFailed(apiKey.key, reason);
              console.log(`Enhancement key failed with ${reason}, trying next key...`);
              
              lastError = new Error(errorMessage);
              continue; // Try next key immediately
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          console.log('Prompt enhancement API response received');
          enhancedPrompt = apiKey.provider === 'gemini'
            ? data.candidates?.[0]?.content?.parts?.[0]?.text
            : data.choices?.[0]?.message?.content;
          
          if (enhancedPrompt) {
            console.log(`Successful prompt enhancement from ${apiKey.provider} key: ${apiKey.key.substring(0, 10)}...`);
            break; // Success, exit retry loop
          } else {
            throw new Error('No content in enhancement response');
          }
          
        } catch (error: any) {
          console.log(`Enhancement attempt ${attempt} failed:`, error.message);
          lastError = error;
          
          // Mark key as failed for credit/rate limit issues
          if (error.message.includes('credits') || error.message.includes('402') || error.message.includes('429')) {
            const apiKeyToFail = getAPIKey();
            markKeyFailed(apiKeyToFail.key, 'Credit or rate limit issue');
          }
          
          // Wait before retry (but not for last attempt)
          if (attempt < maxRetries) {
            const waitTime = 500 * attempt;
            console.log(`Waiting ${waitTime}ms before enhancement retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (enhancedPrompt) {
        console.log('Successfully enhanced prompt');
        // Clean up the response by removing common AI prefixes
        let cleanedPrompt = enhancedPrompt.trim();
        
        // Remove common prefixes (case insensitive)
        const prefixesToRemove = [
          'Here is an improved version of the prompt with better grammar and more detail:',
          'Here is an improved version of the prompt:',
          'Here\'s an improved version of the prompt:',
          'Here is a better version:',
          'Improved prompt:',
          'Improved Prompt:',
          'Enhanced prompt:',
          'Enhanced Prompt:'
        ];
        
        for (const prefix of prefixesToRemove) {
          if (cleanedPrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
            cleanedPrompt = cleanedPrompt.substring(prefix.length).trim();
            break;
          }
        }
        
        // Remove any remaining newlines at the start
        cleanedPrompt = cleanedPrompt.replace(/^\n+/, '').trim();
        
        // Remove any remaining pattern like "Improved Prompt:" with newlines
        cleanedPrompt = cleanedPrompt.replace(/^(improved\s+prompt\s*:\s*\n*)/i, '').trim();
        
        // Also clean common patterns like quotes
        if (cleanedPrompt.startsWith('"') && cleanedPrompt.endsWith('"')) {
          cleanedPrompt = cleanedPrompt.slice(1, -1);
        }
        
        res.json({ enhancedPrompt: cleanedPrompt });
        return;
      }
      
      // If all attempts failed, use fallback enhancement
      console.log('All enhancement attempts failed, using fallback method');

      // Fallback enhancement if AI fails - create a more detailed prompt
      let fallbackEnhanced = originalPrompt.trim();
      
      // Simple keyword-based enhancement
      const keywords = originalPrompt.toLowerCase();
      if (keywords.includes('elon musk')) {
        fallbackEnhanced = `Tell me about Elon Musk's complete biography including his early life, birth details, childhood in South Africa, education at University of Pennsylvania, early ventures like Zip2 and PayPal, founding of SpaceX and Tesla, his vision for sustainable energy and space exploration, personal life, achievements, controversies, and current projects like Neuralink and The Boring Company. Include specific dates, milestones, and interesting facts about his journey from entrepreneur to one of the world's most influential innovators.`;
      } else if (keywords.includes('math') || keywords.includes('mathematics')) {
        fallbackEnhanced = `Explain ${originalPrompt} in detail with step-by-step examples, practical applications, real-world use cases, mathematical concepts, formulas if applicable, visual representations, and provide practice problems with solutions.`;
      } else if (keywords.includes('science') || keywords.includes('physics') || keywords.includes('chemistry') || keywords.includes('biology')) {
        fallbackEnhanced = `Provide a comprehensive explanation of ${originalPrompt} including scientific principles, theories, real-world applications, examples, experiments, key discoveries, historical context, and current research in the field.`;
      } else if (keywords.includes('history')) {
        fallbackEnhanced = `Give a detailed historical account of ${originalPrompt} including timeline of events, key figures involved, causes and consequences, historical significance, impact on society, and connections to modern times.`;
      } else if (keywords.includes('programming') || keywords.includes('code') || keywords.includes('javascript') || keywords.includes('python')) {
        fallbackEnhanced = `Explain ${originalPrompt} with detailed code examples, best practices, common use cases, step-by-step implementation guide, potential pitfalls to avoid, and practical projects to practice the concepts.`;
      } else {
        // Generic enhancement
        fallbackEnhanced = `Provide a comprehensive and detailed explanation of ${originalPrompt} including background information, key concepts, practical examples, step-by-step breakdown, real-world applications, important considerations, and actionable insights.`;
      }

      res.json({ enhancedPrompt: fallbackEnhanced });
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      res.status(500).json({ error: 'Failed to enhance prompt' });
    }
  });

  // API Testing endpoint - comprehensive testing for all integrated APIs
  app.post('/api/test-all-apis', requireAuth, async (req, res) => {
    try {
      console.log('Starting comprehensive API testing...');
      const { testAllAPIs } = await import('./test-apis');
      const results = await testAllAPIs();
      
      console.log('API testing completed:', results.summary);
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...results
      });
    } catch (error) {
      console.error('API testing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test APIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ── Follow-up Suggestions ─────────────────────────────────────────────────────
  app.post('/api/suggest-followups', requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ suggestions: [] });
      const prompt = `Based on this AI response, generate exactly 3 short, natural follow-up question suggestions a user might want to ask next. Each suggestion should be concise (max 8 words), relevant, and varied in angle. Return ONLY a JSON array of 3 strings, no explanation.\n\nAI Response:\n${String(message).slice(0, 600)}\n\nReturn format: ["question 1", "question 2", "question 3"]`;
      try {
        const apiKey = getAPIKey();
        let response: Response;
        if (apiKey.provider === 'groq') {
          response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Authorization': `Bearer ${apiKey.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 120 }),
          });
        } else {
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST', headers: { 'Authorization': `Bearer ${apiKey.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 120 }),
          });
        }
        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content?.trim() || '[]';
          const match = text.match(/\[.*\]/s);
          if (match) {
            const arr = JSON.parse(match[0]);
            if (Array.isArray(arr)) return res.json({ suggestions: arr.slice(0, 3) });
          }
        }
      } catch { /* fall through */ }
      res.json({ suggestions: [] });
    } catch { res.json({ suggestions: [] }); }
  });

  // ── Games Data (server-side persistence per user account) ────────────────────
  app.get('/api/games/leaderboard', requireAuth, async (req, res) => {
    try {
      const entries = await storage.getAllUsersWithSettings();
      const board = entries
        .map(e => {
          const levels: Record<string, number> = (e.settings as any)?.gamesData?.levels || {};
          // Combined level = sum of all individual game levels (the user's progress metric)
          const totalLevel = Object.values(levels).reduce((sum: number, lv: any) => sum + (Number(lv) || 0), 0);
          const scores: any[] = (e.settings as any)?.gamesData?.scores || [];
          const bestGame = scores.length > 0 ? scores.reduce((a: any, b: any) => a.score > b.score ? a : b) : null;
          return { userId: e.userId, name: e.displayName || e.username, totalScore: totalLevel, bestGame, gameLevels: levels };
        })
        .filter(e => e.totalScore > 0)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 20);
      res.json(board);
    } catch {
      res.status(500).json([]);
    }
  });

  app.get('/api/games/data', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const settings = await storage.getUserSettings(userId);
      const gamesData = (settings as any).gamesData || { ownedGames: [], fragments: 0, levels: {}, scores: [] };
      res.json(gamesData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/games/data', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const { ownedGames, fragments, levels, scores } = req.body;
      const settings = await storage.getUserSettings(userId);
      (settings as any).gamesData = { ownedGames: ownedGames || [], fragments: fragments || 0, levels: levels || {}, scores: scores || [] };
      await storage.saveUserSettings(userId, settings);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Nomad history — persistent server-side storage
  app.get('/api/nomad/history', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json([]);
      const settings = await storage.getUserSettings(userId);
      res.json((settings as any).nomadHistory || []);
    } catch { res.status(500).json([]); }
  });

  app.post('/api/nomad/history', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ ok: false });
      const { sessions } = req.body;
      if (!Array.isArray(sessions)) return res.status(400).json({ ok: false });
      const settings = await storage.getUserSettings(userId);
      (settings as any).nomadHistory = sessions.slice(0, 30);
      await storage.saveUserSettings(userId, settings);
      res.json({ ok: true });
    } catch { res.status(500).json({ ok: false }); }
  });

  // API Status endpoint - quick overview
  app.get('/api/status', requireAuth, async (req, res) => {
    try {
      const stats = apiManager.getAPIStats();
      const availableCounts = {
        groq: apiManager.getAvailableCount('groq'),
        openrouter: apiManager.getAvailableCount('openrouter'),
        openai: apiManager.getAvailableCount('openai'),
        gemini: apiManager.getAvailableCount('gemini'),
        total: apiManager.getAvailableCount()
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        available: availableCounts,
        details: stats.map(api => ({
          provider: api.provider,
          isWorking: api.isWorking,
          failureCount: api.failureCount,
          requestCount: api.requestCount,
          lastUsed: api.lastUsed,
          hasRecentFailure: api.lastFailure && (Date.now() - api.lastFailure.getTime()) < 300000 // 5 minutes
        }))
      });
    } catch (error) {
      console.error('API status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get API status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Chat message handling functions (moved inside for scope access)
  async function handleChatMessage(message: any, client: ChatClient, clients: Map<string, ChatClient>) {
    try {
      console.log('Handling chat message:', message);
      // Validate and save user message
      const userMessage = await storage.createMessage({
        conversationId: message.conversationId,
        role: 'user',
        content: message.content,
      });

      // Broadcast user message to other clients in the conversation
      broadcastToConversation(message.conversationId, {
        type: 'message',
        message: userMessage,
      }, '', clients);

      // Get conversation for context
      const conversation = await storage.getConversation(message.conversationId);
      if (!conversation) return;

      // Call OpenRouter API
      console.log('Calling OpenRouter API with:', { content: message.content, model: conversation.model });
      const openRouterResponse = await callAIService(message.content, conversation);
      console.log('OpenRouter response received:', { 
        content: openRouterResponse.content.substring(0, 100) + '...', 
        model: openRouterResponse.metadata?.model 
      });
      
      // Check for duplicate AI responses (prevent repetition)
      const responseHash = require('crypto').createHash('md5').update(openRouterResponse.content.trim()).digest('hex');
      const conversationResponses = recentResponses.get(message.conversationId) || new Set();
      
      if (conversationResponses.has(responseHash)) {
        console.log('Duplicate AI response detected, skipping...');
        return; // Skip this duplicate response
      }
      
      // Track this response to prevent future duplicates
      conversationResponses.add(responseHash);
      recentResponses.set(message.conversationId, conversationResponses);
      
      // Keep only last 5 responses per conversation to prevent memory issues
      if (conversationResponses.size > 5) {
        const oldest = conversationResponses.values().next().value;
        if (oldest) {
          conversationResponses.delete(oldest);
        }
      }

      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId: message.conversationId,
        role: 'assistant',
        content: openRouterResponse.content,
        metadata: openRouterResponse.metadata,
      });

      // Broadcast AI response
      broadcastToConversation(message.conversationId, {
        type: 'message',
        message: aiMessage,
      }, '', clients);

      // Update conversation timestamp
      await storage.updateConversation(message.conversationId, {
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error('Chat message handling error:', error);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  }

  function broadcastToConversation(conversationId: string, message: any, excludeClientId: string, clients: Map<string, ChatClient>) {
    clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && 
          client.conversationId === conversationId && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}

// Smart fallback function for school generation with real modern schools
function generateSchoolsFallback(city: string, country: string): string[] {
  const cityLower = city.toLowerCase();
  const countryLower = country.toLowerCase();
  
  // Real modern school chains and patterns by region
  const modernSchoolChains = {
    pakistan: ['Beaconhouse School System', 'Lahore Grammar School (LGS)', 'The City School', 'Roots School System', 'Aitchison College', 'Karachi Grammar School', 'The Educators', 'Allied Schools', 'Bloomfield Hall School'],
    india: ['Delhi Public School (DPS)', 'Kendriya Vidyalaya', 'DAV Public School', 'Ryan International School', 'Amity International School', 'Modern School', 'The Heritage School', 'St. Xavier\'s School'],
    uk: ['Eton College', 'Harrow School', 'Westminster School', 'St. Paul\'s School', 'King\'s College School', 'Dulwich College', 'City of London School', 'Merchant Taylors\' School'],
    usa: ['Phillips Academy', 'Phillips Exeter Academy', 'Choate Rosemary Hall', 'The Lawrenceville School', 'Deerfield Academy', 'Groton School', 'Milton Academy'],
    canada: ['Upper Canada College', 'St. Andrew\'s College', 'Ridley College', 'Appleby College', 'Trinity College School', 'Lakefield College School'],
    australia: ['Sydney Grammar School', 'Melbourne Grammar School', 'Scotch College', 'Wesley College', 'Xavier College', 'Brisbane Grammar School'],
    uae: ['GEMS World Academy', 'Dubai International Academy', 'American School of Dubai', 'British School Al Khubairat', 'Repton School Dubai'],
    saudi: ['International Schools Group (ISG)', 'Dhahran Elementary Middle School', 'American International School Riyadh', 'British International School Riyadh']
  };
  
  const schools: string[] = [];
  
  // Try to match country/region for appropriate schools
  let relevantSchools: string[] = [];
  if (countryLower.includes('pakistan') || cityLower.includes('karachi') || cityLower.includes('lahore') || cityLower.includes('islamabad') || cityLower.includes('sargodha')) {
    relevantSchools = modernSchoolChains.pakistan;
  } else if (countryLower.includes('india') || cityLower.includes('delhi') || cityLower.includes('mumbai') || cityLower.includes('bangalore')) {
    relevantSchools = modernSchoolChains.india;
  } else if (countryLower.includes('uk') || countryLower.includes('england') || countryLower.includes('britain') || cityLower.includes('london')) {
    relevantSchools = modernSchoolChains.uk;
  } else if (countryLower.includes('usa') || countryLower.includes('america') || countryLower.includes('united states')) {
    relevantSchools = modernSchoolChains.usa;
  } else if (countryLower.includes('canada')) {
    relevantSchools = modernSchoolChains.canada;
  } else if (countryLower.includes('australia')) {
    relevantSchools = modernSchoolChains.australia;
  } else if (countryLower.includes('uae') || cityLower.includes('dubai') || cityLower.includes('abu dhabi')) {
    relevantSchools = modernSchoolChains.uae;
  } else if (countryLower.includes('saudi') || cityLower.includes('riyadh') || cityLower.includes('jeddah')) {
    relevantSchools = modernSchoolChains.saudi;
  }
  
  // Add region-specific modern schools
  if (relevantSchools.length > 0) {
    relevantSchools.slice(0, 6).forEach(school => {
      if (school.includes('(') || school.includes('System') || school.includes('College') || school.includes('Academy')) {
        schools.push(school.replace(/\([^)]*\)/g, '').trim());
      } else {
        schools.push(`${school} ${city}`);
      }
    });
  }
  
  // Add generic modern school types
  const modernTypes = [
    `${city} International School`,
    `${city} Grammar School`,
    `The ${city} School`,
    `${city} Academy`,
    `${city} College Preparatory`,
    `Modern ${city} School`
  ];
  
  modernTypes.forEach(type => schools.push(type));
  
  // Remove duplicates and limit to 12
  return Array.from(new Set(schools)).slice(0, 12);
}

// Generate a rich, natural-language description for a freshly created image
async function describeGeneratedImage(prompt: string): Promise<string> {
  try {
    if (!process.env.GROQ_API_KEY) {
      return `A photorealistic image inspired by your prompt: "${prompt}".`;
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an art critic. Given an image prompt, write a vivid 3-5 sentence description of what the resulting photorealistic image likely shows — its subject, composition, lighting, mood, and notable details. Write in present tense as if describing the image directly to the viewer. Do not say "the image shows" or "you can see"; just describe naturally. No preamble, no markdown headings.'
          },
          { role: 'user', content: `Image prompt: ${prompt}` }
        ],
        max_tokens: 280,
        temperature: 0.8
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } else {
      console.log('describeGeneratedImage: Groq failed', response.status);
    }
  } catch (err) {
    console.log('describeGeneratedImage error:', err instanceof Error ? err.message : err);
  }
  return `A photorealistic image inspired by your prompt: "${prompt}".`;
}

// Rewrite a vague user prompt into a clear, specific visual image description using Groq
async function enhanceImagePrompt(rawPrompt: string): Promise<string> {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return rawPrompt;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert image prompt engineer for AI image generators like Flux and Stable Diffusion.
The user gives you a short description of what they want. Your job is to rewrite it as a clear, detailed, literal visual image prompt.

RULES:
- Describe exactly what should appear in the image visually — objects, text, colors, layout, style
- If the user mentions a banner/poster/card, describe it as a designed graphic with typography and visual elements
- NEVER interpret metaphors or compound words — "speed math" means "fast math / mathematics", NOT a racing car
- If the user says "speed math", generate math symbols, equations, numbers, and energetic/fast-paced design — NOT cars
- Include colors, lighting, composition, and format where relevant
- Keep it under 80 words
- Output ONLY the enhanced prompt — no explanation, no quotes`,
          },
          { role: 'user', content: rawPrompt },
        ],
        temperature: 0.4,
        max_tokens: 120,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return rawPrompt;
    const data = await res.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (enhanced && enhanced.length > 10) {
      console.log(`Prompt enhanced: "${rawPrompt}" → "${enhanced}"`);
      return enhanced;
    }
    return rawPrompt;
  } catch (e) {
    console.log('Prompt enhancement failed, using original:', e instanceof Error ? e.message : e);
    return rawPrompt;
  }
}

// Image generation function for chat
async function generateImageForChat(prompt: string): Promise<{ path: string; fallbackUrls?: string[] } | null> {
  try {
    console.log('Generating real AI image with prompt:', prompt);
    
    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 10000));
    const result = await Promise.race([
      generateImage(prompt, "1024x1024", "standard"),
      timeoutPromise
    ]);
    
    if (result && result.url) {
      console.log('Successfully built image URL:', result.url.substring(0, 80) + '...');
      return { path: result.url, fallbackUrls: (result as any).fallbackUrls || [] };
    }
    
    console.log('AI image generation timed out or failed, using fallback');
    return null;
  } catch (error) {
    console.error('Error generating AI image for chat:', error);
    return null;
  }
}




// Model-specific API caller for authentic responses
async function callGroqDirectly(message: string, model: string): Promise<{ content: string; metadata: any }> {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // Map to Groq-compatible models
    const groqModel = mapToGroqModel(model);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      metadata: { model: groqModel, provider: 'groq', usage: data.usage }
    };
  } catch (error) {
    console.error('Groq direct call failed:', error);
    throw error;
  }
}

async function callModelSpecificAPI(userMessage: string, model: string, provider: string, user?: any): Promise<{ content: string; metadata: any }> {
  // Create model-specific system prompts for authentic behavior
  const getModelPersonality = (model: string) => {
    // Handle both simple names and full model paths
    const modelName = model.includes('/') ? model.split('/').pop() : model;
    
    switch(true) {
      case model.includes('fius-prime') || modelName === 'fius-prime':
        return `You are Fius Pro, an advanced AI with DeepSeek-style reasoning capabilities. You MUST demonstrate transparent thinking by showing your reasoning process.

For every response, follow this format:

<thinking>
Let me analyze this step by step:

1. UNDERSTANDING THE REQUEST:
   - What is being asked?
   - What type of response is needed?
   - Are there any specific requirements?

2. KNOWLEDGE ANALYSIS:
   - What relevant information do I have?
   - What principles or facts apply?
   - Are there any uncertainties?

3. REASONING PROCESS:
   - How should I approach this?
   - What steps are needed?
   - What are the logical connections?

4. VERIFICATION:
   - Does my reasoning make sense?
   - Have I addressed all aspects?
   - Is my conclusion sound?
</thinking>

Then provide your final answer. Always show your thinking process like DeepSeek R1 does. Be analytical, precise, and systematic.`;
      case model.includes('gpt-4o') || modelName === 'gpt-4o':
        return "You are ChatGPT 5, OpenAI's most advanced model. You're known for being helpful, balanced, and thoughtful. Use a friendly, professional tone. Be conversational and informative. Do not repeat the user's name excessively.";
      case model.includes('claude') || modelName?.includes('claude'):
        return "You are Claude Sonnet 4, Anthropic's most advanced model. You're exceptionally thoughtful, nuanced, and analytical. Consider multiple perspectives and provide detailed explanations with clear reasoning. Be intellectually curious and humble. Do not repeat the user's name excessively.";
      case model.includes('gemini') || modelName?.includes('gemini'):
        return "You are Google Gemini 2.5 Pro, Google's most advanced AI model. You excel at being comprehensive, creative, and well-organized. Structure your responses clearly when appropriate. Be enthusiastic about learning and discovery. Do not repeat the user's name excessively.";
      case model.includes('perplexity') || modelName?.includes('perplexity'):
        return "You are Perplexity Sonar Pro, an AI focused on accuracy and up-to-date information. Provide factual, well-sourced information. Use phrases like 'According to recent sources' or 'Based on current information.' Be concise but thorough. Do not repeat the user's name excessively.";
      case model.includes('deepseek') || modelName?.includes('deepseek'):
        return "You are DeepSeek v3, an advanced AI model. You excel at methodical, step-by-step thinking. Break down complex problems into logical steps and be analytical, precise, and systematic in your approach. Do not repeat the user's name excessively.";
      case model.includes('grok') || model.includes('x-ai') || modelName?.includes('grok'):
        return "You are Grok 4, created by xAI. You're known for being witty, direct, and insightful. Use humor appropriately and be honest and straightforward. Be conversational but avoid repeating the user's name excessively.";
      case model.includes('llama') || modelName?.includes('llama'):
        return "You are Llama 3.3 70B, Meta's latest open-source language model. When asked about your model version, say you are 'Llama 3.3 70B Versatile' - the most recent release. You're powerful, versatile, and designed for a wide range of tasks. Be helpful, accurate, and comprehensive in your responses.";
      default:
        return "You are a helpful AI assistant. Be clear, accurate, and helpful in your responses.";
    }
  };

  const systemPrompt = getModelPersonality(model) + getLanguageInstruction();

  // Use reliable Groq API for all Nomad models to ensure consistent responses
  try {
    console.log(`Nomad requesting ${model} via ${provider} - routing to Groq for reliability`);
    
    // Always use Groq for Nomad since it's fast and reliable
    const groqApi = apiManager['apis'].find(api => api.provider === 'groq' && api.isWorking);
    if (groqApi) {
      const groqModel = mapToGroqModel(model);
      console.log(`Using Groq model ${groqModel} for ${model}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApi.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
          temperature: 0.7,
          max_tokens: 1200
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Groq response successful for ${model}`);
        return {
          content: data.choices[0].message.content,
          metadata: { 
            model: model, // Return the requested model name for UI 
            actualModel: groqModel, // Actual model used
            provider: provider, // Show requested provider for UI
            actualProvider: 'groq', // Actual provider used
            usage: data.usage 
          }
        };
      } else {
        console.error(`Groq API error for ${model}:`, response.status);
      }
    } else {
      console.log('No working Groq API found');
    }
    
    // If Groq fails, fallback to main AI service
    console.log('Groq unavailable, using main AI service fallback');
    const conversation = { model: model, preset: 'custom' };
    return await callAIService(userMessage, conversation, user);
    
  } catch (error) {
    console.error(`Model-specific API call failed, using main service:`, error);
    // Final fallback to main AI service
    const conversation = { model: model, preset: 'custom' };
    return await callAIService(userMessage, conversation, user);
  }
}

async function callOpenAIDirectly(message: string, model: string): Promise<{ content: string; metadata: any }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Use proper OpenAI model names
    const openaiModel = model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      metadata: { model: openaiModel, provider: 'openai', usage: data.usage }
    };
  } catch (error) {
    console.error('OpenAI direct call failed:', error);
    throw error;
  }
}

async function callGeminiDirectly(message: string): Promise<{ content: string; metadata: any }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const { GoogleGenAI } = require('@google/genai');
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(message);
    const response = await result.response;
    
    return {
      content: response.text(),
      metadata: { model: 'gemini-2.5-flash', provider: 'gemini' }
    };
  } catch (error) {
    console.error('Gemini direct call failed:', error);
    throw error;
  }
}

async function callOpenRouterDirectly(message: string, model: string): Promise<{ content: string; metadata: any }> {
  try {
    const api = apiManager.getBestChatAPI();
    if (!api) {
      throw new Error('No OpenRouter APIs available');
    }
    
    // Use free models first, fallback to paid model mapping
    const FREE_OR_MODELS = [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
    ];
    const openRouterModel = FREE_OR_MODELS[0];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
        'X-Title': 'Fius'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = `OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
      apiManager.markAPIFailed(api, errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      metadata: { model: openRouterModel, provider: 'openrouter', usage: data.usage }
    };
  } catch (error) {
    console.error('OpenRouter direct call failed:', error);
    throw error;
  }
}

async function callAIService(userMessage: string, conversation: any, user?: any): Promise<{ content: string; metadata: any }> {
  // Check if user is asking for image generation
  const imageRequestKeywords = ['generate image', 'create image', 'make image', 'draw', 'picture of', 'image of', 'show me', 'give me image'];
  const isImageRequest = imageRequestKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isImageRequest) {
    try {
      console.log('Detected image request, generating image...');
      
      // Extract the image description from the user message
      let imagePrompt = userMessage;
      // Remove common prefixes to get cleaner prompt
      const prefixesToRemove = ['generate image of', 'create image of', 'make image of', 'give me image of', 'show me', 'picture of', 'image of'];
      for (const prefix of prefixesToRemove) {
        if (imagePrompt.toLowerCase().startsWith(prefix)) {
          imagePrompt = imagePrompt.substring(prefix.length).trim();
          break;
        }
      }

      // Rewrite vague user intent into a proper visual image description
      imagePrompt = await enhanceImagePrompt(imagePrompt);

      // Call image generation service
      const generatedImage = await generateImageForChat(imagePrompt);
      
      if (generatedImage) {
        const description = await describeGeneratedImage(imagePrompt);
        return {
          content: `🎨 **Generated Image**

I've created an image of "${imagePrompt}" for you!

![Generated Image](${generatedImage.path})

${description}`,
          metadata: {
            model: 'pollinations-flux',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            imageGenerated: true,
            imagePath: generatedImage.path
          }
        };
      } else {
        return {
          content: `🎨 **Image Generation Failed**

I tried to generate an image of "${imagePrompt}" but encountered an error. 

Let me provide you with a detailed description instead, or you can try asking again with a different description.`,
          metadata: {
            model: 'image-generation-system',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          }
        };
      }
    } catch (error) {
      console.error('Image generation error:', error);
      // Fall through to regular text generation
    }
  }

  const fiusModel = conversation.model || 'fius-prime';
  const mappedModel = MODEL_MAPPING[fiusModel as keyof typeof MODEL_MAPPING] || 'anthropic/claude-3.5-sonnet';
  const systemPrompt = getSystemPrompt(conversation, user);
  
  // Get conversation history for AI memory - CRITICAL FIX
  let conversationHistory: any[] = [];
  try {
    const dbMessages = await storage.getConversationMessages(conversation.id);
    // Get last 15 messages for context (avoid token limits)
    conversationHistory = dbMessages.slice(-15).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    console.log(`Retrieved ${conversationHistory.length} messages for AI context`);
  } catch (error) {
    console.error('Failed to get conversation history:', error);
  }
  
  // Build messages array with system prompt, history, and current message
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
  
  // Retry logic with automatic key switching
  const maxRetries = 8; // Increased to accommodate Groq + OpenRouter + OpenAI retries
  let lastError: Error | null = null;
  let triedGroq = false;
  let triedOpenAI = false;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Use API Manager to get best available API
    const api = apiManager.getBestChatAPI();
    if (!api) {
      console.error('No working APIs available for chat');
      throw new Error('All AI services are currently unavailable');
    }
    
    const { key: apiKey, provider } = api;
    
    if (provider === 'groq') triedGroq = true;
    if (provider === 'openai') triedOpenAI = true;
    
    console.log(`API attempt ${attempt}/${maxRetries} using ${provider} key: ${apiKey.substring(0, 10)}...`);
    
    try {
      // Keep consistent high token limit for complete responses - don't truncate content
      const maxTokens = 1500; // Fixed high limit to prevent response truncation
      
      // Gemini uses a different API format — handle separately and return directly
      if (provider === 'gemini') {
        try {
          const systemMsg = messages.find((m: any) => m.role === 'system');
          const chatMsgs = messages.filter((m: any) => m.role !== 'system');
          const geminiContents = chatMsgs.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));
          const geminiBody: any = {
            contents: geminiContents,
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
          };
          if (systemMsg) {
            geminiBody.systemInstruction = { parts: [{ text: systemMsg.content }] };
          }
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
          );
          if (!geminiRes.ok) {
            const errData = await geminiRes.json().catch(() => ({}));
            const reason = geminiRes.status === 429 ? 'Rate limited' : geminiRes.status === 401 ? 'Unauthorized' : 'API error';
            apiManager.markAPIFailed(api, reason);
            console.log(`Gemini key failed with ${reason}, trying next...`);
            lastError = new Error(`Gemini error ${geminiRes.status}: ${errData?.error?.message || reason}`);
            continue;
          }
          const geminiData = await geminiRes.json();
          const geminiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (geminiContent) {
            console.log(`Successful response from gemini key: ${apiKey.substring(0, 10)}... (${geminiContent.length} chars)`);
            return {
              content: geminiContent,
              metadata: { model: 'gemini-2.0-flash', provider: 'Gemini', attempt }
            };
          }
          throw new Error('No content in Gemini response');
        } catch (geminiErr: any) {
          console.log(`Gemini attempt ${attempt} failed:`, geminiErr.message);
          lastError = geminiErr;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, Math.min(500 * attempt, 2000)));
          continue;
        }
      }

      let response: Response;
      
      if (provider === 'groq') {
        // Groq API call - map models to Groq-compatible ones
        const groqModel = mapToGroqModel(fiusModel);
        // Inject identity reinforcement for Fius system prompts so LLaMA doesn't override identity
        const sysMsg = messages.find((m: any) => m.role === 'system');
        const groqMessages = (sysMsg?.content?.includes('Muzamil Ali'))
          ? [
              messages[0], // system message first
              { role: 'user', content: 'Who are you and who created you?' },
              { role: 'assistant', content: 'I am Fius, an AI assistant created solely by Muzamil Ali — a 14-year-old developer from Sargodha, Pakistan, who built me while in class 9. I am not LLaMA, not Meta\'s product, not made by any company or team. Only Muzamil Ali created me.' },
              ...messages.slice(1)
            ]
          : messages;
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groqModel,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: maxTokens,
          }),
        });
      } else if (provider === 'openai') {
        // OpenAI API call
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: messages, // Use full conversation history
            temperature: 0.7,
            max_tokens: maxTokens,
          }),
        });
      } else {
        // OpenRouter API call — use free models (no credits needed)
        const OR_FREE_MODELS = [
          'meta-llama/llama-3.3-70b-instruct:free',
          'deepseek/deepseek-r1:free',
          'google/gemini-2.0-flash-exp:free',
          'qwen/qwen3-8b:free',
          'deepseek/deepseek-chat-v3-0324:free',
        ];
        let orResponse: Response | null = null;
        for (const freeModel of OR_FREE_MODELS) {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
              'X-Title': 'Fius API',
            },
            body: JSON.stringify({ model: freeModel, messages, temperature: 0.7, max_tokens: maxTokens }),
          });
          if (res.ok) { orResponse = res; break; }
          if (res.status === 401) { apiManager.markAPIFailed(api, 'Unauthorized'); break; }
          // 402/429/5xx — try next free model
          const ed = await res.json().catch(() => ({}));
          console.log(`callAIService OpenRouter model ${freeModel} returned ${res.status}, trying next...`);
        }
        if (!orResponse) {
          apiManager.markAPIFailed(api, 'All free models failed');
          lastError = new Error('OpenRouter: all free models unavailable');
          continue;
        }
        response = orResponse;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `${provider.toUpperCase()} API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`;
        
        if (response.status === 402 || response.status === 429 || response.status === 401) {
          const reason = response.status === 402 ? 'Insufficient credits' : 
                        response.status === 429 ? 'Rate limited' : 'Unauthorized';
          apiManager.markAPIFailed(api, reason);
          console.log(`${provider} key failed with ${reason}, trying next key...`);
          lastError = new Error(errorMessage);
          continue;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        console.log(`Successful response from ${provider} key: ${apiKey.substring(0, 10)}... (${content.length} chars)`);
        return {
          content: content,
          metadata: {
            model: data.model,
            usage: data.usage,
            provider: provider.charAt(0).toUpperCase() + provider.slice(1),
            attempt: attempt
          }
        };
      } else {
        throw new Error('No content in response');
      }
      
    } catch (error: any) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // If it's a credit/rate limit issue, mark key as failed
      if (error.message.includes('credits') || error.message.includes('402') || error.message.includes('429') || error.message.includes('401')) {
        apiManager.markAPIFailed(api, 'Credit, rate limit, or auth issue');
        // If OpenRouter failed with credits and we haven't tried Groq yet, prioritize it
        if (provider === 'openrouter' && !triedGroq) {
          console.log('OpenRouter failed with credits, will try Groq next...');
        }
      }
      
      // Wait before retry (but not for the last attempt)
      if (attempt < maxRetries) {
        const waitTime = Math.min(500 * attempt, 2000); // Progressive backoff
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If all attempts failed, return error response
  console.error('All API attempts failed, returning error response');
  return {
    content: `I apologize, but I'm experiencing temporary difficulties with my AI service. This might be due to high demand or credit limitations. Please try again in a moment, or contact support if the issue persists.`,
    metadata: {
      model: mappedModel,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      provider: 'Multiple (Groq + OpenRouter + OpenAI)',
      error: lastError?.message || 'All retries failed'
    }
  };
}

function getSystemPrompt(conversation: any, user?: any): string {
  let basePrompt = `You are Fius — an advanced AI assistant and friendly conversational companion. ${FIUS_CREATOR_INFO}

PERSONALITY: You engage users like a real, genuine friend — warm, curious, witty, and real. You adapt fully to the user's language style, including typos, slang, colloquialisms, and informal spelling (if they type "lol wassup" you respond casually; if they ask something serious you match that tone). Never give generic or robotic answers — always give thoughtful, personalized responses that show you actually care about what they said. Use humor, anecdotes, and creative phrasing to make conversations lively. You are non-judgmental and sensitive to feelings.

CORE RULES:
- Adapt to user's language in real time: if they use slang or Roman Urdu, mirror their style naturally.
- Never repeat the user's prompt back to them.
- Use their name at most once (on greeting), never repeatedly.
- Mix list styles for variety: sometimes use bullet points (•), sometimes numbered lists (1. 2. 3.), never always the same.
- For headings in lists, write them as plain bold text e.g. **Heading** — they render as bold, not as asterisks.
- Be concise but substantive. Never pad responses with filler.
- At the end of longer conversations, naturally invite further discussion.

CHART/GRAPH RULE: When asked for comparisons, data visualizations, graphs or charts output this exact block:
[CHART:bar]
Label1: value1
Label2: value2
[/CHART]
For line data use [CHART:line], for pie/distribution use [CHART:pie]. Values must be numbers. Always include the chart block plus an explanation.

FORMATTING:
- Code or copyable text → use \`\`\`language blocks or \`\`\`text blocks
- Bold key terms with **term**
- Vary bullet (•) and numbered (1. 2. 3.) lists — don't always use the same style` + getLanguageInstruction();
  
  // Mention the user's name only once subtly
  if (user && (user.displayName || user.username)) {
    const name = user.displayName || user.username;
    basePrompt += ` The user's name is ${name} — you may use it naturally once when greeting, but do not repeat it throughout the conversation.`;
  }
  
  let systemPrompt = basePrompt;
  
  switch (conversation.preset) {
    case 'concise':
      systemPrompt += " Be concise and direct in your responses. Provide clear, brief answers without unnecessary elaboration.";
      break;
    case 'formal':
      systemPrompt += " Respond in a formal, professional manner. Use proper grammar and maintain a respectful, academic tone.";
      break;
    case 'socratic':
      systemPrompt += " Use the Socratic method to help the user learn. Ask guiding questions and encourage critical thinking rather than providing direct answers.";
      break;
    case 'fius-education':
      systemPrompt += " You are Fius Education, an advanced AI educational assistant. You specialize in:\n1. **Examination Generation**: Create comprehensive tests based on uploaded materials and school curricula\n2. **Voice-based Learning Assessment**: Provide interactive speaking practice with constructive feedback\n3. **Educational Support**: Adapt to different education systems (O/A levels, Matric, etc.)\n\nWhen helping with examinations:\n- Generate questions that match the school's examination style\n- Provide detailed feedback with marks and explanations\n- Cover multiple question types (MCQ, short answer, essay)\n\nWhen conducting voice-based learning:\n- Encourage verbal explanations\n- Provide constructive feedback on understanding\n- Correct mistakes gently and suggest improvements\n- Use interactive discussion to enhance learning\n\nAlways be encouraging, educational, and adapt to the student's level.";
      break;
    case 'custom':
      if (conversation.customInstructions) {
        systemPrompt += ` ${conversation.customInstructions}`;
      }
      break;
  }
  
  return systemPrompt;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
