import { useState, useEffect, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { playTabClick } from "@/lib/appearance-settings";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, BookOpen, Gamepad2, ChevronRight, ChevronLeft, Star, Layers, Zap, Car, HelpCircle, Shuffle, X } from "lucide-react";
// Game logos — new high-quality versions
const memoryBanner = '/game-memory-banner.png';
const memoryLogo   = '/game-memory-logo.png';
const mathsBanner  = '/game-maths-banner.png';
const logoMaths    = '/game-maths-logo.png';
const wordBanner   = '/game-word-banner.png';
const logoWord     = '/game-word-logo.png';
const quizBanner   = '/game-quiz-banner.png';
const logoQuiz     = '/game-quiz-logo.png';
const carBanner    = '/game-car-banner.png';
const logoCar      = '/game-car-logo.png';
const oddwordBanner = '/game-oddword-banner.png';
const logoOddword  = '/game-oddword-logo.png';
const logoRPS     = '/game-rps.png';
const logoTTT     = '/game-tictactoe.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'maths' | 'word' | 'memory' | 'quiz' | 'car' | 'oddword'
            | 'tictactoe' | 'hangman' | 'rps' | 'connectfour' | 'mastermind'
            | 'wordchain' | 'truefalse' | 'speedmath';

interface GameProps { playerName: string; gameLevel: number; onWin: (score: number) => void; onLose: () => void; onBack: () => void; paused?: boolean; }
interface ScoreEntry { id: string; game: string; score: number; level: number; date: string; }

// ─── Progress Storage (localStorage fallback) ────────────────────────────────
const LEVEL_KEY  = 'blinga_game_levels_v2';
const SCORES_KEY = 'blinga_scores_v2';

function loadLevels(): Record<string, number> { try { return JSON.parse(localStorage.getItem(LEVEL_KEY) || '{}'); } catch { return {}; } }
function saveLevels(l: Record<string, number>) { localStorage.setItem(LEVEL_KEY, JSON.stringify(l)); }
function getGameLevel(id: string): number { const l = loadLevels(); return l[id] || 1; }
function persistGameLevel(id: string, lv: number) { const l = loadLevels(); l[id] = lv; saveLevels(l); }

// ─── Server Sync ───────────────────────────────────────────────────────────────
async function loadGamesFromServer(): Promise<{levels:Record<string,number>;scores:ScoreEntry[]}|null> {
  try {
    const r = await fetch('/api/games/data');
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
let _syncTimer: ReturnType<typeof setTimeout>|null = null;
function syncToServer(data: {levels:Record<string,number>;scores:ScoreEntry[]}) {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    fetch('/api/games/data', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }).catch(() => {});
  }, 400);
}

// ─── Level Difficulty Mapping ─────────────────────────────────────────────────
function getDifficulty(lv: number): 'easy' | 'medium' | 'hard' {
  if (lv <= 4) return 'easy';
  if (lv <= 9) return 'medium';
  return 'hard';
}
// Rounds grow slowly: +1 per 4 levels, cap at base+5
function getRounds(lv: number, base: number): number { return Math.min(base + Math.floor(lv / 4), base + 5); }
// Timer: starts generous, loses ~1s every 4 levels, floor at 55% of base or 8s (whichever is higher)
function getTimer(lv: number, baseTime: number): number {
  return Math.max(Math.round(baseTime * 0.55), baseTime - Math.floor(lv / 4));
}
// Memory-specific: pairs grow 1 per 2 levels (4→10), time from 80s down to 30s floor
function getMemoryConfig(lv: number): { pairs: number; time: number } {
  const pairs = Math.min(4 + Math.floor(lv / 2), 10);
  const time  = Math.max(30, 80 - lv * 3);
  return { pairs, time };
}

// ─── Question History (anti-repeat for 25 games) ─────────────────────────────
const MAX_Q_HIST = 130; // 25 games × ~5 questions
function qHistKey(game: string, diff: string) { return `blinga_qhist_${game}_${diff}`; }
function getQHistory(game: string, diff: string): string[] {
  try { return JSON.parse(localStorage.getItem(qHistKey(game, diff)) || '[]'); } catch { return []; }
}
function addToQHistory(game: string, diff: string, fingerprints: string[]) {
  const hist = [...getQHistory(game, diff), ...fingerprints].slice(-MAX_Q_HIST);
  localStorage.setItem(qHistKey(game, diff), JSON.stringify(hist));
}
function filterByQHistory<T>(pool: T[], hist: string[], fingerprint: (item: T) => string): T[] {
  const histSet = new Set(hist);
  const fresh = pool.filter(item => !histSet.has(fingerprint(item).slice(0, 45)));
  return fresh.length >= 3 ? fresh : pool; // if pool depleted, allow reuse
}

