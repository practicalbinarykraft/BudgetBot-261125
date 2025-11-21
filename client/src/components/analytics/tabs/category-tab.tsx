import { useQuery } from '@tanstack/react-query';
import { BreakdownCard } from '../breakdown-card';
import { useTranslation } from '@/i18n';

interface CategoryTabProps {
  period: string;
}

export function CategoryTab({ period }: CategoryTabProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/by-category', period],
    queryFn: () => fetch(`/api/analytics/by-category?period=${period}`).then(r => r.json()),
  });

  return (
    <BreakdownCard
      title={t('analytics.category.title')}
      total={data?.total || 0}
      items={data?.items || []}
      isLoading={isLoading}
    />
  );
}
