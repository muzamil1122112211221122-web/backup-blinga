import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, User, Palette, Zap, Sliders, Database, Laptop, Sun, Moon, ChevronUp, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

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
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [selectedPreset, setSelectedPreset] = useState<ChatPreset>(currentPreset);
  const [instructions, setInstructions] = useState(customInstructions);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('forus-prime');
  const [aiOrder, setAiOrder] = useState(['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Forus']);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [toggles, setToggles] = useState({
    wrapLines: true,
    showPreviews: true,
    starryBg: true,
    autoScroll: true,
    sidebarEditor: true,
    notifyThinking: false,
    cmdEnter: false,
    richText: true,
    improveModel: true,
    personalize: true,
    linkSharing: true
  });

  // Reset local state when modal opens to ensure we start with saved values
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(currentPreset);
      setInstructions(customInstructions);
      setIsDirty(false);
      setShowExitDialog(false);
      setToggles({
        wrapLines: true,
        showPreviews: true,
        starryBg: true,
        autoScroll: true,
        sidebarEditor: true,
        notifyThinking: false,
        cmdEnter: false,
        richText: true,
        improveModel: true,
        personalize: true,
        linkSharing: true
      });
    }
  }, [isOpen, currentPreset, customInstructions]);

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...aiOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setAiOrder(newOrder);
    setIsDirty(true);
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    onSave(selectedPreset, instructions, isEnabled, selectedModel);
    setIsDirty(false);
    onClose();
    setShowExitDialog(false);
  };

  const handleDontSave = () => {
    setIsDirty(false);
    setShowExitDialog(false);
    onClose();
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'customize', label: 'Customize', icon: Sliders },
    { id: 'data', label: 'Lumin Settings', icon: Database },
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseAttempt();
    }}>
      <DialogContent className="macos-dialog-content bg-[#0d0d0d] !bg-[#0d0d0d] border-zinc-800/50 max-w-3xl h-[500px] shadow-2xl rounded-2xl [&>button]:hidden p-0 overflow-hidden flex flex-row z-[50]">
        {/* Sidebar */}
        <div className="w-56 bg-[#161616] !bg-[#161616] p-4 flex flex-col border-r border-[#2a2a2a] !border-[#2a2a2a] flex-shrink-0 z-[60]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-white text-lg font-bold">Settings</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCloseAttempt}
              className="text-zinc-500 hover:text-white h-6 w-6 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col space-y-1 overflow-y-auto min-h-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-sm font-medium flex-shrink-0 ${
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
          <div className="mt-auto pt-4 flex flex-col space-y-2 border-t border-[#2a2a2a]">
            <Button
              onClick={handleSave}
              className="w-full bg-white text-black hover:bg-zinc-200 text-xs h-9 font-bold"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseAttempt}
              className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 text-xs h-9"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-[#0d0d0d] !bg-[#0d0d0d]">
          {activeSection === 'appearance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className={`flex flex-col h-20 border-zinc-800 text-zinc-400 ${theme === 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-900'}`}
                  onClick={() => { setTheme('light'); setIsDirty(true); }}
                >
                  <Sun className="w-5 h-5 mb-1" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex flex-col h-20 border-zinc-800 text-zinc-400 ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-900'}`}
                  onClick={() => { setTheme('dark'); setIsDirty(true); }}
                >
                  <Moon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Dark</span>
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Wrap Long Lines For Code Blocks By Default</span>
                  <Switch checked={toggles.wrapLines} onCheckedChange={() => handleToggle('wrapLines')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">Show Conversation Previews in History</span>
                  <Switch checked={toggles.showPreviews} onCheckedChange={() => handleToggle('showPreviews')} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'behavior' && (
            <div className="space-y-6 text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Auto Scroll</span>
                <Switch checked={toggles.autoScroll} onCheckedChange={() => handleToggle('autoScroll')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm">Enable Rich Text Editor</span>
                  <p className="text-xs text-zinc-500">Enable code blocks and lists in the query bar</p>
                </div>
                <Switch checked={toggles.richText} onCheckedChange={() => handleToggle('richText')} />
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
                    onClick={() => { setSelectedPreset(key as ChatPreset); setIsDirty(true); }}
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
              <div className="pt-4 space-y-4">
                <label className="text-sm font-medium text-zinc-400">Custom Instructions</label>
                <Textarea 
                  value={instructions}
                  onChange={(e) => { setInstructions(e.target.value); setIsDirty(true); }}
                  placeholder="Tell Forus how to behave..."
                  className="bg-[#161616] border-zinc-800 text-white min-h-[100px]"
                />
              </div>
              <p className="text-xs text-zinc-500 flex items-center space-x-2">
                <Settings className="w-3 h-3" />
                <span>Select an instruction set from above or write your own to customize Forus's responses.</span>
              </p>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white">Order Switcher</h4>
                <div className="space-y-2">
                  {aiOrder.map((name, index) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-[#161616] rounded-lg border border-zinc-800">
                      <span className="text-sm text-white">{name}</span>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-500 hover:text-white"
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-500 hover:text-white"
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === aiOrder.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#2a2a2a] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-white">Improve the Model</span>
                      <p className="text-xs text-zinc-500 mt-1">By allowing your data to be used for training our models, you help enhance your own experience and improve the quality of the model for all users.</p>
                    </div>
                    <Switch checked={toggles.improveModel} onCheckedChange={() => handleToggle('improveModel')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-white">Personalize Forus with your conversation history <span className="text-[10px] bg-zinc-800 px-1 rounded">beta</span></span>
                      <p className="text-xs text-zinc-500 mt-1">Allow Forus to remember details from your previous conversations.</p>
                    </div>
                    <Switch checked={toggles.personalize} onCheckedChange={() => handleToggle('personalize')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Allow chat link sharing</span>
                    <Switch checked={toggles.linkSharing} onCheckedChange={() => handleToggle('linkSharing')} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#161616] rounded-xl border border-zinc-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Storage Usage</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-zinc-400 h-full w-[2%]" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">13.59 MB used of 1.07 GB</p>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#161616] rounded-xl border border-zinc-800">
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
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-white">Account Settings</span>
                  </div>
                  <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white text-xs h-8">Manage</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    {showExitDialog && (
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-[#161616] !bg-[#161616] border border-zinc-800 max-w-sm shadow-2xl rounded-2xl p-6 z-[200] opacity-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-2">
              You have unsaved changes. Do you want to save them before leaving?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={handleDontSave}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Don't Save
            </Button>
            <Button
              onClick={handleSave}
              className="bg-white text-black hover:bg-zinc-200"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}

