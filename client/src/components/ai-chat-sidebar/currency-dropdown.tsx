import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n/context';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

interface CurrencyDropdownProps {
  value: string;
  onChange: (currency: string) => void;
  availableCurrencies?: string[]; // List of currency codes configured by user
}

export function CurrencyDropdown({ value, onChange, availableCurrencies }: CurrencyDropdownProps) {
  const { t } = useTranslation();
  
  // Filter currencies to only show those configured by user (or all if not provided)
  const filteredCurrencies = availableCurrencies
    ? CURRENCIES.filter(curr => availableCurrencies.includes(curr.code))
    : CURRENCIES;
    
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground capitalize text-xs">
        {t('ai_tools.currency')}:
      </span>
      <Select 
        value={value || 'USD'} 
        onValueChange={onChange}
        data-testid="select-currency"
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={t('ai_tools.select_currency')} />
        </SelectTrigger>
        <SelectContent>
          {filteredCurrencies.map((curr) => (
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
