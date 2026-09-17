import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Mic, MicOff, Volume2, BookOpen, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExamination: (data: ExaminationData) => void;
  onStartSelfListen: (data: SelfListenData) => void;
}

interface ExaminationData {
  class: string;
  city: string;
  school: string;
  country: string;
  educationSystem: string;
  uploadedPages: File[];
}

interface SelfListenData {
  heading: string;
  uploadedImages: File[];
}

export function EducationModal({ isOpen, onClose, onStartExamination, onStartSelfListen }: EducationModalProps) {
  const [mode, setMode] = useState<"examination" | "self-listen" | null>(null);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  // Examination form state
  const [examData, setExamData] = useState<Partial<ExaminationData>>({});
  const [schools, setSchools] = useState<string[]>([]);
  
  // Self Listen form state
  const [selfListenData, setSelfListenData] = useState<Partial<SelfListenData>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const searchSchoolsMutation = useMutation({
    mutationFn: async (locationData: { city: string; country: string }) => {
      const response = await fetch("/api/education/search-schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      });
      if (!response.ok) throw new Error("Failed to search schools");
      return response.json();
    },
    onSuccess: (data) => {
      setSchools(data.schools || []);
      setStep(2);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to search schools. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null, type: "pages" | "images") => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (type === "pages") {
      setExamData(prev => ({ ...prev, uploadedPages: fileArray }));
    } else {
      setSelfListenData(prev => ({ ...prev, uploadedImages: fileArray }));
    }
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please check your microphone and try again.",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setMode(null);
    setStep(1);
    setExamData({});
    setSelfListenData({});
    setSchools([]);
    setVoiceTranscript("");
    setIsRecording(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderModeSelection = () => (
    <div className="space-y-4" data-testid="education-mode-selection">
      <p className="text-center text-gray-600 dark:text-gray-300">
        Choose your educational mode:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => setMode("examination")}
          data-testid="button-examination-mode"
        >
          <CardHeader className="text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-blue-500" />
            <CardTitle>Blinga Examination</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Take personalized tests based on your school curriculum and uploaded study materials.
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => setMode("self-listen")}
          data-testid="button-self-listen-mode"
        >
          <CardHeader className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle>Blinga Self Listen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Practice speaking and get feedback on your understanding through voice interaction.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExaminationFlow = () => {
    if (step === 1) {
      return (
        <div className="space-y-4" data-testid="examination-step-1">
          <h3 className="text-lg font-semibold">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class">Class/Grade</Label>
              <Input
                id="class"
                placeholder="e.g., 10th Grade"
                value={examData.class || ""}
                onChange={(e) => setExamData(prev => ({ ...prev, class: e.target.value }))}
                data-testid="input-class"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g., Pakistan"
                value={examData.country || ""}
                onChange={(e) => setExamData(prev => ({ ...prev, country: e.target.value }))}
                data-testid="input-country"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Karachi"
                value={examData.city || ""}
                onChange={(e) => setExamData(prev => ({ ...prev, city: e.target.value }))}
                data-testid="input-city"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              if (examData.city && examData.country) {
                searchSchoolsMutation.mutate({ city: examData.city, country: examData.country });
              } else {
                toast({
                  title: "Missing Information",
                  description: "Please fill in your city and country.",
                  variant: "destructive",
                });
              }
            }}
            disabled={searchSchoolsMutation.isPending}
            data-testid="button-search-schools"
          >
            {searchSchoolsMutation.isPending ? "Searching..." : "Search Schools"}
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4" data-testid="examination-step-2">
          <h3 className="text-lg font-semibold">School Selection & Education System</h3>
          <div>
            <Label htmlFor="school">Select Your School</Label>
            <Select onValueChange={(value) => setExamData(prev => ({ ...prev, school: value }))}>
              <SelectTrigger data-testid="select-school">
                <SelectValue placeholder="Choose your school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school, index) => (
                  <SelectItem key={index} value={school} data-testid={`option-school-${index}`}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="education-system">Education System</Label>
            <Select onValueChange={(value) => setExamData(prev => ({ ...prev, educationSystem: value }))}>
              <SelectTrigger data-testid="select-education-system">
                <SelectValue placeholder="Choose education system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="o-levels" data-testid="option-o-levels">O Levels</SelectItem>
                <SelectItem value="a-levels" data-testid="option-a-levels">A Levels</SelectItem>
                <SelectItem value="matric" data-testid="option-matric">Matric System</SelectItem>
                <SelectItem value="intermediate" data-testid="option-intermediate">Intermediate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setStep(3)} data-testid="button-continue-to-upload">
            Continue to Upload
          </Button>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4" data-testid="examination-step-3">
          <h3 className="text-lg font-semibold">Upload Study Materials</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Upload pages from which you want to take the test
            </p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload(e.target.files, "pages")}
              className="mt-2"
              data-testid="input-upload-pages"
            />
          </div>
          {examData.uploadedPages && examData.uploadedPages.length > 0 && (
            <p className="text-sm text-green-600" data-testid="text-uploaded-files">
              {examData.uploadedPages.length} file(s) uploaded successfully
            </p>
          )}
          <Button
            onClick={() => onStartExamination(examData as ExaminationData)}
            disabled={!examData.uploadedPages?.length}
            className="w-full"
            data-testid="button-start-examination"
          >
            Start Examination
          </Button>
        </div>
      );
    }
  };

  const renderSelfListenFlow = () => (
    <div className="space-y-4" data-testid="self-listen-flow">
      <h3 className="text-lg font-semibold">Self Listen Setup</h3>
      <div>
        <Label htmlFor="heading">Topic/Heading Name</Label>
        <Input
          id="heading"
          placeholder="e.g., Photosynthesis, World War II"
          value={selfListenData.heading || ""}
          onChange={(e) => setSelfListenData(prev => ({ ...prev, heading: e.target.value }))}
          data-testid="input-topic-heading"
        />
      </div>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Upload images related to your topic
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files, "images")}
          className="mt-2"
          data-testid="input-upload-images"
        />
      </div>
      
      {selfListenData.uploadedImages && selfListenData.uploadedImages.length > 0 && (
        <p className="text-sm text-green-600" data-testid="text-uploaded-images">
          {selfListenData.uploadedImages.length} image(s) uploaded successfully
        </p>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Voice Recording
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Click the microphone to start speaking about your topic. The AI will listen and provide feedback.
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={isRecording ? () => setIsRecording(false) : startVoiceRecording}
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            data-testid="button-voice-recording"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
          {isRecording && (
            <span className="text-sm text-red-500 animate-pulse" data-testid="text-recording-indicator">
              Recording...
            </span>
          )}
        </div>
        
        {voiceTranscript && (
          <div className="mt-3">
            <Label>Your Speech:</Label>
            <Textarea
              value={voiceTranscript}
              readOnly
              className="mt-1"
              rows={4}
              data-testid="textarea-voice-transcript"
            />
          </div>
        )}
      </div>
      
      <Button
        onClick={() => onStartSelfListen({ ...selfListenData, uploadedImages: selfListenData.uploadedImages || [] } as SelfListenData)}
        disabled={!selfListenData.heading || !selfListenData.uploadedImages?.length}
        className="w-full"
        data-testid="button-start-self-listen"
      >
        Start Self Listen Session
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#0d0d0d] opacity-100 border-zinc-800/50" data-testid="education-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Blinga Education
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {!mode && renderModeSelection()}
          {mode === "examination" && renderExaminationFlow()}
          {mode === "self-listen" && renderSelfListenFlow()}
        </div>
        
        <div className="flex justify-between mt-6">
          {mode && (
            <Button variant="outline" onClick={() => setMode(null)} data-testid="button-back-to-modes">
              Back to Modes
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} data-testid="button-close-modal">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}