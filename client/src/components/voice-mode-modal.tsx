import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, X, Globe, AudioLines, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: 'en-US',  label: 'English' },
  { code: 'ur-PK',  label: 'اردو' },
  { code: 'ar-SA',  label: 'عربي' },
  { code: 'hi-IN',  label: 'हिन्दी' },
  { code: 'fr-FR',  label: 'Français' },
  { code: 'es-ES',  label: 'Español' },
  { code: 'de-DE',  label: 'Deutsch' },
  { code: 'zh-CN',  label: '中文 (简体)' },
  { code: 'zh-TW',  label: '中文 (繁體)' },
  { code: 'pt-BR',  label: 'Português' },
  { code: 'tr-TR',  label: 'Türkçe' },
  { code: 'ru-RU',  label: 'Русский' },
  { code: 'ja-JP',  label: '日本語' },
  { code: 'ko-KR',  label: '한국어' },
  { code: 'it-IT',  label: 'Italiano' },
  { code: 'nl-NL',  label: 'Nederlands' },
  { code: 'pl-PL',  label: 'Polski' },
  { code: 'sv-SE',  label: 'Svenska' },
  { code: 'da-DK',  label: 'Dansk' },
  { code: 'fi-FI',  label: 'Suomi' },
  { code: 'nb-NO',  label: 'Norsk' },
  { code: 'el-GR',  label: 'Ελληνικά' },
  { code: 'cs-CZ',  label: 'Čeština' },
  { code: 'ro-RO',  label: 'Română' },
  { code: 'hu-HU',  label: 'Magyar' },
  { code: 'id-ID',  label: 'Bahasa Indonesia' },
  { code: 'ms-MY',  label: 'Bahasa Melayu' },
  { code: 'th-TH',  label: 'ภาษาไทย' },
  { code: 'vi-VN',  label: 'Tiếng Việt' },
  { code: 'bn-BD',  label: 'বাংলা' },
  { code: 'fa-IR',  label: 'فارسی' },
  { code: 'pa-IN',  label: 'ਪੰਜਾਬੀ' },
  { code: 'ta-IN',  label: 'தமிழ்' },
  { code: 'te-IN',  label: 'తెలుగు' },
  { code: 'mr-IN',  label: 'मराठी' },
  { code: 'sw-KE',  label: 'Kiswahili' },
  { code: 'uk-UA',  label: 'Українська' },
  { code: 'he-IL',  label: 'עברית' },
  { code: 'af-ZA',  label: 'Afrikaans' },
  { code: 'sk-SK',  label: 'Slovenčina' },
  { code: 'hr-HR',  label: 'Hrvatski' },
  { code: 'ca-ES',  label: 'Català' },
];

// 4 curated Gemini TTS voices: 2 male, 2 female
const VOICE_PRESETS = [
  { id: 'Charon',  label: 'Male 1',    icon: '♂', description: 'Deep & authoritative' },
  { id: 'Fenrir',  label: 'Male 2',    icon: '♂', description: 'Bold & precise' },
  { id: 'Aoede',   label: 'Female 1',  icon: '♀', description: 'Warm & breezy' },
  { id: 'Kore',    label: 'Female 2',  icon: '♀', description: 'Bright & natural' },
];

// Persistent audio element — lives outside the modal so it keeps playing after modal closes
let persistentAudio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!persistentAudio) {
    persistentAudio = new Audio();
    persistentAudio.autoplay = false;
  }
  return persistentAudio;
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface HistoryMessage { role: 'user' | 'assistant'; content: string; }

interface Props {
  isOpen: boolean; onClose: () => void;
  isListening?: boolean; onToggleListening?: () => void;
  isPlaying?: boolean; onTogglePlaying?: () => void;
}

