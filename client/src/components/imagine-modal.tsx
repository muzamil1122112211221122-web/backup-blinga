import { useState, useRef, useMemo, useEffect } from "react";
import { X, Sparkles, ArrowUp, Download, ChevronLeft, ChevronRight, Wand2, Upload, Loader2, Mic, Plus, Image as ImageIcon, SlidersHorizontal, ZoomIn, LayoutGrid } from "lucide-react";
import animeBoy1 from "@assets/Cute-Anime-Boy-Desktop-Wallpaper_1780491124348.jpg";
import animeBoy2 from "@assets/e4acdbfb00577aa06233ae2d91e2629a_1780491124348.jpg";
import animeBoy3 from "@assets/cool-anime-cartoon-dp_1780491124349.jpeg";
import animeBoy4 from "@assets/Vwmyh9_1780491124350.jpg";
import animeBoy5 from "@assets/HD-wallpaper-handsome-anime-boy-handsome-boy-anime_1780491124350.jpg";
import animeBoy6 from "@assets/HD-wallpaper-handsome-anime-boy-hōtarō-oreki-handsome-boy-anim_1780491124351.jpg";
import studioHero from "@assets/Gemini_Generated_Image_rdsaverdsaverdsa_1784927084436.png";

const ANIME_BOY_IMAGES = [animeBoy1, animeBoy2, animeBoy3, animeBoy4, animeBoy5, animeBoy6];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/* ── Pollinations AI thumbnail generator (fixed seed = consistent image) ── */
const NEG = encodeURIComponent('text, watermark, logo, ugly, blurry, nsfw, nude, naked, cartoon, drawing');
const P = (prompt: string, seed: number) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=320&height=420&nologo=true&seed=${seed}&model=flux&negative_prompt=${NEG}`;

/* ── Category definitions ── */
const TEMPLATE_CATEGORIES = [
  { id: 'all',      label: 'All',           emoji: '✦' },
  { id: 'spaces',   label: 'Spaces',         emoji: '🏠' },
  { id: 'portrait', label: 'Portraits',      emoji: '🖼️' },
  { id: 'fantasy',  label: 'Fantasy',        emoji: '🐉' },
  { id: 'fashion',  label: 'Fashion',        emoji: '👗' },
  { id: 'traditional', label: 'Traditional', emoji: '🕌' },
  { id: 'travel',   label: 'Travel',         emoji: '✈️' },
  { id: 'products', label: 'Products',       emoji: '📦' },
  { id: 'nature',   label: 'Nature',         emoji: '🌄' },
];

/* ── Category gradient palettes ── */
const CAT_STYLE: Record<string, { bg: string; accent: string }> = {
  spaces:      { bg: 'linear-gradient(155deg,#0d1a2e 0%,#1a3050 40%,#2a5080 70%,#3a70aa 100%)', accent: '#70a8e8' },
  portrait:    { bg: 'linear-gradient(155deg,#2a1506 0%,#5c300f 40%,#8f5220 70%,#c47c3a 100%)', accent: '#f0a855' },
  fantasy:     { bg: 'linear-gradient(155deg,#12062e 0%,#2e1060 40%,#5a2090 70%,#8840c8 100%)', accent: '#b06af0' },
  fashion:     { bg: 'linear-gradient(155deg,#080808 0%,#1e1e1e 40%,#3a3a3a 70%,#666666 100%)', accent: '#cccccc' },
  traditional: { bg: 'linear-gradient(155deg,#2e0800 0%,#6e1c00 40%,#aa3800 70%,#d46020 100%)', accent: '#f0a030' },
  travel:      { bg: 'linear-gradient(155deg,#050e2e 0%,#0c2464 40%,#1840a8 70%,#3068d8 100%)', accent: '#60a0f8' },
  products:    { bg: 'linear-gradient(155deg,#080818 0%,#181830 40%,#2c2c58 70%,#4848a0 100%)', accent: '#8888e8' },
  nature:      { bg: 'linear-gradient(155deg,#071408 0%,#0f3016 40%,#1a5828 70%,#2e8840 100%)', accent: '#58c870' },
};

const VISUAL_TEMPLATES = [
  /* ── SPACES (10) — thumb-0 to thumb-9 ── */
  { id: 'cozy-living-room',    category: 'spaces',      emoji: '🛋️', thumb: '/templates/thumb-0.jpg',  name: 'Cozy Minimalist Living Room',     prompt: 'Vertical 9:16 interior design photo, a cozy minimalist living room with a low beige linen sofa, soft warm floor lamp lighting, large indoor monstera plant in a ceramic pot, neutral earth-toned walls, architectural digest style, 8k resolution.' },
  { id: 'luxury-bedroom',      category: 'spaces',      emoji: '🛏️', thumb: '/templates/thumb-1.jpg',  name: 'Luxury Modern Bedroom',           prompt: 'Vertical 9:16 interior design photo, a luxurious modern bedroom featuring a plush king-size bed with dark grey velvet upholstery, warm recessed ceiling lights, chic bedside pendant lamps, large floor-to-ceiling glass window showing a city skyline at dusk.' },
  { id: 'aesthetic-workspace', category: 'spaces',      emoji: '💻', thumb: '/templates/thumb-2.jpg',  name: 'Warm Aesthetic Workspace',        prompt: 'Vertical 9:16 interior design photo, a clean aesthetic home office desk setup with a wooden desktop, modern minimalist monitor, small warm desk lamp, neatly arranged stationery, a steaming ceramic mug, and soft natural sunlight casting shadows.' },
  { id: 'bohemian-loft',       category: 'spaces',      emoji: '🪴', thumb: '/templates/thumb-3.jpg',  name: 'Bohemian Loft Interior',          prompt: 'Vertical 9:16 interior design photo, a bright bohemian loft apartment with exposed brick walls, hanging wicker rattan chairs, vibrant woven rugs, lush trailing pothos plants, and warm golden hour light streaming through tall warehouse windows.' },
  { id: 'scandi-dining',       category: 'spaces',      emoji: '🪑', thumb: '/templates/thumb-4.jpg',  name: 'Scandi Dining Space',             prompt: 'Vertical 9:16 interior design photo, a Scandinavian dining room featuring a light oak wood dining table, minimalist black wire chairs, a sleek modern brass chandelier overhead, and a large abstract canvas painting on a white wall.' },
  { id: 'cyberpunk-gaming',    category: 'spaces',      emoji: '🎮', thumb: '/templates/thumb-5.jpg',  name: 'Cyberpunk Gaming Room',           prompt: 'Vertical 9:16 interior design photo, a futuristic high-tech gaming room illuminated by vibrant neon purple and cyan LED strip lights, dual curved monitor setup, acoustic wall panels, and a sleek ergonomic gaming chair.' },
  { id: 'japandi-living',      category: 'spaces',      emoji: '🌿', thumb: '/templates/thumb-6.jpg',  name: 'Japandi Living Area',             prompt: 'Vertical 9:16 interior design photo, a serene Japandi-style living area combining Japanese and Scandinavian design, low-profile light wood furniture, cream linen textures, minimalist ikebana flower vase on a low coffee table, soft diffused daylight.' },
  { id: 'industrial-cafe',     category: 'spaces',      emoji: '☕', thumb: '/templates/thumb-7.jpg',  name: 'Industrial Coffee Shop Corner',   prompt: 'Vertical 9:16 interior design photo, a cozy corner inside an industrial-chic cafe featuring exposed concrete walls, leather tufted armchairs, black iron piping shelves with stacked books, and warm Edison bulb pendant lighting.' },
  { id: 'luxury-closet',       category: 'spaces',      emoji: '👗', thumb: '/templates/thumb-8.jpg',  name: 'Luxury Walk-in Closet',           prompt: 'Vertical 9:16 interior design photo, a high-end luxury walk-in wardrobe with glass-front illuminated wooden clothing cabinets, neatly organized shelves, a central marble island display, and a modern geometric crystal chandelier.' },
  { id: 'zen-spa-bath',        category: 'spaces',      emoji: '🛁', thumb: '/templates/thumb-9.jpg',  name: 'Zen Spa Bathroom',                prompt: 'Vertical 9:16 interior design photo, a peaceful luxury spa bathroom with a freestanding stone bathtub, warm wooden slatted accent wall, soft glowing candles, folded white cotton towels, and smooth river stones under soft natural light.' },

  /* ── NATURE (10) — thumb-10 to thumb-19 ── */
  { id: 'mountain-peak',       category: 'nature',      emoji: '⛰️', thumb: '/templates/thumb-10.jpg', name: 'Majestic Mountain Peak',          prompt: 'Vertical 9:16 landscape photography, a majestic snow-capped mountain peak towering over a calm alpine lake reflecting the crisp blue sky, dense pine forest lining the shore, dramatic cinematic nature view, 8k.' },
  { id: 'mystic-forest',       category: 'nature',      emoji: '🌲', thumb: '/templates/thumb-11.jpg', name: 'Enchanted Mystic Forest',         prompt: 'Vertical 9:16 landscape photography, an enchanted dense forest shrouded in morning mist, brilliant golden sunbeams piercing through tall ancient pine trees, soft green moss covering the damp forest floor, magical atmosphere.' },
  { id: 'tropical-waterfall',  category: 'nature',      emoji: '💧', thumb: '/templates/thumb-12.jpg', name: 'Tropical Paradise Waterfall',     prompt: 'Vertical 9:16 landscape photography, a hidden crystal-clear tropical waterfall cascading into a turquoise jungle pool, lush vibrant green ferns and exotic tropical plants framing the scene, bright natural daylight.' },
  { id: 'golden-dunes',        category: 'nature',      emoji: '🏜️', thumb: '/templates/thumb-13.jpg', name: 'Golden Desert Dunes',             prompt: 'Vertical 9:16 landscape photography, vast rolling sand dunes in a deep desert under a breathtaking sunset sky painted in gradients of orange, pink, and violet, wind-swept ripple textures on the sand, cinematic travel view.' },
  { id: 'ocean-sunset',        category: 'nature',      emoji: '🌅', thumb: '/templates/thumb-14.jpg', name: 'Serene Ocean Sunset',             prompt: 'Vertical 9:16 seascape photography, calm ocean waves gently kissing a pristine sandy shoreline at sunset, vibrant orange and purple hues reflecting on the wet sand, a single silhouette of a seabird flying in the distance.' },
  { id: 'lavender-valley',     category: 'nature',      emoji: '💜', thumb: '/templates/thumb-15.jpg', name: 'Lavender Valley Bloom',           prompt: 'Vertical 9:16 landscape photography, endless rows of vibrant purple lavender fields in full bloom stretching towards rolling green hills under a bright summer sky with soft white clouds, warm afternoon sun.' },
  { id: 'autumn-stream',       category: 'nature',      emoji: '🍂', thumb: '/templates/thumb-16.jpg', name: 'Autumn Woodland Stream',          prompt: 'Vertical 9:16 landscape photography, a gentle crystal stream flowing over smooth mossy rocks through a forest filled with brilliant golden and red autumn foliage, fallen leaves floating on the water surface, crisp daylight.' },
  { id: 'milky-way-night',     category: 'nature',      emoji: '🌌', thumb: '/templates/thumb-17.jpg', name: 'Starry Milky Way Night',          prompt: 'Vertical 9:16 astrophotography, a breathtaking view of the glowing Milky Way galaxy arching over a dark silhouette of rugged mountain ranges, millions of sharp twinkling stars, deep space blues and purples.' },
  { id: 'glacial-ice-cave',    category: 'nature',      emoji: '🧊', thumb: '/templates/thumb-18.jpg', name: 'Glacial Ice Cave',                prompt: 'Vertical 9:16 nature photography, inside a breathtaking translucent blue glacial ice cave with intricate crystalline walls and natural light shining through the frozen arches, pristine sub-zero arctic environment.' },
  { id: 'cherry-blossom-path', category: 'nature',      emoji: '🌸', thumb: '/templates/thumb-19.jpg', name: 'Blooming Cherry Blossom Path',   prompt: 'Vertical 9:16 landscape photography, a peaceful stone path winding through a park lined with full-bloom pink cherry blossom trees, soft pastel petals gently falling on the ground, serene spring morning light.' },

  /* ── PORTRAITS (10) — thumb-20 to thumb-29 ── */
  { id: 'corporate-headshot',  category: 'portrait',    emoji: '💼', thumb: '/templates/thumb-20.jpg', name: 'Professional Corporate Headshot', prompt: 'Vertical 9:16 studio portrait photo, a confident young professional man in a tailored navy blue suit and crisp white shirt, smiling slightly, clean blurred office background, soft studio lighting, sharp focus, 8k resolution.' },
  { id: 'high-fashion-look',   category: 'portrait',    emoji: '💄', thumb: '/templates/thumb-21.jpg', name: 'High Fashion Editorial Look',     prompt: 'Vertical 9:16 high fashion portrait photo, a striking model wearing avant-garde haute couture attire with dramatic sculptural elements, bold artistic makeup, studio strobe lighting creating high contrast shadows, magazine cover style.' },
  { id: 'cinematic-portrait',  category: 'portrait',    emoji: '🎬', thumb: '/templates/thumb-22.jpg', name: 'Cinematic Moody Portrait',        prompt: 'Vertical 9:16 cinematic portrait photo, a young woman with expressive eyes looking out a rainy window at twilight, neon city lights reflecting on the glass, moody teal and orange color grading, dramatic depth of field.' },
  { id: 'golden-hour-portrait',category: 'portrait',    emoji: '🌻', thumb: '/templates/thumb-23.jpg', name: 'Warm Golden Hour Portrait',       prompt: 'Vertical 9:16 portrait photo, a cheerful young woman standing outdoors in a field of tall grass during golden hour, warm sunlight catching her blowing hair, soft bokeh background, natural and candid lifestyle photography.' },
  { id: 'minimalist-studio',   category: 'portrait',    emoji: '🤍', thumb: '/templates/thumb-24.jpg', name: 'Minimalist Studio Portrait',      prompt: 'Vertical 9:16 fine art portrait photo, a minimalist clean studio shot of a person with neutral-toned clothing, soft side-lit Rembrandt lighting, solid muted grey seamless paper background, sharp facial details, commercial grade.' },
  { id: 'cyberpunk-neon',      category: 'portrait',    emoji: '🥽', thumb: '/templates/thumb-25.jpg', name: 'Cyberpunk Neon Portrait',         prompt: 'Vertical 9:16 portrait photo, a person with futuristic cybernetic face accents illuminated by bright neon blue and pink lights in a dark rainy street alley, futuristic sci-fi aesthetic, highly detailed cyberpunk look.' },
  { id: 'vintage-film',        category: 'portrait',    emoji: '📷', thumb: '/templates/thumb-26.jpg', name: 'Classic Vintage Film Portrait',   prompt: 'Vertical 9:16 vintage style portrait photo, a timeless portrait of an individual captured with 35mm analog film grain, soft muted color tones, nostalgic warm lighting, classic 1970s aesthetic, authentic texture.' },
  { id: 'urban-street-style',  category: 'portrait',    emoji: '🧥', thumb: '/templates/thumb-27.jpg', name: 'Urban Street Style Portrait',     prompt: 'Vertical 9:16 street style portrait photo, a cool young adult posing against a raw concrete urban wall, wearing modern streetwear jacket and accessories, overcast natural daylight, sharp focus, fashion lookbook style.' },
  { id: 'elven-fantasy',       category: 'portrait',    emoji: '🧝', thumb: '/templates/thumb-28.jpg', name: 'Ethereal Fantasy Elven Portrait', prompt: 'Vertical 9:16 fantasy portrait photo, an ethereal mystical elf with delicate pointed ears and subtle glowing silver facial markings, wearing an ornate silver circlet, magical forest background with floating dust motes.' },
  { id: 'business-woman',      category: 'portrait',    emoji: '👩‍💼',thumb: '/templates/thumb-29.jpg', name: 'Confident Business Woman',        prompt: 'Vertical 9:16 executive portrait photo, a powerful and confident business woman in a sharp charcoal blazer, standing against a modern glass high-rise corporate backdrop, natural soft daylight, professional editorial look.' },

  /* ── FANTASY (10) — thumb-30 to thumb-39 ── */
  { id: 'floating-islands',    category: 'fantasy',     emoji: '🏝️', thumb: '/templates/thumb-30.jpg', name: 'Floating Islands Fantasy',        prompt: 'Vertical 9:16 digital art fantasy landscape, majestic floating islands with cascading waterfalls pouring into the clouds below, ancient stone ruins covered in glowing moss, magical glowing airships flying past, 8k.' },
  { id: 'cyberpunk-city',      category: 'fantasy',     emoji: '🌆', thumb: '/templates/thumb-31.jpg', name: 'Cyberpunk Neon Cityscape',        prompt: 'Vertical 9:16 cyberpunk concept art, a towering futuristic metropolis at night filled with massive holographic advertisements, flying vehicles streaming between glowing skyscrapers, neon lights reflecting on wet streets, highly detailed.' },
  { id: 'scifi-corridor',      category: 'fantasy',     emoji: '🚀', thumb: '/templates/thumb-32.jpg', name: 'Sci-Fi Space Station Corridor',   prompt: 'Vertical 9:16 science fiction interior photo, a sleek white futuristic spacecraft corridor with glowing blue LED floor panels, large glass viewport showing deep space and distant nebulas, cinematic lighting.' },
  { id: 'dragon-hero',         category: 'fantasy',     emoji: '🐉', thumb: '/templates/thumb-33.jpg', name: 'Mythical Dragon Hero',            prompt: 'Vertical 9:16 fantasy character concept art, a fierce warrior clad in intricate dragon-scale armor standing triumphantly on a rocky cliff, a massive legendary dragon soaring through stormy skies in the background.' },
  { id: 'crystal-cave',        category: 'fantasy',     emoji: '💎', thumb: '/templates/thumb-34.jpg', name: 'Enchanted Crystal Cave',          prompt: 'Vertical 9:16 fantasy digital illustration, a magical underground cavern filled with glowing purple and blue giant crystals, an underground subterranean river reflecting the luminescence, mystical and enchanting atmosphere.' },
  { id: 'steampunk-airship',   category: 'fantasy',     emoji: '⚙️', thumb: '/templates/thumb-35.jpg', name: 'Steampunk Airship Deck',          prompt: 'Vertical 9:16 steampunk concept art, the wooden deck of a massive brass-trimmed airship flying above a sea of clouds at sunset, visible copper pipes, spinning gears, and a captain looking through an antique telescope.' },
  { id: 'overgrown-city',      category: 'fantasy',     emoji: '🌿', thumb: '/templates/thumb-36.jpg', name: 'Post-Apocalyptic Overgrown City', prompt: 'Vertical 9:16 cinematic digital art, a dystopian future city where nature has reclaimed abandoned skyscrapers, towering concrete buildings covered in thick green vines and trees, moody overcast atmosphere.' },
  { id: 'magic-portal',        category: 'fantasy',     emoji: '🌀', thumb: '/templates/thumb-37.jpg', name: 'Magical Portal Gateway',          prompt: 'Vertical 9:16 fantasy art, an ancient stone archway deep inside an ancient forest glowing with a swirling vortex of magical blue energy portal leading to another dimension, mystical lighting and soft fog.' },
  { id: 'atlantis-city',       category: 'fantasy',     emoji: '🏛️', thumb: '/templates/thumb-38.jpg', name: 'Underwater Lost Atlantis City',   prompt: 'Vertical 9:16 fantasy digital art, a majestic lost underwater civilization with grand glowing marble columns, bioluminescent sea flora, schools of colorful tropical fish swimming through ancient submerged plazas.' },
  { id: 'star-goddess',        category: 'fantasy',     emoji: '✨', thumb: '/templates/thumb-39.jpg', name: 'Celestial Star Goddess',          prompt: 'Vertical 9:16 high fantasy art, a divine celestial goddess draped in shimmering starlight garments, holding a glowing galaxy sphere in her hands, cosmic nebula background with swirling stardust and galaxies.' },

  /* ── FASHION (10) — thumb-40 to thumb-49 ── */
  { id: 'crimson-lehenga',     category: 'fashion',     emoji: '👰', thumb: '/templates/thumb-40.jpg', name: 'Royal Crimson Bridal Lehenga',    prompt: 'Vertical 9:16 portrait photo, stunning South Asian bride wearing an intricate heavy crimson red velvet lehenga encrusted with gold Zardozi embroidery, matching sheer red dupatta draped over her head, traditional heavy gold polki jewelry, warm royal palace interior lighting with cinematic bridal photography, 8k.' },
  { id: 'indo-western-jacket', category: 'fashion',     emoji: '🥻', thumb: '/templates/thumb-41.jpg', name: 'Contemporary Indo-Western Jacket',prompt: 'Vertical 9:16 portrait photo, chic South Asian woman in a black tailored Indo-Western bandhgala jacket featuring intricate gold thread embroidery, dramatic side lighting casting soft shadows, minimalist background, high fashion editorial look, photorealistic texture.' },
  { id: 'silk-saree',          category: 'fashion',     emoji: '🌊', thumb: '/templates/thumb-42.jpg', name: 'Classic Silk Saree Drape',        prompt: 'Vertical 9:16 portrait photo, graceful woman wearing a rich teal and gold Banarasi silk saree, traditional gold jhumka earrings, soft heritage interior background with warm ambient light, elegant traditional posture, cinematic magazine style portrait.' },
  { id: 'ivory-sherwani',      category: 'fashion',     emoji: '🤵', thumb: '/templates/thumb-43.jpg', name: 'Regal Ivory Sherwani',            prompt: 'Vertical 9:16 portrait photo, handsome South Asian groom in an off-white silk sherwani with subtle gold embroidery and a matching pocket square, traditional carved heritage archway background, warm golden hour lighting, high-end ethnic menswear fashion shoot.' },
  { id: 'ethnic-fusion',       category: 'fashion',     emoji: '🌸', thumb: '/templates/thumb-44.jpg', name: 'Modern Ethnic Fusion Ensemble',   prompt: 'Vertical 9:16 portrait photo, elegant woman wearing a pastel cream silk crop top with an embroidered long jacket cape, soft natural window light filtering through tropical blinds, sophisticated traditional-modern fusion aesthetic, 8k resolution.' },
  { id: 'urban-streetwear',    category: 'fashion',     emoji: '🖤', thumb: '/templates/thumb-45.jpg', name: 'Urban Luxury Streetwear',         prompt: 'Vertical 9:16 portrait photo, stylish young man posing in an oversized charcoal grey technical parka jacket and matching relaxed cargo pants, futuristic urban neon-lit night backdrop, moody cinematic atmosphere, high-end streetwear fashion campaign.' },
  { id: 'linen-casual',        category: 'fashion',     emoji: '🌾', thumb: '/templates/thumb-46.jpg', name: 'Minimalist Linen Casual Chic',    prompt: 'Vertical 9:16 portrait photo, handsome man in a relaxed-fit beige linen button-down shirt and matching trousers, rustic earth-toned studio backdrop with raw stone texture, soft natural daylight, clean minimalist fashion editorial style.' },
  { id: 'athleisure-fit',      category: 'fashion',     emoji: '🏋️', thumb: '/templates/thumb-47.jpg', name: 'Athleisure Gym Fit',              prompt: 'Vertical 9:16 portrait photo, fit athletic woman posing in an olive green sports bra and high-waisted leggings set, modern minimalist concrete gym studio with soft natural light, healthy lifestyle fitness fashion photography, crisp details.' },
  { id: 'emerald-gown',        category: 'fashion',     emoji: '💚', thumb: '/templates/thumb-48.jpg', name: 'Emerald Silk Evening Gown',       prompt: 'Vertical 9:16 portrait photo, glamorous woman wearing a sleek deep emerald green satin evening gown with a wrap design, sitting on a dark velvet lounge chair, moody luxury cocktail lounge lighting, high-end red carpet fashion look.' },
  { id: 'resort-linen',        category: 'fashion',     emoji: '🌴', thumb: '/templates/thumb-49.jpg', name: 'Resort Vacation Linen Style',     prompt: 'Vertical 9:16 portrait photo, stylish man in a crisp white resort linen shirt left slightly open, tropical background with palm tree shadows in golden hour sunlight, relaxed summer vacation fashion aesthetic, cinematic photography.' },

  /* ── TRADITIONAL (10) — thumb-50 to thumb-59 ── */
  { id: 'nikah-portrait',      category: 'traditional', emoji: '🕌', thumb: '/templates/thumb-50.jpg', name: 'Nikah Ceremony Portrait',         prompt: 'Vertical 9:16 portrait photo, a graceful young woman wearing a delicate ivory and gold embroidered traditional gown with a matching sheer chiffon head covering, soft glowing indoor lighting with traditional lanterns, serene expression, high-end cultural wedding photography, 8k.' },
  { id: 'palace-lehenga',      category: 'traditional', emoji: '🏰', thumb: '/templates/thumb-51.jpg', name: 'Palace Heritage Lehenga Look',    prompt: 'Vertical 9:16 portrait photo, a stunning bride in a rich crimson and gold embroidered lehenga paired with traditional heavy gold jewelry, background of a grand heritage marble palace corridor with warm ambient lighting, cinematic portrait, 8k resolution.' },
  { id: 'velvet-groom',        category: 'traditional', emoji: '👑', thumb: '/templates/thumb-52.jpg', name: 'Royal Velvet Groom Attire',       prompt: 'Vertical 9:16 portrait photo, a handsome groom wearing a deep maroon velvet sherwani intricately detailed with subtle gold threadwork and a regal turban, seated in a luxurious vintage royal lounge, warm dramatic lighting, cinematic portrait.' },
  { id: 'kurta-jacket',        category: 'traditional', emoji: '🪔', thumb: '/templates/thumb-53.jpg', name: 'Festive Embroidered Kurta Jacket',prompt: 'Vertical 9:16 portrait photo, a young man wearing a rich navy blue silk kurta paired with an ornate brocade nehru jacket, festive celebration background with warm string lights and traditional decor, elegant and sharp portrait styling.' },
  { id: 'regal-bride',         category: 'traditional', emoji: '💍', thumb: '/templates/thumb-54.jpg', name: 'Classic Regal Bride',             prompt: 'Vertical 9:16 portrait photo, an elegant bride wearing a heavily embellished traditional red and gold heirloom ensemble, ornate maang tikka and bridal necklace, soft glowing candlelit heritage hall backdrop, rich textures, photorealistic.' },
  { id: 'festive-wear',        category: 'traditional', emoji: '🌺', thumb: '/templates/thumb-55.jpg', name: 'Vibrant Cultural Festive Wear',   prompt: 'Vertical 9:16 portrait photo, a smiling young woman wearing a vibrant multi-colored embroidered traditional tunic featuring intricate mirror work, bright marigold floral decorations in the blurred background, joyful celebratory atmosphere, vivid colors.' },
  { id: 'celebration-groom',   category: 'traditional', emoji: '🎊', thumb: '/templates/thumb-56.jpg', name: 'Classic Celebration Groom',       prompt: 'Vertical 9:16 portrait photo, a distinguished groom in a tailored cream-colored raw silk sherwani with delicate tonal embroidery, standing in a softly lit heritage architectural courtyard, sophisticated traditional menswear portrait.' },
  { id: 'henna-portrait',      category: 'traditional', emoji: '🌙', thumb: '/templates/thumb-57.jpg', name: 'Henna Celebration Portrait',      prompt: 'Vertical 9:16 portrait photo, a radiant young woman smiling softly while showing intricate henna patterns on her hands, wearing a pastel pink festive outfit adorned with floral jewelry, warm candlelit evening ambience, soft cinematic focus.' },
  { id: 'haldi-ceremony',      category: 'traditional', emoji: '🌻', thumb: '/templates/thumb-58.jpg', name: 'Haldi Ceremony Glow',             prompt: 'Vertical 9:16 portrait photo, a glowing young woman during a traditional pre-wedding yellow floral ceremony, wearing a simple bright yellow traditional attire with fresh jasmine flower garlands in her hair, warm sunny lighting, joyful and authentic vibe.' },
  { id: 'heritage-silk-drape', category: 'traditional', emoji: '✨', thumb: '/templates/thumb-59.jpg', name: 'Heritage Silk Drape Look',        prompt: 'Vertical 9:16 portrait photo, a graceful woman wearing an opulent traditional silk saree with a rich gold zari woven border, traditional temple gold jewelry set, warm indoor lighting against a carved wooden backdrop, elegant heritage portrait.' },

  /* ── TRAVEL (10) — thumb-60 to thumb-69 ── */
  { id: 'dubai-skyline',       category: 'travel',      emoji: '🏙️', thumb: '/templates/thumb-60.jpg', name: 'Dubai Skyline Luxury',            prompt: 'Vertical 9:16 portrait photo, a sophisticated man standing on a high-rise glass balcony overlooking the modern Dubai downtown skyscraper skyline at sunset, warm golden hour glow reflecting off glass towers, elegant casual polo shirt, cinematic travel photography, 8k.' },
  { id: 'santorini-escape',    category: 'travel',      emoji: '🏛️', thumb: '/templates/thumb-61.jpg', name: 'Santorini Island Escape',         prompt: 'Vertical 9:16 portrait photo, a graceful woman in a flowing white summer dress posing against iconic whitewashed walls and blue-domed churches overlooking the Aegean sea, bright Mediterranean sunlight, dreamy travel aesthetic, photorealistic.' },
  { id: 'paris-twilight',      category: 'travel',      emoji: '🗼', thumb: '/templates/thumb-62.jpg', name: 'Parisian Street Twilight',        prompt: 'Vertical 9:16 portrait photo, an elegant woman wearing a chic beige trench coat strolling down a historic cobblestone Parisian street at dusk, the illuminated Eiffel Tower softly glowing in the blurred background, warm street lamps, cinematic mood.' },
  { id: 'maldives-bungalow',   category: 'travel',      emoji: '🌊', thumb: '/templates/thumb-63.jpg', name: 'Maldives Overwater Bungalow',     prompt: 'Vertical 9:16 portrait photo, a stylish man in a crisp white linen shirt and sunglasses standing on the wooden deck of a luxury tropical overwater villa, crystal clear turquoise ocean water and palm trees in the background, bright sunny vacation vibe.' },
  { id: 'tropical-palm-beach', category: 'travel',      emoji: '🌴', thumb: '/templates/thumb-64.jpg', name: 'Tropical Palm Beach',             prompt: 'Vertical 9:16 portrait photo, a radiant woman relaxing on a sun-drenched tropical sandy beach under leaning palm trees, wearing lightweight cream resort wear, soft golden hour sunlight breaking through, serene beach vacation atmosphere.' },
  { id: 'sunset-sand-dunes',   category: 'travel',      emoji: '🌅', thumb: '/templates/thumb-65.jpg', name: 'Golden Sunset Sand Dunes',        prompt: 'Vertical 9:16 portrait photo, a traveler resting on the ridge of a vast sweeping desert sand dune during a dramatic golden sunset, warm amber light casting long shadows across rippled golden sand, adventurous travel photography.' },
  { id: 'swiss-alpine',        category: 'travel',      emoji: '⛷️', thumb: '/templates/thumb-66.jpg', name: 'Swiss Alpine Peak Vista',         prompt: 'Vertical 9:16 portrait photo, a man in a dark winter wool coat and scarf standing against a breathtaking backdrop of snowy Swiss alpine mountain peaks and dramatic clouds, crisp cool winter daylight, cinematic travel portrait.' },
  { id: 'misty-mountain',      category: 'travel',      emoji: '🌫️', thumb: '/templates/thumb-67.jpg', name: 'Mist-Covered Mountain Valley',    prompt: 'Vertical 9:16 portrait photo, a person looking out over a lush green mountain valley shrouded in atmospheric morning mist and rolling hills, wearing an earth-toned cozy jacket, serene and peaceful travel mood, cinematic nature photography.' },
  { id: 'nyc-urban',           category: 'travel',      emoji: '🗽', thumb: '/templates/thumb-68.jpg', name: 'New York City Urban Vibe',        prompt: 'Vertical 9:16 portrait photo, a young man in a smart coat standing on a busy New York City street, classic red-brick urban architecture and iconic yellow cabs blurred in the background, moody overcast daylight, metropolitan travel aesthetic.' },
  { id: 'highland-retreat',    category: 'travel',      emoji: '🏔️', thumb: '/templates/thumb-69.jpg', name: 'Highland Hill Station Retreat',   prompt: 'Vertical 9:16 portrait photo, a woman standing on a lush green mountain terrace overlooking rolling misty hills and pine forests, wearing a warm woolen shawl, calm and refreshing highland holiday atmosphere, high-definition travel shot.' },

  /* ── PRODUCTS (10) — thumb-70 to thumb-78, 80th reuses thumb-70 ── */
  { id: 'skincare-ritual',     category: 'products',    emoji: '🌿', thumb: '/templates/thumb-70.jpg', name: 'Skincare Ritual Set',             prompt: 'Vertical 9:16 product photo, elegant white frosted glass serum bottles and jade roller arranged on a clean white surface with soft botanical shadows and green leaves, bright natural morning studio lighting, high-end cosmetic brand advertising photography, ultra-sharp detail.' },
  { id: 'festive-gift-box',    category: 'products',    emoji: '🎁', thumb: '/templates/thumb-71.jpg', name: 'Festive Luxury Gift Box Scene',   prompt: 'Vertical 9:16 product photo, a premium dark violet open gift box revealing artisanal sweets and luxury items, decorated with warm brass oil lamps and orange marigold flowers, soft warm ambient lighting, festive luxury product display.' },
  { id: 'dark-perfume-shot',   category: 'products',    emoji: '🖤', thumb: '/templates/thumb-72.jpg', name: 'Dark Moody Perfume Shot',         prompt: 'Vertical 9:16 product photo, a sleek black glass luxury perfume bottle resting on dark slate stone with wet water droplets, dramatic side lighting casting deep shadows, elegant silver accents, high-end luxury fragrance commercial shot.' },
  { id: 'marble-skincare',     category: 'products',    emoji: '🌸', thumb: '/templates/thumb-73.jpg', name: 'Luxury Marble Skincare Flat Lay', prompt: "Vertical 9:16 top-down flat lay product photo, a clear glass dropper bottle with gold cap resting on a white vein marble slab with white baby's breath flowers and soft dappled sunlight shadows, clean minimalist aesthetic." },
  { id: 'scented-candle',      category: 'products',    emoji: '🕯️', thumb: '/templates/thumb-74.jpg', name: 'Gifting Scented Candle Scene',    prompt: 'Vertical 9:16 product photo, an unboxed luxury scented soy candle in a clear glass jar, nestled inside a matte black foil-stamped gift box with dried botanical accents, warm soft studio lighting, cozy premium lifestyle product photography.' },
  { id: 'beverage-splash',     category: 'products',    emoji: '☕', thumb: '/templates/thumb-75.jpg', name: 'Beverage Hero Splash',            prompt: 'Vertical 9:16 commercial product photo, a tall glass of iced coffee latte with swirling milk splashes suspended in mid-air around the glass, dark moody backdrop, dramatic high-speed studio photography, condensation on glass, ultra-detailed.' },
  { id: 'coffee-mug-scene',    category: 'products',    emoji: '🫖', thumb: '/templates/thumb-76.jpg', name: 'Lifestyle Coffee Mug Scene',      prompt: 'Vertical 9:16 product photo, a dark ceramic coffee mug with creamy latte art sitting on a warm wooden cafe table near a sunlit window with potted green plants in blurry background, warm cozy morning atmosphere.' },
  { id: 'food-hero-shot',      category: 'products',    emoji: '🍛', thumb: '/templates/thumb-77.jpg', name: 'Aromatic Food Hero Shot',         prompt: 'Vertical 9:16 food photography, a traditional brass bowl filled with steaming hot spiced chicken biryani garnished with mint leaves, surrounding copper bowls of raita and fresh salad, warm rustic lighting, high-end culinary photography.' },
  { id: 'tech-device-hero',    category: 'products',    emoji: '📱', thumb: '/templates/thumb-78.jpg', name: 'Tech Device Hero Shot',           prompt: 'Vertical 9:16 product photo, a matte black premium smartphone resting vertically on a dark textured pedestal, dramatic edge studio rim lighting highlighting sleek metallic edges and camera lenses, dark minimalist aesthetic, 8k resolution.' },
  { id: 'breakfast-flatlay',   category: 'products',    emoji: '🥗', thumb: '/templates/thumb-70.jpg', name: 'Overhead Breakfast Bowl Flat Lay',prompt: 'Vertical 9:16 top-down flat lay food photo, a colorful acai smoothie bowl topped with sliced strawberries, blueberries, kiwi, and granola, sitting next to a cup of coffee and honey dipper on a white wooden table, bright appetizing daylight.' },
]

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

function buildPollinationsUrl(prompt: string, w = 1024, h = 1024, seed?: number, model = 'flux'): string {
  const s = seed ?? Math.floor(Math.random() * 9_999_999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${s}&model=${model}&negative_prompt=${SAFE_NEGATIVE}`;
}

