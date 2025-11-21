import { useQuery } from '@tanstack/react-query';
import { BreakdownCard } from '../breakdown-card';
import { useTranslation } from '@/i18n';

interface PersonTabProps {
  period: string;
}

export function PersonTab({ period }: PersonTabProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/by-person', period],
    queryFn: () => fetch(`/api/analytics/by-person?period=${period}`).then(r => r.json()),
  });

  return (
    <BreakdownCard
      title={t('analytics.person.title')}
      total={data?.total || 0}
      items={data?.items || []}
      isLoading={isLoading}
    />
  );
}
