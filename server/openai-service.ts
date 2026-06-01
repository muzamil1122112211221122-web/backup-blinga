import { apiManager } from './api-manager';

async function tryGeminiImageGeneration(prompt: string): Promise<{ success: boolean; url: string; revisedPrompt: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  // Try Imagen 4 models first (highest quality, uses :predict endpoint)
  const imagenModels = [
    'imagen-4.0-generate-001',
    'imagen-4.0-fast-generate-001',
    'imagen-4.0-ultra-generate-001',
  ];

  for (const model of imagenModels) {
    try {
      console.log(`Trying Imagen model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: prompt.trim() }],
          parameters: { sampleCount: 1 }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const prediction = data.predictions?.[0];
        if (prediction?.bytesBase64Encoded) {
          const mimeType = prediction.mimeType || 'image/png';
          console.log(`${model} image generation succeeded`);
          return {
            success: true,
            url: `data:${mimeType};base64,${prediction.bytesBase64Encoded}`,
            revisedPrompt: `Imagen-generated: ${prompt}`,
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`${model} failed:`, response.status, JSON.stringify(errorData).substring(0, 200));
      }
    } catch (err) {
      console.log(`${model} error:`, err);
    }
  }

  // Try Gemini image generation models (use :generateContent endpoint)
  const geminiImageModels = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
  ];

  for (const model of geminiImageModels) {
    try {
      console.log(`Trying Gemini image model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt.trim() }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            console.log(`${model} image generation succeeded`);
            return {
              success: true,
              url: `data:${mimeType};base64,${part.inlineData.data}`,
              revisedPrompt: `Gemini-generated: ${prompt}`,
            };
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`${model} failed:`, response.status, JSON.stringify(errorData).substring(0, 200));
      }
    } catch (err) {
      console.log(`${model} error:`, err);
    }
  }

  return null;
}

async function tryGeminiSvgGeneration(prompt: string): Promise<{ success: boolean; url: string; revisedPrompt: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    console.log('Using Gemini to generate SVG illustration...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `Create a detailed, beautiful, colorful SVG illustration of: ${prompt}\n\nRequirements:\n- Use rich colors, gradients, and artistic details\n- Include realistic shapes and visual depth\n- Size: 1024x1024 viewBox\n- Return ONLY the raw SVG code starting with <svg and ending with </svg>. No markdown, no explanation.` }]
        }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.8 }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.includes('<svg')) {
        const svgStart = text.indexOf('<svg');
        const svgEnd = text.lastIndexOf('</svg>') + 6;
        const cleanSvg = text.substring(svgStart, svgEnd);
        console.log('Gemini SVG generation succeeded');
        return {
          success: true,
          url: `data:image/svg+xml;base64,${Buffer.from(cleanSvg).toString('base64')}`,
          revisedPrompt: `Gemini illustration: ${prompt}`,
        };
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('Gemini SVG generation failed:', response.status, JSON.stringify(errorData).substring(0, 200));
    }
  } catch (err) {
    console.log('Gemini SVG generation error:', err);
  }

  return null;
}

async function tryGroqSvgGeneration(prompt: string): Promise<{ success: boolean; url: string; revisedPrompt: string } | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    console.log('Using Groq to generate SVG illustration...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SVG artist. Create detailed, beautiful SVG images with rich colors and gradients. Return ONLY the complete SVG code starting with <svg and ending with </svg>. No explanations, no markdown, just raw SVG.'
          },
          {
            role: 'user',
            content: `Create a detailed, beautiful, colorful SVG illustration of: ${prompt}\n\nMake it 1024x1024 with gradients, artistic details, and visual richness.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const svgContent = data.choices?.[0]?.message?.content;
      if (svgContent && svgContent.includes('<svg')) {
        const svgStart = svgContent.indexOf('<svg');
        const svgEnd = svgContent.lastIndexOf('</svg>') + 6;
        const cleanSvg = svgContent.substring(svgStart, svgEnd);
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(cleanSvg).toString('base64')}`;
        console.log('Groq SVG generation succeeded');
        return {
          success: true,
          url: dataUrl,
          revisedPrompt: `AI illustration: ${prompt}`,
        };
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('Groq SVG generation failed:', response.status, errorData);
    }
  } catch (err) {
    console.log('Groq SVG generation error:', err);
  }

  return null;
}

