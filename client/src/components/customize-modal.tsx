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
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, functionModels?: FunctionModels) => void;
}

interface FunctionModels {
  general: AvailableModel;
  coding: AvailableModel;
  creative: AvailableModel;
  analysis: AvailableModel;
  image: AvailableModel;
  voice: AvailableModel;
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
  const [functionModels, setFunctionModels] = useState<FunctionModels>({
    general: 'anthropic/claude-3.5-sonnet',
    coding: 'openai/gpt-4o',
    creative: 'meta-llama/llama-3.1-70b-instruct',
    analysis: 'google/gemini-2.0-flash-exp',
    image: 'openai/gpt-4o',
    voice: 'anthropic/claude-3-haiku',
  });

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled, functionModels);
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
        
        {/* OpenRouter API Functions */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-gray-500">OpenRouter APIs for Functions</h4>
          <div className="space-y-3">
            {[
              { key: 'general', icon: MessageSquare, label: 'General Chat', description: 'Main conversation model' },
              { key: 'coding', icon: Code, label: 'Code Analysis', description: 'Programming & debugging' },
              { key: 'creative', icon: Lightbulb, label: 'Creative Writing', description: 'Stories & creative content' },
              { key: 'analysis', icon: Bot, label: 'Data Analysis', description: 'Research & insights' },
              { key: 'image', icon: Image, label: 'Image Tasks', description: 'Visual understanding' },
              { key: 'voice', icon: Mic, label: 'Voice Processing', description: 'Fast voice responses' },
            ].map(({ key, icon: Icon, label, description }) => (
              <div key={key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl">
                <Icon className="h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
                <Select
                  value={functionModels[key as keyof FunctionModels]}
                  onValueChange={(value: AvailableModel) => 
                    setFunctionModels(prev => ({ ...prev, [key]: value }))
                  }
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model} value={model} className="text-xs">
                        {model.split('/')[1] || model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
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
