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
  const circ = parseFloat((2 * Math.PI * r).toFixed(2));
  const cx = px / 2;
  const cy = px / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer select-none", className)}
      style={{ width: px, height: px }}
      data-testid="logo-fius"
    >
      {/* Curling circle — drawn by animating stroke-dashoffset so the arc
          sweeps around like a pen tracing a circle, while the container
          slowly rotates to keep it feeling alive */}
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{ position: "absolute", inset: 0 }}
        className="logo-curl-svg"
      >
        {/* Faint full track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeOpacity={0.08}
        />
        {/* The arc that curls — animates dashoffset so it draws itself */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          stroke="currentColor"
          strokeOpacity={0.7}
        >
          {/* Curl: offset goes from full-circle (invisible) → 0 (full visible) → full-circle */}
          <animate
            attributeName="stroke-dashoffset"
            values={`${circ};0;${-circ}`}
            dur="3.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.55;1"
            keySplines="0.4,0,0.2,1;0.4,0,0.2,1"
          />
          {/* Slow rotation gives the "curling around" feel */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`-90 ${cx} ${cy}`}
            to={`270 ${cx} ${cy}`}
            dur="3.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.4,0,0.2,1"
          />
        </circle>
      </svg>
      <span
        className="text-foreground leading-none relative z-10"
        style={{ fontSize, fontWeight: 400, fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        ℱ
      </span>
    </div>
  );
}
