import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Edit, Trash2, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { AssetWithCategory, AssetValuation } from '@/lib/types/assets';

export default function AssetDetailPage() {
  const [, params] = useRoute('/app/assets/:id');
  const assetId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCalibration, setShowCalibration] = useState(false);
  
  // Получить актив
  const { data, isLoading } = useQuery<{
    asset: AssetWithCategory;
    valuations: AssetValuation[];
    change: {
      changeAmount: number;
      changePercent: number;
      ownershipYears: number;
    } | null;
  }>({
    queryKey: ['/api/assets', assetId],
    enabled: !!assetId
  });
  
  const asset = data?.asset;
  const valuations = data?.valuations || [];
  const change = data?.change;
  
  // Удалить актив
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/assets/${assetId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
      toast({
        title: "Asset deleted",
        description: "The asset has been successfully removed.",
      });
      window.location.href = '/app/assets';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">Asset not found</p>
        <div className="text-center">
          <Link href="/app/assets">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const currentValue = parseFloat(asset.currentValue);
  const isPositive = (change?.changePercent || 0) >= 0;
  const monthlyCashflow = parseFloat(asset.monthlyIncome || '0') - parseFloat(asset.monthlyExpense || '0');
  
  // Подготовить данные для графика
  const chartData = valuations.map(v => ({
    date: v.valuationDate,
    value: parseFloat(v.value)
  })).reverse();
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteMutation.mutate();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Навигация */}
      <Link href="/app/assets">
        <Button variant="outline" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assets
        </Button>
      </Link>
      
      {/* Изображение */}
      {asset.imageUrl && (
        <div className="rounded-lg overflow-hidden">
          <img 
            src={asset.imageUrl} 
            alt={asset.name} 
            className="w-full h-64 object-cover"
            data-testid="img-asset"
          />
        </div>
      )}
      
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-sm font-medium flex items-center gap-1 ${
              asset.type === 'asset' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {asset.type === 'asset' ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  <span>Asset</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" />
                  <span>Liability</span>
                </>
              )}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1" data-testid="text-asset-name">
            {asset.name}
          </h1>
          {asset.location && (
            <p className="text-muted-foreground">{asset.location}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" data-testid="button-edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Текущая стоимость */}
      <Card>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Current Value</p>
          <p className="text-4xl font-bold mb-4" data-testid="text-current-value">
            ${currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          
          {change && change.changePercent !== 0 && (
            <div 
              className={`flex items-center gap-2 mb-4 ${
                isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="text-price-change"
            >
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-semibold">
                {isPositive ? '+' : ''}{change.changePercent.toFixed(1)}% 
                ({isPositive ? '+' : ''}${change.changeAmount.toFixed(0)})
              </span>
              {change.ownershipYears > 0 && (
                <span className="text-muted-foreground">
                  over {change.ownershipYears} year{change.ownershipYears !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCalibration(true)}
              data-testid="button-calibrate"
            >
              <Settings className="w-4 h-4 mr-2" />
              Calibrate Price
            </Button>
            <Button
              variant="outline"
              disabled
              title="Coming soon"
            >
              Find Current Price
            </Button>
          </div>
        </div>
      </Card>
      
      {/* График */}
      {chartData.length > 1 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Price History</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isPositive ? '#10b981' : '#ef4444'} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      
      {/* Cashflow */}
      {(parseFloat(asset.monthlyIncome || '0') > 0 || parseFloat(asset.monthlyExpense || '0') > 0) && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
            
            <div className="space-y-3">
              {parseFloat(asset.monthlyIncome || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +${parseFloat(asset.monthlyIncome).toFixed(0)}
                  </span>
                </div>
              )}
              
              {parseFloat(asset.monthlyExpense || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Expense:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -${parseFloat(asset.monthlyExpense).toFixed(0)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Net Cashflow:</span>
                <span 
                  className={`font-bold text-lg ${
                    monthlyCashflow >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  data-testid="text-net-cashflow"
                >
                  {monthlyCashflow >= 0 ? '+' : ''}${monthlyCashflow.toFixed(0)}/mo
                </span>
              </div>
              
              {change && change.ownershipYears > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                  <span>Total cashflow received:</span>
                  <span>
                    ${(monthlyCashflow * 12 * change.ownershipYears).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      
      {/* Заметки */}
      {asset.notes && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
          </div>
        </Card>
      )}
      
      {/* Модалка калибровки */}
      <CalibrationModal
        open={showCalibration}
        onOpenChange={setShowCalibration}
        asset={asset}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/assets', assetId] });
          queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
          setShowCalibration(false);
        }}
      />
    </div>
  );
}

// Модалка калибровки
interface CalibrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetWithCategory;
  onSuccess: () => void;
}

function CalibrationModal({ open, onOpenChange, asset, onSuccess }: CalibrationModalProps) {
  const [newValue, setNewValue] = useState(asset.currentValue);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  
  const calibrateMutation = useMutation({
    mutationFn: async (data: { newValue: string; notes: string; source: string }) => {
      const res = await fetch(`/api/assets/${asset.id}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to calibrate');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price calibrated",
        description: "Asset value has been updated successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calibrate price",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calibrateMutation.mutate({ 
      newValue, 
      notes, 
      source: 'manual' 
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calibrate Price</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-value">New Price (USD)</Label>
            <Input
              id="new-value"
              type="number"
              step="0.01"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              data-testid="input-new-value"
            />
          </div>
          
          <div>
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Real estate website, appraiser..."
              data-testid="input-source"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={calibrateMutation.isPending}
              className="flex-1"
              data-testid="button-submit"
            >
              {calibrateMutation.isPending ? 'Saving...' : 'Calibrate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
