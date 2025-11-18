import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CURRENCIES = [
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

interface CurrencyDropdownProps {
  value: string;
  onChange: (currency: string) => void;
}

export function CurrencyDropdown({ value, onChange }: CurrencyDropdownProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground capitalize text-xs">
        Currency:
      </span>
      <Select 
        value={value || 'USD'} 
        onValueChange={onChange}
        data-testid="select-currency"
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((curr) => (
            <SelectItem 
              key={curr.code} 
              value={curr.code}
              data-testid={`option-currency-${curr.code}`}
            >
              {curr.symbol} {curr.code} - {curr.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