function buildAnimeUrl(basePrompt: string, w = 1024, h = 1024, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 9_999_999);
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

const IMAGINE_STORAGE_KEY = 'fius_my_images';

function loadPersistedImages(): GenImage[] {
  try {
    const raw = localStorage.getItem(IMAGINE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GenImage[];
  } catch { return []; }
}

function persistImages(imgs: GenImage[]) {
  try {
    const toSave = imgs.filter(i => !i.loading && i.url).slice(0, 30);
    localStorage.setItem(IMAGINE_STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

/* ── Fullscreen Template Gallery Overlay ── */
function TemplateGalleryOverlay({
  onClose,
  onSelect,
  activeId,
}: {
  onClose: () => void;
  onSelect: (t: typeof VISUAL_TEMPLATES[0]) => void;
  activeId: string | undefined;
}) {
  const [activeCat, setActiveCat] = useState('all');
  const cats = TEMPLATE_CATEGORIES.filter(c => c.id !== 'all');
  const filtered = activeCat === 'all' ? VISUAL_TEMPLATES : VISUAL_TEMPLATES.filter(t => t.category === activeCat);

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col"
      style={{ background: '#07070e', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Studio
        </button>
        <div className="flex-1 text-center">
          <span className="text-white/90 font-bold text-base tracking-tight">All Templates</span>
          <span className="ml-2 text-zinc-500 text-sm">{filtered.length} styles</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body: sidebar + grid */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — categories */}
        <div className="flex-shrink-0 w-[180px] overflow-y-auto py-4 px-3 flex flex-col gap-1" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCat('all')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
            style={activeCat === 'all'
              ? { background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
            }
          >
            <span style={{ fontSize: 16 }}>✦</span>
            <span>All</span>
            <span className="ml-auto text-[10px] font-normal opacity-50">{VISUAL_TEMPLATES.length}</span>
          </button>
          {cats.map(cat => {
            const count = VISUAL_TEMPLATES.filter(t => t.category === cat.id).length;
            const isActive = activeCat === cat.id;
            const accentColor = CAT_STYLE[cat.id]?.accent ?? '#aaa';
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                style={isActive
                  ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }
                  : { background: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
                }
              >
                <span style={{ fontSize: 15 }}>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className="ml-auto text-[10px] font-normal opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7" style={{ scrollbarWidth: 'none' }}>
          {activeCat === 'all' ? (
            /* All view: category sections with grid */
            <div className="flex flex-col gap-10">
              {cats.map(cat => {
                const catTpls = VISUAL_TEMPLATES.filter(t => t.category === cat.id);
                const accentColor = CAT_STYLE[cat.id]?.accent ?? '#aaa';
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                      <h3 className="font-bold text-white text-base tracking-tight">{cat.label}</h3>
                      <div className="h-px flex-1 ml-2" style={{ background: `linear-gradient(to right, ${accentColor}30, transparent)` }} />
                      <span className="text-[11px] font-medium" style={{ color: `${accentColor}80` }}>{catTpls.length} templates</span>
                    </div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                      {catTpls.map(t => (
                        <GalleryCard key={t.id} t={t} isActive={activeId === t.id} onClick={() => onSelect(t)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single category grid */
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {filtered.map(t => (
                <GalleryCard key={t.id} t={t} isActive={activeId === t.id} onClick={() => onSelect(t)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Gallery Card (used inside fullscreen gallery) ── */
function GalleryCard({
  t,
  isActive,
  onClick,
}: {
  t: typeof VISUAL_TEMPLATES[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const catStyle = CAT_STYLE[t.category] ?? CAT_STYLE['nature'];
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden text-left"
      style={{
        aspectRatio: '9 / 12',
        borderRadius: 14,
        border: isActive ? '2px solid #f3b94b' : '1.5px solid rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? '0 0 0 3px rgba(243,185,75,0.2), 0 8px 24px rgba(0,0,0,0.5)'
          : '0 4px 14px rgba(0,0,0,0.35)',
        background: catStyle.bg,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.03)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.55)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = isActive
          ? '0 0 0 3px rgba(243,185,75,0.2), 0 8px 24px rgba(0,0,0,0.5)'
          : '0 4px 14px rgba(0,0,0,0.35)';
      }}
    >
      {t.thumb && (
        <img
          src={t.thumb}
          alt={t.name}
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          loading="lazy"
        />
      )}
      {/* gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.06) 50%, transparent 100%)' }} />
      {/* hover CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
        <div className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white"
          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)' }}>
          ✦ Use this style
        </div>
      </div>
      {/* name at bottom */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 group-hover:opacity-0 transition-opacity duration-200">
        <span className="block text-[10px] font-semibold leading-tight text-white/95" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{t.name}</span>
      </div>
      {/* active check */}
      {isActive && (
        <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow">✓</span>
      )}
    </button>
  );
}

/* ── Template Card — real thumbnail image background ── */
function TemplateCard({
  t,
  isActive,
  onClick,
}: {
  t: typeof VISUAL_TEMPLATES[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const style = CAT_STYLE[t.category] ?? CAT_STYLE['nature'];
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <button
      onClick={onClick}
      className="group relative shrink-0 overflow-hidden text-left"
      style={{
        width: 108,
        height: 148,
        borderRadius: 16,
        border: isActive ? '2px solid #f3b94b' : '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: isActive
          ? `0 0 0 3px rgba(243,185,75,0.25), 0 8px 24px rgba(0,0,0,0.35)`
          : '0 4px 16px rgba(0,0,0,0.22)',
        background: style.bg,
        transform: 'perspective(600px)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(-5deg) rotateX(3deg) translateY(-4px) scale(1.04)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 18px 44px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'perspective(600px)';
        (e.currentTarget as HTMLElement).style.boxShadow = isActive
          ? `0 0 0 3px rgba(243,185,75,0.25), 0 8px 24px rgba(0,0,0,0.35)`
          : '0 4px 16px rgba(0,0,0,0.22)';
      }}
    >
      {/* Real thumbnail image */}
      {t.thumb && (
        <img
          src={t.thumb}
          alt={t.name}
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          loading="lazy"
        />
      )}

      {/* Gradient overlay so name is always readable */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)' }} />

      {/* Hover: "Use this style" pill (replaces name) */}
      <div
        className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-200"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
      >
        <div className="px-2 pb-2.5">
          <div
            className="flex items-center justify-center gap-1 rounded-full py-1 text-[9px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            ✦ Use this style
          </div>
        </div>
      </div>

      {/* Name label — always visible at bottom, hidden on hover */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 group-hover:opacity-0 transition-opacity duration-200">
        <span className="block text-[9.5px] font-semibold leading-tight text-white/95" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{t.name}</span>
      </div>

      {/* Active checkmark */}
      {isActive && (
        <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow">✓</span>
      )}
    </button>
  );
}

/* ── Infinite 3D marquee row ── */
function MarqueeRow({
  templates,
  direction,
  activeId,
  onSelect,
}: {
  templates: typeof VISUAL_TEMPLATES;
  direction: 'left' | 'right';
  activeId: string | undefined;
  onSelect: (t: typeof VISUAL_TEMPLATES[0]) => void;
}) {
  const doubled = [...templates, ...templates]; // duplicate for seamless loop
  const duration = templates.length * 5; // speed proportional to count

  return (
    <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div
        className="flex gap-2.5 w-max"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
          willChange: 'transform',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {doubled.map((t, i) => (
          <TemplateCard
            key={`${t.id}-${i}`}
            t={t}
            isActive={activeId === t.id}
            onClick={() => onSelect(t)}
          />
        ))}
      </div>
    </div>
  );
}

export function ImagineModal({ isOpen, onClose }: ImagineModalProps) {
  const [prompt, setPrompt]                   = useState('');
  const [uploadedImage, setUploadedImage]     = useState<{ preview: string; name: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GenImage[]>(() => loadPersistedImages());
  const [isGenerating, setIsGenerating]       = useState(false);
  const [activeTemplate, setActiveTemplate]   = useState<typeof TEMPLATES[0] | null>(null);
  const [activeVisualId, setActiveVisualId]   = useState<string | undefined>(undefined);
  const [activeCatFilter, setActiveCatFilter] = useState('spaces');
  const [imageCount, setImageCount]           = useState(1);
  const shuffledAnime = useMemo(() => shuffleArray(ANIME_BOY_IMAGES), []);
  const [editTarget, setEditTarget]           = useState<GenImage | null>(null);
  const [editStyle, setEditStyle]             = useState('');
  const [editResolution, setEditResolution]   = useState('1:1');
  const [editAccessories, setEditAccessories] = useState<string[]>([]);
  const [editHistory, setEditHistory]         = useState<string[]>([]);
  const [isEditGenerating, setIsEditGenerating] = useState(false);
  const [lightboxImg, setLightboxImg]         = useState<GenImage | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const uploadRef       = useRef<HTMLInputElement>(null);
  const templatesSectionRef = useRef<HTMLElement>(null);

  if (!isOpen) return null;

  /* ── Smart URL picker ── */
  function smartPollinationsUrl(fullPrompt: string, pw: number, ph: number, s: number): string {
    const p = fullPrompt.toLowerCase();
    const isAnime    = p.includes('anime') || p.includes('manga') || p.includes('ghibli') || p.includes('cel-shad') || p.includes('cel shad');
    const isPixelArt = p.includes('pixel art') || p.includes('8-bit') || p.includes('16-bit') || p.includes('pixelated') || p.includes('pixel grid');
    if (isAnime) return buildAnimeUrl(fullPrompt, pw, ph, s);
    if (isPixelArt) return buildPixelArtUrl(fullPrompt, pw, ph, s);
    return buildPollinationsUrl(fullPrompt, pw, ph, s);
  }

  async function generateSingle(fullPrompt: string, size: string, seed?: number): Promise<string> {
    const [w, h] = size.split('x').map(Number);
    const pw = w || 1024;
    const ph = h || 1024;
    const s = seed ?? Math.floor(Math.random() * 9_999_999);
    const pollinationsUrl = smartPollinationsUrl(fullPrompt, pw, ph, s);
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
    } catch {}
    return pollinationsUrl;
  }

  function getApiSize(resId: string): string {
    return RESOLUTIONS.find(r => r.id === resId)?.apiSize ?? '1024x1024';
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const base = prompt.trim();
    const templateSuffix = activeTemplate ? `, ${activeTemplate.prompt}` : '';
    const fullPrompt = base + templateSuffix;
    const size = getApiSize('1:1');

    const placeholders: GenImage[] = Array.from({ length: imageCount }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      url: '',
      prompt: fullPrompt,
      history: [],
      loading: true,
    }));
    setGeneratedImages(prev => [...placeholders, ...prev].slice(0, 20));

    const seeds = placeholders.map(() => Math.floor(Math.random() * 9_999_999));
    const promises = seeds.map((seed, i) =>
      generateSingle(fullPrompt, size, seed).then(url => ({ id: placeholders[i].id, url }))
    );

    for (const p of promises) {
      p.then(({ id, url }) => {
        setGeneratedImages(prev => {
          const updated = prev.map(img =>
            img.id === id ? { ...img, url, history: [url], loading: false } : img
          );
          persistImages(updated);
          return updated;
        });
      });
    }

    await Promise.allSettled(promises);
    setIsGenerating(false);
  }

  function handleTemplateSelectFromGallery(t: typeof VISUAL_TEMPLATES[0]) {
    setShowTemplateGallery(false);
    handleTemplateSelect(t);
  }

  function handleTemplateSelect(t: typeof VISUAL_TEMPLATES[0]) {
    setActiveVisualId(t.id);
    setPrompt(t.prompt);
    setActiveTemplate({ id: t.id, icon: '', name: t.name, desc: '', prompt: t.prompt });
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

  function openEdit(img: GenImage) {
    setEditTarget(img);
    setEditHistory(img.history?.length ? img.history : [img.url]);
    setEditStyle('');
    setEditAccessories([]);
    setEditResolution('1:1');
  }

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
          <div className="flex-1 overflow-y-auto p-6 space-y-7" style={{ scrollbarWidth: 'none' }}>
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
     LIGHTBOX
  ──────────────────────────────────────────────────── */
  if (lightboxImg) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        onClick={() => setLightboxImg(null)}
      >
        <div
          className="relative max-w-[90vw] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
          style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
        >
          <img src={lightboxImg.url} alt="Full view" className="max-w-[90vw] max-h-[85vh] object-contain" />
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => handleDownload(lightboxImg.url, 'fius-imagine')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => setLightboxImg(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
            >
              <X size={15} />
            </button>
          </div>
          {lightboxImg.prompt && (
            <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
              <p className="text-white/80 text-[11px] leading-relaxed line-clamp-2">{lightboxImg.prompt}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const completedImages = generatedImages.filter(i => !i.loading && i.url);

  return (
    <>
      {/* ── CSS keyframes injected once ── */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* ── Fullscreen Template Gallery ── */}
      {showTemplateGallery && (
        <TemplateGalleryOverlay
          onClose={() => setShowTemplateGallery(false)}
          onSelect={handleTemplateSelectFromGallery}
          activeId={activeVisualId}
        />
      )}

      <div className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#fff', color: '#171717', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif' }}>

        {/* ── Scrollable content area ── */}
        <div className="relative flex-1 overflow-y-auto">
          {/* Hero backdrop */}
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 'clamp(170px,27vw,290px)', overflow: 'hidden', pointerEvents: 'none' }}>
            <img src={studioHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.4) 60%, #ffffff 100%)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.7) 40%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '20%', background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.8) 40%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '20%', background: 'linear-gradient(to left, #ffffff 0%, rgba(255,255,255,0.8) 40%, transparent 100%)' }} />
          </div>

          <div className="relative mx-auto flex w-full max-w-[1120px] flex-col px-4 pb-6 sm:px-8">
            <header className="flex items-center justify-between pt-5 sm:pt-7">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/85 shadow-sm ring-1 ring-black/[0.06] backdrop-blur">
                  <Sparkles size={15} className="text-amber-400" />
                </div>
                <span>Fius Studio</span>
              </div>
              <button onClick={onClose} aria-label="Close Image Studio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-neutral-500 shadow-sm ring-1 ring-black/[0.07] transition hover:bg-white hover:text-neutral-900 active:scale-95">
                <X size={17} />
              </button>
            </header>

            {/* ── Hero heading ── */}
            <div className="mx-auto flex w-full max-w-[640px] flex-col items-center pt-[clamp(112px,18vw,190px)] sm:pt-[clamp(126px,17vw,182px)]">
              <h2 className="text-center tracking-[-0.05em] text-neutral-900" style={{ fontSize: 'clamp(28px,5vw,44px)', lineHeight: 1.1 }}>
                <span className="font-extrabold">Fius Labs</span>{' '}
                <span className="font-extrabold">Imagine Studio</span>
              </h2>
              <p className="mt-2 text-center font-medium text-neutral-500" style={{ fontSize: 'clamp(15px,1.8vw,18px)' }}>
                The Canvas of Tomorrow ✦
              </p>
            </div>

            {/* ── Template section: category tabs + dual 3D marquee rows ── */}
            <section ref={templatesSectionRef} className="mt-9 sm:mt-11">
              <div className="mb-3 flex items-center justify-between px-0.5">
                <h3 className="text-[14px] font-bold tracking-[-0.02em] text-neutral-800 sm:text-[15px]">Templates</h3>
                <span className="text-[10px] font-medium text-neutral-400">
                  {activeCatFilter === 'all' ? VISUAL_TEMPLATES.length : VISUAL_TEMPLATES.filter(t => t.category === activeCatFilter).length} styles
                </span>
              </div>

              {/* Category filter pills */}
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Browse All button */}
                <button
                  onClick={() => setShowTemplateGallery(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg,#18181b,#3f3f46)', color: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}
                >
                  <LayoutGrid size={11} />
                  <span>All</span>
                </button>
                {/* Individual category tabs (skip 'all') */}
                {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCatFilter(cat.id)}
                    className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200"
                    style={activeCatFilter === cat.id
                      ? { background: '#171717', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }
                      : { background: 'rgba(0,0,0,0.05)', color: '#525252', border: '1px solid rgba(0,0,0,0.07)' }
                    }
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Templates display — marquee for selected category */}
              {(() => {
                const cat = activeCatFilter === 'all'
                  ? TEMPLATE_CATEGORIES.find(c => c.id === 'spaces')! // default to spaces if somehow 'all' is active
                  : TEMPLATE_CATEGORIES.find(c => c.id === activeCatFilter);
                const filtered = activeCatFilter === 'all'
                  ? VISUAL_TEMPLATES.filter(t => t.category === 'spaces')
                  : VISUAL_TEMPLATES.filter(t => t.category === activeCatFilter);
                const mid = Math.ceil(filtered.length / 2);
                return (
                  <div className="flex flex-col gap-2.5">
                    <MarqueeRow templates={filtered.slice(0, mid)} direction="left"  activeId={activeVisualId} onSelect={handleTemplateSelect} />
                    <MarqueeRow templates={filtered.slice(mid)}    direction="right" activeId={activeVisualId} onSelect={handleTemplateSelect} />
                  </div>
                );
              })()}
            </section>

            {/* ── Gallery: only real persisted images ── */}
            <section className="mt-8 sm:mt-10">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-bold tracking-[-0.02em] text-neutral-800 sm:text-[15px]">
                  My Gallery
                  {completedImages.length > 0 && (
                    <span className="ml-2 text-[11px] font-medium text-neutral-400">({completedImages.length} images)</span>
                  )}
                </h3>
                {completedImages.length > 0 && (
                  <button
                    onClick={() => { if (confirm('Clear all generated images?')) { setGeneratedImages([]); persistImages([]); } }}
                    className="text-[10px] text-neutral-400 transition hover:text-neutral-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {generatedImages.length === 0 ? (
                <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70">
                  <div className="text-center">
                    <ImageIcon size={22} className="mx-auto text-neutral-300" />
                    <p className="mt-2 text-[12px] font-medium text-neutral-500">Your generated images appear here</p>
                    <p className="mt-1 text-[11px] text-neutral-400">All images from every session are preserved</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 cursor-pointer"
                      style={{
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.015)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.14)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = '';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      onClick={() => img.url && !img.loading && setLightboxImg(img)}
                    >
                      {img.loading || !img.url ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-400">
                          <Loader2 size={19} className="animate-spin text-amber-400" />
                          <span className="text-[10px]">Generating…</span>
                        </div>
                      ) : (
                        <>
                          <img src={img.url} alt="Generated image" className="h-full w-full object-cover" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/10 p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={e => { e.stopPropagation(); handleDownload(img.url, `image-${idx + 1}`); }}
                                aria-label="Download image"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setLightboxImg(img); }}
                                aria-label="View full size"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80"
                              >
                                <ZoomIn size={12} />
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const updated = generatedImages.map(x => x.id === img.id ? { ...x, liked: !x.liked } : x);
                                  setGeneratedImages(updated);
                                  persistImages(updated);
                                }}
                                className="rounded-full px-2.5 py-1 text-[10px] font-semibold transition"
                                style={{
                                  background: img.liked ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.85)',
                                  color: img.liked ? 'white' : '#374151',
                                }}
                              >
                                {img.liked ? '♥ Liked' : '♡ Like'}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); openEdit(img); }}
                                className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 transition hover:bg-white"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Fixed bottom bar ── */}
        <div className="flex-shrink-0 border-t border-neutral-100 bg-white/98 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:px-8">
          <div className="mx-auto w-full max-w-[640px]">
            {/* Composer */}
            <div className="w-full rounded-[20px] border border-neutral-200 bg-white/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.05)] sm:p-4">
              {(uploadedImage || activeTemplate) && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {uploadedImage && (
                    <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-600">
                      <img src={uploadedImage.preview} alt="" className="h-4 w-4 rounded object-cover" />
                      <span className="max-w-[140px] truncate">{uploadedImage.name}</span>
                      <button onClick={() => setUploadedImage(null)} aria-label="Remove"><X size={11} /></button>
                    </div>
                  )}
                  {activeTemplate && (
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
                      {activeTemplate.name}
                      <button onClick={() => { setActiveTemplate(null); setActiveVisualId(undefined); }} aria-label="Remove active template"><X size={11} /></button>
                    </div>
                  )}
                </div>
              )}
              <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <textarea
                ref={textareaRef}
                value={prompt}
                rows={2}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Create a cozy anime café on a rainy evening"
                className="min-h-[52px] w-full resize-none bg-transparent px-0.5 py-0.5 text-[13px] leading-5 text-neutral-800 outline-none placeholder:text-neutral-400 sm:min-h-[58px] sm:text-sm"
              />
              <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                <div className="flex items-center gap-1 text-neutral-400">
                  <button onClick={() => uploadRef.current?.click()} aria-label="Upload reference image"
                    className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-neutral-100 hover:text-neutral-700">
                    <Plus size={17} />
                  </button>
                  <button onClick={() => uploadRef.current?.click()} aria-label="Add image"
                    className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-neutral-100 hover:text-neutral-700">
                    <ImageIcon size={15} />
                  </button>
                  <div className="mx-1 h-4 w-px bg-neutral-200" />
                  <div className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-neutral-500">
                    <span className="h-2 w-2 rounded-sm border border-neutral-400" /> 1:1
                  </div>
                  <div className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-neutral-500">
                    <ImageIcon size={12} /> {imageCount}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="Voice input" className="hidden text-neutral-400 transition hover:text-neutral-700 sm:block"><Mic size={15} /></button>
                  <div className="flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-500">
                    Auto <ChevronRight size={11} className="rotate-90" />
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    aria-label="Generate image"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Quick-action cards: bigger curves, no icon bg, colored icons ── */}
            <div className="mt-3 grid w-full grid-cols-2 gap-2.5 sm:gap-3">
              <button
                onClick={() => completedImages[0] ? openEdit(completedImages[0]) : uploadRef.current?.click()}
                className="group flex items-center gap-3 border border-neutral-200 bg-white/90 px-3 py-2.5 text-left shadow-[0_3px_14px_rgba(0,0,0,0.025)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:px-4"
                style={{ borderRadius: 20 }}
              >
                <Wand2 size={20} className="shrink-0 transition group-hover:scale-110" style={{ color: '#38bdf8' }} />
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-neutral-800 sm:text-[13px]">Editor</span>
                  <span className="mt-0.5 block truncate text-[10px] text-neutral-400 sm:text-[11px]">Transform a photo</span>
                </span>
              </button>
              <button
                onClick={() => templatesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="group flex items-center gap-3 border border-neutral-200 bg-white/90 px-3 py-2.5 text-left shadow-[0_3px_14px_rgba(0,0,0,0.025)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:px-4"
                style={{ borderRadius: 20 }}
              >
                <SlidersHorizontal size={20} className="shrink-0 transition group-hover:scale-110" style={{ color: '#a78bfa' }} />
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-neutral-800 sm:text-[13px]">Templates</span>
                  <span className="mt-0.5 block truncate text-[10px] text-neutral-400 sm:text-[11px]">Styles for every occasion</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
