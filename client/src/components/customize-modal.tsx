import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, Bot, Zap, Lightbulb, Code, FileText, Image, Mic, MessageSquare } from "lucide-react";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, selectedModel?: AvailableModel) => void;
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
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('anthropic/claude-3.5-sonnet');

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled, selectedModel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="macos-dialog-content bg-white border-gray-300 max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Customize Forus
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 h-8 w-8 rounded-full"
              data-testid="button-close-customize"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Enable Customization Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-gray-900">Enable Customization</span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            data-testid="switch-enable-customization"
          />
        </div>
        
        {/* Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-gray-500">Presets</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CHAT_PRESETS).map(([key, preset]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-colors border ${
                  selectedPreset === key
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPreset(key as ChatPreset)}
                data-testid={`preset-${key}`}
              >
                <CardContent className="p-3">
                  <div className="font-medium text-sm text-gray-900">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {preset.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-500">
            AI Model
          </label>
          <Select
            value={selectedModel}
            onValueChange={(value: AvailableModel) => setSelectedModel(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {model.split('/')[1] || model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-500">
            Custom Instructions
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell Forus how to behave..."
            className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 resize-none focus:border-gray-900"
            rows={3}
            data-testid="textarea-custom-instructions"
          />
        </div>
        
        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium rounded-xl"
          data-testid="button-save-customization"
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
