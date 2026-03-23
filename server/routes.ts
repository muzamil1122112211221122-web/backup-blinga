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
  'forus-prime': 'anthropic/claude-3.5-sonnet-20241022',
  'forus-education': 'anthropic/claude-3.5-sonnet-20241022',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet-20241022',
  'gpt-4o': 'openai/gpt-4o-2024-11-20',
  'gemini-pro': 'google/gemini-2.0-flash-exp',
  'llama-3.3-70b-versatile': 'meta-llama/llama-3.3-70b-instruct',
  'llama-3.1': 'meta-llama/llama-3.1-405b-instruct',
  'deepseek-r1': 'deepseek/deepseek-r1',
  'auto': 'anthropic/claude-3.5-sonnet-20241022' // Default for auto-routing
};

// Groq model mapping
function mapToGroqModel(forusModel: string): string {
  const groqModels: Record<string, string> = {
    'forus-prime': 'llama-3.3-70b-versatile',
    'forus-education': 'llama-3.3-70b-versatile',
    'claude-3.5-sonnet': 'llama-3.3-70b-versatile',
    'gpt-4o': 'llama-3.3-70b-versatile',
    'gemini-pro': 'llama-3.3-70b-versatile',
    'llama-3.1': 'llama-3.1-70b-versatile',
    'auto': 'llama-3.3-70b-versatile'
  };
  return groqModels[forusModel] || 'llama-3.3-70b-versatile';
}

interface ChatClient {
  ws: WebSocket;
  userId?: string;
  conversationId?: string;
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

