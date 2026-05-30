import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const px = { sm: 32, md: 40, lg: 64, xl: 80 }[size];
  const fontSize = { sm: 14, md: 18, lg: 28, xl: 36 }[size];
  const stroke = { sm: 2, md: 2.5, lg: 3, xl: 3.5 }[size];
  const r = px / 2 - stroke - 1;
  const circ = 2 * Math.PI * r;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer", className)}
      style={{ width: px, height: px }}
      data-testid="logo-fius"
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{ position: "absolute", inset: 0 }}
        className="logo-ring-svg"
      >
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="logo-ring-track"
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="logo-ring-arc"
        />
      </svg>
      <span
        className="text-foreground select-none leading-none relative z-10"
        style={{ fontSize, fontWeight: 400, fontFamily: "Georgia, serif" }}
      >
        ℱ
      </span>
    </div>
  );
}
