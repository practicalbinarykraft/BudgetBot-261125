/**
 * TelegramLinkPrompt Component
 *
 * Dialog that prompts user to link Telegram account for faster login
 * Junior-Friendly: ~60 lines, simple and clear
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, X } from 'lucide-react';

interface TelegramLinkPromptProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Prompt dialog for linking Telegram account
 * 
 * Shows after registration/login to offer Telegram linking
 * for faster future logins
 */
export function TelegramLinkPrompt({
  open,
  onAccept,
  onDecline,
}: TelegramLinkPromptProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <DialogTitle>Синхронизировать с Telegram?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            В следующий раз вы сможете войти автоматически без ввода логина и пароля.
            Это займет всего несколько секунд.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            Позже
          </Button>
          <Button
            onClick={onAccept}
            className="w-full sm:w-auto"
          >
            Да, синхронизировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

