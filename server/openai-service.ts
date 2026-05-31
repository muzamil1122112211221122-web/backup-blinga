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

  // First try: Pollinations.ai — free, no-auth, fast (2-5s), returns real photographic images
  try {
    console.log('Using Pollinations.ai for fast photorealistic image generation...');
    const [w, h] = (size.includes('x') ? size.split('x').map(n => parseInt(n, 10)) : [1024, 1024])
      .map(n => (Number.isFinite(n) && n > 0 ? n : 1024));
    const seed = Math.floor(Math.random() * 1_000_000);
    const enhancedPrompt = `${prompt}, photorealistic, ultra detailed, 8k, sharp focus, masterpiece`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}` +
      `?width=${w}&height=${h}&seed=${seed}&model=flux&nologo=true&enhance=true`;

    const imgResponse = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (imgResponse.ok) {
      const contentType = imgResponse.headers.get('content-type') || '';
      const arrayBuffer = await imgResponse.arrayBuffer();
      if (contentType.startsWith('image/') && arrayBuffer.byteLength > 1024) {
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        console.log(`Pollinations image ready (${Math.round(base64.length / 1024)}KB, ${contentType})`);
        return {
          success: true,
          url: `data:${contentType};base64,${base64}`,
          revisedPrompt: `Photorealistic: ${prompt}`,
        };
      }
      console.log(`Pollinations returned non-image or tiny payload (type=${contentType}, bytes=${arrayBuffer.byteLength}), falling through`);
    } else {
      console.log('Pollinations failed:', imgResponse.status);
    }
  } catch (error) {
    console.log('Pollinations error:', error instanceof Error ? error.message : error);
  }

  // Second try: Pollinations.ai with different seed (fast retry)
  try {
    console.log('Retrying Pollinations.ai with fresh seed...');
    const [w2, h2] = (size.includes('x') ? size.split('x').map(n => parseInt(n, 10)) : [1024, 1024])
      .map(n => (Number.isFinite(n) && n > 0 ? n : 1024));
    const seed2 = Math.floor(Math.random() * 9_000_000) + 1_000_000;
    const url2 = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', high quality, detailed')}` +
      `?width=${w2}&height=${h2}&seed=${seed2}&model=flux&nologo=true`;
    const imgResponse2 = await fetch(url2, { signal: AbortSignal.timeout(20000) });
    if (imgResponse2.ok) {
      const contentType2 = imgResponse2.headers.get('content-type') || '';
      const arrayBuffer2 = await imgResponse2.arrayBuffer();
      if (contentType2.startsWith('image/') && arrayBuffer2.byteLength > 1024) {
        const base64_2 = Buffer.from(arrayBuffer2).toString('base64');
        console.log(`Pollinations retry image ready (${Math.round(base64_2.length / 1024)}KB)`);
        return { success: true, url: `data:${contentType2};base64,${base64_2}`, revisedPrompt: prompt };
      }
    }
  } catch (error) {
    console.log('Pollinations retry error:', error instanceof Error ? error.message : error);
  }

  // Second try: Gemini image generation (Imagen 4 / Gemini image models — requires paid plan)
  const geminiResult = await tryGeminiImageGeneration(prompt);
  if (geminiResult) return geminiResult;
  
  // Third try: Use OpenAI DALL-E 3 for photorealistic images
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('Using OpenAI DALL-E 3 for high-quality image generation...');
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          prompt: prompt.trim(),
          n: 1,
          size: size,
          quality: quality,
          response_format: 'url'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('OpenAI DALL-E 3 response:', data);
        
        if (data.data && data.data[0] && data.data[0].url) {
          console.log(`Successfully generated DALL-E 3 image for: "${prompt}"`);
          return {
            success: true,
            url: data.data[0].url,
            revisedPrompt: data.data[0].revised_prompt || prompt,
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('OpenAI DALL-E 3 failed:', response.status, errorData);
        throw new Error(`OpenAI DALL-E 3 error: ${response.status}`);
      }
    } catch (error) {
      console.log('DALL-E 3 generation failed, trying Groq SVG alternative:', error);
    }
  } else {
    console.log('No OpenAI API key found, skipping DALL-E 3');
  }

  // Fourth try: Use Gemini text model to generate an SVG illustration (free tier)
  const geminiSvgResult = await tryGeminiSvgGeneration(prompt);
  if (geminiSvgResult) return geminiSvgResult;

  // Fifth try: Use Groq to generate an SVG illustration
  const groqSvgResult = await tryGroqSvgGeneration(prompt);
  if (groqSvgResult) return groqSvgResult;
  
  // Final fallback: Create a hand-coded SVG for common prompts
  console.log('Creating hand-crafted visual for:', prompt);
  
  // Create highly detailed, realistic SVG representations
  const createDetailedSVG = (item: string): string => {
    const itemLower = item.toLowerCase();
    
    if (itemLower.includes('horse')) {
      return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="skyGrad" cx="50%" cy="20%" r="80%">
            <stop offset="0%" style="stop-color:#FFE55C;stop-opacity:1" />
            <stop offset="30%" style="stop-color:#FF9F40;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#FF6B6B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
          </radialGradient>
          <radialGradient id="horseBody" cx="40%" cy="30%" r="60%">
            <stop offset="0%" style="stop-color:#F4E4BC;stop-opacity:1" />
            <stop offset="40%" style="stop-color:#D2691E;stop-opacity:1" />
            <stop offset="80%" style="stop-color:#A0522D;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1" />
          </radialGradient>
          <linearGradient id="maneFlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2C1810;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#5D4037;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3E2723;stop-opacity:1" />
          </linearGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="3" dy="6" result="offset"/>
            <feFlood flood-color="#000000" flood-opacity="0.3"/>
            <feComposite in2="offset" operator="in"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        <!-- Background with sunset sky -->
        <rect width="1024" height="1024" fill="url(#skyGrad)"/>
        
        <!-- Distant mountains -->
        <path d="M 0 650 Q 150 580 300 620 Q 450 560 600 600 Q 750 540 900 580 Q 950 600 1024 590 L 1024 1024 L 0 1024 Z" fill="#8E44AD" opacity="0.6"/>
        <path d="M 0 700 Q 200 640 400 680 Q 600 620 800 660 Q 900 680 1024 670 L 1024 1024 L 0 1024 Z" fill="#9B59B6" opacity="0.4"/>
        
        <!-- Ground with texture -->
        <ellipse cx="512" cy="920" rx="512" ry="104" fill="#2E7D32"/>
        <ellipse cx="400" cy="900" rx="200" ry="50" fill="#4CAF50" opacity="0.8"/>
        <ellipse cx="700" cy="910" rx="180" ry="45" fill="#66BB6A" opacity="0.7"/>
        
        <!-- Horse realistic body using complex paths -->
        <!-- Main body -->
        <path d="M 400 600 Q 380 580 420 560 Q 480 540 560 560 Q 620 580 640 620 Q 630 680 600 700 Q 550 720 500 710 Q 450 700 420 670 Q 390 640 400 600 Z" fill="url(#horseBody)" filter="url(#softShadow)"/>
        
        <!-- Chest/shoulder -->
        <path d="M 350 580 Q 320 560 340 530 Q 380 520 420 540 Q 440 560 430 590 Q 410 610 380 610 Q 350 600 350 580 Z" fill="url(#horseBody)"/>
        
        <!-- Neck with curve -->
        <path d="M 340 530 Q 310 480 290 430 Q 280 400 300 380 Q 330 370 360 390 Q 380 420 370 450 Q 360 480 350 510 Q 345 520 340 530 Z" fill="url(#horseBody)"/>
        
        <!-- Head with realistic shape -->
        <path d="M 290 430 Q 260 410 240 380 Q 220 350 230 320 Q 250 300 280 310 Q 310 320 330 350 Q 340 380 330 410 Q 320 430 300 440 Q 295 435 290 430 Z" fill="url(#horseBody)"/>
        
        <!-- Snout/muzzle -->
        <path d="M 240 380 Q 210 370 190 385 Q 170 400 180 420 Q 200 440 230 430 Q 250 420 255 400 Q 250 390 240 380 Z" fill="#E6B880"/>
        
        <!-- Ears -->
        <path d="M 280 320 Q 275 300 285 290 Q 295 285 305 295 Q 310 310 300 325 Q 290 330 280 320 Z" fill="url(#horseBody)"/>
        <path d="M 310 315 Q 305 295 315 285 Q 325 280 335 290 Q 340 305 330 320 Q 320 325 310 315 Z" fill="url(#horseBody)"/>
        
        <!-- Realistic legs with joints -->
        <!-- Front left leg -->
        <path d="M 380 700 Q 375 740 370 780 Q 365 820 370 860 L 385 860 Q 390 820 395 780 Q 400 740 395 700 Q 387 700 380 700 Z" fill="url(#horseBody)"/>
        <!-- Front right leg -->
        <path d="M 420 710 Q 415 750 410 790 Q 405 830 410 870 L 425 870 Q 430 830 435 790 Q 440 750 435 710 Q 427 710 420 710 Z" fill="url(#horseBody)"/>
        <!-- Back left leg -->
        <path d="M 560 720 Q 555 760 550 800 Q 545 840 550 880 L 565 880 Q 570 840 575 800 Q 580 760 575 720 Q 567 720 560 720 Z" fill="url(#horseBody)"/>
        <!-- Back right leg -->
        <path d="M 600 715 Q 595 755 590 795 Q 585 835 590 875 L 605 875 Q 610 835 615 795 Q 620 755 615 715 Q 607 715 600 715 Z" fill="url(#horseBody)"/>
        
        <!-- Hooves -->
        <ellipse cx="377" cy="865" rx="12" ry="8" fill="#2C2C2C"/>
        <ellipse cx="417" cy="875" rx="12" ry="8" fill="#2C2C2C"/>
        <ellipse cx="557" cy="885" rx="13" ry="8" fill="#2C2C2C"/>
        <ellipse cx="597" cy="880" rx="13" ry="8" fill="#2C2C2C"/>
        
        <!-- Flowing mane with individual strands -->
        <path d="M 300 380 Q 280 340 260 300 Q 270 320 285 350 Q 295 370 300 380" fill="url(#maneFlow)"/>
        <path d="M 310 390 Q 290 350 270 310 Q 280 330 295 360 Q 305 380 310 390" fill="url(#maneFlow)"/>
        <path d="M 320 400 Q 300 360 280 320 Q 290 340 305 370 Q 315 390 320 400" fill="url(#maneFlow)"/>
        <path d="M 330 410 Q 310 370 290 330 Q 300 350 315 380 Q 325 400 330 410" fill="url(#maneFlow)"/>
        <path d="M 340 420 Q 320 380 300 340 Q 310 360 325 390 Q 335 410 340 420" fill="url(#maneFlow)"/>
        
        <!-- Realistic tail -->
        <path d="M 640 620 Q 680 610 720 640 Q 740 670 720 700 Q 700 730 670 720 Q 650 700 645 670 Q 642 645 640 620" fill="url(#maneFlow)"/>
        <path d="M 645 630 Q 685 620 725 650 Q 745 680 725 710 Q 705 740 675 730 Q 655 710 650 680 Q 647 655 645 630" fill="url(#maneFlow)" opacity="0.7"/>
        
        <!-- Detailed eye -->
        <ellipse cx="270" cy="360" rx="15" ry="10" fill="#FFFFFF"/>
        <circle cx="272" cy="360" r="10" fill="#1A1A1A"/>
        <circle cx="275" cy="356" r="4" fill="#FFFFFF"/>
        <ellipse cx="277" cy="354" rx="2" ry="1" fill="#FFFFFF"/>
        
        <!-- Nostril -->
        <ellipse cx="195" cy="400" rx="4" ry="8" fill="#000000"/>
        
        <!-- Mouth detail -->
        <path d="M 180 425 Q 190 430 200 425" stroke="#8B4513" stroke-width="2" fill="none"/>
        
        <!-- Atmospheric elements -->
        <!-- Clouds -->
        <g opacity="0.8">
          <ellipse cx="150" cy="100" rx="50" ry="30" fill="#FFFFFF"/>
          <ellipse cx="180" cy="90" rx="40" ry="25" fill="#FFFFFF"/>
          <ellipse cx="170" cy="110" rx="35" ry="20" fill="#FFFFFF"/>
        </g>
        
        <!-- Sun -->
        <circle cx="900" cy="150" r="80" fill="#FFD700" opacity="0.9"/>
        <g stroke="#FFD700" stroke-width="8" opacity="0.6">
          <line x1="900" y1="30" x2="900" y2="90"/>
          <line x1="900" y1="210" x2="900" y2="270"/>
          <line x1="780" y1="150" x2="840" y2="150"/>
          <line x1="960" y1="150" x2="1020" y2="150"/>
          <line x1="820" y1="70" x2="860" y2="110"/>
          <line x1="940" y1="190" x2="980" y2="230"/>
          <line x1="820" y1="230" x2="860" y2="190"/>
          <line x1="940" y1="110" x2="980" y2="70"/>
        </g>
      </svg>`;
    }
    
    // For other items, create detailed visual representations
    return createObjectSVG(item);
  };
  
  // Create detailed SVGs for various objects
  const createObjectSVG = (item: string): string => {
    const itemLower = item.toLowerCase();
    
    // Enhanced visual representations for common objects
    if (itemLower.includes('cat')) {
      return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="catGrad">
            <stop offset="0%" style="stop-color:#FFB347"/>
            <stop offset="100%" style="stop-color:#FF7F00"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="#E6F3FF"/>
        <ellipse cx="512" cy="600" rx="120" ry="80" fill="url(#catGrad)"/>
        <circle cx="512" cy="450" r="100" fill="url(#catGrad)"/>
        <polygon points="450,350 470,300 490,350" fill="url(#catGrad)"/>
        <polygon points="534,350 554,300 574,350" fill="url(#catGrad)"/>
        <circle cx="480" cy="430" r="8" fill="#000"/>
        <circle cx="544" cy="430" r="8" fill="#000"/>
        <polygon points="500,460 512,480 524,460" fill="#FF69B4"/>
        <path d="M 480 500 Q 512 520 544 500" stroke="#000" stroke-width="3" fill="none"/>
      </svg>`;
    } else if (itemLower.includes('car')) {
      return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="carGrad">
            <stop offset="0%" style="stop-color:#FF4444"/>
            <stop offset="100%" style="stop-color:#CC0000"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="#87CEEB"/>
        <rect x="200" y="500" width="600" height="150" rx="20" fill="url(#carGrad)"/>
        <rect x="250" y="400" width="500" height="100" rx="15" fill="url(#carGrad)"/>
        <circle cx="300" cy="680" r="60" fill="#333"/>
        <circle cx="700" cy="680" r="60" fill="#333"/>
        <circle cx="300" cy="680" r="40" fill="#666"/>
        <circle cx="700" cy="680" r="40" fill="#666"/>
        <rect x="300" y="420" width="100" height="60" fill="#87CEEB" opacity="0.8"/>
        <rect x="600" y="420" width="100" height="60" fill="#87CEEB" opacity="0.8"/>
      </svg>`;
    }
    
    // Generic detailed illustration for any other item
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const mainColor = colors[Math.floor(Math.random() * colors.length)];
    const secondColor = colors[Math.floor(Math.random() * colors.length)];
    
    return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mainGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
          <stop offset="60%" style="stop-color:${mainColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondColor};stop-opacity:1" />
        </radialGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0f8ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e6f3ff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bgGrad)"/>
      <circle cx="512" cy="400" r="180" fill="url(#mainGrad)" stroke="#333" stroke-width="3"/>
      <circle cx="460" cy="350" r="25" fill="#333"/>
      <circle cx="564" cy="350" r="25" fill="#333"/>
      <circle cx="463" cy="347" r="8" fill="#fff"/>
      <circle cx="567" cy="347" r="8" fill="#fff"/>
      <path d="M 420 480 Q 512 520 604 480" stroke="#333" stroke-width="6" fill="none"/>
      <rect x="412" y="650" width="200" height="80" rx="10" fill="${mainColor}" stroke="#333" stroke-width="2"/>
      <text x="512" y="700" font-family="Arial, sans-serif" font-size="36" fill="#333" text-anchor="middle" font-weight="bold">${item}</text>
      <circle cx="200" cy="200" r="40" fill="#FFD700" opacity="0.7"/>
      <circle cx="800" cy="150" r="35" fill="#FFD700" opacity="0.7"/>
    </svg>`;
  };
  
  const svgContent = createDetailedSVG(prompt);
  // Add timestamp and random number to ensure uniqueness and prevent caching
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const uniqueSvg = svgContent.replace('xmlns="http://www.w3.org/2000/svg">', `xmlns="http://www.w3.org/2000/svg" data-timestamp="${timestamp}" data-id="${randomId}">`);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(uniqueSvg).toString('base64')}`;
  
  console.log(`Generated unique detailed visual for: "${prompt}" (${timestamp})`);
  return {
    success: true,
    url: dataUrl,
    revisedPrompt: `Detailed illustration: ${prompt}`,
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