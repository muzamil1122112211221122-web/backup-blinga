import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

// Shared feature list — used by the landing page pricing section AND the
// in-app Settings upgrade card, so both always show the exact same plan.
export const PLAN_FEATURES = [
  "10+ Frontier AI Models — GPT-5, Claude 4, Gemini 3, Grok 4 & More",
  "Blinga Pro & Lite Proprietary Models",
  "Nomad Mode — Real-Time Multi-AI Side-by-Side Comparisons",
  "3,000,000 Tokens per 30 Days (Premium Models Included)",
  "Imagine Studio — 250 AI Images per Period",
  "Smart Prompt Optimizer & Persistent Conversation Memory",
  "Full Voice-to-Voice Interaction Mode",
  "Professional AI Image Creation & Editing Suite",
  "Priority Response Speeds Across All Models",
  "Exclusive Extras — Blinga Minds, Games & Hidden Modes",
  "Blinga Ultimatum — Automatically Picks the Best AI for Every Request",
  "Multiple Projects with Custom Instructions & Timelines",
  "Broader File Support — PDF, DOC, PPTX, CSV, TXT, MD & Images",
  "Personal AI Role Per Chat — Set a Custom Assistant Persona for Every Conversation",
  "Access $220+ Worth of AI Models — Yours for Just $11",
];

export interface UltimateUsageStats {
  tokensRemaining: number;
  tokensLimit: number;
  imagesRemaining: number;
  imagesLimit: number;
}

function UsageBar({ used, limit, dark }: { used: number; limit: number; dark: boolean }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }}>
      <div className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: dark ? "linear-gradient(110deg, #ffffff 0%, #aaaaaa 100%)" : "linear-gradient(110deg, #18181b 0%, #71717a 100%)" }} />
    </div>
  );
}

/**
 * The exact Blinga Ultimate plan card design used on the landing page pricing
 * section. Reused as-is (same copy, same visuals) anywhere else in the app
 * that offers the upgrade — e.g. the Settings "Upgrade" flow — so users see
 * one consistent plan card everywhere.
 *
 * Pass `activated` + `usage` once the user already has Ultimate: the card
 * keeps the exact same perks list, but swaps the price/CTA for an
 * "activated" state showing remaining tokens & images instead.
 *
 * Pass `forceDark` or `forceLight` to pin the card to a specific appearance
 * when it is used outside the theme-aware app shell.
 */
