import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg w-8 h-8",
    md: "text-2xl w-10 h-10", 
    lg: "text-4xl w-16 h-16",
    xl: "text-5xl w-20 h-20",
  };

  return (
    <div 
      className={cn("logo-container relative inline-flex items-center justify-center bg-transparent border-2 border-muted-foreground/30 rounded-full cursor-pointer hover:border-muted-foreground/50 transition-colors duration-200", sizeClasses[size], className)}
      data-testid="logo-forus"
    >
      <span className="text-foreground font-normal select-none">ƒ</span>
    </div>
  );
}
