import { useState, useRef, useEffect, useCallback } from "react";
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

const QUALITY_KEYWORDS = ['google', 'microsoft', 'natural', 'premium', 'enhanced', 'neural', 'siri', 'alex', 'samantha', 'victoria', 'karen', 'daniel', 'moira', 'tessa', 'fiona'];
const JUNK_KEYWORDS = ['espeak', 'festival', 'flite', 'mbrola', 'pico', 'svox', 'cmu', 'risk'];

function filterQualityVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const quality = voices.filter(v => {
    const n = v.name.toLowerCase();
    return QUALITY_KEYWORDS.some(k => n.includes(k)) && !JUNK_KEYWORDS.some(k => n.includes(k));
  });
  return quality.length ? quality : voices;
}

function pickBestVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const langBase = lang.split('-')[0];
  const pool = filterQualityVoices(voices);
  const exact = pool.filter(v => v.lang === lang);
  const base = pool.filter(v => v.lang.startsWith(langBase));
  const candidates = exact.length ? exact : (base.length ? base : pool);
  return candidates.find(v => v.name.toLowerCase().includes('google'))
    || candidates.find(v => v.name.toLowerCase().includes('microsoft'))
    || candidates[0];
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening?: boolean;
  onToggleListening?: () => void;
  isPlaying?: boolean;
  onTogglePlaying?: () => void;
}

