# Mobile UI Port Mapping — 1:1 Web → Expo Go

Source of truth: web codebase at `client/src/`.
Mobile target: `mobile/`.

**STATUS: PORT COMPLETE** — All 8 screens ported (Priorities 0–5).

### Known TODOs

- **API contract**: Backend must standardize `/api/wallets`, `/api/categories`, `/api/budgets` to `PaginatedResponse` only. Mobile currently has raw-array fallbacks that must be removed once backend is standardized. See TODO comments in `DashboardScreen.tsx` and `WalletsScreen.tsx`.

### Intentional MVP Skips

These features exist in the web UI but were intentionally skipped for mobile MVP:

| Feature | Web Location | Reason |
|---------|-------------|--------|
| Add Wallet dialog | wallets-page.tsx | Buttons show "Coming soon" alert |
| Calibration dialog | wallets-page.tsx, dashboard-page.tsx | Buttons show "Coming soon" alert |
| Edit Transaction screen | transactions-page.tsx (edit dialog) | Add Transaction exists; edit not yet wired |
| Telegram Integration | settings/telegram-integration-card.tsx | Web-specific SDK |
| Telegram Account | settings/telegram-account-settings.tsx | Web-specific SDK |
| Two-Factor Auth | settings/two-factor-settings.tsx | Complex, low mobile priority |
| Telegram notifications toggle | settings/general-settings-card.tsx | Depends on Telegram integration |
| Notification settings (timezone, time) | settings/general-settings-card.tsx | Low priority for MVP |
| API keys (anthropic, openai) | settings/general-settings-card.tsx | Tier-gated, low priority |
| Exchange rates section | settings/exchange-rates-section.tsx | Low priority for MVP |
| Financial Trend Chart | dashboard-page.tsx | Complex charting, needs react-native-svg |
| CircularProgress on category icons | dashboard-v2-page.tsx | Needs react-native-svg |
| Voice input / AI Chat | dashboard-v2-page.tsx | Complex, skip for MVP |
| Language toggle (auth page) | auth-page.tsx | i18n not implemented in mobile |
| NotificationsBell / CreditsWidget | dashboard-v2-page.tsx | Web-specific features |

### Deleted Files (dead code removed)

- `mobile/screens/LoginScreen.tsx` — replaced by AuthScreen
- `mobile/screens/RegisterScreen.tsx` — replaced by AuthScreen
- `mobile/components/CategoryItem.tsx` — replaced by inline card rendering in CategoriesScreen

---

## SCREEN MAP

| Web Screen | Web Route | Mobile Screen | Mobile File | Navigation |
|---|---|---|---|---|
| Auth | `/login` | AuthScreen | `screens/AuthScreen.tsx` | AuthStack |
| Home (Главная) | `/app/dashboard-v2` | DashboardScreen | `screens/DashboardScreen.tsx` | Tab: "Home" |
| Dashboard (Панель управления) | `/app/dashboard` | DashboardAnalyticsScreen | `screens/DashboardAnalyticsScreen.tsx` | Stack: from Home header icon |
| Transactions | `/app/transactions` | TransactionsScreen | `screens/TransactionsScreen.tsx` | Tab: "Transactions" |
| Wallets | `/app/wallets` | WalletsScreen | `screens/WalletsScreen.tsx` | Stack: from Home header balance link |
| Categories | `/app/categories` | CategoriesScreen | `screens/CategoriesScreen.tsx` | Tab: "Categories" |
| Budgets | `/app/budgets` | BudgetsScreen | `screens/BudgetsScreen.tsx` | Tab: "Budgets" |
| Settings | `/app/settings` | ProfileScreen | `screens/ProfileScreen.tsx` | Tab: "Profile" |

---

## AUTH SCREEN — DONE ✅

**Files:** `mobile/screens/AuthScreen.tsx`, `mobile/navigation/AuthStackNavigator.tsx`
**Deleted:** `mobile/screens/LoginScreen.tsx`, `mobile/screens/RegisterScreen.tsx`

### Web blocks (auth-page.tsx, top → bottom)
1. Header (centered): Wallet icon inline (h-10 w-10 text-primary) + "BudgetBot" (h1 text-4xl bold) — same row
2. Subtitle: `t('auth.app_description')` (text-muted-foreground)
3. TabsList: Login | Register — grid-cols-2, full width
4. Card:
   - CardHeader: CardTitle (dynamic: "Welcome back" / "Create account") + CardDescription (dynamic)
   - CardContent:
     - **Login tab**: Email → Password → Submit (full-width) → "Forgot password?" link (text-center text-sm text-primary) → Divider ("or continue with") → TelegramLoginButton
     - **Register tab**: Name → Email → Password → Submit (full-width) → Divider → TelegramLoginButton
