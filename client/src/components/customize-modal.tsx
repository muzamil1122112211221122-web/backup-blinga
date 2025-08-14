import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, Bot, Zap, Lightbulb, Code, FileText, Image, Mic, MessageSquare, Key } from "lucide-react";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, selectedModel?: AvailableModel, apiKeys?: ApiKeys) => void;
}

interface ApiKeys {
  [key: string]: string;
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
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('forus-prime');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    'forus-prime': '',
    'forus-code': '',
    'forus-flash': '',
    'forus-creative': '',
  });

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled, selectedModel, apiKeys);
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
                  {model.charAt(0).toUpperCase() + model.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Keys Configuration */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-gray-500 flex items-center">
            <Key className="h-4 w-4 mr-2" />
            API Keys Configuration
          </h4>
          <div className="space-y-3">
            {[
              { key: 'forus-prime', label: 'Forus Prime', description: 'Advanced reasoning & analysis' },
              { key: 'forus-code', label: 'Forus Code', description: 'Programming & development' },
              { key: 'forus-flash', label: 'Forus Flash', description: 'Fast responses & multimodal' },
              { key: 'forus-creative', label: 'Forus Creative', description: 'Creative writing & storytelling' },
            ].map(({ key, label, description }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {label}
                  <span className="text-gray-500 ml-1">({description})</span>
                </label>
                <Input
                  type="password"
                  value={apiKeys[key] || ''}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Enter ${label} API key...`}
                  className="text-xs h-8"
                />
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
