import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, X, Send, Camera, Monitor, CameraOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   Automatic language + voice/accent detection
   — no manual language picker, works like
   Gemini's voice mode: detects the language of
   the text itself and picks the matching voice.
   English → Guy (American accent)
   Roman Urdu / Urdu / Hindi → Asad (Urdu accent)
───────────────────────────────────────────── */
function detectSpokenLang(text: string): { code: 'en' | 'ur'; label: string; voice: string } {
  // Native Urdu/Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return { code: 'ur', label: 'اردو', voice: 'ur-PK-AsadNeural' };
  // Native Hindi (Devanagari) script — still uses Asad's accent per app convention
  if (/[\u0900-\u097F]/.test(text)) return { code: 'ur', label: 'हिन्दी', voice: 'ur-PK-AsadNeural' };
  // Roman Urdu / Hindi keywords typed in Latin script
  if (/\b(hai|hain|kya|aap|mein|nahi|haan|bhi|toh|ab|jo|ke|ka|ki|ko|yeh|woh|tha|thi|theek|accha|lekin|phir|kaisa|matlab|bilkul|kyun|kaise|kab|kaun|kahan|aaj|agar|tum|hum)\b/i.test(text))
    return { code: 'ur', label: 'Roman Urdu', voice: 'ur-PK-AsadNeural' };
  return { code: 'en', label: 'English', voice: 'en-US-GuyNeural' };
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
  // Auto-detected language of the conversation — no manual picker, updates live
  const [autoLang, setAutoLang]   = useState<'en' | 'ur'>('en');
  const [bars, setBars]           = useState<number[]>(Array(32).fill(4));
  const [aiReply, setAiReply]     = useState('');
  const [liveText, setLiveText]   = useState('');
  const [camMode, setCamMode]     = useState<CamMode>('off');
  const [camError, setCamError]   = useState('');

  const phaseRef        = useRef<Phase>('idle');
  const autoLangRef     = useRef<'en' | 'ur'>('en');
  const inConvRef       = useRef(false);
  const collectedRef    = useRef('');
  const recRef          = useRef<any>(null);
  const animRef         = useRef<number>();
  const historyRef      = useRef<HistoryMsg[]>([]);
  const interimRef      = useRef('');
  const speakSessRef    = useRef(0);
  const curSourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const camModeRef      = useRef<CamMode>('off');
  // MediaRecorder STT fallback (used when Web Speech API is blocked in iframe)
  const useMediaSTTRef   = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  /* ── Camera / Screen share — media APIs called directly in gesture context ── */
  function stopCam() {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // Called directly from button onClick — must stay synchronous up to the getUserMedia/getDisplayMedia call
  async function toggleCam(m: 'camera' | 'screen') {
    if (camModeRef.current === m) {
      // Turn off
      stopCam();
      setCamMode('off');
      camModeRef.current = 'off';
      return;
    }
    // Stop any existing stream first
    stopCam();
    setCamError('');
    setCamMode(m);
    camModeRef.current = m;
    try {
      let stream: MediaStream;
      if (m === 'screen') {
        // getDisplayMedia MUST be called here, directly in the click handler chain
        stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      }
      streamRef.current = stream;
      // Attach to video element (always in DOM now)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }
      // Auto-off when user stops sharing
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCam();
        setCamMode('off');
        camModeRef.current = 'off';
      });
    } catch (err: any) {
      console.warn('[Camera]', err?.message);
      setCamError(err?.name === 'NotAllowedError' ? 'Permission denied — allow camera/screen in browser settings.' : (err?.message || 'Could not start.'));
      setCamMode('off');
      camModeRef.current = 'off';
    }
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = Math.min(video.videoWidth, 640);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  }

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) { stopCam(); setCamMode('off'); camModeRef.current = 'off'; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => { autoLangRef.current = autoLang; }, [autoLang]);

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

  /* ── Browser speech — auto-detect the language of this exact text ── */
  function speakBrowserFallback(text: string): Promise<void> {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const targetLang = detectSpokenLang(text).code === 'ur' ? 'ur-PK' : 'en-US';
      const targetBase = targetLang.split('-')[0]; // e.g. 'ur'
      const voices = window.speechSynthesis.getVoices();
      // Try exact lang match → base lang match → any voice
      const best =
        voices.find(v => v.lang === targetLang) ||
        voices.find(v => v.lang.startsWith(targetBase)) ||
        voices[0];
      if (best) utt.voice = best;
      utt.lang = targetLang;
      utt.rate = 1.0; utt.pitch = 1;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      // Voices may not be loaded yet — wait one tick
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          const v2 = window.speechSynthesis.getVoices();
          const b2 = v2.find(v => v.lang === targetLang) || v2.find(v => v.lang.startsWith(targetBase)) || v2[0];
          if (b2) utt.voice = b2;
          window.speechSynthesis.speak(utt);
        };
      } else {
        window.speechSynthesis.speak(utt);
      }
    });
  }

  /* ── Fetch one TTS chunk — with timeout so Urdu/Arabic text never hangs forever ── */
  async function fetchChunk(sentence: string, voice: string, signal: AbortSignal): Promise<ArrayBuffer | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8 s max
      // Combine caller's signal with timeout signal
      const combinedSignal = signal.aborted ? signal : controller.signal;
      signal.addEventListener('abort', () => controller.abort(), { once: true });

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: combinedSignal,
        body: JSON.stringify({ text: sentence, voice }),
      });
      clearTimeout(timeout);
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

    // Auto-detect the language of what the user just said — drives both the
    // AI's reply language instruction and the TTS voice/accent, no manual picker.
    const detected = detectSpokenLang(text.trim());
    const langLabel = detected.label;
    setAutoLang(detected.code); autoLangRef.current = detected.code;
    historyRef.current = [...historyRef.current, { role: 'user', content: text.trim() }];
    if (historyRef.current.length > 30) historyRef.current = historyRef.current.slice(-30);

    const sess = ++speakSessRef.current;
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
      // Detect the language/accent per-sentence so mixed-language replies still sound right
      const voice = detectSpokenLang(s).voice;
      ttsPending.push(fetchChunk(s.trim(), voice, ac.signal));
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
              while ((m = remainder.match(/^(.*?[.!?…۔؟।])\s*/s)) !== null) {
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

  /* ── MediaRecorder STT — fallback when Web Speech API is blocked ── */
  async function startMediaRecording() {
    syncPhase('listening');
    audioChunksRef.current = [];
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const recorder = new MediaRecorder(micStream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e: any) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        micStream.getTracks().forEach(t => t.stop());
        if (!inConvRef.current) return;
        syncPhase('thinking');
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        // Convert to base64 for server
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        try {
          const resp = await fetch('/api/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ audio: base64 }),
          });
          const data = await resp.json();
          const text = (data.text || '').trim();
          if (text) {
            setLiveText(text);
            collectedRef.current = text;
            sendToAI(text);
          } else {
            const isUrduNow = autoLangRef.current === 'ur';
            setAiReply(isUrduNow ? 'کچھ نہیں سنا۔ دوبارہ کوشش کریں۔' : 'Nothing heard. Tap mic and try again.');
            syncPhase('idle');
            inConvRef.current = false;
          }
        } catch {
          syncPhase('idle');
          inConvRef.current = false;
        }
        mediaRecorderRef.current = null;
      };
      recorder.start();
    } catch (err: any) {
      setAiReply('Microphone access denied. Please allow mic permissions and try again.');
      syncPhase('idle');
      inConvRef.current = false;
    }
  }

  /* ── Speech recognition ── */
  function startNewTurn() {
    if (!inConvRef.current) return;

    // If we already switched to media recorder STT, use it directly
    if (useMediaSTTRef.current) {
      startMediaRecording();
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // No Web Speech API at all — fall back to MediaRecorder + Whisper
      useMediaSTTRef.current = true;
      startMediaRecording();
      return;
    }

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
    // Let the browser auto-detect the spoken language (Gemini-style) instead of
    // forcing a fixed locale — most browsers default to the OS/browser language
    // and handle code-switching reasonably well without an explicit lang tag.
    rec.continuous     = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          collectedRef.current += t + ' ';
          interimRef.current = '';
        } else {
          interim += t;
          interimRef.current = interim;
        }
      }
      setLiveText(collectedRef.current + interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed') {
        syncPhase('idle'); inConvRef.current = false;
        setAiReply('Microphone access denied. Allow mic permissions and try again.');
        return;
      }
      if (e.error === 'service-not-allowed' || e.error === 'network') {
        // Web Speech API blocked (e.g. iframe sandbox) — switch permanently to MediaRecorder + Whisper
        console.warn('[STT] Switching to Whisper STT — Web Speech API unavailable:', e.error);
        useMediaSTTRef.current = true;
        if (recRef.current) { try { recRef.current.onend = null; recRef.current.abort(); } catch {} recRef.current = null; }
        if (inConvRef.current) startMediaRecording();
        return;
      }
      console.warn('[STT] error:', e.error);
    };

    rec.onend = () => {
      if (phaseRef.current !== 'listening' || !inConvRef.current) return;
      const text = (collectedRef.current + interimRef.current).trim();
      if (text) {
        sendToAI(text);
      } else {
        syncPhase('idle');
        inConvRef.current = false;
        setAiReply('');
      }
    };

    try { rec.start(); } catch (err) { console.error('[STT] start:', err); syncPhase('idle'); }
  }

  /* ── Mic button tap ── */
  function handleMicTap() {
    if (phase === 'thinking') return;
    if (phase === 'idle') {
      getAudioCtx().resume();
      inConvRef.current = true;
      startNewTurn();
    } else if (phase === 'listening') {
      // Stop MediaRecorder STT if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        return;
      }
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
    if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop(); } catch {} mediaRecorderRef.current = null; }
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

  const isUrdu = autoLang === 'ur';
  const isRecording = useMediaSTTRef.current && phase === 'listening';
  const statusLabel =
    isRecording        ? (isUrdu ? '● ریکارڈ ہو رہا ہے — روکنے کے لیے دبائیں' : '● Recording — tap mic to send') :
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
