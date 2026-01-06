# 📊 BudgetBot Admin Panel - Техническое Задание

**Версия:** 1.0
**Дата:** 2026-01-06
**Статус:** Draft для Review

---

## 🎯 Цель проекта

Создать полноценную админ-панель для управления BudgetBot SaaS платформой с фокусом на:
- Мониторинг ключевых метрик роста и unit economics
- Управление пользователями и их тарифами
- Аналитику поведения пользователей для улучшения продукта
- Реферальную систему с tracking attribution
- Систему рассылок с сегментацией
- Presentation-ready метрики для инвесторов

---

## ⚠️ КРИТИЧЕСКАЯ НАХОДКА: Отсутствие хранения фото чеков

### Текущее состояние
❌ **В базе данных НЕ сохраняются фотографии чеков от пользователей!**

**Проверка schema.ts:**
```typescript
// transactions table - НЕТ поля для фото
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  // ... другие поля
  source: text("source").default("manual"), // 'manual', 'telegram', 'ocr'
  // ❌ НЕТ receiptPhotoUrl, receiptFileId, attachmentUrl
});

// receipt_items table - есть распознанные товары, но НЕТ оригинального фото
export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id"),
  itemName: text("item_name"),
  // ❌ НЕТ ссылки на оригинальное фото чека
});
```

### Что нужно добавить В ПЕРВУЮ ОЧЕРЕДЬ

```typescript
// 1. Новая таблица для хранения attachments
export const transactionAttachments = pgTable("transaction_attachments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),

  // File storage
  fileUrl: text("file_url").notNull(), // S3/CloudFlare R2/local path
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // bytes
  mimeType: text("mime_type"), // 'image/jpeg', 'image/png', 'application/pdf'

  // Telegram-specific
  telegramFileId: text("telegram_file_id"), // для переиспользования
  telegramFileUniqueId: text("telegram_file_unique_id"),

  // Metadata
  source: text("source").default("telegram"), // 'telegram', 'web', 'mobile'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),

  // OCR status
  ocrStatus: text("ocr_status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  ocrProcessedAt: timestamp("ocr_processed_at"),
});

// 2. Обновить transactions table
export const transactions = pgTable("transactions", {
  // ... existing fields
  hasAttachment: boolean("has_attachment").default(false), // для быстрых запросов
});
```

### План миграции данных
1. **Проверить Telegram File ID в существующих транзакциях** - возможно где-то логируется
2. **Создать endpoint для re-upload старых чеков** пользователями
3. **Добавить в админку отчет**: сколько транзакций БЕЗ чеков (для понимания масштаба потери данных)

---

## 🏗️ Архитектура

### Поддомен
```
admin.budgetbot.app
```

### Технологии (рекомендация)
- **Frontend:** React + TypeScript + TailwindCSS (consistency с основным app)
- **UI Library:** shadcn/ui (уже используется)
- **Charts:** Recharts (уже используется) + Chart.js для сложных дашбордов
- **State Management:** TanStack Query (уже используется)
- **Auth:** Отдельная таблица `admin_users` с ролями

### Безопасность
```typescript
// 1. Отдельная таблица админов
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'super_admin', 'support', 'analyst', 'readonly'
  permissions: text("permissions").array(), // ['users.write', 'billing.read', 'broadcasts.write']
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  ipWhitelist: text("ip_whitelist").array(), // опционально
});

// 2. Audit log для всех действий
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id),
  action: text("action").notNull(), // 'user.ban', 'plan.change', 'broadcast.send'
  entityType: text("entity_type"), // 'user', 'transaction', 'plan'
  entityId: text("entity_id"),
  changes: jsonb("changes"), // before/after
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Middleware защита
```typescript
// server/middleware/admin-auth.ts
export const requireAdmin = (requiredPermission?: string) => {
  return async (req, res, next) => {
    // 1. Проверка админ сессии
    // 2. Проверка роли и permissions
    // 3. Логирование в audit_log
    // 4. IP whitelist проверка (опционально)
  };
};
```

---

## 📊 Раздел 1: EXECUTIVE DASHBOARD (Главный экран)

### 1.1 Hero Metrics (верхние карточки)

```typescript
interface HeroMetrics {
  mrr: {
    current: number;
    change: number; // % за последние 30 дней
    trend: number[]; // sparkline за 12 месяцев
  };
  totalUsers: {
    current: number;
    activeToday: number;
    change: number;
  };
  ltv: number; // Lifetime Value среднего пользователя
  cac: number; // Customer Acquisition Cost
  ltvCacRatio: number; // должен быть 3:1 или выше
}
```

**Бенчмарки для инвесторов (2026):**
- LTV:CAC ≥ 3:1 (отлично), 2:1-3:1 (хорошо), <2:1 (проблема)
- CAC Payback Period ≤ 12-18 месяцев (SaaS стандарт)
- MRR Growth Rate ≥ 10-20% MoM (ранний этап)

### 1.2 Revenue Metrics

```typescript
interface RevenueMetrics {
  // Monthly Recurring Revenue
  mrr: {
    total: number;
    newMRR: number; // от новых пользователей
    expansionMRR: number; // апгрейды
    contractionMRR: number; // даунгрейды
    churnedMRR: number; // отмены
  };

  // Annual Recurring Revenue
  arr: number;

  // Average Revenue Per User
  arpu: number;
  arpuByPlan: Record<string, number>;

  // Churn Metrics
  churn: {
    userChurnRate: number; // % пользователей покинувших за месяц
    revenueChurnRate: number; // % потерянного MRR
    netRevenueRetention: number; // (MRR - Churned MRR + Expansion MRR) / Starting MRR * 100
  };
}
```

**Chart:** MRR Waterfall Chart (показывает New, Expansion, Contraction, Churn)

### 1.3 Unit Economics

```typescript
interface UnitEconomics {
  // Customer Acquisition Cost
  cac: {
    total: number; // общий за период
    byChannel: Record<string, number>; // 'organic', 'referral', 'paid'
    trend: { date: string; value: number }[];
  };

  // Lifetime Value
  ltv: {
    average: number;
    byPlan: Record<string, number>;
    byChannel: Record<string, number>;
  };

  // Key Ratios
  ltvCacRatio: number; // target: 3:1
  cacPaybackPeriod: number; // months, target: 12-18

  // Break-even analysis
  monthsToBreakEven: number; // на unit economics уровне

  // Gross Margin
  grossMargin: number; // (Revenue - COGS) / Revenue
}
```

**Chart:** LTV vs CAC trend over time с benchmark линией 3:1

### 1.4 Growth Metrics

```typescript
interface GrowthMetrics {
  // User Growth
  userGrowth: {
    total: number;
    mau: number; // Monthly Active Users
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
    mauDauRatio: number; // stickiness metric
  };

  // Activation & Retention
  activation: {
    signupToFirstTransaction: number; // % кто совершил первую транзакцию
    avgTimeToActivation: number; // hours
    d1Retention: number; // Day 1
    d7Retention: number;
    d30Retention: number;
  };

