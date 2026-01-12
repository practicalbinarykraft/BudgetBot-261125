/**
 * Mock Analytics Data
 *
 * Realistic mock data for analytics dashboard
 * Junior-Friendly: Simple objects, clear structure
 */

export interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number; // % from previous step
  dropoffRate: number; // % who dropped off
  avgTimeToNext: number; // hours
}

export interface FeatureAdoption {
  feature: string;
  totalUsers: number; // who used at least once
  activeUsers: number; // used in last 30 days
  adoptionRate: number; // % of all users
  avgUsagePerUser: number; // times per month
  powerUsers: number; // use >10 times/month
  retentionLift: number; // % higher retention
  conversionLift: number; // % higher upgrade rate
  trend: { date: string; users: number }[];
}

export interface UserSegment {
  name: string;
  description: string;
  count: number;
  criteria: string;
}

// Funnel Analysis Data
export const mockFunnelData: FunnelStep[] = [
  {
    step: 'Landed on page',
    users: 10000,
    conversionRate: 100,
    dropoffRate: 0,
    avgTimeToNext: 0,
  },
  {
    step: 'Started signup',
    users: 5000,
    conversionRate: 50,
    dropoffRate: 50,
    avgTimeToNext: 0.1,
  },
  {
    step: 'Completed signup',
    users: 4000,
    conversionRate: 80,
    dropoffRate: 20,
    avgTimeToNext: 0.5,
  },
  {
    step: 'Connected Telegram',
    users: 3200,
    conversionRate: 80,
    dropoffRate: 20,
    avgTimeToNext: 2,
  },
  {
    step: 'First transaction',
    users: 2400,
    conversionRate: 75,
    dropoffRate: 25,
    avgTimeToNext: 24,
  },
  {
    step: 'Created budget',
    users: 1800,
    conversionRate: 75,
    dropoffRate: 25,
    avgTimeToNext: 48,
  },
  {
    step: 'Upgraded to paid',
    users: 360,
    conversionRate: 20,
    dropoffRate: 80,
    avgTimeToNext: 0,
  },
];

// Feature Adoption Data
export const mockFeatureAdoption: FeatureAdoption[] = [
  {
    feature: 'AI Chat',
    totalUsers: 890,
    activeUsers: 567,
    adoptionRate: 71.2,
    avgUsagePerUser: 8.5,
    powerUsers: 234,
    retentionLift: 15.3,
    conversionLift: 12.5,
    trend: [
      { date: '2025-07', users: 650 },
      { date: '2025-08', users: 720 },
      { date: '2025-09', users: 780 },
      { date: '2025-10', users: 820 },
      { date: '2025-11', users: 860 },
      { date: '2025-12', users: 890 },
    ],
  },
  {
    feature: 'OCR Receipt Scan',
    totalUsers: 567,
    activeUsers: 342,
    adoptionRate: 45.4,
    avgUsagePerUser: 12.3,
    powerUsers: 156,
    retentionLift: 18.7,
    conversionLift: 8.2,
    trend: [
      { date: '2025-07', users: 420 },
      { date: '2025-08', users: 480 },
      { date: '2025-09', users: 520 },
      { date: '2025-10', users: 540 },
      { date: '2025-11', users: 555 },
      { date: '2025-12', users: 567 },
    ],
  },
  {
    feature: 'Budget Creation',
    totalUsers: 1120,
    activeUsers: 890,
    adoptionRate: 89.6,
    avgUsagePerUser: 3.2,
    powerUsers: 45,
    retentionLift: 22.1,
    conversionLift: 15.8,
    trend: [
      { date: '2025-07', users: 980 },
      { date: '2025-08', users: 1020 },
      { date: '2025-09', users: 1060 },
      { date: '2025-10', users: 1080 },
      { date: '2025-11', users: 1100 },
      { date: '2025-12', users: 1120 },
    ],
  },
  {
    feature: 'Goal Setting',
    totalUsers: 780,
    activeUsers: 623,
    adoptionRate: 62.4,
    avgUsagePerUser: 2.1,
    powerUsers: 89,
    retentionLift: 19.5,
    conversionLift: 10.3,
    trend: [
      { date: '2025-07', users: 650 },
      { date: '2025-08', users: 690 },
      { date: '2025-09', users: 720 },
      { date: '2025-10', users: 750 },
      { date: '2025-11', users: 770 },
      { date: '2025-12', users: 780 },
    ],
  },
  {
    feature: 'Recurring Transactions',
    totalUsers: 623,
    activeUsers: 512,
    adoptionRate: 49.8,
    avgUsagePerUser: 5.4,
    powerUsers: 123,
    retentionLift: 14.2,
    conversionLift: 7.1,
    trend: [
      { date: '2025-07', users: 520 },
      { date: '2025-08', users: 560 },
      { date: '2025-09', users: 580 },
      { date: '2025-10', users: 600 },
      { date: '2025-11', users: 615 },
      { date: '2025-12', users: 623 },
    ],
  },
  {
    feature: 'Multi-currency',
    totalUsers: 445,
    activeUsers: 389,
    adoptionRate: 35.6,
    avgUsagePerUser: 15.2,
    powerUsers: 67,
    retentionLift: 11.8,
    conversionLift: 5.4,
    trend: [
      { date: '2025-07', users: 380 },
      { date: '2025-08', users: 400 },
      { date: '2025-09', users: 420 },
      { date: '2025-10', users: 430 },
      { date: '2025-11', users: 440 },
      { date: '2025-12', users: 445 },
    ],
  },
];

// User Segments
export const mockUserSegments: UserSegment[] = [
  {
    name: 'New Users',
    description: 'Signed up in last 7 days',
    count: 87,
    criteria: 'signupDays <= 7',
  },
  {
    name: 'Activated',
    description: 'Created at least one transaction',
    count: 890,
    criteria: 'transactionsCount > 0',
  },
  {
    name: 'Power Users',
    description: 'High engagement, many transactions',
    count: 234,
    criteria: 'transactionsCount > 50 AND dau > 20',
  },
  {
    name: 'At Risk',
    description: 'Inactive for 30-90 days',
    count: 156,
    criteria: 'lastActiveDays > 30 AND lastActiveDays < 90',
  },
  {
    name: 'Churned',
    description: 'Inactive for 90+ days',
    count: 89,
    criteria: 'lastActiveDays >= 90',
  },
  {
    name: 'Free Forever',
    description: 'Free plan, signed up >30 days ago',
    count: 445,
    criteria: 'plan = free AND signupDays > 30',
  },
  {
    name: 'BYOK Users',
    description: 'Using own API keys',
    count: 123,
    criteria: 'plan = byok',
  },
  {
    name: 'Paying',
    description: 'Active subscription',
    count: 567,
    criteria: 'mrr > 0',
  },
  {
    name: 'High Value',
    description: 'LTV > $100',
    count: 234,
    criteria: 'ltv > 100',
  },
  {
    name: 'AI Power Users',
    description: 'Heavy AI chat usage',
    count: 156,
    criteria: 'aiChatMessages > 50',
  },
  {
    name: 'OCR Enthusiasts',
    description: 'Frequent receipt scanning',
    count: 89,
    criteria: 'ocrScans > 20',
  },
  {
    name: 'Referral Users',
    description: 'Came via referral',
    count: 234,
    criteria: 'referredBy IS NOT NULL',
  },
];

