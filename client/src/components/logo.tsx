import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/** Smooth wavy (scalloped) circle path via quadratic bezier through alternating inner/outer points */
function makeWavyPath(cx: number, cy: number, R: number, waves: number, amp: number): string {
  const numPts = waves * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < numPts; i++) {
    const angle = (2 * Math.PI * i / numPts) - Math.PI / 2;
    const r = R + (i % 2 === 0 ? amp : -amp);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
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
  return d + "Z";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const px    = { sm: 34, md: 44, lg: 68, xl: 84 }[size];
  // ℱ font size — bigger so it fills the ring comfortably
  const font  = { sm: 18, md: 23, lg: 34, xl: 42 }[size];
  const sw    = { sm: 1.6, md: 2,  lg: 2.6, xl: 3.2 }[size];
  const waves = { sm: 10,  md: 11, lg: 14,  xl: 16  }[size];
  const amp   = { sm: 2.2, md: 2.6,lg: 3.6, xl: 4.6 }[size];
  const cx = px / 2;
  const cy = px / 2;
  const R  = px / 2 - sw - 2;

  const wavyPath = useMemo(
    () => makeWavyPath(cx, cy, R, waves, amp),
    [cx, cy, R, waves, amp]
  );

  // Rotating 360° is perfectly seamless — the wavy pattern returns to its
  // exact starting appearance, so there's never a visible reset/jump.
  // Duration controls speed: 10s = one gentle full wave-cycle.
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
          {/* 360° full rotation = seamless infinite loop, no visible jump */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="10s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>
      </svg>
      <span
        className="text-foreground leading-none relative z-10"
        style={{
          fontSize: font,
          fontWeight: 400,
          fontFamily: "Georgia, 'Times New Roman', serif",
          marginTop: 1,
        }}
      >
        ℱ
      </span>
    </div>
  );
}
