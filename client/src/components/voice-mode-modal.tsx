import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, X, Globe, AudioLines, Send, Camera, Monitor, CameraOff } from "lucide-react";
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
   Voice presets — Edge neural voices per language
───────────────────────────────────────────── */
const LANG_VOICES: Record<string, Array<{id: string; label: string; icon: string; desc: string; voice: string}>> = {
  'en-US': [
    { id: 'en-male1',  label: 'Guy',       icon: '♂', desc: 'American Deep',       voice: 'en-US-GuyNeural' },
    { id: 'en-male2',  label: 'Ryan',      icon: '♂', desc: 'British Accent',      voice: 'en-GB-RyanNeural' },
    { id: 'en-fem1',   label: 'Natasha',   icon: '♀', desc: 'Australian',          voice: 'en-AU-NatashaNeural' },
    { id: 'en-fem2',   label: 'Jenny',     icon: '♀', desc: 'American Natural',    voice: 'en-US-JennyNeural' },
  ],
  'ur-PK': [
    { id: 'ur-fem1',   label: 'اُزمٰا',   icon: '♀', desc: 'اردو خاتون',          voice: 'ur-PK-UzmaNeural' },
    { id: 'ur-male1',  label: 'اسد',      icon: '♂', desc: 'اردو مرد',            voice: 'ur-PK-AsadNeural' },
  ],
  'hi-IN': [
    { id: 'hi-fem1',   label: 'स्वरा',    icon: '♀', desc: 'हिंदी महिला',         voice: 'hi-IN-SwaraNeural' },
    { id: 'hi-male1',  label: 'मधुर',     icon: '♂', desc: 'हिंदी पुरुष',          voice: 'hi-IN-MadhurNeural' },
  ],
  'ar-SA': [
    { id: 'ar-fem1',   label: 'زارية',    icon: '♀', desc: 'عربي أنثى',           voice: 'ar-SA-ZariyahNeural' },
    { id: 'ar-male1',  label: 'حامد',     icon: '♂', desc: 'عربي ذكر',            voice: 'ar-SA-HamedNeural' },
  ],
  'fr-FR': [
    { id: 'fr-fem1',   label: 'Denise',   icon: '♀', desc: 'Français Femme',      voice: 'fr-FR-DeniseNeural' },
    { id: 'fr-male1',  label: 'Henri',    icon: '♂', desc: 'Français Homme',      voice: 'fr-FR-HenriNeural' },
  ],
  'es-ES': [
    { id: 'es-fem1',   label: 'Elvira',   icon: '♀', desc: 'Español Mujer',       voice: 'es-ES-ElviraNeural' },
    { id: 'es-male1',  label: 'Álvaro',   icon: '♂', desc: 'Español Hombre',      voice: 'es-ES-AlvaroNeural' },
  ],
  'de-DE': [
    { id: 'de-fem1',   label: 'Katja',    icon: '♀', desc: 'Deutsch Frau',        voice: 'de-DE-KatjaNeural' },
    { id: 'de-male1',  label: 'Conrad',   icon: '♂', desc: 'Deutsch Mann',        voice: 'de-DE-ConradNeural' },
  ],
  'zh-CN': [
    { id: 'zh-fem1',   label: '晓晓',     icon: '♀', desc: '中文女声',             voice: 'zh-CN-XiaoxiaoNeural' },
    { id: 'zh-male1',  label: '云希',     icon: '♂', desc: '中文男声',             voice: 'zh-CN-YunxiNeural' },
  ],
  'pt-BR': [
    { id: 'pt-fem1',   label: 'Francisca',icon: '♀', desc: 'Português Feminino',  voice: 'pt-BR-FranciscaNeural' },
    { id: 'pt-male1',  label: 'Antônio',  icon: '♂', desc: 'Português Masculino', voice: 'pt-BR-AntonioNeural' },
  ],
  'ru-RU': [
    { id: 'ru-fem1',   label: 'Светлана', icon: '♀', desc: 'Русский Женский',     voice: 'ru-RU-SvetlanaNeural' },
    { id: 'ru-male1',  label: 'Дмитрий',  icon: '♂', desc: 'Русский Мужской',     voice: 'ru-RU-DmitryNeural' },
  ],
  'ja-JP': [
    { id: 'ja-fem1',   label: '七海',     icon: '♀', desc: '日本語 女性',          voice: 'ja-JP-NanamiNeural' },
    { id: 'ja-male1',  label: '慶太',     icon: '♂', desc: '日本語 男性',          voice: 'ja-JP-KeitaNeural' },
  ],
  'ko-KR': [
    { id: 'ko-fem1',   label: '선희',     icon: '♀', desc: '한국어 여성',          voice: 'ko-KR-SunHiNeural' },
    { id: 'ko-male1',  label: '인준',     icon: '♂', desc: '한국어 남성',          voice: 'ko-KR-InJoonNeural' },
  ],
  'it-IT': [
    { id: 'it-fem1',   label: 'Elsa',     icon: '♀', desc: 'Italiano Donna',      voice: 'it-IT-ElsaNeural' },
    { id: 'it-male1',  label: 'Diego',    icon: '♂', desc: 'Italiano Uomo',       voice: 'it-IT-DiegoNeural' },
  ],
  'tr-TR': [
    { id: 'tr-fem1',   label: 'Emel',     icon: '♀', desc: 'Türkçe Kadın',        voice: 'tr-TR-EmelNeural' },
    { id: 'tr-male1',  label: 'Ahmet',    icon: '♂', desc: 'Türkçe Erkek',        voice: 'tr-TR-AhmetNeural' },
  ],
};

