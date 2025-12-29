import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    if ((isListening || isPlaying) && isOpen) {
      const animate = () => {
        setCurrentLevel(prev => {
          const next = prev + (Math.random() - 0.5) * 0.4;
          return Math.max(0.1, Math.min(1, next));
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
  }, [isListening, isPlaying, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-black border-none text-white overflow-hidden flex flex-col items-center justify-center opacity-100 ring-0 focus:ring-0">
        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 flex items-center space-x-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Central Circular AI Core */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Outer Glow Layer 1 */}
            <motion.div
              animate={{
                scale: [1, 1.1 + currentLevel * 0.2, 1],
                opacity: [0.3, 0.5 + currentLevel * 0.3, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl"
            />
            
            {/* Outer Glow Layer 2 */}
            <motion.div
              animate={{
                scale: [1.1, 1.3 + currentLevel * 0.3, 1.1],
                opacity: [0.1, 0.2 + currentLevel * 0.2, 0.1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl"
            />

            {/* The Main Circular Visualizer (Matching the image) */}
            <motion.div 
              className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)]"
              animate={{
                scale: isListening || isPlaying ? 1.05 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Complex Gradient/Cloudy Background mimicking the image */}
              <div className="absolute inset-0 bg-[#000000]">
                {/* Bottom Deep Blue */}
                <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-[#0066FF] to-transparent opacity-90" />
                
                {/* Center Cyan Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#40E0D0]/40 to-transparent" />
                
                {/* Top White/Cloudy Mist */}
                <motion.div 
                  animate={{
                    y: [-5, 5, -5],
                    x: [-3, 3, -3],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1/4 left-0 right-0 h-3/4 bg-white/40 blur-3xl rounded-full"
                />

                {/* Animated Inner Particles for "Life" */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-white rounded-full opacity-30"
                    style={{
                      width: Math.random() * 4 + 2,
                      height: Math.random() * 4 + 2,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, (Math.random() - 0.5) * 40],
                      x: [0, (Math.random() - 0.5) * 40],
                      opacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                ))}
              </div>

              {/* Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{
                    opacity: isListening || isPlaying ? 0.3 : 0.6,
                    scale: isListening || isPlaying ? 0.9 : 1
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 opacity-60 mix-blend-overlay"
                >
                   {/* Using a simplified version of the logo for better visibility on the background */}
                   <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                      <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 70c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30z" />
                      <circle cx="50" cy="50" r="15" />
                   </svg>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* AI Name & Status */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-light tracking-widest text-white/90 mb-2 uppercase">FORUS AI</h2>
            <p className="text-white/50 text-sm font-medium h-6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isListening ? 'listening' : isPlaying ? 'speaking' : 'idle'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isListening ? "Listening..." : isPlaying ? "Speaking..." : "Tap to start"}
                </motion.span>
              </AnimatePresence>
            </p>
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="absolute bottom-10 left-0 right-0 px-10 flex items-center justify-between z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleListening}
            className={`h-14 w-14 rounded-full transition-all border border-white/10 ${
              isListening ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Mic className={`h-6 w-6 ${isListening ? 'animate-pulse' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-14 w-14 rounded-full bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Dynamic Background Mesh */}
        <div className="fixed inset-0 pointer-events-none z-[-1]">
          <div className="absolute inset-0 bg-black" />
          <motion.div 
            animate={{
              opacity: isListening || isPlaying ? 0.4 : 0.2,
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
