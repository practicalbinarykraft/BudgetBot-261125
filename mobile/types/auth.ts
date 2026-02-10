export interface User {
  id: number;
  email: string;
  name: string;
  tier: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export interface TelegramStatus {
  connected: boolean;
  username: string | null;
}

export interface Settings {
  userId: number;
  currency: string;
  language: string;
  telegramNotifications: boolean;
  timezone: string | null;
  notificationTime: string | null;
  anthropicApiKey: string | null;
  openaiApiKey: string | null;
  exchangeRateRUB: number | null;
  exchangeRateIDR: number | null;
  exchangeRateKRW: number | null;
  exchangeRateEUR: number | null;
  exchangeRateCNY: number | null;
  exchangeRatesUpdatedAt: string | null;
}
