/**
 * Mock Metrics Data
 *
 * Realistic mock data for admin dashboard metrics
 * Junior-Friendly: Simple objects, clear structure
 */

export interface MockHeroMetrics {
  mrr: {
    current: number;
    change: number; // % change from last month
    trend: number[]; // 12 months of data
  };
  totalUsers: {
    current: number;
    activeToday: number;
    change: number; // % change
  };
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

export interface MockRevenueMetrics {
  mrr: {
    total: number;
    newMRR: number;
    expansionMRR: number;
    contractionMRR: number;
    churnedMRR: number;
  };
  arr: number;
  arpu: number;
  arpuByPlan: Record<string, number>;
  churn: {
    userChurnRate: number;
    revenueChurnRate: number;
    netRevenueRetention: number;
  };
}

export interface MockGrowthMetrics {
  userGrowth: {
    total: number;
    mau: number; // Monthly Active Users
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
    mauDauRatio: number;
  };
  activation: {
    signupToFirstTransaction: number; // %
    avgTimeToActivation: number; // hours
    d1Retention: number;
    d7Retention: number;
    d30Retention: number;
  };
}

// Generate trend data (12 months)
function generateTrend(startValue: number, growthRate: number): number[] {
  const trend: number[] = [];
  let current = startValue;
  
  for (let i = 0; i < 12; i++) {
    trend.push(Math.round(current * 100) / 100);
    current = current * (1 + growthRate / 100);
  }
  
  return trend;
}

export const mockHeroMetrics: MockHeroMetrics = {
  mrr: {
    current: 12500.50,
    change: 12.5,
    trend: generateTrend(8500, 1.2), // Starting from $8500, 1.2% monthly growth
  },
  totalUsers: {
    current: 1250,
    activeToday: 342,
    change: 8.3,
  },
  ltv: 89.50,
  cac: 28.30,
  ltvCacRatio: 3.16,
};

export const mockRevenueMetrics: MockRevenueMetrics = {
  mrr: {
    total: 12500.50,
    newMRR: 850.00,
    expansionMRR: 320.00,
    contractionMRR: -150.00,
    churnedMRR: -200.00,
  },
  arr: 150006.00,
  arpu: 10.00,
  arpuByPlan: {
    free: 0,
    byok: 0,
    starter: 4.99,
    pro: 9.99,
  },
  churn: {
    userChurnRate: 5.2, // %
    revenueChurnRate: 3.8, // %
    netRevenueRetention: 102.5, // %
  },
};

export const mockGrowthMetrics: MockGrowthMetrics = {
  userGrowth: {
    total: 1250,
    mau: 890,
    dau: 342,
    wau: 567,
    mauDauRatio: 0.38, // 38% of MAU are DAU
  },
  activation: {
    signupToFirstTransaction: 68.5, // %
    avgTimeToActivation: 4.2, // hours
    d1Retention: 72.3,
    d7Retention: 58.1,
    d30Retention: 45.2,
  },
};

