import { useState, useRef, useMemo } from "react";
import { X, Sparkles, ArrowUp, Download, ChevronLeft, Wand2, Upload, Loader2, Images } from "lucide-react";
import animeBoy1 from "@assets/Cute-Anime-Boy-Desktop-Wallpaper_1780491124348.jpg";
import animeBoy2 from "@assets/e4acdbfb00577aa06233ae2d91e2629a_1780491124348.jpg";
import animeBoy3 from "@assets/cool-anime-cartoon-dp_1780491124349.jpeg";
import animeBoy4 from "@assets/Vwmyh9_1780491124350.jpg";
import animeBoy5 from "@assets/HD-wallpaper-handsome-anime-boy-handsome-boy-anime_1780491124350.jpg";
import animeBoy6 from "@assets/HD-wallpaper-handsome-anime-boy-hōtarō-oreki-handsome-boy-anim_1780491124351.jpg";

const ANIME_BOY_IMAGES = [animeBoy1, animeBoy2, animeBoy3, animeBoy4, animeBoy5, animeBoy6];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TEMPLATES = [
  { id: 'realistic-portrait', icon: '📸', name: 'Realistic Portrait', desc: 'Ultra-HD photo', prompt: 'ultra-realistic portrait photography, professional studio lighting, 8K resolution, sharp focus, photorealistic skin texture' },
  { id: 'pro-headshot', icon: '💼', name: 'Pro Headshot', desc: 'LinkedIn ready', prompt: 'professional business headshot, neutral background, confident expression, sharp focus, high quality corporate portrait photography' },
  { id: 'anime', icon: '🎌', name: 'Anime', desc: 'Japanese animation', prompt: 'anime scenic landscape, vibrant 2D cel animation background art, Studio Ghibli Makoto Shinkai inspired, rolling hills glowing sky floating islands, bold ink outlines, flat color shading, anime color palette, no characters no people' },
  { id: 'pixel-art', icon: '🕹️', name: 'Pixel Art', desc: '8-bit retro style', prompt: 'pixel art style, 8-bit retro game art, pixelated low resolution aesthetic, vibrant flat colors, pixel grid visible, NES SNES era video game art style, isometric pixel art' },
  { id: 'ghibli', icon: '🌿', name: 'Ghibli Style', desc: 'Magical & dreamy', prompt: 'Studio Ghibli art style, soft warm colors, magical atmosphere, detailed painterly backgrounds, gentle natural lighting, Miyazaki aesthetic' },
  { id: 'cyberpunk', icon: '🌆', name: 'Cyberpunk', desc: 'Neon future', prompt: 'cyberpunk aesthetic, neon lights reflecting on rain-slicked streets, futuristic mega-city, electric blues and magentas, cinematic lighting' },
  { id: '3d-render', icon: '🔮', name: '3D Render', desc: 'Digital realism', prompt: '3D CGI rendered artwork, photorealistic 3D model, Blender Cycles render, ray tracing global illumination, subsurface scattering skin, metallic reflections, Octane render quality, studio HDRI lighting, ultra detailed mesh' },
  { id: 'fantasy', icon: '🐉', name: 'Fantasy Art', desc: 'Epic & magical', prompt: 'epic fantasy illustration, dramatic magical lighting, detailed intricate elements, painterly digital art masterpiece' },
  { id: 'oil-painting', icon: '🎨', name: 'Oil Painting', desc: 'Classical art', prompt: 'classical oil painting, impressionist brushwork, rich warm colors, textured canvas, old master technique, museum quality' },
  { id: 'watercolor', icon: '💧', name: 'Watercolor', desc: 'Soft & artistic', prompt: 'delicate watercolor painting, soft transparent washes, wet-on-wet technique, artistic brushstrokes, gentle color gradients' },
  { id: 'sketch', icon: '✏️', name: 'Pencil Sketch', desc: 'Hand-drawn feel', prompt: 'detailed pencil sketch, fine crosshatching, artistic line drawing, graphite shading, hand-drawn quality, sketchbook style' },
  { id: 'cinematic', icon: '🎬', name: 'Cinematic', desc: 'Movie quality', prompt: 'cinematic wide shot, anamorphic lens flare, dramatic film lighting, Hollywood movie quality, color graded, ARRI cinema' },
  { id: 'architecture', icon: '🏛️', name: 'Architecture', desc: 'Building design', prompt: 'architectural visualization, modern contemporary design, photorealistic render, natural lighting, detailed structural materials' },
  { id: 'interior', icon: '🛋️', name: 'Interior Design', desc: 'Home & spaces', prompt: 'interior design visualization, cozy atmosphere, natural lighting, modern aesthetic, Architectural Digest quality' },
  { id: 'product', icon: '📦', name: 'Product Photo', desc: 'Commercial shoot', prompt: 'professional product photography, clean studio background, dramatic lighting, commercial quality, sharp macro details' },
  { id: 'fashion', icon: '👗', name: 'Fashion', desc: 'Editorial style', prompt: 'high fashion editorial photography, Vogue quality, dramatic studio lighting, haute couture aesthetic, runway style' },
  { id: 'food', icon: '🍽️', name: 'Food Photo', desc: 'Restaurant quality', prompt: 'professional food photography, appetizing golden lighting, macro lens bokeh, restaurant quality plating, culinary art presentation' },
  { id: 'nature', icon: '🌿', name: 'Nature Photo', desc: 'Golden hour magic', prompt: 'nature photography, golden hour lighting, ultra-sharp details, National Geographic quality, breathtaking landscape composition' },
  { id: 'street', icon: '🌇', name: 'Street Photo', desc: 'Urban documentary', prompt: 'urban street photography, documentary candid style, natural available light, city life, photojournalistic quality, human moment' },
  { id: 'abstract', icon: '🌀', name: 'Abstract', desc: 'Creative flow', prompt: 'abstract digital art, vibrant flowing colors, geometric organic patterns, creative composition, modern contemporary art aesthetic' },
  { id: 'vintage', icon: '📷', name: 'Vintage Film', desc: 'Retro aesthetic', prompt: 'vintage film photography, grain texture, warm sepia and amber tones, analog camera look, nostalgic retro mood, Kodachrome style' },
  { id: 'neon', icon: '🌃', name: 'Neon Art', desc: 'Glowing lights', prompt: 'neon art aesthetic, glowing electric neon signs, dark dramatic background, vivid electric colors, futuristic luminous glow effect' },
  { id: 'wedding', icon: '💍', name: 'Wedding', desc: 'Romantic moments', prompt: 'romantic wedding photography, golden hour backlight, soft bokeh, emotional intimate moments, elegant timeless composition' },
  { id: 'travel', icon: '✈️', name: 'Travel', desc: 'Iconic landmarks', prompt: 'travel photography, iconic landmark, deep blue sky, vibrant saturated colors, editorial quality, wanderlust travel aesthetic' },
  { id: 'poster', icon: '🖼️', name: 'Poster Art', desc: 'Bold graphic', prompt: 'graphic design poster art, bold striking composition, artistic illustration, high impact visual design, clean typography layout' },
];