export function VoiceModeModal({ isOpen, onClose }: VoiceModeModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [barHeights, setBarHeights] = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number>();
  const phaseRef = useRef<Phase>('idle');
  const langRef = useRef(selectedLang);
  // All final results accumulated this listening session
  const accumulatedRef = useRef<string>('');
  // Whether auto-loop (keep listening after AI speaks) is on
  const loopRef = useRef(false);

  useEffect(() => { langRef.current = selectedLang; }, [selectedLang]);

  useEffect(() => {
    const load = () => {
      const v = speechSynthesis.getVoices();
      if (v.length) setAllVoices(v);
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  const qualityVoices = filterQualityVoices(allVoices);

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Bar visualizer
  useEffect(() => {
    if (phase === 'listening' || phase === 'speaking' || phase === 'thinking') {
      const animate = () => {
        setBarHeights(prev => prev.map((h, i) => {
          const dist = Math.abs(i - 16) / 16;
          const maxH = phase === 'thinking' ? 12 : (1 - dist * 0.6) * 60;
          const speed = phase === 'thinking' ? 0.3 : 0.8;
          return Math.max(4, Math.min(maxH, h + (Math.random() - 0.5) * speed * maxH));
        }));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      setBarHeights(Array(32).fill(4));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [phase]);

  const speakText = useCallback((text: string, lang: string, onDone?: () => void) => {
    speechSynthesis.cancel();
    setPhaseSync('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = allVoices.length ? allVoices : speechSynthesis.getVoices();
    const picked = selectedVoiceName
      ? voices.find(v => v.name === selectedVoiceName)
      : pickBestVoice(voices, lang);
    if (picked) utterance.voice = picked;

    utterance.onend = () => { setPhaseSync('idle'); onDone?.(); };
    utterance.onerror = () => { setPhaseSync('idle'); onDone?.(); };
    speechSynthesis.speak(utterance);
  }, [setPhaseSync, selectedVoiceName, allVoices]);

  // Keep-alive: resume if Chrome randomly pauses
  useEffect(() => {
    if (phase !== 'speaking') return;
    const t = setInterval(() => {
      if (speechSynthesis.speaking && speechSynthesis.paused) speechSynthesis.resume();
    }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  const sendToAI = useCallback(async (transcript: string, lang: string) => {
    if (!transcript.trim()) { setPhaseSync('idle'); return; }
    setLiveTranscript('');
    setPhaseSync('thinking');
    const langName = LANGUAGES.find(l => l.code === lang)?.label ?? 'English';
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript.trim(),
          conversationId: 'voice-mode',
          model: 'forus-ai',
          provider: 'openai',
          systemPrompt: `You are Forus AI, a helpful voice assistant. The user is speaking ${langName}. RULES: 1) Reply ONLY in the exact same language/script as the user. 2) Keep reply under 3 sentences. 3) No markdown, no asterisks, no bullet points. Just plain spoken sentences.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response || data.message || '';
        setAiReply(reply);
        if (reply) {
          speakText(reply, lang, () => {
            if (loopRef.current) {
              // Auto-start next listening round
              startNewRecognition(langRef.current);
            } else {
              setPhaseSync('idle');
            }
          });
        } else {
          setPhaseSync('idle');
        }
      } else { setPhaseSync('idle'); }
    } catch { setPhaseSync('idle'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPhaseSync, speakText]);

  // Creates a fresh recognition instance and starts it
  const startNewRecognition = useCallback((lang: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing instance first
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    accumulatedRef.current = '';
    setLiveTranscript('');
    setPhaseSync('listening');

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = lang;
    rec.continuous = true;       // keep session open across pauses
    rec.interimResults = true;   // show live feedback

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          accumulatedRef.current += t + ' ';
        } else {
          interim += t;
        }
      }
      setLiveTranscript(accumulatedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') return; // ignore, Chrome fires this often
      if (e.error === 'aborted') return;
      console.warn('Recognition error:', e.error);
    };

    // Chrome fires onend unexpectedly even with continuous:true.
    // Restart ONLY if we are still supposed to be listening.
    rec.onend = () => {
      if (phaseRef.current === 'listening' && loopRef.current) {
        // Create a new instance — can't reuse a stopped instance
        setTimeout(() => {
          if (phaseRef.current === 'listening' && loopRef.current) {
            startNewRecognition(langRef.current);
          }
        }, 100);
      }
    };

    try { rec.start(); } catch (err) {
      console.warn('Recognition start failed:', err);
      setPhaseSync('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPhaseSync]);

  const stopListeningAndSend = useCallback(() => {
    loopRef.current = false;
    const transcript = accumulatedRef.current.trim();
    accumulatedRef.current = '';

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    if (transcript) {
      sendToAI(transcript, langRef.current);
    } else {
      setPhaseSync('idle');
    }
  }, [sendToAI, setPhaseSync]);

  const stopAll = useCallback(() => {
    loopRef.current = false;
    accumulatedRef.current = '';
    setLiveTranscript('');
    speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setPhaseSync('idle');
  }, [setPhaseSync]);

  const toggleMic = useCallback(() => {
    if (phase === 'idle') {
      // Prime Chrome's audio context with a silent utterance (must be sync in user-gesture handler)
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0;
      speechSynthesis.speak(primer);
      loopRef.current = true;
      startNewRecognition(selectedLang);
    } else if (phase === 'listening') {
      // Send whatever has been said so far
      stopListeningAndSend();
    } else if (phase === 'speaking') {
      // Interrupt AI speech and go idle
      stopAll();
    }
    // if thinking — do nothing (wait for AI)
  }, [phase, selectedLang, startNewRecognition, stopListeningAndSend, stopAll]);

  useEffect(() => {
    if (!isOpen) { stopAll(); setAiReply(''); }
  }, [isOpen, stopAll]);

  const isActive = phase !== 'idle';
  const glowOpacity = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;
  const statusLabel =
    phase === 'listening' ? 'Listening...' :
    phase === 'thinking' ? 'Thinking...' :
    phase === 'speaking' ? 'Speaking...' : 'Tap mic to start';

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Top status */}
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

      {/* Top left: language + voice */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => { setShowLangPicker(p => !p); setShowVoicePicker(false); }}
            className="text-white/40 hover:text-white/70 transition-colors p-2"
          >
            <Globe className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[140px] backdrop-blur-sm"
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      langRef.current = lang.code;
                      setShowLangPicker(false);
                      if (isActive) stopAll();
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedLang === lang.code ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowVoicePicker(p => !p); setShowLangPicker(false); }}
            className="text-white/40 hover:text-white/70 transition-colors p-2"
          >
            <AudioLines className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showVoicePicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-10 left-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 backdrop-blur-sm overflow-y-auto"
                style={{ minWidth: 230, maxHeight: 340 }}
              >
                <div className="px-3 py-1.5 text-white/40 text-xs font-semibold uppercase tracking-wider">Voice</div>
                <button
                  onClick={() => { setSelectedVoiceName(''); setShowVoicePicker(false); }}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${!selectedVoiceName ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  <span>Auto (best match)</span>
                  {!selectedVoiceName && <span className="text-white/50 text-xs">✓</span>}
                </button>
                {qualityVoices.map(v => (
                  <button
                    key={v.name}
                    onClick={() => { setSelectedVoiceName(v.name); setShowVoicePicker(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${selectedVoiceName === v.name ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{v.name}</span>
                      <span className="text-[10px] text-white/30">{v.lang}</span>
                    </div>
                    {selectedVoiceName === v.name && <span className="text-white/50 text-xs flex-shrink-0">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center: transcript + reply */}
      <div className="flex-1 w-full relative flex flex-col items-center justify-center px-8 gap-4">
        {/* Live transcript while user speaks */}
        <AnimatePresence>
          {phase === 'listening' && liveTranscript && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-center text-sm italic max-w-sm"
            >
              {liveTranscript}
            </motion.p>
          )}
        </AnimatePresence>

        {/* AI reply */}
        <AnimatePresence mode="wait">
          {aiReply ? (
            <motion.p
              key={aiReply}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/85 text-center text-base leading-relaxed max-w-md"
            >
              {aiReply}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Glow + visualizer */}
      <div className="relative w-full flex flex-col items-center" style={{ marginBottom: '-1px' }}>
        <motion.div
          animate={{ opacity: glowOpacity }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${glowBlur * 2}px`,
            background: `radial-gradient(ellipse 80% 100% at 50% 100%, #ffffff, #e5e7eb 20%, #9ca3af 45%, transparent 75%)`,
            filter: `blur(${glowBlur * 0.3}px)`,
          }}
        />
        <div className="relative z-10 flex items-end justify-center gap-[3px] pb-2" style={{ height: '80px' }}>
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: h }}
              transition={{ duration: 0.05, ease: 'linear' }}
              className="rounded-full"
              style={{
                width: '3px',
                background: `rgba(255, 255, 255, ${0.35 + (h / 60) * 0.65})`,
                boxShadow: h > 20 ? `0 0 6px rgba(255,255,255,0.7)` : 'none',
              }}
            />
          ))}
        </div>
        <motion.div
          animate={{ opacity: glowOpacity }}
          transition={{ duration: 0.5 }}
          className="w-full relative overflow-hidden"
          style={{ height: '160px' }}
        >
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '160px',
              background: 'radial-gradient(ellipse 100% 80% at 50% 100%, #ffffff 0%, #d1d5db 20%, #6b7280 50%, transparent 75%)',
              borderRadius: '60% 60% 0 0',
            }}
          />
        </motion.div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-5 z-50">

        {/* Mic / Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
            phase === 'listening'
              ? 'bg-white border-white text-black'
              : phase === 'thinking'
              ? 'bg-zinc-800/60 border-white/10 text-white/30 cursor-not-allowed'
              : 'bg-zinc-800/80 border-white/10 text-white/70 hover:bg-zinc-700/80'
          }`}
        >
          {phase === 'listening'
            ? <Send className="w-5 h-5" />
            : phase === 'speaking'
            ? <MicOff className="w-5 h-5" />
            : <Mic className="w-5 h-5" />}
        </motion.button>

        {/* End call */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { stopAll(); onClose(); }}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors border border-red-400/30"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>
    </div>,
    document.body
  );
}
