interface TrendDataPoint {
  date: string;
  isToday?: boolean;
  isForecast?: boolean;
  [key: string]: any;
}

export interface ProcessedChartData {
  todayDate: string | null;
  historicalData: TrendDataPoint[];
  forecastData: TrendDataPoint[];
  forecastWithConnection: TrendDataPoint[];
}

export function processChartData(trendData: TrendDataPoint[]): ProcessedChartData {
  const todayIndex = trendData.findIndex(d => d.isToday);
  const todayDate = todayIndex !== -1 ? trendData[todayIndex].date : null;

  const historicalData = trendData.filter(d => !d.isForecast);
  const forecastData = trendData.filter(d => d.isForecast);

  const lastHistorical = historicalData[historicalData.length - 1];
  const forecastWithConnection = lastHistorical 
    ? [lastHistorical, ...forecastData]
    : forecastData;

  return {
    todayDate,
    historicalData,
    forecastData,
    forecastWithConnection,
  };
}
