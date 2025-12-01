import { db } from "../db";
import { plannedIncome, InsertPlannedIncome, PlannedIncome, OwnedInsert } from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";

export class PlannedIncomeRepository {
    async getPlannedIncomeByUserId(userId: number, filters?: { status?: string }): Promise<PlannedIncome[]> {
        if (filters?.status) {
            return db.select()
                .from(plannedIncome)
                .where(and(
                    eq(plannedIncome.userId, userId),
                    eq(plannedIncome.status, filters.status)
                ))
                .orderBy(asc(plannedIncome.expectedDate));
        }
        return db.select()
            .from(plannedIncome)
            .where(eq(plannedIncome.userId, userId))
            .orderBy(asc(plannedIncome.expectedDate));
    }

    async getPlannedIncomeById(id: number): Promise<PlannedIncome | null> {
        const result = await db.select().from(plannedIncome).where(eq(plannedIncome.id, id)).limit(1);
        return result[0] || null;
    }

    async createPlannedIncome(incomeData: OwnedInsert<InsertPlannedIncome>): Promise<PlannedIncome> {
        const result = await db.insert(plannedIncome).values(incomeData as any).returning();
        return result[0];
    }

    async updatePlannedIncome(id: number, incomeData: Partial<InsertPlannedIncome>): Promise<PlannedIncome> {
        const result = await db.update(plannedIncome).set({
            ...incomeData,
            updatedAt: new Date()
        }).where(eq(plannedIncome.id, id)).returning();

        if (!result[0]) {
            throw new Error("Planned income not found or update failed");
        }
        return result[0];
    }

    async deletePlannedIncome(id: number): Promise<void> {
        const result = await db.delete(plannedIncome).where(eq(plannedIncome.id, id)).returning();
        if (!result[0]) {
            throw new Error("Planned income not found or delete failed");
        }
    }
}

export const plannedIncomeRepository = new PlannedIncomeRepository();
