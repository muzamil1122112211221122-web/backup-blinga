import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, X, Globe, AudioLines, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   Language options
───────────────────────────────────────────── */
const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'ur-PK', label: 'اردو' },
  { code: 'ar-SA', label: 'عربي' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'tr-TR', label: 'Türkçe' },
];

/* ─────────────────────────────────────────────
   Voice presets — Gemini voice + browser fallback
───────────────────────────────────────────── */
const VOICE_SLOTS = [
  {
    id: 'male1', label: 'Male 1', icon: '♂',
    geminiVoice: 'Charon',          // deep, resonant
    browserPriority: ['Google UK English Male', 'Microsoft George', 'Daniel', 'Tom', 'Fred'],
  },
  {
    id: 'male2', label: 'Male 2', icon: '♂',
    geminiVoice: 'Fenrir',          // neutral, clear
    browserPriority: ['Microsoft David', 'Alex', 'Aaron', 'Reed', 'Google US English Male'],
  },
  {
    id: 'female1', label: 'Female 1', icon: '♀',
    geminiVoice: 'Aoede',           // warm, natural
    browserPriority: ['Google US English', 'Microsoft Aria', 'Samantha', 'Victoria', 'Karen'],
  },
  {
    id: 'female2', label: 'Female 2', icon: '♀',
    geminiVoice: 'Kore',            // clear, articulate
    browserPriority: ['Google UK English Female', 'Microsoft Hazel', 'Moira', 'Tessa', 'Fiona'],
  },
];

