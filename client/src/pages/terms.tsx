import { useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen text-zinc-900" style={{ background: "#ffffff" }}>
      {/* subtle top gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,0,0,0.03) 0%, transparent 70%)"
      }} />

      {/* top nav bar */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.90)" }}>
        <div className="container mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <Logo size="sm" className="text-zinc-900" />
            <span className="text-sm font-bold text-zinc-900">Fius</span>
          </div>
          <span className="text-zinc-400 text-sm">/ Terms of Service</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="max-w-3xl mx-auto">

          {/* heading */}
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-3">Terms of Service</h1>
            <p className="text-zinc-500 text-sm">Last updated: July 2026</p>
          </div>

          {/* sections */}
          <div className="space-y-6">
            {[
              {
                title: "Acceptance of Terms",
                body: "By accessing and using Fius, you accept and agree to be bound by the terms and provision of this agreement.",
                list: [],
              },
              {
                title: "Use License",
                body: "Permission is granted to temporarily use Fius for personal, non-commercial purposes only.",
                list: [
                  "This is the grant of a license, not a transfer of title",
                  "This license shall automatically terminate if you violate any of these restrictions",
                  "Upon terminating your use of these materials or upon the termination of this license, you must destroy any downloaded materials",
                ],
              },
              {
                title: "Disclaimer",
                body: "The materials on Fius are provided on an 'as is' basis. Fius makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
                list: [],
              },
              {
                title: "Limitations",
                body: "In no event shall Fius or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Fius, even if Fius or an authorized representative has been notified of the possibility of such damage.",
                list: [],
              },
              {
                title: "Contact Information",
                body: "If you have any questions about these Terms of Service, please contact us through our application.",
                list: [],
              },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 mb-3">{s.title}</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.body}</p>
                {s.list.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {s.list.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-zinc-500">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* footer note */}
          <p className="mt-12 text-center text-xs text-zinc-400">© 2026 Fius. All rights reserved. · Fly With Us!</p>
        </div>
      </div>
    </div>
  );
}
