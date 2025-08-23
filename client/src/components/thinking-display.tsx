import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThinkingDisplayProps {
  thinkingContent: string;
  isThinking: boolean;
  messageId: string;
}

export function ThinkingDisplay({ thinkingContent, isThinking, messageId }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (isThinking && thinkingContent) {
      // Simulate typing effect for thinking process
      let index = 0;
      const text = thinkingContent;
      const timer = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.substring(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 20); // Fast typing effect

      return () => clearInterval(timer);
    } else {
      setDisplayText(thinkingContent);
    }
  }, [thinkingContent, isThinking]);

  if (!thinkingContent && !isThinking) return null;

  return (
    <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-transparent"
        data-testid={`thinking-toggle-${messageId}`}
      >
        <div className="flex items-center space-x-2">
          <Brain className={`h-4 w-4 text-blue-600 ${isThinking ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {isThinking ? 'Thinking...' : 'Chain of Thought'}
          </span>
          {isThinking && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
        </div>
        {!isThinking && (
          isExpanded ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </Button>
      
      {(isExpanded || isThinking) && (
        <div className="px-3 pb-3 border-t border-blue-200 dark:border-blue-800/50 mt-2 pt-2">
          <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900/50 rounded p-3 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {displayText || "Analyzing the question and formulating a comprehensive response..."}
            {isThinking && <span className="animate-pulse">|</span>}
          </div>
        </div>
      )}
    </div>
  );
}