import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n/context';
import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { getCurrencySymbol } from '@/lib/currency-utils';

interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string;
  purchaseDate: string;
}

interface PriceHistoryChartProps {
  data: PriceHistoryEntry[];
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const { t, language } = useTranslation();
  const locale = language === 'ru' ? ru : enUS;

  const { data: settings } = useQuery<{ currency?: string }>({
    queryKey: ['/api/settings'],
  });

  const currency = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const chartData = data
    .map(item => ({
      date: item.purchaseDate,
      price: parseFloat(item.price),
      store: item.storeName,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('productDetail.priceHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                try {
                  return format(parseISO(date), 'dd MMM', { locale });
                } catch {
                  return date;
                }
              }}
            />
            <YAxis
              tickFormatter={(value) => `${currencySymbol}${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, t('productDetail.price')]}
              labelFormatter={(date) => {
                try {
                  return format(parseISO(date as string), 'dd MMMM yyyy', { locale });
                } catch {
                  return date;
                }
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