  // Cohort Analysis
  cohorts: {
    month: string;
    signups: number;
    retention: Record<string, number>; // month_0, month_1, month_2...
  }[];
}
```

**Charts:**
- Cohort retention heatmap
- DAU/MAU stickiness trend
- Activation funnel

### 1.5 Product Health

```typescript
interface ProductHealth {
  // Feature Adoption
  featureUsage: {
    feature: string;
    users: number; // сколько используют
    frequency: number; // среднее использований на пользователя
    retentionImpact: number; // корреляция с retention
  }[];

  // User Journey
  averageTransactionsPerUser: number;
  averageBudgetsPerUser: number;
  averageGoalsPerUser: number;

  // AI Usage
  aiChatSessions: number;
  avgMessagesPerSession: number;
  ocrScansPerMonth: number;
}
```

---

## 👥 Раздел 2: USERS MANAGEMENT

### 2.1 Users Table

**Columns:**
```typescript
interface UserTableRow {
  id: number;
  avatar: string;
  name: string;
  email: string;
  telegram: {
    id: string;
    username: string;
  } | null;

  // Status
  status: 'active' | 'inactive' | 'blocked' | 'churned';
  plan: 'free' | 'byok' | 'starter' | 'pro';

  // Engagement
  lastActiveAt: Date;
  daysSinceSignup: number;
  transactionsCount: number;

  // Revenue
  mrr: number;
  ltv: number;
  totalSpent: number; // сколько заплатил за всё время

  // Referral
  referralCode: string;
  referralsCount: number;
  referredBy: string | null;

  // Lifecycle Stage
  stage: 'trial' | 'activated' | 'engaged' | 'power_user' | 'at_risk' | 'churned';

  createdAt: Date;
}
```

**Filters:**
- Status (active, blocked, churned)
- Plan (all, free, byok, paid)
- Lifecycle Stage
- Signup Date Range
- Last Active (last 7d, 30d, 90d, never)
- Transaction Count (0, 1-10, 10-50, 50+)
- Revenue (free, <$10, $10-$50, $50+)
- Source (organic, referral, paid)

**Bulk Actions:**
- Export to CSV
- Change Plan (массово)
- Send Broadcast
- Block/Unblock

### 2.2 User Detail View

При клике на пользователя открывается детальная страница:

#### 2.2.1 User Profile Card
```typescript
interface UserProfile {
  basicInfo: {
    name: string;
    email: string;
    telegram: TelegramInfo;
    createdAt: Date;
    lastActiveAt: Date;
    timezone: string;
    language: 'en' | 'ru' | 'id';
  };

  subscription: {
    currentPlan: Plan;
    mrr: number;
    nextBillingDate: Date;
    paymentMethod: string;
    billingHistory: Payment[];
  };

  engagement: {
    totalTransactions: number;
    transactionsThisMonth: number;
    budgetsActive: number;
    goalsActive: number;
    aiChatMessages: number;
    ocrScans: number;
  };

  lifecycle: {
    stage: LifecycleStage;
    daysSinceSignup: number;
    daysSinceLastActive: number;
    activationDate: Date; // когда сделал первую транзакцию
    churnRisk: number; // 0-100, ML prediction
  };
}
```

**Quick Actions:**
- ✏️ Edit Plan
- 🔒 Block/Unblock User
- 💳 Refund Last Payment
- 📧 Send Email
- 📱 Send Telegram Message
- 🎁 Grant Credits
- 🔗 Copy Impersonation Link (login as user для support)

#### 2.2.2 Transaction History Tab
```typescript
interface TransactionView {
  id: number;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  source: 'manual' | 'telegram' | 'ocr';

  // ⚠️ ВАЖНО: Добавить после миграции
  attachments: {
    id: number;
    thumbnailUrl: string;
    fullUrl: string;
    fileName: string;
    uploadedAt: Date;
  }[];

  receiptItems: {
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }[];
}
```

**Features:**
- 🔍 Полнотекстовый поиск по description
- 📅 Фильтр по датам
- 💰 Фильтр по категориям
- 📸 **Просмотр прикрепленных чеков (lightbox)**
- 📊 Chart: Доходы/Расходы по месяцам
- ⬇️ Export to CSV/Excel

#### 2.2.3 AI Chat History Tab
```typescript
interface AIChatSession {
  id: number;
  startedAt: Date;
  messagesCount: number;
  source: 'web' | 'telegram';

  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolsUsed: string[]; // какие функции AI вызывал
  }[];
}
```

#### 2.2.4 Funnel Progress Tab
```typescript
interface FunnelStep {
  step: string;
  status: 'completed' | 'current' | 'pending';
  completedAt: Date | null;
  timeToComplete: number; // hours от предыдущего шага
}

const onboardingFunnel: FunnelStep[] = [
  { step: 'signup', status: 'completed', completedAt: '2026-01-01', timeToComplete: 0 },
  { step: 'telegram_connect', status: 'completed', completedAt: '2026-01-01', timeToComplete: 0.5 },
  { step: 'first_transaction', status: 'completed', completedAt: '2026-01-02', timeToComplete: 24 },
  { step: 'first_budget', status: 'current', completedAt: null, timeToComplete: null },
  { step: 'first_goal', status: 'pending', completedAt: null, timeToComplete: null },
  { step: 'upgrade_to_paid', status: 'pending', completedAt: null, timeToComplete: null },
];
```

**Visualization:** Step-by-step progress bar с временными метками

**Use case:** Понять где пользователь "застрял" и отправить targeted сообщение для помощи

#### 2.2.5 Activity Timeline
```typescript
interface ActivityEvent {
  timestamp: Date;
  type: 'signup' | 'login' | 'transaction_created' | 'budget_created' |
        'plan_upgraded' | 'ai_chat_started' | 'ocr_scan' | 'goal_achieved' |
        'referral_signup' | 'payment_received' | 'support_ticket';
  description: string;
  metadata: Record<string, any>;
}
```

**Example:**
```
🎉 2026-01-06 14:30 - User upgraded from Free to Pro plan ($9.99/mo)
💬 2026-01-06 10:15 - Started AI chat session (12 messages)
💰 2026-01-05 18:45 - Created transaction: "Grocery shopping" $45.32
📸 2026-01-05 18:44 - Scanned receipt via Telegram OCR
👤 2026-01-01 09:00 - User signed up (referred by @kraftinvest)
```

---

## 💳 Раздел 3: BILLING & REVENUE

### 3.1 Revenue Dashboard

#### Real-time Revenue Metrics
```typescript
interface RevenueDashboard {
  // Today's snapshot
  today: {
    revenue: number;
    newSubscriptions: number;
    upgrades: number;
    downgrades: number;
    cancellations: number;
    refunds: number;
  };

  // This month
  thisMonth: {
    mrr: number;
    arr: number;
    growth: number; // % vs last month
    forecast: number; // projected end of month
  };

  // Plan Distribution
  planDistribution: {
    plan: string;
    users: number;
    mrr: number;
    percentOfTotal: number;
  }[];

