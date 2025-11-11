import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Wallet } from '@shared/schema';
import { Settings2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalibrationDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: open
  });
  
  const [balances, setBalances] = useState<Record<number, string>>({});
  
  const calibrateMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const actualBalance = balances[walletId];
      if (!actualBalance) return null;
      
      return await apiRequest('POST', `/api/wallets/${walletId}/calibrate`, {
        actualBalance: parseFloat(actualBalance)
      }).then(res => res.json());
    }
  });
  
  const handleCalibrateAll = async () => {
    let calibratedCount = 0;
    let transactionsCreated = 0;
    
    for (const wallet of wallets) {
      const newBalance = balances[wallet.id];
      
      if (!newBalance || newBalance === wallet.balance) {
        continue;
      }
      
      try {
        const result = await calibrateMutation.mutateAsync(wallet.id);
        
        if (result) {
          calibratedCount++;
          if (result.transactionCreated) {
            transactionsCreated++;
          }
        }
      } catch (error) {
        console.error(`Failed to calibrate wallet ${wallet.id}:`, error);
        toast({
          title: 'Error',
          description: `Failed to calibrate ${wallet.name}`,
          variant: 'destructive'
        });
      }
    }
    
    if (calibratedCount > 0) {
      toast({
        title: 'Calibration complete',
        description: `${calibratedCount} wallet(s) calibrated. ${transactionsCreated} unaccounted expense(s) created.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      onOpenChange(false);
      setBalances({});
    } else {
      toast({
        title: 'No changes',
        description: 'No wallets were modified.',
        variant: 'destructive'
      });
    }
  };
  
  const handleCancel = () => {
    onOpenChange(false);
    setBalances({});
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Calibrate Wallets
          </DialogTitle>
          <DialogDescription>
            Enter actual balances from your bank/wallet apps to sync with reality
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div className="text-center text-muted-foreground">No wallets found</div>
          ) : (
            wallets.map((wallet) => (
              <div key={wallet.id} className="space-y-2 p-4 border rounded-md">
                <Label htmlFor={`wallet-${wallet.id}`} className="font-semibold">
                  {wallet.name}
                </Label>
                <div className="text-sm text-muted-foreground">
                  Current: {wallet.balance} {wallet.currency || 'USD'}
                </div>
                <Input
                  id={`wallet-${wallet.id}`}
                  type="number"
                  step="0.01"
                  placeholder="Enter actual balance"
                  defaultValue={wallet.balance}
                  onChange={(e) => {
                    setBalances(prev => ({
                      ...prev,
                      [wallet.id]: e.target.value
                    }));
                  }}
                  data-testid={`input-calibrate-wallet-${wallet.id}`}
                />
              </div>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-calibrate-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCalibrateAll}
            disabled={calibrateMutation.isPending || wallets.length === 0}
            data-testid="button-calibrate-submit"
          >
            {calibrateMutation.isPending ? 'Calibrating...' : 'Calibrate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
