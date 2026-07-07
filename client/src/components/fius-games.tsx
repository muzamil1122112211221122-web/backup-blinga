import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, BookOpen, Gamepad2, ShoppingBag, Gem, ChevronRight, ChevronLeft, Star, Lock, Check, Layers, Zap, Car, HelpCircle, Shuffle } from "lucide-react";
import imgCoins    from "@assets/pngaaa.com-2802597_1780326509539.png";
// Game logos — new high-quality versions
const logoMemory  = '/game-memory-match.png';
const logoMaths   = '/game-speed-math.png';
const logoWord    = '/game-word-scramble.png';
const logoQuiz    = '/game-brain-quiz.png';
const logoCar     = '/game-car-dodge.png';
const logoOddword = '/game-odd-one-out.png';
const logoRPS     = '/game-rps.png';
const logoTTT     = '/game-tictactoe.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'maths' | 'word' | 'memory' | 'quiz' | 'car' | 'oddword'
            | 'tictactoe' | 'hangman' | 'rps' | 'connectfour' | 'mastermind'
            | 'wordchain' | 'truefalse' | 'speedmath';

interface GameProps { playerName: string; gameLevel: number; onWin: (score: number) => void; onLose: () => void; onBack: () => void; }
interface ScoreEntry { id: string; game: string; score: number; level: number; date: string; }

// ─── Fragment & Progress Storage (localStorage fallback) ──────────────────────
const FRAG_KEY  = 'fius_fragments_v2';
const OWNED_KEY = 'fius_owned_games_v2';
const LEVEL_KEY = 'fius_game_levels_v2';
const SCORES_KEY = 'fius_scores_v2';

function loadFragments(): number { try { return parseInt(localStorage.getItem(FRAG_KEY) || '0', 10) || 0; } catch { return 0; } }
function saveFragments(n: number) { localStorage.setItem(FRAG_KEY, String(n)); }
function loadOwned(): string[] { try { return JSON.parse(localStorage.getItem(OWNED_KEY) || '[]'); } catch { return []; } }
function saveOwned(ids: string[]) { localStorage.setItem(OWNED_KEY, JSON.stringify(ids)); }
function loadLevels(): Record<string, number> { try { return JSON.parse(localStorage.getItem(LEVEL_KEY) || '{}'); } catch { return {}; } }
function saveLevels(l: Record<string, number>) { localStorage.setItem(LEVEL_KEY, JSON.stringify(l)); }
function getGameLevel(id: string): number { const l = loadLevels(); return l[id] || 1; }
function persistGameLevel(id: string, lv: number) { const l = loadLevels(); l[id] = lv; saveLevels(l); }
function fragmentsForLevel(lv: number): number { return 4 + lv; }

// ─── Server Sync ───────────────────────────────────────────────────────────────
async function loadGamesFromServer(): Promise<{ownedGames:string[];fragments:number;levels:Record<string,number>;scores:ScoreEntry[]}|null> {
  try {
    const r = await fetch('/api/games/data');
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
let _syncTimer: ReturnType<typeof setTimeout>|null = null;
function syncToServer(data: {ownedGames:string[];fragments:number;levels:Record<string,number>;scores:ScoreEntry[]}) {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    fetch('/api/games/data', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }).catch(() => {});
  }, 400);
}

// ─── Level Difficulty Mapping ─────────────────────────────────────────────────
function getDifficulty(lv: number): 'easy' | 'medium' | 'hard' {
  if (lv <= 3) return 'easy';
  if (lv <= 7) return 'medium';
  return 'hard';
}
function getRounds(lv: number, base: number): number { return Math.min(base + Math.floor(lv / 2), base + 8); }
function getTimer(lv: number, baseTime: number): number { return Math.max(4, baseTime - lv); }

