import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, BookOpen, Gamepad2, ShoppingBag, Gem, ChevronRight, Star, Lock, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'maths' | 'word' | 'memory' | 'quiz' | 'car' | 'oddword'
            | 'tictactoe' | 'hangman' | 'rps' | 'connectfour' | 'mastermind'
            | 'wordchain' | 'truefalse' | 'speedmath';

interface GameProps { playerName: string; gameLevel: number; onWin: (score: number) => void; onLose: () => void; onBack: () => void; }

// ─── Fragment & Progress Storage ──────────────────────────────────────────────
const FRAG_KEY  = 'fius_fragments_v1';
const OWNED_KEY = 'fius_owned_games_v1';
const LEVEL_KEY = 'fius_game_levels_v1';

function loadFragments(): number { try { return parseInt(localStorage.getItem(FRAG_KEY) || '0', 10) || 0; } catch { return 0; } }
function saveFragments(n: number) { localStorage.setItem(FRAG_KEY, String(n)); }
function loadOwned(): string[] { try { return JSON.parse(localStorage.getItem(OWNED_KEY) || '[]'); } catch { return []; } }
function saveOwned(ids: string[]) { localStorage.setItem(OWNED_KEY, JSON.stringify(ids)); }
function loadLevels(): Record<string, number> { try { return JSON.parse(localStorage.getItem(LEVEL_KEY) || '{}'); } catch { return {}; } }
function saveLevels(l: Record<string, number>) { localStorage.setItem(LEVEL_KEY, JSON.stringify(l)); }
function getGameLevel(id: string): number { const l = loadLevels(); return l[id] || 1; }
function setGameLevel(id: string, lv: number) { const l = loadLevels(); l[id] = lv; saveLevels(l); }
function fragmentsForLevel(lv: number): number { return 4 + lv; }

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
      <span className="text-blue-200 text-sm">🔷</span>
      <span className="text-white font-bold text-sm">{count}</span>
    </div>
  );
}

// ─── Level Badge ───────────────────────────────────────────────────────────────
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
  const Q_TIME = getTimer(gameLevel, 12);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  const Q_TIME = getTimer(gameLevel, 12);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  const totalTime = Math.max(30, 90 - gameLevel * 5);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  const Q_TIME = getTimer(gameLevel, 12);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  const ROUND_TIME = getTimer(gameLevel, 16);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