function getVoicesForLang(code: string) {
  return LANG_VOICES[code] ?? LANG_VOICES['en-US'];
}

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
interface HistoryMsg { role: 'user' | 'assistant'; content: string; }

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
type CamMode = 'off' | 'camera' | 'screen';
interface Props { isOpen: boolean; onClose: () => void; }

export function VoiceModeModal({ isOpen, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [lang, setLang]           = useState(() => localStorage.getItem('voiceLang') || 'en-US');
  const [showLang, setShowLang]   = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [selSlot, setSelSlot]     = useState(() => {
    const savedLang = localStorage.getItem('voiceLang') || 'en-US';
    return getVoicesForLang(savedLang)[0].id;
  });
  const [bars, setBars]           = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]     = useState('');
  const [liveText, setLiveText]   = useState('');
  const [camMode, setCamMode]     = useState<CamMode>('off');
  const [camError, setCamError]   = useState('');

  const phaseRef      = useRef<Phase>('idle');
  const langRef       = useRef('en-US');
  const selSlotRef    = useRef('male1');
  const inConvRef     = useRef(false);
  const collectedRef  = useRef('');
  const recRef        = useRef<any>(null);
  const animRef       = useRef<number>();
  const historyRef    = useRef<HistoryMsg[]>([]);
  const interimRef    = useRef('');   // last interim transcript — fallback if final never fires
  const speakSessRef  = useRef(0);    // incremented each speak — used to cancel orphaned playback
  const curSourceRef  = useRef<AudioBufferSourceNode | null>(null); // currently playing node
  const audioCtxRef   = useRef<AudioContext | null>(null); // shared, stays unlocked after first tap
  const videoRef      = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const camModeRef    = useRef<CamMode>('off');

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  /* ── Camera / Screen share helpers ── */
  const stopCam = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (m: 'camera' | 'screen') => {
    stopCam();
    setCamError('');
    try {
      let stream: MediaStream;
      if (m === 'screen') {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      stream.getVideoTracks()[0].onended = () => { stopCam(); setCamMode('off'); camModeRef.current = 'off'; };
    } catch (err: any) {
      setCamError(err?.message || 'Camera permission denied.');
      setCamMode('off');
      camModeRef.current = 'off';
    }
  }, [stopCam]);

  const toggleCam = async (m: 'camera' | 'screen') => {
    if (camModeRef.current === m) {
      stopCam(); setCamMode('off'); camModeRef.current = 'off';
    } else {
      setCamMode(m); camModeRef.current = m;
      await startCam(m);
    }
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = Math.min(video.videoWidth, 640);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) { stopCam(); setCamMode('off'); camModeRef.current = 'off'; }
  }, [isOpen, stopCam]);

  useEffect(() => {
    langRef.current = lang;
    localStorage.setItem('voiceLang', lang);
    // Auto-switch to first voice of the new language
    const voices = getVoicesForLang(lang);
    const firstId = voices[0].id;
    setSelSlot(firstId);
    selSlotRef.current = firstId;
  }, [lang]);
  useEffect(() => { selSlotRef.current = selSlot; }, [selSlot]);

  // Add/remove body class so CSS can instantly hide the message bar with no React timing gap
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('voice-mode-active');
    } else {
      document.body.classList.remove('voice-mode-active');
    }
    return () => { document.body.classList.remove('voice-mode-active'); };
  }, [isOpen]);

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

  /* ── Lazily get (or create + resume) the shared AudioContext ── */
  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  /* ── After all audio finishes — auto-restart listening if still in conversation ── */
  function afterSpeech() {
    curSourceRef.current = null;
    if (inConvRef.current) {
      startNewTurn();   // seamless continuous conversation
    } else {
      syncPhase('idle');
    }
  }

  /* ── Browser speech — last resort if Edge TTS fails due to network error ── */
  function speakBrowserFallback(text: string): Promise<void> {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = langRef.current;
      utt.rate = 1.05; utt.pitch = 1;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }

  /* ── Fetch one TTS chunk — returns raw WAV bytes or null ── */
  async function fetchChunk(sentence: string, voice: string, signal: AbortSignal): Promise<ArrayBuffer | null> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal,
        body: JSON.stringify({ text: sentence, voice }),
      });
      if (!res.ok) return null;
      const { audio } = await res.json();
      if (!audio) return null;
      // Decode base64 → ArrayBuffer
      const bin = atob(audio);
      const buf = new ArrayBuffer(bin.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
      return buf;
    } catch {
      return null;
    }
  }

  /* ── Play an ArrayBuffer through the shared AudioContext (autoplay-safe) ── */
  function playBuffer(buf: ArrayBuffer, sess: number): Promise<void> {
    return new Promise(async resolve => {
      if (speakSessRef.current !== sess) { resolve(); return; }
      try {
        const ctx = getAudioCtx();
        const decoded = await ctx.decodeAudioData(buf);
        if (speakSessRef.current !== sess) { resolve(); return; }
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        curSourceRef.current = src;
        src.onended = () => { curSourceRef.current = null; resolve(); };
        src.start(0);
      } catch {
        curSourceRef.current = null;
        resolve();
      }
    });
  }

  /* ── Stop all ongoing speech (AudioContext source + browser synthesis) ── */
  function stopSpeech() {
    speakSessRef.current++;          // invalidates any in-flight sendToAI loop
    window.speechSynthesis.cancel();
    if (curSourceRef.current) { try { curSourceRef.current.stop(); } catch {} curSourceRef.current = null; }
  }

  /* ── Main AI call — streaming SSE; TTS fires per-sentence AND playback starts
         immediately on the first ready chunk while generation still continues ── */
  async function sendToAI(text: string) {
    if (!text.trim()) { syncPhase('idle'); return; }
    syncPhase('thinking');
    setLiveText('');

    // Capture frame if camera/screen is active
    const frameB64 = camModeRef.current !== 'off' ? captureFrame() : null;

    const langLabel = LANGUAGES.find(x => x.code === langRef.current)?.label ?? 'English';
    historyRef.current = [...historyRef.current, { role: 'user', content: text.trim() }];
    if (historyRef.current.length > 30) historyRef.current = historyRef.current.slice(-30);

    const sess = ++speakSessRef.current;
    const voices = getVoicesForLang(langRef.current);
    const slot = voices.find(s => s.id === selSlotRef.current) ?? voices[0];
    const ac = new AbortController();

    // Queue of TTS promises — producer (SSE reader) pushes, consumer (playback loop) pops
    const ttsPending: Promise<ArrayBuffer | null>[] = [];
    const sentenceTexts: string[] = [];
    let streamDone = false;   // set true when SSE loop exits

    // Notify the playback consumer when a new item is added
    let notifyConsumer: (() => void) | null = null;

    function fireSentence(s: string) {
      if (!s.trim()) return;
      sentenceTexts.push(s.trim());
      ttsPending.push(fetchChunk(s.trim(), slot.voice, ac.signal));
      notifyConsumer?.();   // wake the playback loop if it's waiting
    }

    // ── Playback consumer — runs concurrently with SSE reader ──
    const playbackDone = (async () => {
      let i = 0;
      // Wait for first sentence before switching to 'speaking'
      await new Promise<void>(r => {
        if (ttsPending.length > 0) { r(); return; }
        notifyConsumer = r;
      });
      notifyConsumer = null;
      if (speakSessRef.current !== sess) return;
      syncPhase('speaking');

      while (true) {
        if (i >= ttsPending.length) {
          if (streamDone) break;   // nothing left and stream finished
          // Wait for next sentence
          await new Promise<void>(r => {
            if (i < ttsPending.length || streamDone) { r(); return; }
            notifyConsumer = r;
          });
          notifyConsumer = null;
          continue;
        }
        if (speakSessRef.current !== sess) { ac.abort(); return; }
        const buf = await ttsPending[i];
        if (speakSessRef.current !== sess) { ac.abort(); return; }
        if (buf) {
          await playBuffer(buf, sess);
        } else {
          await speakBrowserFallback(sentenceTexts[i]);
        }
        i++;
      }
      if (speakSessRef.current === sess) afterSpeech();
    })();

    // ── SSE producer ──
    try {
      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        credentials: 'include',
        body: JSON.stringify({
          message: text.trim(),
          history: historyRef.current.slice(0, -1),
          lang: langLabel,
          ...(frameB64 ? { image: frameB64 } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        streamDone = true; notifyConsumer?.();
        const errMsg = "Sorry, I couldn't reach the AI right now.";
        setAiReply(errMsg); speakBrowserFallback(errMsg);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let sseBuf = '';
      let accumulated = '';
      let remainder = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += dec.decode(value, { stream: true });
        const lines = sseBuf.split('\n');
        sseBuf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]' || d === '[ERROR]' || !d) continue;
          try {
            const { delta } = JSON.parse(d);
            if (delta) {
              accumulated += delta;
              remainder += delta;
              setAiReply(accumulated);
              let m: RegExpMatchArray | null;
              while ((m = remainder.match(/^(.*?[.!?…])\s*/s)) !== null) {
                fireSentence(m[1]);
                remainder = remainder.slice(m[0].length);
              }
            }
          } catch {}
        }
      }

      if (remainder.trim()) fireSentence(remainder);

      if (!accumulated.trim()) { syncPhase('idle'); return; }
      historyRef.current = [...historyRef.current, { role: 'assistant', content: accumulated }];
      if (historyRef.current.length > 30) historyRef.current = historyRef.current.slice(-30);

    } catch {
      syncPhase('idle');
    } finally {
      streamDone = true;
      notifyConsumer?.();   // wake consumer so it can exit the while loop
    }

    await playbackDone;
  }

  /* ── Speech recognition ── */
  function startNewTurn() {
    if (!inConvRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setAiReply('Speech recognition requires Chrome or Edge.'); return; }

    if (recRef.current) {
      try { recRef.current.onend = null; recRef.current.abort(); } catch {}
      recRef.current = null;
    }

    collectedRef.current = '';
    interimRef.current   = '';
    setLiveText('');
    syncPhase('listening');

    const rec = new SR();
    recRef.current = rec;
    rec.lang = langRef.current;
    rec.continuous     = true;   // stay open — don't cut off mid-sentence
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          collectedRef.current += t + ' ';
          interimRef.current = '';   // final arrived — clear interim cache
        } else {
          interim += t;
          interimRef.current = interim;  // always keep latest interim as fallback
        }
      }
      setLiveText(collectedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') return;   // continuous mode — keep waiting
      if (e.error === 'not-allowed') {
        syncPhase('idle'); inConvRef.current = false;
        setAiReply('Microphone access denied. Allow mic permissions and try again.');
        return;
      }
      console.warn('[STT] error:', e.error);
    };

    rec.onend = () => {
      if (phaseRef.current !== 'listening' || !inConvRef.current) return;

      // Use final text, or fall back to any interim text that was captured
      const text = (collectedRef.current + interimRef.current).trim();
      if (text) {
        sendToAI(text);
      } else {
        // Genuinely heard nothing — stop and go idle
        syncPhase('idle');
        inConvRef.current = false;
        setAiReply('');
      }
    };

    try { rec.start(); } catch (e) { console.error('[STT] start:', e); syncPhase('idle'); }
  }

  /* ── Mic button tap ── */
  function handleMicTap() {
    if (phase === 'thinking') return;
    if (phase === 'idle') {
      // Unlock AudioContext on user gesture (no SpeechSynthesis call — it causes a browser pop sound)
      getAudioCtx().resume();
      inConvRef.current = true;
      startNewTurn();
    } else if (phase === 'listening') {
      if (recRef.current) { try { recRef.current.onend = null; recRef.current.stop(); } catch {} recRef.current = null; }
      const text = (collectedRef.current + interimRef.current).trim();
      if (text) sendToAI(text); else { inConvRef.current = false; syncPhase('idle'); }
    } else if (phase === 'speaking') {
      // Interrupt — stop Gemini audio + browser synth, then listen
      stopSpeech();
      startNewTurn();
    }
  }

  function handleClose() {
    inConvRef.current = false;
    if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
    stopSpeech();
    // Suspend then close — avoids the abrupt audio click/pop that hard-close causes
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      try { ctx.suspend().then(() => ctx.close()).catch(() => {}); } catch {}
    }
    collectedRef.current = '';
    syncPhase('idle'); setAiReply(''); setLiveText('');
    onClose();
  }

  useEffect(() => { if (!isOpen) handleClose(); }, [isOpen]); // eslint-disable-line

  /* ── Visuals ── */
  const glowOp   = phase === 'listening' ? 0.95 : phase === 'speaking' ? 0.85 : phase === 'thinking' ? 0.45 : 0.22;
  const glowBlur = phase === 'listening' ? 80 : phase === 'speaking' ? 70 : 40;

  const isUrdu = lang === 'ur-PK';
  const statusLabel =
    phase === 'listening' ? (isUrdu ? 'سن رہا ہے...' : 'Listening...') :
    phase === 'thinking'  ? (isUrdu ? 'سوچ رہا ہے...' : 'Thinking...') :
    phase === 'speaking'  ? (isUrdu ? 'بول رہا ہے...' : 'Speaking...') :
    (isUrdu ? 'مائک دبائیں' : 'Tap mic to start');

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
        </div>
      </div>

      {/* Video PiP — always in DOM so videoRef is never null; visibility toggled */}
      <div className="absolute top-16 right-4 z-50 rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-300"
        style={{ width: 140, height: 90, background: '#111', opacity: camMode !== 'off' ? 1 : 0, pointerEvents: camMode !== 'off' ? 'auto' : 'none' }}>
        <video ref={videoRef} autoPlay muted playsInline
          className="w-full h-full object-cover"
          style={{ transform: camMode === 'camera' ? 'scaleX(-1)' : 'none' }} />
        {camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80 px-2 text-center">
            <CameraOff className="w-5 h-5 text-white/40" />
            <span className="text-white/40 text-[9px] leading-tight">{camError.slice(0, 40)}</span>
          </div>
        )}
        {camMode !== 'off' && !camError && (
          <div className="absolute top-1 left-1 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/50 text-[9px]">{camMode === 'screen' ? 'Screen' : 'Cam'}</span>
          </div>
        )}
      </div>

      {/* Top-left: language + voice pickers */}
      <div className="absolute top-4 left-4 z-50 flex gap-1 items-center">
        {/* Language */}
        <div className="relative">
          <button onClick={() => { setShowLang(p => !p); setShowVoice(false); }}
            className="flex items-center gap-1.5 text-white/60 hover:text-white/90 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">{LANGUAGES.find(l => l.code === lang)?.label ?? 'English'}</span>
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
                {getVoicesForLang(lang).map(slot => (
                  <button key={slot.id}
                    onClick={() => { setSelSlot(slot.id); selSlotRef.current = slot.id; setShowVoice(false); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors ${selSlot === slot.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <span className="text-base">{slot.icon}</span>
                    <span className="flex-1 flex flex-col leading-tight">
                      <span>{slot.label}</span>
                      <span className="text-xs opacity-50">{slot.desc}</span>
                    </span>
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
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-50 items-center">
        {/* Camera toggle */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleCam('camera')}
          title="Camera"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
            camMode === 'camera'
              ? 'bg-blue-500 border-blue-400/40 text-white'
              : 'bg-zinc-800/80 border-white/10 text-white/50 hover:bg-zinc-700/80 hover:text-white/80'
          }`}>
          <Camera className="w-4 h-4" />
        </motion.button>

        {/* Mic / Send / Interrupt */}
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

        {/* End call */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white border border-red-400/30 transition-colors">
          <X className="w-6 h-6" />
        </motion.button>

        {/* Screen share toggle */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleCam('screen')}
          title="Screen Share"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
            camMode === 'screen'
              ? 'bg-purple-500 border-purple-400/40 text-white'
              : 'bg-zinc-800/80 border-white/10 text-white/50 hover:bg-zinc-700/80 hover:text-white/80'
          }`}>
          <Monitor className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body
  );
}
