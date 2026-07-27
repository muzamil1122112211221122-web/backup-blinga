import { useState, useRef, useMemo, useEffect } from "react";
import { X, Sparkles, ArrowUp, Download, ChevronLeft, ChevronRight, Wand2, Upload, Loader2, Mic, Plus, Image as ImageIcon, SlidersHorizontal, ZoomIn } from "lucide-react";
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
  { id: 'organic',  label: 'Organic Living', emoji: '🌿' },
  { id: 'portrait', label: 'Portraits',      emoji: '🖼️' },
  { id: 'fantasy',  label: 'Fantasy',        emoji: '🐉' },
  { id: 'fashion',  label: 'Fashion',        emoji: '👗' },
  { id: 'traditional', label: 'Traditional', emoji: '🕌' },
  { id: 'travel',   label: 'Travel',         emoji: '✈️' },
  { id: 'products', label: 'Products',       emoji: '📦' },
  { id: 'nature',   label: 'Nature',         emoji: '🌄' },
];

const VISUAL_TEMPLATES = [
  /* ── ORGANIC LIVING (10) ── */
  { id: 'pottery-studio',     category: 'organic',     name: 'Pottery Studio',           thumb: P('close-up of hands crafting pottery clay on a wheel, warm golden sunlight from window, ceramic pieces on wooden shelves behind, artisan craftsman workshop, earthy tones, photorealistic', 1001), prompt: 'close-up of hands crafting pottery on a wheel, warm sunlight streaming through a window, ceramic pieces on wooden shelves in background, artisan workshop, craftsman vibe, natural earthy tones, cinematic photography' },
  { id: 'japandi-bath',       category: 'organic',     name: 'Japandi Sanctuary',        thumb: P('minimalist Japandi bathroom interior, freestanding stone bathtub, bamboo floor, living green plant wall, soft natural light, luxury spa, peaceful architecture photography', 1002), prompt: 'minimalist Japandi bathroom, freestanding stone bathtub, bamboo flooring, living green wall with plants, soft diffused natural light, luxury spa vibe, peaceful minimalism, architectural photography' },
  { id: 'foraged-kitchen',    category: 'organic',     name: 'Foraged Kitchen Shelf',    thumb: P('rustic wooden kitchen shelves with hanging dried herbs bundles, lavender, hand-carved wooden utensils, ambient green backlighting, farm-to-table aesthetic, editorial photography', 1003), prompt: 'rustic wooden kitchen shelves with hanging dried herbs and lavender bundles, hand-carved wooden utensils, ambient green backlighting, warm earthy tones, farm-to-table aesthetic, editorial food photography' },
  { id: 'terracotta-oasis',   category: 'organic',     name: 'Terracotta Oasis',         thumb: P('cozy room corner filled with terracotta pots various sizes, exotic large-leaf tropical indoor plants, warm afternoon light, boho urban jungle interior lifestyle photography', 1004), prompt: 'cozy urban corner filled with terracotta pots of varying sizes, exotic large-leaf tropical indoor plants, warm afternoon light, boho urban jungle vibe, interior lifestyle photography' },
  { id: 'textile-loom',       category: 'organic',     name: 'Artisanal Textile Loom',   thumb: P('handmade woolen rug on traditional wooden loom, raw cotton bundles, hand-dyed colorful yarns, earthy fiber textures, artisan textile weaving workshop, warm natural light', 1005), prompt: 'handmade woolen rug on a traditional wooden loom, raw cotton bundles and hand-dyed colorful yarns scattered nearby, earthy fiber textures, artisan textile craft, warm natural light, editorial lifestyle photography' },
  { id: 'desert-bloom',       category: 'organic',     name: 'Dry Desert Bloom',         thumb: P('resilient succulent cactus plants growing from arid desert sand earth, mud-brick house in background, golden hour desert light, minimalist desert nature photography', 1006), prompt: 'resilient succulent and cactus plants growing from arid desert earth, mud-brick dwelling in the background, golden hour desert light, minimalist desert aesthetic, National Geographic quality photography' },
  { id: 'basket-market',      category: 'organic',     name: 'Woven Basketry Market',    thumb: P('artistic boho display of natural fiber woven rattan jute bamboo baskets and mats, earthy neutral tones, warm market light, bohemian lifestyle photography', 1007), prompt: 'artistic boho display of natural fiber baskets, rattan mats, jute and bamboo woven wares, earthy neutral tones, warm market light, bohemian lifestyle photography' },
  { id: 'root-cellar',        category: 'organic',     name: 'Root Cellar Harvest',      thumb: P('fresh root vegetables carrots potatoes farm produce in old stone cellar, rustic earthy tones, ambient damp cellar light, farm-to-table editorial photography', 1008), prompt: 'fresh root vegetables, carrots, potatoes and farm produce resting in an old stone cellar, rustic earthy tones, ambient damp cellar light, farm-to-table editorial photography' },
  { id: 'geode-collection',   category: 'organic',     name: 'Earthy Geode Collection',  thumb: P('curated collection raw geological crystals sparkling geodes natural gemstones on wooden surface, macro mineral textures, geological lifestyle photography', 1009), prompt: 'curated collection of raw geological crystals, sparkling geodes and natural gemstones on a wooden surface, macro detail photography, earthy mineral textures, geological lifestyle photography' },
  { id: 'monsoon-window',     category: 'organic',     name: 'Monsoon Mood Window',      thumb: P('cozy rain-streaked glass window, steaming coffee mug on wooden windowsill, warm glowing candle, soft knit blanket, lush green forest outside, moody monsoon cinematic photography', 1010), prompt: 'cozy rain-streaked window pane looking out at lush green forest, steaming mug of coffee on wooden windowsill, warm glowing candle, soft knit blanket, moody monsoon atmospheric lighting, cinematic photography' },

  /* ── PORTRAITS (10) ── */
  { id: 'artisan-portrait',   category: 'portrait',    name: 'The Artisan at Work',      thumb: P('candid warm portrait of a leatherworker artisan in cluttered workshop focused on stitching, rich leather textures tools visible, natural workshop lighting, documentary portrait photography', 1011), prompt: 'candid warm portrait of a leatherworker in a cluttered artisan workshop, focused on stitching, rich leather textures and tools visible, natural workshop lighting, authentic documentary portrait photography' },
  { id: 'ballet-portrait',    category: 'portrait',    name: 'Ballet Dancer',            thumb: P('dramatic low-key portrait ballerina in dance studio looking into mirror, tension and grace, chiaroscuro theatrical lighting, emotional dance portrait photography', 1012), prompt: 'dramatic low-key portrait of a ballerina in a dance studio looking into a mirror, tension and grace before performance, chiaroscuro theatrical lighting, emotional dance portrait photography' },
  { id: 'aviator-portrait',   category: 'portrait',    name: 'Vintage Aviator',          thumb: P('sepia-toned 1930s pilot portrait, worn leather jacket goggles, vintage biplane background, warm amber tones, historical evocative portrait, analog film grain texture', 1013), prompt: 'sepia-toned portrait of a 1930s pilot in a worn leather jacket and goggles, vintage biplane background, warm amber tones, historical evocative portrait, analog film grain texture' },
  { id: 'cyberpunk-portrait',  category: 'portrait',   name: 'Cyberpunk Hacker',         thumb: P('neon-lit portrait young person reflective cyberpunk glasses tech implants, rainy futuristic urban alley background, electric blues magentas, sci-fi moody atmosphere photography', 1014), prompt: 'neon-lit portrait of a young person with reflective cyberpunk glasses and subtle tech implants, rainy futuristic urban alley background, electric blues and magentas, sci-fi moody atmosphere' },
  { id: 'elder-portrait',     category: 'portrait',    name: 'Tribal Elder',             thumb: P('dignified portrait wise tribal elder with intricate traditional jewelry, weathered expressive features, deep wise gaze, natural window lighting, cultural respectful portrait photography', 1015), prompt: 'dignified portrait of a wise tribal elder with intricate traditional jewelry, weathered expressive features, deep wise gaze, natural window lighting, cultural respectful portrait photography' },
  { id: 'editorial-portrait',  category: 'portrait',   name: 'Fashion Editorialist',     thumb: P('bold high-fashion editorial portrait, avant-garde makeup strong colors geometric shapes minimalist set, Vogue magazine quality editorial photography', 1016), prompt: 'bold high-fashion editorial portrait, avant-garde makeup and clothing, strong geometric color blocks, minimalist set design, Vogue magazine quality editorial photography' },
  { id: 'jazz-portrait',      category: 'portrait',    name: 'The Jazz Musician',        thumb: P('smoky atmospheric portrait saxophonist in jazz club, bathed in warm golden spotlight, saxophone gleaming, ambient club smoke, classic moody jazz photography', 1017), prompt: 'smoky atmospheric portrait of a saxophonist in a jazz club, bathed in warm golden spotlight, saxophone gleaming, ambient club smoke, classic moody jazz photography' },
  { id: 'explorer-portrait',  category: 'portrait',    name: 'Victorian Explorer',       thumb: P('studio portrait Victorian explorer in tweed suit pith helmet, holding antique compass, adventurous gaze off-camera, warm studio lighting, costumed thematic portrait', 1018), prompt: 'studio portrait of a Victorian explorer in a tweed suit and pith helmet, holding an antique compass, adventurous gaze off-camera, warm studio lighting, costumed thematic portrait photography' },
  { id: 'polymath-portrait',  category: 'portrait',    name: 'Modern Polymath',          thumb: P('split dramatic lighting portrait, one side surrounded by stacked books spectacles, other side holding paintbrush, conceptual dual-nature cinematic editorial photography', 1019), prompt: 'split dramatic lighting portrait of a person, one side surrounded by stacked books and spectacles, other side holding a paintbrush, conceptual dual-nature portrait, cinematic editorial photography' },
  { id: 'runner-portrait',    category: 'portrait',    name: 'Marathon Runner',          thumb: P('sweaty post-race marathon athlete portrait, raw exhaustion and triumph on face, emotion-filled authentic moment, dramatic natural light, sports portrait photography', 1020), prompt: 'sweaty post-race portrait of a marathon athlete, face showing raw exhaustion and triumph, emotion-filled authentic moment, dramatic natural light, sports portrait photography' },

  /* ── FANTASY (10) ── */
  { id: 'elven-spy',          category: 'fantasy',     name: 'Elven Spymaster',          thumb: P('sharp low-key fantasy portrait high elf in dark intricate leather armor hooded cloak, subtle scars piercing golden eye, holding coded message, fantasy digital painting art', 1021), prompt: 'sharp low-key fantasy portrait of a high elf in dark intricate leather armor and hooded cloak, subtle scars and one piercing golden eye, holding a coded message, stealth intellect fantasy art, digital painting' },
  { id: 'gnome-artificer',    category: 'fantasy',     name: 'Gnomish Artificer',        thumb: P('cheerful gnome portrait wild white hair goggles forehead, grease-stained vest, tinkering glowing magical automaton, steampunk fantasy character digital art', 1022), prompt: 'cheerful older gnome with wild white hair and goggles pushed on forehead, grease-stained vest, tinkering with a small glowing magical automaton, steampunk cheerful fantasy portrait, digital art' },
  { id: 'undead-lich',        category: 'fantasy',     name: 'The Undead Lich',          thumb: P('dramatic high-contrast portrait ancient skeletal sorcerer lich, tattered robes, eye sockets burning cold blue fire, hand raised crackling dark necromantic magic, horror fantasy art', 1023), prompt: 'dramatic high-contrast portrait of an ancient skeletal sorcerer lich, tattered robes, empty eye sockets burning with cold blue fire, one hand raised crackling with dark necromantic magic, horror fantasy digital art' },
  { id: 'celestial-paladin',  category: 'fantasy',     name: 'Celestial Paladin',        thumb: P('heroic fantasy portrait human warrior polished gilded armor sun motifs, radiant holy glow, determined expression, leaning massive two-handed sword, cinematic fantasy art', 1024), prompt: 'heroic fantasy portrait of a human warrior in polished gilded armor adorned with sun and celestial motifs, radiant holy glow, determined expression, leaning on a massive two-handed sword, lawful good cinematic fantasy art' },
  { id: 'shapeshifter-druid', category: 'fantasy',     name: 'Shapeshifter Druid',       thumb: P('striking semi-feral portrait female druid earthy mossy armor, glowing green eyes, arm visibly transforming bear claw, nature magic wild transformation, fantasy digital painting', 1025), prompt: 'striking semi-feral portrait of a female druid in earthy mossy armor, glowing green eyes, one arm visibly transforming into a bear claw, nature magic wild transformation, detailed fantasy digital painting' },
  { id: 'shadow-sorcerer',    category: 'fantasy',     name: 'Shadow Sorcerer',          thumb: P('brooding low-key portrait young sorcerer surrounded swirling inky black shadows, eyes glowing intense purple arcane power, moody chaos magic fantasy art dramatic lighting', 1026), prompt: 'brooding low-key portrait of a young sorcerer surrounded by swirling inky black shadows, face obscured, eyes glowing with intense purple arcane power, moody chaos magic fantasy art, dramatic lighting' },
  { id: 'centaur-huntress',   category: 'fantasy',     name: 'Centaur Huntress',         thumb: P('powerful dynamic portrait centaur archer travel-worn armor, intense gaze nocking arrow, vast windswept plains background, action epic scale fantasy digital painting', 1027), prompt: 'powerful dynamic portrait of a centaur archer in practical travel-worn armor, intense gaze while nocking an arrow, vast windswept plains in background, action fantasy digital painting, epic scale' },
  { id: 'vampire-lord',       category: 'fantasy',     name: 'Vampire Lord',             thumb: P('opulent portrait vampire aristocrat rich velvet antique lace, enigmatic pale expression, single drop blood on lip, candlelit historical mansion, dark romance gothic fantasy art', 1028), prompt: 'opulent classic portrait of a vampire aristocrat in rich velvet and antique lace, enigmatic pale expression, single drop of blood on lip, candlelit historical mansion interior, dark romance fantasy art' },
  { id: 'dragonborn-barb',    category: 'fantasy',     name: 'Dragonborn Barbarian',     thumb: P('fierce portrait red-scaled dragonborn warrior curved horns broken warhammer, roaring fury, steam rising from scales, intense fantasy digital art dramatic fiery background', 1029), prompt: 'fierce detailed portrait of a red-scaled dragonborn warrior with curved horns and broken warhammer, roaring with fury, steam rising from scales, raw intense fantasy digital art, dramatic fiery background' },
  { id: 'kitsune-illusionist', category: 'fantasy',    name: 'Kitsune Illusionist',      thumb: P('vibrant playful portrait kitsune fox spirit traditional Japanese robes, multiple shimmering magical tails, holding glowing illusionary orb, anime-esque cultural fantasy art vivid colors', 1030), prompt: 'vibrant playful portrait of a kitsune fox spirit in traditional stylized Japanese robes, multiple shimmering magical tails, holding a glowing illusionary orb, anime-esque cultural fantasy art, vivid colors' },

  /* ── FASHION (10) ── */
  { id: 'monochrome-fashion',  category: 'fashion',    name: 'Monochrome Minimalist',    thumb: P('sleek high-fashion editorial portrait model in head-to-toe crisp cream tailoring, stark architectural concrete wall, minimalist high-fashion Vogue photography', 1031), prompt: 'sleek high-fashion editorial portrait of a model in head-to-toe crisp cream tailoring, stark architectural concrete wall backdrop, clean geometric lines, high-fashion minimalist photography, Vogue quality' },
  { id: 'boho-resort',         category: 'fashion',    name: 'Bohemian Summer Resort',   thumb: P('breezy sun-dappled fashion model flowing linen separates wide-brim straw hat, Mediterranean pergola climbing vines, golden hour resort lifestyle boho chic photography', 1032), prompt: 'breezy sun-dappled fashion shot of a model in flowing linen separates and wide-brim straw hat, Mediterranean pergola with climbing vines, golden hour resort lifestyle photography, relaxed boho chic' },
  { id: 'cyber-goth',          category: 'fashion',    name: 'Edgy Cyber-Goth',          thumb: P('moody neon-accented fashion portrait structural black faux-leather apparel, silver hardware chains, dramatic split neon lighting, alternative avant-garde fashion editorial', 1033), prompt: 'moody neon-accented fashion portrait with structural black faux-leather apparel, silver hardware and chains, dramatic split neon lighting, alternative avant-garde fashion editorial photography' },
  { id: 'retro-70s',           category: 'fashion',    name: 'Vintage Retro 70s',        thumb: P('warm nostalgic fashion portrait model patterned turtleneck corduroy blazer amber tinted frames, vintage film grain Kodachrome 1970s retro photography', 1034), prompt: 'warm nostalgic portrait of a model styled in a patterned turtleneck, corduroy blazer and amber tinted frames, vintage film grain, Kodachrome color palette, 1970s retro fashion photography' },
  { id: 'trench-heritage',     category: 'fashion',    name: 'Classic Trench Heritage',  thumb: P('sophisticated moody street-style portrait model classic double-breasted beige trench coat, misty city morning rain-slicked cobblestones, timeless outerwear fashion editorial', 1035), prompt: 'sophisticated moody street-style portrait of a model wearing a classic double-breasted beige trench coat on a misty city morning, rain-slicked cobblestones, timeless outerwear fashion editorial' },
  { id: 'winter-layering',     category: 'fashion',    name: 'Winter Layering',          thumb: P('cozy stylish mountain-chic fashion, chunky cable-knit sweater quilted puffer vest, snowy alpine backdrop pine trees, seasonal winter fashion lifestyle photography', 1036), prompt: 'cozy stylish mountain-chic fashion look, chunky cable-knit sweater under a quilted puffer vest, snowy alpine backdrop with pine trees, seasonal winter fashion lifestyle photography' },
  { id: 'velvet-renaissance',  category: 'fashion',    name: 'Velvet Renaissance',       thumb: P('opulent rich-toned portrait model deep emerald velvet suit, antique dimly lit interior oil paintings, candlelight glow, luxurious dramatic fashion editorial photography', 1037), prompt: 'opulent rich-toned portrait of a model draped in a deep emerald velvet suit, antique dimly lit interior with oil paintings, candlelight glow, luxurious dramatic fashion editorial photography' },
  { id: 'denim-studio',        category: 'fashion',    name: 'Denim-on-Denim Studio',    thumb: P('cool editorial portrait structured dark-wash denim jacket jeans, minimalist grey studio backdrop, dramatic side lighting, casual edgy fashion photography', 1038), prompt: 'cool modern editorial portrait featuring structured dark-wash denim jacket and jeans, minimalist grey studio backdrop, dramatic side lighting, casual edgy fashion photography' },
  { id: 'pastel-spring',       category: 'fashion',    name: 'Pastel Spring Elegance',   thumb: P('soft glowing outdoor portrait model light lavender pastel suit, surrounded blooming cherry blossoms spring flowers, bright fresh fashion editorial photography', 1039), prompt: 'soft glowing outdoor portrait of a model in a light lavender pastel structured suit, surrounded by blooming cherry blossoms and spring flowers, bright fresh fashion editorial photography' },
  { id: 'techwear-future',     category: 'fashion',    name: 'Futuristic Techwear',      thumb: P('dynamic futuristic techwear fashion look, multi-pocket cargo straps matte black technical fabrics, industrial warehouse lighting, modern functional fashion editorial photography', 1040), prompt: 'dynamic high-utility futuristic techwear fashion look, multi-pocket cargo straps and matte black technical fabrics, industrial warehouse lighting, modern functional fashion editorial photography' },

  /* ── TRADITIONAL (10) ── */
  { id: 'royal-sherwani',     category: 'traditional', name: 'Royal Sherwani',           thumb: P('regal portrait groom heavy embroidered velvet sherwani traditional kalgi safa turban, royal palace jharokha arch background, warm golden cinematic wedding photography', 1041), prompt: 'regal portrait of a groom in heavy embroidered velvet sherwani with traditional kalgi and ornate safa turban, antique royal palace jharokha arch background, warm golden lighting, cinematic wedding photography' },
  { id: 'saree-elegance',     category: 'traditional', name: 'Ethereal Saree',           thumb: P('soft golden-hour portrait woman handloom organza saree minimal kundan jewellery, heritage sandstone courtyard, warm afternoon light, elegant traditional fashion photography', 1042), prompt: 'soft golden-hour portrait of a woman in a handloom organza saree with minimal kundan jewellery, standing in a heritage sandstone courtyard, warm afternoon light, elegant traditional fashion photography' },
  { id: 'qawwali-night',      category: 'traditional', name: 'Qawwali Night Vibe',       thumb: P('moody warm-lit portrait qawwali musician traditional kurta-pajama fine shawl, sitting with harmonium tabla, amber candlelight diyas, atmospheric Sufi music photography', 1043), prompt: 'moody warm-lit portrait of a qawwali musician in traditional kurta-pajama with a fine shawl, sitting with harmonium or tabla, amber candlelight and diyas, atmospheric Sufi music photography' },
  { id: 'shalwar-classic',    category: 'traditional', name: 'Shalwar Kameez Classic',   thumb: P('rugged sophisticated portrait man crisp white shalwar kameez fine leather waistcoat, textured brick wall background, dramatic natural light, South Asian traditional fashion editorial', 1044), prompt: 'rugged sophisticated portrait of a man in crisp white shalwar kameez with a fine leather waistcoat, textured brick wall background, dramatic natural light, South Asian traditional fashion editorial' },
  { id: 'bandhgala-festive',  category: 'traditional', name: 'Festive Bandhgala',        thumb: P('sharp festive portrait model dark jewel-toned bandhgala suit, Diwali Eid string lights bokeh, warm celebratory traditional editorial photography', 1045), prompt: 'sharp modern-traditional portrait of a model in a dark jewel-toned bandhgala suit, surrounded by Diwali or Eid festive string lights and bokeh, warm celebratory editorial photography' },
  { id: 'bridal-zardosi',     category: 'traditional', name: 'Bridal Zardosi',           thumb: P('cinematic close-up portrait South Asian bride heavy zardosi embroidered lehenga traditional matha patti, shy downward gaze, warm golden backlight, luxury bridal photography', 1046), prompt: 'cinematic close-up portrait of a South Asian bride in heavy zardosi embroidered lehenga with traditional matha patti headpiece, shy downward gaze, warm golden backlight, luxury bridal photography' },
  { id: 'sufi-whirling',      category: 'traditional', name: 'Sufi Whirling',            thumb: P('dynamic atmospheric Sufi whirling dervish dancer flowing white traditional attire, motion blur spin, deep blue indigo atmospheric lighting, spiritual dance photography', 1047), prompt: 'dynamic atmospheric shot of a Sufi whirling dervish dancer in flowing white traditional attire, motion blur capturing the spin, deep blue and indigo atmospheric lighting, spiritual dance photography' },
  { id: 'phulkari-punjabi',   category: 'traditional', name: 'Phulkari & Kurta',         thumb: P('vibrant outdoor portrait bright Phulkari embroidery dupatta traditional Punjabi kurta, golden field backdrop, rich cultural embroidery textures, joyful lifestyle photography', 1048), prompt: 'vibrant outdoor rural-chic portrait featuring bright Phulkari embroidery dupatta and traditional Punjabi kurta, golden field backdrop, rich cultural embroidery textures, joyful lifestyle photography' },
  { id: 'mughal-miniature',   category: 'traditional', name: 'Mughal Miniature',         thumb: P('art-inspired portrait Mughal miniature painting style, ornate royal staging fine jewellery brocade fabrics, rich jewel-toned palette, heritage art photography', 1049), prompt: 'art-inspired portrait with lighting and composition inspired by Mughal miniature paintings, ornate royal staging, fine jewellery and brocade fabrics, rich jewel-toned palette, heritage art photography' },
  { id: 'indo-western',       category: 'traditional', name: 'Indo-Western Fusion',      thumb: P('contemporary ethnic fashion asymmetrical kurta structured blazer jacket combination, modern studio lighting, clean editorial, fusion South Asian contemporary style photography', 1050), prompt: 'contemporary ethnic fashion look with an asymmetrical kurta combined with a structured blazer jacket, modern studio lighting, clean editorial background, fusion fashion shoot, South Asian contemporary style' },

  /* ── TRAVEL (10) ── */
  { id: 'dubai-luxury',       category: 'travel',      name: 'Dubai Skyline Luxury',     thumb: P('sleek person on luxury rooftop balcony, Burj Khalifa towering in background, golden hour sunset glow Dubai skyline, aspirational luxury travel photography', 1051), prompt: 'sleek travel portrait of a person on a luxury glass balcony or rooftop, Burj Khalifa towering in background, golden hour sunset glow over Dubai skyline, aspirational luxury travel photography' },
  { id: 'paris-elegance',     category: 'travel',      name: 'Parisian Street Elegance', thumb: P('cinematic Paris shot classic Haussmann buildings misty morning Eiffel Tower, model chic beige trench coat, cobblestone street, romantic editorial travel photography', 1052), prompt: 'cinematic travel shot with classic Haussmann buildings and a misty morning view of the Eiffel Tower, model wearing a chic beige trench coat, cobblestone street, romantic Paris editorial travel photography' },
  { id: 'hill-station-mist',  category: 'travel',      name: 'Misty Hill Station',       thumb: P('atmospheric person in woollen scarf coat standing misty green hill station, rolling fog lush mountains, cozy monsoon mountain travel photography', 1053), prompt: 'atmospheric travel portrait of a person in a woollen scarf and coat standing in a misty green hill station, rolling fog over lush mountains, cozy monsoon mountain travel photography' },
  { id: 'santorini-dream',    category: 'travel',      name: 'Santorini Dream',          thumb: P('sunny Santorini whitewashed architecture iconic blue-domed church, sparkling Aegean Sea background, vibrant Mediterranean light, editorial travel photography', 1054), prompt: 'sunny Santorini travel shot with iconic whitewashed architecture and blue-domed churches, sparkling Aegean Sea background, vibrant Mediterranean light, editorial travel photography' },
  { id: 'kyoto-bamboo',       category: 'travel',      name: 'Kyoto Bamboo Forest',      thumb: P('peaceful Arashiyama bamboo grove Kyoto, tall green bamboo stalks dappled light, traditional stone pathway, serene Japanese travel photography', 1055), prompt: 'peaceful travel portrait in Arashiyama bamboo grove Kyoto, tall green bamboo stalks filtering soft dappled light, traditional stone pathway, serene Japanese travel photography' },
  { id: 'swiss-alps',         category: 'travel',      name: 'Swiss Alps Snow Peak',     thumb: P('snow-capped Swiss Alps mountain peaks, pine trees blanketed fresh snow, person cozy winter gear, crisp clean alpine photography', 1056), prompt: 'winter adventure travel aesthetic, snow-capped Swiss Alps mountain peaks, pine trees blanketed in fresh snow, person in cozy winter gear, crisp clean alpine photography' },
  { id: 'amalfi-terrace',     category: 'travel',      name: 'Amalfi Coast Terrace',     thumb: P('colorful cliffside Amalfi Coast houses, deep azure sea, lemon grove terrace, golden afternoon Mediterranean light, dreamy Italian coastal travel photography', 1057), prompt: 'Mediterranean travel vibe with colorful cliffside Amalfi Coast houses, deep azure sea, lemon grove terrace, golden afternoon light, dreamy Italian coastal travel photography' },
  { id: 'venice-canal',       category: 'travel',      name: 'Venetian Canal Romance',   thumb: P('atmospheric evening Venice, gondola gliding past historic arched bridge, warm glowing lanterns reflecting on water, moody romantic travel photography', 1058), prompt: 'atmospheric evening travel shot in Venice, gondola gliding past a historic arched bridge, warm glowing lanterns reflecting on water, moody romantic travel photography' },
  { id: 'kyoto-autumn',       category: 'travel',      name: 'Kyoto Autumn Maple',       thumb: P('vibrant Japanese Koyo autumn brilliant red orange maple leaves surrounding traditional wooden temple, warm autumn light, cultural travel photography', 1059), prompt: 'vibrant Japanese Koyo autumn travel shot, brilliant red and orange maple leaves surrounding a traditional wooden temple, warm autumn light, cultural travel photography' },
  { id: 'iceland-black-sand', category: 'travel',      name: 'Iceland Black Sand Beach', thumb: P('dramatic moody Iceland black volcanic sand beach massive basalt rock columns, dark brooding ocean waves, cinematic wide travel photography powerful natural drama', 1060), prompt: 'dramatic moody Iceland landscape, black volcanic sand beach with massive basalt rock columns, dark brooding ocean waves, cinematic wide travel photography, powerful natural drama' },

  /* ── PRODUCTS (10) ── */
  { id: 'skincare-flatlay',   category: 'products',    name: 'Botanical Skincare',       thumb: P('clean minimalist skincare flatlay white marble surface, organic glass bottles botanical labels, fresh green eucalyptus leaves jade facial roller, soft morning light, product photography', 1061), prompt: 'clean minimalist skincare product flatlay on white marble surface, organic glass bottles with botanical labels, fresh green eucalyptus leaves, jade facial roller, soft natural morning light, professional product photography' },
  { id: 'diya-mithai',        category: 'products',    name: 'Festive Mithai & Diya',    thumb: P('luxury Indian festival mithai sweet box on rich velvet fabric, marigold flowers glowing clay diyas, warm golden festive glow, editorial product photography', 1062), prompt: 'luxury Indian festival product shot, ornate sweet mithai box on rich velvet fabric with marigold flowers, glowing clay diyas arranged around, warm golden festive glow, editorial product photography' },
  { id: 'iced-coffee-splash', category: 'products',    name: 'Iced Coffee Splash',       thumb: P('dynamic tall iced latte glass swirling milk coffee, dramatic milk splash droplets frozen in motion, dark background, high-speed commercial beverage product photography', 1063), prompt: 'dynamic beverage product shot of a tall iced latte in a glass with swirling milk and coffee, dramatic milk splash droplets frozen in motion, dark background, high-speed commercial beverage photography' },
  { id: 'dark-perfume',       category: 'products',    name: 'Dark Luxury Perfume',      thumb: P('sleek moody black perfume bottle on dark textured volcanic stones, golden rim halo light from behind, deep shadow, high-end luxury commercial fragrance product photography', 1064), prompt: 'sleek moody luxury perfume bottle on dark textured volcanic stones, subtle golden rim light from behind creating dramatic halo, deep shadow, high-end commercial fragrance product photography' },
  { id: 'coffee-beans',       category: 'products',    name: 'Artisan Coffee Beans',     thumb: P('dark rustic wooden table freshly roasted coffee beans spilled, antique brass grinder, steaming espresso cup, rich earthy brown tones, moody artisan coffee product photography', 1065), prompt: 'dark rustic wooden table with freshly roasted coffee beans artfully spilled, antique brass coffee grinder, steaming espresso cup, rich earthy brown tones, moody artisan coffee product photography' },
  { id: 'luxury-watch',       category: 'products',    name: 'Luxury Watch & Leather',   thumb: P('matte black surface sleek executive luxury watch, folded premium leather wallet, fountain pen, sharp geometric shadows, professional minimalist corporate product photography', 1066), prompt: 'matte black surface product shot of a sleek executive luxury watch, folded premium leather wallet, and fountain pen, sharp geometric shadows, professional minimalist corporate product photography' },
  { id: 'honey-jar',          category: 'products',    name: 'Organic Honey & Dipper',   thumb: P('golden honey jar honey dripping wooden honeycomb dipper, fresh wildflowers, warm glowing sunlight, natural organic lifestyle product photography', 1067), prompt: 'golden-hued honey product shot of a glass honey jar with honey dripping from a wooden honeycomb dipper, fresh wildflowers arranged nearby, warm glowing sunlight, natural organic lifestyle product photography' },
  { id: 'clay-mask',          category: 'products',    name: 'Artisanal Clay Mask',      thumb: P('spa aesthetic earthy green clay mask in ceramic bowl, wooden application brush, fresh eucalyptus branch, white marble surface, clean natural beauty product photography', 1068), prompt: 'spa aesthetic product shot of earthy green clay mask in a ceramic bowl, wooden application brush, fresh eucalyptus branch, white marble surface, clean natural beauty product photography' },
  { id: 'tech-gadget',        category: 'products',    name: 'Tech Gadget Minimalist',   thumb: P('pastel matte studio backdrop sleek wireless headphones, clean geometric cast shadows, minimal composition, modern tech lifestyle product photography soft studio lighting', 1069), prompt: 'pastel matte studio backdrop product shot of sleek wireless headphones, clean geometric cast shadows, minimal composition, modern tech lifestyle product photography, soft studio lighting' },
  { id: 'citrus-splash',      category: 'products',    name: 'Citrus Refreshment',       thumb: P('bright vibrant citrus juice glass, sliced fresh oranges lemons, dramatic water splash droplets in motion, high-speed commercial photography, vivid summer colors', 1070), prompt: 'bright vibrant summer beverage product shot with citrus juice glass surrounded by sliced fresh oranges and lemons, dramatic water splash droplets in motion, high-speed commercial photography, vivid colors' },

  /* ── NATURE (10) ── */
  { id: 'golden-mountain',    category: 'nature',      name: 'Golden Hour Peak',         thumb: P('breathtaking golden hour mountain peak landscape, warm amber orange light painting snow-capped summits, dramatic cloud formations, National Geographic nature photography', 1071), prompt: 'breathtaking golden hour mountain peak landscape, warm amber and orange light painting the snow-capped summits, dramatic cloud formations, National Geographic quality nature photography' },
  { id: 'misty-waterfall',    category: 'nature',      name: 'Misty Waterfall Forest',   thumb: P('magical misty waterfall cascading lush tropical forest, soft diffused green light dense canopy, moss-covered rocks, serene nature photography', 1072), prompt: 'magical misty waterfall cascading through a lush tropical forest, soft diffused green light filtering through dense canopy, moss-covered rocks, serene nature photography' },
  { id: 'desert-dunes',       category: 'nature',      name: 'Desert Dunes at Sunrise',  thumb: P('sweeping golden sand dunes sunrise, long shadows dramatic wave patterns, vast silence minimalism, Sahara Arabian desert, cinematic landscape photography', 1073), prompt: 'sweeping golden sand dunes at sunrise, long shadows creating dramatic wave-like patterns, vast silence and minimalism, Sahara or Arabian desert, cinematic nature landscape photography' },
  { id: 'tropical-ocean',     category: 'nature',      name: 'Tropical Ocean Wave',      thumb: P('stunning turquoise tropical ocean wave crashing, crystal clear water sandy seafloor visible, vibrant blue teal tones, paradise beach, National Geographic ocean photography', 1074), prompt: 'stunning turquoise tropical ocean wave crashing, crystal clear water revealing sandy seafloor, vibrant blue and teal tones, paradise beach, National Geographic ocean photography' },
  { id: 'cherry-blossom',     category: 'nature',      name: 'Cherry Blossom Path',      thumb: P('dreamy sakura cherry blossom tunnel path Japan, pink petals falling, soft pastel pink light, romantic spring atmosphere, Japanese nature photography', 1075), prompt: 'dreamy sakura cherry blossom tunnel path in Japan, pink petals falling gently, soft pastel pink light, romantic spring atmosphere, Japanese nature travel photography' },
  { id: 'aurora-borealis',    category: 'nature',      name: 'Aurora Borealis',          thumb: P('spectacular northern lights aurora borealis dark Arctic sky, vivid green purple ribbons, starry sky reflection still lake, Iceland night nature photography', 1076), prompt: 'spectacular northern lights aurora borealis dancing across a dark Arctic sky, vivid green and purple ribbons of light, starry sky reflection on a still lake, Iceland night nature photography' },
  { id: 'autumn-forest',      category: 'nature',      name: 'Autumn Forest Carpet',     thumb: P('golden autumn forest thick carpet fallen red orange maple leaves, tall trees canopy of fire colors, misty morning light, peaceful fall nature photography', 1077), prompt: 'golden autumn forest with a thick carpet of fallen red and orange maple leaves, tall trees creating a canopy of fire colors, misty morning light, peaceful fall nature photography' },
  { id: 'monsoon-jungle',     category: 'nature',      name: 'Monsoon Tropical Rain',    thumb: P('lush monsoon tropical jungle heavy rain, vibrant emerald green vegetation glistening raindrops, dramatic rain curtain, moody atmospheric tropical nature photography', 1078), prompt: 'lush monsoon tropical jungle during heavy rain, vibrant emerald green vegetation glistening with raindrops, dramatic rain curtain, moody atmospheric tropical nature photography' },
  { id: 'snow-pine-forest',   category: 'nature',      name: 'Snow Pine Forest',         thumb: P('magical snow-covered pine forest winter, heavy white snow bending branches, silent peaceful atmosphere, soft blue-white winter light, fairy tale nature photography', 1079), prompt: 'magical snow-covered pine forest in winter, heavy white snow bending the branches, silent peaceful atmosphere, soft blue-white winter light, fairy tale winter nature photography' },
  { id: 'underwater-coral',   category: 'nature',      name: 'Underwater Coral Reef',    thumb: P('stunning underwater coral reef ecosystem, vibrant tropical fish swimming colorful coral formations, crystal clear blue water, sunlight rays from above, marine nature photography', 1080), prompt: 'stunning underwater coral reef ecosystem, vibrant tropical fish swimming through colorful coral formations, crystal clear blue water, sunlight rays piercing from above, marine nature photography' },
];

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

