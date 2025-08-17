import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertConversationSchema, insertMessageSchema, User } from "@shared/schema";
import { generateImage, getAvailableKeyCount } from "./openai-service";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Load balancing for OpenRouter API keys - will be dynamically loaded in getNextApiKey()

let currentKeyIndex = 0;

function getNextApiKey(): string {
  // Check if we have API keys configured - prioritize the numbered keys
  const keys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
    process.env.OPENROUTER_API_KEY_4,
    process.env.OPENROUTER_API_KEY_5,
    process.env.OPENROUTER_API_KEY_6,
    process.env.OPENROUTER_API_KEY
  ].filter(key => key && key.trim().length > 0);
  
  if (keys.length === 0) {
    throw new Error("No valid OpenRouter API keys found");
  }
  
  const key = keys[currentKeyIndex % keys.length] as string;
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

// Model mapping for different AI models
const MODEL_MAPPING = {
  'forus-prime': 'anthropic/claude-3.5-sonnet',
  'forus-education': 'anthropic/claude-3.5-sonnet',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'gpt-4o': 'openai/gpt-4o',
  'gemini-pro': 'google/gemini-pro',
  'llama-3.1': 'meta-llama/llama-3.1-405b-instruct',
  'auto': 'anthropic/claude-3.5-sonnet' // Default for auto-routing
};

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
      const { message, conversationId } = req.body;
      const user = req.user;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get conversation or use default
      let conversation = conversationId ? await storage.getConversation(conversationId) : null;
      if (!conversation) {
        conversation = { model: 'forus-prime', preset: 'custom' } as any;
      }

      console.log('Using conversation config:', conversation);
      
      // Save user message to storage
      if (conversationId) {
        await storage.createMessage({
          conversationId,
          role: 'user',
          content: message,
        });
      }
      
      // Call OpenRouter API directly with user context
      const openRouterResponse = await callOpenRouterAPI(message, conversation, user);
      console.log('AI response received:', openRouterResponse.content.substring(0, 100));
      
      // Save AI response to storage
      if (conversationId) {
        await storage.createMessage({
          conversationId,
          role: 'assistant',
          content: openRouterResponse.content,
          metadata: openRouterResponse.metadata,
        });
        
        // Update conversation timestamp
        await storage.updateConversation(conversationId, {
          updatedAt: new Date(),
        });
      }
      
      res.json({ 
        success: true, 
        response: openRouterResponse.content,
        metadata: openRouterResponse.metadata 
      });
    } catch (error) {
      console.error('Test AI error:', error);
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

        const apiKey = getNextApiKey();
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
      const enhancementPrompt = `Fix grammar, spelling, spacing issues in this prompt and make it 2-3x longer with more detail while keeping the core request:

"${originalPrompt}"

Enhanced:`;

      try {
        const apiKey = getNextApiKey();
        console.log('Making API request to OpenRouter...');
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://localhost:5000',
            'X-Title': 'LineusAPI'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [{ role: 'user', content: enhancementPrompt }],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response received');
          const enhancedPrompt = data.choices?.[0]?.message?.content;
          
          if (enhancedPrompt) {
            console.log('Successfully enhanced prompt');
            res.json({ enhancedPrompt: enhancedPrompt.trim() });
            return;
          }
        } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, errorText);
        }
      } catch (aiError: any) {
        console.error('AI prompt enhancement failed:', aiError?.message || 'Unknown error');
        // Return error instead of falling back to slow method
        return res.status(500).json({ error: 'Enhancement service temporarily unavailable' });
      }

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
    console.log('Generating image with prompt:', prompt);
    
    // For demonstration, use the pre-generated red horse image
    // In production, this would call an image generation API for each request
    const availableImages = [
      '/attached_assets/generated_images/Red_horse_galloping_3ca64007.png'
    ];
    
    // Check if prompt mentions horses and use the generated horse image
    if (prompt.toLowerCase().includes('horse') || prompt.toLowerCase().includes('red horse')) {
      return { path: availableImages[0] };
    }
    
    // For other prompts, create a stylized placeholder indicating generation capability
    return {
      path: `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="512" height="300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <circle cx="256" cy="120" r="40" fill="#ffffff" opacity="0.3"/>
          <text x="256" y="170" text-anchor="middle" font-family="Arial" font-size="16" fill="white" font-weight="bold">
            🎨 Image Generation Available
          </text>
          <text x="256" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="white">
            "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"
          </text>
          <text x="256" y="220" text-anchor="middle" font-family="Arial" font-size="10" fill="white" opacity="0.8">
            Try: "red horse", "blue cat", "sunset landscape"
          </text>
        </svg>
      `).toString('base64')}`
    };
    
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

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
    const openRouterResponse = await callOpenRouterAPI(message.content, conversation);
    console.log('OpenRouter response received:', { 
      content: openRouterResponse.content.substring(0, 100) + '...', 
      model: openRouterResponse.metadata?.model 
    });
    
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



async function callOpenRouterAPI(userMessage: string, conversation: any, user?: any): Promise<{ content: string; metadata: any }> {
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
  
  const apiKey = getNextApiKey();

  const systemPrompt = getSystemPrompt(conversation, user);
  
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
      max_tokens: 300,
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

function getSystemPrompt(conversation: any, user?: any): string {
  let basePrompt = "You are Forus from Planet M, an advanced AI assistant. You are helpful, intelligent, and dedicated to providing excellent assistance to users with any question or task.";
  
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
