import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AppNotificationProps {
  image: string;
  title: string;
  description: string;
  dotColor?: string;
  onClose?: () => void;
}

function AppNotification({ image, title, description, dotColor = "bg-green-400", onClose }: AppNotificationProps) {
  const [phase, setPhase] = useState<"entering" | "visible" | "out">("entering");
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Double rAF ensures the "entering" state is painted before transitioning to "visible"
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setPhase("visible");
      });
      return () => cancelAnimationFrame(raf2);
    });

    // auto-dismiss after 4.2s
    const t = setTimeout(() => dismiss(), 4200);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setPhase("out");
    setTimeout(() => onClose?.(), 420);
  };

  // swipe-up to dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = 0;
    if (pillRef.current) pillRef.current.style.transition = "none";
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startYRef.current;
    currentYRef.current = delta;
    if (pillRef.current) pillRef.current.style.transform = `translateX(-50%) translateY(${Math.min(delta, 8)}px)`;
  };
  const onTouchEnd = () => {
    if (currentYRef.current < -30) { dismiss(); return; }
    if (pillRef.current) {
      pillRef.current.style.transition = "transform 0.3s cubic-bezier(0.23,1,0.32,1)";
      pillRef.current.style.transform = "translateX(-50%) translateY(0)";
    }
  };

  const isHidden = phase === "entering" || phase === "out";

  const transform = isHidden
    ? "translateX(-50%) translateY(-80px) scale(0.88)"
    : "translateX(-50%) translateY(0px) scale(1)";

  return (
    <div
      ref={pillRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        zIndex: 9999,
        transform,
        opacity: isHidden ? 0 : 1,
        transition: "transform 0.52s cubic-bezier(0.23,1,0.32,1), opacity 0.38s cubic-bezier(0.23,1,0.32,1)",
        willChange: "transform, opacity",
        maxWidth: "calc(100vw - 32px)",
        width: 340,
        touchAction: "none",
        pointerEvents: isHidden ? "none" : "auto",
      }}
    >
      <div
        style={{
          background: "rgba(28,28,30,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          padding: "10px 12px 10px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}>
          <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse flex-shrink-0`} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{description}</p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
        >
          <X style={{ width: 11, height: 11, color: "rgba(255,255,255,0.8)", strokeWidth: 2.5 }} />
        </button>
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