  // Churn Analysis
  churn: {
    userChurnRate: number;
    revenueChurnRate: number;
    netRevenueRetention: number; // NRR (target: >100%)
    reasons: {
      reason: string;
      count: number;
    }[];
  };
}
```

**Charts:**
- MRR growth over time (12 months)
- Plan distribution pie chart
- Churn cohort analysis
- ARPU by plan

### 3.2 Payments Table

```typescript
interface PaymentRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;

  // Payment details
  amount: number;
  currency: string;
  plan: string;
  billingPeriod: 'monthly' | 'annual';

  // Status
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string; // 'card', 'paypal', 'crypto'

  // Timestamps
  createdAt: Date;
  paidAt: Date | null;
  refundedAt: Date | null;

  // Provider
  provider: 'stripe' | 'paypal' | 'manual';
  externalId: string; // stripe payment id

  // Metadata
  isFirstPayment: boolean;
  isUpgrade: boolean;
  invoiceUrl: string;
}
```

**Filters:**
- Status
- Date Range
- Plan
- Payment Method
- Amount Range

**Actions:**
- View Invoice
- Refund Payment
- Resend Receipt Email
- Mark as Paid (для manual payments)

### 3.3 Manual Plan Management

**Use case:** Support нужно вручную изменить план пользователю

```typescript
interface PlanChangeRequest {
  userId: number;
  currentPlan: Plan;
  newPlan: Plan;

  // Options
  changeType: 'immediate' | 'next_billing_cycle';
  prorationMode: 'create_credit' | 'none' | 'always_invoice';

  // Reason (для audit log)
  reason: string;
  notes: string;
}
```

**UI Flow:**
1. Поиск пользователя
2. Выбор нового плана
3. Опции прорейшна
4. Confirmation modal с preview изменений
5. Admin вводит reason
6. ✅ Plan changed + email to user + audit log

### 3.4 Credits & BYOK Management

```typescript
interface CreditsOverview {
  totalCreditsGranted: number;
  totalCreditsUsed: number;
  totalCreditsPurchased: number; // за деньги
  totalCreditsRefunded: number;

  byokUsers: {
    userId: number;
    userName: string;
    apiKey: string; // masked: "sk-...abc123"
    provider: 'openai' | 'anthropic';
    messagesThisMonth: number;
    estimatedCost: number; // если бы платили нам
  }[];

  creditUsage: {
    operation: string; // 'chat_message', 'ocr_scan', 'forecast'
    count: number;
    creditsUsed: number;
  }[];
}
```

**Actions:**
- Grant Credits to User (with reason)
- Revoke API Key (для BYOK нарушителей)
- View API Usage Logs

---

## 📈 Раздел 4: ANALYTICS & INSIGHTS

### 4.1 Funnel Analysis

```typescript
interface OnboardingFunnel {
  steps: {
    step: string;
    users: number;
    conversionRate: number; // % от предыдущего шага
    dropoffRate: number;
    avgTimeToNext: number; // hours
  }[];
}

// Example funnel
const funnel = {
  steps: [
    { step: 'Landed on page', users: 10000, conversionRate: 100%, dropoffRate: 0% },
    { step: 'Started signup', users: 5000, conversionRate: 50%, dropoffRate: 50% },
    { step: 'Completed signup', users: 4000, conversionRate: 80%, dropoffRate: 20% },
    { step: 'Connected Telegram', users: 3200, conversionRate: 80%, dropoffRate: 20% },
    { step: 'First transaction', users: 2400, conversionRate: 75%, dropoffRate: 25% },
    { step: 'Created budget', users: 1800, conversionRate: 75%, dropoffRate: 25% },
    { step: 'Upgraded to paid', users: 360, conversionRate: 20%, dropoffRate: 80% },
  ]
};
```

**Visualization:** Sankey diagram или traditional funnel chart

**Actionable Insights:**
- Где самый большой drop-off?
- Какие пользователи успешно проходят через funnel? (segment analysis)
- A/B тесты разных onboarding flows

### 4.2 Cohort Retention

```typescript
interface CohortRetention {
  cohortMonth: string; // '2026-01'
  usersCount: number;

  retention: {
    month0: number; // всегда 100%
    month1: number; // % вернувшихся через месяц
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };

  revenueRetention: {
    // то же самое, но по revenue
    month0: number;
    month1: number;
    // ...
  };
}
```

**Visualization:** Heatmap (строки = cohorts, столбцы = months, цвет = retention %)

**Benchmark (SaaS):**
- Month 1: 70-90%
- Month 3: 50-70%
- Month 6: 40-60%
- Month 12: 30-50%

### 4.3 Feature Adoption

```typescript
interface FeatureAdoption {
  feature: string;

  // Adoption
  totalUsers: number; // кто хоть раз использовал
  activeUsers: number; // использовали за последние 30 дней
  adoptionRate: number; // % от всех пользователей

  // Engagement
  avgUsagePerUser: number; // раз в месяц
  powerUsers: number; // используют >10 раз в месяц

  // Impact
  retentionLift: number; // на сколько % выше retention у юзеров фичи
  conversionLift: number; // на сколько % чаще upgrade to paid

  // Trend
  trend: { date: string; users: number }[];
}

const features = [
  'AI Chat',
  'OCR Receipt Scan',
  'Budget Creation',
  'Goal Setting',
  'Recurring Transactions',
  'Multi-currency',
  'Asset Tracking',
  'Advanced Analytics',
  'Telegram Bot',
  'Mobile App',
];
```

**Use case:**
- Определить какие фичи коррелируют с retention/upgrade
- Какие фичи не используются (кандидаты на удаление)
- Куда вкладывать ресурсы для development

### 4.4 User Segmentation

**Pre-defined Segments:**
```typescript
const segments = {
  // By Lifecycle
  'New Users': 'signupDays <= 7',
  'Activated': 'transactionsCount > 0',
  'Power Users': 'transactionsCount > 50 AND dau > 20',
  'At Risk': 'lastActiveDays > 30 AND lastActiveDays < 90',
  'Churned': 'lastActiveDays >= 90',

  // By Revenue
  'Free Forever': 'plan = free AND signupDays > 30',
  'BYOK Users': 'plan = byok',
  'Paying': 'mrr > 0',
  'High Value': 'ltv > 100',

  // By Engagement
  'AI Power Users': 'aiChatMessages > 50',
  'OCR Enthusiasts': 'ocrScans > 20',
  'Budget Planners': 'budgetsActive > 3',

  // By Source
  'Referral Users': 'referredBy IS NOT NULL',
  'Organic': 'source = organic',
  'Paid Acquisition': 'source = paid',
};
```

**Custom Segment Builder (Advanced):**
```typescript
interface SegmentRule {
  field: string; // 'transactionsCount', 'mrr', 'lastActiveDays'
  operator: '=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: any;
}

interface CustomSegment {
  name: string;
  rules: SegmentRule[];
  logic: 'AND' | 'OR';
}

