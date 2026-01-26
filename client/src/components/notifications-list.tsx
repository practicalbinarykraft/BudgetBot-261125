/**
 * Notifications List Component
 * 
 * Displays list of notifications with actions
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { Bell, X, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area"; // TODO: Add scroll-area component
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/i18n";
import { useState } from "react";

interface NotificationsListProps {
  onClose?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onOpenTransactionDialog?: (notification: Notification) => void;
}

export function NotificationsList({ onClose, onNotificationClick, onOpenTransactionDialog }: NotificationsListProps) {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status}`);
      }
      return res.json();
    },
  });

  const handleMarkAsRead = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleDismiss = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: "PATCH",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleDelete = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }
    
    // Open transaction dialog with notification data
    if (onOpenTransactionDialog) {
      onOpenTransactionDialog(notification);
      if (onClose) {
        onClose();
      }
    } else if (onNotificationClick) {
      // Fallback to generic callback
      onNotificationClick(notification);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          {language === "ru" ? "Нет уведомлений" : "No notifications"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {language === "ru" ? "Уведомления" : "Notifications"}
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        <div className="divide-y">
          {notifications.map((notification) => {
            const isProcessing = processingIds.has(notification.id);
            const isUnread = notification.status === "unread";
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                  isUnread && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "d MMMM yyyy, HH:mm", {
                        locale: language === "ru" ? ru : undefined,
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={isProcessing}
                        title={language === "ru" ? "Отметить как прочитанное" : "Mark as read"}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                      disabled={isProcessing}
                      title={language === "ru" ? "Отклонить" : "Dismiss"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      disabled={isProcessing}
                      title={language === "ru" ? "Удалить" : "Delete"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
