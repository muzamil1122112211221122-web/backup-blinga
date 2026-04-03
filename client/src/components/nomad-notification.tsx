import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NomadNotificationProps {
  onClose?: () => void;
}

export function NomadNotification({ onClose }: NomadNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 280);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 ${
        isClosing ? "nomad-pop-slide-out" : "nomad-pop-slide-in"
      }`}
    >
      <div className="bg-black text-white px-6 py-4 rounded-xl shadow-xl border border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-400 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <img
              src="/nomad-avatar.png"
              alt="Nomad Avatar"
              className="w-full h-full object-cover select-none"
              style={{
                imageRendering: "crisp-edges",
                filter: "contrast(1.2) saturate(1.2) brightness(1.1)",
                minWidth: "64px",
                minHeight: "64px",
                maxWidth: "64px",
                maxHeight: "64px",
                objectFit: "cover",
                objectPosition: "center",
              }}
              loading="eager"
              decoding="sync"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget
                  .nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div
              className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner"
              style={{ display: "none" }}
            >
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