// Example: "High-value dormant users"
const segment: CustomSegment = {
  name: 'High-value dormant users',
  rules: [
    { field: 'ltv', operator: '>', value: 50 },
    { field: 'lastActiveDays', operator: '>', value: 14 },
    { field: 'lastActiveDays', operator: '<', value: 60 },
  ],
  logic: 'AND',
};
```

**Actions on Segments:**
- View users in segment
- Send broadcast
- Export to CSV
- Create automated campaign

---

## 🎁 Раздел 5: REFERRAL SYSTEM

### 5.1 Database Schema (NEW)

```typescript
// Referral Programs table
export const referralPrograms = pgTable("referral_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Default User', 'Influencer', 'Agency'
  type: text("type").notNull(), // 'user' | 'affiliate' | 'partner'

  // Rewards
  referrerReward: jsonb("referrer_reward"), // { type: 'credits', amount: 100 } или { type: 'discount', percent: 20 }
  refereeReward: jsonb("referee_reward"),

  // Rules
  minPurchase: decimal("min_purchase", { precision: 10, scale: 2 }), // null = любая
  validUntil: timestamp("valid_until"), // null = бессрочно
  maxUses: integer("max_uses"), // null = unlimited

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral Codes table
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 'KRAFTINVEST', 'PROMO2026'

  // Owner
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  programId: integer("program_id").references(() => referralPrograms.id),

  // Tracking
  utmSource: text("utm_source"), // для таргетологов
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),

  // Stats
  clicksCount: integer("clicks_count").default(0),
  signupsCount: integer("signups_count").default(0),
  conversionsCount: integer("conversions_count").default(0), // сколько стали paying
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),

  // Limits
  maxUses: integer("max_uses"), // null = unlimited
  expiresAt: timestamp("expires_at"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral Conversions (attribution tracking)
export const referralConversions = pgTable("referral_conversions", {
  id: serial("id").primaryKey(),

  // Parties
  referrerId: integer("referrer_id").references(() => users.id), // кто привел
  refereeId: integer("referee_id").references(() => users.id), // кого привели
  codeId: integer("code_id").references(() => referralCodes.id),

  // Attribution
  attributionModel: text("attribution_model").default("last_click"), // 'first_click', 'last_click', 'linear'
  touchpoints: jsonb("touchpoints"), // массив всех взаимодействий до конверсии

  // Journey
  clickedAt: timestamp("clicked_at"),
  signedUpAt: timestamp("signed_up_at"),
  firstPurchaseAt: timestamp("first_purchase_at"),

  // Rewards
  referrerRewardGiven: jsonb("referrer_reward_given"),
  refereeRewardGiven: jsonb("referee_reward_given"),
  rewardStatus: text("reward_status").default("pending"), // 'pending', 'approved', 'paid', 'cancelled'

  // Revenue
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  commission: decimal("commission", { precision: 10, scale: 2 }), // для affiliates

  createdAt: timestamp("created_at").defaultNow(),
});
```

### 5.2 Referral Dashboard

#### Top Referrers Leaderboard
```typescript
interface ReferralLeaderboard {
  rank: number;
  userId: number;
  userName: string;
  avatar: string;
  referralCode: string;

  // Stats
  signups: number;
  conversions: number; // сколько стали paying
  revenue: number; // total revenue from referrals
  conversionRate: number; // conversions / signups

  // Rewards
  totalEarned: number; // credits или деньги
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'; // gamification
}
```

**Visualization:**
- Top 10 table
- Bar chart по revenue
- Map (если есть geo data)

#### Affiliate/Agency Tracking
```typescript
interface AffiliateStats {
  affiliateId: number;
  name: string;
  email: string;
  type: 'influencer' | 'agency' | 'media';

  // Codes
  codes: {
    code: string;
    clicks: number;
    signups: number;
    conversions: number;
    revenue: number;
  }[];

  // Performance
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  totalRevenue: number;
  avgOrderValue: number;

  // Payouts
  commissionRate: number; // %
  totalCommission: number;
  paidOut: number;
  pending: number;
  nextPayoutDate: Date;
}
```

**Actions:**
- Create New Affiliate Account
- Generate Custom Code
- Approve/Reject Payout
- View Attribution Details

### 5.3 Referral Link Generator

**For Affiliates/Agencies (Admin creates):**
```typescript
interface CreateReferralLink {
  // Who
  assignTo: 'user' | 'affiliate' | 'agency';
  userId?: number;

  // Code
  customCode?: string; // или auto-generate

  // Campaign Tracking (для таргетологов)
  utmSource: string; // 'facebook', 'google', 'instagram'
  utmMedium: string; // 'cpc', 'banner', 'email'
  utmCampaign: string; // 'summer_promo', 'black_friday'

  // Rewards
  programId: number; // какую программу использовать

  // Limits
  maxUses?: number;
  expiresAt?: Date;
}
```

**Generated Link Example:**
```
https://budgetbot.app/?ref=KRAFTINVEST&utm_source=telegram&utm_medium=post&utm_campaign=launch_week
```

**Admin can see:**
- Link preview
- QR code для offline материалов
- Short link (budgetbot.app/r/XYZ)
- Embedded widget code для сайтов партнеров

### 5.4 Attribution Tracking (Advanced)

```typescript
interface AttributionJourney {
  userId: number;

  touchpoints: {
    timestamp: Date;
    type: 'click' | 'signup' | 'login' | 'purchase';
    source: string; // utm_source
    medium: string; // utm_medium
    campaign: string; // utm_campaign
    referralCode: string | null;
    device: string;
    ipAddress: string;
  }[];

  // Attribution Models
  firstClick: string; // какой код/campaign получает credit
  lastClick: string;
  linear: Record<string, number>; // распределение credit между всеми touchpoints

  finalAttribution: string; // выбранная модель (обычно last_click для SaaS)
}
```

**Use case:** Понять multi-touch attribution для сложных customer journeys

Example:
```
User Journey:
1. 2026-01-01 10:00 - Clicked link from Instagram (ref=INFLUENCER1)
2. 2026-01-01 10:15 - Signed up (no ref tracked - session expired)
3. 2026-01-03 14:30 - Clicked link from Google Ads (ref=GOOGLE_CPC)
4. 2026-01-03 14:35 - Made first purchase

First Click Attribution: INFLUENCER1 gets credit
Last Click Attribution: GOOGLE_CPC gets credit
Linear: 50% INFLUENCER1, 50% GOOGLE_CPC
```

---

## 📧 Раздел 6: BROADCAST & MESSAGING

### 6.1 Broadcast Campaign Builder

```typescript
interface BroadcastCampaign {
  id: number;
  name: string;

  // Audience
  targetSegment: string | CustomSegment;
  estimatedRecipients: number;

  // Message
  subject: string; // для email
  message: string; // markdown supported
  channel: 'email' | 'telegram' | 'both';

  // Scheduling
  sendAt: Date | 'immediate';
  timezone: string;

  // Personalization
  variables: Record<string, string>; // {{ userName }}, {{ planName }}

  // A/B Testing (optional)
  variants: {
    name: string;
    subject: string;
    message: string;
    weight: number; // % recipients
  }[];

  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentAt: Date | null;

  // Results
  stats: {
    sent: number;
    delivered: number;
    opened: number; // email only
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };

  createdBy: number; // admin user id
  createdAt: Date;
}
```

### 6.2 Segment Selector

**Pre-built Segments:**
- All Active Users (last 30 days)
- New Users (last 7 days)
- Churned Users (90+ days inactive)
- Free Plan Users (potential upgrades)
- Trial Ending Soon (3 days before end)
- Power Users (top 10% engagement)
- At-Risk Users (engagement dropping)

**Custom Segment (visual builder):**
```
Users where:
  [Plan] [equals] [Free]
  AND
  [Signup Date] [is after] [2026-01-01]
  AND
  [Transaction Count] [greater than] [10]
  AND
  [Last Active] [within last] [14 days]

Estimated: 347 users
```

### 6.3 Message Composer

**WYSIWYG Editor with:**
- Bold, italic, links
- Personalization variables dropdown: {{userName}}, {{planName}}, {{transactionCount}}
- Emoji picker
- Preview mode (desktop/mobile)
- Test send (to admin email/telegram)

**Template Library:**
```typescript
const templates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to BudgetBot, {{userName}}! 🎉',
    message: 'Hi {{userName}},\n\nThanks for signing up...',
  },
  {
    name: 'Upgrade Reminder',
    subject: 'Unlock Advanced Features',
    message: 'Hey {{userName}},\n\nYou\'ve created {{transactionCount}} transactions...',
  },
  {
    name: 'Re-engagement',
    subject: 'We miss you!',
    message: 'Hi {{userName}},\n\nWe noticed you haven\'t logged in for {{daysSinceActive}} days...',
  },
];
```

### 6.4 Campaign Analytics

```typescript
interface CampaignAnalytics {
  campaignId: number;

