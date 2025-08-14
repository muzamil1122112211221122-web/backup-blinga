import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CHAT_PRESETS, ChatPreset } from "../types/chat";
import { Settings, X } from "lucide-react";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean) => void;
}

export function CustomizeModal({
  isOpen,
  onClose,
  currentPreset,
  customInstructions,
  onSave
}: CustomizeModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<ChatPreset>(currentPreset);
  const [instructions, setInstructions] = useState(customInstructions);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="macos-dialog-content bg-[var(--dark-secondary)] border-[var(--macos-border-light)] max-w-md glassmorphism">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-[var(--text-primary)]">
            Customize LineusAPI
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              data-testid="button-close-customize"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Enable Customization Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-primary)]">Enable Customization</span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            data-testid="switch-enable-customization"
          />
        </div>
        
        {/* Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">Presets</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CHAT_PRESETS).map(([key, preset]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-colors border ${
                  selectedPreset === key
                    ? 'border-[var(--text-primary)] bg-[var(--dark-accent)]'
                    : 'border-[var(--border)] bg-[var(--dark-primary)] hover:bg-[var(--dark-accent)]'
                }`}
                onClick={() => setSelectedPreset(key as ChatPreset)}
                data-testid={`preset-${key}`}
              >
                <CardContent className="p-3">
                  <div className="font-medium text-sm text-[var(--text-primary)]">
                    {preset.name}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {preset.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Custom Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Custom Instructions
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell LineusAPI how to behave..."
            className="bg-[var(--dark-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none focus:border-[var(--text-primary)]"
            rows={3}
            data-testid="textarea-custom-instructions"
          />
        </div>
        
        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-[var(--text-primary)] text-[var(--dark-primary)] hover:bg-[var(--text-secondary)] font-medium"
          data-testid="button-save-customization"
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
