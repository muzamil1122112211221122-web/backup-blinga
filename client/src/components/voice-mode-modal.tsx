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
  { code: 'zh-CN', label: '中文' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'tr-TR', label: 'Türkçe' },
];

// Preferred Google voice names per language base code
const PREF_VOICES: Record<string, string> = {
  'en': 'Google US English',
  'ur': 'Google हिन्दी',
  'ar': 'Google العربية',
  'hi': 'Google हिन्दी',
  'fr': 'Google français',
  'es': 'Google español',
  'de': 'Google Deutsch',
  'zh': 'Google 普通话（中国大陆）',
  'pt': 'Google português do Brasil',
  'tr': 'Google Türkçe',
};

const JUNK = ['espeak', 'festival', 'flite', 'mbrola', 'pico', 'svox', 'cmu'];

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferred: string,
): SpeechSynthesisVoice | undefined {
  if (preferred) return voices.find(v => v.name === preferred);
  const base = lang.split('-')[0];
  const prefName = PREF_VOICES[base];
  if (prefName) {
    const found = voices.find(v => v.name === prefName);
    if (found) return found;
  }
  // Any clean voice for this exact locale
  const exactClean = voices.filter(v => v.lang === lang && !JUNK.some(j => v.name.toLowerCase().includes(j)));
  if (exactClean.length) return exactClean.find(v => /google/i.test(v.name)) ?? exactClean[0];
  // Any clean voice for base language
  const baseClean = voices.filter(v => v.lang.startsWith(base) && !JUNK.some(j => v.name.toLowerCase().includes(j)));
  if (baseClean.length) return baseClean.find(v => /google/i.test(v.name)) ?? baseClean[0];
  return undefined;
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isListening?: boolean;
  onToggleListening?: () => void;
  isPlaying?: boolean;
  onTogglePlaying?: () => void;
}