  // Delivery
  sent: number;
  delivered: number;
  bounced: number;
  deliveryRate: number; // %

  // Engagement (Email)
  opened: number;
  openRate: number; // %
  clicked: number;
  clickRate: number; // %
  clickToOpenRate: number; // % кто кликнул из открывших

  // Engagement (Telegram)
  read: number;
  replied: number;

  // Actions
  conversions: number; // сколько сделали целевое действие (upgrade, transaction)
  conversionRate: number;
  revenue: number; // если campaign привел к purchases

  // Negative
  unsubscribed: number;
  markedAsSpam: number;

  // Timeline
  timeline: {
    timestamp: Date;
    event: 'sent' | 'opened' | 'clicked' | 'converted';
    count: number;
  }[];
}
```

**Charts:**
- Email/Telegram opens over time (24h breakdown)
- Click heatmap (какие ссылки кликали)
- Conversion funnel (sent → opened → clicked → converted)

### 6.5 Automated Campaigns (Future)

```typescript
interface AutomatedCampaign {
  name: string;
  trigger: {
    event: 'user_signup' | 'plan_downgrade' | 'inactive_14_days' | 'goal_achieved';
    delay: number; // hours после события
  };

  message: BroadcastMessage;

  // Rules
  frequency: 'once' | 'daily' | 'weekly';
  stopConditions: {
    userConverted: boolean;
    userUnsubscribed: boolean;
    maxMessages: number;
  };

  isActive: boolean;
}
```

**Examples:**
- Welcome series (Day 0, 3, 7, 14)
- Winback campaign (inactive 30d, 60d, 90d)
- Upsell sequence (free user, 5 transactions → upgrade prompt)
- Retention campaign (at-risk users)

---

## 🔍 Раздел 7: SYSTEM MONITORING

### 7.1 System Health

```typescript
interface SystemHealth {
  // API Performance
  api: {
    uptime: number; // %
    avgResponseTime: number; // ms
    errorRate: number; // %
    requests24h: number;

    // By endpoint
    endpoints: {
      path: string;
      requests: number;
      avgTime: number;
      p95Time: number;
      errorRate: number;
    }[];
  };

  // Database
  database: {
    connections: number;
    maxConnections: number;
    slowQueries: number; // >1s
    size: number; // GB

    // Tables
    tables: {
      name: string;
      rows: number;
      size: number; // MB
    }[];
  };

  // External Services
  external: {
    telegram: { status: 'healthy' | 'degraded' | 'down', latency: number };
    openai: { status: 'healthy' | 'degraded' | 'down', latency: number };
    stripe: { status: 'healthy' | 'degraded' | 'down', latency: number };
    s3: { status: 'healthy' | 'degraded' | 'down', latency: number };
  };

  // Jobs
  jobs: {
    currencyUpdate: { lastRun: Date, status: 'success' | 'failed' };
    dailyNotifications: { lastRun: Date, status: 'success' | 'failed', sent: number };
    sessionCleanup: { lastRun: Date, status: 'success' | 'failed', deleted: number };
  };
}
```

**Alerts:**
- 🔴 API response time >500ms
- 🔴 Error rate >1%
- 🟡 Database connections >80% capacity
- 🟡 External service degraded

### 7.2 Error Logs

```typescript
interface ErrorLog {
  id: number;
  timestamp: Date;
  level: 'error' | 'warning' | 'critical';

  // Error details
  message: string;
  stack: string;

  // Context
  userId: number | null;
  endpoint: string;
  method: string;
  statusCode: number;

  // Request
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;

  // Environment
  environment: 'production' | 'staging';
  version: string;

  // Status
  resolved: boolean;
  resolvedBy: number | null;
  resolvedAt: Date | null;
}
```

**Filters:**
- Level (error, warning, critical)
- Date range
- Endpoint
- User
- Resolved/Unresolved

**Actions:**
- Mark as Resolved
- Assign to Developer
- Create GitHub Issue
- View Similar Errors

---

## 📝 Раздел 8: REPORTS & EXPORTS

### 8.1 Pre-built Reports

```typescript
const reports = [
  {
    name: 'Monthly Revenue Report',
    description: 'MRR, ARR, growth, churn',
    format: 'PDF | Excel',
    schedule: 'Monthly on 1st',
  },
  {
    name: 'User Acquisition Report',
    description: 'Signups, sources, conversion rates',
    format: 'PDF | Excel',
    schedule: 'Weekly on Monday',
  },
  {
    name: 'Cohort Retention Analysis',
    description: 'Retention by signup cohort',
    format: 'Excel',
    schedule: 'Monthly on 15th',
  },
  {
    name: 'Feature Adoption Report',
    description: 'Feature usage, adoption rates',
    format: 'PDF',
    schedule: 'Monthly on 1st',
  },
  {
    name: 'Referral Performance',
    description: 'Top referrers, conversion rates',
    format: 'Excel',
    schedule: 'Monthly on 1st',
  },
];
```

### 8.2 Custom Report Builder

```typescript
interface CustomReport {
  name: string;

  // Data source
  entity: 'users' | 'transactions' | 'payments' | 'referrals';

  // Columns
  columns: string[]; // ['name', 'email', 'plan', 'mrr', 'createdAt']

  // Filters
  filters: {
    field: string;
    operator: string;
    value: any;
  }[];

  // Aggregations (optional)
  groupBy: string[]; // ['plan', 'month']
  aggregations: {
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }[];

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Output
  format: 'csv' | 'excel' | 'pdf';

  // Schedule (optional)
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // для weekly
    dayOfMonth?: number; // для monthly
    time: string; // '09:00'
    recipients: string[]; // email addresses
  } | null;
}
```

**Example: "High-value inactive users report"**
```typescript
{
  name: 'High-value inactive users',
  entity: 'users',
  columns: ['id', 'name', 'email', 'ltv', 'lastActiveAt', 'transactionsCount'],
  filters: [
    { field: 'ltv', operator: '>', value: 50 },
    { field: 'lastActiveDays', operator: '>', value: 30 },
  ],
  sortBy: 'ltv',
  sortOrder: 'desc',
  format: 'excel',
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    time: '09:00',
    recipients: ['support@budgetbot.app'],
  },
}
```

### 8.3 Investor Deck Export

**One-click export для investor meetings:**

```typescript
interface InvestorDeck {
  period: 'last_month' | 'last_quarter' | 'last_year' | 'custom';
  customDateRange?: { from: Date; to: Date };

