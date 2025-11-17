import { Bot, User } from "lucide-react";
import { markdownToHtml } from "@/lib/markdown-renderer";
import type { AiChatMessage } from "@shared/schema";

interface ChatMessageProps {
  message: AiChatMessage;
  index: number;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.role}-${index}`}
    >
      {message.role === "assistant" && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-card border"
        }`}
        data-testid={`message-content-${index}`}
      >
        <div 
          className="text-sm prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
        />
      </div>
      {message.role === "user" && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
