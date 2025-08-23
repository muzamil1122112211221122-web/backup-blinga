import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, VolumeX, X } from "lucide-react";

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening?: boolean;
  onToggleListening?: () => void;
  isPlaying?: boolean;
  onTogglePlaying?: () => void;
}

export function VoiceModeModal({
  isOpen,
  onClose,
  isListening = false,
  onToggleListening,
  isPlaying = false,
  onTogglePlaying
}: VoiceModeModalProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const animationRef = useRef<number>();

  // Simulate audio levels for visual feedback
  useEffect(() => {
    if (isListening && isOpen) {
      const animate = () => {
        setCurrentLevel(prev => {
          const next = prev + (Math.random() - 0.5) * 0.3;
          return Math.max(0, Math.min(1, next));
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setCurrentLevel(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-auto bg-gray-900 border-gray-700 text-white [&>button]:hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center justify-center py-8">
          {/* Large circular audio visualizer */}
          <div className="relative w-48 h-48 mb-8">
            {/* Outer pulsing ring */}
            <div 
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                isListening 
                  ? 'border-green-400 animate-pulse' 
                  : isPlaying 
                  ? 'border-blue-400 animate-pulse'
                  : 'border-gray-600'
              }`}
              style={{
                transform: isListening ? `scale(${1 + currentLevel * 0.1})` : 'scale(1)'
              }}
            />
            
            {/* Inner circle with gradient */}
            <div 
              className={`absolute inset-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening 
                  ? 'bg-gradient-to-br from-green-500/30 to-green-600/30' 
                  : isPlaying
                  ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30'
                  : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50'
              }`}
              style={{
                transform: isListening ? `scale(${1 + currentLevel * 0.05})` : 'scale(1)'
              }}
            >
              {/* Microphone icon */}
              {isListening ? (
                <Mic className="h-12 w-12 text-green-400" />
              ) : isPlaying ? (
                <Volume2 className="h-12 w-12 text-blue-400" />
              ) : (
                <Mic className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            {/* Audio level bars around the circle */}
            {isListening && (
              <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 bg-green-400 rounded-full origin-bottom transition-all duration-150"
                    style={{
                      height: `${8 + Math.random() * currentLevel * 24}px`,
                      left: '50%',
                      bottom: '50%',
                      transform: `rotate(${i * 45}deg) translateX(-50%) translateY(100px)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status text */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {isListening ? 'Listening...' : isPlaying ? 'Speaking...' : 'Voice Mode'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isListening 
                ? 'Speak now, I\'m listening' 
                : isPlaying 
                ? 'Playing response'
                : 'Press the microphone to start'
              }
            </p>
          </div>

          {/* Control buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={onToggleListening}
              className={`h-14 w-14 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={onTogglePlaying}
              className={`h-14 w-14 rounded-full transition-all ${
                isPlaying
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isPlaying ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-4 text-center max-w-xs">
            Enable microphone access in Settings to use voice mode
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}