import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BreakdownItem {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  amount: number;
  percentage: number;
  type?: string;
}

interface BreakdownCardProps {
  title: string;
  total: number;
  items: BreakdownItem[];
  isLoading?: boolean;
}

export function BreakdownCard({ title, total, items, isLoading }: BreakdownCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-2xl font-mono" data-testid="text-total-amount">
            ${total.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => {
          const IconComponent = item.icon && Icons[item.icon as keyof typeof Icons] 
            ? (Icons[item.icon as keyof typeof Icons] as any)
            : Icons.Tag;

          return (
            <div key={item.id || item.name || index} className="space-y-2" data-testid={`breakdown-item-${index}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent 
                    className="h-5 w-5" 
                    style={{ color: item.color || '#3b82f6' }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">${item.amount.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2"
                style={{ 
                  '--progress-background': item.color || '#3b82f6' 
                } as React.CSSProperties}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
