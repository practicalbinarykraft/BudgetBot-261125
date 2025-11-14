import { useQuery } from '@tanstack/react-query';
import { BreakdownCard } from '../breakdown-card';

interface PersonTabProps {
  period: string;
}

export function PersonTab({ period }: PersonTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/by-person', period],
    queryFn: () => fetch(`/api/analytics/by-person?period=${period}`).then(r => r.json()),
  });

  return (
    <BreakdownCard
      title="Spending by Person"
      total={data?.total || 0}
      items={data?.items || []}
      isLoading={isLoading}
    />
  );
}
