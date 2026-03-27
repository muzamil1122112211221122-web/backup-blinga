import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NomadNotificationProps {
  onClose?: () => void;
}

export function NomadNotification({ onClose }: NomadNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-hide after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
      isAnimated ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="bg-black text-white px-6 py-4 rounded-xl shadow-xl border border-gray-600">
        <div className="flex items-center space-x-4">
          {/* Anime Boy Avatar - High Quality */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-400 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <img 
              src="/nomad-avatar.png" 
              alt="Nomad Avatar" 
              className="w-full h-full object-cover select-none"
              style={{
                imageRendering: 'crisp-edges',
                imageResolution: 'from-image',
                filter: 'contrast(1.2) saturate(1.2) brightness(1.1) sharpen(1px)',
                minWidth: '64px',
                minHeight: '64px',
                maxWidth: '64px',
                maxHeight: '64px',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              loading="eager"
              decoding="sync"
              onError={(e) => {
                // Enhanced fallback with better styling
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner" style={{display: 'none'}}>
              L
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <span>Meet Nomad</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </h3>
            <p className="text-sm text-white/90">
              Your new multi-AI companion is ready to help
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/10 h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}