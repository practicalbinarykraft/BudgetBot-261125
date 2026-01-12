/**
 * Admin Support Page
 *
 * Chat with users via Telegram bot
 * Junior-Friendly: Simple chat interface
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Search } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");

  // Fetch support chats
  const { data: chatsData, isLoading: isLoadingChats } = useQuery({
    queryKey: adminQueryKeys.supportChats(),
    queryFn: () => adminApi.getSupportChats(),
  });

  const chats = chatsData?.chats || chatsData || [];

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: adminQueryKeys.supportChatMessages(selectedChatId || 0, 100),
    queryFn: () => adminApi.getChatMessages(selectedChatId!, 100),
    enabled: !!selectedChatId,
  });

  const messages = messagesData?.messages || messagesData || [];
  const selectedChat = selectedChatId ? chats.find((c: any) => c.id === selectedChatId) : null;

  const filteredChats = chats.filter((chat: any) => {
    const userName = chat.userName || chat.user?.name || '';
    const subject = chat.subject || chat.title || '';
    const searchLower = searchQuery.toLowerCase();
    return userName.toLowerCase().includes(searchLower) || subject.toLowerCase().includes(searchLower);
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { chatId: number; message: string }) =>
      adminApi.sendSupportMessage(data.chatId, data.message),
    onSuccess: () => {
      setMessageText("");
      // Refetch messages
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChatMessages(selectedChatId, 100) });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChats() });
      }
      toast({
        title: t('admin.support.message_sent'),
        description: t('admin.support.message_sent_description'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.support.error'),
        description: error?.message || t('admin.support.message_send_failed'),
        variant: 'destructive',
      });
    },
  });

  // Update chat status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { chatId: number; status: 'open' | 'closed' | 'pending' | 'resolved' }) =>
      adminApi.updateSupportChat(data.chatId, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChats() });
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChatMessages(selectedChatId, 100) });
      }
      toast({
        title: t('admin.support.status_updated'),
        description: t('admin.support.status_updated_description'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.support.error'),
        description: error?.message || t('admin.support.status_update_failed'),
        variant: 'destructive',
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => adminApi.markChatAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChats() });
      if (selectedChatId) {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportChatMessages(selectedChatId, 100) });
      }
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChatId) return;
    sendMessageMutation.mutate({ chatId: selectedChatId, message: messageText });
  };

  const handleStatusChange = (newStatus: 'open' | 'closed' | 'pending' | 'resolved') => {
    if (!selectedChatId) return;
    updateStatusMutation.mutate({ chatId: selectedChatId, status: newStatus });
  };

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
    // Mark as read when selecting
    markAsReadMutation.mutate(chatId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': 
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-600">{t('admin.support.status.open')}</Badge>;
      case 'pending':
      case 'waiting':
        return <Badge variant="secondary">{t('admin.support.status.waiting')}</Badge>;
      case 'resolved':
      case 'closed':
        return <Badge variant="outline">{t('admin.support.status.closed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Chat List */}
        <div className="w-96 flex flex-col border rounded-lg bg-white">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('admin.support.search_chats')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingChats ? (
              <div className="p-4 text-center text-gray-500">{t('admin.support.loading_chats')}</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">{t('admin.support.no_chats')}</div>
            ) : (
              filteredChats.map((chat: any) => {
                const userName = chat.userName || chat.user?.name || t('admin.support.unknown');
                const userEmail = chat.userEmail || chat.user?.email || '';
                const subject = chat.subject || chat.title || 'No subject';
                const lastMessage = chat.lastMessage || { text: '', timestamp: chat.lastMessageAt || chat.createdAt };
                const unreadCount = chat.unreadCount || chat.unreadMessagesCount || 0;
                const priority = chat.priority || 'normal';
                const status = chat.status || 'open';

                return (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={cn(
                      "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedChatId === chat.id && "bg-indigo-50 border-indigo-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{userName}</div>
                        {userEmail && <div className="text-xs text-gray-500">{userEmail}</div>}
                      </div>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="bg-indigo-600">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium mb-1 truncate">{subject}</div>
                    {lastMessage?.text && (
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">{lastMessage.text}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(status)}
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(priority))}>
                        {t(`admin.support.priority.${priority}`) || priority}
                      </Badge>
                    </div>
                    {lastMessage?.timestamp && (
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(lastMessage.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col border rounded-lg bg-white">
          {selectedChat ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedChat.userName || selectedChat.user?.name || t('admin.support.unknown')}</h2>
                    {selectedChat.userEmail || selectedChat.user?.email ? (
                      <div className="text-sm text-gray-500">{selectedChat.userEmail || selectedChat.user?.email}</div>
                    ) : null}
                    {selectedChat.userTelegram && (
                      <div className="text-xs text-gray-400">
                        Telegram: @{selectedChat.userTelegram.username || selectedChat.userTelegram}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedChat.status || 'open')}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newStatus = selectedChat.status === 'open' ? 'closed' : 'open';
                        handleStatusChange(newStatus as 'open' | 'closed' | 'pending' | 'resolved');
                      }}
                      disabled={updateStatusMutation.isPending}
                    >
                      {selectedChat.status === 'open' || !selectedChat.status ? t('admin.support.close_chat') : t('admin.support.reopen_chat')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="text-center text-gray-500">{t('admin.support.loading_messages')}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">{t('admin.support.no_messages')}</div>
                ) : (
                  messages.map((message: any) => {
                    const isAdmin = message.from === 'admin' || message.senderType === 'admin';
                    const fromName = message.fromName || message.senderName || (isAdmin ? 'Admin' : 'User');
                    const text = message.text || message.message || '';
                    const timestamp = message.timestamp || message.createdAt;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isAdmin ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            isAdmin
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <div className="text-xs font-medium mb-1 opacity-75">
                            {fromName}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{text}</div>
                          {timestamp && (
                            <div className="text-xs opacity-75 mt-1">
                              {new Date(timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('admin.support.type_message')}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('admin.support.select_chat')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

