import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppNotificationProps {
  image: string;
  title: string;
  description: string;
  dotColor?: string;
  onClose?: () => void;
}

function AppNotification({ image, title, description, dotColor = "bg-green-400", onClose }: AppNotificationProps) {
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
              src={image}
              alt={title}
              className="w-full h-full object-cover object-top select-none"
              loading="eager"
              decoding="sync"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <span>{title}</span>
              <div className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}></div>
            </h3>
            <p className="text-sm text-white/90">{description}</p>
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

const NOTIFICATION_VARIANTS = [
  {
    id: "nomad",
    image: "/nomad-avatar.png",
    title: "Meet Nomad",
    description: "Your new multi-AI companion is ready to help",
    dotColor: "bg-green-400",
  },
  {
    id: "philosopher",
    image: "/philosopher-avatar.png",
    title: "Meet Philosophers...",
    description: "Dive deep into ideas with AI-powered philosophy",
    dotColor: "bg-purple-400",
  },
  {
    id: "fius-games",
    image: "/fius-games-avatar.png",
    title: "Meet Game Zone",
    description: "Challenge yourself and play with AI companions",
    dotColor: "bg-blue-400",
  },
];

interface NomadNotificationProps {
  enabledVariants?: string[];
  onClose?: () => void;
}

export function NomadNotification({ enabledVariants, onClose }: NomadNotificationProps) {
  const available = enabledVariants && enabledVariants.length > 0
    ? NOTIFICATION_VARIANTS.filter(v => enabledVariants.includes(v.id))
    : NOTIFICATION_VARIANTS;

  const [variant] = useState(() => available[Math.floor(Math.random() * available.length)]);

  if (!variant) return null;

  return (
    <AppNotification
      image={variant.image}
      title={variant.title}
      description={variant.description}
      dotColor={variant.dotColor}
      onClose={onClose}
    />
  );
}
