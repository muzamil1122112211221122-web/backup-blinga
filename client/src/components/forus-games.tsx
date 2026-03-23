import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'menu' | 'maths' | 'word' | 'memory' | 'quiz' | 'leaderboard';

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

interface AllLeaderboards {
  maths: LeaderboardEntry[];
  word: LeaderboardEntry[];
  memory: LeaderboardEntry[];
  quiz: LeaderboardEntry[];
}

// ─── Leaderboard helpers ──────────────────────────────────────────────────────
const LB_KEY = 'forus_games_leaderboard';

function loadLeaderboard(): AllLeaderboards {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { maths: [], word: [], memory: [], quiz: [] };
}

function saveScore(game: keyof AllLeaderboards, entry: LeaderboardEntry) {
  const lb = loadLeaderboard();
  lb[game] = [...lb[game], entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORD_LIST = [
  { word: 'PLANET', hint: 'Orbits a star' },
  { word: 'BRIDGE', hint: 'Connects two sides over water' },
  { word: 'JUNGLE', hint: 'Dense tropical forest' },
  { word: 'CASTLE', hint: 'Medieval royal fortress' },
  { word: 'MIRROR', hint: 'Reflects your image' },
  { word: 'ROCKET', hint: 'Vehicle that reaches space' },
  { word: 'VIOLIN', hint: 'Stringed instrument played with a bow' },
  { word: 'CACTUS', hint: 'Desert plant with spines' },
  { word: 'BUTTER', hint: 'Made from cream, used on bread' },
  { word: 'CANDLE', hint: 'Wax stick that gives light' },
  { word: 'FROZEN', hint: 'Turned to ice' },
  { word: 'SILVER', hint: 'Precious grey metal' },
  { word: 'GARDEN', hint: 'Place where flowers and plants grow' },
  { word: 'MONKEY', hint: 'Primate that swings through trees' },
  { word: 'PILLOW', hint: 'Soft cushion for sleeping' },
];

const QUIZ_QUESTIONS = [
  { q: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], answer: 2 },
  { q: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], answer: 1 },
  { q: 'Who painted the Mona Lisa?', options: ['Picasso', 'Rembrandt', 'Da Vinci', 'Van Gogh'], answer: 2 },
  { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { q: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
  { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { q: 'Who wrote "Romeo and Juliet"?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], answer: 1 },
  { q: 'What is the smallest country in the world?', options: ['Monaco', 'Liechtenstein', 'Vatican City', 'San Marino'], answer: 2 },
  { q: 'What is the boiling point of water (°C)?', options: ['90', '95', '100', '105'], answer: 2 },
  { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
];

const MEMORY_EMOJIS = ['🦁', '🐬', '🦊', '🐸', '🦋', '🌺', '⚡', '🎸'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scramble(word: string): string {
  let s = word.split('');
  do { s = shuffleArray(s); } while (s.join('') === word);
  return s.join('');
}

// ─── Medal helpers ────────────────────────────────────────────────────────────
function medal(i: number) {
  return ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`;
}

// ─── Leaderboard Panel ────────────────────────────────────────────────────────
function LeaderboardPanel({ onBack }: { onBack: () => void }) {
  const lb = loadLeaderboard();
  const games: { id: keyof AllLeaderboards; label: string; color: string }[] = [
    { id: 'maths', label: 'Forus Maths', color: 'from-blue-500 to-cyan-500' },
    { id: 'word', label: 'Forus Word', color: 'from-green-500 to-emerald-500' },
    { id: 'memory', label: 'Forus Memory', color: 'from-purple-500 to-pink-500' },
    { id: 'quiz', label: 'Forus Quiz', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <h2 className="text-2xl font-bold text-foreground">🏆 Leaderboard</h2>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map(g => (
          <div key={g.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${g.color} px-4 py-3`}>
              <h3 className="font-bold text-white text-sm">{g.label}</h3>
            </div>
            <div className="p-3 space-y-2">
              {lb[g.id].slice(0, 3).length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-3">No scores yet — play to get on the board!</p>
              )}
              {lb[g.id].slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medal(i)}</span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">{e.date}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground">{e.score}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score Save Modal ─────────────────────────────────────────────────────────
function ScoreSaveModal({ score, game, playerName, onSave, onSkip }: {
  score: number;
  game: keyof AllLeaderboards;
  playerName: string;
  onSave: (name: string) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState(playerName || '');
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-foreground mb-1">Game Over!</h3>
        <p className="text-muted-foreground text-sm mb-4">Your score: <span className="text-foreground font-bold text-lg">{score}</span></p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={20}
        />
        <div className="flex gap-2">
          <Button onClick={() => onSave(name || 'Anonymous')} className="flex-1" size="sm">Save Score</Button>
          <Button onClick={onSkip} variant="outline" className="flex-1" size="sm">Skip</Button>
        </div>
      </div>
    </div>
  );
}

// ─── FORUS MATHS ─────────────────────────────────────────────────────────────
function ForusMaths({ playerName, onBack }: { playerName: string; onBack: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState({ text: '', correct: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const newQuestion = useCallback(() => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, correct: number;
    if (op === '+') { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; correct = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * a); correct = a - b; }
    else if (op === '×') { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; correct = a * b; }
    else { a = Math.floor(Math.random() * 10) + 1; b = a * (Math.floor(Math.random() * 10) + 1); correct = b / a; [a, b] = [b, a]; }
    setQuestion({ text: `${a} ${op} ${b} = ?`, correct });
    setAnswer('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => { if (started) newQuestion(); }, [started]);

  useEffect(() => {
    if (!started || gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setGameOver(true); setShowSave(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, gameOver]);

  const submit = () => {
    const val = parseInt(answer);
    if (isNaN(val)) return;
    if (val === question.correct) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 3 ? 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(newStreak);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }
    setTimeout(() => { setFeedback(null); newQuestion(); }, 600);
  };

  const handleSave = (name: string) => {
    saveScore('maths', { name, score, date: new Date().toLocaleDateString() });
    setShowSave(false);
  };

  if (!started) return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="text-7xl mb-4">🧮</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Forus Maths</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Solve as many math problems as you can in 60 seconds! Earn bonus points for answer streaks.</p>
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-muted-foreground">
        <div className="bg-card border border-border rounded-xl p-3">✅ Correct = <b>10 pts</b></div>
        <div className="bg-card border border-border rounded-xl p-3">🔥 3-streak = <b>+5 bonus</b></div>
      </div>
      <Button onClick={() => setStarted(true)} size="lg" className="px-8">Start Game</Button>
      <button onClick={onBack} className="mt-4 text-xs text-muted-foreground hover:text-foreground">← Back to menu</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="maths" playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <div className="flex gap-3 items-center">
          {streak >= 3 && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">🔥 {streak} streak!</span>}
          <div className="text-sm font-bold text-foreground bg-card border border-border px-3 py-1 rounded-full">⭐ {score}</div>
          <div className={`text-sm font-bold px-3 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-card border border-border text-foreground'}`}>⏱ {timeLeft}s</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Time's Up!</h3>
            <p className="text-muted-foreground mb-4">Final Score: <span className="font-bold text-foreground text-xl">{score}</span></p>
            <div className="flex gap-3">
              <Button onClick={() => { setScore(0); setTimeLeft(60); setStreak(0); setGameOver(false); setShowSave(false); newQuestion(); }} size="sm">Play Again</Button>
              <Button variant="outline" onClick={onBack} size="sm">Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-8 rounded-2xl border-2 mb-6 transition-all ${feedback === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : feedback === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-border bg-card'}`}>
              <p className="text-4xl font-bold text-foreground">{question.text}</p>
              {feedback === 'correct' && <p className="text-green-600 dark:text-green-400 font-semibold mt-2">✓ Correct!</p>}
              {feedback === 'wrong' && <p className="text-red-600 dark:text-red-400 font-semibold mt-2">✗ Wrong! Answer: {question.correct}</p>}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Your answer..."
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-lg text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!!feedback}
              />
              <Button onClick={submit} size="lg" className="px-6" disabled={!!feedback}>Go</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS WORD ───────────────────────────────────────────────────────────────
function ForusWord({ playerName, onBack }: { playerName: string; onBack: () => void }) {
  const ROUNDS = 8;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [started, setStarted] = useState(false);
  const [words, setWords] = useState<typeof WORD_LIST>([]);
  const [scrambled, setScrambled] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const picked = shuffleArray(WORD_LIST).slice(0, ROUNDS);
    setWords(picked);
    setScrambled(scramble(picked[0].word));
    setRound(0);
    setScore(0);
    setGameOver(false);
    setShowSave(false);
    setStarted(true);
    setHintsUsed(0);
    setShowHint(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    const w = words[round];
    if (!w) return;
    if (answer.toUpperCase().trim() === w.word) {
      const pts = showHint ? 5 : 10;
      setScore(s => s + pts);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setShowAnswer(true);
    setTimeout(() => {
      setFeedback(null);
      setShowAnswer(false);
      setShowHint(false);
      setAnswer('');
      if (round + 1 >= ROUNDS) { setGameOver(true); setShowSave(true); }
      else { const next = round + 1; setRound(next); setScrambled(scramble(words[next].word)); setTimeout(() => inputRef.current?.focus(), 50); }
    }, 1200);
  };

  const useHint = () => { setHintsUsed(h => h + 1); setShowHint(true); };

  const handleSave = (name: string) => {
    saveScore('word', { name, score, date: new Date().toLocaleDateString() });
    setShowSave(false);
  };

  if (!started) return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="text-7xl mb-4">🔤</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Forus Word</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Unscramble the letters to form the correct word! Use hints wisely — they reduce your points.</p>
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-muted-foreground">
        <div className="bg-card border border-border rounded-xl p-3">✅ Correct = <b>10 pts</b></div>
        <div className="bg-card border border-border rounded-xl p-3">💡 With hint = <b>5 pts</b></div>
      </div>
      <Button onClick={startGame} size="lg" className="px-8">Start Game</Button>
      <button onClick={onBack} className="mt-4 text-xs text-muted-foreground hover:text-foreground">← Back to menu</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="word" playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-muted-foreground">Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</div>
          <div className="text-sm font-bold text-foreground bg-card border border-border px-3 py-1 rounded-full">⭐ {score}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Well Done!</h3>
            <p className="text-muted-foreground mb-4">Final Score: <span className="font-bold text-foreground text-xl">{score}</span> / {ROUNDS * 10}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startGame} size="sm">Play Again</Button>
              <Button variant="outline" onClick={onBack} size="sm">Menu</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className={`text-center p-6 rounded-2xl border-2 mb-5 transition-all ${feedback === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : feedback === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-border bg-card'}`}>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Unscramble this word</p>
              <div className="flex justify-center gap-2 mb-3 flex-wrap">
                {scrambled.split('').map((l, i) => (
                  <div key={i} className="w-10 h-10 bg-primary/10 border-2 border-primary/30 rounded-lg flex items-center justify-center text-xl font-bold text-primary">{l}</div>
                ))}
              </div>
              {showHint && <p className="text-xs text-muted-foreground italic">💡 Hint: {words[round]?.hint}</p>}
              {showAnswer && feedback === 'correct' && <p className="text-green-600 dark:text-green-400 font-semibold mt-1">✓ Correct! +{showHint ? 5 : 10} pts</p>}
              {showAnswer && feedback === 'wrong' && <p className="text-red-600 dark:text-red-400 font-semibold mt-1">✗ It was: <b>{words[round]?.word}</b></p>}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && !feedback && submit()}
                placeholder="Type your answer..."
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-lg text-foreground text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!!feedback}
                maxLength={10}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} className="flex-1" disabled={!!feedback || !answer.trim()}>Submit</Button>
              {!showHint && <Button variant="outline" onClick={useHint} disabled={!!feedback} className="px-4">💡 Hint</Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS MEMORY ─────────────────────────────────────────────────────────────
interface MemoryCard { id: number; emoji: string; flipped: boolean; matched: boolean; }

function ForusMemory({ playerName, onBack }: { playerName: string; onBack: () => void }) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [started, setStarted] = useState(false);
  const [canFlip, setCanFlip] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!started || gameOver) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [started, gameOver, startTime]);

  const startGame = () => {
    const deck: MemoryCard[] = shuffleArray([...MEMORY_EMOJIS, ...MEMORY_EMOJIS]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setScore(0);
    setGameOver(false);
    setShowSave(false);
    setStarted(true);
    setCanFlip(true);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const flipCard = (id: number) => {
    if (!canFlip) return;
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
          const newMatched = matched + 1;
          setMatched(newMatched);
          if (newMatched === MEMORY_EMOJIS.length) {
            const finalMoves = moves + 1;
            const timeSecs = Math.floor((Date.now() - startTime) / 1000);
            const pts = Math.max(10, 200 - finalMoves * 5 - timeSecs);
            setScore(pts);
            setGameOver(true);
            setShowSave(true);
          }
        } else {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
        }
        setFlipped([]);
        setCanFlip(true);
      }, 800);
    }
  };

  const handleSave = (name: string) => {
    saveScore('memory', { name, score, date: new Date().toLocaleDateString() });
    setShowSave(false);
  };

  if (!started) return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="text-7xl mb-4">🃏</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Forus Memory</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Flip cards to find matching pairs! Fewer moves and faster time means higher score.</p>
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-muted-foreground">
        <div className="bg-card border border-border rounded-xl p-3">🎯 Match all pairs to win</div>
        <div className="bg-card border border-border rounded-xl p-3">⚡ Speed + fewest moves</div>
      </div>
      <Button onClick={startGame} size="lg" className="px-8">Start Game</Button>
      <button onClick={onBack} className="mt-4 text-xs text-muted-foreground hover:text-foreground">← Back to menu</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="memory" playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <div className="flex gap-3 items-center text-sm">
          <div className="bg-card border border-border px-3 py-1 rounded-full text-muted-foreground">🎴 {matched}/{MEMORY_EMOJIS.length}</div>
          <div className="bg-card border border-border px-3 py-1 rounded-full text-muted-foreground">👆 {moves}</div>
          <div className="bg-card border border-border px-3 py-1 rounded-full text-muted-foreground">⏱ {elapsed}s</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">You matched them all!</h3>
            <p className="text-muted-foreground mb-1">{moves} moves · {elapsed} seconds</p>
            <p className="text-muted-foreground mb-4">Score: <span className="font-bold text-foreground text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startGame} size="sm">Play Again</Button>
              <Button variant="outline" onClick={onBack} size="sm">Menu</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-w-xs w-full">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => flipCard(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                  card.matched ? 'bg-green-100 dark:bg-green-900/30 border-green-400 cursor-default' :
                  card.flipped ? 'bg-primary/10 border-primary' :
                  'bg-card border-border hover:bg-accent hover:border-ring cursor-pointer'
                }`}
              >
                {(card.flipped || card.matched) ? card.emoji : '❓'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORUS QUIZ ───────────────────────────────────────────────────────────────
function ForusQuiz({ playerName, onBack }: { playerName: string; onBack: () => void }) {
  const TOTAL = 10;
  const [questions, setQuestions] = useState<typeof QUIZ_QUESTIONS>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [started, setStarted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!started || gameOver || selected !== null) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, gameOver, timeLeft, selected]);

  const startGame = () => {
    setQuestions(shuffleArray(QUIZ_QUESTIONS).slice(0, TOTAL));
    setQIndex(0);
    setScore(0);
    setCorrect(0);
    setSelected(null);
    setGameOver(false);
    setShowSave(false);
    setStarted(true);
    setTimeLeft(15);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    const q = questions[qIndex];
    setSelected(idx);
    const isCorrect = idx === q.answer;
    if (isCorrect) {
      const bonus = timeLeft >= 10 ? 5 : 0;
      setScore(s => s + 10 + bonus);
      setCorrect(c => c + 1);
    }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= TOTAL) { setGameOver(true); setShowSave(true); }
      else { setQIndex(q => q + 1); setTimeLeft(15); }
    }, 1000);
  };

  const handleSave = (name: string) => {
    saveScore('quiz', { name, score, date: new Date().toLocaleDateString() });
    setShowSave(false);
  };

  if (!started) return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="text-7xl mb-4">🧠</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Forus Quiz</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Answer {TOTAL} general knowledge questions. Fast answers earn bonus points — you have 15 seconds each!</p>
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-muted-foreground">
        <div className="bg-card border border-border rounded-xl p-3">✅ Correct = <b>10 pts</b></div>
        <div className="bg-card border border-border rounded-xl p-3">⚡ Quick answer = <b>+5 bonus</b></div>
      </div>
      <Button onClick={startGame} size="lg" className="px-8">Start Quiz</Button>
      <button onClick={onBack} className="mt-4 text-xs text-muted-foreground hover:text-foreground">← Back to menu</button>
    </div>
  );

  const q = questions[qIndex];

  return (
    <div className="flex flex-col h-full">
      {showSave && <ScoreSaveModal score={score} game="quiz" playerName={playerName} onSave={handleSave} onSkip={() => setShowSave(false)} />}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <div className="flex gap-3 items-center text-sm">
          <div className="text-muted-foreground">Q {qIndex + 1}/{TOTAL}</div>
          <div className="bg-card border border-border px-3 py-1 rounded-full font-bold text-foreground">⭐ {score}</div>
          <div className={`px-3 py-1 rounded-full font-bold ${timeLeft <= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-card border border-border text-foreground'}`}>⏱ {timeLeft}s</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {gameOver ? (
          <div className="text-center">
            <div className="text-6xl mb-4">{correct >= 8 ? '🏆' : correct >= 5 ? '🎯' : '📚'}</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{correct >= 8 ? 'Genius!' : correct >= 5 ? 'Well Done!' : 'Keep Studying!'}</h3>
            <p className="text-muted-foreground mb-1">{correct}/{TOTAL} correct</p>
            <p className="text-muted-foreground mb-4">Score: <span className="font-bold text-foreground text-xl">{score}</span></p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startGame} size="sm">Play Again</Button>
              <Button variant="outline" onClick={onBack} size="sm">Menu</Button>
            </div>
          </div>
        ) : q ? (
          <div className="w-full max-w-md">
            <div className="mb-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 rounded-full" style={{ width: `${(timeLeft / 15) * 100}%` }} />
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 mb-4 text-center">
              <p className="text-lg font-semibold text-foreground leading-snug">{q.q}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isSelected = i === selected;
                let cls = 'bg-card border-border hover:bg-accent hover:border-ring cursor-pointer';
                if (selected !== null) {
                  if (isCorrect) cls = 'bg-green-100 dark:bg-green-900/30 border-green-400 cursor-default';
                  else if (isSelected) cls = 'bg-red-100 dark:bg-red-900/30 border-red-400 cursor-default';
                  else cls = 'bg-card border-border opacity-50 cursor-default';
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium text-foreground transition-all ${cls}`}>
                    <span className="mr-2 font-bold text-muted-foreground">{['A', 'B', 'C', 'D'][i]}.</span> {opt}
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
interface ForusGamesProps {
  playerName: string;
}

export function ForusGames({ playerName }: ForusGamesProps) {
  const [activeGame, setActiveGame] = useState<GameId>('menu');

  const GAMES = [
    { id: 'maths' as GameId, emoji: '🧮', label: 'Forus Maths', desc: 'Solve math problems against the clock', color: 'from-blue-500 to-cyan-500' },
    { id: 'word' as GameId, emoji: '🔤', label: 'Forus Word', desc: 'Unscramble letters to find the word', color: 'from-green-500 to-emerald-500' },
    { id: 'memory' as GameId, emoji: '🃏', label: 'Forus Memory', desc: 'Flip cards and match the pairs', color: 'from-purple-500 to-pink-500' },
    { id: 'quiz' as GameId, emoji: '🧠', label: 'Forus Quiz', desc: 'Test your general knowledge', color: 'from-orange-500 to-red-500' },
  ];

  if (activeGame === 'maths') return <ForusMaths playerName={playerName} onBack={() => setActiveGame('menu')} />;
  if (activeGame === 'word') return <ForusWord playerName={playerName} onBack={() => setActiveGame('menu')} />;
  if (activeGame === 'memory') return <ForusMemory playerName={playerName} onBack={() => setActiveGame('menu')} />;
  if (activeGame === 'quiz') return <ForusQuiz playerName={playerName} onBack={() => setActiveGame('menu')} />;
  if (activeGame === 'leaderboard') return <LeaderboardPanel onBack={() => setActiveGame('menu')} />;

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">🎮 Forus Games</h2>
        <p className="text-muted-foreground text-sm">Choose a game, earn points, climb the leaderboard</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            className="group relative overflow-hidden flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-ring transition-all duration-200 text-left"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
              {g.emoji}
            </div>
            <div>
              <div className="font-semibold text-foreground">{g.label}</div>
              <div className="text-xs text-muted-foreground">{g.desc}</div>
            </div>
            <div className="ml-auto text-muted-foreground group-hover:text-foreground">→</div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setActiveGame('leaderboard')}
        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/40 rounded-2xl hover:from-yellow-400/30 hover:to-orange-400/30 transition-all duration-200"
      >
        <span className="text-2xl">🏆</span>
        <div className="text-left">
          <div className="font-semibold text-foreground">Leaderboard</div>
          <div className="text-xs text-muted-foreground">See top 3 scores for all games</div>
        </div>
        <div className="ml-auto text-muted-foreground">→</div>
      </button>
    </div>
  );
}
