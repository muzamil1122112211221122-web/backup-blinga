import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, X, Globe, AudioLines, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Ordered preference lists per slot — browser picks first match it has installed
const VOICE_SLOTS = [
  {
    id: 'male1', label: 'Male 1', icon: '♂',
    priority: ['Google UK English Male', 'Microsoft George Desktop - English (Great Britain)',
      'Microsoft George', 'Daniel', 'Tom', 'Fred'],
  },
  {
    id: 'male2', label: 'Male 2', icon: '♂',
    priority: ['Microsoft David Desktop - English (United States)', 'Microsoft David',
      'Alex', 'Aaron', 'Reed', 'Google US English Male'],
  },
  {
    id: 'female1', label: 'Female 1', icon: '♀',
    priority: ['Google US English', 'Microsoft Aria Online Natural - English (United States)',
      'Microsoft Aria', 'Samantha', 'Victoria', 'Karen'],
  },
  {
    id: 'female2', label: 'Female 2', icon: '♀',
    priority: ['Google UK English Female', 'Microsoft Hazel Desktop - English (Great Britain)',
      'Microsoft Hazel', 'Moira', 'Tessa', 'Fiona'],
  },
];

function resolveVoice(slotId: string, allVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const slot = VOICE_SLOTS.find(s => s.id === slotId);
  if (!slot) return null;
  for (const name of slot.priority) {
    const v = allVoices.find(v => v.name === name);
    if (v) return v;
  }
  // Fallback: any non-junk English voice of roughly the right gender
  const junk = ['espeak', 'pico', 'flite', 'mbrola'];
  const isFemalePref = slotId.startsWith('female');
  const engVoices = allVoices.filter(v =>
    v.lang.startsWith('en') && !junk.some(j => v.name.toLowerCase().includes(j))
  );
  return isFemalePref
    ? (engVoices.find(v => /female|woman|girl|zira|aria|samantha|victoria|karen/i.test(v.name)) ?? engVoices[0] ?? null)
    : (engVoices.find(v => /male|man|david|alex|daniel|george|fred/i.test(v.name)) ?? engVoices[0] ?? null);
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
interface HistoryMsg { role: 'user' | 'assistant'; content: string; }

interface Props { isOpen: boolean; onClose: () => void; }

export function VoiceModeModal({ isOpen, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [lang, setLang]           = useState('en-US');
  const [showLang, setShowLang]   = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [voices, setVoices]       = useState<SpeechSynthesisVoice[]>([]);
  const [selSlot, setSelSlot]     = useState('male1');
  const [bars, setBars]           = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]     = useState('');
  const [liveText, setLiveText]   = useState('');

  const phaseRef    = useRef<Phase>('idle');
  const langRef     = useRef('en-US');
  const selSlotRef  = useRef('male1');
  const voicesRef   = useRef<SpeechSynthesisVoice[]>([]);
  const inConvRef   = useRef(false);
  const collectedRef = useRef('');
  const recRef      = useRef<any>(null);
  const animRef     = useRef<number>();
  const historyRef  = useRef<HistoryMsg[]>([]);

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { selSlotRef.current = selSlot; }, [selSlot]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);

  // Load browser voices
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Waveform bars
  useEffect(() => {
    if (phase === 'idle') {
      setBars(Array(32).fill(4));
      cancelAnimationFrame(animRef.current!);
      return;
    }
    const tick = () => {
      setBars(p => p.map((h, i) => {
        const dist = Math.abs(i - 16) / 16;
        const maxH = phase === 'thinking' ? 10 : (1 - dist * 0.6) * 60;
        return Math.max(4, Math.min(maxH, h + (Math.random() - 0.5) * 0.8 * maxH));
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [phase]);

  // ── INSTANT browser TTS — zero network delay ──
  function speakText(text: string) {
    window.speechSynthesis.cancel();
    syncPhase('speaking');
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langRef.current;
    utt.rate = 1.05;
    utt.pitch = 1;
    utt.volume = 1;

    const v = resolveVoice(selSlotRef.current, voicesRef.current);
    if (v) utt.voice = v;

    const onDone = () => {
      utt.onend = null; utt.onerror = null;
      if (inConvRef.current) {
        syncPhase('idle');
        setTimeout(() => startNewTurn(), 600); // brief gap before mic reopens
      } else {
        syncPhase('idle');
      }
    };
    utt.onend = onDone;
    utt.onerror = onDone;
    window.speechSynthesis.speak(utt);

    // Chrome desktop sometimes pauses long utterances — keep it going
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 5000);
    utt.onend = () => { clearInterval(keepAlive); onDone(); };
    utt.onerror = () => { clearInterval(keepAlive); onDone(); };
  }

  // ── AI call ──
  async function sendToAI(text: string) {
    if (!text.trim()) { syncPhase('idle'); return; }
    syncPhase('thinking');
    setLiveText('');

    const langName = LANGUAGES.find(x => x.code === langRef.current)?.label ?? 'English';
    historyRef.current = [...historyRef.current, { role: 'user', content: text.trim() }];
    if (historyRef.current.length > 30) historyRef.current = historyRef.current.slice(-30);

    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text.trim(),
          conversationId: 'voice-mode',
          model: 'forus-ai',
          provider: 'openai',
          history: historyRef.current.slice(0, -1),
          systemPrompt:
            `You are Forus AI, a voice assistant. The user is speaking ${langName}. ` +
            `STRICT: reply in the EXACT same language/script as the user. ` +
            `Maximum 2-3 sentences. No markdown, no bullets, no asterisks. Plain spoken words only.`,
        }),
      });

      if (!res.ok) { syncPhase('idle'); if (inConvRef.current) startNewTurn(); return; }

      const data = await res.json();
      const reply = (data.response || data.message || '').trim();
      setAiReply(reply);

      if (reply) {
        historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
        speakText(reply);
      } else {
        syncPhase('idle');
        if (inConvRef.current) startNewTurn();
      }
    } catch {
      syncPhase('idle');
    }
  }

  // ── Speech recognition (simple + reliable) ──
  function startNewTurn(silentRetry = 0) {
    if (!inConvRef.current) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setAiReply('Speech recognition is not supported in this browser. Try Chrome.'); return; }

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
        setAiReply('Microphone access was denied. Please allow mic permissions and try again.');
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
        // Mic ended without speech — retry a few times
        setTimeout(() => startNewTurn(silentRetry + 1), 300);
      } else {
        // Genuinely no speech after 3 tries — rest
        syncPhase('idle');
        inConvRef.current = false;
        setAiReply('');
      }
    };

    try { rec.start(); } catch (e) { console.error('[STT] start error:', e); syncPhase('idle'); }
  }

  // ── Button controls ──
  function handleMicTap() {
    if (phase === 'idle') {
      // Unlock audio context with silent utterance (needed in some browsers)
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
      inConvRef.current = true;
      startNewTurn();
    } else if (phase === 'listening') {
      const text = collectedRef.current.trim();
      if (recRef.current) { try { recRef.current.onend = null; recRef.current.stop(); } catch {} recRef.current = null; }
      if (text) sendToAI(text);
      else { inConvRef.current = false; syncPhase('idle'); }
    } else if (phase === 'speaking') {
      window.speechSynthesis.cancel();
      startNewTurn();
    }
    // 'thinking' — ignore
  }

  function handleClose() {
    inConvRef.current = false;
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
    // Let current speech finish (don't cancel) — user can still hear the response
    collectedRef.current = '';
    syncPhase('idle'); setAiReply(''); setLiveText('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;
  const label    = phase === 'listening' ? 'Listening...' : phase === 'thinking' ? 'Thinking...' : phase === 'speaking' ? 'Speaking...' : 'Tap mic to start';

  // Build the 4-slot voice menu (only slots that have at least one voice installed)
  const voiceMenu = VOICE_SLOTS.map(slot => ({
    ...slot,
    resolved: resolveVoice(slot.id, voices),
  }));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-5 z-50">
        <div className="flex items-center gap-2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-white/80">
            <rect x="0"    y="5" width="2" height="4"  rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="3.5"  y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="7"    y="0" width="2" height="14" rx="1" fill="currentColor"/>
            <rect x="10.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="14"   y="5" width="2" height="4"  rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
          <span className="text-white/80 text-sm font-medium tracking-wide">{label}</span>
        </div>
      </div>

      {/* Top-left controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-1">
        {/* Language picker */}
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

        {/* Voice picker */}
        <div className="relative">
          <button onClick={() => { setShowVoice(p => !p); setShowLang(false); }}
            className="text-white/40 hover:text-white/70 p-2 transition-colors">
            <AudioLines className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showVoice && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm z-50"
                style={{ minWidth: 190 }}>
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                {voiceMenu.map(slot => (
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

      {/* Centre text */}
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
          <div className="absolute inset-x-0 bottom-0" style={{ height: 160,
            background: 'radial-gradient(ellipse 100% 80% at 50% 100%, #fff 0%, #d1d5db 20%, #6b7280 50%, transparent 75%)',
            borderRadius: '60% 60% 0 0' }} />
        </motion.div>
      </div>

      {/* Action buttons */}
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