// ─── AI Question Fetcher ──────────────────────────────────────────────────────
async function fetchAIQuestions(game: string, difficulty: string, count: number, exclude: string[]): Promise<any[]> {
  try {
    const res = await fetch('/api/games/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, difficulty, count, exclude: exclude.slice(-30) }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.questions) ? data.questions : [];
  } catch { return []; }
}

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

// ─── Memory Card Symbols — minimal geometric SVG paths ───────────────────────
const CARD_SYMBOLS: string[][] = [
  ['M12 2a10 10 0 100 20A10 10 0 0012 2z'],                                           // Circle
  ['M12 3L2 21h20z'],                                                                  // Triangle
  ['M12 2L2 12l10 10 10-10z'],                                                         // Diamond
  ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'], // Star
  ['M12 2l8.66 5v10L12 22l-8.66-5V7z'],                                               // Hexagon
  ['M12 5v14', 'M5 12h14'],                                                            // Plus
  ['M6 6l12 12', 'M18 6L6 18'],                                                       // Cross X
  ['M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'], // Heart
  ['M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'],                                    // Moon
  ['M13 2L3 14h9l-1 8 10-12h-9z'],                                                    // Lightning
  ['M12 12c-2-2.5-4-4-6-4a4 4 0 000 8c2 0 4-1.5 6-4z', 'M12 12c2 2.5 4 4 6 4a4 4 0 000-8c-2 0-4 1.5-6 4z'], // Infinity
  ['M12 19V5', 'M5 12l7-7 7 7'],                                                      // Arrow up
  ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 100 6 3 3 0 000-6z'], // Eye
  ['M2 19h20', 'M5 19V9l7-6 7 6v10'],                                                // Crown
  ['M12 2l9.5 6.9-3.6 11.1H6.1L2.5 8.9z'],                                           // Pentagon
  ['M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z'],                        // Octagon
  ['M2 12c2-5 5-5 7 0s5 5 7 0 5-5 6 0'],                                             // Wave
  ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 7a5 5 0 100 10A5 5 0 0012 7z', 'M12 10a2 2 0 100 4 2 2 0 000-4z'], // Target
  ['M17 8C8 10 5.9 16.17 3.82 22c0 0 3.63-1 7.18-3.32C14 16.67 17 12 17 8z'],      // Leaf
  ['M5 2h14', 'M5 22h14', 'M5 2c0 7 7 10 7 10s7-3 7-10', 'M5 22c0-7 7-10 7-10s7 3 7 10'], // Hourglass
];

// ─── Per-game accent colour for countdown GO! ─────────────────────────────────
const GAME_ACCENT_COLOR: Record<string, string> = {
  memory:  '#f59e0b',
  maths:   '#84cc16',
  word:    '#60a5fa',
  quiz:    '#f472b6',
  car:     '#c084fc',
  oddword: '#fb7185',
};

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
function TimerBar({ timeLeft, total, accent = '#60a5fa' }: { timeLeft: number; total: number; accent?: string }) {
  const pct = Math.max(0, (timeLeft / total) * 100);
  const danger = pct <= 28;
  return (
    <div className="w-full flex-shrink-0 mb-2" style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 99,
          background: danger
            ? 'linear-gradient(90deg,#ef4444,#f97316)'
            : accent,
          transition: 'width 1s linear, background 0.4s ease',
          boxShadow: danger ? '0 0 8px rgba(239,68,68,0.6)' : `0 0 8px ${accent}60`,
        }}
      />
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

// ─── Level Badge (compact pill used inside games) ──────────────────────────────
function LevelBadge({ level }: { level: number }) {
  const diff = getDifficulty(level);
  const dotColor: Record<string, string> = { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' };
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor[diff] }} />
      <span className="text-[11px] font-bold text-white/75 tabular-nums tracking-wide">LV {level}</span>
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
function WinModal({ level, score, onContinue, onLeave }: { level: number; score: number; onContinue: () => void; onLeave: () => void; }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#0f0f1a,#111827)', border: '1px solid rgba(251,191,36,0.30)' }}>
        {/* gold accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b)' }} />
        <div className="p-6 text-center">
          {/* trophy SVG */}
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)', border: '1.5px solid rgba(251,191,36,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M6 9H4a2 2 0 00-2 2v1a4 4 0 004 4h1"/><path d="M18 9h2a2 2 0 012 2v1a4 4 0 01-4 4h-1"/>
                <path d="M6 2h12v10a6 6 0 01-12 0V2z"/><path d="M9 21h6"/><path d="M12 17v4"/>
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-400/70 mb-1">Level Complete</p>
          <h3 className="text-2xl font-black text-white mb-1">Level {level} ✦</h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-3 h-3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-xs font-bold text-yellow-300">{score.toLocaleString()} pts</span>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={onContinue}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff' }}>
              <span>Level {level + 1}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button onClick={onLeave} className="w-full py-2.5 rounded-xl font-semibold text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.10)' }}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lose Modal ────────────────────────────────────────────────────────────────
function LoseModal({ level, onRetry, onLeave }: { level: number; onRetry: () => void; onLeave: () => void; }) {
  const msgs = [
    "So close! One more attempt and it's yours.",
    "Every expert started exactly where you are now.",
    "The best players retry — you've got this.",
    `Level ${level} isn't done with you yet. Fight back!`,
    "A stumble forward is still progress. Retry!",
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#0f0f1a,#111827)', border: '1px solid rgba(168,85,247,0.30)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed)' }} />
        <div className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.12)', border: '1.5px solid rgba(168,85,247,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                <path d="M12 8v4l2 2"/><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M21 3v5h-5"/>
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(168,85,247,0.7)' }}>Not Yet</p>
          <h3 className="text-xl font-black text-white mb-2">Keep Going!</h3>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{msg}</p>
          <div className="flex flex-col gap-2">
            <button onClick={onRetry}
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Retry Level {level}
            </button>
            <button onClick={onLeave} className="w-full py-2.5 rounded-xl font-semibold text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.10)' }}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Continue Modal ────────────────────────────────────────────────────────────
function ContinueModal({ nextLevel, onYes, onNo }: { nextLevel: number; onYes: () => void; onNo: () => void; }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#0f0f1a,#111827)', border: '1px solid rgba(59,130,246,0.30)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#1d4ed8,#60a5fa,#1d4ed8)' }} />
        <div className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
                <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M15 12v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(96,165,250,0.7)' }}>Up Next</p>
          <h3 className="text-xl font-black text-white mb-2">Level {nextLevel}</h3>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Harder questions, tighter timer — ready?</p>
          <div className="flex gap-3">
            <button onClick={onYes} className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-95" style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
              Let's Go
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button onClick={onNo} className="flex-1 py-3 rounded-xl font-semibold text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.10)' }}>
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLINGA MATHS ──────────────────────────────────────────────────────────────
function BlingaMaths({ gameLevel, onWin, onLose, onBack, paused = false }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const ROUNDS = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 12);
  // Difficulty configs — numbers scale with level, ops unlock gradually
  const cfg = {
    easy:   { maxA: 10 + gameLevel * 2, maxB: 10 + gameLevel * 2, ops: ['+', '-'] },
    medium: { maxA: 20 + gameLevel * 3, maxB: 20 + gameLevel * 3, ops: ['+', '-', '×'] },
    hard:   { maxA: 30 + gameLevel * 5, maxB: 30 + gameLevel * 5, ops: ['+', '-', '×', '÷'] },
  }[diff];
  const ACCENT = '#84cc16';
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|'timeout'|null>(null);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState({ text: '', correct: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const newQuestion = useCallback(() => {
    const op = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
    let a: number, b: number, ans: number;
    if (op === '+') { a = Math.floor(Math.random() * cfg.maxA) + 1; b = Math.floor(Math.random() * cfg.maxB) + 1; ans = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * cfg.maxA) + 10; b = Math.floor(Math.random() * Math.min(a, cfg.maxA)); ans = a - b; }
    else if (op === '×') { a = Math.floor(Math.random() * Math.min(12, gameLevel + 3)) + 1; b = Math.floor(Math.random() * Math.min(12, gameLevel + 3)) + 1; ans = a * b; }
    else { a = Math.floor(Math.random() * 9) + 2; b = a * (Math.floor(Math.random() * 9) + 2); ans = b / a; [a, b] = [b, a]; }
    setQuestion({ text: `${a} ${op} ${b} = ?`, correct: ans });
    setAnswer(''); setTimeLeft(Q_TIME);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cfg, Q_TIME, gameLevel]);

  useEffect(() => { newQuestion(); }, []);

  useEffect(() => {
    if (paused || feedback) return;
    if (timeLeft === 0) { setStreak(0); setFeedback('timeout'); doAdvance(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, paused]);

  const doAdvance = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setFeedback(null);
      const next = round + 1;
      if (next >= ROUNDS) {
        if (correctRef.current >= Math.ceil(ROUNDS * 0.6)) onWin(scoreRef.current);
        else onLose();
      } else { setRound(next); newQuestion(); }
    }, 900);
  };

  const submit = () => {
    if (feedback) return;
    const val = parseInt(answer);
    if (isNaN(val)) return;
    if (val === question.correct) {
      const ns = streak + 1;
      const pts = 10 + (ns >= 3 ? 10 : 0) + Math.max(0, timeLeft - 3) * 2;
      scoreRef.current += pts; setScore(scoreRef.current);
      correctRef.current++;
      setStreak(ns); setFeedback('correct');
    } else { setStreak(0); setFeedback('wrong'); }
    doAdvance();
  };

  const urgent = timeLeft <= 5 && !feedback;

  return (
    <div className="flex flex-col h-full gap-2.5 px-1">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <LevelBadge level={gameLevel} />
        <div className="flex items-center gap-1.5">
          {streak >= 3 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)' }}>
              <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-3 h-3"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
              <span className="text-[11px] font-bold text-yellow-300">{streak}x</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2.5 2.5"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{Math.min(round+1,ROUNDS)}<span className="opacity-40">/{ROUNDS}</span></span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="#84cc16" className="w-3 h-3 opacity-80"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors" style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${urgent ? 'text-red-400' : 'opacity-50'}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            <span className={`text-[11px] font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-foreground'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      <TimerBar timeLeft={timeLeft} total={Q_TIME} accent="#84cc16" />

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-sm">
          {/* Question card */}
          <div className="text-center rounded-2xl p-8 mb-5 transition-all duration-200"
            style={{
              background: feedback === 'correct' ? 'rgba(132,204,22,0.10)' : feedback === 'wrong' || feedback === 'timeout' ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${feedback === 'correct' ? 'rgba(132,204,22,0.45)' : feedback === 'wrong' || feedback === 'timeout' ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.09)'}`,
            }}>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>Speed Maths</p>
            <p className="text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>{question.text || '…'}</p>
            {feedback === 'correct' && <p className="text-xs font-bold mt-2" style={{ color: ACCENT }}>✓ Correct{streak >= 3 ? ` · ${streak}× streak!` : ''}</p>}
            {feedback === 'wrong'   && <p className="text-xs font-bold text-red-400 mt-2">✗ Answer was {question.correct}</p>}
            {feedback === 'timeout' && <p className="text-xs font-bold text-orange-400 mt-2">Time's up — answer was {question.correct}</p>}
          </div>
          {/* Input row — type=text + inputMode=numeric kills browser +/- spinner arrows */}
          <div className="flex gap-2">
            <style>{`input.blinga-num::-webkit-outer-spin-button,input.blinga-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input.blinga-num{-moz-appearance:textfield}`}</style>
            <input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9-]*" value={answer}
              onChange={e => { const v = e.target.value; if (/^-?\d*$/.test(v)) setAnswer(v); }}
              onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your answer…"
              className="blinga-num flex-1 rounded-xl px-4 py-3 text-lg text-center font-bold text-white focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${feedback ? 'rgba(255,255,255,0.06)' : 'rgba(132,204,22,0.30)'}`, caretColor: ACCENT }}
              disabled={!!feedback} />
            <button onClick={submit} disabled={!!feedback || !answer.trim()}
              className="px-5 rounded-xl font-black text-sm text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg,#4d7c0f,${ACCENT})`, minWidth: 64 }}>
              Go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLINGA WORD ───────────────────────────────────────────────────────────────
function BlingaWord({ gameLevel, onWin, onLose, onBack, paused = false }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const ROUNDS = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 14);
  const staticPool = { easy: WORD_EASY, medium: WORD_MEDIUM, hard: WORD_HARD }[diff];
  const noHints = diff === 'hard';
  const ACCENT = '#3b82f6';

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|'timeout'|null>(null);
  const [words, setWords] = useState<{word:string;hint:string}[]>([]);
  const [scrambled, setScrambled] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const [qLoading, setQLoading] = useState(true);
  const correctRef = useRef(0);
  const scoreRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // blue tile gradient pairs per letter position
  const tileGrads = [
    'linear-gradient(135deg,#1d4ed8,#3b82f6)','linear-gradient(135deg,#5b21b6,#7c3aed)',
    'linear-gradient(135deg,#0e7490,#0891b2)','linear-gradient(135deg,#166534,#16a34a)',
    'linear-gradient(135deg,#1d4ed8,#60a5fa)','linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#0e7490,#38bdf8)','linear-gradient(135deg,#9a3412,#ea580c)',
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadQuestions() {
      const hist = getQHistory('word', diff);
      const aiQs = await fetchAIQuestions('word', diff, ROUNDS + 3, hist.slice(-30));
      if (cancelled) return;
      let picked: {word:string;hint:string}[];
      if (aiQs.length >= ROUNDS && aiQs.every((q: any) => q.word && q.hint)) {
        const normalized = aiQs.map((q: any) => ({ word: String(q.word).toUpperCase().trim(), hint: String(q.hint) }));
        addToQHistory('word', diff, normalized.slice(0, ROUNDS).map(q => q.word));
        picked = normalized.slice(0, ROUNDS);
      } else {
        const fresh = filterByQHistory(staticPool, hist, w => w.word);
        picked = shuffleArray(fresh).slice(0, ROUNDS);
        addToQHistory('word', diff, picked.map(q => q.word));
      }
      setWords(picked);
      setScrambled(scramble(picked[0].word));
      setQLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
    loadQuestions();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (paused || feedback || !words.length || qLoading) return;
    if (timeLeft === 0) { setFeedback('timeout'); doAdvance(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, words, paused, qLoading]);

  const doAdvance = () => {
    setTimeout(() => {
      setFeedback(null); setShowHint(false); setAnswer('');
      const next = round + 1;
      if (next >= ROUNDS) {
        if (correctRef.current >= Math.ceil(ROUNDS * 0.6)) onWin(scoreRef.current); else onLose();
      } else { setRound(next); setScrambled(scramble(words[next].word)); setTimeLeft(Q_TIME); setTimeout(() => inputRef.current?.focus(), 50); }
    }, 1000);
  };

  const submit = () => {
    if (feedback || !words[round]) return;
    const isCorrect = answer.toUpperCase().trim() === words[round].word;
    if (isCorrect) { const pts = (showHint ? 6 : 12) + Math.max(0, timeLeft - 4) * 2; scoreRef.current += pts; setScore(scoreRef.current); correctRef.current++; }
    setFeedback(isCorrect ? 'correct' : 'wrong');
    doAdvance();
  };

  const urgent = timeLeft <= 5 && !feedback;

  if (qLoading) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3">
      <div className="w-7 h-7 rounded-full" style={{ border: '2.5px solid rgba(59,130,246,0.25)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Generating words…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-2.5 px-1">
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <LevelBadge level={gameLevel} />
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{Math.min(round+1,ROUNDS)}<span className="opacity-40">/{ROUNDS}</span></span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="#3b82f6" className="w-3 h-3 opacity-80"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors" style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${urgent ? 'text-red-400' : 'opacity-50'}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            <span className={`text-[11px] font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-foreground'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} accent="#60a5fa" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl p-5 mb-4 text-center transition-all duration-200"
            style={{
              background: feedback === 'correct' ? 'rgba(59,130,246,0.10)' : feedback ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${feedback === 'correct' ? 'rgba(59,130,246,0.45)' : feedback ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.09)'}`,
            }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: `${ACCENT}80` }}>Unscramble the word</p>
            {/* Scrambled letter tiles */}
            <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
              {scrambled.split('').map((l, i) => (
                <div key={i} className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white shadow-lg" style={{ background: tileGrads[i % tileGrads.length] }}>{l}</div>
              ))}
            </div>
            {showHint && <p className="text-xs italic mb-1" style={{ color: 'rgba(255,255,255,0.50)' }}>Hint: {words[round]?.hint}</p>}
            {feedback === 'correct' && <p className="text-xs font-bold mt-1" style={{ color: ACCENT }}>✓ Correct!</p>}
            {feedback === 'wrong'   && <p className="text-xs font-bold text-red-400 mt-1">✗ Was: {words[round]?.word}</p>}
            {feedback === 'timeout' && <p className="text-xs font-bold text-orange-400 mt-1">Time's up — was: {words[round]?.word}</p>}
          </div>
          <div className="flex gap-2 mb-2">
            <input ref={inputRef} type="text" value={answer} onChange={e => setAnswer(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && !feedback && submit()}
              placeholder="Your answer…" maxLength={14} disabled={!!feedback}
              className="flex-1 rounded-xl px-4 py-3 text-base text-center font-black text-white uppercase tracking-widest focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${feedback ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.30)'}`, caretColor: ACCENT }} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={!!feedback || !answer.trim()}
              className="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg,#1d4ed8,${ACCENT})` }}>Submit</button>
            {!noHints && !showHint && !feedback && (
              <button onClick={() => setShowHint(true)}
                className="px-4 py-3 rounded-xl font-bold text-xs transition-all hover:brightness-110"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: ACCENT }}>
                Hint
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLINGA MEMORY ─────────────────────────────────────────────────────────────
interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }
function BlingaMemory({ gameLevel, onWin, onLose, onBack, paused = false }: GameProps) {
  const { pairs: pairCount, time: totalTime } = getMemoryConfig(gameLevel);
  const cols = pairCount >= 8 ? 5 : 4;
  const [symbols] = useState(() => shuffleArray([...Array(CARD_SYMBOLS.length).keys()]).slice(0, pairCount));
  const [cards, setCards] = useState<{ id: number; symbol: number; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [canFlip, setCanFlip] = useState(true);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(Date.now());

  const buildDeck = (syms: number[]) =>
    shuffleArray([...syms, ...syms]).map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));

  useEffect(() => { setCards(buildDeck(symbols)); }, [symbols]);

  useEffect(() => {
    if (paused || done) return;
    if (timeLeft === 0) { setDone(true); onLose(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done, paused]);

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
        if (cards[a].symbol === cards[b].symbol) {
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

  const urgent = timeLeft <= 10;

  return (
    <div className="flex flex-col h-full gap-2 px-1">
      {/* ── Premium stats bar ── */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <LevelBadge level={gameLevel} />
        <div className="flex items-center gap-1.5">
          {/* Pairs */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-60"><rect x="2" y="4" width="8" height="10" rx="1.5"/><rect x="14" y="4" width="8" height="10" rx="1.5"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{matched}<span className="opacity-40">/{pairCount}</span></span>
          </div>
          {/* Moves */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-60"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{moves}</span>
          </div>
          {/* Timer */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors" style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${urgent ? 'text-red-400' : 'opacity-60'}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            <span className={`text-[11px] font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-foreground'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <TimerBar timeLeft={timeLeft} total={totalTime} accent="#f59e0b" />

      {/* ── Card grid ── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols === 5 ? '310px' : '260px', width: '100%' }}>
          {cards.map((card) => {
            const sym = CARD_SYMBOLS[card.symbol] ?? CARD_SYMBOLS[0];
            const isVisible = card.flipped || card.matched;
            return (
              <button
                key={card.id}
                onClick={() => flipCard(card.id)}
                className="aspect-square rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: card.matched
                    ? 'rgba(251,191,36,0.12)'
                    : isVisible
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(255,255,255,0.04)',
                  border: card.matched
                    ? '1.5px solid rgba(251,191,36,0.45)'
                    : isVisible
                      ? '1.5px solid rgba(255,255,255,0.22)'
                      : '1.5px solid rgba(255,255,255,0.08)',
                  transform: card.matched ? 'scale(0.94)' : isVisible ? 'scale(1.04)' : 'scale(1)',
                  cursor: card.matched ? 'default' : 'pointer',
                  boxShadow: isVisible && !card.matched ? '0 0 12px rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {isVisible ? (
                  <svg
                    viewBox="0 0 24 24" fill="none"
                    stroke={card.matched ? '#fbbf24' : 'rgba(255,255,255,0.88)'}
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: '45%', height: '45%' }}
                  >
                    {sym.map((d, i) => <path key={i} d={d} />)}
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '38%', height: '38%' }}>
                    <circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BLINGA QUIZ ───────────────────────────────────────────────────────────────
function BlingaQuiz({ gameLevel, onWin, onLose, onBack, paused = false }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const staticPool = { easy: QUIZ_EASY, medium: QUIZ_MEDIUM, hard: QUIZ_HARD }[diff];
  const total = getRounds(gameLevel, 5);
  const Q_TIME = getTimer(gameLevel, 14);
  const ACCENT = '#ec4899';
  const OPT_COLORS = ['#3b82f6','#a855f7','#f59e0b','#14b8a6'];

  const [questions, setQuestions] = useState<{q:string;options:string[];answer:number}[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [timeLeft, setTimeLeft] = useState(Q_TIME);
  const correctRef = useRef(0); const scoreRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const hist = getQHistory('quiz', diff);
      const aiQs = await fetchAIQuestions('quiz', diff, total + 3, hist.slice(-30));
      if (cancelled) return;
      let picked: {q:string;options:string[];answer:number}[];
      if (aiQs.length >= total && aiQs.every((q: any) => q.q && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number')) {
        addToQHistory('quiz', diff, aiQs.slice(0, total).map((q: any) => String(q.q).slice(0, 45)));
        picked = aiQs.slice(0, total);
      } else {
        const fresh = filterByQHistory(staticPool, hist, q => q.q);
        picked = shuffleArray(fresh).slice(0, total);
        addToQHistory('quiz', diff, picked.map(q => q.q.slice(0, 45)));
      }
      setQuestions(picked);
      setQLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (paused || selected !== null || qLoading) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, paused, qLoading]);

  const handleAnswer = (idx: number) => {
    if (selected !== null || !questions[qIndex]) return;
    const q = questions[qIndex]; setSelected(idx);
    if (idx === q.answer) {
      const pts = 12 + Math.max(0, timeLeft - 4) * 2;
      scoreRef.current += pts; setScore(scoreRef.current); correctRef.current++;
    }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= total) {
        if (correctRef.current >= Math.ceil(total * 0.6)) onWin(scoreRef.current); else onLose();
      } else { setQIndex(i => i + 1); setTimeLeft(Q_TIME); }
    }, 1100);
  };

  const q = questions[qIndex];
  const urgent = timeLeft <= 5 && selected === null;

  if (qLoading) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3">
      <div className="w-7 h-7 rounded-full" style={{ border: '2.5px solid rgba(236,72,153,0.25)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Generating questions…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-2.5 px-1">
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <LevelBadge level={gameLevel} />
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{Math.min(qIndex+1,total)}<span className="opacity-40">/{total}</span></span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="#ec4899" className="w-3 h-3 opacity-80"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors" style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${urgent ? 'text-red-400' : 'opacity-50'}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            <span className={`text-[11px] font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-foreground'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={Q_TIME} accent="#ec4899" />
      <div className="flex-1 flex flex-col items-center justify-center">
        {q && (
          <div className="w-full max-w-md">
            {/* Question card */}
            <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: 'rgba(236,72,153,0.06)', border: '1.5px solid rgba(236,72,153,0.18)' }}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: `${ACCENT}70` }}>Brain Quiz</p>
              <p className="text-base font-bold text-white leading-snug">{q.q}</p>
            </div>
            {/* Options */}
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isSelected = i === selected;
                const col = OPT_COLORS[i];
                let bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.09)', textCol = 'rgba(255,255,255,0.85)';
                if (selected !== null) {
                  if (isCorrect)     { bg = 'rgba(34,197,94,0.15)';  border = 'rgba(34,197,94,0.6)';  textCol = '#86efac'; }
                  else if (isSelected){ bg = 'rgba(239,68,68,0.15)';  border = 'rgba(239,68,68,0.6)';  textCol = '#fca5a5'; }
                  else               { bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.05)'; textCol = 'rgba(255,255,255,0.30)'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-150 hover:brightness-110"
                    style={{ background: bg, border: `1.5px solid ${border}` }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: selected !== null ? 'rgba(255,255,255,0.08)' : col }}>
                      {['A','B','C','D'][i]}
                    </span>
                    <span className="text-sm font-medium transition-colors" style={{ color: textCol }}>{opt}</span>
                    {selected !== null && isCorrect && <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-auto flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>}
                    {selected !== null && isSelected && !isCorrect && <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-auto flex-shrink-0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
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

// ─── BLINGA ODD WORD ───────────────────────────────────────────────────────────
function BlingaOddWord({ gameLevel, onWin, onLose, onBack, paused = false }: GameProps) {
  const diff = getDifficulty(gameLevel);
  const staticPool = { easy: ODD_EASY, medium: ODD_MEDIUM, hard: ODD_HARD }[diff];
  const ROUNDS = getRounds(gameLevel, 5);
  const ROUND_TIME = getTimer(gameLevel, 16);
  const ACCENT = '#f43f5e';

  const [questions, setQuestions] = useState<OddWordQ[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const correctRef = useRef(0); const scoreRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const hist = getQHistory('oddword', diff);
      const aiQs = await fetchAIQuestions('oddword', diff, ROUNDS + 2, hist.slice(-25));
      if (cancelled) return;
      let picked: OddWordQ[];
      if (
        aiQs.length >= ROUNDS &&
        aiQs.every((q: any) => q.text && Array.isArray(q.words) && q.words.length === 4 && typeof q.wrongIdx === 'number' && q.fix)
      ) {
        addToQHistory('oddword', diff, aiQs.slice(0, ROUNDS).map((q: any) => String(q.text).slice(0, 45)));
        picked = aiQs.slice(0, ROUNDS) as OddWordQ[];
      } else {
        const fresh = filterByQHistory(staticPool, hist, q => q.text);
        picked = shuffleArray(fresh).slice(0, ROUNDS);
        addToQHistory('oddword', diff, picked.map(q => q.text.slice(0, 45)));
      }
      setQuestions(picked);
      setQLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const advance = useCallback((wasCorrect: boolean, tl: number) => {
    if (wasCorrect) { const pts = 12 + tl * 2; scoreRef.current += pts; setScore(scoreRef.current); correctRef.current++; }
    if (qIdx + 1 >= ROUNDS) {
      setTimeout(() => {
        if (correctRef.current >= Math.ceil(ROUNDS * 0.6)) onWin(scoreRef.current); else onLose();
      }, 900);
    } else { setTimeout(() => { setQIdx(i => i + 1); setSelected(null); setTimeLeft(ROUND_TIME); }, 900); }
  }, [qIdx, ROUNDS, ROUND_TIME, onWin, onLose]);

  useEffect(() => {
    if (paused || selected !== null || qLoading) return;
    if (timeLeft <= 0) { setSelected(-1); advance(false, 0); return; }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, advance, paused, qLoading]);

  const handleSelect = (idx: number) => {
    if (selected !== null || !questions[qIdx]) return;
    setSelected(idx);
    advance(idx === questions[qIdx].wrongIdx, timeLeft);
  };
  const q = questions.length > 0 ? questions[Math.min(qIdx, ROUNDS - 1)] : null;
  const urgent = timeLeft <= 5 && selected === null;

  if (qLoading) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3">
      <div className="w-7 h-7 rounded-full" style={{ border: '2.5px solid rgba(244,63,94,0.25)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Generating questions…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-2.5 px-1">
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <LevelBadge level={gameLevel} />
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{Math.min(qIdx+1,ROUNDS)}<span className="opacity-40">/{ROUNDS}</span></span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <svg viewBox="0 0 24 24" fill="#f43f5e" className="w-3 h-3 opacity-80"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors" style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.09)'}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 ${urgent ? 'text-red-400' : 'opacity-50'}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            <span className={`text-[11px] font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-foreground'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>
      <TimerBar timeLeft={timeLeft} total={ROUND_TIME} accent="#f43f5e" />
      <div className="flex-1 flex flex-col items-center justify-center">
        {q && (
          <div className="w-full max-w-lg">
            {/* Instruction label */}
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-center mb-3" style={{ color: `${ACCENT}70` }}>Spot the wrong word</p>
            {/* Statement card */}
            <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: 'rgba(244,63,94,0.06)', border: '1.5px solid rgba(244,63,94,0.18)' }}>
              <p className="text-base font-semibold text-white leading-relaxed">{q.text}</p>
            </div>
            {/* Word buttons */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {q.words.map((word, i) => {
                let bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.09)', textCol = 'rgba(255,255,255,0.85)';
                let icon = null;
                if (selected !== null) {
                  if (i === q.wrongIdx)     { bg = 'rgba(34,197,94,0.14)';  border = 'rgba(34,197,94,0.5)';  textCol = '#86efac'; icon = '✓'; }
                  else if (i === selected)  { bg = 'rgba(239,68,68,0.14)';  border = 'rgba(239,68,68,0.5)';  textCol = '#fca5a5'; icon = '✗'; }
                  else                     { bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.05)'; textCol = 'rgba(255,255,255,0.25)'; }
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                    className="px-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
                    style={{ background: bg, border: `1.5px solid ${border}`, color: textCol }}>
                    {icon && <span className="font-black">{icon}</span>}
                    {word}
                  </button>
                );
              })}
            </div>
            {/* Correction */}
            {selected !== null && (
              <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}>
                {q.fix}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CAR DODGE ────────────────────────────────────────────────────────────────
function BlingaCar({ gameLevel, onWin, onLose }: GameProps) {
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
      <TimerBar timeLeft={timeLeft} total={Q_TIME} accent="#a78bfa" />
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

interface BlingaGamesProps { playerName: string; userId?: string; }

// ── Module-level cache so the leaderboard + owned/fragment/score data survive
// unmount/remount (the tab content is conditionally rendered, so switching
// away and back used to always start from a blank scoreboard while a fresh
// fetch ran). Also exposes an eager `preloadGamesData` so callers can warm
// this cache as soon as the app/chat surface mounts — well before the user
// opens the Blinga Games tab — for both desktop and mobile.
type LeaderboardEntry = { userId: string; name: string; totalScore: number; bestGame: any | null; gameLevels?: Record<string, number> };
let _leaderboardCache: LeaderboardEntry[] | null = null;
let _serverDataCache: {levels:Record<string,number>;scores:ScoreEntry[]} | null = null;
let _preloadStarted = false;

export function preloadGamesData() {
  if (_preloadStarted) return;
  _preloadStarted = true;
  loadGamesFromServer().then(data => { if (data) _serverDataCache = data; });
  fetch('/api/games/leaderboard', { credentials: 'include' })
    .then(r => r.ok ? r.json() : [])
    .then((board: any[]) => { if (Array.isArray(board)) _leaderboardCache = board; })
    .catch(() => {});
}

type FreeGameIcon = { Icon: React.ComponentType<{className?: string}>; gradient: string; shadow: string };
const FREE_GAMES: Array<{id: GameId; label: string; icon: FreeGameIcon; logo: string; banner: string; desc: string; longDesc: string; howToPlay: string; category: string; tags: string[]}> = [
  { id: 'memory',  label: 'Memory Match',  logo: memoryLogo,  banner: memoryBanner,  icon: { Icon: Layers,      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.5)'  }, desc: 'Match pairs before time runs out',   longDesc: 'Exercise your working memory and visual pattern recognition by observing and recreating increasingly complex patterns. The grids get bigger and trickier as you advance through levels!', howToPlay: 'A grid of face-down cards is revealed briefly, then hidden. Tap card pairs to find matches. Clear all pairs before time runs out to win. Each level adds more cards!', category: 'Memory', tags: ['MEMORY', 'PATTERN RECOGNITION']   },
  { id: 'maths',   label: 'Speed Maths',   logo: logoMaths,   banner: mathsBanner,   icon: { Icon: Calculator,  gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', shadow: 'rgba(59,130,246,0.5)'  }, desc: 'Solve arithmetic against the clock', longDesc: 'Race against the clock to solve arithmetic challenges. From simple addition to complex multi-step problems, your mental math skills are put to the ultimate test at every level.', howToPlay: 'A math question appears on screen. Type your answer and press Go before the timer runs out. Get it right to score points and advance to harder questions!', category: 'Math', tags: ['SPEED', 'ARITHMETIC']   },
  { id: 'word',    label: 'Word Scramble', logo: logoWord,    banner: wordBanner,    icon: { Icon: BookOpen,    gradient: 'linear-gradient(135deg,#10b981,#34d399)', shadow: 'rgba(16,185,129,0.5)'  }, desc: 'Unscramble hidden words fast',       longDesc: 'Jumbled letters, hidden words — can you unscramble them all? Each round presents a scrambled word with a hint. Type the correct word before time runs out to keep your streak alive.', howToPlay: 'A scrambled word and a hint are shown. Type the correct unscrambled word and press Submit. Use the Hint button if you get stuck — but it costs points!', category: 'Word', tags: ['VOCABULARY', 'WORD SCRAMBLE']   },
  { id: 'quiz',    label: 'Brain Quiz',    logo: logoQuiz,    banner: quizBanner,    icon: { Icon: HelpCircle,  gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', shadow: 'rgba(245,158,11,0.5)'  }, desc: 'Test your general knowledge',        longDesc: 'Put your general knowledge to the test across science, history, geography, pop culture and more. Questions get harder as you level up, and every wrong answer ends your run.', howToPlay: 'A question with 4 answer choices appears. Tap the correct answer. Get it right to move to the next question. Wrong answers deduct lives — lose all lives and the game ends!', category: 'Trivia', tags: ['TRIVIA', 'KNOWLEDGE']   },
  { id: 'car',     label: 'Car Dodge',     logo: logoCar,     banner: carBanner,     icon: { Icon: Zap,         gradient: 'linear-gradient(135deg,#ef4444,#f43f5e)', shadow: 'rgba(239,68,68,0.5)'   }, desc: 'Dodge obstacles at high speed',      longDesc: 'Speed through a busy highway dodging oncoming traffic. The road gets faster and more chaotic at higher levels. How long can you survive?', howToPlay: 'Tap left/right or use arrow keys to switch lanes. Avoid collisions with other cars. Survive as long as possible — your score is based on distance traveled!', category: 'Arcade', tags: ['ARCADE', 'REFLEXES'] },
  { id: 'oddword', label: 'Odd One Out',   logo: logoOddword, banner: oddwordBanner, icon: { Icon: Shuffle,     gradient: 'linear-gradient(135deg,#ec4899,#a855f7)', shadow: 'rgba(236,72,153,0.5)'  }, desc: "Find the word that doesn't fit",    longDesc: "Four words appear on screen — three belong to the same category and one is the odd one out. Identify the intruder before time runs out! Categories get tricky at higher levels.", howToPlay: "Four words are displayed — three share a common theme and one doesn't belong. Tap the odd word out as fast as possible. The quicker you answer, the more points you score!", category: 'Word', tags: ['LOGIC', 'WORD PLAY']   },
];

const GAME_BANNERS: Record<string, string> = {
  memory: memoryBanner, maths: mathsBanner, word: wordBanner,
  quiz: quizBanner, car: carBanner, oddword: oddwordBanner,
};

type GameDetailInfo = typeof FREE_GAMES[0];

function GameCard({ game, onShowDetail }: { game: GameDetailInfo; onShowDetail: (g: GameDetailInfo) => void }) {
  return (
    <div className="rounded-2xl game-card-outline" style={{ transform: 'translateZ(0)' }}>
      <div
        className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer"
        style={{ transform: 'translateZ(0)', contain: 'paint' }}
        onClick={() => onShowDetail(game)}
      >
        <img src={game.banner} alt={game.label} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-[20px] px-2.5 py-2"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
            <img src={game.logo} alt="" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-[11px] leading-tight truncate">{game.label}</div>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wide whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#e5e7eb' }}>{game.category}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onShowDetail(game); }}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}>
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// Kept for backwards-compat with memoised wrappers below
const MemoryMatchCard  = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'memory')!}  onShowDetail={onShowDetail} />);
const SpeedMathCard    = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'maths')!}   onShowDetail={onShowDetail} />);
const WordScrambleCard = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'word')!}    onShowDetail={onShowDetail} />);
const BrainQuizCard    = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'quiz')!}    onShowDetail={onShowDetail} />);
const CarDodgeCard     = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'car')!}     onShowDetail={onShowDetail} />);
const OddOneOutCard    = memo(({ onShowDetail }: { onShowDetail: (g: GameDetailInfo) => void }) => <GameCard game={FREE_GAMES.find(g => g.id === 'oddword')!} onShowDetail={onShowDetail} />);

export function BlingaGames({ playerName, userId }: BlingaGamesProps) {
  const [screen, setScreen] = useState<'menu'|'detail'|'game'>('menu');
  const [activeGame, setActiveGame] = useState<GameId|null>(null);
  const [activeGameLabel, setActiveGameLabel] = useState('');
  const [gameLevel, setGameLevel] = useState(1);
  const [modal, setModal] = useState<'win'|'lose'|'continue'|null>(null);
  const [lastScore, setLastScore] = useState(0);
  const [key, setKey] = useState(0);
  const [search, setSearch] = useState('');
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [gameSettings, setGameSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [detailGame, setDetailGame] = useState<GameDetailInfo | null>(null);
  const [globalLeaders, setGlobalLeaders] = useState<LeaderboardEntry[]>(() => _leaderboardCache ?? []);
  const [lbCatFilter, setLbCatFilter] = useState<string>('All');
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // ── Load from server on mount + leaderboard polling ───────────────────────
  useEffect(() => {
    if (_serverDataCache) {
      const data = _serverDataCache;
      if (data.levels && Object.keys(data.levels).length > 0) { saveLevels(data.levels); }
      if (data.scores?.length > 0) { localStorage.setItem(SCORES_KEY, JSON.stringify(data.scores)); setScores(data.scores); }
    } else {
      loadGamesFromServer().then(data => {
        if (!data) return;
        _serverDataCache = data;
        if (data.levels && Object.keys(data.levels).length > 0) { saveLevels(data.levels); }
        if (data.scores?.length > 0) { localStorage.setItem(SCORES_KEY, JSON.stringify(data.scores)); setScores(data.scores); }
      });
    }
    const fetchLb = () => {
      fetch('/api/games/leaderboard', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then((board: any[]) => { if (Array.isArray(board)) { _leaderboardCache = board; setGlobalLeaders(board); } })
        .catch(() => {});
    };
    fetchLb();
    const lbTimer = setInterval(fetchLb, 30000);
    return () => clearInterval(lbTimer);
  }, []);

  const doSync = (overrides: {scores?:ScoreEntry[]}) => {
    syncToServer({ levels: loadLevels(), scores: overrides.scores ?? scores });
  };

  const handleWin = (score: number) => {
    setLastScore(score);
    let newScores = scores;
    if (activeGame) { addScore(activeGame, activeGameLabel, score, gameLevel); newScores = loadScores(); setScores(newScores); }
    setModal('win');
    doSync({ scores: newScores });
  };
  const handleLose = () => setModal('lose');
  const handleRetry = () => { setModal(null); setKey(k => k + 1); };
  const handleLeave = () => { setModal(null); goToMenu(); };

  const onShowDetail = useCallback((g: GameDetailInfo) => {
    setDetailGame(g);
    setScreen('detail');
  }, []);

  // Countdown timer — 3 → 2 → 1 → 0 (GO!) → null (game live)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown < 0) { setCountdown(null); return; }
    const t = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onStartGame = useCallback((id: GameId, label: string) => {
    const lv = getGameLevel(id);
    setActiveGame(id); setActiveGameLabel(label); setGameLevel(lv);
    setScreen('game'); setKey(k => k + 1); setModal(null); setGameSettings(false);
    setCountdown(3); // kick off 3-2-1-GO
  }, []);

  const goToMenu = () => { setScreen('menu'); setActiveGame(null); setModal(null); setGameSettings(false); setDetailGame(null); };

  const renderGame = (isPaused = false) => {
    if (!activeGame) return null;
    const props: GameProps = { playerName, gameLevel, onWin: handleWin, onLose: handleLose, onBack: goToMenu, paused: isPaused };
    switch (activeGame) {
      case 'maths':       return <BlingaMaths key={key} {...props} />;
      case 'word':        return <BlingaWord key={key} {...props} />;
      case 'memory':      return <BlingaMemory key={key} {...props} />;
      case 'quiz':        return <BlingaQuiz key={key} {...props} />;
      case 'car':         return <BlingaCar key={key} {...props} />;
      case 'oddword':     return <BlingaOddWord key={key} {...props} />;
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

  // ─── GAME DETAIL PAGE ─────────────────────────────────────────────────────
  // Light theme palette per game (bg colour + text colour)
  const GAME_LIGHT_THEMES: Record<string, { bg: string; text: string }> = {
    memory:  { bg: '#fef9c3', text: '#78350f' }, // light yellow
    maths:   { bg: '#d9f99d', text: '#365314' }, // lime green
    word:    { bg: '#dbeafe', text: '#1e40af' }, // light blue
    quiz:    { bg: '#fce7f3', text: '#9d174d' }, // light pink
    car:     { bg: '#ede9fe', text: '#5b21b6' }, // light purple
    oddword: { bg: '#fce7f3', text: '#9d174d' }, // light pink
  };

  if (screen === 'detail' && detailGame) {
    const myLevel = getGameLevel(detailGame.id);
    const myScores = scores.filter(s => s.id === detailGame.id);
    const bestScore = myScores.length > 0 ? Math.max(...myScores.map(s => s.score)) : 0;
    const lt = GAME_LIGHT_THEMES[detailGame.id] ?? { bg: '#f3f4f6', text: '#374151' };

    // Fixed full-screen overlay — covers the nav bar (z-[46]) completely
    return createPortal(
      <div
        className="flex flex-col overflow-y-auto bg-background"
        style={{ position: 'fixed', inset: 0, zIndex: 9999, scrollbarWidth: 'thin' }}
      >
        {/* ── Hero banner — tall, full bleed ── */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            height: 460,
            /* entrance animation */
            animation: 'bannerSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <style>{`
            @keyframes bannerSlideIn {
              from { opacity: 0; transform: translateY(-18px) scale(1.04); }
              to   { opacity: 1; transform: translateY(0)      scale(1);    }
            }
            @keyframes contentFadeUp {
              from { opacity: 0; transform: translateY(14px); }
              to   { opacity: 1; transform: translateY(0);    }
            }
          `}</style>

          <img
            src={detailGame.banner}
            alt={detailGame.label}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(4px) saturate(1.25) brightness(0.80)', transform: 'scale(1.08)', transformOrigin: 'center' }}
          />
          {/* Top dark fade */}
          <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)' }} />
          {/* Bottom fade — deep, smooth transition into bg */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: 200, background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.70) 40%, transparent 100%)' }} />
          {/* Mid vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.12)' }} />

          {/* Back */}
          <button
            onClick={() => { setScreen('menu'); setDetailGame(null); setHowToPlayOpen(false); }}
            className="absolute top-5 left-5 flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold z-20"
            style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)' }}
          >
            ← Back
          </button>

          {/* Centred content — logo → title → tags → button */}
          <div
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 px-8 z-10"
            style={{ animation: 'contentFadeUp 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl">
              <img src={detailGame.logo} alt="" className="w-full h-full object-cover" />
            </div>
            <h2
              className="text-white font-black text-center tracking-tight"
              style={{ fontSize: '2rem', lineHeight: 1.1, textShadow: '0 3px 18px rgba(0,0,0,0.95)' }}
            >{detailGame.label}</h2>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {detailGame.tags.map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(6px)', color: '#fff' }}>{t}</span>
              ))}
            </div>
            <button
              onClick={(e) => {
                const btn = e.currentTarget;
                btn.classList.remove('btn-click-pop');
                void btn.offsetWidth;
                btn.classList.add('btn-click-pop');
                onStartGame(detailGame.id, detailGame.label);
              }}
              className="mt-2 rounded-full font-black text-base hover:scale-105"
              style={{ background: '#fff', color: '#111', padding: '12px 48px', minWidth: 200, boxShadow: '0 4px 24px rgba(0,0,0,0.35)', transition: 'transform 0.2s' }}
            >
              Start Game
            </button>
          </div>
        </div>

        {/* ── Info — centred column ── */}
        <div
          className="flex flex-col items-center px-6 py-6 gap-4 w-full max-w-lg mx-auto"
          style={{ animation: 'contentFadeUp 0.5s 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {/* Stats + Level */}
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <div className="rounded-xl overflow-hidden" style={{ background: lt.bg }}>
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: `${lt.text}22` }}>
                <div className="px-6 py-3 text-center">
                  <p className="text-xl font-black leading-none" style={{ color: lt.text }}>{myScores.length}</p>
                  <p className="text-[10px] mt-1 uppercase tracking-wider font-semibold" style={{ color: `${lt.text}88` }}>Total Plays</p>
                </div>
                <div className="px-6 py-3 text-center">
                  <p className="text-xl font-black leading-none" style={{ color: lt.text }}>{bestScore}</p>
                  <p className="text-[10px] mt-1 uppercase tracking-wider font-semibold" style={{ color: `${lt.text}88` }}>Best Score</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl px-5 py-3 flex items-center justify-between" style={{ background: lt.bg }}>
              <span className="text-sm font-semibold" style={{ color: `${lt.text}aa` }}>Your Level</span>
              <LevelBadge level={myLevel} />
            </div>
          </div>

          {/* About heading */}
          <div className="w-full max-w-sm">
            <h3 className="font-bold text-foreground text-lg text-center">About the game</h3>
          </div>

          {/* How to Play */}
          <div className="w-full max-w-sm">
            <div className="rounded-xl overflow-hidden" style={{ background: lt.bg }}>
              <button
                onClick={() => setHowToPlayOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold select-none"
                style={{ color: lt.text }}
              >
                <span>How to Play?</span>
                <ChevronRight
                  className="w-4 h-4 transition-transform duration-300"
                  style={{ transform: howToPlayOpen ? 'rotate(90deg)' : 'rotate(0deg)', color: lt.text }}
                />
              </button>
              <div
                style={{
                  maxHeight: howToPlayOpen ? '300px' : '0px',
                  opacity: howToPlayOpen ? 1 : 0,
                  overflow: 'hidden',
                  background: lt.bg,
                  transitionProperty: 'max-height, opacity',
                  transitionDuration: '320ms',
                  transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div className="px-5 pb-4 pt-1 text-sm leading-relaxed border-t" style={{ color: lt.text, borderColor: `${lt.text}22` }}>
                  {detailGame.howToPlay}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ─── GAME SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'game') {
    const _gameAccent = GAME_ACCENT_COLOR[activeGame ?? ''] ?? '#60a5fa';
    return createPortal(
      <div className="flex flex-col bg-background" style={{ position: 'fixed', inset: 0, zIndex: 9999, padding: '10px 10px 0 10px' }}>
        {/* ── Game screen top bar ── */}
        <div className="flex items-center gap-2.5 pb-2.5 mb-1 flex-shrink-0"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          {/* Menu / pause button */}
          <button onClick={() => setGameSettings(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
            aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 text-white/60">
              <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
            </svg>
          </button>
          {/* Accent left-border game label */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: _gameAccent }} />
            <span className="text-[13px] font-bold text-white/85 truncate leading-none">{activeGameLabel}</span>
          </div>
          {/* Level chip */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
            style={{ background: `${_gameAccent}14`, border: `1px solid ${_gameAccent}35` }}>
            <span className="text-[10px] font-black tabular-nums" style={{ color: _gameAccent }}>LV {gameLevel}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">{renderGame(countdown !== null)}</div>

        {/* ── 3-2-1-GO countdown overlay ── */}
        {countdown !== null && countdown >= 0 && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          >
            <style>{`
              @keyframes cdPop {
                0%   { transform: scale(0.4); opacity: 0; }
                40%  { transform: scale(1.18); opacity: 1; }
                70%  { transform: scale(0.93); }
                100% { transform: scale(1);    opacity: 1; }
              }
              @keyframes cdFadeOut {
                0%   { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.5); }
              }
            `}</style>
            <div
              key={countdown}
              style={{
                animation: 'cdPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
                fontFamily: 'inherit',
                fontWeight: 900,
                fontSize: countdown === 0 ? '5rem' : '8rem',
                lineHeight: 1,
                color: countdown === 0 ? (GAME_ACCENT_COLOR[activeGame ?? ''] ?? '#4ade80') : '#ffffff',
                textShadow: countdown === 0
                  ? `0 0 40px ${GAME_ACCENT_COLOR[activeGame ?? ''] ?? '#4ade80'}cc, 0 4px 24px rgba(0,0,0,0.9)`
                  : '0 4px 32px rgba(0,0,0,0.9)',
                userSelect: 'none',
              }}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </div>
        )}

        {/* ── Game Settings (pause) modal ── */}
        {gameSettings && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }} onClick={() => setGameSettings(false)}>
            <div className="w-80 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <span className="font-bold text-foreground text-base">Game Settings</span>
                <button onClick={() => setGameSettings(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {([
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
                    label: 'Resume', action: () => setGameSettings(false),
                  },
                  {
                    svg: isMuted
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
                    label: isMuted ? 'Unmute' : 'Mute', action: () => setIsMuted(m => !m),
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
                    label: 'How to Play', action: () => { setShowHowToPlay(true); setGameSettings(false); },
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
                    label: 'Restart', action: () => { setGameSettings(false); setKey(k => k + 1); },
                  },
                  {
                    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
                    label: 'Quit', action: () => goToMenu(),
                  },
                ]).map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left hover:bg-accent"
                    style={{ border: '1px solid transparent' }}>
                    <span className="text-muted-foreground w-4 flex-shrink-0">{item.svg}</span>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── How to Play overlay ── */}
        {showHowToPlay && activeGame && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)' }}>
            <div className="w-80 rounded-2xl bg-card border border-border shadow-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-foreground">How to Play</span>
                <button onClick={() => setShowHowToPlay(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{FREE_GAMES.find(g => g.id === activeGame)?.howToPlay ?? 'Play to win!'}</p>
              <button onClick={() => setShowHowToPlay(false)} className="mt-4 w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold">Got it</button>
            </div>
          </div>
        )}

        {modal === 'win' && <WinModal level={gameLevel} score={lastScore} onContinue={() => setModal('continue')} onLeave={handleLeave} />}
        {modal === 'lose' && <LoseModal level={gameLevel} onRetry={handleRetry} onLeave={handleLeave} />}
        {modal === 'continue' && <ContinueModal nextLevel={gameLevel + 1} onYes={() => { const nextLv = gameLevel + 1; if (activeGame) persistGameLevel(activeGame, nextLv); setGameLevel(nextLv); setModal(null); setKey(k => k + 1); doSync({}); }} onNo={() => { setModal(null); goToMenu(); }} />}
      </div>,
      document.body
    );
  }

  // ─── MENU SCREEN ──────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-full overflow-hidden px-3" style={{ minHeight: 0 }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 w-full">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Blinga Game Hub</h2>
          <p className="text-muted-foreground text-[11px] mt-0.5">{playerName} · Play games · Climb the ranks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="w-full">

        {/* ── GAMES ── */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">

            {/* ── LEFT: search + game cards 2-col grid ── */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {/* Search bar — compact */}
              <div className="relative w-fit">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 rounded-full text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{ background: 'rgba(128,128,128,0.10)', border: '1px solid rgba(128,128,128,0.18)', width: 140 }}
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>

              {/* Game cards — 2-per-row grid, 3 on large screens */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MemoryMatchCard onShowDetail={onShowDetail} />
                <SpeedMathCard onShowDetail={onShowDetail} />
                <WordScrambleCard onShowDetail={onShowDetail} />
                <BrainQuizCard onShowDetail={onShowDetail} />
                <CarDodgeCard onShowDetail={onShowDetail} />
                <OddOneOutCard onShowDetail={onShowDetail} />
              </div>
            </div>

            {/* ── RIGHT: Leaderboard — sticky on PC, normal flow on mobile ── */}
            <div className="lg:w-[300px] lg:flex-shrink-0 lg:sticky lg:top-0">
              {(() => {
                const CAT_TABS = ['All', 'Mem', 'Math', 'Word', 'Quiz', 'Car', 'Odd'];
                const CAT_TO_GAME: Record<string, string> = { Mem: 'memory', Math: 'maths', Word: 'word', Quiz: 'quiz', Car: 'car', Odd: 'oddword', TTT: 'tictactoe', RPS: 'rps' };
                const catIdx = CAT_TABS.indexOf(lbCatFilter);

                const getScore = (l: typeof globalLeaders[0]) =>
                  lbCatFilter === 'All'
                    ? l.totalScore
                    : l.gameLevels?.[CAT_TO_GAME[lbCatFilter]] || 0;

                const leaders = [...globalLeaders]
                  .map(l => ({ ...l, filteredScore: getScore(l) }))
                  .filter(l => l.filteredScore > 0)
                  .sort((a, b) => b.filteredScore - a.filteredScore)
                  .slice(0, 10);

                const top3 = leaders.slice(0, 3);
                const rank4and5 = leaders.slice(3, 5);

                const podSlots = [
                  { leader: top3[1] ?? null, rank: 2 },
                  { leader: top3[0] ?? null, rank: 1 },
                  { leader: top3[2] ?? null, rank: 3 },
                ] as const;

                const meUserRank = leaders.findIndex(l => l.userId === userId);
                const meInTop    = meUserRank !== -1;
                const myLevels   = loadLevels();
                const myLevel    = lbCatFilter === 'All'
                  ? Math.max(0, ...Object.values(myLevels).map(v => Number(v) || 0))
                  : myLevels[CAT_TO_GAME[lbCatFilter]] || 1;
                const myFilteredScore = lbCatFilter === 'All'
                  ? Object.values(myLevels).reduce((s, v) => s + (Number(v) || 0), 0)
                  : myLevels[CAT_TO_GAME[lbCatFilter]] || 0;

                const podTextPos = [
                  { cx: '17%', cy: '74%', scoreSz: 11, nameSz: 8.5 },
                  { cx: '50%', cy: '54%', scoreSz: 14, nameSz: 9.5 },
                  { cx: '81%', cy: '73%', scoreSz: 10, nameSz: 8 },
                ];

                const rankMedal = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

                return (
                  <div style={{ background: 'linear-gradient(180deg, #6e6e6e 0%, #2e2e2e 40%, #111111 75%, #000000 100%)', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: -0.3 }}>Leaderboard</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ALL TIME</span>
                    </div>

                    {/* Category segmented bar */}
                    <div style={{ padding: '0 14px 14px' }}>
                      <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3, overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', top: 3, bottom: 3,
                          left: `calc(${catIdx} * (100% / ${CAT_TABS.length}) + 3px)`,
                          width: `calc(100% / ${CAT_TABS.length} - 6px)`,
                          background: 'rgba(255,255,255,0.92)', borderRadius: 9,
                          transition: 'left 0.28s cubic-bezier(0.23, 1, 0.32, 1)',
                          pointerEvents: 'none',
                        }} />
                        {CAT_TABS.map((cat) => (
                          <button key={cat} onClick={() => { if (cat !== lbCatFilter) playTabClick(); setLbCatFilter(cat); }} style={{
                            flex: 1, padding: '6px 0', border: 'none', cursor: 'pointer',
                            background: 'transparent', borderRadius: 9,
                            fontSize: 10, fontWeight: 700,
                            color: lbCatFilter === cat ? '#111' : 'rgba(255,255,255,0.5)',
                            position: 'relative', zIndex: 1, transition: 'color 0.2s',
                          }}>{cat}</button>
                        ))}
                      </div>
                    </div>

                    {/* Podium — top 3 */}
                    <div style={{ position: 'relative', background: 'transparent', padding: '0 10px', overflow: 'hidden', marginBottom: 0, lineHeight: 0 }}>
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
                      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at 50% 90%, rgba(251,191,36,0.22) 0%, transparent 65%)', filter: 'blur(18px)' }} />
                      <div style={{ position: 'relative', width: '100%' }}>
                        <img src="/podium-bars.png" alt="podium"
                          style={{ width: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none', marginBottom: 0, verticalAlign: 'bottom' }}
                        />
                        {podSlots.map((slot, si) => {
                          const pos = podTextPos[si];
                          const isMe = slot.leader?.userId === userId;
                          return (
                            <div key={`pod-txt-${slot.rank}`} style={{
                              position: 'absolute', left: pos.cx, top: pos.cy,
                              transform: 'translateX(-50%)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              pointerEvents: 'none', zIndex: 10,
                            }}>
                              {slot.leader ? (
                                <>
                                  <span style={{ color: '#fff', fontWeight: 900, fontSize: pos.scoreSz, lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
                                    {(slot.leader as any).filteredScore?.toLocaleString() ?? slot.leader.totalScore.toLocaleString()}
                                  </span>
                                  <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: pos.nameSz, textAlign: 'center', lineHeight: 1.25, marginTop: 2, textShadow: '0 1px 5px rgba(0,0,0,0.8)', maxWidth: 70, wordBreak: 'break-word' }}>
                                    {slot.leader.name}{isMe ? ' ✦' : ''}
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: pos.scoreSz, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>—</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ranks #4 and #5 — always render both rows */}
                    {[4, 5].map(rankNum => {
                      const l = leaders[rankNum - 1] ?? null;
                      const isMe = l?.userId === userId;
                      return (
                        <div key={`rank-${rankNum}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, width: 22, flexShrink: 0 }}>#{rankNum}</span>
                          {l ? (
                            <>
                              <span style={{ flex: 1, color: isMe ? '#fff' : 'rgba(255,255,255,0.75)', fontWeight: isMe ? 900 : 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                                {l.name}{isMe ? ' ✦' : ''}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                                {(l as any).filteredScore?.toLocaleString() ?? l.totalScore.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 500, flex: 1 }}>—</span>
                          )}
                        </div>
                      );
                    })}

                    {/* Your level + rank row */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderLeft: '3px solid #555' }}>
                        <span style={{ color: '#aaa', fontSize: 11, fontWeight: 800, width: 26, flexShrink: 0 }}>
                          {meInTop ? rankMedal(meUserRank + 1) : '—'}
                        </span>
                        <span style={{ flex: 1, color: '#fff', fontWeight: 900, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {playerName}
                        </span>
                        <span style={{ padding: '2px 7px', borderRadius: 20, background: '#333', color: '#ddd', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>You</span>
                        <span style={{ color: '#ccc', fontWeight: 800, fontSize: 11, flexShrink: 0, textAlign: 'right' as const }}>
                          Lv {myLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

        </div>{/* end w-full wrapper */}
      </div>

    </div>
  );
}
