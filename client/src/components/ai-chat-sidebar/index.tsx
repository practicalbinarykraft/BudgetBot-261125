import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Send, Sparkles } from 'lucide-react';
import { useChatSidebar } from '@/stores/chat-sidebar-store';
import { FloatingChatButton } from './floating-button';
import { QuickActions } from './quick-actions';
import { ChatMessage } from '@/components/ai/chat-message';
import { TypingIndicator } from '@/components/ai/typing-indicator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { AiChatMessage } from '@shared/schema';

interface ChatResponse {
  success: boolean;
  message: string;
}

export function AIChatSidebar() {
  const { isOpen, close } = useChatSidebar();
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  
  // DEBUG: Log component mount
  useEffect(() => {
    console.log('🤖 AIChatSidebar mounted! isOpen:', isOpen);
  }, []);

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery<AiChatMessage[]>({
    queryKey: ['/api/ai/chat/history'],
    enabled: isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: userMessage,
        includeContext: true,
      });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Chat Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (question: string) => {
    setMessage(question);
    sendMessageMutation.mutate(question);
  };

  // Get current page context
  const getPageContext = () => {
    if (location === '/') return 'Dashboard';
    if (location.includes('/transactions')) return 'Transactions';
    if (location.includes('/wallets')) return 'Wallets';
    if (location.includes('/goals')) return 'Goals';
    if (location.includes('/budgets')) return 'Budgets';
    return 'Unknown';
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && <FloatingChatButton />}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={close}
          data-testid="overlay-chat-sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-[400px]
          bg-background
          shadow-2xl z-40
          transform transition-transform duration-300
          flex flex-col
          border-l border-border
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        data-testid="sidebar-ai-chat"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Currently on: {getPageContext()}
              </p>
            </div>
          </div>
          <Button
            onClick={close}
            variant="ghost"
            size="icon"
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <QuickActions onSendMessage={handleQuickAction} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
              <h4 className="font-semibold mb-2">Start a conversation</h4>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your finances!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={msg.id} message={msg} index={index} />
            ))
          )}

          {sendMessageMutation.isPending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask AI..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={sendMessageMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
              className="shrink-0 min-h-[44px]"
              data-testid="button-send-message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
