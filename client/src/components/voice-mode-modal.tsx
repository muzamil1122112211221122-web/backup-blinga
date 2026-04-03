import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, MicOff, X, Globe, MonitorUp } from "lucide-react";
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
  const [barHeights, setBarHeights] = useState<number[]>(Array(32).fill(4));

  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number>();
  const phaseRef = useRef<Phase>('idle');
  const autoRestartRef = useRef(false);
  const langRef = useRef(selectedLang);

  useEffect(() => { langRef.current = selectedLang; }, [selectedLang]);

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Animate the bar visualizer
  useEffect(() => {
    if (phase === 'listening' || phase === 'speaking' || phase === 'thinking') {
      const animate = () => {
        setBarHeights(prev => prev.map((h, i) => {
          const center = 16;
          const dist = Math.abs(i - center) / center;
          const maxH = phase === 'thinking' ? 12 : (1 - dist * 0.6) * 60;
          const speed = phase === 'thinking' ? 0.3 : 0.8;
          const next = h + (Math.random() - 0.5) * speed * maxH;
          return Math.max(4, Math.min(maxH, next));
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;
    utterance.rate = 1;
    utterance.onstart = () => setPhaseSync('speaking');
    utterance.onend = () => { if (onDone) onDone(); };
    utterance.onerror = () => { if (onDone) onDone(); };
    speechSynthesis.speak(utterance);
  }, [setPhaseSync]);

  const sendToAI = useCallback(async (transcript: string, lang: string) => {
    setPhaseSync('thinking');
    const langName = LANGUAGES.find(l => l.code === lang)?.label ?? 'English';
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          conversationId: 'voice-mode',
          model: 'forus-ai',
          provider: 'openai',
          systemPrompt: `You are Forus AI, a voice assistant. User speaks ${langName}. CRITICAL: Reply in the EXACT same language/script. Keep it concise — 1–3 sentences max, no markdown, no bullet points.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response || data.message || '';
        speakText(reply, lang, () => {
          if (autoRestartRef.current && phaseRef.current !== 'idle') {
            startListening(langRef.current);
          } else {
            setPhaseSync('idle');
          }
        });
      } else { setPhaseSync('idle'); }
    } catch { setPhaseSync('idle'); }
  }, [setPhaseSync, speakText]);

  const startListening = useCallback((lang: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setPhaseSync('listening');
    recognition.onresult = (e: any) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) t += e.results[i][0].transcript;
      }
      if (t.trim()) sendToAI(t.trim(), lang);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') setPhaseSync('idle');
    };
    recognition.onend = () => {
      if (phaseRef.current === 'listening') setPhaseSync('idle');
    };
    try { recognition.start(); } catch { setPhaseSync('idle'); }
  }, [setPhaseSync, sendToAI]);

  const stopAll = useCallback(() => {
    autoRestartRef.current = false;
    speechSynthesis.cancel();
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    setPhaseSync('idle');
  }, [setPhaseSync]);

  const toggleMic = useCallback(() => {
    if (phase === 'idle') {
      autoRestartRef.current = true;
      startListening(selectedLang);
    } else {
      stopAll();
    }
  }, [phase, selectedLang, startListening, stopAll]);

  useEffect(() => {
    if (!isOpen) { stopAll(); }
  }, [isOpen, stopAll]);

  const isActive = phase !== 'idle';

  // Glow intensity
  const glowOpacity = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.5 : 0.25;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;

  const statusLabel =
    phase === 'listening' ? 'Listening...' :
    phase === 'thinking' ? 'Thinking...' :
    phase === 'speaking' ? 'Speaking...' : 'Live';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopAll(); onClose(); } }}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 border-none overflow-hidden bg-black flex flex-col items-center justify-between select-none">

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center pt-5 z-50">
          <div className="flex items-center gap-2">
            {/* Waveform icon */}
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

        {/* Language picker — top right */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowLangPicker(p => !p)}
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
                className="absolute top-10 right-0 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 flex flex-col gap-0.5 min-w-[130px] backdrop-blur-sm"
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLang(lang.code); setShowLangPicker(false); if (isActive) stopAll(); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedLang === lang.code ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main dark area — fills most of the screen */}
        <div className="flex-1 w-full relative" />

        {/* Glow + bar visualizer — bottom of main area */}
        <div className="relative w-full flex flex-col items-center" style={{ marginBottom: '-1px' }}>
          {/* Glow bloom */}
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

          {/* Bar visualizer */}
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
                  boxShadow: h > 20 ? `0 0 6px rgba(255, 255, 255, 0.7)` : 'none',
                }}
              />
            ))}
          </div>

          {/* Glowing capsule — gray-to-white */}
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
          {/* Screen share placeholder */}
          <button className="w-14 h-14 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center text-white/60 hover:bg-zinc-700/80 transition-colors">
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* Mic toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
              isActive
                ? 'bg-zinc-700/80 border-white/20 text-white'
                : 'bg-zinc-800/80 border-white/10 text-white/70 hover:bg-zinc-700/80'
            }`}
          >
            {isActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* End / close — red */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { stopAll(); onClose(); }}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors border border-red-400/30"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