export function UltimatePlanCard({
  onUpgrade,
  buttonLabel = "Upgrade to Blinga Ultimate",
  ctaBusy = false,
  activated = false,
  usage,
  forceDark,
  forceLight,
}: {
  onUpgrade?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buttonLabel?: string;
  ctaBusy?: boolean;
  activated?: boolean;
  usage?: UltimateUsageStats;
  forceDark?: boolean;
  forceLight?: boolean;
}) {
  const { theme } = useTheme();
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [theme]);

  const dark = forceDark || (!forceLight && (theme === "dark" || (theme === "system" && systemDark)));

  if (dark) {
    // ── Dark version (original design) ─────────────────────────────────────
    return (
      <div className="w-full rounded-3xl relative overflow-hidden p-[1px]"
        style={{ background: "linear-gradient(145deg, #333333 0%, #888888 50%, #ffffff 100%)" }}>
        <div className="rounded-[23px] relative overflow-hidden p-8 h-full"
          style={{ background: "linear-gradient(145deg, #111111 0%, #161616 50%, #1e1e1e 100%)" }}>
          <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, rgba(255,255,255,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: "radial-gradient(circle at bottom right, rgba(255,255,255,0.05) 0%, transparent 60%)" }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-6 mb-5">
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ background: "linear-gradient(90deg, #888 0%, #fff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Blinga Ultimate
              </p>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 text-white/70"
                style={{ background: "rgba(255,255,255,0.06)" }}>{activated ? "ACTIVATED" : "BEST VALUE"}</span>
            </div>

            {activated ? (
              <p className="text-lg font-bold text-white mb-7 leading-snug">Your Ultimate plan is activated — you have the following perks:</p>
            ) : (
              <>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black"
                    style={{ background: "linear-gradient(110deg, #ffffff 0%, #aaaaaa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    $11
                  </span>
                  <span className="text-zinc-500 text-sm mb-2">/30 days</span>
                </div>
                <p className="text-xs text-zinc-600 mb-7">Models worth more than $220 — for $11</p>
              </>
            )}

            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="flex-shrink-0 mt-0.5 text-lg leading-none font-light"
                    style={{ background: "linear-gradient(180deg, #fff 0%, #555 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    ⤳
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {activated ? (
              <div className="relative z-10 space-y-3 pt-1 border-t border-white/10">
                <div className="space-y-1 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Tokens remaining</span>
                    <span className="font-medium text-white">
                      {(usage?.tokensRemaining ?? 0).toLocaleString()} / {(usage?.tokensLimit ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <UsageBar dark used={(usage?.tokensLimit ?? 0) - (usage?.tokensRemaining ?? 0)} limit={usage?.tokensLimit ?? 1} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Images remaining</span>
                    <span className="font-medium text-white">
                      {usage?.imagesRemaining ?? 0} / {usage?.imagesLimit ?? 0}
                    </span>
                  </div>
                  <UsageBar dark used={(usage?.imagesLimit ?? 0) - (usage?.imagesRemaining ?? 0)} limit={usage?.imagesLimit ?? 1} />
                </div>
                <p className="text-[10px] text-zinc-500 pt-1">Resets every 30 days. Full access to all Nomad models.</p>
              </div>
            ) : (
              <Button onClick={onUpgrade} disabled={ctaBusy}
                className="relative z-10 w-full font-bold rounded-full py-3 transition-all hover:scale-[1.02] shadow-xl border-0"
                style={{ background: "linear-gradient(110deg, #000000 0%, #ffffff 100%)" }}>
                <span style={{ background: "linear-gradient(110deg, #ffffff 0%, #000000 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {ctaBusy ? "Activating…" : buttonLabel}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Light version ─────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-3xl relative overflow-hidden p-[1px]"
      style={{ background: "linear-gradient(145deg, #d4d4d4 0%, #a3a3a3 50%, #71717a 100%)" }}>
      <div className="rounded-[23px] relative overflow-hidden p-8 h-full bg-white">
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(0,0,0,0.03) 0%, transparent 65%)" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-6 mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Blinga Ultimate</p>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-500 bg-zinc-50">
              {activated ? "ACTIVATED" : "BEST VALUE"}
            </span>
          </div>

          {activated ? (
            <p className="text-lg font-bold text-zinc-900 mb-7 leading-snug">Your Ultimate plan is activated — you have the following perks:</p>
          ) : (
            <>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-zinc-900">$11</span>
                <span className="text-zinc-400 text-sm mb-2">/30 days</span>
              </div>
              <p className="text-xs text-zinc-400 mb-7">Models worth more than $220 — for $11</p>
            </>
          )}

          <ul className="space-y-3 mb-8">
            {PLAN_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-zinc-600">
                <span className="flex-shrink-0 mt-0.5 text-lg leading-none font-light text-zinc-400">⤳</span>
                {f}
              </li>
            ))}
          </ul>

          {activated ? (
            <div className="relative z-10 space-y-3 pt-1 border-t border-zinc-100">
              <div className="space-y-1 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Tokens remaining</span>
                  <span className="font-medium text-zinc-900">
                    {(usage?.tokensRemaining ?? 0).toLocaleString()} / {(usage?.tokensLimit ?? 0).toLocaleString()}
                  </span>
                </div>
                <UsageBar dark={false} used={(usage?.tokensLimit ?? 0) - (usage?.tokensRemaining ?? 0)} limit={usage?.tokensLimit ?? 1} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Images remaining</span>
                  <span className="font-medium text-zinc-900">
                    {usage?.imagesRemaining ?? 0} / {usage?.imagesLimit ?? 0}
                  </span>
                </div>
                <UsageBar dark={false} used={(usage?.imagesLimit ?? 0) - (usage?.imagesRemaining ?? 0)} limit={usage?.imagesLimit ?? 1} />
              </div>
              <p className="text-[10px] text-zinc-400 pt-1">Resets every 30 days. Full access to all Nomad models.</p>
            </div>
          ) : (
            <Button onClick={onUpgrade} disabled={ctaBusy}
              className="relative z-10 w-full font-bold rounded-full py-3 transition-all hover:scale-[1.02] shadow-sm border-0 bg-zinc-900 text-white hover:bg-zinc-800">
              {ctaBusy ? "Activating…" : buttonLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
