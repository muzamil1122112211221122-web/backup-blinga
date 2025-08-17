import OpenAI from "openai";

// Array of OpenAI API keys for load balancing
const API_KEYS = [
  process.env.OPENAI_API_KEY_1,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
  process.env.OPENAI_API_KEY_4,
  process.env.OPENAI_API_KEY_5,
  process.env.OPENAI_API_KEY_6,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error("No OpenAI API keys configured");
  }
  
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

export async function generateImage(prompt: string, size: string = "1024x1024", quality: string = "standard") {
  const apiKey = getNextApiKey();
  const openai = new OpenAI({ apiKey });

  try {
    console.log(`Generating image with prompt: "${prompt}" using key index ${currentKeyIndex - 1}`);
    
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "dall-e-3" which was released November 2023. do not change this unless explicitly requested by the user
      prompt,
      n: 1,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      quality: quality as "standard" | "hd",
    });

    if (response.data && response.data[0] && response.data[0].url) {
      return {
        success: true,
        url: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt,
      };
    } else {
      throw new Error("No image URL returned from OpenAI");
    }
  } catch (error) {
    console.error("OpenAI image generation error:", error);
    
    // If this was a rate limit or quota error, try the next key
    if (error instanceof Error && (
      error.message.includes('rate limit') || 
      error.message.includes('quota') ||
      error.message.includes('insufficient_quota')
    )) {
      console.log("Rate limit hit, trying next API key...");
      if (API_KEYS.length > 1) {
        return generateImage(prompt, size, quality);
      }
    }
    
    throw error;
  }
}

export function getAvailableKeyCount(): number {
  return API_KEYS.length;
}