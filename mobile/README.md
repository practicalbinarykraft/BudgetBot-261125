# BudgetBot Mobile (Expo)

React Native mobile app for BudgetBot, built with Expo SDK 52.

## Features

- **Real-time voice input** – on-device speech recognition via Apple Speech / Google SpeechRecognizer. Text appears instantly as you speak (like Google Translate). No audio sent to server.
- **Smart voice parsing** – automatically extracts amount, description, and type from natural speech: "Spent 15 dollars on lunch" or "Получил 3000 зарплата"
- **Receipt scanning** – camera + gallery OCR via Claude
- **Full financial tracking** – dashboard, transactions, analytics, budgets
- **Offline-ready architecture** – React Query with stale-time caching
- **Secure authentication** – session cookies stored in SecureStore
- **Multi-language speech** – supports en, ru, ko, id, zh based on user settings

## Quick Start

This app requires a **development build** (not Expo Go) because `expo-speech-recognition` uses native modules.

```bash
cd mobile
npm install

# Build a dev client (first time only)
npx expo prebuild
# OR use EAS Build:
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Start dev server
npm start
```

After building, install the dev client on your device and scan the QR code.

## Configuration

Edit `constants/config.ts` to set your API server URL:

```ts
// For local development, use your machine's LAN IP
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000'
  : 'https://your-budgetbot.onrender.com';
```

## Voice Input Architecture

```
User speaks → Native Speech Engine (on-device) → Real-time text stream
                                                       ↓
                                              Local text parser
                                                       ↓
                                          { amount, description, type }
                                                       ↓
                                            Auto-fill transaction form
```

**Key difference from web app:** The web version records audio and sends it to OpenAI Whisper on the server. The mobile app uses the device's built-in speech engine (Apple Speech on iOS, Google SpeechRecognizer on Android) for instant, streaming recognition — no network required for transcription.

Supported voice commands:
- "Spent 15 dollars on lunch" → Expense, $15, Lunch
- "Потратил 500 на такси" → Expense, 500, Такси
- "Earned 3000 salary" → Income, $3000, Salary
- "Coffee 4.50" → Expense, $4.50, Coffee

## Project Structure

```
mobile/
├── app/                      # Expo Router (file-based routing)
│   ├── _layout.tsx           # Root layout with providers
│   ├── index.tsx             # Entry – auth redirect
│   ├── (auth)/               # Auth screens (login, register)
│   └── (tabs)/               # Main app tabs
│       ├── dashboard.tsx     # Financial overview
│       ├── transactions.tsx  # Transaction list with filters
│       ├── add.tsx           # Add transaction + voice input
│       ├── analytics.tsx     # Spending breakdown by category
│       └── settings.tsx      # User settings & logout
├── components/
│   └── VoiceRecorder.tsx     # Real-time speech UI with live transcript
├── hooks/
│   ├── useAuth.tsx           # Authentication context & mutations
│   ├── useTransactions.ts    # Transaction CRUD hooks
│   ├── useWallets.ts         # Wallet & settings data hooks
│   ├── useVoiceRecorder.ts   # expo-speech-recognition hook
│   └── useReceiptScanner.ts  # Camera + OCR hook
├── lib/
│   ├── api.ts                # API client with session management
│   ├── queryClient.ts        # React Query configuration
│   └── parseTransaction.ts   # Local voice text → transaction parser
├── stores/
│   └── transactionStore.ts   # Zustand UI state for transactions
├── types/
│   └── index.ts              # TypeScript types (mirrors server schema)
├── constants/
│   └── config.ts             # API URL, colors, fonts, spacing
├── assets/                   # Icons, splash screen
├── eas.json                  # EAS Build configuration
└── app.json                  # Expo configuration + plugins
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Routing | Expo Router 4 (file-based) |
| State | TanStack React Query 5 + Zustand 5 |
| Auth | Session cookies via expo-secure-store |
| Speech | expo-speech-recognition (on-device, real-time) |
| Camera | expo-image-picker + expo-camera |
| Icons | @expo/vector-icons (Ionicons) |
| Build | EAS Build (development + production profiles) |

## API Compatibility

This mobile app connects to the same BudgetBot Express.js backend as the web app.
All API endpoints are shared — no separate mobile API needed.

Key endpoints used:
- `POST /api/login` / `POST /api/register` / `POST /api/logout`
- `GET /api/user` / `GET /api/settings`
- `GET/POST/PATCH/DELETE /api/transactions`
- `GET /api/wallets` / `GET /api/categories` / `GET /api/budgets`
- `GET /api/stats` / `GET /api/analytics/by-category`
- `POST /api/ai/receipts/analyze` (Claude OCR for receipt scanning)

## Building for Production

```bash
# Preview build (internal testing)
npx eas build --profile preview --platform all

# Production build
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

Requires an [Expo Application Services](https://expo.dev/eas) account.
