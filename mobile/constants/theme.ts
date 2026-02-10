/**
 * Theme matching BudgetBot web UI (shadcn/ui + Tailwind)
 * Colors from client/src/index.css CSS variables
 */

export const Colors = {
  light: {
    // Core
    primary: "#3b82f6",         // HSL(217 91% 60%)
    primaryForeground: "#ffffff",
    secondary: "#f5f5f5",       // HSL(0 0% 96%)
    secondaryForeground: "#1a1a1a",

    // Backgrounds
    background: "#ffffff",
    foreground: "#1a1a1a",      // HSL(0 0% 9%)
    card: "#f9f9f9",            // HSL(0 0% 98%)
    cardForeground: "#1a1a1a",

    // Text
    text: "#1a1a1a",
    textSecondary: "#666666",   // HSL(0 0% 40%) muted-foreground
    textTertiary: "#999999",

    // Borders
    border: "#e3e3e3",          // HSL(0 0% 89%)
    cardBorder: "#efefef",      // HSL(0 0% 94%)
    input: "#bfbfbf",           // HSL(0 0% 75%)

    // Muted
    muted: "#ededed",           // HSL(0 0% 93%)
    mutedForeground: "#666666",

    // Status
    destructive: "#dc2626",     // HSL(0 84% 42%)
    destructiveForeground: "#faf8f8",
    success: "#22c55e",
    warning: "#f59e0b",

    // Semantic
    income: "#22c55e",          // Chart 2 green
    expense: "#dc2626",

    // Chart palette
    chart1: "#3b82f6",
    chart2: "#22c55e",
    chart3: "#ec4899",
    chart4: "#f59e0b",
    chart5: "#a78bfa",

    // Navigation
    tabBar: "#ffffff",
    tabBarBorder: "#e3e3e3",
    tabBarActive: "#3b82f6",
    tabBarInactive: "#666666",
  },
  dark: {
    primary: "#60a5fa",         // HSL(217 91% 65%)
    primaryForeground: "#ffffff",
    secondary: "#242424",       // HSL(0 0% 14%)
    secondaryForeground: "#f9f9f9",

    background: "#121212",      // HSL(0 0% 7%)
    foreground: "#f9f9f9",
    card: "#1a1a1a",            // HSL(0 0% 9%)
    cardForeground: "#f9f9f9",

    text: "#f9f9f9",
    textSecondary: "#999999",
    textTertiary: "#666666",

    border: "#333333",
    cardBorder: "#2a2a2a",
    input: "#444444",

    muted: "#2a2a2a",
    mutedForeground: "#999999",

    destructive: "#dc2626",
    destructiveForeground: "#faf8f8",
    success: "#22c55e",
    warning: "#f59e0b",

    income: "#22c55e",
    expense: "#ef4444",

    chart1: "#60a5fa",
    chart2: "#22c55e",
    chart3: "#ec4899",
    chart4: "#f59e0b",
    chart5: "#a78bfa",

    tabBar: "#1a1a1a",
    tabBarBorder: "#333333",
    tabBarActive: "#60a5fa",
    tabBarInactive: "#999999",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

export const BorderRadius = {
  sm: 3,
  md: 6,
  lg: 9,
  xl: 11,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: "600" as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  caption: { fontSize: 10, lineHeight: 14, fontWeight: "400" as const },
  // Monospace for financial amounts
  mono: { fontSize: 16, lineHeight: 24, fontWeight: "700" as const },
  monoLg: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  monoXl: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  mono4xl: { fontSize: 36, lineHeight: 40, fontWeight: "700" as const },
};
