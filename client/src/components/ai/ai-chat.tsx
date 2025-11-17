import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { QuickActions } from "./quick-actions";
import type { AiChatMessage } from "@shared/schema";

interface ChatResponse {
  success: boolean;
  message: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export function AIChat() {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<AiChatMessage[]>({
    queryKey: ["/api/ai/chat/history"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage,
        includeContext: true
      });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: () => {
      // Refetch chat history to show both user message and AI response
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/history"] });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    
    sendMessageMutation.mutate(trimmed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const askQuickQuestion = (question: string) => {
    setMessage(question);
    sendMessageMutation.mutate(question);
  };

  return (
    <Card data-testid="card-ai-chat">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          AI Financial Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="space-y-4 max-h-96 overflow-y-auto p-4 border rounded-md bg-muted/30"
          data-testid="container-chat-messages"
        >
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" data-testid="skeleton-chat-messages" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8" data-testid="empty-chat-messages">
              <p>No messages yet. Ask me anything about your finances!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} index={idx} />
            ))
          )}
          
          {/* Typing indicator inside messages */}
          {sendMessageMutation.isPending && <TypingIndicator />}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && !sendMessageMutation.isPending && (
          <QuickActions 
            onAskQuestion={askQuickQuestion} 
            disabled={sendMessageMutation.isPending}
          />
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder="Ask about your spending, budgets, or savings..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="resize-none"
            rows={2}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            className="self-end"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
