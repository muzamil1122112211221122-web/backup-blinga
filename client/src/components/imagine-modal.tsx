import { useState, useRef } from "react";
import { X, ArrowUp, Sparkles, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "./logo";

interface ImagineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_TAGS = ["Photorealistic", "Anime", "Oil Painting", "3D Render", "Watercolor", "Pixel Art", "Sketch", "Cinematic"];

const REFERENCE_PROMPTS = [
  { emoji: "🌅", label: "Sunset over mountains", prompt: "a breathtaking sunset over snow-capped mountains with golden light" },
  { emoji: "🌆", label: "Cyberpunk city", prompt: "a neon-lit cyberpunk city at night with flying cars and rain" },
  { emoji: "🦁", label: "Majestic lion", prompt: "a majestic lion portrait with a dramatic mane in golden light" },
  { emoji: "🌸", label: "Cherry blossoms", prompt: "a serene Japanese garden with cherry blossom petals falling" },
  { emoji: "🚀", label: "Space exploration", prompt: "an astronaut floating in space with Earth and stars behind them" },
  { emoji: "🏰", label: "Fantasy castle", prompt: "an epic fantasy castle on a clifftop surrounded by clouds" },
  { emoji: "🐉", label: "Dragon", prompt: "a majestic dragon soaring through storm clouds, scales glistening" },
  { emoji: "🌊", label: "Ocean waves", prompt: "massive ocean waves crashing with foam and turquoise water" },
];

export function ImagineModal({ isOpen, onClose }: ImagineModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    const fullPrompt = `${prompt.trim()}, ${selectedStyle.toLowerCase()} style`;
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `generate image of ${fullPrompt}`, conversationId: "imagine" }),
      });
      if (res.ok) {
        const data = await res.json();
        const match = data.response?.match(/!\[.*?\]\((.*?)\)/);
        if (match?.[1]) {
          setGeneratedImages(prev => [match[1], ...prev.slice(0, 7)]);
        } else {
          setError("Image generated! Check the chat for the result.");
        }
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="relative w-full max-w-3xl mx-4 flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0f0f12 0%, #18181f 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Imagine</h2>
              <p className="text-zinc-500 text-xs">AI Image Generation</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ scrollbarWidth: "none" }}>
          {/* Generated images */}
          {generatedImages.length > 0 && (
            <div className="mb-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Generated</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {generatedImages.map((src, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
                    <img src={src} alt="generated" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <div className="flex flex-col">
                  <div
                    className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.1))", border: "1px solid rgba(167,139,250,0.2)" }}
                  >
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                          style={{ animation: `pulse-dot 1.4s ease-in-out ${d}s infinite` }} />
                      ))}
                    </div>
                    <span className="text-purple-300 text-sm font-medium">Generating</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              {error}
            </div>
          )}

          {/* Reference prompts */}
          <div className="mb-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Quick Ideas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REFERENCE_PROMPTS.map((ref) => (
                <button
                  key={ref.label}
                  onClick={() => { setPrompt(ref.prompt); textareaRef.current?.focus(); }}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-xl">{ref.emoji}</span>
                  <span className="text-zinc-300 text-xs font-medium leading-tight">{ref.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style selector */}
          <div className="mb-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Style</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={
                    selectedStyle === style
                      ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message bar */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <ImageIcon size={18} className="text-zinc-500 flex-shrink-0 mb-1" />
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Just prompt and image is in your hands!"
              className="flex-1 bg-transparent text-white placeholder-zinc-600 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-sm !p-0 !min-h-0"
              style={{ height: "36px", maxHeight: "100px", lineHeight: "1.5", overflowY: "auto", scrollbarWidth: "none" }}
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none" }}
            >
              {isGenerating
                ? <RefreshCw size={15} className="text-white animate-spin" />
                : <ArrowUp size={15} className="text-white" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