const EDIT_STYLES = [
  { id: 'anime', name: 'Anime', icon: '🎌', prompt: 'anime art style, 2D cel animation look, bold ink outlines, flat vibrant colors, anime color palette, Japanese animation aesthetic, Makoto Shinkai Studio Ghibli style rendering, no characters no people' },
  { id: 'pixel-art', name: 'Pixel Art', icon: '🕹️', prompt: 'pixel art style, 8-bit retro game art, pixelated aesthetic, NES SNES era video game art, flat vibrant colors, pixel grid visible, low resolution charm' },
  { id: '3d-render', name: '3D Render', icon: '🔮', prompt: '3D CGI render, photorealistic 3D model, Blender Cycles render, ray tracing, subsurface scattering, metallic reflections, Octane render quality, studio HDRI lighting' },
  { id: 'ghibli', name: 'Ghibli', icon: '🌿', prompt: 'Studio Ghibli art style, Miyazaki painterly, soft warm colors, magical atmosphere' },
  { id: 'pixar', name: 'Pixar 3D', icon: '🎠', prompt: 'Pixar 3D animation style, smooth subsurface skin, warm cinematic lighting, charming character design' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌆', prompt: 'cyberpunk neon aesthetic, electric blues and magentas, futuristic, rain reflections' },
  { id: 'steampunk', name: 'Steampunk', icon: '⚙️', prompt: 'steampunk Victorian aesthetic, brass gears, leather, goggles, copper tones, mechanical' },
  { id: 'watercolor', name: 'Watercolor', icon: '💧', prompt: 'soft watercolor painting style, transparent washes, artistic brushstrokes, delicate' },
  { id: 'oil', name: 'Oil Painting', icon: '🎨', prompt: 'classical oil painting, thick brushwork, rich textures, old master technique, museum quality' },
  { id: 'sketch', name: 'Pencil Sketch', icon: '✏️', prompt: 'detailed pencil sketch, crosshatching, fine line art, graphite drawing, hand-drawn' },
  { id: 'comic', name: 'Comic Book', icon: '💥', prompt: 'comic book art style, bold ink outlines, halftone dots, dynamic action lines, Marvel style' },
  { id: 'popart', name: 'Pop Art', icon: '🟡', prompt: 'Andy Warhol pop art style, bold flat colors, halftone pattern, high contrast graphic design' },
  { id: 'impressionist', name: 'Impressionist', icon: '🖌️', prompt: 'impressionist painting style, loose expressive brushstrokes, dappled light, Monet technique' },
  { id: 'minimal', name: 'Minimalist', icon: '◻️', prompt: 'minimalist design, clean simple composition, negative space, pure geometric forms' },
  { id: 'neon', name: 'Neon Glow', icon: '🌃', prompt: 'neon glow aesthetic, electric light trails, dark background, luminous vivid colors, synthwave' },
  { id: 'retro', name: 'Retro/Vintage', icon: '📷', prompt: 'vintage film photography aesthetic, grain, warm nostalgic tones, retro analog look' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', prompt: 'cinematic color grade, film noir lighting, anamorphic flares, Hollywood cinematography' },
  { id: 'fantasy', name: 'Dark Fantasy', icon: '🐉', prompt: 'dark fantasy art, dramatic magical atmosphere, intricate mystical details, epic dramatic lighting' },
  { id: 'realistic', name: 'Hyperrealistic', icon: '📸', prompt: 'hyperrealistic photography, photorealistic, 8K ultra-detailed, professional studio lighting' },
  { id: 'abstract', name: 'Abstract', icon: '🌀', prompt: 'abstract expressionist art, fluid shapes, vibrant flowing colors, non-representational art' },
  { id: 'gothic', name: 'Gothic', icon: '🦇', prompt: 'gothic dark aesthetic, dark dramatic atmosphere, ornate Victorian details, moody shadows' },
  { id: 'surreal', name: 'Surrealist', icon: '🌊', prompt: 'surrealist art style, dreamlike impossible scenario, Salvador Dali inspired, otherworldly' },
  { id: 'storybook', name: 'Storybook', icon: '📖', prompt: 'storybook illustration style, whimsical charming, children book quality, warm inviting colors' },
  { id: 'claymation', name: 'Claymation', icon: '🧸', prompt: 'claymation stop motion style, tactile clay texture, Aardman animation quality, playful 3D' },
  { id: 'vaporwave', name: 'Vaporwave', icon: '🌸', prompt: 'vaporwave aesthetic, pastel pinks and purples, retro 80s computer graphics, nostalgic' },
];

const RESOLUTIONS = [
  { id: '1:1', label: 'Square', icon: '⬛', apiSize: '1024x1024' },
  { id: '4:5', label: 'Portrait', icon: '▯', apiSize: '1024x1280' },
  { id: '9:16', label: 'Story', icon: '▮', apiSize: '1024x1792' },
  { id: '16:9', label: 'Landscape', icon: '▬', apiSize: '1792x1024' },
  { id: '3:2', label: 'Classic', icon: '▭', apiSize: '1536x1024' },
  { id: '2:1', label: 'Wide', icon: '━', apiSize: '1792x1024' },
];

const ACCESSORIES = [
  { id: 'glasses', name: 'Glasses', icon: '👓' },
  { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' },
  { id: 'watch', name: 'Luxury Watch', icon: '⌚' },
  { id: 'hat', name: 'Top Hat', icon: '🎩' },
  { id: 'cap', name: 'Cap', icon: '🧢' },
  { id: 'crown', name: 'Crown', icon: '👑' },
  { id: 'tie', name: 'Tie', icon: '👔' },
  { id: 'earrings', name: 'Earrings', icon: '💎' },
  { id: 'necklace', name: 'Necklace', icon: '📿' },
  { id: 'headphones', name: 'Headphones', icon: '🎧' },
  { id: 'scarf', name: 'Scarf', icon: '🧣' },
  { id: 'beard', name: 'Beard', icon: '🧔' },
  { id: 'jacket', name: 'Leather Jacket', icon: '🧥' },
  { id: 'gloves', name: 'Gloves', icon: '🧤' },
  { id: 'flower', name: 'Flower Crown', icon: '🌸' },
];

const SAFE_NEGATIVE = encodeURIComponent(
  'nsfw, nude, nudity, naked, sexual, explicit, pornographic, hentai, ecchi, fan service, sexy, seductive, cleavage, lingerie, underwear, bikini, revealing, adult content, inappropriate'
);

const ANIME_SHOWCASE_URL = `https://image.pollinations.ai/prompt/${encodeURIComponent(
  'anime landscape background art, glowing sunset over floating islands, vibrant 2D cel animation style, Studio Ghibli Makoto Shinkai inspired, bold ink outlines, flat color shading, no characters no people'
)}?width=600&height=400&nologo=true&seed=55501&model=flux&negative_prompt=${SAFE_NEGATIVE}`;

const SHOWCASE_IMAGES = [
  { url: `https://image.pollinations.ai/prompt/${encodeURIComponent('breathtaking mountain sunset golden clouds volumetric lighting ultra realistic landscape photography')}?width=600&height=400&nologo=true&seed=42001&model=flux`, prompt: 'breathtaking mountain sunset with golden clouds' },
  { url: `https://image.pollinations.ai/prompt/${encodeURIComponent('futuristic neon cyberpunk city rain reflections cinematic wide shot')}?width=600&height=400&nologo=true&seed=42002&model=flux`, prompt: 'futuristic neon-lit cyberpunk city at night' },
  { url: ANIME_SHOWCASE_URL, prompt: 'shonen anime boy hero in action' },
  { url: `https://image.pollinations.ai/prompt/${encodeURIComponent('pixel art village landscape sunset 16-bit SNES style isometric pixel art vibrant colors retro game')}?width=600&height=400&nologo=true&seed=42004&model=flux`, prompt: 'pixel art village at sunset' },
];

function buildPollinationsUrl(prompt: string, w = 1024, h = 1024, seed?: number, model = 'flux'): string {
  const s = seed ?? Math.floor(Math.random() * 9_999_999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${s}&model=${model}&negative_prompt=${SAFE_NEGATIVE}`;
}

function buildAnimeUrl(basePrompt: string, w = 1024, h = 1024, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 9_999_999);
  // flux-anime is unsafe — use flux with very specific anime ART STYLE descriptors
  // Default to scenery/environment to avoid any character-based content issues
  const safePrompt = `${basePrompt}, anime 2D illustration art style, cel animation flat shading, bold ink outlines, vibrant anime color palette, Studio Ghibli Makoto Shinkai aesthetic, no people no characters no humans`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${w}&height=${h}&nologo=true&seed=${s}&model=flux&negative_prompt=${SAFE_NEGATIVE}`;
}

function buildPixelArtUrl(basePrompt: string, w = 1024, h = 1024, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 9_999_999);
  const pixelPrompt = `pixel art, ${basePrompt}, 16-bit SNES retro game sprite, pixelated flat colors, no anti-aliasing, low resolution pixel grid, retro video game aesthetic`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(pixelPrompt)}?width=${w}&height=${h}&nologo=true&seed=${s}&model=flux`;
}

interface GenImage {
  id: string;
  url: string;
  prompt: string;
  history: string[];
  liked?: boolean;
  disliked?: boolean;
  loading?: boolean;
  error?: boolean;
}

interface ImagineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ImageWithLoader({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleError = () => {
    setErrored(true);
    setLoaded(true);
  };

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <Loader2 size={18} className="animate-spin text-purple-400" />
        </div>
      )}
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-1">
          <span className="text-2xl">🖼️</span>
          <span className="text-zinc-600 text-[10px]">Failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}

export function ImagineModal({ isOpen, onClose }: ImagineModalProps) {
  const [prompt, setPrompt]                   = useState('');
  const [uploadedImage, setUploadedImage]     = useState<{ preview: string; name: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GenImage[]>([]);
  const [isGenerating, setIsGenerating]       = useState(false);
  const [activeTemplate, setActiveTemplate]   = useState<typeof TEMPLATES[0] | null>(null);
  const [imageCount, setImageCount]           = useState(1);
  const shuffledAnime = useMemo(() => shuffleArray(ANIME_BOY_IMAGES), []);
  const [editTarget, setEditTarget]           = useState<GenImage | null>(null);
  const [editStyle, setEditStyle]             = useState('');
  const [editResolution, setEditResolution]   = useState('1:1');
  const [editAccessories, setEditAccessories] = useState<string[]>([]);
  const [editHistory, setEditHistory]         = useState<string[]>([]);
  const [isEditGenerating, setIsEditGenerating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef   = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /* ── Smart URL picker based on style keywords in prompt ── */
  function smartPollinationsUrl(fullPrompt: string, pw: number, ph: number, s: number): string {
    const p = fullPrompt.toLowerCase();
    const isAnime    = p.includes('anime') || p.includes('manga') || p.includes('ghibli') || p.includes('cel-shad') || p.includes('cel shad');
    const isPixelArt = p.includes('pixel art') || p.includes('8-bit') || p.includes('16-bit') || p.includes('pixelated') || p.includes('pixel grid');

    if (isAnime) {
      return buildAnimeUrl(fullPrompt, pw, ph, s);
    }
    if (isPixelArt) {
      return buildPixelArtUrl(fullPrompt, pw, ph, s);
    }
    return buildPollinationsUrl(fullPrompt, pw, ph, s);
  }

  /* ── Image generation: smart Pollinations primary, backend fallback ── */
  async function generateSingle(fullPrompt: string, size: string, seed?: number): Promise<string> {
    const [w, h] = size.split('x').map(Number);
    const pw = w || 1024;
    const ph = h || 1024;
    const s = seed ?? Math.floor(Math.random() * 9_999_999);

    const pollinationsUrl = smartPollinationsUrl(fullPrompt, pw, ph, s);

    // Try backend (Gemini/Imagen) as enhancement if available
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: fullPrompt, size }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) return data.url;
      }
    } catch {
      // Backend unavailable – fall through to Pollinations
    }

    return pollinationsUrl;
  }

  function getApiSize(resId: string): string {
    return RESOLUTIONS.find(r => r.id === resId)?.apiSize ?? '1024x1024';
  }

  /* ── Main generate (supports 1–4 images in parallel) ── */
  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const base = prompt.trim();
    const templateSuffix = activeTemplate ? `, ${activeTemplate.prompt}` : '';
    const fullPrompt = base + templateSuffix;
    const size = getApiSize('1:1');

    // Create placeholder entries with loading state
    const placeholders: GenImage[] = Array.from({ length: imageCount }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      url: '',
      prompt: fullPrompt,
      history: [],
      loading: true,
    }));
    setGeneratedImages(prev => [...placeholders, ...prev].slice(0, 20));

    // Generate all images in parallel with different seeds
    const seeds = placeholders.map(() => Math.floor(Math.random() * 9_999_999));
    const promises = seeds.map((seed, i) =>
      generateSingle(fullPrompt, size, seed).then(url => ({ id: placeholders[i].id, url }))
    );

    // Update each image as it resolves
    for (const p of promises) {
      p.then(({ id, url }) => {
        setGeneratedImages(prev =>
          prev.map(img =>
            img.id === id ? { ...img, url, history: [url], loading: false } : img
          )
        );
      });
    }

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }

  function handleTemplateClick(t: typeof TEMPLATES[0]) {
    setActiveTemplate(t);
    setPrompt(t.name);
    textareaRef.current?.focus();
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setUploadedImage({ preview: ev.target?.result as string, name: file.name });
    reader.readAsDataURL(file);
  }

  function handleDownload(url: string, label = 'fius-imagine') {
    const a = document.createElement('a');
    a.href = url; a.download = `${label}.png`; a.target = '_blank'; a.click();
  }

  function handleShare(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  function openEdit(img: GenImage) {
    setEditTarget(img);
    setEditHistory(img.history?.length ? img.history : [img.url]);
    setEditStyle('');
    setEditAccessories([]);
    setEditResolution('1:1');
  }

  /* ── Edit apply ── */
  async function handleEditApply() {
    if (!editTarget || isEditGenerating) return;
    setIsEditGenerating(true);
    const styleData = EDIT_STYLES.find(s => s.id === editStyle);
    const accNames  = editAccessories.map(a => ACCESSORIES.find(x => x.id === a)?.name).filter(Boolean);
    let p = editTarget.prompt;
    if (styleData) p += `, ${styleData.prompt}`;
    if (accNames.length) p += `, wearing ${accNames.join(', ')}`;
    const url = await generateSingle(p, getApiSize(editResolution));
    const newHistory = [...editHistory, url];
    setEditHistory(newHistory);
    const updated: GenImage = { ...editTarget, url, history: newHistory };
    setEditTarget(updated);
    setGeneratedImages(prev => prev.map(img => img.id === editTarget.id ? updated : img));
    setIsEditGenerating(false);
  }

  /* ────────────────────────────────────────────────────
     EDIT PANEL
  ──────────────────────────────────────────────────── */
  if (editTarget) {
    const originalUrl = editTarget.history?.[0] ?? editTarget.url;
    const latestUrl   = editHistory[editHistory.length - 1] ?? editTarget.url;
    return (
      <div className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#080810', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setEditTarget(null)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} /> Back to Studio
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <Wand2 size={12} className="text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium">Edit Image</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar — images + history */}
          <div className="flex flex-col w-72 flex-shrink-0 overflow-y-auto p-4 gap-4" style={{ borderRight: '1px solid rgba(255,255,255,0.07)', scrollbarWidth: 'none' }}>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Original</p>
              <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/10" style={{ aspectRatio: '1' }}>
                <ImageWithLoader src={originalUrl} alt="original" className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Current Preview</p>
              <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative" style={{ aspectRatio: '1' }}>
                {isEditGenerating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 gap-2">
                    <Loader2 size={22} className="animate-spin text-purple-400" />
                    <span className="text-purple-300 text-xs">Applying style…</span>
                  </div>
                )}
                <ImageWithLoader src={latestUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => handleDownload(latestUrl, 'fius-edited')}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <Download size={13} /> Download
              </button>
            </div>

            {editHistory.length > 1 && (
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">History ({editHistory.length} versions)</p>
                <div className="flex flex-col gap-2">
                  {editHistory.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden cursor-pointer"
                      style={{ aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <ImageWithLoader src={url} alt={`v${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2">
                        <span className="text-white text-xs font-semibold">v{i + 1}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(url, `fius-v${i + 1}`); }}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all">
                          <Download size={11} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — controls */}
          <div className="flex-1 overflow-y-auto p-6 space-y-7" style={{ scrollbarWidth: 'none' }}>
            {/* Art Style */}
            <div>
              <p className="text-white text-sm font-semibold mb-3">🎨 Art Style <span className="text-zinc-500 font-normal text-xs">(select to convert)</span></p>
              <div className="flex flex-wrap gap-2">
                {EDIT_STYLES.map(s => (
                  <button key={s.id} onClick={() => setEditStyle(editStyle === s.id ? '' : s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={editStyle === s.id
                      ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', border: '1px solid transparent' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <p className="text-white text-sm font-semibold mb-3">📐 Resolution</p>
              <div className="grid grid-cols-3 gap-2">
                {RESOLUTIONS.map(r => (
                  <button key={r.id} onClick={() => setEditResolution(r.id)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl text-xs font-medium transition-all"
                    style={editResolution === r.id
                      ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.5)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    <span className="text-lg leading-none">{r.icon}</span>
                    <span className="mt-1">{r.label}</span>
                    <span className="opacity-50">{r.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <p className="text-white text-sm font-semibold mb-3">✨ Add Accessories <span className="text-zinc-500 font-normal text-xs">(for human subjects)</span></p>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map(a => (
                  <button key={a.id}
                    onClick={() => setEditAccessories(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={editAccessories.includes(a.id)
                      ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: 'rgb(52,211,153)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {a.icon} {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply */}
            <button onClick={handleEditApply} disabled={isEditGenerating}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              {isEditGenerating
                ? <><Loader2 size={16} className="animate-spin" /> Generating changes…</>
                : <><Wand2 size={16} /> Apply Changes</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────
     MAIN STUDIO
  ──────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #07070f 0%, #0e0e1a 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-0.5 pb-1 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <Sparkles size={8} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-[12px] leading-tight">Imagine Studio</h2>
        </div>
        <div className="flex-1" />
        <button onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
          <X size={15} />
        </button>
      </div>

      {/* Scrollable body — centered on desktop, full-width on mobile */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-2xl mx-auto w-full">

        {/* ── Inspiration Gallery ── */}
        <div className="px-5 pt-4">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">✦ Inspiration</p>

          {/* Anime template active → show shuffled local anime boy images */}
          {activeTemplate?.id === 'anime' ? (
            <div className="grid grid-cols-3 gap-2">
              {shuffledAnime.map((src, i) => (
                <div key={i} className="relative group rounded-2xl overflow-hidden cursor-pointer bg-zinc-900"
                  style={{ aspectRatio: '3/4' }}
                  onClick={() => { setPrompt('cool anime boy'); textareaRef.current?.focus(); }}>
                  <img
                    src={src}
                    alt={`anime boy ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-white text-xs">Anime boy {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHOWCASE_IMAGES.map((img, i) => (
                <div key={i} className="relative group rounded-2xl overflow-hidden cursor-pointer bg-zinc-900"
                  style={{ aspectRatio: '3/2' }}
                  onClick={() => { setPrompt(img.prompt); textareaRef.current?.focus(); }}>
                  <ImageWithLoader
                    src={img.url}
                    alt="showcase"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-white text-xs line-clamp-2 leading-snug">{img.prompt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Generated Images — responsive grid with hover overlays ── */}
        {generatedImages.length > 0 && (
          <div className="px-5 pt-5">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">✦ Generated</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {generatedImages.map((img, idx) => (
                <div key={img.id} className="relative group rounded-2xl overflow-hidden bg-zinc-900"
                  style={{ aspectRatio: '1/1', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {img.loading || !img.url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin text-purple-400" />
                      <span className="text-zinc-600 text-[10px]">Generating…</span>
                    </div>
                  ) : (
                    <>
                      <ImageWithLoader src={img.url} alt="generated" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                      {/* Hover overlay: prompt text + action buttons */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-250 flex flex-col justify-between p-2.5"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.18) 100%)' }}>
                        {/* Top actions */}
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleDownload(img.url, `imagine-${idx + 1}`)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
                            title="Save">
                            <span className="text-sm">⬇️</span>
                          </button>
                          <button onClick={() => handleShare(img.url)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
                            title="Share">
                            <span className="text-sm">📤</span>
                          </button>
                        </div>
                        {/* Bottom: prompt + edit/like */}
                        <div>
                          <p className="text-white text-[10px] leading-snug line-clamp-3 mb-2">{img.prompt}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => setGeneratedImages(prev => prev.map(x => x.id === img.id ? { ...x, liked: !x.liked, disliked: false } : x))}
                              className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${img.liked ? 'text-pink-200' : 'text-zinc-300 hover:text-pink-200'}`}
                              style={{ background: img.liked ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }}>
                              ❤️
                            </button>
                            <button onClick={() => !img.loading && openEdit(img)} disabled={img.loading}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-zinc-200 hover:text-purple-200 transition-all disabled:opacity-30"
                              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }}>
                              ✏️ Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Templates ── */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">✦ Templates</p>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => handleTemplateClick(t)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:scale-[1.04] active:scale-[0.97]"
                style={activeTemplate?.id === t.id
                  ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.12))', border: '1px solid rgba(167,139,250,0.45)', minWidth: 84 }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 84 }}>
                <span className="text-2xl">{t.icon}</span>
                <span className="text-white text-[11px] font-medium text-center leading-tight" style={{ maxWidth: 76 }}>{t.name}</span>
                <span className="text-zinc-500 text-[10px] text-center leading-tight">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
        </div>{/* end max-w-2xl */}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Active hints */}
        {(uploadedImage || activeTemplate) && (
          <div className="flex items-center gap-3 mb-2 px-1">
            {uploadedImage && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                  <img src={uploadedImage.preview} alt="ref" className="w-full h-full object-cover" />
                </div>
                <span className="text-zinc-400 text-xs truncate">{uploadedImage.name}</span>
                <button onClick={() => setUploadedImage(null)} className="text-zinc-600 hover:text-white transition-colors flex-shrink-0"><X size={12} /></button>
              </div>
            )}
            {activeTemplate && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-base">{activeTemplate.icon}</span>
                <span className="text-purple-300 text-xs">{activeTemplate.name}</span>
                <button onClick={() => setActiveTemplate(null)} className="text-zinc-600 hover:text-white transition-colors ml-1"><X size={11} /></button>
              </div>
            )}
          </div>
        )}

        {/* Image count selector */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <Images size={13} className="text-zinc-500 flex-shrink-0" />
          <span className="text-zinc-500 text-[11px]">Images:</span>
          {[1, 2, 4].map(n => (
            <button key={n} onClick={() => setImageCount(n)}
              className="w-7 h-6 rounded-lg text-[11px] font-semibold transition-all"
              style={imageCount === n
                ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.5)', color: 'white' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 rounded-2xl px-3 py-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => uploadRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 flex-shrink-0 mb-0.5 transition-all">
            <Upload size={15} />
          </button>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder="Describe your image… or pick a template below"
            className="flex-1 bg-transparent text-white placeholder-zinc-600 resize-none focus:outline-none text-sm"
            style={{ minHeight: 36, maxHeight: 100, lineHeight: '1.5', overflowY: 'auto', scrollbarWidth: 'none', border: 'none', outline: 'none', padding: 0 }}
          />
          <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none' }}>
            {isGenerating
              ? <Loader2 size={15} className="text-white animate-spin" />
              : <ArrowUp size={15} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
