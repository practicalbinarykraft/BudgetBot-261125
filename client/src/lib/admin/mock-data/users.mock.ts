/**
 * Mock Users Data
 *
 * Realistic mock data for admin users table
 * Junior-Friendly: Simple array, easy to understand
 */

export interface MockUser {
  id: number;
  name: string;
  email: string;
  telegram: {
    id: string;
    username: string;
  } | null;
  status: 'active' | 'inactive' | 'blocked' | 'churned';
  plan: 'free' | 'byok' | 'starter' | 'pro';
  lastActiveAt: Date;
  daysSinceSignup: number;
  transactionsCount: number;
  mrr: number;
  ltv: number;
  totalSpent: number;
  referralCode: string | null;
  referralsCount: number;
  referredBy: string | null;
  stage: 'trial' | 'activated' | 'engaged' | 'power_user' | 'at_risk' | 'churned';
  createdAt: Date;
  // Credits and Limits
  credits: {
    total: number;
    used: number;
    remaining: number;
  };
  // Marketing & Attribution
  acquisition: {
    source: 'organic' | 'google' | 'facebook' | 'twitter' | 'referral' | 'direct' | 'other';
    campaign: string | null;
    medium: string | null;
    cac: number; // Customer Acquisition Cost
    firstTouchDate: Date;
  };
  // Engagement Metrics
  engagement: {
    score: number; // 0-100
    dau: number; // Days active in last 30 days
    mau: number; // Months active
    lastFeatureUsed: string | null;
  };
  // Support
  support: {
    ticketsCount: number;
    lastTicketDate: Date | null;
  };
  // Tags and Notes
  tags: string[];
  notes: string | null;
  // Payment History
  paymentHistory: {
    id: number;
    date: Date;
    amount: number;
    type: 'subscription' | 'one_time' | 'refund';
    status: 'completed' | 'pending' | 'failed';
    description: string;
  }[];
  // Feature Usage
  featureUsage: {
    feature: string;
    usageCount: number;
    lastUsed: Date | null;
    adoptionDate: Date | null;
  }[];
  // A/B Tests
  abTests: {
    testName: string;
    variant: string;
    enrolledAt: Date;
  }[];
  // Risk Score
  riskScore: {
    score: number; // 0-100, higher = more risk
    factors: string[];
    lastCalculated: Date;
  };
  // Next Best Action
  nextBestAction: {
    action: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  } | null;
}

