# BudgetBot Mobile (Expo)

React Native mobile app for BudgetBot, built with Expo SDK 52.

## Features

- **Native voice input** – record audio and transcribe via OpenAI Whisper (solves Safari limitation)
- **Receipt scanning** – camera + gallery OCR via Claude
- **Full financial tracking** – dashboard, transactions, analytics, budgets
- **Offline-ready architecture** – React Query with stale-time caching
- **Secure authentication** – session cookies stored in SecureStore

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (iOS/Android).

## Configuration

Edit `constants/config.ts` to set your API server URL:

```ts
// For local development, use your machine's LAN IP
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000'
  : 'https://your-budgetbot.onrender.com';
```

## Project Structure

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Entry – auth redirect
│   ├── (auth)/             # Auth screens (login, register)
│   └── (tabs)/             # Main app tabs
│       ├── dashboard.tsx   # Financial overview
│       ├── transactions.tsx # Transaction list
│       ├── add.tsx         # Add transaction + voice
│       ├── analytics.tsx   # Spending breakdown
│       └── settings.tsx    # User settings & logout
├── components/             # Reusable components
│   └── VoiceRecorder.tsx   # Native voice recording UI
├── hooks/                  # React hooks
│   ├── useAuth.tsx         # Authentication context
│   ├── useTransactions.ts  # Transaction CRUD hooks
│   ├── useWallets.ts       # Wallet data hooks
│   ├── useVoiceRecorder.ts # expo-av recording hook
│   └── useReceiptScanner.ts # Camera + OCR hook
├── lib/                    # Utilities
│   ├── api.ts              # API client with session management
│   └── queryClient.ts      # React Query configuration
├── stores/                 # Zustand stores
│   └── transactionStore.ts # UI state for transactions
├── types/                  # TypeScript types
│   └── index.ts            # Shared types (mirrors server schema)
├── constants/              # App configuration
│   └── config.ts           # API URL, colors, spacing
└── assets/                 # Icons, splash, fonts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Routing | Expo Router 4 (file-based) |
| State | TanStack React Query 5 + Zustand 5 |
| Auth | Session cookies via SecureStore |
| Voice | expo-av (native microphone) |
| Camera | expo-image-picker + expo-camera |
| Icons | @expo/vector-icons (Ionicons) |
| Haptics | expo-haptics |

## API Compatibility

This mobile app connects to the same BudgetBot Express.js backend as the web app.
All API endpoints are shared – no separate mobile API needed.

Key endpoints used:
- `POST /api/login` / `POST /api/register` / `POST /api/logout`
- `GET /api/user` / `GET /api/settings`
- `GET/POST/PATCH/DELETE /api/transactions`
- `GET /api/wallets` / `GET /api/categories` / `GET /api/budgets`
- `GET /api/stats` / `GET /api/analytics/by-category`
- `POST /api/ai/voice-parse` (Whisper transcription)
- `POST /api/ai/receipts/analyze` (Claude OCR)

## Building for Production

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

Requires an [Expo Application Services](https://expo.dev/eas) account.
