import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image as ImageIcon, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
}

export function ImageGenerationDialog({ open, onOpenChange }: ImageGenerationDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for the image you want to find.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Image generation response:', data);
      
      if (data.success && data.url) {
        const newImage: GeneratedImage = {
          url: data.url,
          prompt: data.revisedPrompt || prompt.trim(),
          timestamp: new Date(),
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setPrompt('');
        
        toast({
          title: "Success!",
          description: "AI found a perfect image for you!",
        });
      } else {
        throw new Error(data.message || 'Failed to find image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to find image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  const downloadImage = async (url: string, promptText: string) => {
    try {
      // Try to fetch the image with proper CORS handling
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Create a safe filename from the prompt
      const safePrompt = promptText.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      link.download = `${safePrompt}_${Date.now()}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Downloaded!",
        description: "Image saved to your downloads.",
      });
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: open the image in a new tab for manual download
      window.open(url, '_blank');
      
      toast({
        title: "Download Alternative",
        description: "Image opened in new tab. Right-click to save manually.",
        variant: "default",
      });
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Find Images with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you're looking for and AI will search the internet to find the perfect image for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Generation Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-prompt">What image are you looking for?</Label>
              <Textarea
                id="image-prompt"
                placeholder="Describe the image you want to find... (e.g., 'A red horse galloping', 'Beautiful sunset over mountains')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
                data-testid="input-image-prompt"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image-size">Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger data-testid="select-image-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                    <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                    <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-quality">Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger data-testid="select-image-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD (Higher Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              data-testid="button-generate-image"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching for Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Find Image
                </>
              )}
            </Button>
          </div>

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="space-y-3 bg-card p-4 rounded-lg border">
                    <img
                      src={image.url}
                      alt={`Generated: ${image.prompt}`}
                      className="w-full h-auto rounded-lg shadow-sm"
                      data-testid={`generated-image-${index}`}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        // Fallback to a different Unsplash URL if the first one fails
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('retry=1')) {
                          target.src = `${image.url}&retry=1&sig=${Date.now()}`;
                        }
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', image.url);
                      }}
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        "{image.prompt}"
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPrompt(image.prompt)}
                          data-testid={`button-copy-prompt-${index}`}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Prompt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(image.url, image.prompt)}
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}