// Array of OpenRouter API keys for load balancing
const OPENROUTER_API_KEYS = [
  process.env.OPENAI_API_KEY_1,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
  process.env.OPENAI_API_KEY_4,
  process.env.OPENAI_API_KEY_5,
  process.env.OPENAI_API_KEY_6,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextOpenRouterApiKey(): string {
  if (OPENROUTER_API_KEYS.length === 0) {
    throw new Error("No OpenRouter API keys configured");
  }
  
  const key = OPENROUTER_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENROUTER_API_KEYS.length;
  return key;
}

export async function generateImage(prompt: string, size: string = "1024x1024", quality: string = "standard") {
  const apiKey = getNextOpenRouterApiKey();

  try {
    console.log(`Generating image with prompt: "${prompt}" using OpenRouter key index ${currentKeyIndex - 1}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lineusapi.replit.app',
        'X-Title': 'LineusAPI Image Generator'
      },
      body: JSON.stringify({
        model: "openai/dall-e-3", // Using DALL-E 3 through OpenRouter
        prompt,
        n: 1,
        size,
        quality,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      return {
        success: true,
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt || prompt,
      };
    } else {
      throw new Error("No image URL returned from OpenRouter");
    }
  } catch (error) {
    console.error("OpenRouter image generation error:", error);
    
    // If this was a rate limit or quota error, try the next key
    if (error instanceof Error && (
      error.message.includes('rate limit') || 
      error.message.includes('quota') ||
      error.message.includes('insufficient_quota') ||
      error.message.includes('429')
    )) {
      console.log("Rate limit hit, trying next API key...");
      if (OPENROUTER_API_KEYS.length > 1) {
        return generateImage(prompt, size, quality);
      }
    }
    
    throw error;
  }
}

export function getAvailableKeyCount(): number {
  return OPENROUTER_API_KEYS.length;
}