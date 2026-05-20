import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHAT_PRESETS, ChatPreset, AVAILABLE_MODELS, AvailableModel } from "../types/chat";
import { Settings, X, User, Palette, Zap, Sliders, Database, Laptop, Sun, Moon, ChevronUp, ChevronDown, Pencil, Camera, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ChatPreset;
  customInstructions: string;
  onSave: (preset: ChatPreset, customInstructions: string, enabled: boolean, selectedModel?: AvailableModel, toggles?: any, aiOrder?: string[]) => void;
  toggles: any;
  aiOrder: string[];
  user?: { email: string; username: string; displayName?: string | null } | null;
  profilePicture?: string;
  onUserRename?: (name: string) => void;
  onProfilePictureChange?: (dataUrl: string) => void;
}

type SettingsSection = 'account' | 'appearance' | 'behavior' | 'customize' | 'data';

export function CustomizeModal({
  isOpen,
  onClose,
  currentPreset,
  customInstructions,
  onSave,
  toggles,
  aiOrder,
  user,
  profilePicture,
  onUserRename,
  onProfilePictureChange
}: CustomizeModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [selectedPreset, setSelectedPreset] = useState<ChatPreset>(currentPreset);
  const [instructions, setInstructions] = useState(customInstructions);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>('forus-prime');
  const [localAiOrder, setLocalAiOrder] = useState(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'perplexity', 'grok-4', 'deepseek-r1', 'forus-ai']);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [localTheme, setLocalTheme] = useState<string>(theme);
  const [functionBarStyle, setFunctionBarStyle] = useState<string>(
    () => localStorage.getItem('functionBarStyle') || 'square'
  );
  const [messageBarStyle, setMessageBarStyle] = useState<string>(
    () => localStorage.getItem('messageBarStyle') || 'compact'
  );
  const [chatBg, setChatBg] = useState<string>(
    () => localStorage.getItem('chatBg') || 'plain'
  );
  const originalTheme = useRef<string>(theme);
  const originalFunctionBarStyle = useRef<string>(localStorage.getItem('functionBarStyle') || 'square');
  const originalMessageBarStyle = useRef<string>(localStorage.getItem('messageBarStyle') || 'compact');
  const originalChatBg = useRef<string>(localStorage.getItem('chatBg') || 'plain');
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [editName, setEditName] = useState('');
  const [previewPic, setPreviewPic] = useState('');
  const picInputRef = useRef<HTMLInputElement>(null);

  const [localToggles, setLocalToggles] = useState({
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
    linkSharing: true,
    sidebarCloseTop: true,
    showForusLogo: true
  });

  // Only reset local state when modal transitions from closed → open
  const prevIsOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setSelectedPreset(currentPreset);
      setInstructions(customInstructions);
      setLocalToggles({ ...toggles });
      setLocalAiOrder([...aiOrder]);
      setLocalTheme(theme);
      originalTheme.current = theme;
      const savedStyle = localStorage.getItem('functionBarStyle') || 'square';
      setFunctionBarStyle(savedStyle);
      originalFunctionBarStyle.current = savedStyle;
      const savedMsgStyle = localStorage.getItem('messageBarStyle') || 'default';
      setMessageBarStyle(savedMsgStyle);
      originalMessageBarStyle.current = savedMsgStyle;
      setIsDirty(false);
      setShowExitDialog(false);
    }
    prevIsOpen.current = isOpen;
  });

  const handleToggle = (key: string) => {
    setLocalToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    setIsDirty(true);
  };

  const handleFunctionBarStyleChange = (val: string) => {
    setFunctionBarStyle(val);
    setIsDirty(true);
  };

  const handleMessageBarStyleChange = (val: string) => {
    setMessageBarStyle(val);
    setIsDirty(true);
  };

  const handleChatBgChange = (val: string) => {
    setChatBg(val);
    setIsDirty(true);
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localAiOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setLocalAiOrder(newOrder);
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
    setTheme(localTheme);
    localStorage.setItem('functionBarStyle', functionBarStyle);
    window.dispatchEvent(new Event('functionBarStyleChanged'));
    localStorage.setItem('messageBarStyle', messageBarStyle);
    window.dispatchEvent(new Event('messageBarStyleChanged'));
    localStorage.setItem('chatBg', chatBg);
    window.dispatchEvent(new Event('chatBgChanged'));
    onSave(selectedPreset, instructions, isEnabled, selectedModel, localToggles, localAiOrder);
    setIsDirty(false);
    onClose();
    setShowExitDialog(false);
  };

  const handleDontSave = () => {
    setTheme(originalTheme.current);
    setFunctionBarStyle(originalFunctionBarStyle.current);
    setMessageBarStyle(originalMessageBarStyle.current);
    setChatBg(originalChatBg.current);
    setIsDirty(false);
    setShowExitDialog(false);
    onClose();
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'customize', label: 'General', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'data', label: 'Nomad Settings', icon: Database },
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseAttempt();
    }}>
      <DialogContent className="macos-dialog-content bg-white dark:bg-[#0d0d0d] border-zinc-200 dark:border-zinc-800/50 max-w-3xl h-[580px] shadow-2xl rounded-2xl [&>button]:hidden p-0 overflow-hidden flex flex-row z-[50]">
        {/* Sidebar */}
        <div className="w-56 bg-zinc-50 dark:bg-[#161616] p-4 flex flex-col border-r border-zinc-200 dark:border-[#2a2a2a] flex-shrink-0 z-[60]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-zinc-900 dark:text-white text-lg font-bold">Settings</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCloseAttempt}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-6 w-6 rounded-full"
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
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto pt-4 flex flex-col space-y-2 border-t border-zinc-200 dark:border-[#2a2a2a]">
            <Button
              onClick={handleSave}
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-9 font-bold"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseAttempt}
              className="w-full bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs h-9"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-white dark:bg-[#0d0d0d]">
          {activeSection === 'appearance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className={`flex flex-col h-20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 ${localTheme === 'light' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600' : 'bg-white dark:bg-zinc-900'}`}
                  onClick={() => { setLocalTheme('light'); setTheme('light'); setIsDirty(true); }}
                >
                  <Sun className="w-5 h-5 mb-1" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex flex-col h-20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 ${localTheme === 'dark' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600' : 'bg-white dark:bg-zinc-900'}`}
                  onClick={() => { setLocalTheme('dark'); setTheme('dark'); setIsDirty(true); }}
                >
                  <Moon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex flex-col h-20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 ${localTheme === 'system' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600' : 'bg-white dark:bg-zinc-900'}`}
                  onClick={() => { setLocalTheme('system'); setTheme('system'); setIsDirty(true); }}
                >
                  <Laptop className="w-5 h-5 mb-1" />
                  <span className="text-xs">System</span>
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">Wrap Long Lines For Code Blocks By Default</span>
                  <Switch checked={localToggles.wrapLines} onCheckedChange={() => handleToggle('wrapLines')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">Show Conversation Previews in History</span>
                  <Switch checked={localToggles.showPreviews} onCheckedChange={() => handleToggle('showPreviews')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Show Forus Logo in Responses</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Display the Forus logo next to AI responses in chat</p>
                  </div>
                  <Switch checked={localToggles.showForusLogo ?? true} onCheckedChange={() => handleToggle('showForusLogo')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Nomad Grid Background</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show an animated grid pattern in the Nomad multi-AI tab</p>
                  </div>
                  <Switch checked={localToggles.nomadGrid ?? true} onCheckedChange={() => handleToggle('nomadGrid')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Nomad Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Show a periodic pop-up notification every 3–5 minutes</p>
                  </div>
                  <Switch checked={localToggles.nomadNotification ?? true} onCheckedChange={() => handleToggle('nomadNotification')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Philosophers Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Include the Philosophers variant in periodic pop-ups</p>
                  </div>
                  <Switch checked={localToggles.philosopherNotification ?? true} onCheckedChange={() => handleToggle('philosopherNotification')} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Forus Games Notifications</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Include the Forus Games variant in periodic pop-ups</p>
                  </div>
                  <Switch checked={localToggles.forusGamesNotification ?? true} onCheckedChange={() => handleToggle('forusGamesNotification')} />
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Function Bar Style</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose how the quick-action buttons appear</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'square', label: 'Square' },
                    { value: 'circle', label: 'Circle' },
                    { value: 'message-bar', label: 'In Message Bar' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleFunctionBarStyleChange(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        functionBarStyle === opt.value
                          ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {opt.value === 'square' && (
                        <div className="w-8 h-8 bg-zinc-400 rounded" />
                      )}
                      {opt.value === 'circle' && (
                        <div className="w-8 h-8 bg-zinc-400 rounded-full" />
                      )}
                      {opt.value === 'message-bar' && (
                        <div className="w-8 h-8 flex items-center justify-center gap-0.5">
                          <div className="w-2.5 h-2.5 bg-zinc-400 rounded-full" />
                          <div className="w-2.5 h-2.5 bg-zinc-400 rounded-full" />
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Message Bar Style</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the height and size of the message input area</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'default', label: 'Default' },
                    { value: 'compact', label: 'Compact' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleMessageBarStyleChange(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        messageBarStyle === opt.value
                          ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {opt.value === 'default' && (
                        <div className="w-24 h-8 bg-zinc-300 dark:bg-zinc-600 rounded-xl" />
                      )}
                      {opt.value === 'compact' && (
                        <div className="w-24 h-4 bg-zinc-300 dark:bg-zinc-600 rounded-lg" />
                      )}
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Chat Background</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Choose the background style for the chat area</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'plain', label: 'Plain' },
                    { value: 'stars', label: 'Stars' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChatBgChange(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        chatBg === opt.value
                          ? 'border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {opt.value === 'plain' && (
                        <div className="w-24 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700" />
                      )}
                      {opt.value === 'stars' && (
                        <div className="w-24 h-10 bg-zinc-900 rounded-lg relative overflow-hidden border border-zinc-700">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-80" style={{
                              left: `${10 + (i * 12) % 90}%`,
                              top: `${15 + (i * 17) % 70}%`,
                              animation: `twinkle ${1.2 + (i * 0.3) % 1.5}s ease-in-out infinite`,
                              animationDelay: `${(i * 0.2) % 1.5}s`
                            }} />
                          ))}
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeSection === 'behavior' && (
            <div className="space-y-6 text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable Auto Scroll</span>
                <Switch checked={localToggles.autoScroll} onCheckedChange={() => handleToggle('autoScroll')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm">Enable Rich Text Editor</span>
                  <p className="text-xs text-zinc-500">Enable code blocks and lists in the query bar</p>
                </div>
                <Switch checked={localToggles.richText} onCheckedChange={() => handleToggle('richText')} />
              </div>
            </div>
          )}

          {activeSection === 'customize' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-4">Sidebar</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-200">Sidebar Close Button Position</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Choose where the close button appears in the sidebar</p>
                  </div>
                  <Select
                    value={localToggles.sidebarCloseTop ? 'top' : 'bottom'}
                    onValueChange={(val) => { setLocalToggles(prev => ({ ...prev, sidebarCloseTop: val === 'top' })); setIsDirty(true); }}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs bg-zinc-50 dark:bg-[#161616] border-zinc-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Customize Forus's Response</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CHAT_PRESETS).map(([key, preset]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-colors border ${
                      selectedPreset === key
                        ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161616] hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                    onClick={() => { setSelectedPreset(key as ChatPreset); setIsDirty(true); }}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm text-zinc-900 dark:text-white">
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
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Custom Instructions</label>
                <Textarea 
                  value={instructions}
                  onChange={(e) => { setInstructions(e.target.value); setIsDirty(true); }}
                  placeholder="Tell Forus how to behave..."
                  className="bg-zinc-50 dark:bg-[#161616] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white min-h-[100px]"
                />
              </div>
              <p className="text-xs text-zinc-500 flex items-center space-x-2">
                <Settings className="w-3 h-3" />
                <span>Select an instruction set from above or write your own to customize Forus's responses.</span>
              </p>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Order Switcher</h4>
                <div className="space-y-2">
                  {localAiOrder.map((name, index) => {
                    const modelDisplayNames: Record<string, string> = {
                      'gpt-4o': 'ChatGPT 5',
                      'claude-3.5-sonnet': 'Claude Sonnet 4',
                      'gemini-pro': 'Gemini 2.5 Pro',
                      'perplexity': 'Perplexity Sonar Pro',
                      'grok-4': 'Grok 4',
                      'deepseek-r1': 'Deepseek v3',
                      'forus-ai': 'Forus Pro',
                    };
                    return (
                    <div key={name} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#161616] rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <span className="text-sm text-zinc-900 dark:text-white capitalize">{modelDisplayNames[name] || name.replace(/-/g, ' ')}</span>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === localAiOrder.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                  })}
                </div>

                <div className="pt-6 border-t border-zinc-200 dark:border-[#2a2a2a] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-zinc-900 dark:text-white">Improve the Model</span>
                      <p className="text-xs text-zinc-500 mt-1">By allowing your data to be used for training our models, you help enhance your own experience and improve the quality of the model for all users.</p>
                    </div>
                    <Switch checked={localToggles.improveModel} onCheckedChange={() => handleToggle('improveModel')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <span className="text-sm text-zinc-900 dark:text-white">Personalize Forus with your conversation history <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">beta</span></span>
                      <p className="text-xs text-zinc-500 mt-1">Allow Forus to remember details from your previous conversations.</p>
                    </div>
                    <Switch checked={localToggles.personalize} onCheckedChange={() => handleToggle('personalize')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-900 dark:text-white">Allow chat link sharing</span>
                    <Switch checked={localToggles.linkSharing} onCheckedChange={() => handleToggle('linkSharing')} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-[#161616] rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Storage Usage</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-zinc-500 dark:bg-zinc-400 h-full w-[2%]" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">13.59 MB used of 1.07 GB</p>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-[#161616] rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {(previewPic || profilePicture) ? (
                        <img src={previewPic || profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                          {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase">{user?.displayName || user?.username || 'User'}</p>
                      <p className="text-xs text-zinc-500">{user?.email || ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs h-8 flex items-center gap-1.5"
                    onClick={() => {
                      setEditName(user?.displayName || user?.username || '');
                      setPreviewPic('');
                      setShowCustomizePanel(v => !v);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Customize
                  </Button>
                </div>

                {showCustomizePanel && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Display Name</label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-8 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Profile Picture</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {(previewPic || profilePicture) ? (
                            <img src={previewPic || profilePicture} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs flex items-center gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                          onClick={() => picInputRef.current?.click()}
                        >
                          <Camera className="w-3 h-3" />
                          Upload Photo
                        </Button>
                        <input
                          ref={picInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setPreviewPic(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => { setShowCustomizePanel(false); setPreviewPic(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center gap-1.5"
                        onClick={() => {
                          if (editName.trim()) onUserRename?.(editName.trim());
                          if (previewPic) onProfilePictureChange?.(previewPic);
                          setShowCustomizePanel(false);
                        }}
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    {showExitDialog && (
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-[#161616] border border-zinc-200 dark:border-zinc-800 max-w-sm shadow-2xl rounded-2xl p-6 z-[200] opacity-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white text-lg font-bold">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
              You have unsaved changes. Do you want to save them before leaving?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={handleDontSave}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Don't Save
            </Button>
            <Button
              onClick={handleSave}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold"
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