// ─── Word Data ────────────────────────────────────────────────────────────────
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
];
const WORD_MEDIUM = [
  { word: 'PLANET', hint: 'Orbits a star' }, { word: 'BRIDGE', hint: 'Connects two sides over water' },
  { word: 'JUNGLE', hint: 'Dense tropical forest' }, { word: 'CASTLE', hint: 'Medieval royal fortress' },
  { word: 'ROCKET', hint: 'Vehicle that reaches space' }, { word: 'VIOLIN', hint: 'Stringed instrument' },
  { word: 'CACTUS', hint: 'Desert plant with spines' }, { word: 'GARDEN', hint: 'Where flowers grow' },
  { word: 'MONKEY', hint: 'Primate in the trees' }, { word: 'PARROT', hint: 'Colourful talking bird' },
  { word: 'FOREST', hint: 'Large area of trees' }, { word: 'SILVER', hint: 'Precious grey metal' },
  { word: 'CAMERA', hint: 'Takes photographs' }, { word: 'DANGER', hint: 'Risk or threat' },
  { word: 'ENGINE', hint: 'Powers a machine' }, { word: 'HARBOR', hint: 'Safe port for ships' },
  { word: 'INSECT', hint: 'Small six-legged creature' }, { word: 'KNIGHT', hint: 'Armoured medieval warrior' },
  { word: 'NEEDLE', hint: 'Used for sewing' }, { word: 'PEPPER', hint: 'Spice used in cooking' },
];
const WORD_HARD = [
  { word: 'DOLPHIN', hint: 'Smart ocean mammal' }, { word: 'LANTERN', hint: 'Portable light in a case' },
  { word: 'KESTREL', hint: 'Small hovering falcon' }, { word: 'ENIGMA', hint: 'A mystery or puzzle' },
  { word: 'COBALT', hint: 'Bright blue element' }, { word: 'BONSAI', hint: 'Miniature cultivated tree' },
  { word: 'ZIPPER', hint: 'Fastener on clothing' }, { word: 'QUARTZ', hint: 'Common mineral' },
  { word: 'WALRUS', hint: 'Marine mammal with tusks' }, { word: 'GOBLIN', hint: 'Mischievous folklore creature' },
  { word: 'CREVICE', hint: 'Narrow crack in rock' }, { word: 'DYNASTY', hint: 'Ruling family line' },
  { word: 'ECLIPSE', hint: 'Moon blocks the sun' }, { word: 'GLACIER', hint: 'Slow-moving mass of ice' },
  { word: 'HORIZON', hint: 'Line where sky meets earth' }, { word: 'JAVELIN', hint: 'Spear thrown in athletics' },
  { word: 'LABYRINTH', hint: 'A complex maze' }, { word: 'MIRAGE', hint: 'Desert optical illusion' },
  { word: 'PHANTOM', hint: 'A ghost or apparition' }, { word: 'QUARREL', hint: 'An angry disagreement' },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────
const QUIZ_EASY = [
  { q: 'What colour is the sky?', options: ['Red','Blue','Green','Yellow'], answer: 1 },
  { q: 'How many days are in a week?', options: ['5','6','7','8'], answer: 2 },
  { q: 'What animal says "Moo"?', options: ['Dog','Cat','Cow','Pig'], answer: 2 },
  { q: 'How many fingers on one hand?', options: ['4','5','6','7'], answer: 1 },
  { q: 'What shape has 3 sides?', options: ['Square','Circle','Triangle','Rectangle'], answer: 2 },
  { q: 'What do bees make?', options: ['Milk','Honey','Butter','Juice'], answer: 1 },
  { q: 'What colour is grass?', options: ['Blue','Red','Yellow','Green'], answer: 3 },
  { q: 'Which fruit is red and round?', options: ['Banana','Apple','Orange','Grape'], answer: 1 },
  { q: 'How many legs does a spider have?', options: ['4','6','8','10'], answer: 2 },
  { q: 'What do you use to write on a blackboard?', options: ['Pen','Crayon','Chalk','Marker'], answer: 2 },
  { q: 'What is the opposite of hot?', options: ['Warm','Cold','Cool','Mild'], answer: 1 },
  { q: 'Which animal is the largest?', options: ['Dog','Cat','Elephant','Horse'], answer: 2 },
  { q: 'What colour is snow?', options: ['Blue','White','Grey','Yellow'], answer: 1 },
  { q: 'How many months are in a year?', options: ['10','11','12','13'], answer: 2 },
  { q: 'What gives us light during the day?', options: ['Moon','Stars','Sun','Lamp'], answer: 2 },
];
const QUIZ_MEDIUM = [
  { q: 'What is the capital of France?', options: ['Berlin','Madrid','Paris','Rome'], answer: 2 },
  { q: 'How many planets are in our solar system?', options: ['7','8','9','10'], answer: 1 },
  { q: 'Who painted the Mona Lisa?', options: ['Picasso','Rembrandt','Da Vinci','Van Gogh'], answer: 2 },
  { q: 'What is the chemical symbol for gold?', options: ['Go','Gd','Au','Ag'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion','Cheetah','Horse','Leopard'], answer: 1 },
  { q: 'Who wrote Romeo and Juliet?', options: ['Dickens','Shakespeare','Austen','Hemingway'], answer: 1 },
  { q: 'What is the boiling point of water (°C)?', options: ['90','95','100','105'], answer: 2 },
  { q: 'Which planet is the Red Planet?', options: ['Venus','Jupiter','Mars','Saturn'], answer: 2 },
  { q: 'What is the largest ocean?', options: ['Atlantic','Indian','Arctic','Pacific'], answer: 3 },
  { q: 'What is the capital of Japan?', options: ['Beijing','Seoul','Tokyo','Bangkok'], answer: 2 },
  { q: 'How many continents are there?', options: ['5','6','7','8'], answer: 2 },
  { q: 'Which gas do plants absorb from the air?', options: ['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'], answer: 2 },
  { q: 'What is the largest planet?', options: ['Saturn','Neptune','Jupiter','Uranus'], answer: 2 },
  { q: 'In which year did the first Moon landing happen?', options: ['1965','1967','1969','1971'], answer: 2 },
  { q: 'What is the hardest natural substance?', options: ['Gold','Iron','Diamond','Quartz'], answer: 2 },
];
const QUIZ_HARD = [
  { q: 'What is the square root of 196?', options: ['12','13','14','15'], answer: 2 },
  { q: 'Which element has atomic number 79?', options: ['Silver','Gold','Platinum','Copper'], answer: 1 },
  { q: 'In which year did the Berlin Wall fall?', options: ['1987','1988','1989','1990'], answer: 2 },
  { q: 'Who developed the theory of relativity?', options: ['Newton','Bohr','Einstein','Curie'], answer: 2 },
  { q: 'How many bones in the adult human body?', options: ['196','206','216','226'], answer: 1 },
  { q: 'Which gas makes up ~78% of Earth\'s atmosphere?', options: ['Oxygen','Carbon dioxide','Argon','Nitrogen'], answer: 3 },
  { q: 'Who wrote "Crime and Punishment"?', options: ['Tolstoy','Chekhov','Dostoyevsky','Turgenev'], answer: 2 },
  { q: 'What is the speed of light (km/s)?', options: ['200,000','250,000','300,000','350,000'], answer: 2 },
  { q: 'What is the Fibonacci sequence\'s 10th number?', options: ['34','55','89','144'], answer: 1 },
  { q: 'What is the chemical formula for table salt?', options: ['KCl','NaCl','CaCO3','MgSO4'], answer: 1 },
  { q: 'Who was the first female Nobel Prize winner?', options: ['Rosalind Franklin','Marie Curie','Lise Meitner','Dorothy Hodgkin'], answer: 1 },
  { q: 'What is the powerhouse of the cell?', options: ['Nucleus','Ribosome','Mitochondria','Golgi Apparatus'], answer: 2 },
  { q: 'What is the integral of cos(x)?', options: ['-sin(x)','sin(x)','tan(x)','-cos(x)'], answer: 1 },
  { q: 'Who proposed the heliocentric model?', options: ['Galileo','Kepler','Copernicus','Brahe'], answer: 2 },
  { q: 'What is the rarest blood type?', options: ['AB-','O-','B-','A-'], answer: 0 },
];

// ─── Odd Word Data ────────────────────────────────────────────────────────────
interface OddWordQ { text: string; words: string[]; wrongIdx: number; fix: string; }
const ODD_EASY: OddWordQ[] = [
  { text: "Elephants are the smallest land animals on Earth", words: ["Elephants","smallest","land","Earth"], wrongIdx: 1, fix: "Elephants are the LARGEST land animals." },
  { text: "Water boils at 0 degrees Celsius at sea level", words: ["Water","boils","0","Celsius"], wrongIdx: 2, fix: "Water boils at 100°C." },
  { text: "The Earth takes 365 days to orbit the Moon", words: ["365","orbit","Moon","days"], wrongIdx: 2, fix: "Earth orbits the SUN, not the Moon." },
  { text: "Dogs are reptiles that make great household pets", words: ["Dogs","reptiles","household","pets"], wrongIdx: 1, fix: "Dogs are MAMMALS, not reptiles." },
  { text: "Spiders have six legs and spin silk webs", words: ["Spiders","six","silk","webs"], wrongIdx: 1, fix: "Spiders have EIGHT legs." },
  { text: "The capital of Australia is Sydney", words: ["capital","Australia","Sydney","is"], wrongIdx: 2, fix: "Australia's capital is Canberra, not Sydney." },
  { text: "The Sun is a planet at the centre of our solar system", words: ["Sun","planet","centre","solar system"], wrongIdx: 1, fix: "The Sun is a STAR, not a planet." },
  { text: "Humans have 206 muscles in their skeleton", words: ["206","muscles","skeleton","Humans"], wrongIdx: 1, fix: "Humans have 206 BONES." },
];
const ODD_MEDIUM: OddWordQ[] = [
  { text: "Isaac Newton discovered gravity after an orange fell on his head", words: ["gravity","orange","fell","head"], wrongIdx: 1, fix: "The famous story involves an APPLE, not an orange." },
  { text: "The chemical symbol for gold is Ag on the periodic table", words: ["gold","Ag","periodic","table"], wrongIdx: 1, fix: "Gold's symbol is AU, not Ag (that's Silver)." },
  { text: "Shakespeare was born in London in the 16th century", words: ["Shakespeare","London","16th","century"], wrongIdx: 1, fix: "Shakespeare was born in Stratford-upon-Avon, not London." },
  { text: "The Pacific is the smallest ocean on Earth by area", words: ["Pacific","smallest","ocean","area"], wrongIdx: 1, fix: "The Pacific is the LARGEST ocean." },
  { text: "Mount Everest is the tallest mountain located in Africa", words: ["Everest","tallest","mountain","Africa"], wrongIdx: 3, fix: "Everest is located in ASIA (Nepal-Tibet border)." },
  { text: "Oxygen makes up about 78 percent of Earth's atmosphere", words: ["Oxygen","78 percent","Earth's","atmosphere"], wrongIdx: 0, fix: "NITROGEN makes up ~78% of the atmosphere." },
  { text: "Sound travels faster than light in a vacuum", words: ["Sound","faster","light","vacuum"], wrongIdx: 0, fix: "Light travels faster — sound cannot travel in a vacuum." },
  { text: "Albert Einstein failed mathematics at school as a child", words: ["Einstein","failed","mathematics","school"], wrongIdx: 2, fix: "Einstein excelled at mathematics." },
];
const ODD_HARD: OddWordQ[] = [
  { text: "The mitochondria produce ATP through a process called photosynthesis", words: ["mitochondria","ATP","photosynthesis","produce"], wrongIdx: 2, fix: "Mitochondria produce ATP via CELLULAR RESPIRATION." },
  { text: "The French Revolution began in 1789 under King Louis XV", words: ["1789","Revolution","Louis XV","France"], wrongIdx: 2, fix: "The Revolution occurred under LOUIS XVI, not XV." },
  { text: "Penicillin was accidentally discovered by Louis Pasteur in 1928", words: ["Penicillin","accidentally","Louis Pasteur","1928"], wrongIdx: 2, fix: "Penicillin was discovered by ALEXANDER FLEMING." },
  { text: "The speed of light in a vacuum is approximately 300 miles per second", words: ["light","vacuum","300","miles"], wrongIdx: 3, fix: "Light travels ~300,000 KILOMETRES per second." },
  { text: "The Treaty of Westphalia in 1848 ended the Thirty Years' War", words: ["Westphalia","1848","Thirty Years'","ended"], wrongIdx: 1, fix: "The Treaty of Westphalia was signed in 1648." },
  { text: "The human genome contains approximately 3 billion base pairs encoding 2 million genes", words: ["3 billion","base pairs","2 million","genes"], wrongIdx: 2, fix: "The human genome has ~20,000–25,000 protein-coding genes." },
  { text: "Nikola Tesla invented the telephone and was awarded the Nobel Prize", words: ["Tesla","telephone","Nobel Prize","1909"], wrongIdx: 1, fix: "The telephone was invented by Alexander Graham Bell." },
  { text: "Schrödinger proposed his famous cat paradox to support quantum superposition", words: ["Schrödinger","support","cat paradox","quantum"], wrongIdx: 1, fix: "Schrödinger devised the paradox to CRITIQUE quantum superposition." },
];

// ─── Memory Emojis ────────────────────────────────────────────────────────────
const ALL_EMOJIS = ['🦁','🐬','🦊','🐸','🦋','🌺','⚡','🎸','🍕','🚀','🎯','🌈','🐙','🎃','🏆','🦄','🍀','🎭','🔮','🎪'];

// ─── Hangman Words ────────────────────────────────────────────────────────────
const HANG_EASY = ['CAT','DOG','SUN','MAP','RED','BAG','CUP','HAT','RUN','PIG','BEE','OWL','FOX','JAM','NET'];
const HANG_MEDIUM = ['BRIDGE','PLANET','CASTLE','ROCKET','JUNGLE','SILVER','GARDEN','ISLAND','MIRROR','WINDOW'];
const HANG_HARD = ['LABYRINTH','MYSTIFIED','WHIRLPOOL','AMPLITUDE','BYZANTINE','CLOCKWORK','DYSTOPIAN','EXHAUSTED'];

// ─── Word Chain Pool ──────────────────────────────────────────────────────────
const CHAIN_WORDS: Record<string, string[]> = {
  A:['APPLE','ARROW','ANCHOR','ANGEL','ARCTIC','ALMOND','AZURE'],
  B:['BRIDGE','BEACH','BRAVE','BLOOM','BRUSH','BLAZE','BOUND'],
  C:['CLOUD','CRANE','CRISP','CROWN','CLOVE','CLEVER','COAST'],
  D:['DREAM','DRIFT','DANCE','DAWN','DUSK','DRAPE','DEPTH'],
  E:['EAGLE','EARTH','ECHO','EMBER','ELDER','ELBOW','ENVY'],
  F:['FLAME','FROST','FLOCK','FORGE','FLOAT','FEAST','FLAIR'],
  G:['GLASS','GLOBE','GRACE','GRAPE','GROWL','GUILD','GRAIN'],
  H:['HEART','HASTE','HAVEN','HEDGE','HILLS','HONEY','HOVER'],
  I:['IVORY','ICING','INLET','IRONY'],
  J:['JEWEL','JUMBO','JELLY'],
  K:['KNAVE','KNIFE'],
  L:['LIGHT','LEMON','LOTUS','LODGE','LANCE','LAYER'],
  M:['MAPLE','MIST','MARCH','MOOSE','MOUNT','METRO'],
  N:['NIGHT','NOVEL','NERVE','NORTH'],
  O:['OCEAN','OLIVE','ORBIT','OTTER'],
  P:['PEARL','PILOT','PLUME','PETAL','PLAZA','PRISM'],
  Q:['QUAIL','QUEST','QUARTZ'],
  R:['RIVER','RIDGE','ROBIN','REALM','ROAST'],
  S:['STONE','STORM','SPARK','STEAM','SHADE','SWIFT','SIREN'],
  T:['TIGER','TRAIL','TORCH','TREND','TOWER','THORN'],
  U:['ULTRA','UNITY'],
  V:['VIPER','VAULT','VIVID','VALOR'],
  W:['WATER','WITCH','WHOLE','WATCH','WHEAT'],
  X:['XENON'],
  Y:['YACHT','YOUNG'],
  Z:['ZEBRA','ZONAL'],
};

// ─── True/False Questions ─────────────────────────────────────────────────────
const TF_QUESTIONS = [
  { q: 'The Great Wall of China is visible from space.', answer: false },
  { q: 'A group of crows is called a murder.', answer: true },
  { q: 'Humans have 206 bones.', answer: true },
  { q: 'Lightning never strikes the same place twice.', answer: false },
  { q: 'Mount Everest is the tallest mountain on Earth.', answer: true },
  { q: 'Goldfish have a 3-second memory.', answer: false },
  { q: 'Water is H2O.', answer: true },
  { q: 'The Amazon is the longest river in the world.', answer: false },
  { q: 'Bats are blind.', answer: false },
  { q: 'Honey never expires.', answer: true },
  { q: 'Napoleon was unusually short for his era.', answer: false },
  { q: 'The sun is a star.', answer: true },
  { q: 'There are 8 planets in our solar system.', answer: true },
  { q: 'Diamonds are made of carbon.', answer: true },
  { q: 'Humans only use 10% of their brain.', answer: false },
  { q: 'Sharks are mammals.', answer: false },
  { q: 'The capital of Australia is Sydney.', answer: false },
  { q: 'Penguins live in the Arctic.', answer: false },
  { q: 'Oxygen makes up 78% of Earth\'s atmosphere.', answer: false },
  { q: 'Speed of light is approximately 300,000 km/s.', answer: true },
];

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

// ─── UI Components ─────────────────────────────────────────────────────────────
function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = (timeLeft / total) * 100;
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
      <div className={`h-full rounded-full transition-all duration-1000 ${pct <= 30 ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatPill({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <div className={`text-xs font-bold px-3 py-1 rounded-full ${red ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white/80'}`}>
      {children}
    </div>
  );
}

function FragmentBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', border: '1px solid rgba(96,165,250,0.5)' }}>
      <img src={imgCoins} alt="coins" className="w-5 h-5 object-contain" />
      <span className="text-white font-bold text-sm">{count}</span>
    </div>
  );
}

// ─── Level Badge (compact pill used inside games) ──────────────────────────────
function LevelBadge({ level }: { level: number }) {
  const diff = getDifficulty(level);
  const colors: Record<string, string> = { easy: 'from-green-500 to-emerald-600', medium: 'from-yellow-500 to-orange-500', hard: 'from-red-500 to-pink-600' };
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${colors[diff]} text-white text-xs font-bold`}>
      <Star size={10} fill="white" />
      <span>Level {level}</span>
    </div>
  );
}

// ─── Level Pill (semi-transparent, used in game cards) ─────────────────────────
function LevelPill({ level }: { level: number }) {
  const diff = getDifficulty(level);
  const bg: Record<string, string> = { easy: 'rgba(34,197,94,0.18)', medium: 'rgba(245,158,11,0.18)', hard: 'rgba(239,68,68,0.18)' };
  const tx: Record<string, string> = { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' };
  return (
    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
      style={{ background: bg[diff], color: tx[diff] }}>
      ★ Lv {level}
    </span>
  );
}

// ─── Win Modal ─────────────────────────────────────────────────────────────────
function WinModal({ level, score, fragsEarned, onContinue, onLeave }: { level: number; score: number; fragsEarned: number; onContinue: () => void; onLeave: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-blue-500/40 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.25)' }}>
        <div className="text-6xl mb-2">🏆</div>
        <h3 className="text-2xl font-extrabold text-white mb-1">Level {level} Complete!</h3>
        <p className="text-zinc-400 text-sm mb-4">Score: <span className="text-white font-bold">{score}</span></p>
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl mb-5" style={{ background: 'linear-gradient(135deg, rgba(30,64,175,0.4), rgba(59,130,246,0.2))', border: '1px solid rgba(96,165,250,0.3)' }}>
          <span className="text-2xl">🔷</span>
          <div>
            <div className="text-white font-extrabold text-xl">+{fragsEarned} Fragments</div>
            <div className="text-blue-300 text-xs">Added to your wallet</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onContinue}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
            Continue to Level {level + 1} <ChevronRight size={16} />
          </button>
          <button onClick={onLeave} className="w-full py-2.5 rounded-xl font-semibold text-zinc-400 text-sm hover:text-white transition-colors border border-zinc-700 hover:border-zinc-500">
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lose Modal ────────────────────────────────────────────────────────────────
function LoseModal({ level, onRetry, onLeave }: { level: number; onRetry: () => void; onLeave: () => void; }) {
  const encouragements = [
    "You're so close! Give it one more try!",
    "Every expert was once a beginner. Keep going!",
    "Don't stop now — you've got this!",
    "A little more practice and Level " + level + " is yours!",
    "Failure is just the first step to success. Retry!",
  ];
  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-6xl mb-2">💪</div>
        <h3 className="text-xl font-extrabold text-white mb-1">Don't Give Up!</h3>
        <p className="text-zinc-400 text-sm mb-5 leading-relaxed">{msg}</p>
        <div className="flex flex-col gap-2">
          <button onClick={onRetry}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            🔄 Retry Level {level}
          </button>
          <button onClick={onLeave} className="w-full py-2.5 rounded-xl font-semibold text-zinc-400 text-sm hover:text-white transition-colors border border-zinc-700 hover:border-zinc-500">
            Leave to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Continue Modal ────────────────────────────────────────────────────────────
function ContinueModal({ nextLevel, onYes, onNo }: { nextLevel: number; onYes: () => void; onNo: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-blue-500/40 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-5xl mb-3">🎯</div>
        <h3 className="text-xl font-extrabold text-white mb-2">Ready for Level {nextLevel}?</h3>
        <p className="text-zinc-400 text-sm mb-5">Difficulty is higher — think you can handle it?</p>
        <div className="flex gap-3">
          <button onClick={onYes} className="flex-1 py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
            Let's Go! 🚀
          </button>
          <button onClick={onNo} className="flex-1 py-3 rounded-xl font-semibold text-zinc-400 text-sm hover:text-white transition-colors border border-zinc-700">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FIUS MATHS ──────────────────────────────────────────────────────────────
function FiusMaths({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const ROUNDS = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 6);
  const cfg = { easy: { maxA: 20, maxB: 20, ops: ['+','-'] }, medium: { maxA: 50, maxB: 50, ops: ['+','-','×','÷'] }, hard: { maxA: 100, maxB: 100, ops: ['+','-','×','÷'] } }[diff];
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|'timeout'|null>(null);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState({ text: '', correct: 0 });
  const [correct, setCorrect] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);

  const newQuestion = useCallback(() => {
    const op = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
    let a: number, b: number, ans: number;
    if (op === '+') { a = Math.floor(Math.random() * cfg.maxA) + 1; b = Math.floor(Math.random() * cfg.maxB) + 1; ans = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * cfg.maxA) + 10; b = Math.floor(Math.random() * a); ans = a - b; }
    else if (op === '×') { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; ans = a * b; }
    else { a = Math.floor(Math.random() * 10) + 1; b = a * (Math.floor(Math.random() * 10) + 1); ans = b / a; [a, b] = [b, a]; }
    setQuestion({ text: `${a} ${op} ${b} = ?`, correct: ans });
    setAnswer(''); setTimeLeft(Q_TIME);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cfg, Q_TIME]);

  useEffect(() => { newQuestion(); }, []);

  useEffect(() => {
    if (feedback) return;
    if (timeLeft === 0) { setStreak(0); setFeedback('timeout'); advance(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback]);

  const advance = () => {
    setTimeout(() => {
      setFeedback(null);
      const next = round + 1;
      if (next >= ROUNDS) {
        const finalScore = scoreRef.current;
        const finalCorrect = correctRef.current;
        if (finalCorrect >= Math.ceil(ROUNDS * 0.6)) onWin(finalScore);
        else onLose();
      } else { setRound(next); newQuestion(); }
    }, 900);
  };

  const submit = () => {
    if (feedback) return;
    const val = parseInt(answer);
    if (isNaN(val)) return;
    if (val === question.correct) {
      const newStreak = streak + 1;
      const pts = 10 + (newStreak >= 3 ? 5 : 0);
      scoreRef.current += pts; setScore(scoreRef.current);
      correctRef.current++; setCorrect(correctRef.current);
      setStreak(newStreak); setFeedback('correct');
    } else { setStreak(0); setFeedback('wrong'); }
    advance();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          {streak >= 3 && <StatPill>🔥 {streak}x</StatPill>}
          <StatPill>Q {Math.min(round+1,ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className={`text-center p-8 rounded-2xl border-2 mb-5 transition-all ${feedback === 'correct' ? 'border-green-400 bg-green-500/10' : feedback === 'wrong' || feedback === 'timeout' ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
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
      </div>
    </div>
  );
}

// ─── FIUS WORD ───────────────────────────────────────────────────────────────
function FiusWord({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const ROUNDS = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 6);
  const wordList = { easy: WORD_EASY, medium: WORD_MEDIUM, hard: WORD_HARD }[diff];
  const noHints = diff === 'hard';
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|'timeout'|null>(null);
  const [words, setWords] = useState<typeof WORD_EASY>([]);
  const [scrambled, setScrambled] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const correctRef = useRef(0);
  const scoreRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const letterColors = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-red-500','bg-orange-500','bg-yellow-500','bg-green-500','bg-teal-500'];

  useEffect(() => {
    const picked = shuffleArray(wordList).slice(0, ROUNDS);
    setWords(picked); setScrambled(scramble(picked[0].word));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (feedback || !words.length) return;
    if (timeLeft === 0) { setFeedback('timeout'); advance(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, words]);

  const advance = () => {
    setTimeout(() => {
      setFeedback(null); setShowHint(false); setAnswer('');
      const next = round + 1;
      if (next >= ROUNDS) {
        if (correctRef.current >= Math.ceil(ROUNDS * 0.6)) onWin(scoreRef.current);
        else onLose();
      } else { setRound(next); setScrambled(scramble(words[next].word)); setTimeLeft(Q_TIME); setTimeout(() => inputRef.current?.focus(), 50); }
    }, 1000);
  };

  const submit = () => {
    if (feedback) return;
    const w = words[round]; if (!w) return;
    const isCorrect = answer.toUpperCase().trim() === w.word;
    if (isCorrect) { const pts = showHint ? 5 : 10; scoreRef.current += pts; setScore(scoreRef.current); correctRef.current++; }
    setFeedback(isCorrect ? 'correct' : 'wrong');
    advance();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Word {Math.min(round+1,ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft<=3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
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
      </div>
    </div>
  );
}

// ─── FIUS MEMORY ─────────────────────────────────────────────────────────────
interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }
function FiusMemory({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const pairCount = Math.min(4 + Math.floor(gameLevel * 0.8), 10);
  const totalTime = Math.max(15, 45 - gameLevel * 3);
  const cols = pairCount >= 8 ? 5 : 4;
  const [emojis] = useState(() => shuffleArray(ALL_EMOJIS).slice(0, pairCount));
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [canFlip, setCanFlip] = useState(true);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(Date.now());

  const buildDeck = (emojiList: string[]) =>
    shuffleArray([...emojiList, ...emojiList]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));

  useEffect(() => { setCards(buildDeck(emojis)); }, [emojis]);

  useEffect(() => {
    if (done) return;
    if (timeLeft === 0) { setDone(true); onLose(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done]);

  const flipCard = (id: number) => {
    if (!canFlip || done) return;
    const card = cards[id];
    if (card.flipped || card.matched || flipped.length >= 2) return;
    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1); setCanFlip(false);
      const [a, b] = newFlipped;
      setTimeout(() => {
        if (cards[a].emoji === cards[b].emoji) {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
          const nm = matched + 1;
          setMatched(nm);
          if (nm === pairCount) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const pts = Math.max(10, 400 - (moves + 1) * 5 - elapsed);
            setDone(true); onWin(pts);
          }
        } else { setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)); }
        setFlipped([]); setCanFlip(true);
      }, 700);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>🃏 {matched}/{pairCount}</StatPill>
          <StatPill>👆 {moves}</StatPill>
          <StatPill red={timeLeft <= 10}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={totalTime} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols === 5 ? '300px' : '250px', width: '100%' }}>
          {cards.map((card, idx) => {
            const colors = ['bg-blue-500/30','bg-purple-500/30','bg-green-500/30','bg-orange-500/30','bg-pink-500/30'];
            return (
              <button key={card.id} onClick={() => flipCard(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border-2 font-bold
                  ${card.matched ? 'bg-green-500/20 border-green-400 scale-95 cursor-default' :
                    card.flipped ? `${colors[idx % colors.length]} border-purple-400 scale-105` :
                    'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer active:scale-95'}`}>
                {(card.flipped || card.matched) ? card.emoji : <span className="text-zinc-600 text-base">?</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── FIUS QUIZ ───────────────────────────────────────────────────────────────
function FiusQuiz({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const pool = { easy: QUIZ_EASY, medium: QUIZ_MEDIUM, hard: QUIZ_HARD }[diff];
  const total = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 6);
  const [questions] = useState(() => shuffleArray(pool).slice(0, total));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const correctRef = useRef(0); const scoreRef = useRef(0);
  const optLabels = ['A','B','C','D'];

  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    const q = questions[qIndex]; setSelected(idx);
    if (idx === q.answer) { const bonus = timeLeft >= 7 ? 5 : 0; scoreRef.current += 10 + bonus; setScore(scoreRef.current); correctRef.current++; setCorrect(correctRef.current); }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= total) {
        if (correctRef.current >= Math.ceil(total * 0.6)) onWin(scoreRef.current);
        else onLose();
      } else { setQIndex(q => q + 1); setTimeLeft(Q_TIME); }
    }, 1000);
  };

  const q = questions[qIndex];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Q {Math.min(qIndex+1,total)}/{total}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft<=3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {q && (
          <div className="w-full max-w-md">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 text-center">
              <p className="text-lg font-semibold text-white leading-snug">{q.q}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isSelected = i === selected;
                let cls = 'bg-white/5 border-white/15 hover:bg-white/10 cursor-pointer';
                if (selected !== null) {
                  if (isCorrect) cls = 'bg-green-500/20 border-green-400 cursor-default';
                  else if (isSelected) cls = 'bg-red-500/20 border-red-400 cursor-default';
                  else cls = 'bg-white/5 border-white/10 opacity-40 cursor-default';
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium text-white transition-all ${cls}`}>
                    <span className="mr-2 font-bold text-zinc-400">{optLabels[i]}.</span>{opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FIUS ODD WORD ───────────────────────────────────────────────────────────
function FiusOddWord({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const pool = { easy: ODD_EASY, medium: ODD_MEDIUM, hard: ODD_HARD }[diff];
  const ROUNDS = getRounds(gameLevel, 5);
  const ROUND_TIME = getTimer(gameLevel, 8);
  const [questions] = useState<OddWordQ[]>(() => shuffleArray(pool).slice(0, ROUNDS));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const correctRef = useRef(0); const scoreRef = useRef(0);

  const advance = useCallback((wasCorrect: boolean, tl: number) => {
    if (wasCorrect) { const pts = 10 + tl * 2; scoreRef.current += pts; setScore(scoreRef.current); correctRef.current++; }
    if (qIdx + 1 >= ROUNDS) {
      setTimeout(() => {
        if (correctRef.current >= Math.ceil(ROUNDS * 0.6)) onWin(scoreRef.current);
        else onLose();
      }, 900);
    } else { setTimeout(() => { setQIdx(i => i + 1); setSelected(null); setTimeLeft(ROUND_TIME); }, 900); }
  }, [qIdx, ROUNDS, ROUND_TIME, onWin, onLose]);

  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft <= 0) { setSelected(-1); advance(false, 0); return; }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, advance]);

  const handleSelect = (idx: number) => { if (selected !== null) return; setSelected(idx); advance(idx === questions[qIdx].wrongIdx, timeLeft); };
  const q = questions[Math.min(qIdx, ROUNDS - 1)];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Q {Math.min(qIdx+1,ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft<=4}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={ROUND_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
          <p className="text-zinc-500 text-[11px] text-center mb-3 font-semibold uppercase tracking-widest">Which word makes this statement WRONG?</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 text-center">
            <p className="text-base font-semibold text-white leading-relaxed">{q.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {q.words.map((word, i) => {
              let cls = 'bg-white/5 border-white/15 hover:bg-white/10 cursor-pointer';
              if (selected !== null) {
                if (i === q.wrongIdx) cls = 'bg-green-500/20 border-green-400 cursor-default';
                else if (i === selected) cls = 'bg-red-500/20 border-red-400 cursor-default';
                else cls = 'bg-white/5 border-white/10 opacity-40 cursor-default';
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-bold text-white transition-all ${cls}`}>
                  {word}
                </button>
              );
            })}
          </div>
          {selected !== null && <div className="text-center text-sm text-zinc-400 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">{q.fix}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── CAR DODGE ────────────────────────────────────────────────────────────────
function FiusCar({ gameLevel, onWin, onLose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [phase, setPhase] = useState<'intro'|'playing'|'done'>('intro');
  const TARGET = 10 + gameLevel * 3;
  const SPEED_INIT = 2.5 + gameLevel * 0.5;
  const SPAWN_RATE = Math.max(22, 90 - gameLevel * 5);
  const CW = 240; const CH = 380;
  const SHOULDER = 18; const RW = CW - 2 * SHOULDER;
  const LANE_W = RW / 3; const LANES = 3;
  const CAR_W = 34; const CAR_H = 54; const OBS_H = 54;
  const PY = CH - CAR_H - 18;
  const OBS_COLORS = ['#ef4444','#f97316','#a855f7','#eab308','#3b82f6','#ec4899','#14b8a6','#f43f5e'];
  const gs = useRef({ lane: 1, obs: [] as {lane:number;y:number;col:string}[], score: 0, lives: 3, speed: SPEED_INIT, frame: 0, dead: false });
  const smoothLane = useRef(1.0);
  const raf = useRef(0);

  const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  };
  const lx = (l: number) => SHOULDER + l * LANE_W + (LANE_W - CAR_W) / 2;

  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, col: string, isPlayer: boolean) => {
    const h = isPlayer ? CAR_H : OBS_H;
    // shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; rr(ctx, x+2, y+5, CAR_W, h, 8); ctx.fill();
    ctx.restore();
    // body gradient
    const bodyGrad = ctx.createLinearGradient(x, y, x+CAR_W, y+h);
    bodyGrad.addColorStop(0, col);
    bodyGrad.addColorStop(0.4, col);
    bodyGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    rr(ctx, x, y, CAR_W, h, 8); ctx.fillStyle = bodyGrad; ctx.fill();
    // body side shine
    const shineGrad = ctx.createLinearGradient(x, y, x+CAR_W, y);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    shineGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
    rr(ctx, x, y, CAR_W, h, 8); ctx.fillStyle = shineGrad; ctx.fill();
    // --- roof / cabin area ---
    const roofY = isPlayer ? y+CAR_H-38 : y+6;
    const roofH = 16;
    rr(ctx, x+5, roofY, CAR_W-10, roofH, 4);
    ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fill();
    // windshield glass
    const glassGrad = ctx.createLinearGradient(x+6, roofY+1, x+6, roofY+roofH-2);
    glassGrad.addColorStop(0, 'rgba(150,220,255,0.55)');
    glassGrad.addColorStop(1, 'rgba(80,150,255,0.2)');
    rr(ctx, x+6, roofY+1, CAR_W-12, roofH-2, 3);
    ctx.fillStyle = glassGrad; ctx.fill();
    // glass glare streak
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, x+8, roofY+2, 6, 4, 1); ctx.fill();
    // --- wheel wells ---
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    // front wheels
    rr(ctx, x-4, y+6, 7, 13, 3); ctx.fill();
    rr(ctx, x+CAR_W-3, y+6, 7, 13, 3); ctx.fill();
    // rear wheels
    rr(ctx, x-4, y+h-19, 7, 13, 3); ctx.fill();
    rr(ctx, x+CAR_W-3, y+h-19, 7, 13, 3); ctx.fill();
    // tire rubber
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, x-3, y+7, 5, 11, 2); ctx.fill();
    rr(ctx, x+CAR_W-2, y+7, 5, 11, 2); ctx.fill();
    rr(ctx, x-3, y+h-18, 5, 11, 2); ctx.fill();
    rr(ctx, x+CAR_W-2, y+h-18, 5, 11, 2); ctx.fill();
    // rim circles
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(x-0.5, y+12, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+CAR_W+0.5, y+12, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x-0.5, y+h-13, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+CAR_W+0.5, y+h-13, 2.5, 0, Math.PI*2); ctx.fill();
    // --- headlights / taillights ---
    if (isPlayer) {
      // taillights (bottom) — red glow
      ctx.fillStyle = '#ef4444';
      rr(ctx, x+3, y+CAR_H-5, 7, 4, 2); ctx.fill();
      rr(ctx, x+CAR_W-10, y+CAR_H-5, 7, 4, 2); ctx.fill();
      ctx.save(); ctx.shadowColor='#ef4444'; ctx.shadowBlur=8;
      ctx.fillStyle='rgba(239,68,68,0.6)'; ctx.fillRect(x+3, y+CAR_H-5, 7, 4); ctx.restore();
      // headlights (top visible) — yellow
      ctx.fillStyle='#fef08a';
      rr(ctx, x+3, y, 7, 3, 2); ctx.fill();
      rr(ctx, x+CAR_W-10, y, 7, 3, 2); ctx.fill();
      // racing stripe
      ctx.fillStyle='rgba(255,255,255,0.12)';
      ctx.fillRect(x+CAR_W/2-2, y+4, 4, h-8);
    } else {
      // enemy headlights (bottom, facing player)
      ctx.fillStyle='#fef08a';
      rr(ctx, x+3, y+OBS_H-5, 7, 4, 2); ctx.fill();
      rr(ctx, x+CAR_W-10, y+OBS_H-5, 7, 4, 2); ctx.fill();
      ctx.save(); ctx.shadowColor='#fef08a'; ctx.shadowBlur=10;
      ctx.fillStyle='rgba(254,240,138,0.7)'; ctx.fillRect(x+3, y+OBS_H-5, 7, 4); ctx.restore();
      // taillights (top)
      ctx.fillStyle='#dc2626';
      rr(ctx, x+3, y, 7, 3, 2); ctx.fill();
      rr(ctx, x+CAR_W-10, y, 7, 3, 2); ctx.fill();
    }
  };

  const draw = useCallback((sl?: number) => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d')!; const s = gs.current;
    const lerpL = sl ?? smoothLane.current;
    // ── SKY with city silhouette ──
    const skyGrad = ctx.createLinearGradient(0,0,0,CH/3+10);
    skyGrad.addColorStop(0,'#020817'); skyGrad.addColorStop(0.5,'#0c1a3a'); skyGrad.addColorStop(1,'#1a2e50');
    ctx.fillStyle = skyGrad; ctx.fillRect(0,0,CW,CH/3+10);
    // stars
    ctx.fillStyle='rgba(255,255,255,0.7)';
    const starSeed=[3,11,17,23,37,41,53,67,79,83,97,101,107,113,127,131];
    for(let i=0;i<16;i++){const sx=(starSeed[i]*37+s.frame*0.02)%CW;const sy=(starSeed[(i+3)%16]*13)%(CH/3-8)+4;ctx.fillRect(sx,sy,1,1);}
    // city building silhouettes
    const buildH=[28,44,22,52,34,40,18,46,30,38];
    const buildW=CW/buildH.length;
    ctx.fillStyle='rgba(15,23,42,0.9)';
    for(let i=0;i<buildH.length;i++){ctx.fillRect(i*buildW,CH/3-buildH[i],buildW-1,buildH[i]+2);}
    // building windows
    ctx.fillStyle='rgba(255,230,100,0.55)';
    for(let i=0;i<buildH.length;i++){
      for(let wy=CH/3-buildH[i]+4;wy<CH/3-4;wy+=8){
        for(let wx=i*buildW+3;wx<(i+1)*buildW-5;wx+=6){
          if((i*7+wy*3)%5!==0) ctx.fillRect(wx,wy,3,4);
        }
      }
    }
    // horizon glow
    const hGlow=ctx.createLinearGradient(0,CH/3-8,0,CH/3+8);
    hGlow.addColorStop(0,'rgba(251,146,60,0.0)');hGlow.addColorStop(0.5,'rgba(251,146,60,0.18)');hGlow.addColorStop(1,'rgba(251,146,60,0.0)');
    ctx.fillStyle=hGlow; ctx.fillRect(0,CH/3-8,CW,16);
    // ── ROAD ──
    // base asphalt
    const roadGrad=ctx.createLinearGradient(0,CH/3,0,CH);
    roadGrad.addColorStop(0,'#2d3748'); roadGrad.addColorStop(1,'#1a202c');
    ctx.fillStyle=roadGrad; ctx.fillRect(0,CH/3,CW,CH);
    // road surface
    const surfGrad=ctx.createLinearGradient(0,CH/3,0,CH);
    surfGrad.addColorStop(0,'#3d4a5c'); surfGrad.addColorStop(1,'#2a3344');
    ctx.fillStyle=surfGrad; ctx.fillRect(SHOULDER,CH/3,RW,CH);
    // road texture lines
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.setLineDash([3,20]);
    for(let ti=0;ti<5;ti++){ctx.beginPath();ctx.moveTo(SHOULDER+ti*(RW/4),CH/3);ctx.lineTo(SHOULDER+ti*(RW/4),CH);ctx.stroke();}
    ctx.setLineDash([]);
    // road reflection / wet look
    const reflGrad=ctx.createLinearGradient(SHOULDER,CH*0.65,SHOULDER+RW,CH*0.65);
    reflGrad.addColorStop(0,'rgba(255,255,255,0)');reflGrad.addColorStop(0.4,'rgba(255,255,255,0.04)');reflGrad.addColorStop(0.6,'rgba(255,255,255,0.04)');reflGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=reflGrad; ctx.fillRect(SHOULDER,CH*0.6,RW,CH*0.4);
    // shoulder curbs — white+red striped
    for(let ci=0;ci<10;ci++){
      const cy=CH/3+ci*(CH*0.7/10);
      ctx.fillStyle=ci%2===0?'#ef4444':'#f8fafc';
      ctx.fillRect(SHOULDER-8,cy,8,CH*0.7/10);
      ctx.fillRect(SHOULDER+RW,cy,8,CH*0.7/10);
    }
    // animated dashed center lane lines
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2.5; ctx.setLineDash([22,18]);
    ctx.lineDashOffset = -(s.frame * s.speed * 0.9 % 40);
    for (let i=1;i<LANES;i++){const lx2=SHOULDER+i*LANE_W;ctx.beginPath();ctx.moveTo(lx2,CH/3);ctx.lineTo(lx2,CH);ctx.stroke();}
    ctx.setLineDash([]);
    // streetlight poles on sides (animated)
    const lampOffset=(s.frame*s.speed*0.5)%(CH*0.6);
    for(let li=0;li<4;li++){
      const ly=CH/3+((li*(CH*0.6/3)+lampOffset)%(CH*0.6));
      ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(4,ly);ctx.lineTo(4,ly+40);ctx.stroke();
      ctx.beginPath();ctx.moveTo(CW-4,ly);ctx.lineTo(CW-4,ly+40);ctx.stroke();
      // lamp glow
      const lampGlow=ctx.createRadialGradient(4,ly,0,4,ly,10);
      lampGlow.addColorStop(0,'rgba(255,220,100,0.4)');lampGlow.addColorStop(1,'rgba(255,220,100,0)');
      ctx.fillStyle=lampGlow;ctx.fillRect(-6,ly-10,20,20);
      const lampGlow2=ctx.createRadialGradient(CW-4,ly,0,CW-4,ly,10);
      lampGlow2.addColorStop(0,'rgba(255,220,100,0.4)');lampGlow2.addColorStop(1,'rgba(255,220,100,0)');
      ctx.fillStyle=lampGlow2;ctx.fillRect(CW-14,ly-10,20,20);
    }
    // obstacles
    for (const o of s.obs) { drawCar(ctx, lx(o.lane), o.y, o.col, false); }
    // player (smooth lane)
    const px = SHOULDER + lerpL * LANE_W + (LANE_W - CAR_W) / 2;
    drawCar(ctx, px, PY, '#22c55e', true);
    // glow under player car
    const grd = ctx.createRadialGradient(px+CAR_W/2, PY+CAR_H, 0, px+CAR_W/2, PY+CAR_H, 32);
    grd.addColorStop(0,'rgba(34,197,94,0.45)'); grd.addColorStop(1,'rgba(34,197,94,0)');
    ctx.fillStyle = grd; ctx.fillRect(px-16, PY, CAR_W+32, CAR_H+24);
    // speed streak behind player
    if(s.speed>5){
      const alpha=Math.min(0.35,(s.speed-5)/20);
      ctx.fillStyle=`rgba(34,197,94,${alpha})`;
      ctx.fillRect(px+4,PY+CAR_H,5,Math.min(30,s.speed*4));
      ctx.fillRect(px+CAR_W-9,PY+CAR_H,5,Math.min(30,s.speed*4));
    }
  }, []);

  const startGame = useCallback(() => {
    gs.current = { lane: 1, obs: [], score: 0, lives: 3, speed: SPEED_INIT, frame: 0, dead: false };
    smoothLane.current = 1.0;
    setUiScore(0); setUiLives(3); setPhase('playing');
  }, [SPEED_INIT]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const s = gs.current;
    const tick = () => {
      if (s.dead) return;
      s.frame++;
      // smooth lane lerp
      smoothLane.current += (s.lane - smoothLane.current) * 0.18;
      if (s.frame % SPAWN_RATE === 0) {
        const occ = s.obs.filter(o => o.y < OBS_H * 1.5).map(o => o.lane);
        let lane = Math.floor(Math.random() * LANES);
        for (let t = 0; t < 6 && occ.includes(lane); t++) lane = Math.floor(Math.random() * LANES);
        s.obs.push({ lane, y: -OBS_H, col: OBS_COLORS[Math.floor(Math.random()*OBS_COLORS.length)] });
      }
      for (const o of s.obs) o.y += s.speed;
      let hit = false;
      s.obs = s.obs.filter(o => {
        if (!hit && o.lane === s.lane && o.y + OBS_H >= PY && o.y <= PY + CAR_H) {
          hit = true; s.lives--; setUiLives(s.lives);
          if (s.lives <= 0) { s.dead = true; setPhase('done'); setUiScore(s.score); draw(smoothLane.current); setTimeout(() => onLose(), 600); return false; }
          return false;
        }
        if (o.y >= CH) { s.score++; setUiScore(s.score); if (s.score >= TARGET) { s.dead = true; setPhase('done'); draw(smoothLane.current); setTimeout(() => onWin(s.score * 12), 600); return false; } return false; }
        return true;
      });
      if (s.frame % 300 === 0) s.speed = Math.min(s.speed + 0.4, 18);
      draw(smoothLane.current);
      if (!s.dead) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, draw, TARGET, onWin, onLose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'ArrowLeft'  || e.key === 'a') gs.current.lane = Math.max(0, gs.current.lane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') gs.current.lane = Math.min(2, gs.current.lane + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end mb-2">
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill red={uiLives <= 1}>{'❤️'.repeat(Math.max(0,uiLives))||'💀'}</StatPill>
          <StatPill>🚗 {uiScore}/{TARGET}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {phase === 'intro' && (
          <div className="text-center">
            <div className="w-full max-w-xs rounded-2xl mb-4 flex items-center justify-center" style={{ height: 130, background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}>
              <Car className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Car Dodge — Level {gameLevel}</h3>
            <p className="text-zinc-400 text-sm mb-1">Dodge <span className="text-white font-bold">{TARGET}</span> cars to win. You have 3 lives.</p>
            <p className="text-zinc-500 text-xs mb-5">← → arrow keys or tap the steering buttons</p>
            <Button onClick={startGame} className="bg-red-600 hover:bg-red-700 px-8">🏁 Start Race</Button>
          </div>
        )}
        {(phase === 'playing' || phase === 'done') && (
          <div className="flex flex-col items-center gap-3 w-full">
            <canvas ref={canvasRef} width={CW} height={CH} className="rounded-2xl border-2 border-white/15 shadow-2xl"
              style={{ imageRendering: 'auto', boxShadow: '0 0 30px rgba(34,197,94,0.15)' }} />
            {phase === 'playing' && (
              <div className="flex gap-6">
                <button
                  onPointerDown={() => { gs.current.lane = Math.max(0, gs.current.lane - 1); }}
                  className="w-20 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 select-none touch-none border-2"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderColor: 'rgba(59,130,246,0.5)' }}>
                  <ChevronLeft size={34} className="text-white" strokeWidth={3} />
                </button>
                <button
                  onPointerDown={() => { gs.current.lane = Math.min(2, gs.current.lane + 1); }}
                  className="w-20 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 select-none touch-none border-2"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderColor: 'rgba(59,130,246,0.5)' }}>
                  <ChevronRight size={34} className="text-white" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STORE GAMES ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TIC-TAC-TOE (vs AI) ──────────────────────────────────────────────────────
function TicTacToe({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const [board, setBoard] = useState<(string|null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState<'playing'|'playerWin'|'aiWin'|'draw'>('playing');
  const [winLine, setWinLine] = useState<number[]|null>(null);
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  const checkWin = (b: (string|null)[], player: string): number[]|null => {
    for (const line of wins) { if (line.every(i => b[i] === player)) return line; } return null;
  };

  const minimax = (b: (string|null)[], depth: number, isMax: boolean): number => {
    if (checkWin(b, 'O')) return 10 - depth;
    if (checkWin(b, 'X')) return depth - 10;
    if (b.every(c => c !== null)) return 0;
    if (isMax) {
      let best = -Infinity;
      b.forEach((c, i) => { if (!c) { const nb = [...b]; nb[i] = 'O'; best = Math.max(best, minimax(nb, depth+1, false)); } });
      return best;
    } else {
      let best = Infinity;
      b.forEach((c, i) => { if (!c) { const nb = [...b]; nb[i] = 'X'; best = Math.min(best, minimax(nb, depth+1, true)); } });
      return best;
    }
  };

  const getAIMove = (b: (string|null)[]): number => {
    // On lower levels, AI makes random mistakes
    const mistakes = Math.max(0, 5 - gameLevel);
    if (Math.random() * 10 < mistakes) {
      const empty = b.map((c,i)=>c?-1:i).filter(i=>i>=0);
      return empty[Math.floor(Math.random()*empty.length)];
    }
    let best = -Infinity, move = -1;
    b.forEach((c, i) => { if (!c) { const nb = [...b]; nb[i] = 'O'; const score = minimax(nb, 0, false); if (score > best) { best = score; move = i; } } });
    return move;
  };

  const handleClick = (i: number) => {
    if (!isPlayerTurn || board[i] || status !== 'playing') return;
    const nb = [...board]; nb[i] = 'X';
    const wl = checkWin(nb, 'X');
    if (wl) { setBoard(nb); setWinLine(wl); setStatus('playerWin'); setTimeout(() => onWin(100 + gameLevel * 10), 800); return; }
    if (nb.every(c => c !== null)) { setBoard(nb); setStatus('draw'); setTimeout(() => onLose(), 800); return; }
    setBoard(nb); setIsPlayerTurn(false);
    setTimeout(() => {
      const aiMove = getAIMove(nb);
      const nb2 = [...nb]; nb2[aiMove] = 'O';
      const wl2 = checkWin(nb2, 'O');
      setBoard(nb2);
      if (wl2) { setWinLine(wl2); setStatus('aiWin'); setTimeout(() => onLose(), 800); return; }
      if (nb2.every(c => c !== null)) { setStatus('draw'); setTimeout(() => onLose(), 800); return; }
      setIsPlayerTurn(true);
    }, 500);
  };

  const symbols: Record<string, string> = { X: '✕', O: '○' };
  const colors: Record<string, string> = { X: 'text-blue-400', O: 'text-red-400' };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <LevelBadge level={gameLevel} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-sm text-zinc-400 text-center">
          {status === 'playing' ? (isPlayerTurn ? '🎮 Your turn (✕)' : '🤖 AI thinking...') :
           status === 'playerWin' ? '🎉 You won!' : status === 'aiWin' ? '🤖 AI wins!' : '🤝 Draw!'}
        </div>
        <div className="grid grid-cols-3 gap-2" style={{ width: 210 }}>
          {board.map((cell, i) => (
            <button key={i} onClick={() => handleClick(i)}
              className={`w-16 h-16 rounded-xl border-2 text-3xl font-bold flex items-center justify-center transition-all
                ${winLine?.includes(i) ? 'bg-yellow-500/20 border-yellow-400' :
                  cell ? 'bg-white/8 border-white/20 cursor-default' :
                  isPlayerTurn && status === 'playing' ? 'bg-white/5 border-white/15 hover:bg-white/15 hover:border-white/40 cursor-pointer' :
                  'bg-white/5 border-white/10 cursor-default'}
                ${colors[cell || '']}`}>
              {cell ? symbols[cell] : ''}
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-500 text-center">You are ✕ · AI is ○</div>
      </div>
    </div>
  );
}

// ─── HANGMAN ──────────────────────────────────────────────────────────────────
function Hangman({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const pool = { easy: HANG_EASY, medium: HANG_MEDIUM, hard: HANG_HARD }[diff];
  const maxWrong = Math.max(3, 7 - Math.floor(gameLevel / 3));
  const [word] = useState(() => pool[Math.floor(Math.random() * pool.length)]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const wrong = [...guessed].filter(l => !word.includes(l)).length;
  const solved = word.split('').every(l => guessed.has(l));

  useEffect(() => {
    if (done) return;
    if (solved) { setDone(true); setTimeout(() => onWin(150 + (maxWrong - wrong) * 20), 500); }
    else if (wrong >= maxWrong) { setDone(true); setTimeout(() => onLose(), 500); }
  }, [solved, wrong, done, maxWrong, onWin, onLose]);

  const guess = (l: string) => {
    if (guessed.has(l) || done) return;
    setGuessed(prev => new Set([...prev, l]));
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const hangmanParts = [
    // Base, pole, top, beam, rope, head, body, left arm, right arm, left leg, right leg
    <line key="base" x1="10" y1="90" x2="90" y2="90" stroke="white" strokeWidth="3" strokeLinecap="round"/>,
    <line key="pole" x1="30" y1="10" x2="30" y2="90" stroke="white" strokeWidth="3" strokeLinecap="round"/>,
    <line key="top" x1="30" y1="10" x2="60" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round"/>,
    <line key="rope" x1="60" y1="10" x2="60" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
    <circle key="head" cx="60" cy="33" r="8" stroke="white" strokeWidth="2" fill="none"/>,
    <line key="body" x1="60" y1="41" x2="60" y2="62" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
    <line key="larm" x1="60" y1="48" x2="45" y2="58" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
    <line key="rarm" x1="60" y1="48" x2="75" y2="58" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
    <line key="lleg" x1="60" y1="62" x2="45" y2="78" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
    <line key="rleg" x1="60" y1="62" x2="75" y2="78" stroke="white" strokeWidth="2" strokeLinecap="round"/>,
  ];
  const partsToShow = Math.ceil((wrong / maxWrong) * hangmanParts.length);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill red={wrong >= maxWrong - 1}>❌ {wrong}/{maxWrong}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <svg width="100" height="100" className="flex-shrink-0">
          {hangmanParts.slice(0, partsToShow)}
        </svg>
        <div className="flex gap-2 flex-wrap justify-center">
          {word.split('').map((l, i) => (
            <div key={i} className={`w-9 h-9 border-b-2 flex items-center justify-center text-lg font-bold transition-all
              ${guessed.has(l) ? 'text-white border-white' : 'text-transparent border-zinc-500'}`}>
              {guessed.has(l) ? l : ''}
            </div>
          ))}
        </div>
        {done && !solved && <p className="text-red-400 text-sm">The word was: <b className="text-white">{word}</b></p>}
        <div className="flex flex-wrap justify-center gap-1 max-w-xs">
          {alphabet.map(l => (
            <button key={l} onClick={() => guess(l)} disabled={guessed.has(l) || done}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                ${guessed.has(l)
                  ? word.includes(l) ? 'bg-green-500/30 text-green-400 cursor-default' : 'bg-red-500/20 text-red-500 cursor-default'
                  : done ? 'bg-white/5 text-zinc-600 cursor-default'
                  : 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROCK PAPER SCISSORS ──────────────────────────────────────────────────────
function RockPaperScissors({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const rounds = 5 + Math.floor(gameLevel / 3);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(1);
  const [playerPick, setPlayerPick] = useState<string|null>(null);
  const [aiPick, setAiPick] = useState<string|null>(null);
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const choices = ['✊','✋','✌️'];
  const names = { '✊':'Rock','✋':'Paper','✌️':'Scissors' };
  const beats: Record<string,string> = { '✊':'✌️','✋':'✊','✌️':'✋' };

  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);

  const play = (pick: string) => {
    if (playerPick) return;
    // AI uses pattern detection at higher levels
    const aiChoices = [...choices];
    const ai = aiChoices[Math.floor(Math.random() * 3)];
    setPlayerPick(pick); setAiPick(ai);
    let res = '';
    if (pick === ai) res = '🤝 Draw!';
    else if (beats[pick] === ai) { res = '✅ You win!'; playerScoreRef.current++; setPlayerScore(playerScoreRef.current); }
    else { res = '❌ AI wins!'; aiScoreRef.current++; setAiScore(aiScoreRef.current); }
    setResult(res);
    setHistory(h => [...h, `${names[pick as keyof typeof names]} vs ${names[ai as keyof typeof names]} → ${res.split(' ').slice(0,2).join(' ')}`]);
    setTimeout(() => {
      if (round >= rounds) {
        if (playerScoreRef.current > aiScoreRef.current) onWin(playerScoreRef.current * 20);
        else onLose();
      } else { setRound(r => r + 1); setPlayerPick(null); setAiPick(null); setResult(''); }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Round {round}/{rounds}</StatPill>
          <StatPill>You {playerScore} : {aiScore} AI</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-5xl mb-1">{playerPick || '❓'}</div>
            <div className="text-xs text-zinc-400">You</div>
          </div>
          <div className="text-zinc-500 font-bold text-xl">VS</div>
          <div className="text-center">
            <div className="text-5xl mb-1">{aiPick || '❓'}</div>
            <div className="text-xs text-zinc-400">AI</div>
          </div>
        </div>
        {result && <p className="text-white font-bold text-lg">{result}</p>}
        {!playerPick && (
          <div className="flex gap-4">
            {choices.map(c => (
              <button key={c} onClick={() => play(c)}
                className="w-16 h-16 text-4xl rounded-2xl bg-white/10 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all border border-white/20">
                {c}
              </button>
            ))}
          </div>
        )}
        {history.length > 0 && (
          <div className="text-xs text-zinc-600 space-y-0.5 max-h-16 overflow-y-auto">
            {history.slice(-3).map((h, i) => <div key={i}>{h}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONNECT FOUR ─────────────────────────────────────────────────────────────
function ConnectFour({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const COLS = 7; const ROWS = 6;
  const empty = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  const [board, setBoard] = useState<(string|null)[][]>(empty());
  const [isPlayer, setIsPlayer] = useState(true);
  const [over, setOver] = useState(false);

  const drop = (board: (string|null)[][], col: number, player: string): (string|null)[][]|null => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) { const nb = board.map(row => [...row]); nb[r][col] = player; return nb; }
    }
    return null;
  };

  const checkWinState = (b: (string|null)[][], p: string): boolean => {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr,dc] of dirs) {
        let cnt = 0;
        for (let k = 0; k < 4; k++) { const nr=r+dr*k,nc=c+dc*k; if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc]===p) cnt++; else break; }
        if (cnt === 4) return true;
      }
    }
    return false;
  };

  const score4 = (b: (string|null)[][], p: string): number => {
    let s = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr,dc] of dirs) {
        let mine=0,empty=0;
        for (let k = 0; k < 4; k++) { const nr=r+dr*k,nc=c+dc*k; if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS) { if(b[nr][nc]===p)mine++; else if(!b[nr][nc])empty++; } }
        if (mine+empty===4) s+=mine*mine;
      }
    }
    return s;
  };

  const aiMove = (b: (string|null)[][]): number => {
    // Win
    for (let c = 0; c < COLS; c++) { const nb = drop(b,c,'O'); if (nb && checkWinState(nb,'O')) return c; }
    // Block
    for (let c = 0; c < COLS; c++) { const nb = drop(b,c,'X'); if (nb && checkWinState(nb,'X')) return c; }
    // Prefer center at higher levels, random at lower
    if (gameLevel >= 5 && !b[ROWS-1][3]) return 3;
    const avail = Array.from({length:COLS},(_,i)=>i).filter(c=>!b[0][c]);
    const scored = avail.map(c => { const nb=drop(b,c,'O')!; return {c,s:score4(nb,'O')-score4(nb,'X')}; });
    if (gameLevel >= 3) { scored.sort((a,b)=>b.s-a.s); return scored[0]?.c ?? avail[0]; }
    return avail[Math.floor(Math.random()*avail.length)];
  };

  const handleClick = (col: number) => {
    if (!isPlayer || over) return;
    const nb = drop(board, col, 'X'); if (!nb) return;
    if (checkWinState(nb,'X')) { setBoard(nb); setOver(true); setTimeout(() => onWin(200), 500); return; }
    if (nb.every(row=>row.every(c=>c))) { setBoard(nb); setOver(true); setTimeout(() => onLose(), 500); return; }
    setBoard(nb); setIsPlayer(false);
    setTimeout(() => {
      const ac = aiMove(nb);
      const nb2 = drop(nb,ac,'O')!;
      if (checkWinState(nb2,'O')) { setBoard(nb2); setOver(true); setTimeout(() => onLose(), 500); return; }
      if (nb2.every(row=>row.every(c=>c))) { setBoard(nb2); setOver(true); setTimeout(() => onLose(), 500); return; }
      setBoard(nb2); setIsPlayer(true);
    }, 600);
  };

  const colors: Record<string,string> = { X: 'bg-blue-500 border-blue-400', O: 'bg-red-500 border-red-400' };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>You
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2"/>AI
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-400 mb-2">{over ? '' : isPlayer ? '🎮 Your turn' : '🤖 AI thinking...'}</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="rounded-xl p-2" style={{ background: 'rgba(30,64,175,0.3)', border: '1px solid rgba(96,165,250,0.3)' }}>
          {/* Column click targets */}
          <div className="flex gap-1 mb-1">
            {Array.from({length:COLS},(_,c)=>(
              <button key={c} onClick={() => handleClick(c)} disabled={!isPlayer||over||!!board[0][c]}
                className="w-8 flex items-center justify-center text-zinc-600 hover:text-white transition-colors text-xs h-4">▼</button>
            ))}
          </div>
          {board.map((row, r) => (
            <div key={r} className="flex gap-1 mb-1">
              {row.map((cell, c) => (
                <div key={c} className={`w-8 h-8 rounded-full border-2 transition-all duration-300
                  ${cell ? colors[cell] : 'bg-zinc-800 border-zinc-700'}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MASTERMIND (Code Breaker) ─────────────────────────────────────────────────
function Mastermind({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const codeLength = gameLevel >= 5 ? 5 : 4;
  const maxGuesses = Math.max(4, 8 - Math.floor(gameLevel / 3));
  const colors = ['🔴','🟠','🟡','🟢','🔵','🟣'];
  const numColors = Math.min(4 + Math.floor(gameLevel/3), 6);
  const palette = colors.slice(0, numColors);
  const [secret] = useState(() => Array.from({length:codeLength},()=>palette[Math.floor(Math.random()*numColors)]));
  const [guesses, setGuesses] = useState<{code:string[];bulls:number;cows:number}[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const checkGuess = (guess: string[]): {bulls:number;cows:number} => {
    let bulls = 0, cows = 0;
    const sLeft: string[] = [], gLeft: string[] = [];
    for (let i = 0; i < codeLength; i++) {
      if (guess[i] === secret[i]) bulls++;
      else { sLeft.push(secret[i]); gLeft.push(guess[i]); }
    }
    for (const g of gLeft) { const idx = sLeft.indexOf(g); if (idx>=0) { cows++; sLeft.splice(idx,1); } }
    return {bulls,cows};
  };

  const submit = () => {
    if (current.length !== codeLength || done) return;
    const fb = checkGuess(current);
    const newGuesses = [...guesses, {code:current,bulls:fb.bulls,cows:fb.cows}];
    setGuesses(newGuesses);
    setCurrent([]);
    if (fb.bulls === codeLength) { setDone(true); setTimeout(() => onWin(200 + (maxGuesses - newGuesses.length) * 30), 500); }
    else if (newGuesses.length >= maxGuesses) { setDone(true); setTimeout(() => onLose(), 500); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>{guesses.length}/{maxGuesses} tries</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto py-2">
        <p className="text-zinc-400 text-xs text-center">Crack the {codeLength}-color code! 🟢=right spot ⚪=wrong spot</p>
        {/* Past guesses */}
        <div className="w-full max-w-xs space-y-1.5">
          {guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <div className="flex gap-1">{g.code.map((c,j)=><span key={j} className="text-lg">{c}</span>)}</div>
              <div className="ml-auto flex gap-1 text-xs">
                {Array(g.bulls).fill('🟢').map((x,j)=><span key={j}>{x}</span>)}
                {Array(g.cows).fill('⚪').map((x,j)=><span key={j}>{x}</span>)}
                {g.bulls===0&&g.cows===0&&<span className="text-zinc-600">✗</span>}
              </div>
            </div>
          ))}
        </div>
        {done && <p className="text-zinc-400 text-sm">Secret: {secret.join('')}</p>}
        {/* Current guess */}
        {!done && (
          <>
            <div className="flex gap-1.5 items-center">
              {Array.from({length:codeLength},(_,i)=>(
                <div key={i} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl
                  ${current[i] ? 'border-white/40 bg-white/10' : 'border-white/20 bg-white/5'}`}>
                  {current[i] || ''}
                </div>
              ))}
              <button onClick={() => setCurrent([])} className="ml-2 text-zinc-500 hover:text-white text-xs">✕</button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {palette.map(c=>(
                <button key={c} onClick={()=>{ if(current.length<codeLength)setCurrent(p=>[...p,c]); }}
                  className="text-2xl w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 hover:scale-110 transition-all">
                  {c}
                </button>
              ))}
            </div>
            <Button onClick={submit} disabled={current.length !== codeLength} className="bg-blue-600 hover:bg-blue-700">Check Code</Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── WORD CHAIN ────────────────────────────────────────────────────────────────
function WordChain({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const target = 5 + gameLevel * 2;
  const [chain, setChain] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [aiWord, setAiWord] = useState<string>('');
  const [waitingForAI, setWaitingForAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);

  const getAIWord = (lastLetter: string): string|null => {
    const pool = CHAIN_WORDS[lastLetter.toUpperCase()] || [];
    const avail = pool.filter(w => !used.has(w));
    return avail.length ? avail[Math.floor(Math.random() * avail.length)] : null;
  };

  useEffect(() => {
    // Start with a random word
    const startLetters = Object.keys(CHAIN_WORDS);
    const letter = startLetters[Math.floor(Math.random()*startLetters.length)];
    const words = CHAIN_WORDS[letter];
    const first = words[Math.floor(Math.random()*words.length)];
    setAiWord(first); setChain([first]); setUsed(new Set([first]));
  }, []);

  const submit = () => {
    if (!aiWord || waitingForAI) return;
    const word = input.trim().toUpperCase();
    if (!word) return;
    const lastLetter = aiWord[aiWord.length - 1];
    if (word[0] !== lastLetter) { setError(`Word must start with "${lastLetter}"`); return; }
    if (used.has(word)) { setError('Word already used!'); return; }
    if (word.length < 3) { setError('Word must be at least 3 letters'); return; }
    // Accept any word
    const newUsed = new Set([...used, word]);
    setUsed(newUsed); setError('');
    const newChain = [...chain, word];
    setChain(newChain); setInput('');
    scoreRef.current += word.length; setScore(scoreRef.current);

    if (newChain.length >= target * 2) { onWin(scoreRef.current * 5); return; }

    // AI responds
    setWaitingForAI(true);
    setTimeout(() => {
      const wordLastLetter = word[word.length - 1];
      const aiResponse = getAIWord(wordLastLetter);
      if (!aiResponse) { onWin(scoreRef.current * 5); return; } // AI can't respond = player wins
      const newChain2 = [...newChain, aiResponse];
      setChain(newChain2); setAiWord(aiResponse); setUsed(new Set([...newUsed, aiResponse]));
      setWaitingForAI(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 800);
  };

  const lastLetter = aiWord ? aiWord[aiWord.length-1] : '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Chain: {chain.length}/{target*2}</StatPill>
          <StatPill>⭐ {score}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <p className="text-zinc-500 text-xs text-center">Continue the word chain! Each word must start with the last letter of the previous.</p>
        <div className="flex-1 overflow-y-auto space-y-1.5 px-1">
          {chain.map((w, i) => (
            <div key={i} className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2
              ${i % 2 === 0 ? 'bg-red-500/20 text-red-300 self-start' : 'bg-blue-500/20 text-blue-300 ml-8'}`}
              style={{ maxWidth:'75%', marginLeft: i%2===1 ? 'auto' : undefined }}>
              <span className="text-xs opacity-60">{i%2===0?'🤖':'🎮'}</span>
              {w}
            </div>
          ))}
          {waitingForAI && <div className="px-3 py-2 rounded-xl bg-red-500/10 text-zinc-500 text-sm animate-pulse">🤖 thinking...</div>}
        </div>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        {!waitingForAI && aiWord && (
          <div className="flex gap-2 items-center">
            <div className="text-xs text-zinc-500 whitespace-nowrap">Starts with <span className="text-white font-bold text-sm uppercase">{lastLetter}</span>:</div>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&submit()}
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-sm text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={`Type a word starting with ${lastLetter}...`} />
            <Button onClick={submit} size="sm" className="bg-blue-600 hover:bg-blue-700 px-4">→</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRUE OR FALSE BLITZ ──────────────────────────────────────────────────────
function TrueFalseBlitz({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const total = getRounds(gameLevel, 8);
  const Q_TIME = getTimer(gameLevel, 5);
  const [questions] = useState(() => shuffleArray(TF_QUESTIONS).slice(0, total));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState<boolean|null>(null);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const correctRef = useRef(0); const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (answered !== null) return;
    if (timeLeft === 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, answered]);

  const handleAnswer = (ans: boolean|null) => {
    if (answered !== null) return;
    const q = questions[qIndex];
    const isCorrect = ans === q.answer;
    setAnswered(ans);
    if (isCorrect) {
      const pts = 10 + timeLeft * 2 + (streak + 1 >= 3 ? 10 : 0);
      scoreRef.current += pts; setScore(scoreRef.current);
      correctRef.current++; setCorrect(correctRef.current);
      setStreak(s => s + 1);
    } else setStreak(0);
    setTimeout(() => {
      setAnswered(null);
      if (qIndex + 1 >= total) {
        if (correctRef.current >= Math.ceil(total * 0.6)) onWin(scoreRef.current);
        else onLose();
      } else { setQIndex(i => i + 1); setTimeLeft(Q_TIME); }
    }, 800);
  };

  const q = questions[qIndex];
  const isCorrect = answered !== null && answered === q.answer;
  const isWrong = answered !== null && answered !== q.answer;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          {streak >= 3 && <StatPill>🔥 {streak}x</StatPill>}
          <StatPill>Q {Math.min(qIndex+1,total)}/{total}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft<=2}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} />
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className={`w-full max-w-md p-6 rounded-2xl border-2 text-center transition-all
          ${isCorrect ? 'border-green-400 bg-green-500/10' : isWrong || (answered===null&&timeLeft===0) ? 'border-red-400 bg-red-500/10' : 'border-white/15 bg-white/5'}`}>
          <p className="text-lg font-semibold text-white leading-snug">{q.q}</p>
          {isCorrect && <p className="text-green-400 text-sm mt-2">✓ Correct!</p>}
          {isWrong && <p className="text-red-400 text-sm mt-2">✗ That was {q.answer ? 'TRUE' : 'FALSE'}</p>}
          {answered === null && timeLeft === 0 && <p className="text-orange-400 text-sm mt-2">⏱ Too slow!</p>}
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleAnswer(true)} disabled={answered !== null}
            className="w-28 h-14 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            ✓ TRUE
          </button>
          <button onClick={() => handleAnswer(false)} disabled={answered !== null}
            className="w-28 h-14 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
            ✗ FALSE
          </button>
        </div>
        <p className="text-zinc-600 text-xs">{correct}/{qIndex+1 > total ? total : qIndex} correct so far</p>
      </div>
    </div>
  );
}

// ─── SPEED MATH RACE (vs AI) ──────────────────────────────────────────────────
function SpeedMathRace({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const ROUNDS = 7 + gameLevel;
  const maxA = 10 + gameLevel * 5;
  const ops = gameLevel <= 3 ? ['+','-'] : ['+','-','×'];
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState({text:'',ans:0});
  const [input, setInput] = useState('');
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [roundResult, setRoundResult] = useState<string>('');
  const [aiThinking, setAiThinking] = useState(false);
  const playerRef = useRef(0); const aiRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [started, setStarted] = useState(false);

  const newQuestion = useCallback(() => {
    const op = ops[Math.floor(Math.random()*ops.length)];
    let a = Math.floor(Math.random()*maxA)+1, b = Math.floor(Math.random()*maxA)+1, ans: number;
    if (op==='+') ans=a+b;
    else if (op==='-') { if(a<b)[a,b]=[b,a]; ans=a-b; }
    else { a=Math.floor(Math.random()*12)+1; b=Math.floor(Math.random()*12)+1; ans=a*b; }
    setQuestion({text:`${a} ${op} ${b} = ?`, ans});
    setInput(''); setRoundResult(''); setAiThinking(false);
    // AI answers after random delay based on difficulty
    const delay = Math.max(500, 3000 - gameLevel * 200 + Math.random()*1000);
    setTimeout(() => setAiThinking(true), 100);
    setTimeout(() => {
      // If player hasn't answered yet, AI wins
      setAiThinking(false);
    }, delay);
    setTimeout(() => inputRef.current?.focus(), 50);
    return delay;
  }, [ops, maxA, gameLevel]);

  const aiDelay = useRef(0);

  const startRound = useCallback(() => {
    const d = newQuestion();
    aiDelay.current = d;
  }, [newQuestion]);

  useEffect(() => { if (started && round < ROUNDS) startRound(); }, [round, started]);

  const submit = () => {
    if (roundResult || !started) return;
    const val = parseInt(input);
    if (isNaN(val)) return;
    if (val === question.ans) {
      // Player answered correctly — did they beat AI?
      setRoundResult('🎮 You answered first!');
      playerRef.current++; setPlayerWins(playerRef.current);
    } else {
      setRoundResult('✗ Wrong answer — AI wins the round!');
      aiRef.current++; setAiWins(aiRef.current);
    }
    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) {
        if (playerRef.current > aiRef.current) onWin(playerRef.current * 25);
        else onLose();
      } else setRound(next);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>Round {Math.min(round+1,ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>🎮{playerWins} vs 🤖{aiWins}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {!started ? (
          <div className="text-center">
            <div className="text-5xl mb-3">🏎️</div>
            <h3 className="text-xl font-bold text-white mb-2">Speed Math Race</h3>
            <p className="text-zinc-400 text-sm mb-5">Answer faster than AI to win rounds! Win {Math.ceil(ROUNDS/2)+1} rounds to beat the AI.</p>
            <Button onClick={() => { setStarted(true); }} className="bg-blue-600 hover:bg-blue-700">Start Race!</Button>
          </div>
        ) : (
          <>
            <div className={`w-full max-w-sm p-8 rounded-2xl border-2 text-center transition-all ${roundResult ? (roundResult.includes('first') ? 'border-green-400 bg-green-500/10' : 'border-red-400 bg-red-500/10') : 'border-white/15 bg-white/5'}`}>
              <p className="text-3xl font-bold text-white">{question.text}</p>
              {roundResult && <p className={`text-sm mt-2 font-bold ${roundResult.includes('first') ? 'text-green-400' : 'text-red-400'}`}>{roundResult}</p>}
              {aiThinking && !roundResult && <p className="text-zinc-500 text-xs mt-2 animate-pulse">🤖 AI is calculating...</p>}
            </div>
            <div className="flex gap-2 w-full max-w-sm">
              <input ref={inputRef} type="number" value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Your answer..." disabled={!!roundResult}
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <Button onClick={submit} size="lg" disabled={!!roundResult} className="bg-blue-600 hover:bg-blue-700 px-5">Go!</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GAME STORE ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const STORE_CATALOG = [
  { id: 'tictactoe' as GameId, name: 'Tic-Tac-Toe',        img: logoTTT, price: 30, desc: 'Classic X vs O against AI',  category: 'vs AI' },
  { id: 'rps' as GameId,       name: 'Rock Paper Scissors', img: logoRPS, price: 15, desc: 'Best of rounds vs clever AI', category: 'vs AI' },
];


// ═══════════════════════════════════════════════════════════════════════════════
// ─── LEADERBOARD STORAGE ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function loadScores(): ScoreEntry[] { try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]'); } catch { return []; } }
function levelMultiplier(level: number): number { return 1 + (level - 1) * 0.5; }
function addScore(gameId: string, gameName: string, rawScore: number, level: number) {
  const score = Math.round(rawScore * levelMultiplier(level));
  const all = loadScores();
  all.push({ id: gameId, game: gameName, score, level, date: new Date().toLocaleDateString() });
  all.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(all.slice(0, 50)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN GAME HUB ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface FiusGamesProps { playerName: string; userId?: string; }

type FreeGameIcon = { Icon: React.ComponentType<{className?: string}>; gradient: string; shadow: string };
const FREE_GAMES: Array<{id: GameId; label: string; icon: FreeGameIcon; logo: string; desc: string; category: string}> = [
  { id: 'memory',  label: 'Memory Match',  logo: logoMemory,  icon: { Icon: Layers,      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.5)'  }, desc: 'Match pairs before time runs out',   category: 'Solo'   },
  { id: 'maths',   label: 'Speed Maths',   logo: logoMaths,   icon: { Icon: Calculator,  gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', shadow: 'rgba(59,130,246,0.5)'  }, desc: 'Solve arithmetic against the clock', category: 'Solo'   },
  { id: 'word',    label: 'Word Scramble', logo: logoWord,    icon: { Icon: BookOpen,    gradient: 'linear-gradient(135deg,#10b981,#34d399)', shadow: 'rgba(16,185,129,0.5)'  }, desc: 'Unscramble hidden words fast',       category: 'Solo'   },
  { id: 'quiz',    label: 'Brain Quiz',    logo: logoQuiz,    icon: { Icon: HelpCircle,  gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', shadow: 'rgba(245,158,11,0.5)'  }, desc: 'Test your general knowledge',        category: 'Solo'   },
  { id: 'car',     label: 'Car Dodge',     logo: logoCar,     icon: { Icon: Zap,         gradient: 'linear-gradient(135deg,#ef4444,#f43f5e)', shadow: 'rgba(239,68,68,0.5)'   }, desc: 'Dodge obstacles at high speed',      category: 'Arcade' },
  { id: 'oddword', label: 'Odd One Out',   logo: logoOddword, icon: { Icon: Shuffle,     gradient: 'linear-gradient(135deg,#ec4899,#a855f7)', shadow: 'rgba(236,72,153,0.5)'  }, desc: "Find the word that doesn't fit",    category: 'Solo'   },
];

export function FiusGames({ playerName, userId }: FiusGamesProps) {
  const [tab, setTab] = useState<'games' | 'store'>('games');
  const [screen, setScreen] = useState<'menu'|'game'>('menu');
  const [activeGame, setActiveGame] = useState<GameId|null>(null);
  const [activeGameLabel, setActiveGameLabel] = useState('');
  const [gameLevel, setGameLevel] = useState(1);
  const [fragments, setFragments] = useState(() => loadFragments());
  const [ownedGames, setOwnedGames] = useState<string[]>(() => loadOwned());
  const [modal, setModal] = useState<'win'|'lose'|'continue'|null>(null);
  const [lastScore, setLastScore] = useState(0);
  const [lastFrags, setLastFrags] = useState(0);
  const [key, setKey] = useState(0);
  const [search, setSearch] = useState('');
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [exitConfirm, setExitConfirm] = useState(false);
  const [selectedGameInfo, setSelectedGameInfo] = useState<{id: GameId; label: string; desc: string; img?: string; logo?: string; icon?: FreeGameIcon; category: string} | null>(null);
  const [globalLeaders, setGlobalLeaders] = useState<Array<{ userId: string; name: string; totalScore: number; bestGame: any | null; gameLevels?: Record<string, number> }>>([]);
  const [lbTimeFilter, setLbTimeFilter] = useState<'day'|'week'|'month'|'all'>('all');
  const [lbCatFilter, setLbCatFilter] = useState<string>('All');

  // ── Load from server on mount + leaderboard polling ───────────────────────
  useEffect(() => {
    loadGamesFromServer().then(data => {
      if (!data) return;
      if (data.ownedGames?.length > 0) { setOwnedGames(data.ownedGames); saveOwned(data.ownedGames); }
      if (data.fragments > 0) { setFragments(data.fragments); saveFragments(data.fragments); }
      if (data.levels && Object.keys(data.levels).length > 0) { saveLevels(data.levels); }
      if (data.scores?.length > 0) {
        localStorage.setItem(SCORES_KEY, JSON.stringify(data.scores));
        setScores(data.scores);
      }
    });
    const fetchLb = () => {
      fetch('/api/games/leaderboard', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then((board: any[]) => { if (Array.isArray(board)) setGlobalLeaders(board); })
        .catch(() => {});
    };
    fetchLb();
    const lbTimer = setInterval(fetchLb, 30000);
    return () => clearInterval(lbTimer);
  }, []);

  // ── Sync helper ───────────────────────────────────────────────────────────
  const doSync = (overrides: {ownedGames?:string[];fragments?:number;scores?:ScoreEntry[]}) => {
    const owned  = overrides.ownedGames ?? ownedGames;
    const frags  = overrides.fragments  ?? fragments;
    const sc     = overrides.scores     ?? scores;
    syncToServer({ ownedGames: owned, fragments: frags, levels: loadLevels(), scores: sc });
  };

  const handleWin = (score: number) => {
    const earned = fragmentsForLevel(gameLevel);
    const newFrags = fragments + earned;
    setFragments(newFrags); saveFragments(newFrags);
    setLastScore(score); setLastFrags(earned);
    let newScores = scores;
    if (activeGame) { addScore(activeGame, activeGameLabel, score, gameLevel); newScores = loadScores(); setScores(newScores); }
    setModal('win');
    doSync({ fragments: newFrags, scores: newScores });
  };
  const handleLose = () => setModal('lose');
  const handleRetry = () => { setModal(null); setKey(k => k + 1); };
  const handleLeave = () => { setModal(null); goToMenu(); };
  const goToMenu = () => { setScreen('menu'); setActiveGame(null); setModal(null); setExitConfirm(false); };

  const handleBuy = (id: string, price: number) => {
    const nf = fragments - price; const no = [...ownedGames, id];
    setFragments(nf); saveFragments(nf); setOwnedGames(no); saveOwned(no);
    doSync({ fragments: nf, ownedGames: no });
  };

  const onStartGame = (id: GameId, label: string) => {
    const lv = getGameLevel(id);
    setActiveGame(id); setActiveGameLabel(label); setGameLevel(lv);
    setScreen('game'); setKey(k => k + 1); setModal(null); setExitConfirm(false);
  };

  const renderGame = () => {
    if (!activeGame) return null;
    const props: GameProps = { playerName, gameLevel, onWin: handleWin, onLose: handleLose, onBack: goToMenu };
    switch (activeGame) {
      case 'maths':       return <FiusMaths key={key} {...props} />;
      case 'word':        return <FiusWord key={key} {...props} />;
      case 'memory':      return <FiusMemory key={key} {...props} />;
      case 'quiz':        return <FiusQuiz key={key} {...props} />;
      case 'car':         return <FiusCar key={key} {...props} />;
      case 'oddword':     return <FiusOddWord key={key} {...props} />;
      case 'tictactoe':   return <TicTacToe key={key} {...props} />;
      case 'hangman':     return <Hangman key={key} {...props} />;
      case 'rps':         return <RockPaperScissors key={key} {...props} />;
      case 'connectfour': return <ConnectFour key={key} {...props} />;
      case 'mastermind':  return <Mastermind key={key} {...props} />;
      case 'wordchain':   return <WordChain key={key} {...props} />;
      case 'truefalse':   return <TrueFalseBlitz key={key} {...props} />;
      case 'speedmath':   return <SpeedMathRace key={key} {...props} />;
      default: return null;
    }
  };

  // ─── GAME SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'game') {
    return (
      <div className="flex flex-col h-full relative">
        {/* Slim game title bar */}
        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-white/10 flex-shrink-0">
          <button onClick={() => setExitConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-medium transition-all">
            ← Exit
          </button>
          <span className="text-zinc-600 text-xs flex-1 truncate">{activeGameLabel} · Level {gameLevel}</span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {renderGame()}
        </div>

        {/* ── Quit confirmation overlay (proper GUI) ── */}
        {exitConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
            <div className="w-72 rounded-3xl text-center overflow-hidden"
              style={{ background: 'linear-gradient(160deg,rgba(18,18,30,0.99),rgba(38,16,58,0.99))', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}>
              <div className="pt-8 px-6 pb-6">
                <div className="text-6xl mb-3">🎮</div>
                <h3 className="text-2xl font-black text-white mb-1">Quit Game?</h3>
                <p className="text-zinc-400 text-sm mb-1">{activeGameLabel}</p>
                <p className="text-zinc-600 text-xs mb-6">Level {gameLevel} · Progress will be lost</p>
                <button onClick={goToMenu}
                  className="w-full py-3.5 mb-2.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', boxShadow: '0 6px 20px rgba(220,38,38,0.45)' }}>
                  🚪 Leave Game
                </button>
                <button onClick={() => setExitConfirm(false)}
                  className="w-full py-3.5 rounded-2xl font-bold text-zinc-200 text-sm transition-all hover:scale-[1.02] active:scale-[0.97]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  🎯 Keep Playing
                </button>
              </div>
              <div className="px-6 pb-5 pt-0">
                <div className="text-zinc-700 text-[10px] font-medium tracking-wide uppercase">Fius Game Zone</div>
              </div>
            </div>
          </div>
        )}

        {modal === 'win' && <WinModal level={gameLevel} score={lastScore} fragsEarned={lastFrags} onContinue={() => setModal('continue')} onLeave={handleLeave} />}
        {modal === 'lose' && <LoseModal level={gameLevel} onRetry={handleRetry} onLeave={handleLeave} />}
        {modal === 'continue' && <ContinueModal nextLevel={gameLevel + 1} onYes={() => { const nextLv = gameLevel + 1; if (activeGame) persistGameLevel(activeGame, nextLv); setGameLevel(nextLv); setModal(null); setKey(k => k + 1); doSync({}); }} onNo={() => { setModal(null); goToMenu(); }} />}
      </div>
    );
  }

  // ─── MENU SCREEN ──────────────────────────────────────────────────────────
  const filteredFree = FREE_GAMES.filter(g =>
    !search || g.label.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase())
  );
  const myPurchased = STORE_CATALOG.filter(g => ownedGames.includes(g.id)).filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase())
  );
  const storeAvail = STORE_CATALOG.filter(g => !ownedGames.includes(g.id));

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 max-w-2xl w-full mx-auto">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Fius Game Zone</h2>
          <p className="text-muted-foreground text-[11px] mt-0.5">{playerName} · Win games · Earn fragments</p>
        </div>
        <FragmentBadge count={fragments} />
      </div>

      {/* ── Tab switcher: Games / Store — unified sliding bar ── */}
      <div className="mb-4 flex-shrink-0 max-w-2xl w-full mx-auto">
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(128,128,128,0.12)', borderRadius: 14, padding: 3 }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: `calc(${tab === 'store' ? 1 : 0} * (100% / 2) + 3px)`,
            width: 'calc(100% / 2 - 6px)',
            background: '#fff',
            borderRadius: 11,
            boxShadow: '0 1px 6px rgba(0,0,0,0.13)',
            transition: 'left 0.28s cubic-bezier(0.23, 1, 0.32, 1)',
            pointerEvents: 'none',
          }} />
          <button onClick={() => setTab('games')} style={{
            flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
            background: 'transparent', borderRadius: 11, fontSize: 12, fontWeight: 700,
            color: tab === 'games' ? '#111' : 'rgba(128,128,128,0.65)',
            position: 'relative', zIndex: 1, transition: 'color 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <Gamepad2 size={13} />Games
          </button>
          <button onClick={() => setTab('store')} style={{
            flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
            background: 'transparent', borderRadius: 11, fontSize: 12, fontWeight: 700,
            color: tab === 'store' ? '#111' : 'rgba(128,128,128,0.65)',
            position: 'relative', zIndex: 1, transition: 'color 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <ShoppingBag size={13} />Store
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto w-full">

        {/* ── GAMES TAB ── */}
        {tab === 'games' && (
          <div className="flex flex-col gap-5">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search games…"
                className="w-full pl-9 pr-4 py-2 rounded-full text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                style={{ background: 'rgba(128,128,128,0.10)', border: '1px solid rgba(128,128,128,0.18)' }}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>

            {/* Free games — responsive grid */}
            <div>
              <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2.5">Free Games</div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {FREE_GAMES.map(g => (
                  <button key={g.id}
                    onClick={() => setSelectedGameInfo({ id: g.id, label: g.label, desc: g.desc, logo: g.logo, icon: g.icon, category: g.category })}
                    className="group transition-all duration-150 active:scale-90 flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square max-w-[88px] mx-auto">
                      <img src={g.logo} alt={g.label}
                        className="w-full h-full rounded-full object-cover group-hover:brightness-110 transition-all" />
                    </div>
                    <span className="text-muted-foreground text-[9px] font-semibold leading-tight text-center truncate w-full">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Owned Games — responsive grid (only if purchased) */}
            {myPurchased.length > 0 && (
              <div>
                <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2.5">Owned Games</div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {myPurchased.map(g => (
                    <button key={g.id}
                      onClick={() => setSelectedGameInfo({ id: g.id, label: g.name, desc: g.desc, img: g.img, category: g.category })}
                      className="group transition-all duration-150 active:scale-90 flex flex-col items-center gap-1.5 relative">
                      <div className="relative w-full aspect-square max-w-[88px] mx-auto">
                        <img src={g.img} alt={g.name}
                          className="w-full h-full rounded-full object-cover group-hover:brightness-110 transition-all"
                          onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      </div>
                      <span className="text-muted-foreground text-[9px] font-semibold leading-tight text-center truncate w-full">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── LEADERBOARD ── reference-match premium podium */}
            {(() => {
              const CAT_TABS = ['All', 'Mem', 'Math', 'Word', 'Quiz', 'Car', 'Odd', 'TTT', 'RPS'];
              const CAT_TO_GAME: Record<string, string> = { Mem: 'memory', Math: 'maths', Word: 'word', Quiz: 'quiz', Car: 'car', Odd: 'oddword', TTT: 'tictactoe', RPS: 'rps' };
              const catIdx = CAT_TABS.indexOf(lbCatFilter);

              // Compute per-leader score for active filter
              const getScore = (l: typeof globalLeaders[0]) =>
                lbCatFilter === 'All'
                  ? l.totalScore
                  : l.gameLevels?.[CAT_TO_GAME[lbCatFilter]] || 0;

              // Filtered + re-sorted leaders
              const leaders = [...globalLeaders]
                .map(l => ({ ...l, filteredScore: getScore(l) }))
                .filter(l => l.filteredScore > 0)
                .sort((a, b) => b.filteredScore - a.filteredScore)
                .slice(0, 10);

              const top3 = leaders.slice(0, 3);

              // slot[0]=silver(#2 left), slot[1]=gold(#1 center), slot[2]=bronze(#3 right)
              const podSlots = [
                { leader: top3[1] ?? null, rank: 2 },
                { leader: top3[0] ?? null, rank: 1 },
                { leader: top3[2] ?? null, rank: 3 },
              ] as const;

              const meUserRank = leaders.findIndex(l => l.userId === userId);
              const meInTop    = meUserRank !== -1;
              const myLevels   = loadLevels();
              const myFilteredScore = lbCatFilter === 'All'
                ? Object.values(myLevels).reduce((s, v) => s + (Number(v) || 0), 0)
                : myLevels[CAT_TO_GAME[lbCatFilter]] || 0;

              // Text overlay positions on the podium image (% of container width/height)
              // slot[0]=silver left, slot[1]=gold center, slot[2]=bronze right
              const podTextPos = [
                { cx: '17%', cy: '74%', scoreSz: 11, nameSz: 8.5 },  // silver #2 — moved down
                { cx: '50%', cy: '54%', scoreSz: 14, nameSz: 9.5 },  // gold #1
                { cx: '81%', cy: '73%', scoreSz: 10, nameSz: 8 },    // bronze #3 — moved down
              ];

              return (
                <div style={{ background: 'linear-gradient(180deg, #6e6e6e 0%, #2e2e2e 40%, #111111 75%, #000000 100%)', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>

                  {/* ── Header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: -0.3 }}>Leaderboard</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ALL TIME</span>
                  </div>

                  {/* ── Category segmented bar (unified + sliding animation) ── */}
                  <div style={{ padding: '0 14px 14px' }}>
                    <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3, overflow: 'hidden' }}>
                      {/* Sliding active indicator */}
                      <div style={{
                        position: 'absolute',
                        top: 3, bottom: 3,
                        left: `calc(${catIdx} * (100% / ${CAT_TABS.length}) + 3px)`,
                        width: `calc(100% / ${CAT_TABS.length} - 6px)`,
                        background: 'rgba(255,255,255,0.92)',
                        borderRadius: 9,
                        transition: 'left 0.28s cubic-bezier(0.23, 1, 0.32, 1)',
                        pointerEvents: 'none',
                      }} />
                      {CAT_TABS.map((cat, i) => (
                        <button key={cat} onClick={() => setLbCatFilter(cat)} style={{
                          flex: 1, padding: '6px 0', border: 'none', cursor: 'pointer',
                          background: 'transparent', borderRadius: 9,
                          fontSize: 10, fontWeight: 700,
                          color: lbCatFilter === cat ? '#111' : 'rgba(255,255,255,0.5)',
                          position: 'relative', zIndex: 1,
                          transition: 'color 0.2s',
                        }}>{cat}</button>
                      ))}
                    </div>
                  </div>

                  {/* ── Podium area ── */}
                  <div style={{ position: 'relative', background: 'transparent', padding: '0 10px', overflow: 'hidden', marginBottom: 0, lineHeight: 0 }}>

                    {/* Light rays — fan out from bottom-centre behind platforms */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {[-75,-57,-40,-24,-10,0,10,24,40,57,75].map((angle, ri) => (
                        <div key={ri} style={{
                          position: 'absolute', bottom: 0, left: '50%', width: Math.abs(angle) < 15 ? 4 : 2,
                          height: '130%', transformOrigin: 'bottom center',
                          transform: `translateX(-50%) rotate(${angle}deg)`,
                          background: Math.abs(angle) < 12
                            ? 'linear-gradient(to top, rgba(251,191,36,0.22), rgba(251,191,36,0.04), transparent)'
                            : 'linear-gradient(to top, rgba(251,191,36,0.10), rgba(251,191,36,0.02), transparent)',
                        }} />
                      ))}
                    </div>

                    {/* Radial glow behind #1 */}
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, pointerEvents: 'none',
                      background: 'radial-gradient(ellipse at 50% 90%, rgba(251,191,36,0.22) 0%, transparent 65%)', filter: 'blur(18px)' }} />

                    {/* Podium image + text overlays */}
                    <div style={{ position: 'relative', width: '100%' }}>
                      {/* The 3D podium image */}
                      <img
                        src="/podium-bars.png"
                        alt="podium"
                        style={{ width: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none', marginBottom: 0, verticalAlign: 'bottom' }}
                      />

                      {/* Text overlays — score + name on each bar */}
                      {podSlots.map((slot, si) => {
                        const pos = podTextPos[si];
                        const isMe = slot.leader?.userId === userId;
                        return (
                          <div key={`pod-txt-${slot.rank}`} style={{
                            position: 'absolute',
                            left: pos.cx,
                            top: pos.cy,
                            transform: 'translateX(-50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            pointerEvents: 'none',
                            zIndex: 10,
                          }}>
                            {slot.leader ? (
                              <>
                                <span style={{
                                  color: '#fff', fontWeight: 900, fontSize: pos.scoreSz,
                                  lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {(slot.leader as any).filteredScore?.toLocaleString() ?? slot.leader.totalScore.toLocaleString()}
                                </span>
                                <span style={{
                                  color: 'rgba(255,255,255,0.92)', fontWeight: 700,
                                  fontSize: pos.nameSz, textAlign: 'center',
                                  lineHeight: 1.25, marginTop: 2,
                                  textShadow: '0 1px 5px rgba(0,0,0,0.8)',
                                  maxWidth: 70, wordBreak: 'break-word',
                                }}>
                                  {slot.leader.name}{isMe ? ' ✦' : ''}
                                </span>
                              </>
                            ) : (
                              <span style={{
                                color: 'rgba(255,255,255,0.55)', fontWeight: 900,
                                fontSize: pos.scoreSz, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                              }}>—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Your score row at the bottom — flush, no gap ── */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
                      borderLeft: '3px solid #6366f1',
                    }}>
                      <span style={{ color: '#818cf8', fontSize: 11, fontWeight: 800, width: 26, flexShrink: 0 }}>
                        #{meInTop ? meUserRank + 1 : '—'}
                      </span>
                      <span style={{ flex: 1, color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {playerName}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: '#4f46e5', color: '#fff', fontSize: 9, fontWeight: 900, flexShrink: 0, letterSpacing: 0.3 }}>You</span>
                      <span style={{ color: '#818cf8', fontWeight: 800, fontSize: 13, flexShrink: 0, minWidth: 24, textAlign: 'right' as const }}>{myFilteredScore}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}


        {/* ── STORE TAB ── */}
        {tab === 'store' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Premium Games</span>
              <span className="text-zinc-600 text-[10px] flex items-center gap-1">
                <img src={imgCoins} alt="" className="w-3.5 h-3.5" />
                <span className="text-blue-400 font-bold">{fragments}</span> fragments
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {STORE_CATALOG.map(game => {
                const owned = ownedGames.includes(game.id);
                const canAfford = fragments >= game.price;
                return (
                  <div key={game.id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        if (owned) {
                          setSelectedGameInfo({ id: game.id, label: game.name, desc: game.desc, img: game.img, category: game.category });
                        } else if (canAfford) {
                          handleBuy(game.id, game.price);
                        }
                      }}
                      disabled={!owned && !canAfford}
                      className="flex flex-col items-center gap-0 group w-full transition-all duration-200 active:scale-95 disabled:opacity-50">
                      <div className="w-20 h-20 rounded-full overflow-hidden relative transition-all duration-200 group-hover:scale-110 flex-shrink-0"
                        style={{
                          border: owned ? '2.5px solid rgba(16,185,129,0.7)' : canAfford ? '2.5px solid rgba(59,130,246,0.6)' : '2.5px solid rgba(255,255,255,0.15)',
                          boxShadow: owned ? '0 0 18px rgba(16,185,129,0.3)' : canAfford ? '0 6px 20px rgba(59,130,246,0.3)' : '0 6px 20px rgba(0,0,0,0.5)'
                        }}>
                        <img src={game.img} alt={game.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        {!owned && !canAfford && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <Lock size={16} className="text-zinc-400" />
                          </div>
                        )}
                        {owned && (
                          <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.95)' }}>
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-1.5">
                        <div className="text-white font-bold text-[11px] leading-tight truncate max-w-[72px]">{game.name}</div>
                        {owned ? (
                          <div className="text-[9px] text-emerald-500 font-bold mt-0.5">Tap to play</div>
                        ) : canAfford ? (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <img src={imgCoins} alt="" className="w-2.5 h-2.5" />
                            <span className="text-[9px] text-blue-400 font-bold">{game.price}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <img src={imgCoins} alt="" className="w-2.5 h-2.5" />
                            <span className="text-[9px] text-zinc-600 font-bold">{game.price}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        </div>{/* end max-w-2xl wrapper */}
      </div>

      {/* ── Game Info Modal ── */}
      {selectedGameInfo && (
        <>
          {/* Full-screen blur overlay — fixed so it covers the entire page */}
          <div className="fixed inset-0 z-[998] backdrop-blur-md bg-black/30" onClick={() => setSelectedGameInfo(null)} />
          {/* Card centered over the full screen */}
          <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-[280px] mx-4 rounded-3xl overflow-hidden flex flex-col items-center text-center border border-border shadow-2xl pointer-events-auto bg-card"
            onClick={e => e.stopPropagation()}>
            <div className="pt-8 pb-0 flex flex-col items-center">
              <div className="w-28 h-28 rounded-full overflow-hidden">
                <img
                  src={selectedGameInfo.logo ?? selectedGameInfo.img}
                  alt={selectedGameInfo.label}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pt-4 pb-6 w-full">
              <h3 className="text-xl font-black text-foreground mb-1 tracking-tight">{selectedGameInfo.label}</h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3 bg-accent text-accent-foreground">
                {selectedGameInfo.category}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{selectedGameInfo.desc}</p>
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-muted-foreground text-xs">Your level:</span>
                <LevelBadge level={getGameLevel(selectedGameInfo.id)} />
              </div>
              <button
                onClick={() => { onStartGame(selectedGameInfo.id, selectedGameInfo.label); setSelectedGameInfo(null); }}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.97] mb-2"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                ▶ Play Game
              </button>
              <button
                onClick={() => setSelectedGameInfo(null)}
                className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors bg-accent/50">
                Close
              </button>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