5. Right hero column — `hidden lg:flex` (not rendered on mobile)

### Mobile blocks (target)
1. Header (centered): Feather "wallet" icon (size 40, theme.primary) inline with "BudgetBot" (h1, bold) — same row, flex items-center gap
2. Subtitle: app description (bodySm, textSecondary)
3. Tab toggle: Login | Register — two pressables in a row, grid-like, full width, matching web TabsList appearance
4. Card:
   - CardHeader: CardTitle + CardDescription (dynamic per active tab)
   - CardContent:
     - **Login tab**: Email input → Password input → Submit button (full-width) → "Forgot password?" text (centered, small, primary color) → Divider line with "or continue with" text
     - **Register tab**: Name input → Email input → Password input → Submit button (full-width) → Divider
5. No hero column (correct)

### No-change rules
- Do NOT add circular icon containers, branding blocks, or background tints behind icons
- Do NOT split Login/Register into separate screens
- Do NOT add navigation links like "Don't have an account?"
- Telegram button: skip (web-specific SDK), but keep the divider structure
- Language toggle: skip
- Hero column: skip (already hidden on mobile in web)

---

## HOME (dashboard-v2) — DONE ✅

**Files:** `mobile/screens/DashboardScreen.tsx`
**Web source:** `client/src/pages/dashboard-v2-page.tsx` (route: `/app/dashboard-v2`)
**Navigation:** Tab "Home" (home icon) — default landing screen

### Web blocks (dashboard-v2-page.tsx, top → bottom)
1. Header: Left: Wallet icon + total balance link (→ /app/wallets) + NotificationsBell / Center: CreditsWidget / Right: Dashboard icon (→ /app/dashboard) + Menu icon
2. Month Navigation: ← month name (LLLL yyyy) →
3. Large Balance: text-4xl bold centered, month balance
4. Income/Expense Buttons: 2 flex-1 rounded-full buttons, green (ArrowUp + income) / red (ArrowDown + expense)
5. Categories: horizontal scroll, each with CircularProgress + emoji icon + name + amount or spent/limit
6. Recent Transactions: "Recent" header + "All transactions >" link + flat list (limit 5, each shows description + date + tag badge + category badge + budget info + colored amount)
7. Bottom Action Buttons: floating cross layout (Home / Voice / Add / AI Chat) — SKIP (tab bar replaces)

### Mobile blocks (implemented)
1. Header: Left: credit-card icon + total balance (Pressable → Wallets stack screen) / Right: bar-chart-2 icon (Pressable → DashboardAnalytics stack screen)
2. Month Navigation: chevron-left + month label + chevron-right (same as web)
3. Large Balance: mono4xl centered (same as web)
4. Income/Expense Buttons: 2 rounded-full Pressables, green/red with arrow icons + amounts (same as web)
5. Categories: horizontal ScrollView, colored circle + emoji + name + amount or spent/limit (same as web, minus CircularProgress ring)
6. Recent Transactions: "Recent" + "All transactions >" + flat TransactionItem list (same as web)
7. Bottom Action Buttons: SKIP — tab bar replaces Home; Add Transaction via other screens; Voice/AI Chat skip for MVP

### Skipped (MVP)
- NotificationsBell, CreditsWidget, MobileMenuSheet (web-specific features)
- CircularProgress ring around category icons (needs react-native-svg)
- Voice input, AI Chat sidebar
- Tag+/Category+ inline action buttons on transaction items
- Budget spent/limit display on transaction items

### No-change rules
- Do NOT replace month navigation with DateFilter (week/month/year/all) — that belongs to Dashboard analytics
- Do NOT add stat cards (border-l-4) — that belongs to Dashboard analytics
- Do NOT add date-grouped transaction list — Home uses flat list (limit 5)
- Do NOT add FABs
- Do NOT remove categories horizontal scroll

---

## DASHBOARD ANALYTICS — DONE ✅

**Files:** `mobile/screens/DashboardAnalyticsScreen.tsx`
**Web source:** `client/src/pages/dashboard-page.tsx` (route: `/app/dashboard`)
**Navigation:** Stack screen, accessible from Home header bar-chart-2 icon

### Web blocks (dashboard-page.tsx, top → bottom)
1. Header row: Left: "Dashboard" (h1) + "Overview of your finances" (subtitle) / Right: "Calibrate Wallets" (outline) + "Add Transaction" (primary)
2. DateFilter: Week | Month | Year | All Time — toggle buttons
3. BudgetAlerts: Exceeded (destructive) + Warning — conditional
4. Stat Cards Grid (grid 1/2/4 cols): Total Income / Total Expense / Total Capital / Net Worth
5. Financial Trend Chart — skip
6. TransactionList (Card): "Recent Transactions" title → date-grouped items