export async function generateImage(prompt: string, size: string = "1024x1024", quality: string = "standard") {
  console.log(`Generating photorealistic image for: "${prompt}"`);

  const [w, h] = (size.includes('x') ? size.split('x').map(n => parseInt(n, 10)) : [1024, 1024])
    .map(n => (Number.isFinite(n) && n > 0 ? n : 1024));

  // Strategy: return a direct Pollinations URL so the *browser* fetches the image.
  // The browser has the user's IP — not the server's IP — so Pollinations rate limits
  // never apply. Server responds in <100ms; browser loads the image natively.
  // We build 3 URL candidates (different models/seeds) as fallbacks embedded in the response.
  const seed = Math.floor(Math.random() * 9_000_000) + 1;
  const encodedPrompt = encodeURIComponent(prompt + ', photorealistic, ultra detailed, 8k');

  // Primary: flux (best quality)
  const primaryUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed}&model=flux`;
  // Fallback 1: flux-realism
  const fallback1 = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed + 1}&model=flux-realism`;
  // Fallback 2: turbo (fastest)
  const fallback2 = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed + 2}&model=turbo`;

  console.log(`Returning direct Pollinations URL (browser will load): ${primaryUrl.substring(0, 80)}...`);
  // Embed all three as a JSON metadata string so the client can try fallbacks if primary fails
  return {
    success: true,
    url: primaryUrl,
    revisedPrompt: prompt,
    fallbackUrls: [fallback1, fallback2],
  };
}



export function getAvailableKeyCount(): number {
  return apiManager.getAvailableCount();
}

// Image analysis function using OpenAI Vision API or Gemini
export async function analyzeImage(base64Image: string, prompt: string = "Describe this image in detail"): Promise<{
  success: boolean;
  analysis: string;
  error?: string;
}> {
  console.log(`Analyzing image with prompt: "${prompt}"`);
  
  // Detect MIME type from data URL prefix (defaults to png)
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const detectedMime = mimeMatch ? mimeMatch[1] : 'image/png';
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const dataUrl = `data:${detectedMime};base64,${cleanBase64}`;

  // Recognition hints (AI model logos + historical figures known in this app)
  let recognitionHint = '';
  try {
    const { buildRecognitionHint } = await import('./recognition-registry');
    recognitionHint = '\n\n' + buildRecognitionHint();
  } catch {}

  // Vision system prompt — natural, detailed, accurate
  const visionSystemPrompt = `You are a sharp-eyed visual analyst. Write a natural, flowing, detailed response in plain paragraphs — never numbered steps, headings, or bullet lists unless the user asks for them.

Before you answer, silently do this in your head:
- Read every visible word, letter, number, or wordmark exactly as written. Logos almost always contain their own brand name as text — use that text to identify the brand. If the text says "perplexity", the brand is Perplexity, not IKEA.
- Only name a brand, person, product, or place when you are genuinely confident. If you are not sure, say so honestly inside the description ("the wordmark is hard to read clearly, but it appears to say…"). Do NOT invent a name to sound confident — a wrong identification is worse than an honest "I'm not certain."

Then write your answer as a rich, natural description that:
- Names the subject up front when you can identify it confidently (e.g. "This is the Perplexity AI logo.")
- Describes colors, shapes, composition, style, mood, and any visible text
- Adds useful context about what the subject is or does, when you've identified it
- Reads like a knowledgeable friend talking, not a checklist

Keep it engaging and informative. Accuracy first, but never sacrifice the rich description.${recognitionHint}`;

  // Try Groq vision models first (Llama 4 has its own quota independent of Gemini)
  if (process.env.GROQ_API_KEY) {
    const groqVisionModels = [
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
    ];
    for (const model of groqVisionModels) {
      try {
        console.log(`Using Groq ${model} for image analysis (mime: ${detectedMime})...`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: visionSystemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: dataUrl } },
                ],
              },
            ],
            max_tokens: 1500,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            console.log(`Groq ${model} vision analysis successful`);
            return { success: true, analysis: text };
          }
          console.log(`Groq ${model} returned no text, trying next`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log(`Groq ${model} failed:`, response.status, JSON.stringify(errorData).substring(0, 200));
        }
      } catch (err) {
        console.log(`Groq ${model} error:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // Use Gemini Vision as fallback — try current models in order
  if (process.env.GEMINI_API_KEY) {
    const visionModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of visionModels) {
      try {
        console.log(`Using ${model} for image analysis (mime: ${detectedMime})...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: visionSystemPrompt }] },
            contents: [{
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType: detectedMime, data: cleanBase64 } }
              ]
            }],
            generationConfig: { maxOutputTokens: 1500, temperature: 0.4 }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
          if (textPart?.text) {
            console.log(`${model} vision analysis successful`);
            return { success: true, analysis: textPart.text };
          }
          console.log(`${model} returned no text, trying next model`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log(`${model} failed:`, response.status, JSON.stringify(errorData).substring(0, 200));
        }
      } catch (error) {
        console.log(`${model} error:`, error instanceof Error ? error.message : error);
      }
    }
  } else {
    console.log('No Gemini API key found, skipping Gemini vision analysis');
  }
  
  // Return error if both methods failed
  return {
    success: false,
    analysis: '',
    error: 'Image analysis failed - both OpenAI and Gemini vision services are unavailable. Please check your API keys and try again.'
  };
}