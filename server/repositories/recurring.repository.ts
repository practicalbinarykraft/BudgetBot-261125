import { db } from "../db";
import { recurring, InsertRecurring, Recurring } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class RecurringRepository {
    async getRecurringByUserId(
        userId: number,
        filters?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ recurring: Recurring[]; total: number }> {
        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(recurring)
            .where(eq(recurring.userId, userId));

        const total = countResult[0]?.count || 0;

        // Query recurring transactions with pagination
        let query = db
            .select({
                // Recurring fields (match schema exactly)
                id: recurring.id,
                userId: recurring.userId,
                type: recurring.type,
                amount: recurring.amount,
                amountUsd: recurring.amountUsd,
                description: recurring.description,
                category: recurring.category,
                frequency: recurring.frequency,
                nextDate: recurring.nextDate,
                isActive: recurring.isActive,
                currency: recurring.currency,
                originalAmount: recurring.originalAmount,
                originalCurrency: recurring.originalCurrency,
                exchangeRate: recurring.exchangeRate,
                createdAt: recurring.createdAt,
            })
            .from(recurring)
            .where(eq(recurring.userId, userId))
            .$dynamic();

        // Apply pagination if provided
        if (filters?.limit !== undefined) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset !== undefined) {
            query = query.offset(filters.offset);
        }

        const results = await query;

        // Map back to Recurring type for compatibility
        const recurringList = results.map(r => ({
            id: r.id,
            userId: r.userId,
            type: r.type,
            amount: r.amount,
            amountUsd: r.amountUsd,
            description: r.description,
            category: r.category,
            frequency: r.frequency,
            nextDate: r.nextDate,
            isActive: r.isActive,
            currency: r.currency,
            originalAmount: r.originalAmount,
            originalCurrency: r.originalCurrency,
            exchangeRate: r.exchangeRate,
            createdAt: r.createdAt,
        })) as Recurring[];

        return { recurring: recurringList, total };
    }

    async getRecurringById(id: number): Promise<Recurring | null> {
        const result = await db.select().from(recurring).where(eq(recurring.id, id)).limit(1);
        return result[0] || null;
    }

    async createRecurring(recurringData: InsertRecurring): Promise<Recurring> {
        const result = await db.insert(recurring).values(recurringData).returning();
        return result[0];
    }

    async updateRecurring(id: number, recurringData: Partial<InsertRecurring>): Promise<Recurring> {
        const result = await db.update(recurring).set(recurringData).where(eq(recurring.id, id)).returning();
        return result[0];
    }

    async deleteRecurring(id: number): Promise<void> {
        await db.delete(recurring).where(eq(recurring.id, id));
    }

    /**
     * Calculate and update next occurrence date based on frequency
     */
    async updateNextDate(id: number, currentDate: Date, frequency: string): Promise<Recurring> {
        const nextDate = this.calculateNextOccurrenceDate(currentDate, frequency);
        // Convert Date to ISO string format (YYYY-MM-DD)
        const nextDateStr = nextDate.toISOString().split('T')[0];
        return await this.updateRecurring(id, { nextDate: nextDateStr });
    }

    /**
     * Calculate next occurrence date based on frequency
     */
    calculateNextOccurrenceDate(currentDate: Date, frequency: string): Date {
        const next = new Date(currentDate);
        switch (frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                // Handle month-end rollover (e.g., Jan 31 → Feb 28/29)
                const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
                const originalDay = currentDate.getDate();
                if (originalDay > daysInMonth) {
                    next.setDate(daysInMonth);
                }
                break;
            case 'quarterly':
                next.setMonth(next.getMonth() + 3);
                const daysInQuarterMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
                const originalDayQuarter = currentDate.getDate();
                if (originalDayQuarter > daysInQuarterMonth) {
                    next.setDate(daysInQuarterMonth);
                }
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                next.setDate(next.getDate() + 1);
        }
        return next;
    }
}

export const recurringRepository = new RecurringRepository();
