/**
 * App-wide configuration constants.
 * API_BASE_URL should point to your deployed BudgetBot server.
 * For local dev with Expo Go, use your machine's LAN IP (not localhost).
 */

// Change this to your actual server URL
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000'   // Local development – replace with your LAN IP
  : 'https://your-budgetbot.onrender.com'; // Production

export const APP_NAME = 'BudgetBot';

export const COLORS = {
  // Brand
  primary: '#6366f1',       // indigo-500
  primaryDark: '#4f46e5',   // indigo-600
  primaryLight: '#818cf8',  // indigo-400

  // Semantic
  income: '#22c55e',        // green-500
  expense: '#ef4444',       // red-500
  warning: '#f59e0b',       // amber-500

  // Neutral
  background: '#0f172a',    // slate-900
  surface: '#1e293b',       // slate-800
  surfaceLight: '#334155',  // slate-700
  border: '#475569',        // slate-600
  textPrimary: '#f8fafc',   // slate-50
  textSecondary: '#94a3b8', // slate-400
  textMuted: '#64748b',     // slate-500

  // Light theme
  lightBackground: '#ffffff',
  lightSurface: '#f8fafc',
  lightSurfaceLight: '#f1f5f9',
  lightBorder: '#e2e8f0',
  lightTextPrimary: '#0f172a',
  lightTextSecondary: '#475569',
  lightTextMuted: '#94a3b8',
} as const;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;