// Generate mock users with deterministic seed for consistent results
function generateMockUsers(count: number): MockUser[] {
  const names = [
    'Иван Иванов', 'Мария Петрова', 'Алексей Сидоров', 'Елена Козлова',
    'Дмитрий Волков', 'Анна Смирнова', 'Сергей Лебедев', 'Ольга Новикова',
    'Павел Морозов', 'Татьяна Федорова', 'Николай Соколов', 'Юлия Попова',
    'Андрей Леонов', 'Наталья Семенова', 'Владимир Егоров', 'Ирина Павлова',
    'John Smith', 'Jane Doe', 'Michael Johnson', 'Emily Williams',
    'David Brown', 'Sarah Davis', 'Robert Miller', 'Lisa Wilson',
    'James Moore', 'Jennifer Taylor', 'William Anderson', 'Jessica Thomas',
  ];

  const plans: MockUser['plan'][] = ['free', 'byok', 'starter', 'pro'];
  const statuses: MockUser['status'][] = ['active', 'inactive', 'blocked', 'churned'];
  const stages: MockUser['stage'][] = ['trial', 'activated', 'engaged', 'power_user', 'at_risk', 'churned'];

  // Simple seeded random function for deterministic results
  let seed = 12345;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const users: MockUser[] = [];

  for (let i = 1; i <= count; i++) {
    const nameIndex = i % names.length;
    const name = names[nameIndex];
    const email = `user${i}@example.com`;
    
    // Deterministic selection based on index
    const planIndex = (i * 7) % plans.length;
    const statusIndex = (i * 11) % statuses.length;
    const stageIndex = (i * 13) % stages.length;
    
    const plan = plans[planIndex];
    const status = statuses[statusIndex];
    const stage = stages[stageIndex];
    
    const daysSinceSignup = 30 + (i * 3) % 335; // 30-365 days
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysSinceSignup);

    const lastActiveDays = Math.max(0, daysSinceSignup - (i * 5) % 30); // Active within last 30 days
    const lastActiveAt = new Date();
    lastActiveAt.setDate(lastActiveAt.getDate() - lastActiveDays);
    
    // Define referralsCount early to avoid reference errors
    const referralsCount = (i * 3) % 10;

    const transactionsCount = 10 + (i * 7) % 190; // 10-200 transactions
    const mrr = plan === 'free' ? 0 : plan === 'pro' ? 9.99 : plan === 'starter' ? 4.99 : 0;
    const monthsActive = Math.floor(daysSinceSignup / 30);
    const ltv = mrr * Math.max(1, monthsActive);
    const totalSpent = ltv * (0.85 + (i % 20) / 100); // 85-105% of LTV

    const hasTelegram = (i % 3) !== 0; // 66% have telegram
    const hasReferral = (i % 2) === 0; // 50% have referral code

    // Credits based on plan
    const creditsTotal = plan === 'pro' ? 1000 : plan === 'starter' ? 500 : plan === 'free' ? 100 : 0;
    const creditsUsed = Math.floor(creditsTotal * (0.1 + (i % 80) / 100)); // 10-90% used
    const creditsRemaining = creditsTotal - creditsUsed;

    // Acquisition source
    const sources: Array<'organic' | 'google' | 'facebook' | 'twitter' | 'referral' | 'direct' | 'other'> = 
      ['organic', 'google', 'facebook', 'twitter', 'referral', 'direct', 'other'];
    const sourceIndex = (i * 17) % sources.length;
    const acquisitionSource = sources[sourceIndex];
    const cac = acquisitionSource === 'organic' || acquisitionSource === 'referral' ? 0 : 
                acquisitionSource === 'google' ? 25 + (i % 30) : 
                acquisitionSource === 'facebook' ? 15 + (i % 20) : 
                acquisitionSource === 'twitter' ? 10 + (i % 15) : 5 + (i % 10);

    // Engagement metrics
    const dau = Math.floor((i * 5) % 30); // Days active in last 30
    const mau = Math.floor(daysSinceSignup / 30);
    const engagementScore = Math.min(100, Math.floor((dau / 30) * 50 + (transactionsCount / 10) * 30 + (mrr > 0 ? 20 : 0)));
    const lastFeatures = ['ai_chat', 'ocr_scan', 'budget_setup', 'analytics', 'telegram_bot', null];
    const lastFeatureUsed = lastFeatures[(i * 7) % lastFeatures.length];

    // Support
    const hasSupportTickets = (i % 10) < 2; // 20% have support tickets
    const supportTicketsCount = hasSupportTickets ? (i % 5) + 1 : 0;
    const lastTicketDate = hasSupportTickets ? new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000) : null;

    // Tags
    const allTags = ['vip', 'beta_tester', 'early_adopter', 'power_user', 'at_risk', 'champion'];
    const userTags: string[] = [];
    if (plan === 'pro') userTags.push('vip');
    if (i < 20) userTags.push('early_adopter');
    if (transactionsCount > 100) userTags.push('power_user');
    if (stage === 'at_risk') userTags.push('at_risk');
    if (referralsCount > 5) userTags.push('champion');

    // Notes
    const notes = i % 15 === 0 ? `User ${i}: Special note - ${plan} plan, ${status} status` : null;

    // Payment History
    const paymentHistory = [];
    if (mrr > 0) {
      const monthsPaid = Math.floor(daysSinceSignup / 30);
      for (let m = 0; m < Math.min(monthsPaid, 12); m++) {
        const paymentDate = new Date(createdAt);
        paymentDate.setMonth(paymentDate.getMonth() + m);
        paymentHistory.push({
          id: i * 1000 + m,
          date: paymentDate,
          amount: mrr,
          type: 'subscription' as const,
          status: m === monthsPaid - 1 && (i % 10) === 0 ? 'pending' as const : 'completed' as const,
          description: `${plan} plan - ${paymentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        });
      }
    }

    // Feature Usage
    const features = [
      { name: 'ai_chat', baseUsage: 10 },
      { name: 'ocr_scan', baseUsage: 5 },
      { name: 'budget_setup', baseUsage: 3 },
      { name: 'analytics', baseUsage: 8 },
      { name: 'telegram_bot', baseUsage: 15 },
      { name: 'recurring_transactions', baseUsage: 4 },
      { name: 'wishlist', baseUsage: 2 },
    ];
    const featureUsage = features.map((f, idx) => {
      const usageCount = Math.floor(f.baseUsage * (1 + (i % 5) / 5));
      const adopted = (i * 7 + idx) % 3 === 0;
      const adoptionDate = adopted ? new Date(createdAt.getTime() + (idx * 5 + 1) * 24 * 60 * 60 * 1000) : null;
      const lastUsed = adopted ? new Date(Date.now() - (idx * 2) * 24 * 60 * 60 * 1000) : null;
      return {
        feature: f.name,
        usageCount,
        lastUsed,
        adoptionDate,
      };
    });

    // A/B Tests
    const abTests: { testName: string; variant: string; enrolledAt: Date }[] = [];
    const testNames = ['onboarding_v2', 'pricing_page_v3', 'dashboard_layout', 'ai_suggestions'];
    testNames.forEach((testName, idx) => {
      if ((i * 11 + idx) % 3 === 0) {
        const variants = ['control', 'variant_a', 'variant_b'];
        abTests.push({
          testName,
          variant: variants[(i * 13 + idx) % variants.length],
          enrolledAt: new Date(createdAt.getTime() + idx * 7 * 24 * 60 * 60 * 1000),
        });
      }
    });

    // Risk Score
    let riskScore = 0;
    const riskFactors: string[] = [];
    if (daysSinceSignup > 30 && dau < 5) {
      riskScore += 30;
      riskFactors.push('Low activity');
    }
    if (stage === 'at_risk') {
      riskScore += 40;
      riskFactors.push('At risk stage');
    }
    if (mrr > 0 && lastActiveDays > 14) {
      riskScore += 20;
      riskFactors.push('Inactive paid user');
    }
    if (supportTicketsCount > 3) {
      riskScore += 10;
      riskFactors.push('Multiple support tickets');
    }
    if (engagementScore < 30) {
      riskScore += 20;
      riskFactors.push('Low engagement');
    }
    riskScore = Math.min(100, riskScore);

    // Next Best Action
    let nextBestAction: { action: string; reason: string; priority: 'high' | 'medium' | 'low' } | null = null;
    if (riskScore > 60) {
      nextBestAction = {
        action: 'Reach out to prevent churn',
        reason: 'High risk score detected',
        priority: 'high' as const,
      };
    } else if (mrr === 0 && transactionsCount > 20) {
      nextBestAction = {
        action: 'Offer upgrade to Pro',
        reason: 'Active user on free plan',
        priority: 'high' as const,
      };
    } else if (engagementScore > 70 && referralsCount === 0) {
      nextBestAction = {
        action: 'Ask for referral',
        reason: 'High engagement, no referrals yet',
        priority: 'medium' as const,
      };
    } else if (creditsRemaining < creditsTotal * 0.1 && plan === 'free') {
      nextBestAction = {
        action: 'Offer credit top-up',
        reason: 'Credits running low',
        priority: 'medium' as const,
      };
    } else if (lastActiveDays > 7) {
      nextBestAction = {
        action: 'Send re-engagement email',
        reason: 'User inactive for a week',
        priority: 'low' as const,
      };
    }

    users.push({
      id: i,
      name,
      email,
      telegram: hasTelegram ? {
        id: String(100000000 + i),
        username: `user${i}_tg`,
      } : null,
      status,
      plan,
      lastActiveAt,
      daysSinceSignup,
      transactionsCount,
      mrr,
      ltv: Math.round(ltv * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      referralCode: hasReferral ? `REF${i}` : null,
      referralsCount,
      referredBy: i > 5 && (i % 7) === 0 ? `REF${i - 5}` : null,
      stage,
      createdAt,
      credits: {
        total: creditsTotal,
        used: creditsUsed,
        remaining: creditsRemaining,
      },
      acquisition: {
        source: acquisitionSource,
        campaign: acquisitionSource !== 'organic' && acquisitionSource !== 'direct' ? `campaign_${i % 5}` : null,
        medium: acquisitionSource !== 'organic' && acquisitionSource !== 'direct' ? 'cpc' : null,
        cac: Math.round(cac * 100) / 100,
        firstTouchDate: createdAt,
      },
      engagement: {
        score: engagementScore,
        dau,
        mau,
        lastFeatureUsed,
      },
      support: {
        ticketsCount: supportTicketsCount,
        lastTicketDate,
      },
      tags: userTags,
      notes,
      paymentHistory,
      featureUsage,
      abTests,
      riskScore: {
        score: riskScore,
        factors: riskFactors,
        lastCalculated: new Date(),
      },
      nextBestAction,
    });
  }

  return users;
}

// Generate 150 users
export const mockUsers: MockUser[] = generateMockUsers(150);

