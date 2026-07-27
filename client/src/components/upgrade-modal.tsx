import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUsage } from "@/hooks/use-usage";
import { useToast } from "@/hooks/use-toast";
import { UltimatePlanCard } from "@/components/ultimate-plan-card";

const FREE_FEATURES = [
  "Select AI models (Llama, Fius Lite)",
  "5 messages per 30 days",
  "1 image generation per 30 days",
  "Basic chat & document features",
];

const FREE_MISSING = ["All premium models", "Voice Mode", "Imagine Studio", "Side-by-side Compare"];

export function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { upgrade } = useUsage();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      await upgrade.mutateAsync();
      toast({ title: "Fius Ultimate activated!", description: "You now have 3M tokens, 250 images, and full model access." });
      onClose();
    } catch {
      toast({ title: "Couldn't activate plan", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-[calc(100%-1.5rem)] max-h-[92vh] overflow-y-auto p-0 overflow-x-hidden border-white/10 bg-black"
        style={{ borderRadius: 28 }}
      >
        <DialogTitle className="sr-only">Upgrade to Fius Ultimate</DialogTitle>

        <div className="px-6 sm:px-10 pt-10 pb-14">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">Free plan limit reached</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Upgrade to Fius Ultimate</h2>
            <p className="text-zinc-500 text-sm sm:text-base">30-day plans. Cancel anytime.</p>
          </div>

          {/* Plan cards — same layout as the landing page pricing section */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-2 max-w-4xl mx-auto relative">

            {/* Free card */}
            <div className="w-full lg:w-[38%] rounded-3xl border border-white/8 p-6 opacity-80 lg:scale-[0.94] origin-center"
              style={{ background: "rgba(255,255,255,0.015)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-zinc-600 text-sm mb-1.5">/30 days</span>
              </div>
              <p className="text-xs text-zinc-700 mb-6">Your current plan</p>
              <ul className="space-y-2.5 mb-6">
                {FREE_FEATURES.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="text-zinc-600 flex-shrink-0 mt-0.5 text-base font-light">⤳</span>
                    {item}
                  </li>
                ))}
                {FREE_MISSING.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-700">
                    <span className="text-zinc-800 flex-shrink-0 mt-0.5">–</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" disabled
                className="w-full border-white/10 text-zinc-600 rounded-full font-semibold cursor-default">
                Current Plan
              </Button>
            </div>

            {/* VS divider */}
            <div className="relative z-20 flex-shrink-0 lg:ml-[-2.5rem] lg:mr-[3rem]">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center border text-sm font-black tracking-wide"
                style={{
                  background: "linear-gradient(145deg, #1a1a1a 0%, #000 100%)",
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                }}
              >
                VS
              </div>
            </div>

            {/* Ultimate card — exact landing-page component */}
            <div className="w-full lg:w-[52%] lg:scale-[1.05] origin-center">
              <UltimatePlanCard onUpgrade={handleUpgrade} ctaBusy={upgrade.isPending} />
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-600 pt-10">No hidden fees · Cancel anytime · 30-day rolling plan</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
