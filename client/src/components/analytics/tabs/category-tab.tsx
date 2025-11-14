import { useQuery } from '@tanstack/react-query';
import { BreakdownCard } from '../breakdown-card';

interface CategoryTabProps {
  period: string;
}

export function CategoryTab({ period }: CategoryTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/by-category', period],
    queryFn: () => fetch(`/api/analytics/by-category?period=${period}`).then(r => r.json()),
  });

  return (
    <BreakdownCard
      title="Spending by Category"
      total={data?.total || 0}
      items={data?.items || []}
      isLoading={isLoading}
    />
  );
}
