import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LuminNotificationProps {
  onClose?: () => void;
}

export function LuminNotification({ onClose }: LuminNotificationProps) {
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl shadow-xl border border-purple-400/30 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          {/* Face Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-300/90 to-orange-400/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-lg relative overflow-hidden">
            {/* Face background */}
            <div className="w-10 h-10 bg-gradient-to-b from-yellow-200/80 to-yellow-300/80 rounded-full relative">
              {/* Eyes */}
              <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
              <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
              {/* Eye sparkles */}
              <div className="absolute top-3.5 left-2.5 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute top-3.5 right-2.5 w-0.5 h-0.5 bg-white rounded-full"></div>
              {/* Nose */}
              <div className="absolute top-4.5 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-orange-400/60 rounded-full"></div>
              {/* Smile */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-gray-800 rounded-full border-t-0 border-l-0 border-r-0"></div>
              {/* Cheeks */}
              <div className="absolute top-4.5 left-1 w-1 h-1 bg-pink-300/60 rounded-full blur-sm"></div>
              <div className="absolute top-4.5 right-1 w-1 h-1 bg-pink-300/60 rounded-full blur-sm"></div>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <span>Meet Lumin</span>
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