export function VoiceModeModal({ isOpen, onClose }: Props) {
  /* ── UI state ─────────────────────────────────────────────────── */
  const [phase, setPhase]               = useState<Phase>('idle');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices]             = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [bars, setBars]                 = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]           = useState('');
  const [liveText, setLiveText]         = useState('');

  /* ── Refs (avoid stale closures in callbacks) ─────────────────── */
  const phaseRef         = useRef<Phase>('idle');
  const langRef          = useRef('en-US');
  const voicesRef        = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef('');
  const inConvRef        = useRef(false);   // are we in an ongoing conversation?
  const collectedRef     = useRef('');      // all finalized text collected so far
  const recRef           = useRef<any>(null);
  const animRef          = useRef<number>();

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  /* Keep refs in sync with state */
  useEffect(() => { langRef.current = selectedLang; }, [selectedLang]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);
  useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);

  /* Load voices */
  useEffect(() => {
    const load = () => { const v = speechSynthesis.getVoices(); if (v.length) setVoices(v); };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  /* ── Bar visualiser ──────────────────────────────────────────── */
  useEffect(() => {
    if (phase === 'idle') {
      setBars(Array(32).fill(4));
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const tick = () => {
      setBars(prev => prev.map((h, i) => {
        const dist = Math.abs(i - 16) / 16;
        const maxH = phase === 'thinking' ? 12 : (1 - dist * 0.6) * 60;
        return Math.max(4, Math.min(maxH, h + (Math.random() - 0.5) * 0.8 * maxH));
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase]);

  /* ── SPEAK ───────────────────────────────────────────────────── */
  function speakReply(text: string) {
    speechSynthesis.cancel();
    syncPhase('speaking');
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang    = langRef.current;
    utt.rate    = 1; utt.pitch = 1; utt.volume = 1;
    const v = pickVoice(voicesRef.current, langRef.current, selectedVoiceRef.current);
    if (v) utt.voice = v;
    utt.onend   = () => { syncPhase('idle'); if (inConvRef.current) beginListening(); };
    utt.onerror = () => { syncPhase('idle'); if (inConvRef.current) beginListening(); };
    speechSynthesis.speak(utt);
  }

  /* Chrome randomly pauses mid-speech */
  useEffect(() => {
    if (phase !== 'speaking') return;
    const t = setInterval(() => {
      if (speechSynthesis.speaking && speechSynthesis.paused) speechSynthesis.resume();
    }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  /* ── AI CALL ─────────────────────────────────────────────────── */
  async function sendToAI(transcript: string) {
    const lang = langRef.current;
    const text = transcript.trim();
    if (!text) { syncPhase('idle'); return; }
    setLiveText('');
    collectedRef.current = '';
    syncPhase('thinking');
    const langName = LANGUAGES.find(l => l.code === lang)?.label ?? 'English';
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: 'voice-mode',
          model: 'forus-ai',
          provider: 'openai',
          systemPrompt:
            `You are Forus AI, a voice assistant. The user spoke in ${langName}. ` +
            `STRICT RULES: ` +
            `1) Reply in the EXACT same language and script the user used — no exceptions. ` +
            `2) Maximum 2-3 sentences. ` +
            `3) No markdown, no asterisks, no bullet points. Plain spoken sentences only.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data.response || data.message || '').trim();
        setAiReply(reply);
        if (reply) speakReply(reply);
        else { syncPhase('idle'); if (inConvRef.current) beginListening(); }
      } else { syncPhase('idle'); }
    } catch { syncPhase('idle'); }
  }

  /* ── RECOGNITION ─────────────────────────────────────────────── */
  function stopRecognition() {
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }

  function beginListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopRecognition();

    syncPhase('listening');
    setLiveText(collectedRef.current);

    const rec = new SR();
    recRef.current = rec;
    rec.lang            = langRef.current;
    rec.continuous      = false;  // more reliable in Chrome
    rec.interimResults  = true;

    let sessionFinal = '';

    rec.onresult = (e: any) => {
      sessionFinal = '';
      let interim  = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) sessionFinal += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      // KEY FIX: update collectedRef with finals immediately (not waiting for onend)
      // so tapping mic gives us all recognized text
      const running = collectedRef.current + sessionFinal;
      setLiveText(running + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted' || e.error === 'no-speech') {
        // no-speech: re-try automatically
        if (e.error === 'no-speech' && phaseRef.current === 'listening' && inConvRef.current) {
          setTimeout(() => {
            if (phaseRef.current === 'listening' && inConvRef.current) beginListening();
          }, 100);
        }
        return;
      }
      console.warn('Recognition error:', e.error);
    };

    rec.onend = () => {
      // Commit this session's finals to collectedRef
      if (sessionFinal.trim()) collectedRef.current += sessionFinal;

      if (phaseRef.current !== 'listening') return; // phase changed externally
      if (!inConvRef.current) return;

      if (collectedRef.current.trim()) {
        // We have text — send it
        sendToAI(collectedRef.current);
      } else {
        // No text yet — keep listening
        setTimeout(() => {
          if (phaseRef.current === 'listening' && inConvRef.current) beginListening();
        }, 100);
      }
    };

    try { rec.start(); } catch { syncPhase('idle'); }
  }

  /* ── MIC BUTTON ──────────────────────────────────────────────── */
  function handleMicTap() {
    if (phase === 'idle') {
      // Prime Chrome audio context (must be sync inside user gesture)
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0;
      speechSynthesis.speak(primer);

      collectedRef.current = '';
      inConvRef.current = true;
      beginListening();

    } else if (phase === 'listening') {
      // Send whatever has been collected and keep conversation going
      stopRecognition();
      const toSend = collectedRef.current.trim();
      if (toSend) {
        sendToAI(toSend);
      } else {
        // Nothing captured yet — just stop
        inConvRef.current = false;
        syncPhase('idle');
      }

    } else if (phase === 'speaking') {
      // Interrupt AI and listen again
      speechSynthesis.cancel();
      collectedRef.current = '';
      beginListening();

    }
    // 'thinking' — ignore
  }

  /* ── CLOSE ───────────────────────────────────────────────────── */
  function handleClose() {
    inConvRef.current = false;
    stopRecognition();
    speechSynthesis.cancel();
    collectedRef.current = '';
    syncPhase('idle');
    setAiReply('');
    setLiveText('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  /* ── DERIVED ─────────────────────────────────────────────────── */
  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;
  const statusLabel =
    phase === 'listening' ? 'Listening...' :
    phase === 'thinking'  ? 'Thinking...'  :
    phase === 'speaking'  ? 'Speaking...'  : 'Tap mic to start';

  const displayVoices = voices.filter(v => !JUNK.some(j => v.name.toLowerCase().includes(j)));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Status */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center pt-5 z-50">
        <div className="flex items-center gap-2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-white/80">
            <rect x="0" y="5" width="2" height="4" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="3.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="7" y="0" width="2" height="14" rx="1" fill="currentColor"/>
            <rect x="10.5" y="2" width="2" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="14" y="5" width="2" height="4" rx="1" fill="currentColor" opacity="0.6"/>
          </svg>
          <span className="text-white/80 text-sm font-medium tracking-wide">{statusLabel}</span>
        </div>
      </div>

      {/* Top-left: Language + Voice */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-1">
        <div className="relative">
          <button onClick={() => { setShowLangPicker(p => !p); setShowVoicePicker(false); }}
            className="text-white/40 hover:text-white/70 transition-colors p-2">
            <Globe className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[145px] backdrop-blur-sm z-50">
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => {
                      setSelectedLang(l.code); langRef.current = l.code;
                      setShowLangPicker(false);
                      if (phaseRef.current !== 'idle') { stopRecognition(); speechSynthesis.cancel(); syncPhase('idle'); }
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedLang === l.code ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button onClick={() => { setShowVoicePicker(p => !p); setShowLangPicker(false); }}
            className="text-white/40 hover:text-white/70 transition-colors p-2">
            <AudioLines className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showVoicePicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm overflow-y-auto z-50"
                style={{ minWidth: 240, maxHeight: 340 }}>
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                <button onClick={() => { setSelectedVoice(''); selectedVoiceRef.current = ''; setShowVoicePicker(false); }}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${!selectedVoice ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  <span>Auto (best match)</span>
                  {!selectedVoice && <span className="text-white/50 text-xs">✓</span>}
                </button>
                {displayVoices.map(v => (
                  <button key={v.name}
                    onClick={() => { setSelectedVoice(v.name); selectedVoiceRef.current = v.name; setShowVoicePicker(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${selectedVoice === v.name ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{v.name}</span>
                      <span className="text-[10px] text-white/30">{v.lang}</span>
                    </div>
                    {selectedVoice === v.name && <span className="text-white/50 text-xs flex-shrink-0">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Centre: transcript + reply */}
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
              transition={{ duration: 0.3 }}
              className="text-white/85 text-center text-base leading-relaxed max-w-md">
              {aiReply}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Glow + bars */}
      <div className="relative w-full flex flex-col items-center" style={{ marginBottom: '-1px' }}>
        <motion.div animate={{ opacity: glowOp }} transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: `${glowBlur * 2}px`,
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

      {/* Bottom buttons */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-5 z-50">
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
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors border border-red-400/30">
          <X className="w-6 h-6" />
        </motion.button>
      </div>
    </div>,
    document.body
  );
}
