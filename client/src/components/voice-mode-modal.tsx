import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, MicOff, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./logo";

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

interface Message { role: 'user' | 'ai'; text: string; }

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [level, setLevel] = useState(0);
  const [statusText, setStatusText] = useState('Tap mic to start');

  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number>();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const autoRestartRef = useRef(true);

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Animate audio level when active
  useEffect(() => {
    if (phase === 'listening' || phase === 'speaking') {
      const animate = () => {
        setLevel(prev => Math.max(0.1, Math.min(1, prev + (Math.random() - 0.5) * 0.4)));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      setLevel(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [phase]);

  // Status text
  useEffect(() => {
    if (phase === 'listening') setStatusText('Listening...');
    else if (phase === 'thinking') setStatusText('Thinking...');
    else if (phase === 'speaking') setStatusText('Speaking...');
    else setStatusText('Tap mic to start');
  }, [phase]);

  const speakText = useCallback((text: string, lang: string, onDone?: () => void) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    // Pick a voice matching the language if available
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;
    utterance.rate = 1;
    utterance.onstart = () => setPhaseSync('speaking');
    utterance.onend = () => {
      utteranceRef.current = null;
      if (onDone) onDone();
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      if (onDone) onDone();
    };
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, []);

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
          systemPrompt: `You are Forus AI, a helpful voice assistant. The user is speaking in ${langName}. CRITICAL: Always reply in the EXACT same language and script as the user. Keep responses concise and conversational — suitable for speaking aloud (2–4 sentences max). Never use markdown, bullet points, or code blocks.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response || data.message || 'I could not respond.';
        setMessages(prev => [...prev, { role: 'ai', text: reply }]);
        speakText(reply, lang, () => {
          if (autoRestartRef.current && phaseRef.current !== 'idle') {
            startListeningCycle(lang);
          } else {
            setPhaseSync('idle');
          }
        });
      } else {
        setPhaseSync('idle');
      }
    } catch {
      setPhaseSync('idle');
    }
  }, [speakText]);

  const startListeningCycle = useCallback((lang: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setPhaseSync('idle'); return; }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setPhaseSync('listening');

    recognition.onresult = (e: any) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
      }
      if (transcript.trim()) {
        setMessages(prev => [...prev, { role: 'user', text: transcript.trim() }]);
        sendToAI(transcript.trim(), lang);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') setPhaseSync('idle');
    };

    recognition.onend = () => {
      if (phaseRef.current === 'listening') setPhaseSync('idle');
    };

    try { recognition.start(); } catch { setPhaseSync('idle'); }
  }, [sendToAI]);

  const stopAll = useCallback(() => {
    autoRestartRef.current = false;
    speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setPhaseSync('idle');
  }, []);

  const toggleConversation = useCallback(() => {
    if (phase === 'idle') {
      autoRestartRef.current = true;
      startListeningCycle(selectedLang);
    } else {
      stopAll();
    }
  }, [phase, selectedLang, startListeningCycle, stopAll]);

  // Stop everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      setMessages([]);
    }
  }, [isOpen, stopAll]);

  const isActive = phase !== 'idle';
  const selectedLangLabel = LANGUAGES.find(l => l.code === selectedLang)?.label ?? 'English';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopAll(); onClose(); } }}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-black border-none text-white overflow-hidden flex flex-col items-center justify-between">

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6 z-50">
          {/* Language picker */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full gap-2 text-sm"
              onClick={() => setShowLangPicker(p => !p)}
            >
              <Globe className="h-4 w-4" />
              {selectedLangLabel}
            </Button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-10 left-0 bg-zinc-900 border border-white/10 rounded-2xl p-2 flex flex-col gap-1 min-w-[130px] z-50"
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang.code); setShowLangPicker(false); if (isActive) { stopAll(); } }}
                      className={`text-left px-3 py-1.5 rounded-xl text-sm transition-colors ${selectedLang === lang.code ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { stopAll(); onClose(); }}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Conversation history */}
        <div className="w-full max-w-md mt-20 mb-4 flex-1 overflow-y-auto px-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600/80 text-white'
                    : 'bg-white/10 text-white/90'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Central orb */}
        <div className="flex flex-col items-center justify-center pb-4">
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            {/* Glow layers */}
            <motion.div
              animate={{ scale: [1, 1.1 + level * 0.2, 1], opacity: [0.3, 0.5 + level * 0.3, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl"
            />
            {/* Main orb */}
            <motion.div
              animate={{ scale: isActive ? 1.05 + level * 0.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)]"
            >
              <div className="absolute inset-0 bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-[#0066FF] to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#40E0D0]/40 to-transparent" />
                <motion.div
                  animate={{ y: [-5, 5, -5], x: [-3, 3, -3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-1/4 left-0 right-0 h-3/4 bg-white/40 blur-3xl rounded-full"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Logo size="lg" className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] opacity-60 mix-blend-overlay" />
              </div>
            </motion.div>
          </div>

          {/* Status */}
          <h2 className="text-xl font-light tracking-widest text-white/90 uppercase mb-1">FORUS AI</h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-white/50 text-sm mb-8"
            >
              {statusText}
            </motion.p>
          </AnimatePresence>

          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleConversation}
            className={`h-16 w-16 rounded-full border flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                : 'bg-white/5 border-white/20 hover:bg-white/10'
            }`}
          >
            {isActive
              ? <MicOff className="h-7 w-7 text-white" />
              : <Mic className="h-7 w-7 text-white/80" />
            }
          </motion.button>
          <p className="text-white/30 text-xs mt-3">{isActive ? 'Tap to stop' : 'Tap to talk'}</p>
        </div>

        {/* Background mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute inset-0 bg-black" />
          <motion.div
            animate={{ opacity: isActive ? 0.4 : 0.15 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
