import { useQuery } from "@tanstack/react-query";

export interface AssetsHistoryPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface UseAssetsHistoryOptions {
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch historical asset values over time
 * Returns monthly data points with assets, liabilities, and net worth
 */
export function useAssetsHistory({ startDate, endDate }: UseAssetsHistoryOptions = {}) {
  return useQuery<AssetsHistoryPoint[]>({
    queryKey: ['/api/assets/history', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/assets/history${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error("Failed to fetch assets history");
      }
      
      const json = await res.json();
      return json.data || [];
    },
    // Keep data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
