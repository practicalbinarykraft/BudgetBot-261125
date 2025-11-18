import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Send, Sparkles, Camera } from 'lucide-react';
import { useChatSidebar } from '@/stores/chat-sidebar-store';
import { FloatingChatButton } from './floating-button';
import { QuickActions } from './quick-actions';
import { ChatMessage } from '@/components/ai/chat-message';
import { TypingIndicator } from '@/components/ai/typing-indicator';
import { ConfirmationCard } from './confirmation-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { AiChatMessage } from '@shared/schema';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface MLSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

interface PersonalTag {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface ChatResponse {
  type: 'message' | 'tool_confirmation';
  content?: string;
  action?: string;
  params?: Record<string, any>;
  toolUseId?: string;
  mlSuggestion?: MLSuggestion | null;
  availableCategories?: Category[] | null;
  availablePersonalTags?: PersonalTag[] | null;
}

export function AIChatSidebar() {
  const { isOpen, close } = useChatSidebar();
  const [message, setMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: string;
    params: Record<string, any>;
    toolUseId: string;
    mlSuggestion?: MLSuggestion | null;
    availableCategories?: Category[] | null;
    availablePersonalTags?: PersonalTag[] | null;
  } | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

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
      });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      if (data.type === 'tool_confirmation') {
        // Show confirmation card with ML suggestion and categories
        setPendingConfirmation({
          action: data.action!,
          params: data.params!,
          toolUseId: data.toolUseId!,
          mlSuggestion: data.mlSuggestion,
          availableCategories: data.availableCategories,
          availablePersonalTags: data.availablePersonalTags,
        });
      } else if (data.type === 'message') {
        // Regular message - refresh history
        queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      }
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

  // Confirm tool execution mutation
  const confirmToolMutation = useMutation({
    mutationFn: async (finalParams: Record<string, any>) => {
      if (!pendingConfirmation) throw new Error('No pending confirmation');
      
      const response = await apiRequest('POST', '/api/ai/confirm-tool', {
        action: pendingConfirmation.action,
        params: finalParams, // Use updated params from user
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      setPendingConfirmation(null); // Only clear on success
      toast({
        title: 'Action completed',
        description: 'Your request has been executed',
      });
    },
    onError: (error: any) => {
      // Keep confirmation visible so user can retry
      toast({
        title: 'Action failed',
        description: error.message || 'Failed to execute action. You can try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCancelTool = () => {
    setPendingConfirmation(null);
    toast({
      title: 'Action cancelled',
      description: 'You cancelled the action',
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, pendingConfirmation]);

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
    // Scroll to bottom to show the inserted text
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to scan receipt');
      }

      const data = await response.json();
      
      // Display AI response in chat
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      
      toast({
        title: 'Receipt scanned!',
        description: 'AI analyzed your receipt',
      });
      
      setUploadedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: 'Scan failed',
        description: error.message || 'Failed to scan receipt',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
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
          ) : messages.length === 0 && !pendingConfirmation ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
              <h4 className="font-semibold mb-2">Start a conversation</h4>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your finances!
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage key={msg.id} message={msg} index={index} />
              ))}
              
              {pendingConfirmation && (
                <ConfirmationCard
                  action={pendingConfirmation.action}
                  params={pendingConfirmation.params}
                  mlSuggestion={pendingConfirmation.mlSuggestion}
                  availableCategories={pendingConfirmation.availableCategories}
                  availablePersonalTags={pendingConfirmation.availablePersonalTags || []}
                  onConfirm={(finalParams) => confirmToolMutation.mutate(finalParams)}
                  onCancel={handleCancelTool}
                />
              )}
            </>
          )}

          {sendMessageMutation.isPending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          {/* Image preview */}
          {uploadedImage && (
            <div className="mb-2 relative inline-block">
              <img
                src={URL.createObjectURL(uploadedImage)}
                alt="Upload preview"
                className="max-h-20 rounded border"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
                onClick={() => {
                  setUploadedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploadingImage || sendMessageMutation.isPending}
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || sendMessageMutation.isPending}
              size="icon"
              variant="ghost"
              className="shrink-0 min-h-[44px]"
              data-testid="button-upload-image"
            >
              {isUploadingImage ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </Button>
            
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask AI..."
              className="resize-none overflow-hidden"
              style={{ minHeight: '44px', maxHeight: '120px' }}
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
