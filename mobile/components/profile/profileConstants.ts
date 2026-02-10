export const currencies = [
  { key: "USD", label: "USD — US Dollar" },
  { key: "RUB", label: "RUB — Russian Ruble" },
  { key: "IDR", label: "IDR — Indonesian Rupiah" },
  { key: "KRW", label: "KRW — Korean Won" },
  { key: "EUR", label: "EUR — Euro" },
  { key: "CNY", label: "CNY — Chinese Yuan" },
];

export const languages = [
  { key: "en", label: "English" },
  { key: "ru", label: "Russian" },
];

export const timezones = [
  { key: "UTC", label: "UTC" },
  { key: "America/New_York", label: "New York" },
  { key: "America/Chicago", label: "Chicago" },
  { key: "America/Denver", label: "Denver" },
  { key: "America/Los_Angeles", label: "Los Angeles" },
  { key: "America/Sao_Paulo", label: "São Paulo" },
  { key: "Europe/London", label: "London" },
  { key: "Europe/Paris", label: "Paris" },
  { key: "Europe/Berlin", label: "Berlin" },
  { key: "Europe/Moscow", label: "Moscow" },
  { key: "Europe/Istanbul", label: "Istanbul" },
  { key: "Asia/Jakarta", label: "Jakarta" },
  { key: "Asia/Seoul", label: "Seoul" },
  { key: "Asia/Shanghai", label: "Shanghai" },
  { key: "Asia/Tokyo", label: "Tokyo" },
  { key: "Asia/Kolkata", label: "Kolkata" },
  { key: "Pacific/Auckland", label: "Auckland" },
  { key: "Australia/Sydney", label: "Sydney" },
];

export const exchangeRateFields = [
  { key: "exchangeRateRUB" as const, label: "RUB (Russian Ruble)", placeholder: "92.5" },
  { key: "exchangeRateIDR" as const, label: "IDR (Indonesian Rupiah)", placeholder: "15750" },
  { key: "exchangeRateKRW" as const, label: "KRW (Korean Won)", placeholder: "1300" },
  { key: "exchangeRateEUR" as const, label: "EUR (Euro)", placeholder: "0.92" },
  { key: "exchangeRateCNY" as const, label: "CNY (Chinese Yuan)", placeholder: "7.2" },
];

export type ExchangeRateKey = (typeof exchangeRateFields)[number]["key"];