### Mobile blocks (implemented)
1. Header row: "Dashboard" (h3) + "Overview of your finances" + Calibrate (outline, "Coming soon") + "Add Transaction" (primary, navigates to AddTransaction)
2. DateFilter: 4 toggle Buttons (week/month/year/all)
3. BudgetAlerts: exceeded (destructive) + warning (conditional), fetches /api/limits
4. StatCards: 2x2 grid — Total Income (green border) / Total Expense (red, "View Details" link) / Total Capital (blue) / Net Worth (yellow)
5. FinancialTrendChart: SKIP
6. TransactionList in Card: "Recent Transactions" title + date-grouped TransactionItems

### Navigation flow
Home tab → tap bar-chart-2 icon in header → pushes DashboardAnalytics stack screen (with back button + "Dashboard" title) → back returns to Home tab

---

## TRANSACTIONS — DONE ✅

**Files:** `mobile/screens/TransactionsScreen.tsx`
**Web source:** `client/src/pages/transactions-page.tsx` (route: `/app/transactions`)

### Web blocks (transactions-page.tsx, top → bottom)
1. Header: Left: "Transactions" (h1) + "Manage your transactions" (subtitle) + active filter badges / Right: Filter button (popover) + Sort button (conditional) + "Add Transaction" button
2. Filter Popover: Type select → Category select → Tag select → Date From → Date To → Clear All
3. TransactionList (Card): "Recent Transactions" title → date-grouped items
4. Add Transaction Dialog: Type → Amount+Currency (2-col) → Description → Category → Tag → Date
5. Edit Transaction Dialog: same + Financial Type

### Mobile blocks (target)
1. Header: same structure (filter button opens bottom sheet instead of popover)
2. Filter bottom sheet: same fields as web popover
3. TransactionList in Card: same date grouping
4. Add Transaction: separate screen (Expo Go limitation), same field order
5. Edit Transaction: separate screen, same fields

### No-change rules
- Do NOT use inline filter chips
- Do NOT use FABs
- Do NOT skip date grouping in transaction list

---

## WALLETS — DONE ✅

**Files:** `mobile/screens/WalletsScreen.tsx`, `mobile/components/WalletCard.tsx`
**Web source:** `client/src/pages/wallets-page.tsx` (route: `/app/wallets`)
**Navigation:** Stack screen, accessible from Home header wallet/balance link

### Web blocks (wallets-page.tsx, top → bottom)
1. Header row: "Wallets" (h1) + "Manage your accounts" (subtitle) / Right: "Calibrate" (outline) + "Add Wallet" (primary)
2. Total Net Worth Card: border-l-4 border-l-primary, "Total Net Worth", monospace $value
3. Wallets Grid (1/2/3 cols): Per card: name + icon → balance → USD conversion → type/currency
4. Empty State: Wallet icon + "No wallets yet" + "Add your first wallet to get started"

### Mobile blocks (implemented)
1. Header row: "Wallets" + "Manage your accounts" + Calibrate (outline) + Add Wallet (primary) buttons
2. Total Net Worth Card: border-l-4 #3b82f6, "Total Net Worth", mono4xl $value
3. Wallets list: FlatList of WalletCard (1 col, acceptable for mobile)
4. Empty state: credit-card icon + "No wallets yet" + "Add your first wallet to get started"

### Skipped (MVP)
- Add Wallet dialog (buttons show "Coming soon" alert)
- Calibration dialog (button shows "Coming soon" alert)

### No-change rules
- Do NOT change subtitle text
- Do NOT omit header action buttons
- Icon mapping: card→credit-card, cash→disc (web: Coins), crypto→hash (web: Bitcoin)

---

## CATEGORIES — DONE ✅

**Files:** `mobile/screens/CategoriesScreen.tsx`
**Web source:** `client/src/pages/categories-page.tsx` (route: `/app/categories`)
**Removed:** Filter chips (All/Expense/Income), FAB, flat FlatList, CategoryItem component usage

### Web blocks (categories-page.tsx, top → bottom)
1. Header: "Categories" (h1) + "Organize your spending" (subtitle) + "Add Category" button
2. Income Categories: section heading (h2) + grid of cards (colored icon square + name + "Income" badge + delete button)
3. Expense Categories: same structure + "Expense" badge
4. Empty states per section (Card with centered text)
5. Add Category Dialog: Name → Type → Icon grid (5 cols) → Color picker

