/**
 * Forecast Filters Service
 * 
 * Helper functions to calculate additional income/expense for forecast filters:
 * - Recurring transactions
 * - Planned income
 * - Planned expenses  
 * - Budget limits
 */

import { storage } from "../storage";

/**
 * Check if recurring transaction should occur on given date
 * Uses iterative approach to ensure proper cadence alignment
 */
function shouldOccurOnDate(
  nextDateStr: string,
  frequency: string,
  targetDate: Date
): boolean {
  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  // Can't occur before nextDate
  if (target < nextDate) {
    return false;
  }
  
  // Exact match on nextDate
  if (nextDate.getTime() === target.getTime()) {
    return true;
  }
  
  switch (frequency) {
    case 'daily':
      return true;
    
    case 'weekly': {
      // Occurs every 7 days from nextDate
      const diffMs = target.getTime() - nextDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays % 7 === 0;
    }
    
    case 'monthly': {
      // Iterate forward from nextDate, adding months until we reach or exceed target
      const nextDay = nextDate.getDate();
      let current = new Date(nextDate);
      
      // Max iterations to prevent infinite loops (10 years)
      for (let i = 0; i < 120; i++) {
        // Move to next month
        current.setMonth(current.getMonth() + 1);
        
        // Handle month-end rollover (e.g., Jan 31 → Feb 28/29)
        const daysInCurrentMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        if (nextDay > daysInCurrentMonth) {
          current.setDate(daysInCurrentMonth);
        } else {
          current.setDate(nextDay);
        }
        
        if (current.getTime() === target.getTime()) {
          return true;
        }
        
        if (current > target) {
          return false;
        }
      }
      
      return false;
    }
    
    case 'yearly': {
      // Check if same month, and day matches (with month-end rollover)
      const nextDay = nextDate.getDate();
      const isSameMonth = target.getMonth() === nextDate.getMonth();
      
      if (!isSameMonth) {
        return false;
      }
      
      // Check if year difference is positive
      const yearDiff = target.getFullYear() - nextDate.getFullYear();
      if (yearDiff <= 0) {
        return false;
      }
      
      // Check day match with rollover
      const targetDay = target.getDate();
      const daysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      const isLastDayOfMonth = targetDay === daysInTargetMonth;
      const shouldBeLastDay = nextDay > daysInTargetMonth;
      
      return targetDay === nextDay || (isLastDayOfMonth && shouldBeLastDay);
    }
    
    default:
      return false;
  }
}

/**
 * Get recurring income for a specific date
 */
export async function getRecurringIncomeForDate(
  userId: number,
  date: Date
): Promise<number> {
  const recurring = await storage.getRecurringByUserId(userId);
  
  let income = 0;
  
  for (const r of recurring) {
    if (!r.isActive || r.type !== 'income') continue;
    
    // Check if this recurring transaction occurs on target date
    if (shouldOccurOnDate(r.nextDate, r.frequency, date)) {
      const amount = parseFloat(r.amount as unknown as string);
      income += amount;
    }
  }
  
  return income;
}

/**
 * Get recurring expenses for a specific date
 */
export async function getRecurringExpenseForDate(
  userId: number,
  date: Date
): Promise<number> {
  const recurring = await storage.getRecurringByUserId(userId);
  
  let expense = 0;
  
  for (const r of recurring) {
    if (!r.isActive || r.type !== 'expense') continue;
    
    // Check if this recurring transaction occurs on target date
    if (shouldOccurOnDate(r.nextDate, r.frequency, date)) {
      const amount = parseFloat(r.amount as unknown as string);
      expense += amount;
    }
  }
  
  return expense;
}

/**
 * Get planned income for a specific date
 */
export async function getPlannedIncomeForDate(
  userId: number,
  date: Date
): Promise<number> {
  const planned = await storage.getPlannedIncomeByUserId(userId);
  
  const dateStr = date.toISOString().split('T')[0];
  
  return planned
    .filter(p => 
      p.status === 'pending' &&
      p.expectedDate === dateStr
    )
    .reduce((sum, p) => sum + parseFloat(p.amount as unknown as string), 0);
}

/**
 * Get planned expenses for a specific date
 */
export async function getPlannedExpenseForDate(
  userId: number,
  date: Date
): Promise<number> {
  const wishlist = await storage.getWishlistByUserId(userId);
  
  const dateStr = date.toISOString().split('T')[0];
  
  return wishlist
    .filter((p: any) => 
      p.targetDate !== null &&
      p.targetDate === dateStr &&
      !p.isPurchased
    )
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount as unknown as string), 0);
}

/**
 * Get daily budget total (all budgets converted to daily equivalent)
 */
export async function getDailyBudgetTotal(
  userId: number,
  date: Date
): Promise<number> {
  const budgets = await storage.getBudgetsByUserId(userId);
  
  let total = 0;
  
  for (const b of budgets) {
    if (b.startDate) {
      const startDate = new Date(b.startDate);
      if (date < startDate) continue;
    }
    
    const limit = parseFloat(b.limitAmount as unknown as string);
    
    switch (b.period) {
      case 'day':
        total += limit;
        break;
      case 'week':
        total += limit / 7;
        break;
      case 'month':
        total += limit / 30;
        break;
      case 'year':
        total += limit / 365;
        break;
      default:
        total += limit / 30;
    }
  }
  
  return total;
}
