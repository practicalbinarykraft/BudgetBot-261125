/**
 * Mobile Menu Button
 * 
 * Floating button in bottom right corner that opens the sidebar menu.
 */

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useTelegramSafeArea } from "@/hooks/use-telegram-safe-area";

export function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const safeArea = useTelegramSafeArea();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          marginBottom: safeArea.bottom > 0 ? `${safeArea.bottom}px` : '0',
        }}
        aria-label="Меню"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <MobileMenuSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
