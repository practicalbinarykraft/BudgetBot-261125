/**
 * Notifications List Component
 * 
 * Displays list of notifications with actions and filters
 */

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { Bell, X, Check, Trash2, Loader2, Calendar, Filter, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { ScrollArea } from "@/components/ui/scroll-area"; // TODO: Add scroll-area component
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/i18n";
import { useState, useMemo } from "react";

interface NotificationsListProps {
  onClose?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onOpenTransactionDialog?: (notification: Notification) => void;
}

type NotificationFilterType = "all" | "missed" | "today" | "upcoming" | "recurring";

export function NotificationsList({ onClose, onNotificationClick, onOpenTransactionDialog }: NotificationsListProps) {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<NotificationFilterType>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showRead, setShowRead] = useState<boolean>(false); // Показывать прочитанные уведомления
  const [startDate, setStartDate] = useState<string>(() => {
    // По умолчанию: сегодня
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // По умолчанию: месяц вперед от сегодня
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  });

  // Fetch notifications
  // Используем refetchStatus: 'idle' чтобы не показывать глобальный loading при первом рендере
  const { data: allNotifications = [], isLoading: isInitialLoading, refetch } = useQuery<Notification[]>({
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
    refetchOnWindowFocus: false,
  });

  // Обработчик для применения фильтров
  const handleApplyFilters = async (e?: React.MouseEvent) => {
    // Предотвращаем всплытие события, чтобы не закрывалось окно
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Устанавливаем локальное состояние загрузки только для списка
    setIsRefreshing(true);
    try {
      // Используем refetch для обновления данных
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // isLoading только при первой загрузке, не при обновлении
  const isLoading = isInitialLoading && allNotifications.length === 0;

  // Filter notifications based on selected filters
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    return allNotifications.filter((notification) => {
      // Get transaction date from notification
      const transactionData = notification.transactionData as any;
      const transactionDate = transactionData?.date;
      
      // If no transaction date, include only if filter is "all"
      if (!transactionDate) {
        return filterType === "all";
      }

      const transDate = new Date(transactionDate);
      transDate.setHours(0, 0, 0, 0);
      const transDateStr = transDate.toISOString().split('T')[0];

      // Filter by read status (hide read/completed/dismissed if showRead is false)
      if (!showRead && (notification.status === "read" || notification.status === "completed" || notification.status === "dismissed")) {
        return false;
      }

      // Filter by type
      if (filterType === "all") {
        // For "all" filter, apply date range filter
        if (transDate < startDateObj || transDate > endDateObj) return false;
        return true;
      }
      
      if (filterType === "missed") {
        // Пропущенные: дата транзакции в прошлом и статус не completed/dismissed
        // Не применяем фильтр по дате, так как "missed" сам определяет диапазон (все прошлое)
        return transDate < today && 
               notification.status !== "completed" && 
               notification.status !== "dismissed";
      }
      
      if (filterType === "today") {
        // Сегодня: дата транзакции равна сегодня
        // Не применяем фильтр по дате, так как "today" сам определяет диапазон (только сегодня)
        return transDateStr === todayStr;
      }
      
      if (filterType === "upcoming") {
        // Предстоящие: дата транзакции в будущем
        // Не применяем фильтр по дате, так как "upcoming" сам определяет диапазон (все будущее)
        return transDate > today;
      }

      if (filterType === "recurring") {
        // Повторяющиеся: проверяем наличие recurringId в transactionData
        const transactionData = notification.transactionData as any;
        return !!transactionData?.recurringId;
      }

      return true;
    });
  }, [allNotifications, filterType, startDate, endDate, showRead]);

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

  const handleComplete = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      console.log("[NotificationsList] Completing notification:", notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      
      console.log("[NotificationsList] Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to complete notification" }));
        console.error("[NotificationsList] Error response:", errorData);
        throw new Error(errorData.error || errorData.details || "Failed to complete notification");
      }
      
      const result = await response.json();
      console.log("[NotificationsList] Notification completed successfully:", result);
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      // Also invalidate transactions to refresh the list (including dashboard and transactions page)
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      // Also invalidate stats to refresh dashboard totals
      queryClient.invalidateQueries({ queryKey: ["/api/stats"], exact: false });
      
      console.log("[NotificationsList] Queries invalidated, transactions should refresh");
    } catch (error) {
      console.error("[NotificationsList] Error completing notification:", error);
      alert(error instanceof Error ? error.message : "Ошибка при создании транзакции. Проверьте консоль браузера.");
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
    console.log('[NotificationsList] handleNotificationClick called', {
      notificationId: notification.id,
      hasOnOpenTransactionDialog: !!onOpenTransactionDialog,
      hasOnNotificationClick: !!onNotificationClick,
      transactionData: notification.transactionData,
    });

    // Mark as read if unread
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }

    // Open transaction dialog with notification data
    if (onOpenTransactionDialog) {
      console.log('[NotificationsList] Calling onOpenTransactionDialog');
      onOpenTransactionDialog(notification);
      // Close popover after opening dialog (with small delay to ensure dialog opens first)
      if (onClose) {
        setTimeout(() => {
          console.log('[NotificationsList] Calling onClose');
          onClose();
        }, 100);
      }
    } else if (onNotificationClick) {
      // Fallback to generic callback
      console.log('[NotificationsList] Calling onNotificationClick (fallback)');
      onNotificationClick(notification);
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 100);
      }
    } else {
      console.warn('[NotificationsList] No callback provided for notification click');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center" role="status" aria-label="Loading notifications">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {language === "ru" ? "Уведомления" : "Notifications"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowRead(!showRead)}
            title={showRead 
              ? (language === "ru" ? "Скрыть прочитанные" : "Hide read") 
              : (language === "ru" ? "Показать прочитанные" : "Show read")
            }
          >
            {showRead ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowFilters(!showFilters)}
            title={language === "ru" ? "Фильтры" : "Filters"}
          >
            <Filter className={cn("h-4 w-4", showFilters && "text-primary")} />
          </Button>
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
      </div>

      {/* Filters - показываются только при showFilters === true */}
      {showFilters && (
        <div className="p-3 pl-4 border-b space-y-2 bg-muted/30 animate-in slide-in-from-top-2">
          {/* Date range filters - в одну строку */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <label className="text-xs text-muted-foreground whitespace-nowrap">
              {language === "ru" ? "С:" : "From:"}
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs flex-1 min-w-0"
              title={language === "ru" ? "Дата начала" : "Start date"}
            />
            <label className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {language === "ru" ? "До:" : "To:"}
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs flex-1 min-w-0"
              title={language === "ru" ? "Дата окончания" : "End date"}
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={filterType} onValueChange={(value) => setFilterType(value as NotificationFilterType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "ru" ? "Все" : "All"}
                </SelectItem>
                <SelectItem value="missed">
                  {language === "ru" ? "Пропущенные" : "Missed"}
                </SelectItem>
                <SelectItem value="today">
                  {language === "ru" ? "Сегодня" : "Today"}
                </SelectItem>
              <SelectItem value="upcoming">
                {language === "ru" ? "Предстоящие" : "Upcoming"}
              </SelectItem>
              <SelectItem value="recurring">
                {language === "ru" ? "Повторяющиеся" : "Recurring"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

          {/* Кнопка "Применить фильтры" */}
          <div className="flex justify-end pt-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleApplyFilters(e);
              }}
              disabled={isRefreshing}
              size="sm"
              className="h-7 text-xs"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {language === "ru" ? "Загрузка..." : "Loading..."}
                </>
              ) : (
                language === "ru" ? "Применить фильтры" : "Apply filters"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {isRefreshing ? (
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {language === "ru" ? "Обновление..." : "Refreshing..."}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {language === "ru" ? "Нет уведомлений" : "No notifications"}
          </p>
          {filterType !== "all" && (
            <p className="text-xs text-muted-foreground mt-1">
              {language === "ru" 
                ? "Попробуйте изменить фильтры" 
                : "Try changing filters"}
            </p>
          )}
        </div>
      ) : (
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
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }}
                        disabled={isProcessing}
                        title={language === "ru" ? "Одобрить и создать транзакцию" : "Approve and create transaction"}
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
      )}
    </div>
  );
}