  // Slides
  slides: {
    cover: true;
    executiveSummary: true; // MRR, ARR, Users, Growth
    unitEconomics: true; // CAC, LTV, Payback Period
    userGrowth: true; // Charts
    revenueGrowth: true; // Charts
    cohortRetention: true; // Heatmap
    featureAdoption: true;
    roadmap: boolean; // manual content
    team: boolean; // manual content
  };

  // Branding
  logo: string;
  colorScheme: 'default' | 'dark' | 'custom';

  format: 'pdf' | 'powerpoint';
}
```

**Output:** Professional PDF/PPTX с:
- Branded cover
- Executive summary (1 page)
- Key metrics (cards + charts)
- Benchmarks сравнение с industry
- Auto-generated insights ("Retention improved by 15% QoQ")

---

## 🎨 DESIGN SYSTEM

### Colors

```css
/* Primary palette */
--admin-primary: #6366f1; /* Indigo */
--admin-success: #10b981; /* Green */
--admin-warning: #f59e0b; /* Amber */
--admin-danger: #ef4444; /* Red */
--admin-info: #3b82f6; /* Blue */

/* Backgrounds */
--admin-bg-primary: #ffffff;
--admin-bg-secondary: #f9fafb;
--admin-bg-tertiary: #f3f4f6;

/* Text */
--admin-text-primary: #111827;
--admin-text-secondary: #6b7280;
--admin-text-tertiary: #9ca3af;

/* Borders */
--admin-border-color: #e5e7eb;
```

### Typography

```css
/* Headers */
--font-display: 'Inter', sans-serif;
font-size-h1: 32px;
font-size-h2: 24px;
font-size-h3: 20px;
font-size-h4: 16px;

/* Body */
--font-body: 'Inter', sans-serif;
font-size-base: 14px;
font-size-sm: 12px;
font-size-xs: 11px;
```

### Components (shadcn/ui)

Использовать уже установленные компоненты:
- `Card` для метрик cards
- `Table` для всех таблиц
- `Dialog` для modals
- `Select`, `Input`, `Textarea` для форм
- `Badge` для статусов
- `Button` для actions
- `Tabs` для навигации внутри страниц
- `Alert` для уведомлений

### Charts (Recharts)

Стандарты для визуализаций:
- `LineChart` - для trends (MRR, users, retention)
- `BarChart` - для сравнений (revenue by plan, feature adoption)
- `PieChart` - для distributions (plan mix, churn reasons)
- `AreaChart` - для cumulative metrics (ARR growth)
- Custom Heatmap component - для cohort retention

---

## 📋 ПОШАГОВЫЙ ПЛАН РАЗРАБОТКИ

### Подход: Junior-Friendly + TDD

**Философия:**
1. **Small iterations** - каждая задача ≤ 2 hours
2. **Test-first** - пишем тест → пишем код → рефакторим
3. **Component isolation** - каждый компонент работает standalone
4. **Clear naming** - код читается как документация
5. **Type safety** - TypeScript strict mode

### Phase 0: Подготовка (1-2 дня)

#### 0.1 Database Schema Updates

**Tasks:**
- [ ] 0.1.1 Create `transaction_attachments` table migration
- [ ] 0.1.2 Create `admin_users` table migration
- [ ] 0.1.3 Create `admin_audit_log` table migration
- [ ] 0.1.4 Create `referral_programs` table migration
- [ ] 0.1.5 Create `referral_codes` table migration
- [ ] 0.1.6 Create `referral_conversions` table migration
- [ ] 0.1.7 Create `broadcast_campaigns` table migration
- [ ] 0.1.8 Run migrations на staging DB
- [ ] 0.1.9 Seed test data (faker.js)

**Testing:**
```typescript
describe('Admin Database Schema', () => {
  it('should create admin_users table', async () => {
    const result = await db.select().from(adminUsers);
    expect(result).toBeDefined();
  });

  it('should create transaction_attachments with foreign key', async () => {
    const attachment = await db.insert(transactionAttachments).values({
      transactionId: 1,
      fileUrl: 'https://...',
      fileName: 'receipt.jpg',
      mimeType: 'image/jpeg',
    });
    expect(attachment.id).toBeDefined();
  });
});
```

#### 0.2 Admin Auth Setup

**Tasks:**
- [ ] 0.2.1 Create `/server/routes/admin-auth.routes.ts`
- [ ] 0.2.2 Implement admin login endpoint (email + password)
- [ ] 0.2.3 Create admin session middleware
- [ ] 0.2.4 Add role-based permissions check
- [ ] 0.2.5 Add IP whitelist validation (optional)
- [ ] 0.2.6 Create audit log middleware

**Files to create:**
```
server/
  routes/
    admin-auth.routes.ts
  middleware/
    admin-auth.middleware.ts
    admin-audit.middleware.ts
  services/
    admin-auth.service.ts
```

**Testing:**
```typescript
describe('Admin Auth', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'test123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('should reject non-admin user', async () => {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'user@test.com', password: 'test123' });

    expect(response.status).toBe(403);
  });

  it('should log admin actions to audit log', async () => {
    // login as admin
    // perform action (e.g. ban user)
    // check audit_log table
  });
});
```

#### 0.3 Frontend Bootstrap

**Tasks:**
- [ ] 0.3.1 Create `/client/src/pages/admin/` folder structure
- [ ] 0.3.2 Setup admin routing (wouter)
- [ ] 0.3.3 Create admin layout component
- [ ] 0.3.4 Create admin login page
- [ ] 0.3.5 Setup protected routes (requireAdmin HOC)
- [ ] 0.3.6 Add admin navigation sidebar

**Files to create:**
```
client/src/
  pages/admin/
    auth/
      login.tsx
    dashboard/
      index.tsx
    users/
      list.tsx
      [id].tsx
    billing/
      index.tsx
    analytics/
      index.tsx
    referrals/
      index.tsx
    broadcasts/
      index.tsx
  components/admin/
    layout/
      AdminLayout.tsx
      AdminSidebar.tsx
      AdminHeader.tsx
    charts/
      MRRChart.tsx
      CohortHeatmap.tsx
    shared/
      MetricCard.tsx
      DataTable.tsx