export function VoiceModeModal({ isOpen, onClose }: Props) {
  const [phase, setPhase]       = useState<Phase>('idle');
  const [lang, setLang]         = useState('en-US');
  const [showLang, setShowLang] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [selVoice, setSelVoice] = useState('Charon');
  const [bars, setBars]         = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]   = useState('');
  const [liveText, setLiveText] = useState('');

  const phaseRef      = useRef<Phase>('idle');
  const langRef       = useRef('en-US');
  const selVoiceRef   = useRef('Charon');
  const inConvRef     = useRef(false);
  const collectedRef  = useRef('');
  const recRef        = useRef<any>(null);
  const animRef       = useRef<number>();
  const historyRef    = useRef<HistoryMessage[]>([]);

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { selVoiceRef.current = selVoice; }, [selVoice]);

  /* Bars animation */
  useEffect(() => {
    if (phase === 'idle') { setBars(Array(32).fill(4)); cancelAnimationFrame(animRef.current!); return; }
    const tick = () => {
      setBars(p => p.map((h, i) => {
        const dist = Math.abs(i - 16) / 16;
        const maxH = phase === 'thinking' ? 12 : (1 - dist * 0.6) * 60;
        return Math.max(4, Math.min(maxH, h + (Math.random() - 0.5) * 0.8 * maxH));
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [phase]);

  /* ── SPEAK via OpenAI TTS ── */
  async function speakReply(text: string) {
    syncPhase('speaking');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selVoiceRef.current }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('TTS fetch failed');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = getAudio();

      // Revoke old object URL when done
      const prevSrc = audio.src;
      audio.src = url;

      const onDone = () => {
        audio.removeEventListener('ended', onDone);
        audio.removeEventListener('error', onDone);
        if (prevSrc && prevSrc.startsWith('blob:')) URL.revokeObjectURL(prevSrc);
        // Only loop back if the conversation is still active
        if (inConvRef.current) {
          syncPhase('idle');
          startNewTurn();
        } else {
          syncPhase('idle');
        }
      };
      audio.addEventListener('ended', onDone);
      audio.addEventListener('error', onDone);
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      syncPhase('idle');
      if (inConvRef.current) startNewTurn();
    }
  }

  /* ── SEND TO AI ── */
  async function sendToAI(text: string) {
    const l = langRef.current;
    if (!text.trim()) { syncPhase('idle'); return; }
    collectedRef.current = '';
    setLiveText('');
    syncPhase('thinking');
    const langName = LANGUAGES.find(x => x.code === l)?.label ?? 'English';

    // Add user message to history
    const userMsg: HistoryMessage = { role: 'user', content: text.trim() };
    historyRef.current = [...historyRef.current, userMsg];

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
          history: historyRef.current.slice(0, -1), // send history excluding current message
          systemPrompt:
            `You are Forus AI, a voice assistant. The user is speaking ${langName}. ` +
            `STRICT: reply in the EXACT same language/script as the user. ` +
            `Maximum 2-3 sentences. No markdown, no asterisks, no bullets. Plain spoken text only.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data.response || data.message || '').trim();
        setAiReply(reply);
        if (reply) {
          // Add assistant reply to history
          historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];
          // Keep history to last 40 messages (20 turns)
          if (historyRef.current.length > 40) historyRef.current = historyRef.current.slice(-40);
          speakReply(reply);
        } else {
          syncPhase('idle');
          if (inConvRef.current) startNewTurn();
        }
      } else syncPhase('idle');
    } catch { syncPhase('idle'); }
  }

  /* ── RECOGNITION ── */
  function startNewTurn() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }

    collectedRef.current = '';
    inConvRef.current    = true;
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
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          collectedRef.current += t + ' ';
        } else {
          interim += t;
        }
      }
      setLiveText(collectedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') return;
      if (e.error === 'language-not-supported' || e.error === 'network') {
        syncPhase('idle');
        inConvRef.current = false;
        setAiReply(`Your browser does not support "${LANGUAGES.find(l => l.code === langRef.current)?.label ?? langRef.current}" speech recognition. Recognition works best in English.`);
        return;
      }
      console.warn('Recognition error:', e.error);
    };

    rec.onend = () => {
      if (phaseRef.current !== 'listening') return;
      if (!inConvRef.current) return;
      const text = collectedRef.current.trim();
      if (text) {
        sendToAI(text);
      } else {
        syncPhase('idle');
        inConvRef.current = false;
      }
    };

    try { rec.start(); } catch { syncPhase('idle'); }
  }

  /* ── CONTROLS ── */
  function handleMicTap() {
    if (phase === 'idle') {
      inConvRef.current = true;
      startNewTurn();
    } else if (phase === 'listening') {
      const text = collectedRef.current.trim();
      if (recRef.current) { try { recRef.current.onend = null; recRef.current.stop(); } catch {} recRef.current = null; }
      if (text) {
        sendToAI(text);
      } else {
        inConvRef.current = false;
        syncPhase('idle');
      }
    } else if (phase === 'speaking') {
      // Interrupt — stop audio but let user speak
      const audio = getAudio();
      audio.pause();
      startNewTurn();
    }
  }

  function handleClose() {
    inConvRef.current = false;
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
    // Audio keeps playing — do NOT stop it so AI response continues after modal closes
    collectedRef.current = '';
    syncPhase('idle'); setAiReply(''); setLiveText('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;
  const label    = phase === 'listening' ? 'Listening...' : phase === 'thinking' ? 'Thinking...' : phase === 'speaking' ? 'Speaking...' : 'Tap mic to start';

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Status */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-5 z-50">
        <div className="flex items-center gap-2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-white/80">
            <rect x="0" y="5" width="2" height="4" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="3.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="7" y="0" width="2" height="14" rx="1" fill="currentColor"/>
            <rect x="10.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="14" y="5" width="2" height="4" rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
          <span className="text-white/80 text-sm font-medium tracking-wide">{label}</span>
        </div>
      </div>

      {/* Top-left: lang + voice */}
      <div className="absolute top-4 left-4 z-50 flex gap-1">
        <div className="relative">
          <button onClick={() => { setShowLang(p => !p); setShowVoice(false); }}
            className="text-white/40 hover:text-white/70 p-2 transition-colors">
            <Globe className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[145px] backdrop-blur-sm z-50 overflow-y-auto"
                style={{ maxHeight: 340 }}>
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

        <div className="relative">
          <button onClick={() => { setShowVoice(p => !p); setShowLang(false); }}
            className="text-white/40 hover:text-white/70 p-2 transition-colors">
            <AudioLines className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showVoice && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm z-50"
                style={{ minWidth: 210 }}>
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                {VOICE_PRESETS.map(v => (
                  <button key={v.id}
                    onClick={() => { setSelVoice(v.id); selVoiceRef.current = v.id; setShowVoice(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors ${selVoice === v.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <span className="text-base">{v.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span>{v.label}</span>
                      <span className="text-[10px] text-white/30">{v.description}</span>
                    </div>
                    {selVoice === v.id && <span className="ml-auto text-xs text-white/50">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Centre */}
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

      {/* Glow + bars */}
      <div className="relative w-full flex flex-col items-center" style={{ marginBottom: -1 }}>
        <motion.div animate={{ opacity: glowOp }} transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: glowBlur * 2,
            background: `radial-gradient(ellipse 80% 100% at 50% 100%, #fff, #e5e7eb 20%, #9ca3af 45%, transparent 75%)`,
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

      {/* Buttons */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-5 z-50">
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleMicTap}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
            phase === 'listening' ? 'bg-white border-white text-black'
            : phase === 'thinking' ? 'bg-zinc-800/60 border-white/10 text-white/25 cursor-default'
            : 'bg-zinc-800/80 border-white/10 text-white/70 hover:bg-zinc-700/80'}`}>
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
