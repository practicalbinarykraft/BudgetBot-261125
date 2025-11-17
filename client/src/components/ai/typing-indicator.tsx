import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start" data-testid="typing-indicator">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="bg-card border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span 
              className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
              style={{ animationDelay: "0ms" }}
            />
            <span 
              className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
              style={{ animationDelay: "150ms" }}
            />
            <span 
              className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
