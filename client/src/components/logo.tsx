import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl", 
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div 
      className={cn("logo-m", sizeClasses[size], className)}
      data-testid="logo-lineus"
    >
      M
    </div>
  );
}