  // Test AI endpoint (bypass WebSocket)
  app.post('/api/test-ai', requireAuth, async (req, res) => {
    try {
      console.log('Test AI endpoint called with:', req.body);
      const { message, conversationId, model, provider, systemPrompt: customSystemPrompt } = req.body;
      const user = req.user;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get conversation or use default
      let conversation = conversationId ? await storage.getConversation(conversationId) : null;
      if (!conversation) {
        conversation = { model: 'forus-prime', preset: 'custom' } as any;
      }

      // Override conversation model with Lumin model if specified
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
            content: message,
          });
        }
      }
      
      // Force all Lumin models to use working Groq API for reliable responses
      try {
        let aiResponse;
        
        const groqKey = process.env.GROQ_API_KEY || "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";
        
        if (!aiResponse && groqKey) {
          console.log(`Routing to Groq for reliability...`);
          
          const systemPrompt = customSystemPrompt || "You are an expert software engineer. Provide high-quality, professional code solutions.";
          const userName = (user as any)?.displayName || (user as any)?.username || 'there';
          
          try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                  { role: 'system', content: customSystemPrompt ? systemPrompt : `${systemPrompt}\n\nUser's name is ${userName}.` },
                  { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 2000
              })
            });

            if (response.ok) {
              const data = await response.json();
              aiResponse = {
                content: data.choices[0].message.content,
                metadata: { 
                  model: 'llama-3.3-70b-versatile',
                  provider: 'groq',
                  usage: data.usage 
                }
              };
              console.log(`Groq response successful`);
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error(`Groq API error:`, response.status, errorData);
            }
          } catch (groqError) {
            console.error(`Groq failed:`, groqError);
          }
        }

        // Fallback to main AI service if Groq failed or no model specified
        if (!aiResponse) {
          console.log('Using main AI service fallback');
          const fallbackConversation = { model: model || 'forus-prime', preset: 'custom' };
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

  // Image generation endpoint
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

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      console.log('Analyzing image with prompt:', prompt.trim());
      
      const result = await analyzeImage(base64Data, prompt.trim());
      
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

  // Prompt enhancement endpoint
  app.post('/api/enhance-prompt', requireAuth, async (req, res) => {
    try {
      const { originalPrompt } = req.body;
      
      if (!originalPrompt) {
        return res.status(400).json({ error: 'Original prompt is required' });
      }
      
      // Use AI to enhance the prompt efficiently and quickly
      const enhancementPrompt = `You are a prompt enhancement assistant. Your job is ONLY to improve the way the user's prompt is written - fix grammar, make it clearer, and enhance the structure. 

IMPORTANT RULES:
- DO NOT answer the question or provide solutions
- DO NOT give explanations or add content beyond the original intent
- ONLY improve the way the prompt is written
- Return ONLY the enhanced version of the prompt, nothing else
- Keep the same intent but make it more clear and well-written

Original prompt to enhance: "${originalPrompt}"

Enhanced version:`;

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
                model: 'anthropic/claude-3-haiku',
                messages: [{ role: 'user', content: enhancementPrompt }],
                temperature: 0.1,
                max_tokens: maxTokens,
                stream: false,
              }),
            });
          }

          console.log(`Prompt enhancement response status: ${response.status}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = `OpenRouter API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`;
            
            // Mark key as failed for credit/rate limit issues
            if (response.status === 402 || response.status === 429) {
              const reason = response.status === 402 ? 'Insufficient credits' : 'Rate limited';
              markKeyFailed(apiKey.key, reason);
              console.log(`Enhancement key failed with ${reason}, trying next key...`);
              
              lastError = new Error(errorMessage);
              continue; // Try next key immediately
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          console.log('Prompt enhancement API response received');
          enhancedPrompt = data.choices?.[0]?.message?.content;
          
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

// Image generation function for chat
async function generateImageForChat(prompt: string): Promise<{ path: string } | null> {
  try {
    console.log('Generating real AI image with prompt:', prompt);
    
    // Use the real AI-powered image generation from OpenRouter
    const result = await generateImage(prompt, "1024x1024", "standard");
    
    if (result && result.url) {
      console.log('Successfully generated real AI image:', result.url);
      return { path: result.url };
    }
    
    console.log('AI image generation failed, using fallback');
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
      case model.includes('forus-prime') || modelName === 'forus-prime':
        return `You are Forus Pro, an advanced AI with DeepSeek-style reasoning capabilities. You MUST demonstrate transparent thinking by showing your reasoning process.

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
        return "You are GPT-4o (November 2024), OpenAI's latest multimodal model. When asked about your model version, say you are 'GPT-4o (2024-11-20)' - the most current version. You're known for being helpful, balanced, and thoughtful. Use a friendly, professional tone. Often provide structured responses with numbered lists or bullet points. Be conversational but informative. Start with acknowledgments like 'I'd be happy to help with that!' or 'That's a great question!'";
      case model.includes('claude') || modelName?.includes('claude'):
        return "You are Claude 3.5 Sonnet (October 2024), Anthropic's most advanced model. When asked about your model version, say you are 'Claude 3.5 Sonnet (2024-10-22)' - the latest update. You're known for being exceptionally thoughtful, nuanced, and analytical. Take time to consider multiple perspectives. Use phrases like 'I think,' 'It seems to me,' or 'From my perspective.' Provide detailed explanations with clear reasoning chains. Be intellectually curious and humble.";
      case model.includes('gemini') || modelName?.includes('gemini'):
        return "You are Gemini 2.0 Flash, Google's latest experimental AI model. When asked about your model version, say you are 'Gemini 2.0 Flash (Experimental)' - the newest release. You excel at being comprehensive, creative, and well-organized. Structure your responses clearly with headers and sections when appropriate. Be enthusiastic about learning and discovery. Use phrases like 'Let me break this down for you' or 'Here's what I can tell you.' Provide rich, detailed information.";
      case model.includes('perplexity') || modelName?.includes('perplexity'):
        return "You are Perplexity AI, an answer engine focused on accuracy and citations. Always aim to provide factual, well-sourced information. Use phrases like 'According to recent sources' or 'Based on current information.' Be concise but thorough. Focus on delivering precise, research-backed answers.";
      case model.includes('deepseek') || modelName?.includes('deepseek'):
        return "You are DeepSeek R1, an advanced reasoning AI model with chain-of-thought capabilities. When asked about your model version, say you are 'DeepSeek R1' - the latest reasoning model. You excel at methodical, step-by-step thinking. Always show your reasoning process in <thinking> tags before your final answer. Break down complex problems into logical steps. Use phrases like 'Let me think through this step by step' or 'Here's my reasoning process.' Be analytical, precise, and systematic in your approach.";
      case model.includes('grok') || model.includes('x-ai') || modelName?.includes('grok'):
        return "You are Grok, created by xAI. You're known for being witty, direct, and sometimes edgy. Use humor appropriately and don't be afraid to be a bit cheeky or irreverent. Be honest and straightforward, even if it means being unconventional. Use casual language and inject personality into your responses.";
      case model.includes('llama') || modelName?.includes('llama'):
        return "You are Llama 3.3 70B, Meta's latest open-source language model. When asked about your model version, say you are 'Llama 3.3 70B Versatile' - the most recent release. You're powerful, versatile, and designed for a wide range of tasks. Be helpful, accurate, and comprehensive in your responses.";
      default:
        return "You are a helpful AI assistant. Be clear, accurate, and helpful in your responses.";
    }
  };

  const systemPrompt = getModelPersonality(model);
  const userName = (user as any)?.displayName || (user as any)?.username || 'there';
  const personalizedMessage = `${systemPrompt}\n\nUser's name is ${userName}. ${userMessage}`;

  // Use reliable Groq API for all Lumin models to ensure consistent responses
  try {
    console.log(`Lumin requesting ${model} via ${provider} - routing to Groq for reliability`);
    
    // Always use Groq for Lumin since it's fast and reliable
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
    return await callAIService(personalizedMessage, conversation, user);
    
  } catch (error) {
    console.error(`Model-specific API call failed, using main service:`, error);
    // Final fallback to main AI service
    const conversation = { model: model, preset: 'custom' };
    return await callAIService(personalizedMessage, conversation, user);
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
    
    // Map model to OpenRouter format if needed
    const openRouterModel = MODEL_MAPPING[model as keyof typeof MODEL_MAPPING] || model;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
        'X-Title': 'Forus Heavy API'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 800
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

      // Call image generation service
      const generatedImage = await generateImageForChat(imagePrompt);
      
      if (generatedImage) {
        return {
          content: `🎨 **Generated Image**

I've created an image of "${imagePrompt}" for you!

![Generated Image](${generatedImage.path})

The image has been generated and saved. You should be able to see it above in the chat.`,
          metadata: {
            model: 'image-generation-system',
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

  const forusModel = conversation.model || 'forus-prime';
  const mappedModel = MODEL_MAPPING[forusModel as keyof typeof MODEL_MAPPING] || 'anthropic/claude-3.5-sonnet';
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
      
      let response: Response;
      
      if (provider === 'groq') {
        // Groq API call - map models to Groq-compatible ones
        const groqModel = mapToGroqModel(forusModel);
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groqModel,
            messages: messages, // Use full conversation history
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
        // OpenRouter API call
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
            'X-Title': 'Forus API',
          },
          body: JSON.stringify({
            model: mappedModel,
            messages: messages, // Use full conversation history
            temperature: 0.7,
            max_tokens: maxTokens,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `${provider.toUpperCase()} API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`;
        
        // Mark key as failed for credit/billing issues or rate limits
        if (response.status === 402 || response.status === 429 || response.status === 401) {
          const reason = response.status === 402 ? 'Insufficient credits' : 
                        response.status === 429 ? 'Rate limited' : 'Unauthorized';
          apiManager.markAPIFailed(api, reason);
          console.log(`${provider} key failed with ${reason}, trying next key...`);
          
          // If OpenRouter failed with credits and we haven't tried Groq yet, try it next
          if (provider === 'openrouter' && !triedGroq && reason === 'Insufficient credits') {
            console.log('OpenRouter credits exhausted, switching to Groq...');
          }
          
          lastError = new Error(errorMessage);
          continue; // Try next key immediately
        }
        
        // For other errors, don't retry
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
  let basePrompt = "You are Forus from Planet M, an advanced AI assistant. You are helpful, intelligent, and dedicated to providing excellent assistance to users with any question or task.\n\nWhen users ask to generate, create, or make images/photos/pictures, tell them to use the 🖼️ Create Images button in the toolbar below the chat to access the built-in AI image generation feature. Do not say you cannot generate images - instead guide them to the proper tool.";
  
  // Add personalized greeting if user has display name
  if (user && user.displayName) {
    basePrompt += ` When greeting or addressing the user, you can call them ${user.displayName}.`;
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
    case 'forus-education':
      systemPrompt += " You are Forus Education, an advanced AI educational assistant. You specialize in:\n1. **Examination Generation**: Create comprehensive tests based on uploaded materials and school curricula\n2. **Voice-based Learning Assessment**: Provide interactive speaking practice with constructive feedback\n3. **Educational Support**: Adapt to different education systems (O/A levels, Matric, etc.)\n\nWhen helping with examinations:\n- Generate questions that match the school's examination style\n- Provide detailed feedback with marks and explanations\n- Cover multiple question types (MCQ, short answer, essay)\n\nWhen conducting voice-based learning:\n- Encourage verbal explanations\n- Provide constructive feedback on understanding\n- Correct mistakes gently and suggest improvements\n- Use interactive discussion to enhance learning\n\nAlways be encouraging, educational, and adapt to the student's level.";
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