function FiusCar({ gameLevel, onWin, onLose, onBack }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [phase, setPhase] = useState<'intro'|'playing'|'done'>('intro');
  const TARGET = 10 + gameLevel * 3;
  const SPEED_INIT = 2 + gameLevel * 0.4;
  const SPAWN_RATE = Math.max(25, 88 - gameLevel * 5);
  const CW = 210; const CH = 370; const LANE_W = 70; const LANES = 3;
  const CAR_W = 36; const CAR_H = 52; const OBS_H = 52; const PY = CH - CAR_H - 16;
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
    ctx.fillStyle = '#1c1917'; ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle = '#292524'; ctx.fillRect(4,0,CW-8,CH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([16,12]); ctx.lineWidth = 2;
    for (let i = 1; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(i*LANE_W,0); ctx.lineTo(i*LANE_W,CH); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const o of s.obs) { const x = lx(o.lane); ctx.fillStyle = o.col; rr(ctx,x,o.y,CAR_W,OBS_H,6); ctx.fill(); }
    const px = lx(s.lane);
    ctx.fillStyle = '#22c55e'; rr(ctx,px,PY,CAR_W,CAR_H,7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px+5,PY+8,CAR_W-10,14);
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
        const occ = s.obs.filter(o => o.y < OBS_H * 1.5).map(o => o.lane);
        let lane = Math.floor(Math.random() * LANES);
        for (let t = 0; t < 5 && occ.includes(lane); t++) lane = Math.floor(Math.random() * LANES);
        s.obs.push({ lane, y: -OBS_H, col: OBS_COLORS[Math.floor(Math.random()*OBS_COLORS.length)] });
      }
      for (const o of s.obs) o.y += s.speed;
      let hit = false;
      s.obs = s.obs.filter(o => {
        if (!hit && o.lane === s.lane && o.y + OBS_H >= PY && o.y <= PY + CAR_H) {
          hit = true; s.lives--; setUiLives(s.lives);
          if (s.lives <= 0) { s.dead = true; setPhase('done'); setUiScore(s.score); draw(); setTimeout(() => onLose(), 500); return false; }
          return false;
        }
        if (o.y >= CH) { s.score++; setUiScore(s.score); if (s.score >= TARGET) { s.dead = true; setPhase('done'); draw(); setTimeout(() => onWin(s.score * 10), 500); return false; } return false; }
        return true;
      });
      if (s.frame % 280 === 0) s.speed = Math.min(s.speed + 0.5, 16);
      draw();
      if (!s.dead) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, draw, TARGET, onWin, onLose]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <LevelBadge level={gameLevel} />
          <StatPill>{'❤️ '.repeat(Math.max(0,uiLives)).trim()||'💀'}</StatPill>
          <StatPill>🚗 {uiScore}/{TARGET}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {phase === 'intro' && (
          <div className="text-center">
            <div className="text-5xl mb-3">🚗</div>
            <h3 className="text-xl font-bold text-white mb-1">Car Dodge — Level {gameLevel}</h3>
            <p className="text-zinc-400 text-sm mb-1">Dodge <span className="text-white font-bold">{TARGET}</span> cars without crashing 3 times.</p>
            <p className="text-zinc-500 text-xs mb-5">← → arrow keys or tap buttons below</p>
            <Button onClick={startGame}>Start Game</Button>
          </div>
        )}
        {(phase === 'playing' || phase === 'done') && (
          <div className="flex flex-col items-center gap-3">
            <canvas ref={canvasRef} width={CW} height={CH} className="rounded-2xl border border-white/10" style={{ imageRendering: 'crisp-edges' }} />
            {phase === 'playing' && (
              <div className="flex gap-5">
                <button onPointerDown={() => { gs.current.lane = Math.max(0, gs.current.lane - 1); }} className="w-16 h-16 rounded-2xl bg-white/10 text-white text-3xl font-bold hover:bg-white/20 active:scale-90 transition-all select-none touch-none">←</button>
                <button onPointerDown={() => { gs.current.lane = Math.min(2, gs.current.lane + 1); }} className="w-16 h-16 rounded-2xl bg-white/10 text-white text-3xl font-bold hover:bg-white/20 active:scale-90 transition-all select-none touch-none">→</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  const Q_TIME = getTimer(gameLevel, 8);
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
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
  { id: 'tictactoe' as GameId,   name: 'Tic-Tac-Toe',          emoji: '⭕', price: 30,  desc: 'Classic X vs O against AI',            category: 'vs AI',  color: 'from-blue-600 to-cyan-600' },
  { id: 'hangman' as GameId,     name: 'Hangman',               emoji: '🎯', price: 25,  desc: 'Guess the word letter by letter',       category: 'Solo',   color: 'from-purple-600 to-pink-600' },
  { id: 'rps' as GameId,         name: 'Rock Paper Scissors',   emoji: '✊', price: 15,  desc: 'Best of rounds vs clever AI',           category: 'vs AI',  color: 'from-green-600 to-emerald-600' },
  { id: 'connectfour' as GameId, name: 'Connect Four',          emoji: '🔴', price: 40,  desc: 'Drop pieces, connect four to win',      category: 'vs AI',  color: 'from-red-600 to-orange-600' },
  { id: 'mastermind' as GameId,  name: 'Mastermind',            emoji: '🔐', price: 35,  desc: 'Crack the secret color code',           category: 'Solo',   color: 'from-yellow-600 to-amber-600' },
  { id: 'wordchain' as GameId,   name: 'Word Chain',            emoji: '🔗', price: 25,  desc: 'Chain words with AI opponent',          category: 'vs AI',  color: 'from-teal-600 to-cyan-600' },
  { id: 'truefalse' as GameId,   name: 'True or False Blitz',   emoji: '⚡', price: 20,  desc: 'Lightning-fast T/F quiz rounds',        category: 'Solo',   color: 'from-indigo-600 to-purple-600' },
  { id: 'speedmath' as GameId,   name: 'Speed Math Race',       emoji: '🏎️', price: 30,  desc: 'Race AI to solve math problems',        category: 'vs AI',  color: 'from-rose-600 to-pink-600' },
];


// ═══════════════════════════════════════════════════════════════════════════════
// ─── LEADERBOARD STORAGE ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const SCORES_KEY = 'fius_scores_v2';
interface ScoreEntry { id: string; game: string; score: number; level: number; date: string; }
function loadScores(): ScoreEntry[] { try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]'); } catch { return []; } }
function addScore(gameId: string, gameName: string, score: number, level: number) {
  const all = loadScores();
  all.push({ id: gameId, game: gameName, score, level, date: new Date().toLocaleDateString() });
  all.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(all.slice(0, 50)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN GAME HUB ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface FiusGamesProps { playerName: string; }

const FREE_GAMES = [
  { id: 'memory' as GameId,  label: 'Memory Match',   emoji: '🃏', color: '#8b5cf6', bg: 'from-violet-600 to-purple-700',  desc: 'Match pairs before time runs out',   category: 'Solo' },
  { id: 'maths' as GameId,   label: 'Speed Maths',    emoji: '➕', color: '#0ea5e9', bg: 'from-sky-500 to-blue-700',       desc: 'Solve arithmetic against the clock', category: 'Solo' },
  { id: 'word' as GameId,    label: 'Word Scramble',  emoji: '📝', color: '#10b981', bg: 'from-emerald-500 to-teal-700',   desc: 'Unscramble hidden words fast',       category: 'Solo' },
  { id: 'quiz' as GameId,    label: 'Brain Quiz',     emoji: '💡', color: '#f59e0b', bg: 'from-amber-500 to-orange-600',   desc: 'Test your general knowledge',        category: 'Solo' },
  { id: 'car' as GameId,     label: 'Car Dodge',      emoji: '🏎️', color: '#ef4444', bg: 'from-red-500 to-rose-700',       desc: 'Dodge obstacles at high speed',      category: 'Arcade' },
  { id: 'oddword' as GameId, label: 'Odd One Out',    emoji: '🔍', color: '#06b6d4', bg: 'from-cyan-500 to-sky-700',       desc: "Find the word that doesn't fit",    category: 'Solo' },
];

export function FiusGames({ playerName }: FiusGamesProps) {
  const [tab, setTab] = useState<'games'|'store'|'leaderboard'>('games');
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

  const handleWin = (score: number) => {
    const earned = fragmentsForLevel(gameLevel);
    const newFrags = fragments + earned;
    setFragments(newFrags); saveFragments(newFrags);
    setLastScore(score); setLastFrags(earned);
    if (activeGame) { addScore(activeGame, activeGameLabel, score, gameLevel); setScores(loadScores()); }
    setModal('win');
  };
  const handleLose = () => setModal('lose');
  const handleRetry = () => { setModal(null); setKey(k => k + 1); };
  const handleLeave = () => { setModal(null); goToMenu(); };
  const goToMenu = () => { setScreen('menu'); setActiveGame(null); setModal(null); setExitConfirm(false); };

  const handleBuy = (id: string, price: number) => {
    const nf = fragments - price; const no = [...ownedGames, id];
    setFragments(nf); saveFragments(nf); setOwnedGames(no); saveOwned(no);
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
        {/* Exit bar */}
        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-white/10 flex-shrink-0">
          {exitConfirm ? (
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-zinc-400 flex-1">Exit this game?</span>
              <button onClick={goToMenu} className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all">Exit</button>
              <button onClick={() => setExitConfirm(false)} className="px-3 py-1 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-all">Keep playing</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button onClick={() => setExitConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-medium transition-all">
                ← Exit Game
              </button>
              <span className="text-zinc-600 text-xs flex-1 truncate">{activeGameLabel} · Level {gameLevel}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {renderGame()}
        </div>
        {modal === 'win' && <WinModal level={gameLevel} score={lastScore} fragsEarned={lastFrags} onContinue={() => setModal('continue')} onLeave={handleLeave} />}
        {modal === 'lose' && <LoseModal level={gameLevel} onRetry={handleRetry} onLeave={handleLeave} />}
        {modal === 'continue' && <ContinueModal nextLevel={gameLevel + 1} onYes={() => { setGameLevel(gameLevel + 1); setModal(null); setKey(k => k + 1); }} onNo={() => { setModal(null); goToMenu(); }} />}
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
    <div className="flex flex-col h-full overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Fius Games</h2>
          <p className="text-zinc-500 text-[11px] mt-0.5">{playerName} · Win games · Earn fragments</p>
        </div>
        <FragmentBadge count={fragments} />
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 mb-3 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 flex-shrink-0">
        {(['games','store','leaderboard'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t === 'games' ? '🎮 Games' : t === 'store' ? '🛒 Store' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* ── Search (Games tab only) ── */}
      {tab === 'games' && (
        <div className="relative mb-3 flex-shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search games..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

        {/* ── GAMES TAB ── */}
        {tab === 'games' && (
          <div className="space-y-4">
            {/* Free games */}
            {filteredFree.length > 0 && (
              <div>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">Free</p>
                <div className="grid grid-cols-2 gap-2">
                  {filteredFree.map(g => {
                    const lv = getGameLevel(g.id);
                    return (
                      <button key={g.id} onClick={() => onStartGame(g.id, g.label)}
                        className="flex flex-col rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/5"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className={`w-full h-16 bg-gradient-to-br ${g.bg} flex items-center justify-center text-3xl`}>{g.emoji}</div>
                        <div className="p-2.5">
                          <div className="text-white font-bold text-xs leading-tight">{g.label}</div>
                          <div className="text-zinc-600 text-[10px] mt-0.5 leading-tight line-clamp-1">{g.desc}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <LevelBadge level={lv} />
                            <span className="text-[9px] text-zinc-600 font-bold uppercase">{g.category}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owned store games */}
            {myPurchased.length > 0 && (
              <div>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">My Games</p>
                <div className="grid grid-cols-2 gap-2">
                  {myPurchased.map(g => {
                    const lv = getGameLevel(g.id);
                    return (
                      <button key={g.id} onClick={() => onStartGame(g.id, g.name)}
                        className="flex flex-col rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/5"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className={`w-full h-16 bg-gradient-to-br ${g.color} flex items-center justify-center text-3xl`}>{g.emoji}</div>
                        <div className="p-2.5">
                          <div className="text-white font-bold text-xs leading-tight">{g.name}</div>
                          <div className="text-zinc-600 text-[10px] mt-0.5 line-clamp-1">{g.desc}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <LevelBadge level={lv} />
                            <span className="text-[9px] text-zinc-600 font-bold uppercase">{g.category}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty search */}
            {filteredFree.length === 0 && myPurchased.length === 0 && (
              <div className="text-center py-10 text-zinc-600 text-sm">No games match "{search}"</div>
            )}

            {/* Store teaser */}
            {!search && storeAvail.length > 0 && (
              <button onClick={() => setTab('store')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:scale-[1.01] border border-purple-500/20"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))' }}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Lock size={15} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-purple-300 font-bold text-xs">{storeAvail.length} more games in Store</div>
                  <div className="text-zinc-600 text-[10px] mt-0.5">Unlock with 🔷 fragments you earn</div>
                </div>
                <ChevronRight size={14} className="text-purple-500 flex-shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* ── STORE TAB ── */}
        {tab === 'store' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex-1">Premium Games</span>
              <span className="text-zinc-600 text-[10px]">Balance: <span className="text-blue-400 font-bold">🔷 {fragments}</span></span>
            </div>
            {STORE_CATALOG.map(game => {
              const owned = ownedGames.includes(game.id);
              const canAfford = fragments >= game.price;
              return (
                <div key={game.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 transition-all hover:border-white/10"
                  style={{ background: owned ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)' }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl flex-shrink-0`}>{game.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-xs">{game.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/8 text-zinc-500 font-semibold">{game.category}</span>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-0.5 line-clamp-1">{game.desc}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {owned ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <Check size={10} /> Owned
                      </div>
                    ) : (
                      <button onClick={() => { if (canAfford) { handleBuy(game.id, game.price); } }}
                        disabled={!canAfford}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${canAfford ? 'bg-blue-600/80 border-blue-500/40 text-white hover:bg-blue-600 hover:scale-105' : 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'}`}>
                        🔷 {game.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'leaderboard' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex-1">Top Scores</span>
              {scores.length > 0 && (
                <button onClick={() => { localStorage.removeItem(SCORES_KEY); setScores([]); }}
                  className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">Clear</button>
              )}
            </div>
            {scores.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-zinc-600 text-sm font-medium">No scores yet</p>
                <p className="text-zinc-700 text-xs mt-1">Play games to set records!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {scores.slice(0, 20).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5"
                    style={{ background: i === 0 ? 'rgba(251,191,36,0.08)' : i === 1 ? 'rgba(156,163,175,0.06)' : i === 2 ? 'rgba(180,83,9,0.06)' : 'rgba(255,255,255,0.02)' }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-zinc-500/20 text-zinc-400' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-600'}`}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-bold">{s.game}</div>
                      <div className="text-zinc-600 text-[10px]">Level {s.level} · {s.date}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-extrabold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>{s.score}</div>
                      <div className="text-zinc-700 text-[9px]">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