```

**Testing:**
```typescript
describe('Admin Layout', () => {
  it('should render sidebar with navigation links', () => {
    render(<AdminLayout />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', () => {
    render(<AdminDashboard />);
    expect(window.location.pathname).toBe('/admin/login');
  });
});
```

### Phase 1: Executive Dashboard (3-4 дня)

#### 1.1 Backend: Metrics Aggregation

**Tasks:**
- [ ] 1.1.1 Create `/api/admin/metrics/hero` endpoint
  - MRR, ARR, Users, LTV, CAC
  - Write tests FIRST
  - Implement queries
  - Add caching (5 min TTL)

- [ ] 1.1.2 Create `/api/admin/metrics/revenue` endpoint
  - MRR breakdown, churn, NRR
  - Test with mock data
  - Optimize queries (EXPLAIN ANALYZE)

- [ ] 1.1.3 Create `/api/admin/metrics/growth` endpoint
  - User growth, activation, retention
  - Cohort queries

- [ ] 1.1.4 Create `/api/admin/metrics/unit-economics` endpoint
  - CAC, LTV, payback period calculations

**Example Test:**
```typescript
describe('GET /api/admin/metrics/hero', () => {
  it('should return hero metrics', async () => {
    // Seed: 100 users, 20 paying ($10/mo each)
    await seedTestData();

    const response = await request(app)
      .get('/api/admin/metrics/hero')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      mrr: { current: 200, change: expect.any(Number) },
      totalUsers: { current: 100 },
      ltv: expect.any(Number),
      cac: expect.any(Number),
    });
  });

  it('should calculate LTV:CAC ratio correctly', async () => {
    // Seed specific data
    await db.insert(users).values({ /* paying user */ });
    await db.insert(payments).values({ /* acquisition cost $30 */ });

    const response = await request(app).get('/api/admin/metrics/hero');

    // If LTV = $90, CAC = $30, ratio should be 3.0
    expect(response.body.ltvCacRatio).toBeCloseTo(3.0, 1);
  });
});
```

#### 1.2 Frontend: Dashboard Page

**Tasks:**
- [ ] 1.2.1 Create `<MetricCard>` component
  - Display metric with trend
  - Sparkline chart
  - Test rendering with various data

- [ ] 1.2.2 Create `<HeroMetrics>` section
  - 4 cards: MRR, Users, LTV, CAC
  - Fetch data from API
  - Loading states
  - Error handling

- [ ] 1.2.3 Create `<MRRChart>` component
  - Waterfall chart (Recharts)
  - Show New, Expansion, Contraction, Churn
  - Test with sample data

- [ ] 1.2.4 Create `<CohortRetentionHeatmap>` component
  - Custom heatmap (not in Recharts)
  - Color scale green (100%) → red (0%)
  - Hover tooltips

**Component Tests:**
```typescript
describe('<MetricCard />', () => {
  it('should display metric value', () => {
    render(<MetricCard title="MRR" value={1234.56} format="currency" />);
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('should show positive trend with green color', () => {
    render(<MetricCard value={100} change={15.5} />);
    const trend = screen.getByText('+15.5%');
    expect(trend).toHaveClass('text-green-600');
  });

  it('should render sparkline when trend data provided', () => {
    const trend = [10, 15, 12, 18, 20];
    render(<MetricCard value={20} trend={trend} />);
    expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument();
  });
});

describe('<MRRChart />', () => {
  it('should render waterfall bars', () => {
    const data = {
      newMRR: 500,
      expansionMRR: 200,
      contractionMRR: -50,
      churnedMRR: -100,
    };
    render(<MRRChart data={data} />);

    expect(screen.getByText('New MRR')).toBeInTheDocument();
    expect(screen.getByText('Expansion')).toBeInTheDocument();
  });
});
```

#### 1.3 Integration

**Tasks:**
- [ ] 1.3.1 Wire up API calls with TanStack Query
- [ ] 1.3.2 Add loading skeletons
- [ ] 1.3.3 Add error boundaries
- [ ] 1.3.4 Add refresh button
- [ ] 1.3.5 Test with production-like data volumes

**Integration Test:**
```typescript
describe('Admin Dashboard Integration', () => {
  it('should load and display all metrics', async () => {
    render(<AdminDashboard />);

    // Loading state
    expect(screen.getByTestId('hero-metrics-skeleton')).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText(/MRR/i)).toBeInTheDocument();
      expect(screen.getByText(/\$\d+/)).toBeInTheDocument();
    });

    // Charts rendered
    expect(screen.getByTestId('mrr-chart')).toBeInTheDocument();
    expect(screen.getByTestId('cohort-heatmap')).toBeInTheDocument();
  });
});
```

### Phase 2: Users Management (4-5 дней)

#### 2.1 Backend: Users API

**Tasks:**
- [ ] 2.1.1 Create `/api/admin/users` endpoint (list with filters)
- [ ] 2.1.2 Create `/api/admin/users/:id` endpoint (detail)
- [ ] 2.1.3 Create `/api/admin/users/:id/transactions` endpoint
- [ ] 2.1.4 Create `/api/admin/users/:id/ai-chat-history` endpoint
- [ ] 2.1.5 Create `/api/admin/users/:id/timeline` endpoint
- [ ] 2.1.6 Create PATCH `/api/admin/users/:id` (edit)
- [ ] 2.1.7 Create POST `/api/admin/users/:id/block` action
- [ ] 2.1.8 Create POST `/api/admin/users/:id/change-plan` action

**Tests:**
```typescript
describe('GET /api/admin/users', () => {
  it('should return paginated users', async () => {
    const response = await request(app)
      .get('/api/admin/users?page=1&limit=20');

    expect(response.body.users).toHaveLength(20);
    expect(response.body.total).toBeDefined();
    expect(response.body.page).toBe(1);
  });

  it('should filter by plan', async () => {
    const response = await request(app)
      .get('/api/admin/users?plan=pro');

    response.body.users.forEach(user => {
      expect(user.plan).toBe('pro');
    });
  });

  it('should search by name or email', async () => {
    const response = await request(app)
      .get('/api/admin/users?search=john');

    response.body.users.forEach(user => {
      const match = user.name.includes('john') || user.email.includes('john');
      expect(match).toBe(true);
    });
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('should update user plan', async () => {
    const response = await request(app)
      .patch('/api/admin/users/123')
      .send({ plan: 'pro' });

    expect(response.status).toBe(200);
    expect(response.body.plan).toBe('pro');
  });

  it('should log action to audit log', async () => {
    await request(app)
      .patch('/api/admin/users/123')
      .send({ plan: 'pro' });

    const log = await db.select().from(adminAuditLog).where(eq(adminAuditLog.entityId, '123'));
    expect(log[0].action).toBe('user.plan_changed');
  });
});
```

#### 2.2 Frontend: Users Table

**Tasks:**
- [ ] 2.2.1 Create `<UsersTable>` component
  - TanStack Table для sorting/filtering
  - Test sorting by different columns

- [ ] 2.2.2 Add filters sidebar
  - Status, Plan, Date range
  - Test filter combinations

- [ ] 2.2.3 Add search input (debounced)
  - Test debouncing works

- [ ] 2.2.4 Add pagination
  - Test page navigation

- [ ] 2.2.5 Add bulk actions
  - Select multiple users
  - Export, Change plan, Block

**Component Tests:**
```typescript
describe('<UsersTable />', () => {
  it('should render user rows', () => {
    const users = [
      { id: 1, name: 'John', email: 'john@test.com', plan: 'free' },
      { id: 2, name: 'Jane', email: 'jane@test.com', plan: 'pro' },
    ];
    render(<UsersTable users={users} />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
  });

  it('should sort by column', async () => {
    render(<UsersTable users={mockUsers} />);

    const nameHeader = screen.getByText('Name');
    await userEvent.click(nameHeader);

    // Check first row is alphabetically first
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alice');
  });

  it('should filter by plan', async () => {
    render(<UsersTable users={mockUsers} />);

    const planFilter = screen.getByLabelText('Plan');
    await userEvent.selectOptions(planFilter, 'pro');

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(mockUsers.filter(u => u.plan === 'pro').length + 1); // +1 header
  });
});
```

#### 2.3 Frontend: User Detail Page

**Tasks:**
- [ ] 2.3.1 Create `<UserProfile>` component
- [ ] 2.3.2 Create `<UserTransactions>` component with attachments viewer
- [ ] 2.3.3 Create `<UserAIChatHistory>` component
- [ ] 2.3.4 Create `<UserFunnelProgress>` component
- [ ] 2.3.5 Create `<UserTimeline>` component
- [ ] 2.3.6 Add edit modals (plan, status)
- [ ] 2.3.7 Add impersonation link (login as user)

### Phase 3: Attachments Migration (2 дня)

**CRITICAL: Добавить поддержку фото чеков**

#### 3.1 Backend

**Tasks:**
- [ ] 3.1.1 Update transaction creation to accept attachments
- [ ] 3.1.2 Create file upload handler (S3/CloudFlare R2)
- [ ] 3.1.3 Create `/api/transactions/:id/attachments` endpoint
- [ ] 3.1.4 Update Telegram bot to save file_id при OCR scan
- [ ] 3.1.5 Create admin report: transactions without receipts

**Tests:**
```typescript
describe('POST /api/transactions with attachment', () => {
  it('should upload file and create attachment record', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .field('amount', '45.50')
      .field('description', 'Groceries')
      .attach('receipt', './test/fixtures/receipt.jpg');

    expect(response.status).toBe(201);
    expect(response.body.hasAttachment).toBe(true);

    const attachments = await db.select().from(transactionAttachments)
      .where(eq(transactionAttachments.transactionId, response.body.id));

    expect(attachments).toHaveLength(1);
    expect(attachments[0].fileUrl).toContain('https://');
  });
});
```

#### 3.2 Frontend

**Tasks:**
- [ ] 3.2.1 Add file upload to transaction form
- [ ] 3.2.2 Create `<ReceiptViewer>` component (lightbox)
- [ ] 3.2.3 Show receipts in admin user detail → transactions tab
- [ ] 3.2.4 Add "Missing Receipt" badge для transactions without attachments

### Phase 4: Billing & Revenue (3 дня)

[Детали аналогично Phases 1-3]

### Phase 5: Referral System (4-5 дней)

[Детали аналогично Phases 1-3]

### Phase 6: Broadcasts (3-4 дня)

[Детали аналогично Phases 1-3]

### Phase 7: Analytics & Reports (3-4 дня)

[Детали аналогично Phases 1-3]

---

## 🔧 TECHNICAL STACK SUMMARY

```typescript
// Backend
express + tsx
PostgreSQL (already using)
Drizzle ORM (already using)
TanStack Query (already using)

// Frontend
React + TypeScript (already using)
TailwindCSS (already using)
shadcn/ui components (already using)
Recharts для визуализаций
TanStack Table для data tables

// New Dependencies
@tanstack/react-table
date-fns (для date formatting)
recharts (уже есть)
react-dropzone (для file uploads)
lucide-react (уже есть)

// Testing
Vitest (уже настроен)
React Testing Library
Playwright (для E2E)
MSW (mock service worker для API mocking)
```

---

## 📐 ACCEPTANCE CRITERIA

### Общие требования:
- ✅ Все компоненты покрыты юнит-тестами (>80% coverage)
- ✅ Критические flows покрыты интеграционными тестами
- ✅ TypeScript strict mode, 0 any types
- ✅ Все endpoints защищены admin auth middleware
- ✅ Все admin actions логируются в audit_log
- ✅ Responsive design (desktop only acceptable для MVP)
- ✅ Loading states для всех async операций
- ✅ Error boundaries для graceful degradation
- ✅ Документация API (Swagger/OpenAPI)

### Метрики качества:
- Lighthouse Performance Score >90
- Bundle size <500KB (gzipped)
- API response time p95 <200ms
- Zero console errors in production
- WCAG 2.1 AA compliance (accessibility)

---

## 🚀 DEPLOYMENT

### Staging Environment
```
https://admin-staging.budgetbot.app
```

### Production
```
https://admin.budgetbot.app
```

### CI/CD Pipeline
1. Push to `feature/admin-*` branch
2. Run tests (unit + integration)
3. Build frontend
4. Deploy to staging
5. Run E2E tests (Playwright)
6. Manual QA approval
7. Merge to `main`
8. Deploy to production

---

## 📚 REFERENCES & SOURCES

### SaaS Metrics Best Practices:
- [12 key SaaS Metrics And KPIs You Should Track in 2026](https://www.thoughtspot.com/data-trends/dashboard/saas-metrics-kpis)
- [SaaS Dashboard: Metrics, KPIs, and Examples | Klipfolio](https://www.klipfolio.com/resources/dashboard-examples/saas)
- [15 Essential SaaS Metrics Every Founder Must Track in 2026](https://www.averi.ai/blog/15-essential-saas-metrics-every-founder-must-track-in-2026-(with-benchmarks))
- [Understanding CAC and LTV for B2B SaaS Growth](https://gripped.io/b2b-saas/b2b-saas-cac-ltv-metrics-guide/)
- [LTV/CAC Ratio | SaaS Formula + Calculator](https://www.wallstreetprep.com/knowledge/ltv-cac-ratio/)

### Referral Systems:
- [SaaS Referral Attribution Guide 2024](https://www.prefinery.com/blog/saas-referral-attribution-guide-2024/)
- [Referral Program Best Practices to Boost Your SaaS Growth](https://refgrow.com/blog/referral-program-best-practices)
- [SaaS Referral Tracking: Setup Guide 2024](https://www.prefinery.com/blog/saas-referral-tracking-setup-guide-2024/)
- [10 Key Referral Program Metrics to Track [2025]](https://www.prefinery.com/blog/10-key-referral-program-metrics-to-track-2025/)

### Admin Panel Design:
- [SaaS Dashboards: Types, Best Practices and Examples](https://www.netsuite.com/portal/resource/articles/erp/saas-dashboards.shtml)
- [Top 9+ SaaS Dashboard Templates for 2026](https://tailadmin.com/blog/saas-dashboard-templates)
- [SaaS Executive Dashboard: Key Metrics & Examples](https://www.klipfolio.com/resources/dashboard-examples/saas/saas-executive-dashboard)

---

## ✅ NEXT STEPS

1. **Review this document** с командой/стейкхолдерами
2. **Prioritize features** - какие разделы critical для MVP?
3. **Setup project structure** - создать folders, routes
4. **Start Phase 0** - database migrations и auth
5. **Daily standups** для tracking прогресса

**Estimated Total Time:** 25-30 рабочих дней (5-6 недель)

**Team Size:** 1-2 разработчика (Junior-friendly)

---

**Questions? Feedback? Изменения в приоритетах?**

Готов обсудить и доработать любые секции! 🚀
