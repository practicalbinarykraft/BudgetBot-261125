/**
 * Notifications Bell Component
 * 
 * Displays a bell icon with unread notifications count
 * Opens notifications list popover on click
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsList } from "./notifications-list";
import { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";

interface NotificationsBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsBell({ onNotificationClick }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch unread count: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Refetch notifications when popover opens
    if (newOpen) {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white",
                unreadCount > 9 && "px-1 text-[10px]"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <NotificationsList 
          onClose={() => setOpen(false)} 
          onOpenTransactionDialog={onNotificationClick}
        />
      </PopoverContent>
    </Popover>
  );
}
