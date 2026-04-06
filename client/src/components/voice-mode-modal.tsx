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

const PREF_VOICES: Record<string, string> = {
  en: 'Google US English',
  ur: 'Google हिन्दी',
  ar: 'Google العربية',
  hi: 'Google हिन्दी',
  fr: 'Google français',
  es: 'Google español',
  de: 'Google Deutsch',
  zh: 'Google 普通话（中国大陆）',
  pt: 'Google português do Brasil',
  tr: 'Google Türkçe',
  ru: 'Google русский',
  ja: 'Google 日本語',
  ko: 'Google 한국의',
  it: 'Google italiano',
  nl: 'Google Nederlands',
  pl: 'Google polski',
  sv: 'Google svenska',
  da: 'Google dansk',
  fi: 'Google suomi',
  nb: 'Google norsk',
  el: 'Google ελληνικά',
  id: 'Google Bahasa Indonesia',
  ms: 'Google Bahasa Melayu',
  th: 'Google ภาษาไทย',
  vi: 'Google Tiếng Việt',
  bn: 'Google বাংলা',
  ta: 'Google தமிழ்',
  uk: 'Google українська',
  he: 'Google עברית',
};

const JUNK = ['espeak', 'festival', 'flite', 'mbrola', 'pico', 'svox', 'cmu'];

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, preferred: string) {
  const base = lang.split('-')[0];
  // Only honour a manually-selected voice if it belongs to the current language
  if (preferred) {
    const pv = voices.find(v => v.name === preferred);
    if (pv && pv.lang.startsWith(base)) return pv;
  }
  // Try the known-good Google voice for this language
  const pref = PREF_VOICES[base];
  if (pref) { const f = voices.find(v => v.name === pref); if (f) return f; }
  // Fall back to any non-junk voice for this language
  const clean = voices.filter(v => v.lang.startsWith(base) && !JUNK.some(j => v.name.toLowerCase().includes(j)));
  return clean.find(v => /google/i.test(v.name)) ?? clean[0];
  // If nothing found, return undefined → utt.voice not set → browser uses default for utt.lang
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

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
  const [voices, setVoices]     = useState<SpeechSynthesisVoice[]>([]);
  const [selVoice, setSelVoice] = useState('');
  const [bars, setBars]         = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]   = useState('');
  const [liveText, setLiveText] = useState('');

  // All mutable conversation state in refs (never go stale in callbacks)
  const phaseRef    = useRef<Phase>('idle');
  const langRef     = useRef('en-US');
  const voicesRef   = useRef<SpeechSynthesisVoice[]>([]);
  const selVoiceRef = useRef('');
  const inConvRef   = useRef(false);    // conversation loop active
  const collectedRef = useRef('');      // *** finalized text from this turn ***
  const stoppingRef  = useRef(false);   // user manually tapped send
  const recRef      = useRef<any>(null);
  const animRef     = useRef<number>();

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);
  useEffect(() => { selVoiceRef.current = selVoice; }, [selVoice]);

  useEffect(() => {
    const load = () => { const v = speechSynthesis.getVoices(); if (v.length) setVoices(v); };
    load(); speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  /* Bars */
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

  /* ── SPEAK ── */
  function speakReply(text: string) {
    speechSynthesis.cancel();
    syncPhase('speaking');
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langRef.current; utt.rate = 1; utt.pitch = 1; utt.volume = 1;
    const v = pickVoice(voicesRef.current, langRef.current, selVoiceRef.current);
    if (v) utt.voice = v;
    const onDone = () => { syncPhase('idle'); if (inConvRef.current) startNewTurn(); };
    utt.onend = onDone; utt.onerror = onDone;
    speechSynthesis.speak(utt);
  }

  useEffect(() => {
    if (phase !== 'speaking') return;
    const t = setInterval(() => { if (speechSynthesis.speaking && speechSynthesis.paused) speechSynthesis.resume(); }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  /* ── SEND TO AI ── */
  async function sendToAI(text: string) {
    const l = langRef.current;
    if (!text.trim()) { syncPhase('idle'); return; }
    collectedRef.current = '';
    setLiveText('');
    syncPhase('thinking');
    const langName = LANGUAGES.find(x => x.code === l)?.label ?? 'English';
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: 'voice-mode',
          model: 'forus-ai',
          provider: 'openai',
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
        if (reply) speakReply(reply);
        else { syncPhase('idle'); if (inConvRef.current) startNewTurn(); }
      } else syncPhase('idle');
    } catch { syncPhase('idle'); }
  }

  /* ── RECOGNITION ── */

  // Starts one recognition session. Loops back on natural end.
  function startNewTurn() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Tear down existing instance
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }

    collectedRef.current = '';
    stoppingRef.current  = false;
    inConvRef.current    = true;
    setLiveText('');
    syncPhase('listening');

    const rec = new SR();
    recRef.current = rec;
    rec.lang = langRef.current;
    rec.continuous = false;       // more reliable in Chrome than continuous:true
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          // *** KEY: update collectedRef immediately on every final result ***
          // This ensures tapping mic always has the text ready
          collectedRef.current += t + ' ';
        } else {
          interim += t;
        }
      }
      setLiveText(collectedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') return; // onend handles this — don't double-restart
      if (e.error === 'language-not-supported' || e.error === 'network') {
        syncPhase('idle');
        inConvRef.current = false;
        // Show as AI reply so user sees it clearly
        setAiReply(`Your browser does not support "${LANGUAGES.find(l => l.code === langRef.current)?.label ?? langRef.current}" speech recognition. Recognition works best in English. You can still switch the reply language for AI responses.`);
        return;
      }
      console.warn('Recognition error:', e.error);
    };

    rec.onend = () => {
      // If user manually tapped send, phase is already 'thinking' — skip
      if (phaseRef.current !== 'listening') return;
      if (!inConvRef.current) return;

      const text = collectedRef.current.trim();
      if (text) {
        // Natural pause after speech — send to AI
        sendToAI(text);
      } else {
        // No speech at all — go idle. Don't loop.
        // (Auto-restart only happens after AI finishes speaking, not on silence)
        syncPhase('idle');
        inConvRef.current = false;
      }
    };

    try { rec.start(); } catch { syncPhase('idle'); }
  }

  /* ── CONTROLS ── */
  function handleMicTap() {
    if (phase === 'idle') {
      // Unlock Chrome speech synthesis (must be in synchronous user-gesture handler)
      const p = new SpeechSynthesisUtterance(' '); p.volume = 0; speechSynthesis.speak(p);
      inConvRef.current = true;
      startNewTurn();

    } else if (phase === 'listening') {
      // User tapped send — grab collected text immediately and send
      stoppingRef.current = true;
      const text = collectedRef.current.trim();
      if (recRef.current) { try { recRef.current.onend = null; recRef.current.stop(); } catch {} recRef.current = null; }
      if (text) {
        sendToAI(text);
      } else {
        // Nothing spoken — just stop
        inConvRef.current = false;
        syncPhase('idle');
      }

    } else if (phase === 'speaking') {
      // Interrupt AI and start listening again
      speechSynthesis.cancel();
      startNewTurn();
    }
    // 'thinking' — do nothing
  }

  function handleClose() {
    inConvRef.current = false;
    stoppingRef.current = true;
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
    speechSynthesis.cancel();
    collectedRef.current = '';
    syncPhase('idle'); setAiReply(''); setLiveText('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;
  const label    = phase === 'listening' ? 'Listening...' : phase === 'thinking' ? 'Thinking...' : phase === 'speaking' ? 'Speaking...' : 'Tap mic to start';
  const langBase = lang.split('-')[0];
  // Show voices for the current language (+ any English fallbacks so list isn't empty)
  const displayVoices = voices.filter(v =>
    !JUNK.some(j => v.name.toLowerCase().includes(j)) &&
    (v.lang.startsWith(langBase) || v.lang.startsWith('en'))
  );

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
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[145px] backdrop-blur-sm z-50">
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { setLang(l.code); langRef.current = l.code; setSelVoice(''); selVoiceRef.current = ''; setShowLang(false); if (phaseRef.current !== 'idle') handleClose(); }}
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
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm overflow-y-auto z-50"
                style={{ minWidth: 240, maxHeight: 340 }}>
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                <button onClick={() => { setSelVoice(''); selVoiceRef.current = ''; setShowVoice(false); }}
                  className={`text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors ${!selVoice ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  <span>Auto (best match)</span>
                  {!selVoice && <span className="text-xs text-white/50">✓</span>}
                </button>
                {displayVoices.map(v => (
                  <button key={v.name}
                    onClick={() => { setSelVoice(v.name); selVoiceRef.current = v.name; setShowVoice(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors ${selVoice === v.name ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{v.name}</span>
                      <span className="text-[10px] text-white/30">{v.lang}</span>
                    </div>
                    {selVoice === v.name && <span className="text-xs text-white/50 flex-shrink-0">✓</span>}
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