### Mobile blocks (implemented)
1. Header: "Categories" (h3) + "Organize your spending" + "Add Category" button (primary, plus icon)
2. Income Categories section: "Income Categories" (h4) heading + list of Cards (colored rounded-md icon square + name + "Income" Badge + trash-2 delete button)
3. Expense Categories section: same structure + "Expense" Badge
4. Empty states per section: Card with centered "No income/expense categories" text
5. Add Category: existing AddEditCategoryScreen (modal)

### Category card structure (matching web Card > CardContent)
- Left: colored icon square (w-10 h-10 rounded-md, full category color) + name (font-medium) + type Badge (secondary)
- Right: delete button (trash-2 icon)
- Tap card → navigate to AddEditCategory for editing
- Tap delete → confirmation Alert → DELETE /api/categories/{id}

### Filtering (matching web)
- `applicableTo === "transaction" || applicableTo === "both"` (same as web)
- Delete cascades to budgets (invalidates both queries, matching web)

### No-change rules
- Do NOT use filter chips (All/Income/Expense) — web uses section headings
- Do NOT use FABs — "Add Category" button is in header

---

## BUDGETS — DONE ✅

**Files:** `mobile/screens/BudgetsScreen.tsx`
**Web source:** `client/src/pages/budgets-page.tsx` (route: `/app/budgets`)
**Removed:** FAB, old flat FlatList structure

### Web blocks (budgets-page.tsx, top → bottom)
1. Header: "Budgets" + "Manage your spending limits" + "Add Budget" button
2. Exceeded Budgets Alert (conditional, destructive)
3. Budget Progress: LimitsProgress bars
4. Budgets Grid: category dot + name + edit/delete → limit + period → spent → progress bar → % + remaining
5. Empty State
6. Budget Form Dialog: Category → Limit → Period → Start date

### Mobile blocks (implemented)
1. Header: "Budgets" (h3) + "Manage your spending limits" + "Add Budget" button (primary, plus icon)
2. Exceeded Budgets Alert: destructive tinted View with alert-circle icon + count text (matching web Alert variant="destructive")
3. Budget Progress: "Budget Progress" (h4) heading + list of color dot + name + BudgetProgressBar component
4. Budget Cards: Card per budget — CardHeader (color dot + name | edit-2 + trash-2 buttons) + CardContent (period label + $limit | "Spent" + $spent red-if-exceeded | progress bar green/yellow/red | "X% used" + "$X remaining" | conditional status alert)
5. Empty State: Card with trending-down icon + "No budgets yet" + description + "Add Budget" button
6. Budget Form: existing AddEditBudgetScreen (modal)

### Status color logic (matching web BudgetCard statusColors)
- `>100%` → destructive (red) + "Budget exceeded"
- `>=75%` → warning (yellow) + "Approaching limit"
- `<75%` → success (green), no label

### No-change rules
- Do NOT use FABs
- Do NOT omit exceeded alerts

---

## SETTINGS — DONE ✅

**Files:** `mobile/screens/ProfileScreen.tsx`
**Web source:** `client/src/pages/settings/index.tsx` (route: `/app/settings`)
**Removed:** Tier badge (not in web)

### Web blocks (settings/index.tsx, top → bottom)
1. Header: "Settings" (h1) + "Manage your preferences"
2. General Settings Card: Currency + Language + Save → Telegram toggle → Notification settings → API keys → Exchange rates → Save
3. Telegram Integration Card
4. Telegram Account Card
5. Two-Factor Auth Card
6. Account Information Card: Name + Email

### Mobile blocks (implemented)
1. Header: "Settings" (h3) + "Manage your preferences" (matching other screen headers)
2. General Settings Card: CardHeader "General Settings" + CardContent with Currency toggle (6 options: USD/RUB/IDR/KRW/EUR/CNY matching web) + Language toggle (English/Russian matching web) + "Save Settings" button. Fetches `GET /api/settings`, saves via `PATCH /api/settings`.
3. Telegram Integration: SKIP for MVP
4. Telegram Account: SKIP for MVP
5. Two-Factor Auth: SKIP for MVP
6. Account Information Card: CardHeader "Account Information" + Name row + Email row (no Tier badge, matching web)
7. Log Out button (mobile-specific, web has it in sidebar)

### Skipped (MVP)
- Telegram notifications toggle
- Notification settings (timezone, notification time)
- API keys (anthropic, openai) — tier-gated in web
- Exchange rates section
- Telegram Integration Card
- Telegram Account Card
- Two-Factor Auth Card

### No-change rules
- Do NOT show Tier badge (not in web)
- Do NOT invent new card sections
