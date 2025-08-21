import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Key, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  status: 'active' | 'inactive' | 'testing';
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("groq");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  
  // API Key states
  const [groqKey, setGroqKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKeys, setOpenrouterKeys] = useState<Record<number, string>>({
    1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: "", 10: ""
  });

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const testApiKey = async (provider: string, key: string, keyId: string) => {
    if (!key.trim()) {
      toast({
        title: "خطا",
        description: "پہلے API key داخل کریں",
        variant: "destructive"
      });
      return;
    }

    setTestingKeys(prev => new Set([...prev, keyId]));
    
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "کامیاب ✅",
          description: `${provider.toUpperCase()} API key کام کر رہی ہے`,
        });
      } else {
        toast({
          title: "ناکام ❌",
          description: result.error || "API key میں مسئلہ ہے",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "API key test کرنے میں مسئلہ",
        variant: "destructive"
      });
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const saveApiKey = async (provider: string, key: string, keyName?: string) => {
    if (!key.trim()) {
      toast({
        title: "خطا",
        description: "API key داخل کریں",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/save-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key, keyName })
      });

      if (response.ok) {
        toast({
          title: "محفوظ ہو گیا ✅",
          description: `${provider.toUpperCase()} API key save ہو گئی`,
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "API key save کرنے میں مسئلہ",
        variant: "destructive"
      });
    }
  };

  const KeyInput = ({ 
    label, 
    value, 
    onChange, 
    provider, 
    keyId, 
    placeholder 
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    provider: string;
    keyId: string;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={keyId}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={keyId}
            type={showKeys[keyId] ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => toggleKeyVisibility(keyId)}
          >
            {showKeys[keyId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <Button
          onClick={() => testApiKey(provider, value, keyId)}
          disabled={testingKeys.has(keyId) || !value.trim()}
          size="sm"
          variant="outline"
        >
          {testingKeys.has(keyId) ? "Testing..." : "Test"}
        </Button>
        <Button
          onClick={() => saveApiKey(provider, value)}
          disabled={!value.trim()}
          size="sm"
        >
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="groq">Groq</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
          </TabsList>

          <TabsContent value="groq" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Groq Cloud API
                <Badge variant="secondary">Primary</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fast and free inference for Llama, Mixtral, and Gemma models
              </p>
              
              <KeyInput
                label="Groq API Key"
                value={groqKey}
                onChange={setGroqKey}
                provider="groq"
                keyId="groq-key"
                placeholder="gsk_..."
              />
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm"><strong>کیسے حاصل کریں:</strong></p>
                <p className="text-sm">1. groq.com پر جائیں</p>
                <p className="text-sm">2. Account بنائیں</p>
                <p className="text-sm">3. API key generate کریں</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="openrouter" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                OpenRouter APIs
                <Badge variant="secondary">Secondary</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access to multiple AI models through one API. Add up to 10 keys for load balancing.
              </p>
              
              <div className="space-y-3">
                {Array.from({ length: 10 }, (_, i) => (
                  <KeyInput
                    key={i + 1}
                    label={`OpenRouter API Key ${i + 1}`}
                    value={openrouterKeys[i + 1] || ""}
                    onChange={(value) => setOpenrouterKeys(prev => ({ ...prev, [i + 1]: value }))}
                    provider="openrouter"
                    keyId={`openrouter-key-${i + 1}`}
                    placeholder="sk-or-..."
                  />
                ))}
              </div>
              
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                <p className="text-sm"><strong>کیسے حاصل کریں:</strong></p>
                <p className="text-sm">1. openrouter.ai پر جائیں</p>
                <p className="text-sm">2. Account بنائیں اور credit add کریں</p>
                <p className="text-sm">3. Multiple API keys generate کریں</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="openai" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                OpenAI API
                <Badge variant="secondary">Tertiary</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                GPT-4o, DALL-E 3 for text and image generation
              </p>
              
              <KeyInput
                label="OpenAI API Key"
                value={openaiKey}
                onChange={setOpenaiKey}
                provider="openai"
                keyId="openai-key"
                placeholder="sk-..."
              />
              
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                <p className="text-sm"><strong>کیسے حاصل کریں:</strong></p>
                <p className="text-sm">1. platform.openai.com پر جائیں</p>
                <p className="text-sm">2. Account میں credit add کریں</p>
                <p className="text-sm">3. API key generate کریں</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gemini" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Google Gemini API
                <Badge variant="secondary">Image Generation</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Latest Gemini 2.0 Flash for high-quality image generation
              </p>
              
              <KeyInput
                label="Gemini API Key"
                value={geminiKey}
                onChange={setGeminiKey}
                provider="gemini"
                keyId="gemini-key"
                placeholder="AI..."
              />
              
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <p className="text-sm"><strong>کیسے حاصل کریں:</strong></p>
                <p className="text-sm">1. aistudio.google.com پر جائیں</p>
                <p className="text-sm">2. Google account سے login کریں</p>
                <p className="text-sm">3. Free API key generate کریں</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <p>💡 <strong>Tip:</strong> Multiple keys enable automatic failover</p>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}