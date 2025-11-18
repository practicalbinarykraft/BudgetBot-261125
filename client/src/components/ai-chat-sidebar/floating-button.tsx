import { MessageCircle } from 'lucide-react';
import { useChatSidebar } from '@/stores/chat-sidebar-store';
import { Button } from '@/components/ui/button';

export function FloatingChatButton() {
  const { open, unreadCount, markAsRead } = useChatSidebar();

  // DEBUG: Log component mount
  console.log('🔵 FloatingChatButton rendered! unreadCount:', unreadCount);

  const handleClick = () => {
    console.log('🔵 FloatingChatButton clicked!');
    open();
    markAsRead();
  };

  return (
    <Button
      onClick={handleClick}
      data-testid="button-ai-chat-floating"
      className="
        fixed bottom-6 right-6 z-50
        w-16 h-16 rounded-full
        bg-gradient-to-r from-blue-500 to-purple-600
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        text-white transition-all
        hover:scale-110
        p-0
      "
      size="icon"
    >
      <MessageCircle className="w-6 h-6" />
      
      {unreadCount > 0 && (
        <span
          data-testid="badge-unread-count"
          className="
            absolute -top-1 -right-1 
            min-w-[20px] h-5 px-1
            bg-red-500 rounded-full
            flex items-center justify-center
            text-xs font-bold
            animate-pulse
          "
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