/* ── Template Card for marquee rows ── */
function TemplateCard({
  t,
  isActive,
  onClick,
}: {
  t: typeof VISUAL_TEMPLATES[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative shrink-0 overflow-hidden text-left"
      style={{
        width: 108,
        height: 148,
        borderRadius: 16,
        border: isActive ? '2px solid #f3b94b' : '1.5px solid rgba(0,0,0,0.09)',
        boxShadow: isActive
          ? '0 0 0 3px rgba(243,185,75,0.18), 0 8px 24px rgba(0,0,0,0.12)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        transform: 'perspective(600px)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        background: '#f0f0f0',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'perspective(600px) rotateY(-6deg) rotateX(3deg) translateY(-4px) scale(1.03)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'perspective(600px)';
        (e.currentTarget as HTMLElement).style.boxShadow = isActive
          ? '0 0 0 3px rgba(243,185,75,0.18), 0 8px 24px rgba(0,0,0,0.12)'
          : '0 4px 16px rgba(0,0,0,0.08)';
      }}
    >
      <img
        src={t.thumb}
        alt={t.name}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        loading="lazy"
      />
      {/* "Try this look" overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }}
      >
        <div className="px-2 pb-2.5 pt-8">
          <div
            className="flex items-center justify-center gap-1 rounded-full py-1 text-[10px] font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <span className="text-[9px]">✦</span> Try this look
          </div>
        </div>
      </div>
      {/* Name label always visible at bottom */}
      <span
        className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-8 text-[10px] font-semibold leading-tight text-white group-hover:opacity-0 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        {t.name}
      </span>
      {isActive && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow">✓</span>
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
  const [activeCatFilter, setActiveCatFilter] = useState('all');
  const [imageCount, setImageCount]           = useState(1);
  const shuffledAnime = useMemo(() => shuffleArray(ANIME_BOY_IMAGES), []);
  const [editTarget, setEditTarget]           = useState<GenImage | null>(null);
  const [editStyle, setEditStyle]             = useState('');
  const [editResolution, setEditResolution]   = useState('1:1');
  const [editAccessories, setEditAccessories] = useState<string[]>([]);
  const [editHistory, setEditHistory]         = useState<string[]>([]);
  const [isEditGenerating, setIsEditGenerating] = useState(false);
  const [lightboxImg, setLightboxImg]         = useState<GenImage | null>(null);

  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const uploadRef       = useRef<HTMLInputElement>(null);

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
            <section className="mt-9 sm:mt-11">
              <div className="mb-3 flex items-center justify-between px-0.5">
                <h3 className="text-[14px] font-bold tracking-[-0.02em] text-neutral-800 sm:text-[15px]">Templates</h3>
                <span className="text-[10px] font-medium text-neutral-400">
                  {activeCatFilter === 'all' ? VISUAL_TEMPLATES.length : VISUAL_TEMPLATES.filter(t => t.category === activeCatFilter).length} styles
                </span>
              </div>

              {/* Category filter pills */}
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {TEMPLATE_CATEGORIES.map(cat => (
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

              {/* Templates display */}
              {activeCatFilter === 'all' ? (
                /* ALL: one labeled marquee row per category so all 80 are browsable */
                <div className="flex flex-col gap-5">
                  {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map((cat, i) => {
                    const catTemplates = VISUAL_TEMPLATES.filter(t => t.category === cat.id);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-1.5 mb-2 px-0.5">
                          <span className="text-sm leading-none">{cat.emoji}</span>
                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{cat.label}</span>
                          <button
                            onClick={() => setActiveCatFilter(cat.id)}
                            className="ml-auto text-[10px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                          >
                            See all →
                          </button>
                        </div>
                        <MarqueeRow
                          templates={catTemplates}
                          direction={i % 2 === 0 ? 'left' : 'right'}
                          activeId={activeVisualId}
                          onSelect={handleTemplateSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SPECIFIC CATEGORY: 2 marquee rows */
                (() => {
                  const filtered = VISUAL_TEMPLATES.filter(t => t.category === activeCatFilter);
                  const mid = Math.ceil(filtered.length / 2);
                  return (
                    <div className="flex flex-col gap-2.5">
                      <MarqueeRow templates={filtered.slice(0, mid)} direction="left"  activeId={activeVisualId} onSelect={handleTemplateSelect} />
                      <MarqueeRow templates={filtered.slice(mid)}    direction="right" activeId={activeVisualId} onSelect={handleTemplateSelect} />
                    </div>
                  );
                })()
              )}
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
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
