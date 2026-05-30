import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: string;
}

// Fix common speech-recognition mishearings of "Fius" ONLY when context
// suggests it's the app name — preserves real words like "forest" otherwise.
function fixTranscript(text: string): string {
  // Replace only when adjacent to AI/app context words
  return text
    .replace(/\b(forest|forums?|phoebus|foras)\s+(ai|app|assistant)\b/gi, 'Fius $2')
    .replace(/\b(hey|hi|hello|open|use|ask|tell|to|talk)\s+(forest|forums?|phoebus|foras)\b/gi, '$1 Fius')
    // Capitalise if already looks like a proper noun usage (all caps or at start of sentence)
    .replace(/\bFORAS\b/g, 'Fius')
    .replace(/\bPhoebus\b/g, 'Fius');
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false); // mirror of isListening for use inside event handlers

  // Keep callbacks in refs so they never cause the setup effect to re-run
  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);
  const onStartRef = useRef(options.onStart);
  const onEndRef = useRef(options.onEnd);

  useEffect(() => { onResultRef.current = options.onResult; }, [options.onResult]);
  useEffect(() => { onErrorRef.current = options.onError; }, [options.onError]);
  useEffect(() => { onStartRef.current = options.onStart; }, [options.onStart]);
  useEffect(() => { onEndRef.current = options.onEnd; }, [options.onEnd]);

  // Create recognition instance exactly once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Never continuous — stops naturally after the user finishes speaking
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = options.language ?? 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      onStartRef.current?.();
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const fixed = fixTranscript(finalTranscript.trim());
        onResultRef.current?.(fixed);
        // Explicitly stop as soon as we have a final result
        try { recognition.stop(); } catch {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
      isListeningRef.current = false;
      setIsListening(false);
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      onEndRef.current?.();
    };

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListeningRef.current) return;
    try { recognition.start(); } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.stop(); } catch {}
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

interface UseSpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
    if ('speechSynthesis' in window) {
      const updateVoices = () => setVoices(speechSynthesis.getVoices());
      updateVoices();
      speechSynthesis.onvoiceschanged = updateVoices;
      return () => { speechSynthesis.onvoiceschanged = null; };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    if (options.voice) utterance.voice = options.voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  }, [options.rate, options.pitch, options.volume, options.voice]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking, isSupported, voices };
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
