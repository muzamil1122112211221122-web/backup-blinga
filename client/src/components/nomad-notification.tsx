import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NomadNotificationProps {
  onClose?: () => void;
}

export function NomadNotification({ onClose }: NomadNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const delay = Math.random() * 1000 + 3000; // 3–4 seconds
    const timer = setTimeout(() => handleClose(), delay);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 550);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 ${
        isClosing ? "nomad-pop-slide-out" : "nomad-pop-slide-in"
      }`}
    >
      <div className="bg-black text-white px-6 py-4 rounded-xl shadow-xl border border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-400 shadow-lg flex-shrink-0">
            <img
              src="/nomad-avatar.png"
              alt="Nomad Avatar"
              className="w-full h-full object-cover object-top select-none"
              loading="eager"
              decoding="sync"
            />
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
