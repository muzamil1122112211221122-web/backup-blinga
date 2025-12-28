import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, User, Palette, Zap, Sliders, Database, Laptop, Sun, Moon } from "lucide-react";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, selectedModel?: AvailableModel) => void;
}

type SettingsSection = 'account' | 'appearance' | 'behavior' | 'customize' | 'data';

export function CustomizeModal({
  isOpen,
  onClose,
  currentPreset,
  customInstructions,
  onSave
}: CustomizeModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [selectedPreset, setSelectedPreset] = useState<ChatPreset>(currentPreset);
  const [instructions, setInstructions] = useState(customInstructions);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('forus-prime');

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled, selectedModel);
    onClose();
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'customize', label: 'Customize', icon: Sliders },
    { id: 'data', label: 'Data Controls', icon: Database },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="macos-dialog-content bg-[#0d0d0d] border-zinc-800/50 max-w-3xl h-[500px] shadow-2xl rounded-2xl [&>button]:hidden p-0 overflow-hidden flex flex-row">
        {/* Sidebar */}
        <div className="w-48 bg-[#161616] p-4 flex flex-col space-y-1">
          <h2 className="text-white text-lg font-bold mb-4 px-2">Settings</h2>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingsSection)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                activeSection === item.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>

          {activeSection === 'appearance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="flex flex-col h-20 bg-zinc-900 border-zinc-800 text-zinc-400">
                  <Sun className="w-5 h-5 mb-1" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 bg-zinc-900 border-zinc-800 text-zinc-400">
                  <Moon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 bg-zinc-800 border-zinc-700 text-white">
                  <Laptop className="w-5 h-5 mb-1" />
                  <span className="text-xs">System</span>
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Wrap Long Lines For Code Blocks By Default</span>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Show Conversation Previews in History</span>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Enable Starry Background</span>
                  <Switch checked={true} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'behavior' && (
            <div className="space-y-6 text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Auto Scroll</span>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Sidebar Editor For Code And Documents</span>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Notify When Forus Finishes Thinking</span>
                <Switch checked={false} />
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Require Cmd+Enter To Submit</span>
                  <Switch checked={false} />
                </div>
                <p className="text-xs text-zinc-500">When enabled, press Cmd+Enter (or Ctrl+Enter) to submit. Enter will add a new line.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm">Enable Rich Text Editor</span>
                  <p className="text-xs text-zinc-500">Enable code blocks and lists in the query bar</p>
                </div>
                <Switch checked={true} />
              </div>
            </div>
          )}

          {activeSection === 'customize' && (
            <div className="space-y-6">
              <h4 className="text-sm font-medium text-zinc-400">Customize Forus's Response</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CHAT_PRESETS).map(([key, preset]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-colors border ${
                      selectedPreset === key
                        ? 'border-zinc-500 bg-zinc-800'
                        : 'border-zinc-800 bg-[#161616] hover:bg-zinc-800/50'
                    }`}
                    onClick={() => setSelectedPreset(key as ChatPreset)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm text-white">
                        {preset.name}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {preset.description}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-zinc-500 flex items-center space-x-2">
                <Settings className="w-3 h-3" />
                <span>Select an instruction set from above to customize Forus's responses.</span>
              </p>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="max-w-[80%]">
                    <span className="text-sm text-white">Improve the Model</span>
                    <p className="text-xs text-zinc-500 mt-1">By allowing your data to be used for training our models, you help enhance your own experience and improve the quality of the model for all users.</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="max-w-[80%]">
                    <span className="text-sm text-white">Personalize Forus with your conversation history <span className="text-[10px] bg-zinc-800 px-1 rounded">beta</span></span>
                    <p className="text-xs text-zinc-500 mt-1">Allow Forus to remember details from your previous conversations.</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Allow chat link sharing</span>
                  <Switch checked={true} />
                </div>
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Storage Usage</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-zinc-400 h-full w-[2%]" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">13.59 MB used of 1.07 GB</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div>
                  <span className="text-sm text-white">See Files and Assets</span>
                  <p className="text-xs text-zinc-500 mt-1">See all the files and assets you have uploaded to Forus.</p>
                </div>
                <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white text-xs h-8">Manage</Button>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">M</div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase">MUZZAMIL ALI</p>
                    <p className="text-xs text-zinc-500">muzamil1122112211221122@gmail.com</p>
                  </div>
                </div>
                <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white text-xs h-8">Manage</Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-white">Get Forus Pro</span>
                  </div>
                  <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white text-xs h-8">Upgrade</Button>
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-white">Account Settings</span>
                  </div>
                  <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white text-xs h-8">Manage</Button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 rounded-2xl flex items-center justify-between border border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-bold text-white">Forus Pro</p>
                      <p className="text-[10px] text-zinc-500">Fewer rate limits, more capabilities</p>
                    </div>
                  </div>
                  <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 h-9 text-xs font-bold">Go Pro</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
