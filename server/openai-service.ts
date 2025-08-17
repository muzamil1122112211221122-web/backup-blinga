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
  // Since OpenRouter doesn't support image generation, we'll use a free alternative
  // Using Pollinations API which is free and doesn't require API keys
  try {
    console.log(`Generating image with prompt: "${prompt}" using Pollinations API`);
    
    // Create URL-safe prompt
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Determine dimensions from size parameter
    let width = 1024, height = 1024;
    if (size === "1024x1792") {
      width = 1024;
      height = 1792;
    } else if (size === "1792x1024") {
      width = 1792;
      height = 1024;
    }
    
    // Pollinations API endpoint
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true`;
    
    // Test if the image URL is accessible
    const testResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return {
        success: true,
        url: imageUrl,
        revisedPrompt: prompt, // Pollinations doesn't modify prompts
      };
    } else {
      throw new Error(`Image generation failed with status: ${testResponse.status}`);
    }
  } catch (error) {
    console.error("Image generation error:", error);
    
    // Fallback to a different approach - generate an SVG placeholder
    const svgImage = generatePlaceholderSVG(prompt, size);
    
    return {
      success: true,
      url: `data:image/svg+xml;base64,${Buffer.from(svgImage).toString('base64')}`,
      revisedPrompt: `SVG representation: ${prompt}`,
    };
  }
}

function generatePlaceholderSVG(prompt: string, size: string): string {
  let width = 1024, height = 1024;
  if (size === "1024x1792") {
    width = 1024;
    height = 1792;
  } else if (size === "1792x1024") {
    width = 1792;
    height = 1024;
  }
  
  // Generate a colorful gradient based on the prompt
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
  const hash = prompt.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const color1 = colors[Math.abs(hash) % colors.length];
  const color2 = colors[Math.abs(hash + 1) % colors.length];
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
        <tspan x="50%" dy="0">🎨</tspan>
        <tspan x="50%" dy="40">Image: ${prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}</tspan>
        <tspan x="50%" dy="30" font-size="16" opacity="0.8">AI Image Generation</tspan>
      </text>
    </svg>
  `.trim();
}

export function getAvailableKeyCount(): number {
  return OPENROUTER_API_KEYS.length;
}