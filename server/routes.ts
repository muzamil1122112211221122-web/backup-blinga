import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertConversationSchema, insertMessageSchema, User } from "@shared/schema";
import { z } from "zod";

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

  // User routes
  app.get('/api/user', requireAuth, async (req, res) => {
    try {
      res.json(req.user);
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

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, { ws });

    console.log(`Client ${clientId} connected`);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(clientId);
        
        if (!client) return;

        switch (message.type) {
          case 'join_conversation':
            client.conversationId = message.conversationId;
            client.userId = message.userId;
            break;

          case 'send_message':
            await handleChatMessage(message, client, clients);
            break;

          case 'typing':
            broadcastToConversation(message.conversationId, {
              type: 'typing',
              userId: client.userId,
              isTyping: message.isTyping,
            }, clientId, clients);
            break;
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

  return httpServer;
}

async function handleChatMessage(message: any, client: ChatClient, clients: Map<string, ChatClient>) {
  try {
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
    const openRouterResponse = await callOpenRouterAPI(message.content, conversation);
    
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

async function callOpenRouterAPI(userMessage: string, conversation: any) {
  const forusModel = conversation.model || 'forus-prime';
  const apiKey = FORUS_API_KEYS[forusModel as keyof typeof FORUS_API_KEYS];
  const mappedModel = MODEL_MAPPING[forusModel as keyof typeof MODEL_MAPPING] || 'anthropic/claude-3.5-sonnet';
  
  if (!apiKey) {
    throw new Error(`API key not configured for model: ${forusModel}`);
  }

  const systemPrompt = getSystemPrompt(conversation);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
      'X-Title': 'Forus API',
    },
    body: JSON.stringify({
      model: mappedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.',
    metadata: {
      model: data.model,
      usage: data.usage,
      provider: 'OpenRouter',
    }
  };
}

function getSystemPrompt(conversation: any): string {
  const basePrompt = "You are Forus from Planet M, an advanced AI assistant. You are helpful, intelligent, and dedicated to providing excellent assistance to users with any question or task.";
  
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
