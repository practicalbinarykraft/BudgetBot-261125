import { db } from "../db";
import { budgets, InsertBudget, Budget, OwnedInsert, categories } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";

export class BudgetRepository {
    async getBudgetsByUserId(
        userId: number,
        filters?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ budgets: Budget[]; total: number }> {
        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(budgets)
            .where(eq(budgets.userId, userId));

        const total = countResult[0]?.count || 0;

        // Optimized query with JOIN to fetch category data
        // Avoids N+1 queries when displaying budgets with category info
        let query = db
            .select({
                // Budget fields
                id: budgets.id,
                userId: budgets.userId,
                categoryId: budgets.categoryId,
                period: budgets.period,
                limitAmount: budgets.limitAmount,
                startDate: budgets.startDate,
                createdAt: budgets.createdAt,
                // Category info
                categoryName: categories.name,
                categoryIcon: categories.icon,
                categoryColor: categories.color,
            })
            .from(budgets)
            .leftJoin(categories, eq(budgets.categoryId, categories.id))
            .where(eq(budgets.userId, userId))
            .orderBy(desc(budgets.createdAt))
            .$dynamic();

        // Apply pagination if provided
        if (filters?.limit !== undefined) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset !== undefined) {
            query = query.offset(filters.offset);
        }

        const results = await query;

        // Map back to Budget type for compatibility
        const budgetsList = results.map(r => ({
            id: r.id,
            userId: r.userId,
            categoryId: r.categoryId,
            period: r.period,
            limitAmount: r.limitAmount,
            startDate: r.startDate,
            createdAt: r.createdAt,
        })) as Budget[];

        return { budgets: budgetsList, total };
    }

    async getBudgetById(id: number): Promise<Budget | null> {
        const result = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
        return result[0] || null;
    }

    async createBudget(budgetData: OwnedInsert<InsertBudget>): Promise<Budget> {
        const payload: typeof budgets.$inferInsert = {
            ...budgetData,
            limitAmount: budgetData.limitAmount.toFixed(2),
        };
        const result = await db.insert(budgets).values(payload).returning();
        return result[0];
    }

    async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget> {
        const { limitAmount, ...rest } = budgetData;
        const payload: Partial<typeof budgets.$inferInsert> = { ...rest };
        if (limitAmount !== undefined && limitAmount !== null) {
            payload.limitAmount = limitAmount.toFixed(2);
        }
        const result = await db.update(budgets).set(payload).where(eq(budgets.id, id)).returning();
        return result[0];
    }

    async deleteBudget(id: number): Promise<void> {
        await db.delete(budgets).where(eq(budgets.id, id));
    }
}

export const budgetRepository = new BudgetRepository();
