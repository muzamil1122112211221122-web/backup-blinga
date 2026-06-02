import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Monitor, Mic, MicOff, CameraOff, Send, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'camera' | 'screen';
type AIState = 'idle' | 'thinking' | 'done';

export function VideoCallModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('camera');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [question, setQuestion] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiState, setAiState] = useState<AIState>('idle');
  const [streamError, setStreamError] = useState('');
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startStream = useCallback(async (m: Mode) => {
    stopStream();
    setStreamError('');
    setCapturedFrame(null);
    try {
      let stream: MediaStream;
      if (m === 'screen') {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: micOn });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      stream.getVideoTracks()[0].onended = () => stopStream();
    } catch (err: any) {
      setStreamError(err?.message || 'Could not start stream. Check permissions.');
    }
  }, [micOn, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startStream(mode);
    } else {
      stopStream();
      setAiReply('');
      setCapturedFrame(null);
      setQuestion('');
      setAiState('idle');
      setStreamError('');
    }
    return () => { if (!isOpen) stopStream(); };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = async (m: Mode) => {
    setMode(m);
    setCapturedFrame(null);
    await startStream(m);
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]; // base64 only
  };

  const handleAsk = async () => {
    const q = question.trim() || 'What do you see in this image?';
    const frame = captureFrame();
    if (!frame) {
      setAiReply('No video feed to capture. Make sure camera or screen share is active.');
      setAiState('done');
      return;
    }
    setCapturedFrame(`data:image/jpeg;base64,${frame}`);
    setAiState('thinking');
    setAiReply('');
    try {
      const res = await fetch('/api/vision-chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frame, mimeType: 'image/jpeg', message: q }),
      });
      const data = await res.json();
      setAiReply(data.response || data.error || 'No response.');
      setAiState('done');
    } catch {
      setAiReply('Could not reach AI. Please try again.');
      setAiState('done');
    }
  };

  const toggleMic = () => {
    const audio = streamRef.current?.getAudioTracks()[0];
    if (audio) audio.enabled = !audio.enabled;
    setMicOn(p => !p);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] bg-black flex flex-col select-none overflow-hidden">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white/70 text-sm font-medium">
            {mode === 'camera' ? 'Camera' : 'Screen Share'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchMode('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${mode === 'camera' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'}`}
          >
            <Camera className="w-3.5 h-3.5" /> Camera
          </button>
          <button
            onClick={() => switchMode('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${mode === 'screen' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'}`}
          >
            <Monitor className="w-3.5 h-3.5" /> Screen
          </button>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Video feed */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        {streamError ? (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <CameraOff className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/50 text-sm max-w-xs">{streamError}</p>
            <button onClick={() => startStream(mode)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ transform: mode === 'camera' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {/* Captured frame overlay */}
        <AnimatePresence>
          {capturedFrame && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 right-4 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl"
              style={{ width: 120, height: 80 }}
            >
              <img src={capturedFrame} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium bg-black/50 px-1.5 py-0.5 rounded-full">Sent to AI</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI reply */}
      <AnimatePresence>
        {(aiReply || aiState === 'thinking') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mx-4 mb-3 p-4 bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-sm"
          >
            {aiState === 'thinking' ? (
              <div className="flex items-center gap-2 text-white/50">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analysing...</span>
              </div>
            ) : (
              <p className="text-white/85 text-sm leading-relaxed">{aiReply}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 pb-6 flex items-center gap-2">
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${micOn ? 'bg-white/10 border-white/10 text-white/60' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Question input */}
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
          placeholder="Ask AI about what it sees..."
          className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />

        {/* Ask AI button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAsk}
          disabled={aiState === 'thinking'}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-black flex-shrink-0 disabled:opacity-50 hover:bg-white/90 transition-colors"
        >
          {aiState === 'thinking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body
  );
}
