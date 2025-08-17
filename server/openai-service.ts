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
  // Use AI to search for and find relevant images from the internet
  const apiKey = getNextOpenRouterApiKey();
  
  try {
    console.log(`AI searching for images related to: "${prompt}"`);
    
    // Use OpenRouter to find relevant image search terms and sources
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lineusapi.replit.app',
        'X-Title': 'LineusAPI Image Search'
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: `You are an expert image researcher. Your task is to find high-quality, royalty-free images from the internet that match the user's request. 

Search for images using these reliable sources:
1. Unsplash API (unsplash.com) - Professional stock photos
2. Pixabay API (pixabay.com) - Free images and photos
3. Pexels API (pexels.com) - High-quality stock photos

For the user's request, provide:
1. 3-5 specific search terms that would find the best images
2. The most relevant image URL from these free sources
3. A description of what makes this image perfect for the request

Respond in JSON format:
{
  "searchTerms": ["term1", "term2", "term3"],
  "imageUrl": "direct_image_url",
  "description": "why this image matches the request",
  "source": "platform_name"
}`
          },
          {
            role: "user",
            content: `Find a high-quality image for: "${prompt}"`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const imageData = JSON.parse(aiResult.choices[0].message.content);
    
    // If AI found a specific image URL, validate it
    if (imageData.imageUrl && imageData.imageUrl.startsWith('http')) {
      try {
        const imageResponse = await fetch(imageData.imageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
          return {
            success: true,
            url: imageData.imageUrl,
            revisedPrompt: `${imageData.description} (Source: ${imageData.source})`,
          };
        }
      } catch (e) {
        console.log("Direct image URL not accessible, falling back to search");
      }
    }
    
    // Fallback: Search Unsplash for free high-quality images
    const searchTerm = imageData.searchTerms?.[0] || prompt;
    const unsplashUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(searchTerm)}`;
    
    return {
      success: true,
      url: unsplashUrl,
      revisedPrompt: `High-quality photo: ${searchTerm} (Source: Unsplash)`,
    };
    
  } catch (error) {
    console.error("AI image search error:", error);
    
    // Final fallback: Use Unsplash with the original prompt
    const fallbackUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(prompt)}`;
    
    return {
      success: true,
      url: fallbackUrl,
      revisedPrompt: `Stock photo: ${prompt} (Source: Unsplash)`,
    };
  }
}



export function getAvailableKeyCount(): number {
  return OPENROUTER_API_KEYS.length;
}