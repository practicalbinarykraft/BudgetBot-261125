import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatSidebarState {
  isOpen: boolean;
  unreadCount: number;
  messages: Message[];
  isLoading: boolean;
  
  open: () => void;
  close: () => void;
  toggle: () => void;
  
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  clearMessages: () => void;
  markAsRead: () => void;
  incrementUnread: () => void;
  
  setLoading: (loading: boolean) => void;
}

export const useChatSidebar = create<ChatSidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      unreadCount: 0,
      messages: [],
      isLoading: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            },
          ],
          unreadCount: !state.isOpen && message.role === 'assistant' 
            ? state.unreadCount + 1 
            : state.unreadCount,
        })),

      clearMessages: () => set({ messages: [] }),

      markAsRead: () => set({ unreadCount: 0 }),

      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-sidebar-storage',
      partialize: (state) => ({
        messages: state.messages,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
