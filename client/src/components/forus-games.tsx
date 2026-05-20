import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, BookOpen, Gamepad2, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'menu' | 'maths' | 'word' | 'memory' | 'quiz' | 'leaderboard' | 'car' | 'oddword';
type Level = 'easy' | 'medium' | 'hard';

interface LeaderboardEntry { name: string; score: number; date: string; level: string; }
interface AllLeaderboards { maths: LeaderboardEntry[]; word: LeaderboardEntry[]; memory: LeaderboardEntry[]; quiz: LeaderboardEntry[]; car: LeaderboardEntry[]; oddword: LeaderboardEntry[]; }

// ─── Leaderboard helpers ──────────────────────────────────────────────────────
const LB_KEY = 'forus_games_leaderboard_v2';
function loadLeaderboard(): AllLeaderboards {
  try { const raw = localStorage.getItem(LB_KEY); if (raw) { const d = JSON.parse(raw); return { car: [], oddword: [], ...d }; } } catch {}
  return { maths: [], word: [], memory: [], quiz: [], car: [], oddword: [] };
}
function saveScore(game: keyof AllLeaderboards, entry: LeaderboardEntry) {
  const lb = loadLeaderboard();
  lb[game] = [...lb[game], entry].sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

// ─── Word Data (large pools so each play picks a fresh random subset) ─────────
const WORD_EASY = [
  { word: 'STAR', hint: 'Shines at night' }, { word: 'BIRD', hint: 'Has wings and feathers' },
  { word: 'FISH', hint: 'Lives in water' }, { word: 'CAKE', hint: 'Sweet baked dessert' },
  { word: 'MOON', hint: "Earth's natural satellite" }, { word: 'RAIN', hint: 'Water from clouds' },
  { word: 'BOAT', hint: 'Floats on water' }, { word: 'TREE', hint: 'Tall plant with a trunk' },
  { word: 'LAMP', hint: 'Gives light' }, { word: 'BOOK', hint: 'Has pages to read' },
  { word: 'FROG', hint: 'Green, lives near ponds' }, { word: 'DRUM', hint: 'Percussion instrument' },
  { word: 'KITE', hint: 'Flies in the wind' }, { word: 'SHIP', hint: 'Large sea vessel' },
  { word: 'WOLF', hint: 'Wild dog of the forest' }, { word: 'BELL', hint: 'Rings to make sound' },
  { word: 'CRAB', hint: 'Sideways-walking sea creature' }, { word: 'DUCK', hint: 'Says "Quack"' },
  { word: 'FIRE', hint: 'Hot and glowing' }, { word: 'GOLD', hint: 'Precious yellow metal' },
  { word: 'HIVE', hint: 'Where bees live' }, { word: 'IRON', hint: 'Strong grey metal' },
  { word: 'JADE', hint: 'Green gemstone' }, { word: 'KING', hint: 'Rules a kingdom' },
  { word: 'LEAF', hint: 'Green part of a plant' },
];
const WORD_MEDIUM = [
  { word: 'PLANET', hint: 'Orbits a star' }, { word: 'BRIDGE', hint: 'Connects two sides over water' },
  { word: 'JUNGLE', hint: 'Dense tropical forest' }, { word: 'CASTLE', hint: 'Medieval royal fortress' },
  { word: 'ROCKET', hint: 'Vehicle that reaches space' }, { word: 'VIOLIN', hint: 'Stringed instrument' },
  { word: 'CACTUS', hint: 'Desert plant with spines' }, { word: 'GARDEN', hint: 'Where flowers grow' },
  { word: 'MONKEY', hint: 'Primate in the trees' }, { word: 'PARROT', hint: 'Colourful talking bird' },
  { word: 'FOREST', hint: 'Large area of trees' }, { word: 'SILVER', hint: 'Precious grey metal' },
  { word: 'CAMERA', hint: 'Takes photographs' }, { word: 'DANGER', hint: 'Risk or threat' },
  { word: 'ENGINE', hint: 'Powers a machine' }, { word: 'FABRIC', hint: 'Woven cloth material' },
  { word: 'HARBOR', hint: 'Safe port for ships' }, { word: 'INSECT', hint: 'Small six-legged creature' },
  { word: 'JIGSAW', hint: 'Puzzle with interlocking pieces' }, { word: 'KNIGHT', hint: 'Armoured medieval warrior' },
  { word: 'LEMON', hint: 'Sour yellow citrus fruit' }, { word: 'MANGO', hint: 'Sweet tropical fruit' },
  { word: 'NEEDLE', hint: 'Used for sewing' }, { word: 'ORANGE', hint: 'Citrus fruit, also a colour' },
  { word: 'PEPPER', hint: 'Spice used in cooking' },
];
const WORD_HARD = [
  { word: 'DOLPHIN', hint: 'Smart ocean mammal' }, { word: 'LANTERN', hint: 'Portable light in a case' },
  { word: 'KESTREL', hint: 'Small hovering falcon' }, { word: 'ENIGMA', hint: 'A mystery or puzzle' },
  { word: 'COBALT', hint: 'Bright blue element' }, { word: 'BONSAI', hint: 'Miniature cultivated tree' },
  { word: 'ZIPPER', hint: 'Fastener on clothing' }, { word: 'QUARTZ', hint: 'Common mineral' },
  { word: 'WALRUS', hint: 'Marine mammal with tusks' }, { word: 'GOBLIN', hint: 'Mischievous folklore creature' },
  { word: 'CREVICE', hint: 'Narrow crack in rock' }, { word: 'DYNASTY', hint: 'Ruling family line' },
  { word: 'ECLIPSE', hint: 'Moon blocks the sun' }, { word: 'FREIGHT', hint: 'Goods transported by vehicle' },
  { word: 'GLACIER', hint: 'Slow-moving mass of ice' }, { word: 'HORIZON', hint: 'Line where sky meets earth' },
  { word: 'INKWELL', hint: 'Container for writing ink' }, { word: 'JAVELIN', hint: 'Spear thrown in athletics' },
  { word: 'KNUCKLE', hint: 'Joint of a finger' }, { word: 'LABYRINTH', hint: 'A complex maze' },
  { word: 'MIRAGE', hint: 'Desert optical illusion' }, { word: 'NOSTRIL', hint: 'Opening of the nose' },
  { word: 'OBSCURE', hint: 'Not well known' }, { word: 'PHANTOM', hint: 'A ghost or apparition' },
  { word: 'QUARREL', hint: 'An angry disagreement' },
];

// ─── Quiz Data (large pools — random subsets differ each play) ────────────────
const QUIZ_EASY = [
  { q: 'What colour is the sky?', options: ['Red', 'Blue', 'Green', 'Yellow'], answer: 1 },
  { q: 'How many days are in a week?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'What animal says "Moo"?', options: ['Dog', 'Cat', 'Cow', 'Pig'], answer: 2 },
  { q: 'How many fingers on one hand?', options: ['4', '5', '6', '7'], answer: 1 },
  { q: 'What shape has 3 sides?', options: ['Square', 'Circle', 'Triangle', 'Rectangle'], answer: 2 },
  { q: 'What do bees make?', options: ['Milk', 'Honey', 'Butter', 'Juice'], answer: 1 },
  { q: 'What colour is grass?', options: ['Blue', 'Red', 'Yellow', 'Green'], answer: 3 },
  { q: 'Which fruit is red and round?', options: ['Banana', 'Apple', 'Orange', 'Grape'], answer: 1 },
  { q: 'How many legs does a spider have?', options: ['4', '6', '8', '10'], answer: 2 },
  { q: 'What do you use to write on a blackboard?', options: ['Pen', 'Crayon', 'Chalk', 'Marker'], answer: 2 },
  { q: 'What is the opposite of hot?', options: ['Warm', 'Cold', 'Cool', 'Mild'], answer: 1 },
  { q: 'Which animal is the largest?', options: ['Dog', 'Cat', 'Elephant', 'Horse'], answer: 2 },
  { q: 'What do you wear on your feet?', options: ['Gloves', 'Hat', 'Shoes', 'Scarf'], answer: 2 },
  { q: 'What colour is snow?', options: ['Blue', 'White', 'Grey', 'Yellow'], answer: 1 },
  { q: 'What do fish live in?', options: ['Land', 'Trees', 'Water', 'Air'], answer: 2 },
  { q: 'How many months are in a year?', options: ['10', '11', '12', '13'], answer: 2 },
  { q: 'What gives us light during the day?', options: ['Moon', 'Stars', 'Sun', 'Lamp'], answer: 2 },
  { q: 'Which season is the hottest?', options: ['Spring', 'Summer', 'Autumn', 'Winter'], answer: 1 },
  { q: 'What sound does a cat make?', options: ['Bark', 'Moo', 'Meow', 'Cluck'], answer: 2 },
  { q: 'How many sides does a square have?', options: ['3', '4', '5', '6'], answer: 1 },
];
const QUIZ_MEDIUM = [
  { q: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], answer: 2 },
  { q: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], answer: 1 },
  { q: 'Who painted the Mona Lisa?', options: ['Picasso', 'Rembrandt', 'Da Vinci', 'Van Gogh'], answer: 2 },
  { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], answer: 1 },
  { q: 'What is the boiling point of water (°C)?', options: ['90', '95', '100', '105'], answer: 2 },
  { q: 'Which planet is the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
  { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { q: 'What is the capital of Japan?', options: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'], answer: 2 },
  { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'Which gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 2 },
  { q: 'Who invented the telephone?', options: ['Edison', 'Bell', 'Tesla', 'Marconi'], answer: 1 },
  { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'], answer: 3 },
  { q: 'What is the largest planet in our solar system?', options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'], answer: 2 },
  { q: 'In which year did the first Moon landing happen?', options: ['1965', '1967', '1969', '1971'], answer: 2 },
  { q: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Quartz'], answer: 2 },
  { q: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '7'], answer: 2 },
  { q: 'What country is the Amazon rainforest mostly in?', options: ['Colombia', 'Peru', 'Brazil', 'Bolivia'], answer: 2 },
  { q: 'Who is the author of Harry Potter?', options: ['Tolkien', 'Rowling', 'Lewis', 'Dahl'], answer: 1 },
  { q: 'What is the smallest planet in our solar system?', options: ['Mercury', 'Mars', 'Venus', 'Pluto'], answer: 0 },
  { q: 'What does DNA stand for?', options: ['Digital Nucleic Acid', 'Deoxyribonucleic Acid', 'Dynamic Nucleic Acid', 'Dual Nucleic Arrangement'], answer: 1 },
  { q: 'Which country has the longest coastline?', options: ['Russia', 'Australia', 'Canada', 'USA'], answer: 2 },
  { q: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], answer: 2 },
];
const QUIZ_HARD = [
  { q: 'What is the square root of 196?', options: ['12', '13', '14', '15'], answer: 2 },
  { q: 'Which element has atomic number 79?', options: ['Silver', 'Gold', 'Platinum', 'Copper'], answer: 1 },
  { q: 'In which year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], answer: 2 },
  { q: 'Who developed the theory of relativity?', options: ['Newton', 'Bohr', 'Einstein', 'Curie'], answer: 2 },
  { q: 'How many bones in the adult human body?', options: ['196', '206', '216', '226'], answer: 1 },
  { q: 'What is the longest river in the world?', options: ['Amazon', 'Congo', 'Nile', 'Yangtze'], answer: 2 },
  { q: 'Which gas makes up ~78% of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Argon', 'Nitrogen'], answer: 3 },
  { q: 'Who wrote "Crime and Punishment"?', options: ['Tolstoy', 'Chekhov', 'Dostoyevsky', 'Turgenev'], answer: 2 },
  { q: 'What is the speed of light (km/s)?', options: ['200,000', '250,000', '300,000', '350,000'], answer: 2 },
  { q: 'Which country has the most natural lakes?', options: ['Russia', 'USA', 'Canada', 'Brazil'], answer: 2 },
  { q: 'In what century was Shakespeare born?', options: ['15th', '16th', '17th', '18th'], answer: 0 },
  { q: 'What is the Fibonacci sequence\'s 10th number?', options: ['34', '55', '89', '144'], answer: 1 },
  { q: 'What is the chemical formula for table salt?', options: ['KCl', 'NaCl', 'CaCO3', 'MgSO4'], answer: 1 },
  { q: 'Who was the first female Nobel Prize winner?', options: ['Rosalind Franklin', 'Marie Curie', 'Lise Meitner', 'Dorothy Hodgkin'], answer: 1 },
  { q: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'], answer: 2 },
  { q: 'Which treaty ended World War I?', options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Ghent', 'Treaty of Utrecht'], answer: 1 },
  { q: 'What is the half-life of Carbon-14 (approx)?', options: ['1,000 years', '5,730 years', '10,000 years', '50,000 years'], answer: 1 },
  { q: 'Which ancient wonder was located in Alexandria?', options: ['Colossus', 'Mausoleum', 'Lighthouse', 'Hanging Gardens'], answer: 2 },
  { q: 'What is the integral of cos(x)?', options: ['-sin(x)', 'sin(x)', 'tan(x)', '-cos(x)'], answer: 1 },
  { q: 'Who proposed the heliocentric model of the solar system?', options: ['Galileo', 'Kepler', 'Copernicus', 'Brahe'], answer: 2 },
  { q: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], answer: 1 },
  { q: 'In chemistry, what does pH measure?', options: ['Pressure', 'Acidity/Alkalinity', 'Temperature', 'Density'], answer: 1 },
  { q: 'What is the rarest blood type?', options: ['AB-', 'O-', 'B-', 'A-'], answer: 0 },
  { q: 'Who composed "The Four Seasons"?', options: ['Bach', 'Mozart', 'Vivaldi', 'Beethoven'], answer: 2 },
  { q: 'What is the atomic mass of carbon?', options: ['6', '12', '14', '16'], answer: 1 },
];

// ─── Odd Word Data ─────────────────────────────────────────────────────────────
interface OddWordQ { text: string; words: string[]; wrongIdx: number; fix: string; }
const ODD_EASY: OddWordQ[] = [
  { text: "Elephants are the smallest land animals on Earth", words: ["Elephants","smallest","land","Earth"], wrongIdx: 1, fix: "Elephants are the LARGEST land animals." },
  { text: "Water boils at 0 degrees Celsius at sea level", words: ["Water","boils","0","Celsius"], wrongIdx: 2, fix: "Water boils at 100°C — it FREEZES at 0°C." },
  { text: "The Earth takes 365 days to orbit the Moon", words: ["365","orbit","Moon","days"], wrongIdx: 2, fix: "Earth orbits the SUN, not the Moon." },
  { text: "Dogs are reptiles that make great household pets", words: ["Dogs","reptiles","household","pets"], wrongIdx: 1, fix: "Dogs are MAMMALS, not reptiles." },
  { text: "Spiders have six legs and spin silk webs", words: ["Spiders","six","silk","webs"], wrongIdx: 1, fix: "Spiders have EIGHT legs — they are arachnids, not insects." },
  { text: "The capital of Australia is Sydney", words: ["capital","Australia","Sydney","is"], wrongIdx: 2, fix: "Australia's capital is Canberra, not Sydney." },
  { text: "Penguins live in the Arctic alongside polar bears", words: ["Penguins","Arctic","polar bears","live"], wrongIdx: 1, fix: "Penguins live in the ANTARCTIC (South Pole)." },
  { text: "The Sun is a planet at the centre of our solar system", words: ["Sun","planet","centre","solar system"], wrongIdx: 1, fix: "The Sun is a STAR, not a planet." },
  { text: "Humans have 206 muscles in their skeleton", words: ["206","muscles","skeleton","Humans"], wrongIdx: 1, fix: "Humans have 206 BONES — we have over 600 muscles." },
  { text: "Sharks are mammals that breathe using gills", words: ["Sharks","mammals","breathe","gills"], wrongIdx: 1, fix: "Sharks are FISH, not mammals." },
  { text: "The Moon produces its own light and orbits Earth", words: ["Moon","produces","light","orbits"], wrongIdx: 1, fix: "The Moon reflects sunlight — it produces no light of its own." },
  { text: "Rainbows always appear in the direction of the Sun", words: ["Rainbows","always","direction","Sun"], wrongIdx: 3, fix: "Rainbows appear OPPOSITE the Sun — you must face away from it." },
];
const ODD_MEDIUM: OddWordQ[] = [
  { text: "Isaac Newton discovered gravity after an orange fell on his head", words: ["gravity","orange","fell","head"], wrongIdx: 1, fix: "The famous story involves an APPLE, not an orange." },
  { text: "The chemical symbol for gold is Ag on the periodic table", words: ["gold","Ag","periodic","table"], wrongIdx: 1, fix: "Gold's symbol is AU (from Latin Aurum), not Ag (that's Silver)." },
  { text: "Shakespeare was born in London in the 16th century", words: ["Shakespeare","London","16th","century"], wrongIdx: 1, fix: "Shakespeare was born in Stratford-upon-Avon, not London." },
  { text: "The Pacific is the smallest ocean on Earth by area", words: ["Pacific","smallest","ocean","area"], wrongIdx: 1, fix: "The Pacific is the LARGEST ocean — the smallest is the Arctic Ocean." },
  { text: "Mount Everest is the tallest mountain located in Africa", words: ["Everest","tallest","mountain","Africa"], wrongIdx: 3, fix: "Everest is located on the Nepal–Tibet border in ASIA." },
  { text: "DNA stores genetic information in a single-stranded helix structure", words: ["DNA","genetic","single-stranded","helix"], wrongIdx: 2, fix: "DNA has a DOUBLE-stranded helix — two strands wound together." },
  { text: "Sound travels faster than light in a vacuum", words: ["Sound","faster","light","vacuum"], wrongIdx: 0, fix: "Light travels faster — sound cannot travel through a vacuum at all." },
  { text: "The Great Wall of China is clearly visible from the Moon", words: ["Great Wall","clearly visible","Moon","China"], wrongIdx: 1, fix: "This is a myth — the Wall is far too narrow to see from the Moon." },
  { text: "Humans use only 10 percent of their brain at any time", words: ["Humans","10 percent","brain","time"], wrongIdx: 1, fix: "This is a myth — brain scans show virtually all areas are active." },
  { text: "Albert Einstein failed mathematics at school as a child", words: ["Einstein","failed","mathematics","school"], wrongIdx: 2, fix: "Einstein excelled at mathematics — he failed a French-language entrance exam, not maths." },
  { text: "Napoleon Bonaparte was unusually short for his era", words: ["Napoleon","unusually short","era","Bonaparte"], wrongIdx: 1, fix: "Napoleon was about 5'7\" — average height for his time. The 'short' myth came from British propaganda." },
  { text: "Oxygen makes up about 78 percent of Earth's atmosphere", words: ["Oxygen","78 percent","Earth's","atmosphere"], wrongIdx: 0, fix: "NITROGEN makes up ~78% of the atmosphere. Oxygen is about 21%." },
];
const ODD_HARD: OddWordQ[] = [
  { text: "The mitochondria produce ATP through a process called photosynthesis", words: ["mitochondria","ATP","photosynthesis","produce"], wrongIdx: 2, fix: "Mitochondria produce ATP via CELLULAR RESPIRATION, not photosynthesis (that's in chloroplasts)." },
  { text: "The French Revolution began in 1789 under King Louis XV", words: ["1789","Revolution","Louis XV","France"], wrongIdx: 2, fix: "The French Revolution occurred under LOUIS XVI, not XV." },
  { text: "The Coriolis effect makes hurricanes spin clockwise in the Northern Hemisphere", words: ["Coriolis","hurricanes","clockwise","Northern"], wrongIdx: 2, fix: "In the Northern Hemisphere hurricanes spin COUNTER-CLOCKWISE (clockwise in the South)." },
  { text: "Penicillin was accidentally discovered by Louis Pasteur in 1928", words: ["Penicillin","accidentally","Louis Pasteur","1928"], wrongIdx: 2, fix: "Penicillin was discovered by ALEXANDER FLEMING — Pasteur pioneered germ theory." },
  { text: "The speed of light in a vacuum is approximately 300 miles per second", words: ["light","vacuum","300","miles"], wrongIdx: 3, fix: "Light travels ~300,000 KILOMETRES per second (not miles, and not just 300)." },
  { text: "In quantum mechanics, Heisenberg's principle limits our knowledge of momentum and temperature simultaneously", words: ["Heisenberg's","momentum","temperature","simultaneously"], wrongIdx: 2, fix: "The uncertainty principle applies to POSITION and momentum — not temperature." },
  { text: "The Treaty of Westphalia in 1848 ended the Thirty Years' War", words: ["Westphalia","1848","Thirty Years'","ended"], wrongIdx: 1, fix: "The Treaty of Westphalia was signed in 1648, not 1848." },
  { text: "Schrödinger proposed his famous cat paradox to support quantum superposition", words: ["Schrödinger","support","cat paradox","quantum"], wrongIdx: 1, fix: "Schrödinger devised the paradox to CRITIQUE and highlight absurdities in quantum superposition theory." },
  { text: "The human genome contains approximately 3 billion base pairs encoding 2 million genes", words: ["3 billion","base pairs","2 million","genes"], wrongIdx: 2, fix: "The human genome has ~20,000–25,000 protein-coding genes, not 2 million." },
  { text: "Nikola Tesla invented the telephone and was awarded the Nobel Prize in 1909", words: ["Tesla","telephone","Nobel Prize","1909"], wrongIdx: 1, fix: "The telephone was invented by Alexander Graham Bell — Tesla pioneered AC electricity and radio." },
];

// ─── Memory Emojis (larger pool, pick fresh subset each game) ─────────────────
const ALL_EMOJIS = ['🦁','🐬','🦊','🐸','🦋','🌺','⚡','🎸','🍕','🚀','🎯','🌈','🐙','🎃','🏆','🦄','🍀','🎭','🔮','🎪'];
const EMOJIS_EASY_COUNT   = 6;
const EMOJIS_MEDIUM_COUNT = 8;
const EMOJIS_HARD_COUNT   = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function scramble(word: string): string {
  let s = word.split('');
  do { s = shuffleArray(s); } while (s.join('') === word);
  return s.join('');
}
function medal(i: number) { return ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`; }
function filterByTime(entries: LeaderboardEntry[], filter: string): LeaderboardEntry[] {
  if (filter === 'All Time') return entries;
  const now = new Date();
  const cutoff = new Date(now);
  if (filter === 'Day') cutoff.setDate(now.getDate() - 1);
  else if (filter === 'Week') cutoff.setDate(now.getDate() - 7);
  else if (filter === 'Month') cutoff.setMonth(now.getMonth() - 1);
  return entries.filter(e => { const d = new Date(e.date); return !isNaN(d.getTime()) && d >= cutoff; });
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Level Config ─────────────────────────────────────────────────────────────
const LEVELS: { id: Level; label: string; emoji: string; color: string }[] = [
  { id: 'easy',   label: 'Easy',   emoji: '🌱', color: 'from-green-400 to-emerald-500' },
  { id: 'medium', label: 'Medium', emoji: '⚡', color: 'from-yellow-400 to-orange-500' },
  { id: 'hard',   label: 'Hard',   emoji: '🔥', color: 'from-red-500 to-pink-600'     },
];

// ─── Shared Timer Bar ─────────────────────────────────────────────────────────
function TimerBar({ timeLeft, total, danger }: { timeLeft: number; total: number; danger?: boolean }) {
  const pct = (timeLeft / total) * 100;
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${danger || pct <= 30 ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <div className={`text-xs font-bold px-3 py-1 rounded-full ${red ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white/80'}`}>
      {children}
    </div>
  );
}

// ─── Level Select ─────────────────────────────────────────────────────────────
function LevelSelect({ game, icon, onSelect, onBack }: { game: string; icon: ReactNode; onSelect: (l: Level) => void; onBack: () => void }) {
  const descs: Record<Level, string> = {
    easy:   'Simple challenges, relaxed pace.',
    medium: 'Balanced — a real test of skill!',
    hard:   'Fast, complex, unforgiving. 🔥',
  };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-24 h-24 flex items-center justify-center mb-4">{icon}</div>
      <h2 className="text-2xl font-extrabold mb-1 text-white">{game}</h2>
      <p className="text-zinc-400 text-sm mb-6">Choose your difficulty · 10 seconds per turn</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-5">
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => onSelect(l.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${l.color} text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200`}>
            <span className="text-3xl">{l.emoji}</span>
            <span className="text-sm">{l.label}</span>
            <span className="text-[10px] font-normal opacity-80 leading-tight">{descs[l.id]}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← Back to menu</button>
    </div>
  );
}

// ─── Score Save Modal ─────────────────────────────────────────────────────────
function ScoreSaveModal({ score, game, level, playerName, onSave, onSkip }: {
  score: number; game: keyof AllLeaderboards; level: Level; playerName: string;
  onSave: (name: string) => void; onSkip: () => void;
}) {
  const [name, setName] = useState(playerName || '');
  const lv = LEVELS.find(l => l.id === level)!;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-white mb-1">Game Over!</h3>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji} {lv.label}</span>
        </div>
        <p className="text-zinc-400 text-sm mb-4">Your score: <span className="text-white font-bold text-lg">{score}</span></p>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Enter your name" maxLength={20}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        <div className="flex gap-2">
          <Button onClick={() => onSave(name || 'Anonymous')} className="flex-1" size="sm">Save Score</Button>
          <Button onClick={onSkip} variant="outline" className="flex-1" size="sm">Skip</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Panel ────────────────────────────────────────────────────────
function LeaderboardPanel({ onBack }: { onBack: () => void }) {
  const lb = loadLeaderboard();
  const games: { id: keyof AllLeaderboards; label: string; grad: string }[] = [
    { id: 'maths',  label: '🔢 Forus Maths',  grad: 'from-blue-500 to-cyan-500' },
    { id: 'word',   label: '🔤 Forus Word',   grad: 'from-green-500 to-emerald-500' },
    { id: 'memory', label: '🃏 Forus Memory', grad: 'from-purple-500 to-pink-500' },
    { id: 'quiz',   label: '🧠 Forus Quiz',   grad: 'from-orange-500 to-red-500' },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <h2 className="text-xl font-bold text-white">🏆 Leaderboard</h2>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map(g => (
          <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${g.grad} px-4 py-3`}>
              <h3 className="font-bold text-white text-sm">{g.label}</h3>
            </div>
            <div className="p-3 space-y-2">
              {lb[g.id].slice(0, 3).length === 0 && <p className="text-zinc-500 text-xs text-center py-3">No scores yet — be the first!</p>}
              {lb[g.id].slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medal(i)}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{e.name}</div>
                      <div className="text-[10px] text-zinc-500">{e.level ? `${e.level} · ` : ''}{fmtDate(e.date)}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white">{e.score}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FORUS MATHS (10s per question) ──────────────────────────────────────────
const Q_TIME = 10;

function ForusMaths({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const cfg = { easy: { maxA: 20, maxB: 20, ops: ['+', '-'] }, medium: { maxA: 50, maxB: 50, ops: ['+', '-', '×', '÷'] }, hard: { maxA: 100, maxB: 100, ops: ['+', '-', '×', '÷'] } }[level];
  const ROUNDS = { easy: 8, medium: 10, hard: 12 }[level];
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState({ text: '', correct: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lv = LEVELS.find(l => l.id === level)!;

  const newQuestion = useCallback(() => {
    const op = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
    let a: number, b: number, correct: number;
    if (op === '+') { a = Math.floor(Math.random() * cfg.maxA) + 1; b = Math.floor(Math.random() * cfg.maxB) + 1; correct = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * cfg.maxA) + 10; b = Math.floor(Math.random() * a); correct = a - b; }
    else if (op === '×') { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; correct = a * b; }
    else { a = Math.floor(Math.random() * 10) + 1; b = a * (Math.floor(Math.random() * 10) + 1); correct = b / a; [a, b] = [b, a]; }
    setQuestion({ text: `${a} ${op} ${b} = ?`, correct });
    setAnswer('');
    setTimeLeft(Q_TIME);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cfg]);

  useEffect(() => { newQuestion(); }, []);

  useEffect(() => {
    if (gameOver || feedback) return;
    if (timeLeft === 0) { handleTimeout(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver, feedback]);

  const handleTimeout = () => {
    setStreak(0);
    setFeedback('timeout');
    advanceRound();
  };

  const advanceRound = () => {
    setTimeout(() => {
      setFeedback(null);
      const next = round + 1;
      if (next >= ROUNDS) { setGameOver(true); setShowSave(true); }
      else { setRound(next); newQuestion(); }
    }, 900);
  };

  const submit = () => {
    if (feedback) return;
    const val = parseInt(answer);
    if (isNaN(val)) return;
    if (val === question.correct) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(newStreak);
      setFeedback('correct');
    } else { setStreak(0); setFeedback('wrong'); }
    advanceRound();
  };

  const handleSave = (name: string) => { saveScore('maths', { name, score, date: new Date().toISOString(), level: lv.label }); setShowSave(false); };

  const restart = () => { setScore(0); setRound(0); setStreak(0); setGameOver(false); setShowSave(false); setFeedback(null); newQuestion(); };

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="maths" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          {streak >= 3 && <StatPill>🔥 {streak}x</StatPill>}
          <StatPill>Q {Math.min(round + 1, ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-2">Finished!</h3>
            <p className="text-zinc-400 mb-4">Final Score: <span className="font-bold text-white text-xl">{score}</span> / {ROUNDS * 10}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={restart}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-8 rounded-2xl border-2 mb-5 transition-all duration-200 ${feedback === 'correct' ? 'border-green-400 bg-green-500/10' : feedback === 'wrong' || feedback === 'timeout' ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
              <p className="text-4xl font-bold text-white">{question.text}</p>
              {feedback === 'correct' && <p className="text-green-400 text-sm mt-2">✓ Correct! {streak >= 3 ? '+15' : '+10'} pts</p>}
              {feedback === 'wrong' && <p className="text-red-400 text-sm mt-2">✗ Answer was {question.correct}</p>}
              {feedback === 'timeout' && <p className="text-orange-400 text-sm mt-2">⏱ Time up! Answer was {question.correct}</p>}
            </div>
            <div className="flex gap-2">
              <input ref={inputRef} type="number" value={answer} onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your answer..."
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!!feedback} />
              <Button onClick={submit} size="lg" className="px-6 bg-blue-500 hover:bg-blue-600" disabled={!!feedback}>Go</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS WORD (10s per word) ────────────────────────────────────────────────
function ForusWord({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const ROUNDS = 8;
  const wordList = { easy: WORD_EASY, medium: WORD_MEDIUM, hard: WORD_HARD }[level];
  const noHints = level === 'hard';
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [words, setWords] = useState<typeof WORD_MEDIUM>([]);
  const [scrambled, setScrambled] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const inputRef = useRef<HTMLInputElement>(null);
  const lv = LEVELS.find(l => l.id === level)!;
  const letterColors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500'];

  useEffect(() => {
    const picked = shuffleArray(wordList).slice(0, ROUNDS);
    setWords(picked);
    setScrambled(scramble(picked[0].word));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (gameOver || feedback || !words.length) return;
    if (timeLeft === 0) { handleTimeout(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver, feedback, words]);

  const handleTimeout = () => { setFeedback('timeout'); advanceRound(); };

  const advanceRound = () => {
    setTimeout(() => {
      setFeedback(null); setShowHint(false); setAnswer('');
      const next = round + 1;
      if (next >= ROUNDS) { setGameOver(true); setShowSave(true); }
      else { setRound(next); setScrambled(scramble(words[next].word)); setTimeLeft(Q_TIME); setTimeout(() => inputRef.current?.focus(), 50); }
    }, 1000);
  };

  const submit = () => {
    if (feedback) return;
    const w = words[round];
    if (!w) return;
    const correct = answer.toUpperCase().trim() === w.word;
    if (correct) setScore(s => s + (showHint ? 5 : 10));
    setFeedback(correct ? 'correct' : 'wrong');
    advanceRound();
  };

  const handleSave = (name: string) => { saveScore('word', { name, score, date: new Date().toISOString(), level: lv.label }); setShowSave(false); };

  const restart = () => {
    const p = shuffleArray(wordList).slice(0, ROUNDS);
    setWords(p); setScrambled(scramble(p[0].word)); setRound(0); setScore(0);
    setGameOver(false); setShowSave(false); setFeedback(null); setShowHint(false); setAnswer(''); setTimeLeft(Q_TIME);
  };

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="word" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>Word {Math.min(round + 1, ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-white mb-2">Well Done!</h3>
            <p className="text-zinc-400 mb-4">Final Score: <span className="font-bold text-white text-xl">{score}</span> / {ROUNDS * 10}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={restart}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-6 rounded-2xl border-2 mb-5 transition-all ${feedback === 'correct' ? 'border-green-400 bg-green-500/10' : feedback === 'wrong' || feedback === 'timeout' ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs text-zinc-400 mb-3 uppercase tracking-widest">Unscramble this word</p>
              <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
                {scrambled.split('').map((l, i) => (
                  <div key={i} className={`w-10 h-10 ${letterColors[i % letterColors.length]} rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-lg`}>{l}</div>
                ))}
              </div>
              {showHint && <p className="text-xs text-zinc-400 italic mb-1">💡 {words[round]?.hint}</p>}
              {feedback === 'correct' && <p className="text-green-400 text-sm">✓ +{showHint ? 5 : 10} pts!</p>}
              {feedback === 'wrong' && <p className="text-red-400 text-sm">✗ Was: <b>{words[round]?.word}</b></p>}
              {feedback === 'timeout' && <p className="text-orange-400 text-sm">⏱ Time up! Was: <b>{words[round]?.word}</b></p>}
            </div>
            <div className="flex gap-2 mb-2">
              <input ref={inputRef} type="text" value={answer} onChange={e => setAnswer(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && !feedback && submit()}
                placeholder="Type your answer..." maxLength={12} disabled={!!feedback}
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-lg text-white text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} className="flex-1 bg-green-500 hover:bg-green-600" disabled={!!feedback || !answer.trim()}>Submit</Button>
              {!noHints && !showHint && !feedback && <Button onClick={() => setShowHint(true)} variant="outline" className="text-xs px-3">💡 Hint</Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS MEMORY (total game countdown timer) ────────────────────────────────
interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }

function ForusMemory({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const pairCount = { easy: EMOJIS_EASY_COUNT, medium: EMOJIS_MEDIUM_COUNT, hard: EMOJIS_HARD_COUNT }[level];
  const totalTime = { easy: 90, medium: 60, hard: 45 }[level];
  const cols = { easy: 4, medium: 4, hard: 5 }[level];
  const [emojis] = useState(() => shuffleArray(ALL_EMOJIS).slice(0, pairCount));
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [canFlip, setCanFlip] = useState(true);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const lv = LEVELS.find(l => l.id === level)!;
  const startTimeRef = useRef(Date.now());

  const buildDeck = (emojiList: string[]) =>
    shuffleArray([...emojiList, ...emojiList]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));

  useEffect(() => {
    setCards(buildDeck(emojis));
    startTimeRef.current = Date.now();
  }, [emojis]);

  useEffect(() => {
    if (gameOver) return;
    if (timeLeft === 0) { setGameOver(true); setShowSave(true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver]);

  const flipCard = (id: number) => {
    if (!canFlip || gameOver) return;
    const card = cards[id];
    if (card.flipped || card.matched || flipped.length >= 2) return;
    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setCanFlip(false);
      const [a, b] = newFlipped;
      setTimeout(() => {
        if (cards[a].emoji === cards[b].emoji) {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
          const nm = matched + 1;
          setMatched(nm);
          if (nm === pairCount) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const pts = Math.max(10, 400 - (moves + 1) * 5 - elapsed);
            setScore(pts); setWon(true); setGameOver(true); setShowSave(true);
          }
        } else { setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)); }
        setFlipped([]); setCanFlip(true);
      }, 700);
    }
  };

  const handleSave = (name: string) => { saveScore('memory', { name, score, date: new Date().toISOString(), level: lv.label }); setShowSave(false); };

  const restart = () => {
    const newEmojis = shuffleArray(ALL_EMOJIS).slice(0, pairCount);
    setCards(buildDeck(newEmojis));
    setFlipped([]); setMatched(0); setScore(0); setMoves(0);
    setGameOver(false); setWon(false); setShowSave(false); setCanFlip(true); setTimeLeft(totalTime);
    startTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="memory" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>🃏 {matched}/{pairCount}</StatPill>
          <StatPill>👆 {moves}</StatPill>
          <StatPill red={timeLeft <= 10}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={totalTime} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{won ? '🎉' : '⏱'}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{won ? 'You matched them all!' : "Time's Up!"}</h3>
            {won && <p className="text-zinc-400 mb-1">{moves} moves · {Math.floor((Date.now() - startTimeRef.current) / 1000)}s</p>}
            {won && <p className="text-zinc-400 mb-4">Score: <span className="font-bold text-white text-xl">{score}</span></p>}
            {!won && <p className="text-zinc-400 mb-4">{matched}/{pairCount} pairs found</p>}
            <div className="flex gap-3 justify-center">
              <Button onClick={restart}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols === 5 ? '300px' : '250px', width: '100%' }}>
            {cards.map((card, idx) => {
              const colors = ['bg-blue-500/30','bg-purple-500/30','bg-green-500/30','bg-orange-500/30','bg-pink-500/30'];
              return (
                <button key={card.id} onClick={() => flipCard(card.id)}
                  className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border-2 font-bold
                    ${card.matched ? 'bg-green-500/20 border-green-400 scale-95 cursor-default' :
                      card.flipped ? `${colors[idx % colors.length]} border-purple-400 scale-105` :
                      'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer active:scale-95'}`}>
                  {(card.flipped || card.matched) ? card.emoji : <span className="text-zinc-600 text-base">?</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS QUIZ (10s per question, always fresh random questions) ─────────────
function ForusQuiz({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const pool = { easy: QUIZ_EASY, medium: QUIZ_MEDIUM, hard: QUIZ_HARD }[level];
  const total = { easy: 8, medium: 10, hard: 12 }[level];
  const [questions] = useState(() => shuffleArray(pool).slice(0, total));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const lv = LEVELS.find(l => l.id === level)!;

  useEffect(() => {
    if (gameOver || selected !== null) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [gameOver, timeLeft, selected]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    const q = questions[qIndex];
    setSelected(idx);
    const isCorrect = idx === q.answer;
    if (isCorrect) { const bonus = timeLeft >= 7 ? 5 : 0; setScore(s => s + 10 + bonus); setCorrect(c => c + 1); }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= total) { setGameOver(true); setShowSave(true); }
      else { setQIndex(q => q + 1); setTimeLeft(Q_TIME); }
    }, 1000);
  };

  const handleSave = (name: string) => { saveScore('quiz', { name, score, date: new Date().toISOString(), level: lv.label }); setShowSave(false); };
  const optLabels = ['A', 'B', 'C', 'D'];
  const q = questions[qIndex];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="quiz" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>Q {Math.min(qIndex + 1, total)}/{total}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{correct >= Math.ceil(total * 0.8) ? '🏆' : correct >= Math.ceil(total * 0.5) ? '🎯' : '📚'}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{correct >= Math.ceil(total * 0.8) ? 'Genius!' : correct >= Math.ceil(total * 0.5) ? 'Well Done!' : 'Keep Studying!'}</h3>
            <p className="text-zinc-400 mb-1">{correct}/{total} correct</p>
            <p className="text-zinc-400 mb-4">Score: <span className="font-bold text-white text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onBack}>Change Level</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : q ? (
          <div className="w-full max-w-md">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 text-center">
              <p className="text-lg font-semibold text-white leading-snug">{q.q}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isSelected = i === selected;
                let cls = 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30 cursor-pointer';
                if (selected !== null) {
                  if (isCorrect) cls = 'bg-green-500/20 border-green-400 cursor-default';
                  else if (isSelected) cls = 'bg-red-500/20 border-red-400 cursor-default';
                  else cls = 'bg-white/5 border-white/10 opacity-40 cursor-default';
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium text-white transition-all duration-200 ${cls}`}>
                    <span className="mr-2 font-bold text-zinc-400">{optLabels[i]}.</span> {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Car Dodge Game ───────────────────────────────────────────────────────────
function ForusCar({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [phase, setPhase] = useState<'intro'|'playing'|'dead'>('intro');
  const [showSave, setShowSave] = useState(false);
  const SPEED_INIT = { easy: 2.5, medium: 4.2, hard: 6.5 }[level];
  const SPAWN_RATE = { easy: 88, medium: 58, hard: 36 }[level];
  const CW = 210; const CH = 370;
  const LANE_W = 70; const LANES = 3;
  const CAR_W = 36; const CAR_H = 52; const OBS_H = 52;
  const PY = CH - CAR_H - 16;
  const lx = (l: number) => l * LANE_W + (LANE_W - CAR_W) / 2;
  const OBS_COLORS = ['#ef4444','#f97316','#a855f7','#eab308','#3b82f6','#ec4899'];
  const gs = useRef({ lane: 1, obs: [] as {lane:number;y:number;col:string}[], score: 0, lives: 3, speed: SPEED_INIT, frame: 0, dead: false });
  const raf = useRef(0);

  const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  };

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d')!; const s = gs.current;
    ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#292524'; ctx.fillRect(4, 0, CW-8, CH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([16,12]); ctx.lineWidth = 2;
    for (let i = 1; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(i*LANE_W,0); ctx.lineTo(i*LANE_W,CH); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = '#44403c'; ctx.fillRect(0,0,4,CH); ctx.fillRect(CW-4,0,4,CH);
    for (const o of s.obs) {
      const x = lx(o.lane);
      ctx.fillStyle = o.col; rr(ctx, x, o.y, CAR_W, OBS_H, 6); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(x+5, o.y+9, CAR_W-10, 13);
      ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.arc(x+7, o.y+5, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+CAR_W-7, o.y+5, 4, 0, Math.PI*2); ctx.fill();
    }
    const px = lx(s.lane);
    ctx.fillStyle='#22c55e'; rr(ctx, px, PY, CAR_W, CAR_H, 7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(px+5, PY+8, CAR_W-10, 14);
    ctx.fillStyle='#fef08a';
    ctx.beginPath(); ctx.arc(px+7, PY+CAR_H-6, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+CAR_W-7, PY+CAR_H-6, 4, 0, Math.PI*2); ctx.fill();
    if (s.lives <= 0) {
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,CW,CH);
      ctx.fillStyle='#fff'; ctx.font='bold 22px system-ui'; ctx.textAlign='center';
      ctx.fillText('GAME OVER', CW/2, CH/2 - 10);
      ctx.font='16px system-ui'; ctx.fillText(`Score: ${s.score}`, CW/2, CH/2+18);
    }
  }, []);

  const startGame = useCallback(() => {
    gs.current = { lane: 1, obs: [], score: 0, lives: 3, speed: SPEED_INIT, frame: 0, dead: false };
    setUiScore(0); setUiLives(3); setPhase('playing');
  }, [SPEED_INIT]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const s = gs.current;
    const tick = () => {
      if (s.dead) return;
      s.frame++;
      if (s.frame % SPAWN_RATE === 0) {
        const occupiedLane = s.obs.filter(o => o.y < OBS_H * 1.5).map(o => o.lane);
        let lane = Math.floor(Math.random() * LANES);
        for (let t = 0; t < 5 && occupiedLane.includes(lane); t++) lane = Math.floor(Math.random() * LANES);
        s.obs.push({ lane, y: -OBS_H, col: OBS_COLORS[Math.floor(Math.random()*OBS_COLORS.length)] });
      }
      for (const o of s.obs) o.y += s.speed;
      let hitThisFrame = false;
      s.obs = s.obs.filter(o => {
        if (!hitThisFrame && o.lane === s.lane && o.y + OBS_H >= PY && o.y <= PY + CAR_H) {
          hitThisFrame = true; s.lives--; setUiLives(s.lives);
          if (s.lives <= 0) { s.dead = true; setPhase('dead'); setUiScore(s.score); setShowSave(true); draw(); }
          return false;
        }
        if (o.y >= CH) { s.score++; setUiScore(s.score); return false; }
        return true;
      });
      if (s.frame % 280 === 0) s.speed = Math.min(s.speed + 0.5, 16);
      draw();
      if (!s.dead) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') gs.current.lane = Math.max(0, gs.current.lane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') gs.current.lane = Math.min(2, gs.current.lane + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => { draw(); }, [draw]);

  const handleSave = (name: string) => { saveScore('car', { name, score: uiScore, date: new Date().toISOString(), level }); setShowSave(false); };
  const moveLeft = () => { gs.current.lane = Math.max(0, gs.current.lane - 1); };
  const moveRight = () => { gs.current.lane = Math.min(2, gs.current.lane + 1); };

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={uiScore} game="car" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <StatPill>{'❤️ '.repeat(Math.max(0, uiLives)).trim() || '💀'}</StatPill>
          <StatPill>⭐ {uiScore}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {phase === 'intro' && (
          <div className="text-center">
            <div className="text-5xl mb-3">🚗</div>
            <h3 className="text-xl font-bold text-white mb-1">Car Dodge</h3>
            <p className="text-zinc-400 text-sm mb-1">Avoid incoming cars. You have 3 lives.</p>
            <p className="text-zinc-500 text-xs mb-5">← → arrow keys or tap buttons below</p>
            <Button onClick={startGame}>Start Game</Button>
          </div>
        )}
        {(phase === 'playing' || phase === 'dead') && (
          <div className="flex flex-col items-center gap-3">
            <canvas ref={canvasRef} width={CW} height={CH} className="rounded-2xl border border-white/10" style={{ imageRendering: 'crisp-edges' }} />
            {phase === 'playing' && (
              <div className="flex gap-5">
                <button onPointerDown={moveLeft} className="w-16 h-16 rounded-2xl bg-white/10 text-white text-3xl font-bold hover:bg-white/20 active:scale-90 transition-all select-none touch-none">←</button>
                <button onPointerDown={moveRight} className="w-16 h-16 rounded-2xl bg-white/10 text-white text-3xl font-bold hover:bg-white/20 active:scale-90 transition-all select-none touch-none">→</button>
              </div>
            )}
            {phase === 'dead' && (
              <div className="flex gap-3">
                <Button onClick={startGame}>Play Again</Button>
                <Button variant="outline" onClick={onBack}>Menu</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Odd Word Out Game ─────────────────────────────────────────────────────────
function ForusOddWord({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const pool = { easy: ODD_EASY, medium: ODD_MEDIUM, hard: ODD_HARD }[level];
  const ROUNDS = 10; const ROUND_TIME = { easy: 18, medium: 14, hard: 10 }[level];
  const [questions] = useState<OddWordQ[]>(() => shuffleArray(pool).slice(0, ROUNDS));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const lv = LEVELS.find(l => l.id === level)!;

  const advance = useCallback((wasCorrect: boolean, tl: number) => {
    const pts = wasCorrect ? 10 + tl * 2 : 0;
    if (wasCorrect) { setScore(s => s + pts); setCorrect(c => c + 1); }
    if (qIdx + 1 >= ROUNDS) { setGameOver(true); setShowSave(true); }
    else { setTimeout(() => { setQIdx(i => i + 1); setSelected(null); setTimeLeft(ROUND_TIME); }, 900); }
  }, [qIdx, ROUNDS, ROUND_TIME]);

  useEffect(() => {
    if (gameOver || selected !== null) return;
    if (timeLeft <= 0) { setSelected(-1); advance(false, 0); return; }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, gameOver, advance]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    advance(idx === questions[qIdx].wrongIdx, timeLeft);
  };

  const handleSave = (name: string) => { saveScore('oddword', { name, score, date: new Date().toISOString(), level }); setShowSave(false); };
  const q = questions[Math.min(qIdx, ROUNDS - 1)];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="oddword" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>Q {Math.min(qIdx+1, ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 4}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={ROUND_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{correct >= 8 ? '🕵️' : correct >= 5 ? '🎯' : '📖'}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{correct >= 8 ? 'Word Detective!' : correct >= 5 ? 'Sharp Eye!' : 'Keep Studying!'}</h3>
            <p className="text-zinc-400 mb-1">{correct}/{ROUNDS} correct</p>
            <p className="text-zinc-400 mb-5">Score: <span className="text-white font-bold text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onBack}>Change Level</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <p className="text-zinc-500 text-[11px] text-center mb-3 font-semibold uppercase tracking-widest">Which word makes this statement WRONG?</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 text-center">
              <p className="text-base font-semibold text-white leading-relaxed">{q.text}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {q.words.map((word, i) => {
                let cls = 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30 cursor-pointer';
                if (selected !== null) {
                  if (i === q.wrongIdx) cls = 'bg-green-500/20 border-green-400 cursor-default';
                  else if (i === selected) cls = 'bg-red-500/20 border-red-400 cursor-default';
                  else cls = 'bg-white/5 border-white/10 opacity-40 cursor-default';
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-bold text-white transition-all duration-200 ${cls}`}>
                    {word}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className="text-center text-sm text-zinc-400 bg-white/5 rounded-xl px-4 py-2.5 border border-white/8">
                {q.fix}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Games Hub ───────────────────────────────────────────────────────────
interface ForusGamesProps { playerName: string; }

export function ForusGames({ playerName }: ForusGamesProps) {
  const [activeGame, setActiveGame] = useState<GameId>('menu');
  const [pendingGame, setPendingGame] = useState<GameId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('medium');
  const [lbTimeFilter, setLbTimeFilter] = useState('All Time');
  const [lbCatFilter, setLbCatFilter] = useState('All');
  const [lbData, setLbData] = useState<AllLeaderboards>(loadLeaderboard);

  useEffect(() => {
    if (activeGame === 'menu') setLbData(loadLeaderboard());
  }, [activeGame]);

  const GAMES = [
    {
      id: 'memory' as GameId,
      icon: <Brain size={40} color="#fff" strokeWidth={1.8} />,
      label: 'Forus Memory', category: 'MEMORY',
      bgStyle: { background: '#c026d3' },
      iconBg: '#86198f',
      glowColor: '#f0abfc',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 py-3">
          {/* Matched pair row */}
          <div className="flex gap-1.5 justify-center">
            {['🦁','🦁','🐬','🐬'].map((emoji, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-inner"
                style={{ background: i < 2 ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.22)', border: i < 2 ? '2px solid rgba(255,255,255,0.95)' : '1.5px solid rgba(255,255,255,0.35)', boxShadow: i < 2 ? '0 0 8px rgba(255,255,255,0.4)' : 'none' }}>
                {i < 2 ? emoji : ''}
              </div>
            ))}
          </div>
          {/* Face-down row */}
          <div className="flex gap-1.5 justify-center">
            {['🦊','','🦋',''].map((emoji, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: emoji ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)', border: emoji ? '2px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.3)' }}>
                {emoji}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'maths' as GameId,
      icon: <Calculator size={40} color="#fff" strokeWidth={1.8} />,
      label: 'Forus Maths', category: 'MATH',
      bgStyle: { background: '#0ea5e9' },
      iconBg: '#0369a1',
      glowColor: '#7dd3fc',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 py-3">

          {/* Big equation */}
          <div className="text-white font-extrabold text-2xl tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
            12 × 8
          </div>
          {/* Answer input */}
          <div className="w-full rounded-lg px-3 py-1 text-center text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.55)', color: 'rgba(255,255,255,0.7)' }}>
            Your answer…
          </div>
        </div>
      ),
    },
    {
      id: 'word' as GameId,
      icon: <BookOpen size={40} color="#fff" strokeWidth={1.8} />,
      label: 'Forus Word', category: 'VOCABULARY',
      bgStyle: { background: '#7c3aed' },
      iconBg: '#5b21b6',
      glowColor: '#c4b5fd',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 py-3">
          {/* Hint */}
          <div className="text-white/70 text-[9px] font-medium text-center">💡 Shines at night in the sky</div>
          {/* Scrambled letter tiles */}
          <div className="flex gap-1 justify-center">
            {['T','L','P','A','N','E'].map((letter, i) => (
              <div key={i} className="w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-xs"
                style={{ background: 'rgba(255,255,255,0.9)', color: '#5b21b6', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: '1.5px solid rgba(255,255,255,0.6)' }}>
                {letter}
              </div>
            ))}
          </div>
          {/* Answer blanks */}
          <div className="flex gap-1 justify-center">
            {['P','L','A','N','E','T'].map((letter, i) => (
              <div key={i} className="w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-xs"
                style={{ background: i < 3 ? 'rgba(255,255,255,0.25)' : 'transparent', color: 'rgba(255,255,255,0.4)', border: '1.5px dashed rgba(255,255,255,0.4)' }}>
                {i < 3 ? letter : ''}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'quiz' as GameId,
      icon: <Gamepad2 size={40} color="#fff" strokeWidth={1.8} />,
      label: 'Forus Quiz', category: 'QUIZ',
      bgStyle: { background: '#f97316' },
      iconBg: '#c2410c',
      glowColor: '#fdba74',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 py-2">
          <div className="text-white font-bold text-[11px] text-center opacity-90 leading-tight">What is 7 × 8?</div>
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {[['A', '54'], ['B', '56'], ['C', '58'], ['D', '64']].map(([letter, val]) => (
              <div key={letter} className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                style={{ background: letter === 'B' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', border: letter === 'B' ? '1.5px solid rgba(255,255,255,0.7)' : '1.5px solid rgba(255,255,255,0.2)' }}>
                <span className="text-white/70 font-bold text-[9px]">{letter}</span>
                <span className="text-white font-semibold text-[10px]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'car' as GameId,
      icon: <span style={{ fontSize: 32 }}>🚗</span>,
      label: 'Car Dodge', category: 'REFLEX',
      bgStyle: { background: '#16a34a' },
      iconBg: '#15803d',
      glowColor: '#86efac',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 py-2">
          {/* Road preview */}
          <div className="relative w-24 h-16 rounded-lg overflow-hidden" style={{ background: '#292524', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="absolute inset-y-0" style={{ left: '33.3%', width: 1, background: 'rgba(255,255,255,0.18)' }} />
            <div className="absolute inset-y-0" style={{ left: '66.6%', width: 1, background: 'rgba(255,255,255,0.18)' }} />
            {/* Obstacle cars */}
            <div className="absolute rounded" style={{ left: 2, top: 4, width: 22, height: 16, background: '#ef4444' }} />
            <div className="absolute rounded" style={{ left: '35%', top: 18, width: 22, height: 16, background: '#a855f7' }} />
            {/* Player car */}
            <div className="absolute rounded" style={{ left: '35%', bottom: 4, width: 22, height: 18, background: '#22c55e', boxShadow: '0 0 6px #86efac' }} />
          </div>
          <div className="text-white/80 text-[9px] font-medium">← → to dodge!</div>
        </div>
      ),
    },
    {
      id: 'oddword' as GameId,
      icon: <span style={{ fontSize: 32 }}>🕵️</span>,
      label: 'Odd Word Out', category: 'LOGIC',
      bgStyle: { background: '#0891b2' },
      iconBg: '#0e7490',
      glowColor: '#67e8f9',
      preview: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 py-2">
          <div className="text-white/80 text-[9px] font-semibold text-center">Which word is WRONG?</div>
          <div className="text-white font-bold text-[10px] text-center leading-tight opacity-90">"Dogs are reptiles that love to play"</div>
          <div className="grid grid-cols-2 gap-1 w-full">
            {[['Dogs','normal'],['reptiles','wrong'],['love','normal'],['play','normal']].map(([w, t]) => (
              <div key={w} className="rounded-lg px-2 py-1 text-center"
                style={{ background: t === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)', border: t === 'wrong' ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.15)' }}>
                <span className="text-white font-semibold text-[9px]">{w}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const catKey: Record<string, keyof AllLeaderboards | null> = { All: null, Memory: 'memory', Math: 'maths', Word: 'word', Quiz: 'quiz', Car: 'car', Logic: 'oddword' };
  const catGameKey = catKey[lbCatFilter];
  const rawEntries: LeaderboardEntry[] = catGameKey
    ? lbData[catGameKey]
    : [...lbData.maths, ...lbData.word, ...lbData.memory, ...lbData.quiz, ...lbData.car, ...lbData.oddword].sort((a, b) => b.score - a.score);
  const filteredEntries = filterByTime(rawEntries, lbTimeFilter).sort((a, b) => b.score - a.score);
  const topEntries = filteredEntries.slice(0, 3);
  const restEntries = filteredEntries.slice(3, 10);
  const myRankIndex = filteredEntries.findIndex(e => e.name.toLowerCase() === (playerName || '').toLowerCase());
  const myEntry = myRankIndex >= 0 ? filteredEntries[myRankIndex] : null;

  const goBack = () => { setActiveGame('menu'); setPendingGame(null); };

  if (pendingGame && pendingGame !== 'menu' && pendingGame !== 'leaderboard') {
    const g = GAMES.find(x => x.id === pendingGame);
    return <LevelSelect game={g?.label ?? ''} icon={g?.icon} onSelect={(l) => { setSelectedLevel(l); setActiveGame(pendingGame); setPendingGame(null); }} onBack={() => setPendingGame(null)} />;
  }

  if (activeGame === 'maths')    return <ForusMaths    playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'word')     return <ForusWord     playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'memory')   return <ForusMemory   playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'quiz')     return <ForusQuiz     playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'car')      return <ForusCar      playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'oddword')  return <ForusOddWord  playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'leaderboard') return <LeaderboardPanel onBack={goBack} />;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <h2 className="text-xl font-extrabold text-white leading-tight">Game Zone</h2>
        <p className="text-zinc-400 text-xs mt-0.5">Pick a challenge and start playing</p>
      </div>

      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left: Vertical game card list */}
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {GAMES.map(g => (
            <button
              key={g.id}
              onClick={() => setPendingGame(g.id)}
              className="relative rounded-2xl overflow-hidden text-left flex-1 active:scale-[0.98] transition-all duration-200"
              style={{
                ...g.bgStyle,
                minHeight: 150,
                boxShadow: `inset 0 -3px 0 ${(g as any).glowColor || '#fff'}cc, inset 0 -10px 20px ${(g as any).glowColor || '#fff'}33`,
              }}
            >
              {/* Preview area — positioned above the bottom bar */}
              <div className="absolute inset-0" style={{ bottom: 52 }}>
                <div className="relative w-full h-full overflow-hidden">
                  {g.preview}
                </div>
              </div>

              {/* Bottom info bar */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 px-3 py-2.5 z-10"
                style={{ background: 'transparent' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">{g.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm leading-tight">{g.label}</div>
                  <span className="inline-block text-white/80 text-[9px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full mt-0.5">{g.category}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                  <Star size={12} className="text-white/90" fill="rgba(255,255,255,0.9)" />
                  <span className="text-white font-bold text-xs">0</span>
                </div>
                <div
                  className="text-black text-xs font-extrabold px-4 py-2 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.96)' }}
                >
                  Play
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Leaderboard panel — self-start so it doesn't stretch */}
        <div
          className="rounded-2xl overflow-hidden flex-shrink-0 flex flex-col"
          style={{ width: 320, minHeight: 460, background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', border: '1px solid rgba(99,102,241,0.4)' }}
        >
          {/* Header + time filters */}
          <div className="px-3 pt-3 pb-1.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-extrabold text-base">Leaderboard</span>
              <div className="flex gap-0.5">
                {['Day','Week','Month','All Time'].map(f => (
                  <button key={f} onClick={() => setLbTimeFilter(f)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: lbTimeFilter === f ? 'rgba(99,102,241,0.85)' : 'transparent', color: lbTimeFilter === f ? '#fff' : '#71717a' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {/* Category filters */}
            <div className="flex gap-1 flex-wrap">
              {['All','Memory','Math','Word','Quiz','Car','Logic'].map(f => (
                <button key={f} onClick={() => setLbCatFilter(f)}
                  className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border"
                  style={{ background: lbCatFilter === f ? '#fff' : 'transparent', color: lbCatFilter === f ? '#000' : '#a1a1aa', borderColor: lbCatFilter === f ? '#fff' : '#3f3f46' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 px-3 pt-3 pb-2">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-zinc-400 mb-1 truncate max-w-[60px] text-center leading-tight">{topEntries[1]?.name ?? '—'}</div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg, #d1d5db, #9ca3af)', border: '2px solid rgba(209,213,219,0.85)' }}>2</div>
              <div className="w-16 rounded-t-xl mt-1.5"
                style={{ height: 80, background: 'linear-gradient(to top, rgba(156,163,175,0.5), rgba(209,213,219,0.25))', border: '1px solid rgba(209,213,219,0.2)', borderBottom: 'none' }} />
            </div>
            {/* 1st place */}
            <div className="flex flex-col items-center">
              {topEntries[0] ? (
                <>
                  <div className="text-white font-extrabold text-base leading-tight">{topEntries[0].score}</div>
                  <div className="text-xs text-zinc-300 mb-1 truncate max-w-[64px] text-center">{topEntries[0].name}</div>
                </>
              ) : (
                <div className="text-zinc-600 text-xs mb-1 text-center">No scores</div>
              )}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-2xl shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', border: '2px solid rgba(253,224,71,0.95)', boxShadow: '0 0 18px rgba(251,191,36,0.6)' }}>1</div>
              <div className="w-16 rounded-t-xl mt-1.5"
                style={{ height: 116, background: 'linear-gradient(to top, rgba(234,179,8,0.55), rgba(251,191,36,0.25))', border: '1px solid rgba(253,224,71,0.3)', borderBottom: 'none' }} />
            </div>
            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-zinc-400 mb-1 truncate max-w-[60px] text-center leading-tight">{topEntries[2]?.name ?? '—'}</div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg, #fb923c, #ea580c)', border: '2px solid rgba(253,186,116,0.85)' }}>3</div>
              <div className="w-16 rounded-t-xl mt-1.5"
                style={{ height: 60, background: 'linear-gradient(to top, rgba(249,115,22,0.5), rgba(251,146,60,0.25))', border: '1px solid rgba(253,186,116,0.2)', borderBottom: 'none' }} />
            </div>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center text-zinc-600 text-xs pb-2 -mt-1">Play a game to appear!</div>
          )}

          {/* Entries list (ranks 4–10) */}
          {restEntries.length > 0 && (
            <div className="mx-2.5 mb-2 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 140, scrollbarWidth: 'thin' }}>
              {restEntries.map((e, i) => (
                <div key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: e.name.toLowerCase() === (playerName || '').toLowerCase()
                      ? 'rgba(99,102,241,0.35)'
                      : 'rgba(255,255,255,0.04)',
                    border: e.name.toLowerCase() === (playerName || '').toLowerCase()
                      ? '1px solid rgba(99,102,241,0.6)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <span className="text-zinc-400 text-xs font-bold w-6 text-center">#{i + 4}</span>
                  <span className="text-zinc-200 text-xs truncate flex-1">{e.name}</span>
                  <span className="text-[10px] text-zinc-500">{fmtDate(e.date)}</span>
                  <span className="text-white font-bold text-xs">{e.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* My rank bar */}
          <div className="flex items-center gap-2 mx-3 mb-3 mt-auto px-3 py-3 rounded-xl"
            style={{ background: 'rgba(49,46,129,0.65)', border: '1px solid rgba(99,102,241,0.4)' }}>
            <span className="text-white text-sm font-bold">
              {myEntry ? `#${myRankIndex + 1}` : '—'}
            </span>
            <span className="text-zinc-300 text-sm truncate flex-1">{playerName || 'You'}</span>
            <span className="text-indigo-300 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(30,27,75,0.95)' }}>You</span>
            <span className="text-white font-bold text-sm">{myEntry ? myEntry.score : 0}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
