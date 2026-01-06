/**
 * Floating Add Transaction Button
 *
 * Плавающая кнопка для быстрого добавления транзакций
 * Показывается на всех устройствах в левом нижнем углу
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';

export function FloatingAddButton() {
  const [showDialog, setShowDialog] = useState(false);

  console.log('➕ FloatingAddButton rendered!');

  const handleClick = () => {
    console.log('➕ FloatingAddButton clicked!');
    setShowDialog(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        data-testid="button-add-transaction-floating"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
        }}
        className="
          w-16 h-16 rounded-full
          bg-gradient-to-r from-green-500 to-emerald-600
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          text-white transition-all
          hover:scale-110
          p-0
        "
        size="icon"
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </Button>

      <AddTransactionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
