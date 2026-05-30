import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/** Generates a smooth wavy circle path (quadratic bezier through alternating inner/outer points) */
function makeWavyPath(cx: number, cy: number, R: number, waves: number, amp: number): string {
  const numPts = waves * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < numPts; i++) {
    const angle = (2 * Math.PI * i / numPts) - Math.PI / 2;
    const r = R + (i % 2 === 0 ? amp : -amp);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  // Smooth closed path: each control point is the wave peak/trough,
  // curve passes through midpoints of adjacent pairs
  const mid = (i: number): [number, number] => [
    (pts[i][0] + pts[(i + 1) % numPts][0]) / 2,
    (pts[i][1] + pts[(i + 1) % numPts][1]) / 2,
  ];
  const start = mid(numPts - 1);
  let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} `;
  for (let i = 0; i < numPts; i++) {
    const m = mid(i);
    d += `Q ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)} `;
  }
  return d + 'Z';
}

export function Logo({ className, size = "md" }: LogoProps) {
  const px    = { sm: 32, md: 40, lg: 64, xl: 80 }[size];
  const font  = { sm: 14, md: 18, lg: 28, xl: 36 }[size];
  const sw    = { sm: 1.5, md: 2,  lg: 2.5, xl: 3 }[size];
  const waves = { sm: 10,  md: 11, lg: 14,  xl: 16 }[size];
  const amp   = { sm: 2,   md: 2.5,lg: 3.5, xl: 4.5 }[size];
  const cx = px / 2;
  const cy = px / 2;
  const R  = px / 2 - sw - 2;

  const wavyPath = useMemo(
    () => makeWavyPath(cx, cy, R, waves, amp),
    [cx, cy, R, waves, amp]
  );

  // Rotating by exactly one wave-interval (360 / numPts degrees) creates a
  // perfectly seamless loop — the waves appear to travel around continuously.
  const rotStep = (360 / (waves * 2)).toFixed(4);
  const dur = "1.0s"; // speed of wave travel

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer select-none",
        className
      )}
      style={{ width: px, height: px }}
      data-testid="logo-fius"
    >
      <svg
        width={px} height={px}
        viewBox={`0 0 ${px} ${px}`}
        style={{ position: "absolute", inset: 0 }}
        overflow="visible"
      >
        <path
          d={wavyPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
          strokeOpacity={0.55}
        >
          {/* Rotate by exactly one wave interval → seamless traveling-wave loop */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`${rotStep} ${cx} ${cy}`}
            dur={dur}
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>
      </svg>
      <span
        className="text-foreground leading-none relative z-10"
        style={{ fontSize: font, fontWeight: 400, fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        ℱ
      </span>
    </div>
  );
}
