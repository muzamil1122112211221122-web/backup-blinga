import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import ringLogoLight from "@assets/blinga_rings_light.png";
import ringLogoDark from "@assets/blinga_rings_dark.png";
import { useState, useEffect } from "react";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  lineOnly?: boolean;
  ringColor?: string;
  ringOpacity?: number;
  letterColor?: string;
  conversationId?: string;
  styleOverride?: string;
  scaleWhenCurrent?: string;
}

export function Logo({
  className,
  size = "md",
  scaleWhenCurrent,
}: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const px = { sm: 46, md: 58, lg: 70, xl: 108, "2xl": 162, "3xl": 190, "4xl": 260 }[size] || 58;
  
  const resolvedTheme = theme === "system" && typeof window !== "undefined"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : (theme || "light");
    
  const asset = ringLogoLight; // always use dark-theme logo in both themes

  const content = (
    <div
      className={cn("inline-flex flex-shrink-0 items-center justify-center relative hover:scale-[1.08] transition-transform duration-[2500ms] ease-out cursor-pointer", className)}
      style={{ width: px, height: px }}
      data-testid="logo-blinga"
    >
      <img
        src={asset}
        alt="Blinga"
        aria-hidden="true"
        className="absolute inset-0 object-contain"
        style={{ width: px, height: px }}
      />
    </div>
  );

  if (scaleWhenCurrent) {
    return <div style={{ transform: scaleWhenCurrent, transformOrigin: 'center' }}>{content}</div>;
  }
  return content;
}

export const BlingaLogo = Logo;

