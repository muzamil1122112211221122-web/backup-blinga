import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Timer, FileText, Paperclip, Code2 } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function ProjectModal({ isOpen, onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timer, setTimer] = useState("");
  const [reminder, setReminder] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, instructions, timer, reminder });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-white dark:bg-[#0d0d0d] border-zinc-200 dark:border-zinc-800 flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Code2 className="h-6 w-6 text-blue-500" />
            </div>
            <span>Create Advanced Coding Project</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Project Identity</Label>
              <div className="space-y-2">
                <Input 
                  placeholder="Project Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-12"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Project Timeline</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    placeholder="Set Timer (min)" 
                    value={timer}
                    onChange={(e) => setTimer(e.target.value)}
                    className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-12"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    placeholder="Reminder Date" 
                    type="date"
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-12"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Coding Instructions</Label>
            <Textarea 
              placeholder="Provide deep context for the AI... (e.g. 'Use Groq API for high-speed code generation', 'Follow ChatGPT coding style')"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[200px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none p-4"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Assets & Files</Label>
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 hover:border-blue-500/50 transition-colors cursor-pointer group">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Paperclip className="h-8 w-8 text-zinc-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-zinc-500">Supported: .ts, .js, .py, .json, .zip</p>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-end space-x-4">
          <Button variant="ghost" onClick={onClose} className="h-12 px-8 font-bold">Cancel</Button>
          <Button onClick={handleSubmit} className="h-12 px-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
            Initialize Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
