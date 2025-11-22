export const CHART_COLORS = {
  income: "hsl(142, 76%, 36%)",
  expense: "hsl(0, 84%, 60%)",
  capital: "hsl(221, 83%, 53%)",
  forecast: "hsl(221, 83%, 53%)",
  assetsNet: "hsl(271, 81%, 56%)",
  grid: "hsl(var(--border))",
  today: "hsl(var(--muted-foreground))",
};

export function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(1)}k`;
  }
  return `${sign}$${absValue.toFixed(0)}`;
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
