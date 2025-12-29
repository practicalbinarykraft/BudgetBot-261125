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

/**
 * Уменьшить количество точек данных для мобильных устройств
 * Сохраняет первую, последнюю, сегодняшнюю и равномерно распределенные точки
 * 
 * Для джуна: Эта функция нужна потому что на маленьких экранах (360px)
 * нельзя показать 365 точек данных - они будут перекрываться.
 * Мы оставляем только ключевые точки (начало, конец, сегодня, и несколько промежуточных).
 */
function sampleDataForMobile(data: TrendDataPoint[], maxPoints: number = 25): TrendDataPoint[] {
  if (data.length <= maxPoints) return data;

  const todayIndex = data.findIndex(d => d.isToday);
  const sampled: TrendDataPoint[] = [];
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const seenDates = new Set<string>();

  // Всегда включаем первую точку
  sampled.push(data[0]);
  seenDates.add(data[0].date);

  // Включаем точку "сегодня" если она есть
  if (todayIndex > 0 && todayIndex < data.length - 1) {
    if (!seenDates.has(data[todayIndex].date)) {
      sampled.push(data[todayIndex]);
      seenDates.add(data[todayIndex].date);
    }
  }

  // Равномерная выборка остальных точек
  for (let i = step; i < data.length - 1; i += step) {
    if (!seenDates.has(data[i].date)) {
      sampled.push(data[i]);
      seenDates.add(data[i].date);
    }
  }

  // Всегда включаем последнюю точку
  const lastPoint = data[data.length - 1];
  if (!seenDates.has(lastPoint.date)) {
    sampled.push(lastPoint);
  }

  // Сортируем по дате (важно для правильного отображения графика)
  return sampled.sort((a, b) => a.date.localeCompare(b.date));
}

export function processChartData(trendData: TrendDataPoint[], isMobile: boolean = false): ProcessedChartData {
  // Защита от пустых данных
  if (!trendData || trendData.length === 0) {
    return {
      todayDate: null,
      historicalData: [],
      forecastData: [],
      forecastWithConnection: [],
    };
  }

  const todayIndex = trendData.findIndex(d => d.isToday);
  const todayDate = todayIndex !== -1 ? trendData[todayIndex].date : null;

  // На мобильных уменьшаем количество точек для лучшей производительности
  const processedData = isMobile ? sampleDataForMobile(trendData, 30) : trendData;

  const historicalData = processedData.filter(d => !d.isForecast);
  const forecastData = processedData.filter(d => d.isForecast);

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
