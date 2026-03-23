import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import mathIcon from "@assets/math-symbols-icon-vector-Photoroom_1774279072726.png";
import wordIcon from "@assets/external-Memory-game-table-games-icongeek26-linear-colour-icon_1774279072725.png";
import memoryIcon from "@assets/10199730_1774278684725.png";
import quizIcon from "@assets/16815634_1774279387584.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'menu' | 'maths' | 'word' | 'memory' | 'quiz' | 'leaderboard';
type Level = 'easy' | 'medium' | 'hard';

interface LeaderboardEntry { name: string; score: number; date: string; level: string; }
interface AllLeaderboards { maths: LeaderboardEntry[]; word: LeaderboardEntry[]; memory: LeaderboardEntry[]; quiz: LeaderboardEntry[]; }

// ─── Leaderboard helpers ──────────────────────────────────────────────────────
const LB_KEY = 'forus_games_leaderboard_v2';
function loadLeaderboard(): AllLeaderboards {
  try { const raw = localStorage.getItem(LB_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { maths: [], word: [], memory: [], quiz: [] };
}
function saveScore(game: keyof AllLeaderboards, entry: LeaderboardEntry) {
  const lb = loadLeaderboard();
  lb[game] = [...lb[game], entry].sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

// ─── Word Data ────────────────────────────────────────────────────────────────
const WORD_EASY = [
  { word: 'STAR', hint: 'Shines in the night sky' }, { word: 'BIRD', hint: 'Has wings and feathers' },
  { word: 'FISH', hint: 'Lives in water' }, { word: 'CAKE', hint: 'Sweet baked dessert' },
  { word: 'MOON', hint: 'Earth\'s natural satellite' }, { word: 'RAIN', hint: 'Water falling from clouds' },
  { word: 'BOAT', hint: 'Floats on water' }, { word: 'TREE', hint: 'Tall plant with trunk' },
  { word: 'LAMP', hint: 'Gives light' }, { word: 'BOOK', hint: 'Has pages to read' },
];
const WORD_MEDIUM = [
  { word: 'PLANET', hint: 'Orbits a star' }, { word: 'BRIDGE', hint: 'Connects two sides over water' },
  { word: 'JUNGLE', hint: 'Dense tropical forest' }, { word: 'CASTLE', hint: 'Medieval royal fortress' },
  { word: 'ROCKET', hint: 'Vehicle that reaches space' }, { word: 'VIOLIN', hint: 'Stringed instrument' },
  { word: 'CACTUS', hint: 'Desert plant with spines' }, { word: 'GARDEN', hint: 'Where flowers grow' },
  { word: 'MONKEY', hint: 'Primate in the trees' }, { word: 'PARROT', hint: 'Colourful talking bird' },
];
const WORD_HARD = [
  { word: 'DOLPHIN', hint: 'Smart ocean mammal' }, { word: 'LANTERN', hint: 'Portable light in a case' },
  { word: 'KESTREL', hint: 'Small hovering falcon' }, { word: 'ENIGMA', hint: 'A mystery or puzzle' },
  { word: 'COBALT', hint: 'Bright blue element' }, { word: 'BONSAI', hint: 'Miniature cultivated tree' },
  { word: 'ZIPPER', hint: 'Fastener on clothing' }, { word: 'QUARTZ', hint: 'Common mineral' },
  { word: 'WALRUS', hint: 'Marine mammal with tusks' }, { word: 'GOBLIN', hint: 'Mischievous folklore creature' },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────
const QUIZ_EASY = [
  { q: 'What colour is the sky?', options: ['Red', 'Blue', 'Green', 'Yellow'], answer: 1 },
  { q: 'How many days in a week?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'What animal says "Moo"?', options: ['Dog', 'Cat', 'Cow', 'Pig'], answer: 2 },
  { q: 'How many fingers on one hand?', options: ['4', '5', '6', '7'], answer: 1 },
  { q: 'What shape has 3 sides?', options: ['Square', 'Circle', 'Triangle', 'Rectangle'], answer: 2 },
  { q: 'What do bees make?', options: ['Milk', 'Honey', 'Butter', 'Juice'], answer: 1 },
  { q: 'What colour is grass?', options: ['Blue', 'Red', 'Yellow', 'Green'], answer: 3 },
  { q: 'Which fruit is red and round?', options: ['Banana', 'Apple', 'Orange', 'Grape'], answer: 1 },
];
const QUIZ_MEDIUM = [
  { q: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], answer: 2 },
  { q: 'How many planets in our solar system?', options: ['7', '8', '9', '10'], answer: 1 },
  { q: 'Who painted the Mona Lisa?', options: ['Picasso', 'Rembrandt', 'Da Vinci', 'Van Gogh'], answer: 2 },
  { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], answer: 1 },
  { q: 'What is the boiling point of water (°C)?', options: ['90', '95', '100', '105'], answer: 2 },
  { q: 'Which planet is the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
  { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
];
const QUIZ_HARD = [
  { q: 'What is the square root of 196?', options: ['12', '13', '14', '15'], answer: 2 },
  { q: 'Which element has atomic number 79?', options: ['Silver', 'Gold', 'Platinum', 'Copper'], answer: 1 },
  { q: 'In which year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], answer: 2 },
  { q: 'Who developed the theory of relativity?', options: ['Newton', 'Bohr', 'Einstein', 'Curie'], answer: 2 },
  { q: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], answer: 1 },
  { q: 'How many bones in the adult human body?', options: ['196', '206', '216', '226'], answer: 1 },
  { q: 'What is the longest river in the world?', options: ['Amazon', 'Congo', 'Nile', 'Yangtze'], answer: 2 },
  { q: 'Which gas makes up ~78% of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Argon', 'Nitrogen'], answer: 3 },
  { q: 'Who wrote "Crime and Punishment"?', options: ['Tolstoy', 'Chekhov', 'Dostoyevsky', 'Turgenev'], answer: 2 },
  { q: 'What is the speed of light (km/s)?', options: ['200,000', '250,000', '300,000', '350,000'], answer: 2 },
  { q: 'Which country has the most natural lakes?', options: ['Russia', 'USA', 'Canada', 'Brazil'], answer: 2 },
  { q: 'In what century was Shakespeare born?', options: ['15th', '16th', '17th', '18th'], answer: 0 },
];

// ─── Memory Emojis ────────────────────────────────────────────────────────────
const EMOJIS_EASY   = ['🦁', '🐬', '🦊', '🐸', '🦋', '🌺'];
const EMOJIS_MEDIUM = ['🦁', '🐬', '🦊', '🐸', '🦋', '🌺', '⚡', '🎸'];
const EMOJIS_HARD   = ['🦁', '🐬', '🦊', '🐸', '🦋', '🌺', '⚡', '🎸', '🍕', '🚀'];

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

// ─── Level Config ─────────────────────────────────────────────────────────────
const LEVELS: { id: Level; label: string; emoji: string; color: string; ring: string }[] = [
  { id: 'easy',   label: 'Easy',   emoji: '🌱', color: 'from-green-400 to-emerald-500',   ring: 'ring-green-400' },
  { id: 'medium', label: 'Medium', emoji: '⚡', color: 'from-yellow-400 to-orange-500',   ring: 'ring-yellow-400' },
  { id: 'hard',   label: 'Hard',   emoji: '🔥', color: 'from-red-500 to-pink-600',         ring: 'ring-red-500' },
];

// ─── Level Select ─────────────────────────────────────────────────────────────
function LevelSelect({ game, icon, onSelect, onBack }: { game: string; icon: string; onSelect: (l: Level) => void; onBack: () => void }) {
  const descs: Record<Level, string> = {
    easy:   'Relaxed pace, simple challenges. Perfect to warm up.',
    medium: 'Balanced challenge. A real test of skill!',
    hard:   'Fast, complex and unforgiving. Can you handle it?',
  };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <img src={icon} alt={game} className="w-20 h-20 object-contain mb-3 drop-shadow-lg" />
      <h2 className="text-2xl font-extrabold mb-1 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">{game}</h2>
      <p className="text-zinc-400 text-sm mb-6">Choose your difficulty</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-5">
        {LEVELS.map(l => (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${l.color} text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200`}
          >
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
        <div className="flex items-center justify-center gap-2 mb-1">
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
              {lb[g.id].slice(0, 3).length === 0 && (
                <p className="text-zinc-500 text-xs text-center py-3">No scores yet — play to get on the board!</p>
              )}
              {lb[g.id].slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medal(i)}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{e.name}</div>
                      <div className="text-[10px] text-zinc-500">{e.level ? `${e.level} · ` : ''}{e.date}</div>
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

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <div className={`text-xs font-bold px-3 py-1 rounded-full ${red ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white/80'}`}>
      {children}
    </div>
  );
}

// ─── FORUS MATHS ─────────────────────────────────────────────────────────────
function ForusMaths({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const cfg = { easy: { time: 75, maxA: 20, maxB: 20, ops: ['+', '-'] }, medium: { time: 60, maxA: 50, maxB: 50, ops: ['+', '-', '×', '÷'] }, hard: { time: 45, maxA: 100, maxB: 100, ops: ['+', '-', '×', '÷'] } }[level];
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.time);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
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
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cfg]);

  useEffect(() => { newQuestion(); }, []);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => setTimeLeft(prev => { if (prev <= 1) { clearInterval(t); setGameOver(true); setShowSave(true); return 0; } return prev - 1; }), 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  const submit = () => {
    const val = parseInt(answer);
    if (isNaN(val)) return;
    if (val === question.correct) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(newStreak);
      setFeedback('correct');
    } else { setStreak(0); setFeedback('wrong'); }
    setTimeout(() => { setFeedback(null); newQuestion(); }, 600);
  };

  const handleSave = (name: string) => { saveScore('maths', { name, score, date: new Date().toLocaleDateString(), level: lv.label }); setShowSave(false); };

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="maths" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          {streak >= 3 && <StatPill>🔥 {streak}x</StatPill>}
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 10}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-2">Time's Up!</h3>
            <p className="text-zinc-400 mb-4">Final Score: <span className="font-bold text-white text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setScore(0); setTimeLeft(cfg.time); setStreak(0); setGameOver(false); setShowSave(false); newQuestion(); }}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-8 rounded-2xl border-2 mb-5 transition-all duration-300 ${feedback === 'correct' ? 'border-green-400 bg-green-500/10 scale-105' : feedback === 'wrong' ? 'border-red-400 bg-red-500/10 shake' : 'border-white/10 bg-white/5'}`}>
              <p className="text-4xl font-bold text-white">{question.text}</p>
              {feedback === 'correct' && <p className="text-green-400 font-semibold mt-2 text-sm">✓ Correct! {streak >= 3 ? '+15' : '+10'} pts</p>}
              {feedback === 'wrong' && <p className="text-red-400 font-semibold mt-2 text-sm">✗ Answer: {question.correct}</p>}
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

// ─── FORUS WORD ───────────────────────────────────────────────────────────────
function ForusWord({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const ROUNDS = 8;
  const wordList = { easy: WORD_EASY, medium: WORD_MEDIUM, hard: WORD_HARD }[level];
  const noHints = level === 'hard';
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [words, setWords] = useState<typeof WORD_MEDIUM>([]);
  const [scrambled, setScrambled] = useState('');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lv = LEVELS.find(l => l.id === level)!;

  useEffect(() => {
    const picked = shuffleArray(wordList).slice(0, ROUNDS);
    setWords(picked);
    setScrambled(scramble(picked[0].word));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const submit = () => {
    const w = words[round];
    if (!w) return;
    const pts = answer.toUpperCase().trim() === w.word ? (showHint ? 5 : 10) : 0;
    setScore(s => s + pts);
    setFeedback(pts > 0 ? 'correct' : 'wrong');
    setShowAnswer(true);
    setTimeout(() => {
      setFeedback(null); setShowAnswer(false); setShowHint(false); setAnswer('');
      if (round + 1 >= ROUNDS) { setGameOver(true); setShowSave(true); }
      else { const n = round + 1; setRound(n); setScrambled(scramble(words[n].word)); setTimeout(() => inputRef.current?.focus(), 50); }
    }, 1200);
  };

  const handleSave = (name: string) => { saveScore('word', { name, score, date: new Date().toLocaleDateString(), level: lv.label }); setShowSave(false); };
  const letterColors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500'];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="word" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</StatPill>
          <StatPill>⭐ {score}</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-white mb-2">Well Done!</h3>
            <p className="text-zinc-400 mb-4">Final Score: <span className="font-bold text-white text-xl">{score}</span> / {ROUNDS * 10}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { const p = shuffleArray(wordList).slice(0,ROUNDS); setWords(p); setScrambled(scramble(p[0].word)); setRound(0); setScore(0); setGameOver(false); setShowSave(false); }}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-6 rounded-2xl border-2 mb-5 transition-all ${feedback === 'correct' ? 'border-green-400 bg-green-500/10' : feedback === 'wrong' ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs text-zinc-400 mb-3 uppercase tracking-widest">Unscramble this word</p>
              <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
                {scrambled.split('').map((l, i) => (
                  <div key={i} className={`w-10 h-10 ${letterColors[i % letterColors.length]} rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-lg`}>{l}</div>
                ))}
              </div>
              {showHint && <p className="text-xs text-zinc-400 italic">💡 {words[round]?.hint}</p>}
              {showAnswer && feedback === 'correct' && <p className="text-green-400 font-semibold mt-2 text-sm">✓ +{showHint ? 5 : 10} pts!</p>}
              {showAnswer && feedback === 'wrong' && <p className="text-red-400 font-semibold mt-2 text-sm">✗ It was: <b>{words[round]?.word}</b></p>}
            </div>
            <div className="flex gap-2 mb-3">
              <input ref={inputRef} type="text" value={answer} onChange={e => setAnswer(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && !feedback && submit()}
                placeholder="Type your answer..." maxLength={12} disabled={!!feedback}
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-lg text-white text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} className="flex-1 bg-green-500 hover:bg-green-600" disabled={!!feedback || !answer.trim()}>Submit</Button>
              {!noHints && !showHint && <Button onClick={() => setShowHint(true)} variant="outline" className="text-xs px-3" disabled={!!feedback}>💡 Hint</Button>}
              {noHints && <span className="text-xs text-zinc-500 self-center px-2">No hints on Hard</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS MEMORY ─────────────────────────────────────────────────────────────
interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }

function ForusMemory({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const emojis = { easy: EMOJIS_EASY, medium: EMOJIS_MEDIUM, hard: EMOJIS_HARD }[level];
  const cols = { easy: 4, medium: 4, hard: 5 }[level];
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [canFlip, setCanFlip] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const lv = LEVELS.find(l => l.id === level)!;

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [gameOver, startTime]);

  const startGame = useCallback(() => {
    const deck: MemoryCard[] = shuffleArray([...emojis, ...emojis]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    setCards(deck); setFlipped([]); setMoves(0); setMatched(0); setScore(0);
    setGameOver(false); setShowSave(false); setCanFlip(true); setStartTime(Date.now()); setElapsed(0);
  }, [emojis]);

  useEffect(() => { startGame(); }, []);

  const flipCard = (id: number) => {
    if (!canFlip) return;
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
          if (nm === emojis.length) {
            const t = Math.floor((Date.now() - startTime) / 1000);
            const m2 = moves + 1;
            const pts = Math.max(10, 300 - m2 * 5 - t);
            setScore(pts); setGameOver(true); setShowSave(true);
          }
        } else { setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)); }
        setFlipped([]); setCanFlip(true);
      }, 700);
    }
  };

  const handleSave = (name: string) => { saveScore('memory', { name, score, date: new Date().toLocaleDateString(), level: lv.label }); setShowSave(false); };
  const cardColors = ['bg-blue-500/20', 'bg-purple-500/20', 'bg-green-500/20', 'bg-orange-500/20'];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="memory" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center text-sm">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>🃏 {matched}/{emojis.length}</StatPill>
          <StatPill>👆 {moves}</StatPill>
          <StatPill>⏱ {elapsed}s</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">All matched!</h3>
            <p className="text-zinc-400 mb-1">{moves} moves · {elapsed}s</p>
            <p className="text-zinc-400 mb-4">Score: <span className="font-bold text-white text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startGame}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols === 5 ? '320px' : '260px', width: '100%' }}>
            {cards.map((card, idx) => (
              <button key={card.id} onClick={() => flipCard(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border-2 font-bold
                  ${card.matched ? 'bg-green-500/20 border-green-400 scale-95 cursor-default' :
                    card.flipped ? `${cardColors[idx % 4]} border-purple-400 scale-105` :
                    'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer active:scale-95'}`}>
                {(card.flipped || card.matched) ? card.emoji : <span className="text-zinc-600">?</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS QUIZ ───────────────────────────────────────────────────────────────
function ForusQuiz({ playerName, level, onBack }: { playerName: string; level: Level; onBack: () => void }) {
  const cfg = { easy: { questions: QUIZ_EASY, total: 8, time: 20 }, medium: { questions: QUIZ_MEDIUM, total: 10, time: 15 }, hard: { questions: QUIZ_HARD, total: 12, time: 10 } }[level];
  const [questions, setQuestions] = useState<typeof QUIZ_MEDIUM>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.time);
  const lv = LEVELS.find(l => l.id === level)!;

  useEffect(() => {
    setQuestions(shuffleArray(cfg.questions).slice(0, cfg.total));
  }, []);

  useEffect(() => {
    if (gameOver || selected !== null || !questions.length) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [gameOver, timeLeft, selected, questions]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    const q = questions[qIndex];
    setSelected(idx);
    const isCorrect = idx === q.answer;
    if (isCorrect) { const bonus = timeLeft >= Math.floor(cfg.time * 0.7) ? 5 : 0; setScore(s => s + 10 + bonus); setCorrect(c => c + 1); }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= cfg.total) { setGameOver(true); setShowSave(true); }
      else { setQIndex(q => q + 1); setTimeLeft(cfg.time); }
    }, 1000);
  };

  const handleSave = (name: string) => { saveScore('quiz', { name, score, date: new Date().toLocaleDateString(), level: lv.label }); setShowSave(false); };
  const optLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="quiz" level={level} playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex gap-2 items-center text-sm">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${lv.color} text-white font-bold`}>{lv.emoji}</span>
          <StatPill>Q {Math.min(qIndex + 1, cfg.total)}/{cfg.total}</StatPill>
          <StatPill>⭐ {score}</StatPill>
          <StatPill red={timeLeft <= 3}>⏱ {timeLeft}s</StatPill>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{correct >= Math.floor(cfg.total * 0.8) ? '🏆' : correct >= Math.floor(cfg.total * 0.5) ? '🎯' : '📚'}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{correct >= Math.floor(cfg.total * 0.8) ? 'Genius!' : correct >= Math.floor(cfg.total * 0.5) ? 'Well Done!' : 'Keep Studying!'}</h3>
            <p className="text-zinc-400 mb-1">{correct}/{cfg.total} correct</p>
            <p className="text-zinc-400 mb-4">Score: <span className="font-bold text-white text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setQuestions(shuffleArray(cfg.questions).slice(0,cfg.total)); setQIndex(0); setScore(0); setCorrect(0); setSelected(null); setGameOver(false); setShowSave(false); setTimeLeft(cfg.time); }}>Play Again</Button>
              <Button variant="outline" onClick={onBack}>Menu</Button>
            </div>
          </div>
        ) : questions[qIndex] ? (
          <div className="w-full max-w-md">
            <div className="mb-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${timeLeft <= 3 ? 'from-red-500 to-red-600' : 'from-blue-400 to-purple-500'}`}
                style={{ width: `${(timeLeft / cfg.time) * 100}%` }} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 text-center">
              <p className="text-lg font-semibold text-white leading-snug">{questions[qIndex].q}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {questions[qIndex].options.map((opt, i) => {
                const isCorrect = i === questions[qIndex].answer;
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

// ─── Main Games Hub ───────────────────────────────────────────────────────────
interface ForusGamesProps { playerName: string; }

export function ForusGames({ playerName }: ForusGamesProps) {
  const [activeGame, setActiveGame] = useState<GameId>('menu');
  const [pendingGame, setPendingGame] = useState<GameId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>('medium');

  const GAMES = [
    {
      id: 'maths' as GameId, icon: mathIcon, label: 'Forus Maths',
      desc: 'Solve math problems against the clock',
      grad: 'from-blue-600 via-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30',
      preview: (
        <div className="flex items-center gap-1.5 font-mono font-bold text-white text-lg">
          <span className="bg-white/20 px-2 py-0.5 rounded">2</span>
          <span className="text-white/60">+</span>
          <span className="bg-white/20 px-2 py-0.5 rounded">3</span>
          <span className="text-white/60">=</span>
          <span className="bg-yellow-400/40 px-2 py-0.5 rounded border border-yellow-400/60">?</span>
        </div>
      ),
    },
    {
      id: 'word' as GameId, icon: wordIcon, label: 'Forus Word',
      desc: 'Unscramble letters to find the word',
      grad: 'from-green-600 via-emerald-500 to-teal-400',
      shadow: 'shadow-green-500/30',
      preview: (
        <div className="flex gap-1">
          {['P','L','N','A','E','T'].map((l, i) => (
            <div key={i} className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center text-white ${['bg-blue-400','bg-purple-400','bg-pink-400','bg-red-400','bg-orange-400','bg-yellow-400'][i]}`}>{l}</div>
          ))}
        </div>
      ),
    },
    {
      id: 'memory' as GameId, icon: memoryIcon, label: 'Forus Memory',
      desc: 'Flip cards and match the pairs',
      grad: 'from-purple-600 via-violet-500 to-pink-500',
      shadow: 'shadow-purple-500/30',
      preview: (
        <div className="grid grid-cols-4 gap-1">
          {['🦁','?','🦊','?','?','🐸','?','🦁'].map((e, i) => (
            <div key={i} className={`w-6 h-6 rounded text-sm flex items-center justify-center ${e === '?' ? 'bg-white/10 border border-white/20 text-white/30' : 'bg-white/20'}`}>{e}</div>
          ))}
        </div>
      ),
    },
    {
      id: 'quiz' as GameId, icon: quizIcon, label: 'Forus Quiz',
      desc: 'Test your general knowledge',
      grad: 'from-orange-600 via-red-500 to-pink-500',
      shadow: 'shadow-orange-500/30',
      preview: (
        <div className="grid grid-cols-2 gap-1">
          {['A','B','C','D'].map((l, i) => (
            <div key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${i === 2 ? 'bg-green-400/30 border border-green-400/50 text-green-300' : 'bg-white/10 text-white/50'}`}>
              <span>{l}.</span><span className="w-8 h-1 bg-white/20 rounded"></span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const goBack = () => { setActiveGame('menu'); setPendingGame(null); };

  // Level selection screen
  if (pendingGame && pendingGame !== 'menu' && pendingGame !== 'leaderboard') {
    const g = GAMES.find(x => x.id === pendingGame);
    return <LevelSelect game={g?.label ?? ''} icon={g?.icon ?? ''} onSelect={(l) => { setSelectedLevel(l); setActiveGame(pendingGame); setPendingGame(null); }} onBack={() => setPendingGame(null)} />;
  }

  if (activeGame === 'maths')  return <ForusMaths  playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'word')   return <ForusWord   playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'memory') return <ForusMemory playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'quiz')   return <ForusQuiz   playerName={playerName} level={selectedLevel} onBack={goBack} />;
  if (activeGame === 'leaderboard') return <LeaderboardPanel onBack={goBack} />;

  return (
    <div className="flex flex-col">
      {/* Gradient Heading */}
      <div className="text-center mb-5">
        <h2 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-white via-zinc-300 to-zinc-600 dark:from-white dark:via-zinc-400 dark:to-zinc-700 bg-clip-text text-transparent tracking-tight">
          Forus Games
        </h2>
        <p className="text-zinc-500 text-sm">Pick a game · Choose your level · Earn points</p>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setPendingGame(g.id)}
            className={`group relative overflow-hidden flex flex-col p-0 rounded-2xl shadow-lg ${g.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left`}>
            <div className={`bg-gradient-to-br ${g.grad} p-4 flex-1`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={g.icon} alt={g.label} className="w-10 h-10 object-contain" />
                </div>
                <div className="text-white/40 group-hover:text-white/80 text-lg transition-colors">→</div>
              </div>
              <div className="font-bold text-white text-base mb-0.5">{g.label}</div>
              <div className="text-white/60 text-xs mb-3">{g.desc}</div>
              <div className="bg-black/20 rounded-xl p-2 flex items-center justify-center min-h-[44px]">
                {g.preview}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Leaderboard Button */}
      <button onClick={() => setActiveGame('leaderboard')}
        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/30 rounded-2xl hover:from-yellow-500/25 hover:to-orange-500/25 transition-all duration-200 mb-3">
        <span className="text-2xl">🏆</span>
        <div className="text-left">
          <div className="font-semibold text-white text-sm">Leaderboard</div>
          <div className="text-xs text-zinc-500">Top 10 scores for all games</div>
        </div>
        <div className="ml-auto text-zinc-500">→</div>
      </button>
    </div>
  );
}
