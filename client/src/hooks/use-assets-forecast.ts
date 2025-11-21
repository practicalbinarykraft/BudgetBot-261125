import { useQuery } from '@tanstack/react-query';

interface AssetsForecast {
  current: number;
  projected: number;
  breakdown: {
    wallets: number;
    assets: number;
    liabilities: number;
  };
}

interface UseAssetsForecastParams {
  months?: number;
}

/**
 * Hook для получения прогноза общего капитала
 * Учитывает appreciation/depreciation активов и амортизацию пассивов
 */
export function useAssetsForecast({ months = 12 }: UseAssetsForecastParams = {}) {
  return useQuery<AssetsForecast | null>({
    queryKey: ['/api/assets/forecast', months],
    queryFn: async () => {
      const res = await fetch(`/api/assets/forecast?months=${months}`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) return null;
        throw new Error('Failed to fetch assets forecast');
      }
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 1,
  });
}
