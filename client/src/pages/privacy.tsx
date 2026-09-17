import { useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
            <span className="text-sm font-bold text-zinc-900">Blinga</span>
          </div>
          <span className="text-zinc-400 text-sm">/ Privacy Policy</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="max-w-3xl mx-auto">

          {/* heading */}
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-3">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm">Last updated: July 2026</p>
          </div>

          {/* sections */}
          <div className="space-y-6">
            {[
              {
                title: "Information We Collect",
                body: "When you use Blinga, we may collect:",
                list: [
                  "Email address and profile information from Google OAuth",
                  "Chat conversations and messages",
                  "Usage analytics and performance data",
                ],
              },
              {
                title: "How We Use Your Information",
                body: "We use your information to:",
                list: [
                  "Provide and improve our AI chat services",
                  "Authenticate your account and maintain sessions",
                  "Analyze usage patterns to enhance user experience",
                ],
              },
              {
                title: "Data Security",
                body: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
                list: [],
              },
              {
                title: "Contact Us",
                body: "If you have questions about this Privacy Policy, please contact us through our application.",
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
          <p className="mt-12 text-center text-xs text-zinc-400">© 2026 Blinga. All rights reserved. · Fly With Us!</p>
        </div>
      </div>
    </div>
  );
}