function resolveVoice(slotId: string, allVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const slot = VOICE_SLOTS.find(s => s.id === slotId);
  if (!slot) return null;
  for (const name of slot.browserPriority) {
    const v = allVoices.find(v => v.name === name);
    if (v) return v;
  }
  const junk = ['espeak', 'pico', 'flite', 'mbrola'];
  const isF = slotId.startsWith('female');
  const eng = allVoices.filter(v => v.lang.startsWith('en') && !junk.some(j => v.name.toLowerCase().includes(j)));
  return isF
    ? (eng.find(v => /female|woman|zira|aria|samantha|victoria|karen/i.test(v.name)) ?? eng[0] ?? null)
    : (eng.find(v => /male|man|david|alex|daniel|george|fred/i.test(v.name)) ?? eng[0] ?? null);
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
interface HistoryMsg { role: 'user' | 'assistant'; content: string; }

/* ─────────────────────────────────────────────
   Shared audio element
───────────────────────────────────────────── */
let sharedAudio: HTMLAudioElement | null = null;
function getAudio() {
  if (!sharedAudio) { sharedAudio = new Audio(); sharedAudio.preload = 'auto'; }
  return sharedAudio;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface Props { isOpen: boolean; onClose: () => void; }

export function VoiceModeModal({ isOpen, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [lang, setLang]           = useState('en-US');
  const [showLang, setShowLang]   = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [bVoices, setBVoices]     = useState<SpeechSynthesisVoice[]>([]);
  const [selSlot, setSelSlot]     = useState('male1');
  const [bars, setBars]           = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]     = useState('');
  const [liveText, setLiveText]   = useState('');
  const [audioStatus, setAudioStatus] = useState('');   // 'loading' | 'playing' | ''

  const phaseRef    = useRef<Phase>('idle');
  const langRef     = useRef('en-US');
  const selSlotRef  = useRef('male1');
  const bVoicesRef  = useRef<SpeechSynthesisVoice[]>([]);
  const inConvRef   = useRef(false);
  const collectedRef = useRef('');
  const recRef      = useRef<any>(null);
  const animRef     = useRef<number>();
  const historyRef  = useRef<HistoryMsg[]>([]);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { selSlotRef.current = selSlot; }, [selSlot]);
  useEffect(() => { bVoicesRef.current = bVoices; }, [bVoices]);

  // Load browser voices (used as fallback)
  useEffect(() => {
    const load = () => { const v = window.speechSynthesis.getVoices(); if (v.length) setBVoices(v); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Waveform animation
  useEffect(() => {
    if (phase === 'idle') { setBars(Array(32).fill(4)); cancelAnimationFrame(animRef.current!); return; }
    const tick = () => {
      setBars(p => p.map((h, i) => {
        const dist = Math.abs(i - 16) / 16;
        const maxH = phase === 'thinking' ? 8 : (1 - dist * 0.6) * 60;
        return Math.max(4, Math.min(maxH, h + (Math.random() - 0.5) * 0.8 * maxH));
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [phase]);

  /* ── After audio ends — go idle, wait for user to tap mic ── */
  function afterSpeech() {
    setAudioStatus('');
    syncPhase('idle');
  }

  /* ── Browser speech fallback ── */
  function speakBrowser(text: string) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langRef.current;
    utt.rate = 1.05; utt.pitch = 1; utt.volume = 1;
    const v = resolveVoice(selSlotRef.current, bVoicesRef.current);
    if (v) utt.voice = v;
    utt.onend = afterSpeech; utt.onerror = afterSpeech;
    // Chrome keep-alive
    const ka = setInterval(() => { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }, 5000);
    utt.onend = () => { clearInterval(ka); afterSpeech(); };
    utt.onerror = () => { clearInterval(ka); afterSpeech(); };
    window.speechSynthesis.speak(utt);
  }

  /* ── Gemini TTS → audio element, fallback to browser ── */
  async function speakReply(text: string, geminiVoice: string) {
    syncPhase('speaking');
    setAudioStatus('loading');

    // Abort any previous TTS request
    ttsAbortRef.current?.abort();
    const ctrl = new AbortController();
    ttsAbortRef.current = ctrl;

    // 8-second timeout — if Gemini TTS is slow, use browser speech
    const timeoutId = setTimeout(() => {
      ctrl.abort();
      setAudioStatus('');
      speakBrowser(text);
    }, 8000);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: ctrl.signal,
        body: JSON.stringify({ text, voice: geminiVoice }),
      });
      clearTimeout(timeoutId);
      if (!res.ok) { speakBrowser(text); return; }

      const data = await res.json();
      if (!data.audio) { speakBrowser(text); return; }

      const audio = getAudio();
      audio.pause(); audio.currentTime = 0;
      audio.onended = afterSpeech;
      audio.onerror = () => { speakBrowser(text); };
      audio.src = `data:${data.mimeType};base64,${data.audio}`;
      setAudioStatus('playing');
      await audio.play().catch(() => speakBrowser(text));
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') return;  // intentionally cancelled
      speakBrowser(text);
    }
  }

  /* ── Main AI call — uses Gemini via /api/voice-ai ── */
  async function sendToAI(text: string) {
    if (!text.trim()) { syncPhase('idle'); return; }
    syncPhase('thinking');
    setLiveText('');

    const langLabel = LANGUAGES.find(x => x.code === langRef.current)?.label ?? 'English';
    historyRef.current = [...historyRef.current, { role: 'user', content: text.trim() }];
    if (historyRef.current.length > 30) historyRef.current = historyRef.current.slice(-30);

    try {
      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text.trim(),
          history: historyRef.current.slice(0, -1),
          lang: langLabel,
        }),
      });

      const data = await res.json();
      const reply = (data.response ?? '').trim();
      if (!reply) { syncPhase('idle'); if (inConvRef.current) startNewTurn(); return; }

      // Show text immediately — user sees response without waiting for audio
      setAiReply(reply);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];

      const slot = VOICE_SLOTS.find(s => s.id === selSlotRef.current) ?? VOICE_SLOTS[0];
      speakReply(reply, slot.geminiVoice);
    } catch {
      syncPhase('idle');
    }
  }

  /* ── Speech recognition ── */
  function startNewTurn(silentRetry = 0) {
    if (!inConvRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setAiReply('Speech recognition requires Chrome or Edge.'); return; }

    if (recRef.current) {
      try { recRef.current.onend = null; recRef.current.abort(); } catch {}
      recRef.current = null;
    }

    collectedRef.current = '';
    setLiveText('');
    syncPhase('listening');

    const rec = new SR();
    recRef.current = rec;
    rec.lang = langRef.current;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) collectedRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setLiveText(collectedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      if (e.error === 'not-allowed') {
        syncPhase('idle'); inConvRef.current = false;
        setAiReply('Microphone access denied. Allow mic permissions and try again.');
        return;
      }
      console.warn('[STT] error:', e.error);
    };

    rec.onend = () => {
      if (phaseRef.current !== 'listening' || !inConvRef.current) return;
      const text = collectedRef.current.trim();
      if (text) {
        sendToAI(text);
      } else if (silentRetry < 3) {
        setTimeout(() => startNewTurn(silentRetry + 1), 300);
      } else {
        syncPhase('idle'); inConvRef.current = false; setAiReply('');
      }
    };

    try { rec.start(); } catch (e) { console.error('[STT] start:', e); syncPhase('idle'); }
  }

  /* ── Mic button tap ── */
  function handleMicTap() {
    if (phase === 'thinking') return;
    if (phase === 'idle') {
      // Unlock audio on first tap
      const u = new SpeechSynthesisUtterance(' '); u.volume = 0;
      window.speechSynthesis.speak(u);
      inConvRef.current = true;
      startNewTurn();
    } else if (phase === 'listening') {
      const text = collectedRef.current.trim();
      if (recRef.current) { try { recRef.current.onend = null; recRef.current.stop(); } catch {} recRef.current = null; }
      if (text) sendToAI(text); else { inConvRef.current = false; syncPhase('idle'); }
    } else if (phase === 'speaking') {
      // Interrupt — stop audio + mic immediately
      ttsAbortRef.current?.abort();
      getAudio().pause();
      window.speechSynthesis.cancel();
      setAudioStatus('');
      startNewTurn();
    }
  }

  function handleClose() {
    inConvRef.current = false;
    ttsAbortRef.current?.abort();
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
    collectedRef.current = '';
    syncPhase('idle'); setAiReply(''); setLiveText(''); setAudioStatus('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  /* ── Visuals ── */
  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.45 : 0.22;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;

  const statusLabel = (() => {
    if (phase === 'listening') return 'Listening...';
    if (phase === 'thinking')  return 'Thinking...';
    if (phase === 'speaking' && audioStatus === 'loading')  return 'Generating voice...';
    if (phase === 'speaking' && audioStatus === 'playing') return 'Speaking...';
    if (phase === 'speaking') return 'Speaking...';
    return 'Tap mic to start';
  })();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Status */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-5 z-50">
        <div className="flex items-center gap-2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-white/80">
            <rect x="0"    y="5" width="2" height="4"  rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="3.5"  y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="7"    y="0" width="2" height="14" rx="1" fill="currentColor"/>
            <rect x="10.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="14"   y="5" width="2" height="4"  rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
          <span className="text-white/80 text-sm font-medium tracking-wide">{statusLabel}</span>
          {audioStatus === 'loading' && (
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 rounded-full bg-white/60 inline-block" />
          )}
        </div>
      </div>

      {/* Top-left: language + voice pickers */}
      <div className="absolute top-4 left-4 z-50 flex gap-1">
        {/* Language */}
        <div className="relative">
          <button onClick={() => { setShowLang(p => !p); setShowVoice(false); }}
            className="text-white/40 hover:text-white/70 p-2 transition-colors">
            <Globe className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[145px] backdrop-blur-sm z-50 overflow-y-auto"
                style={{ maxHeight: 320 }}>
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { setLang(l.code); langRef.current = l.code; setShowLang(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${lang === l.code ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice */}
        <div className="relative">
          <button onClick={() => { setShowVoice(p => !p); setShowLang(false); }}
            className="text-white/40 hover:text-white/70 p-2 transition-colors">
            <AudioLines className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showVoice && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm z-50 min-w-[190px]">
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                {VOICE_SLOTS.map(slot => (
                  <button key={slot.id}
                    onClick={() => { setSelSlot(slot.id); selSlotRef.current = slot.id; setShowVoice(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors ${selSlot === slot.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <span className="text-base">{slot.icon}</span>
                    <span className="flex-1">{slot.label}</span>
                    {selSlot === slot.id && <span className="text-xs text-white/50">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Text display */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 px-8">
        <AnimatePresence>
          {liveText && phase === 'listening' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-white/40 text-center text-sm italic max-w-sm leading-relaxed">
              {liveText}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {aiReply && (
            <motion.p key={aiReply} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-white/85 text-center text-base leading-relaxed max-w-md">
              {aiReply}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Glow + waveform */}
      <div className="relative w-full flex flex-col items-center" style={{ marginBottom: -1 }}>
        <motion.div animate={{ opacity: glowOp }} transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: glowBlur * 2,
            background: 'radial-gradient(ellipse 80% 100% at 50% 100%, #fff, #e5e7eb 20%, #9ca3af 45%, transparent 75%)',
            filter: `blur(${glowBlur * 0.3}px)` }} />
        <div className="relative z-10 flex items-end justify-center gap-[3px] pb-2" style={{ height: 80 }}>
          {bars.map((h, i) => (
            <motion.div key={i} animate={{ height: h }} transition={{ duration: 0.05, ease: 'linear' }}
              className="rounded-full"
              style={{ width: 3,
                background: `rgba(255,255,255,${0.35 + (h / 60) * 0.65})`,
                boxShadow: h > 20 ? '0 0 6px rgba(255,255,255,.7)' : 'none' }} />
          ))}
        </div>
        <motion.div animate={{ opacity: glowOp }} transition={{ duration: 0.5 }}
          className="w-full relative overflow-hidden" style={{ height: 160 }}>
          <div className="absolute inset-x-0 bottom-0"
            style={{ height: 160,
              background: 'radial-gradient(ellipse 100% 80% at 50% 100%, #fff 0%, #d1d5db 20%, #6b7280 50%, transparent 75%)',
              borderRadius: '60% 60% 0 0' }} />
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-5 z-50">
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleMicTap}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
            phase === 'listening' ? 'bg-white border-white text-black'
            : phase === 'thinking' ? 'bg-zinc-800/60 border-white/10 text-white/25 cursor-default'
            : 'bg-zinc-800/80 border-white/10 text-white/70 hover:bg-zinc-700/80'
          }`}>
          {phase === 'listening' ? <Send className="w-5 h-5" />
           : phase === 'speaking' ? <MicOff className="w-5 h-5" />
           : <Mic className="w-5 h-5" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white border border-red-400/30 transition-colors">
          <X className="w-6 h-6" />
        </motion.button>
      </div>
    </div>,
    document.body
  );
}
