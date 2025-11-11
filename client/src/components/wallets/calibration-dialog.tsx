import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Wallet } from '@shared/schema';
import { Settings2, CreditCard, Coins, Bitcoin, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const walletIcons = {
  card: CreditCard,
  cash: Coins,
  crypto: Bitcoin,
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  RUB: '₽',
  IDR: 'Rp'
};

export function CalibrationDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: open
  });
  
  const [balances, setBalances] = useState<Record<number, string>>({});
  
  // Calculate differences and warnings for each wallet
  const walletPreview = useMemo(() => {
    return wallets.map(wallet => {
      const inputValue = balances[wallet.id];
      const actualBalance = inputValue ? parseFloat(inputValue) : parseFloat(wallet.balance);
      const currentBalance = parseFloat(wallet.balance);
      const difference = actualBalance - currentBalance;
      const percentChange = currentBalance !== 0 ? Math.abs(difference / currentBalance) * 100 : 0;
      
      let status: 'same' | 'warning' | 'critical' = 'same';
      if (Math.abs(difference) > 0.01) {
        status = percentChange > 10 ? 'critical' : percentChange > 5 ? 'warning' : 'same';
      }
      
      const willCreateTransaction = difference < -0.01;
      
      return {
        wallet,
        actualBalance,
        currentBalance,
        difference,
        percentChange,
        status,
        willCreateTransaction,
        hasChanged: inputValue !== undefined && Math.abs(difference) > 0.01
      };
    });
  }, [wallets, balances]);
  
  // Calculate totals
  const summary = useMemo(() => {
    const changedWallets = walletPreview.filter(w => w.hasChanged);
    const transactionsCount = walletPreview.filter(w => w.willCreateTransaction && w.hasChanged).length;
    const totalDifferenceUSD = walletPreview
      .filter(w => w.hasChanged)
      .reduce((sum, w) => {
        const usdDiff = w.wallet.currency === 'USD' 
          ? w.difference 
          : w.wallet.balanceUsd 
            ? (w.difference / parseFloat(w.wallet.balance)) * parseFloat(w.wallet.balanceUsd)
            : w.difference;
        return sum + usdDiff;
      }, 0);
    
    return {
      changedWallets: changedWallets.length,
      transactionsCount,
      totalDifferenceUSD
    };
  }, [walletPreview]);
  
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
    
    for (const preview of walletPreview) {
      if (!preview.hasChanged) continue;
      
      try {
        const result = await calibrateMutation.mutateAsync(preview.wallet.id);
        
        if (result) {
          calibratedCount++;
          if (result.transactionCreated) {
            transactionsCreated++;
          }
        }
      } catch (error) {
        console.error(`Failed to calibrate wallet ${preview.wallet.id}:`, error);
        toast({
          title: 'Error',
          description: `Failed to calibrate ${preview.wallet.name}`,
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Wallet Calibration
          </DialogTitle>
          <DialogDescription>
            Update wallet balances to match your real bank/wallet apps
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No wallets found</div>
          ) : (
            walletPreview.map((preview) => {
              const Icon = walletIcons[preview.wallet.type as keyof typeof walletIcons] || CreditCard;
              const symbol = currencySymbols[preview.wallet.currency || 'USD'] || '$';
              const showWarning = preview.hasChanged && preview.status !== 'same';
              
              return (
                <Card key={preview.wallet.id} className="p-4 space-y-3" data-testid={`calibration-wallet-${preview.wallet.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-semibold text-base">{preview.wallet.name}</Label>
                      {preview.wallet.currency && (
                        <Badge variant="outline" className="text-xs">{preview.wallet.currency}</Badge>
                      )}
                    </div>
                    
                    {!preview.hasChanged ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Matches
                      </Badge>
                    ) : preview.status === 'critical' ? (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {preview.percentChange.toFixed(1)}%
                      </Badge>
                    ) : preview.status === 'warning' ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {preview.percentChange.toFixed(1)}%
                      </Badge>
                    ) : null}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Current Balance</Label>
                      <div className="mt-1 font-mono text-sm font-semibold">
                        {symbol}{preview.currentBalance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`wallet-${preview.wallet.id}`} className="text-xs text-muted-foreground">
                        Actual Balance
                      </Label>
                      <Input
                        id={`wallet-${preview.wallet.id}`}
                        type="number"
                        step="0.01"
                        placeholder={preview.currentBalance.toFixed(2)}
                        value={balances[preview.wallet.id] || ''}
                        onChange={(e) => {
                          setBalances(prev => ({
                            ...prev,
                            [preview.wallet.id]: e.target.value
                          }));
                        }}
                        className="mt-1 h-8 font-mono"
                        data-testid={`input-calibrate-wallet-${preview.wallet.id}`}
                      />
                    </div>
                  </div>
                  
                  {preview.hasChanged && (
                    <div className={`text-sm p-2 rounded-md ${
                      preview.status === 'critical' 
                        ? 'bg-destructive/10 text-destructive' 
                        : preview.status === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-500'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Difference: {symbol}{Math.abs(preview.difference).toFixed(2)} ({preview.difference < 0 ? '-' : '+'}{preview.percentChange.toFixed(1)}%)
                        </span>
                        {preview.willCreateTransaction && (
                          <Badge variant="outline" className="text-xs">
                            📝 Expense will be created
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
        
        {wallets.length > 0 && summary.changedWallets > 0 && (
          <>
            <Separator />
            <Card className="bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total impact on net worth:</span>
                <span className={`font-mono font-bold ${summary.totalDifferenceUSD < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {summary.totalDifferenceUSD < 0 ? '-' : '+'}${Math.abs(summary.totalDifferenceUSD).toFixed(2)}
                </span>
              </div>
              {summary.transactionsCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unaccounted expenses to create:</span>
                  <Badge variant="outline">{summary.transactionsCount}</Badge>
                </div>
              )}
            </Card>
          </>
        )}
        
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
            disabled={calibrateMutation.isPending || summary.changedWallets === 0}
            data-testid="button-calibrate-submit"
          >
            {calibrateMutation.isPending 
              ? 'Calibrating...' 
              : summary.changedWallets > 0 
                ? `Calibrate (${summary.changedWallets})`
                : 'Calibrate'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
