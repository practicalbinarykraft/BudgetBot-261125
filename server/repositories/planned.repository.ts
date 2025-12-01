import { db } from "../db";
import { plannedTransactions, InsertPlannedTransaction, PlannedTransaction, wishlist, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

export class PlannedRepository {
    async getPlannedByUserId(userId: number): Promise<PlannedTransaction[]> {
        // Optimized query with JOINs to fetch related wishlist and transaction data
        // Avoids N+1 queries when displaying planned transactions
        const results = await db
            .select({
                // PlannedTransaction fields
                id: plannedTransactions.id,
                userId: plannedTransactions.userId,
                name: plannedTransactions.name,
                amount: plannedTransactions.amount,
                category: plannedTransactions.category,
                targetDate: plannedTransactions.targetDate,
                source: plannedTransactions.source,
                wishlistId: plannedTransactions.wishlistId,
                status: plannedTransactions.status,
                showOnChart: plannedTransactions.showOnChart,
                purchasedAt: plannedTransactions.purchasedAt,
                transactionId: plannedTransactions.transactionId,
                createdAt: plannedTransactions.createdAt,
                updatedAt: plannedTransactions.updatedAt,
                // Related data (optional, for future use)
                wishlistName: wishlist.name,
                transactionDescription: transactions.description,
            })
            .from(plannedTransactions)
            .leftJoin(wishlist, eq(plannedTransactions.wishlistId, wishlist.id))
            .leftJoin(transactions, eq(plannedTransactions.transactionId, transactions.id))
            .where(eq(plannedTransactions.userId, userId));

        // Map back to PlannedTransaction type for compatibility
        return results.map(r => ({
            id: r.id,
            userId: r.userId,
            name: r.name,
            amount: r.amount,
            category: r.category,
            targetDate: r.targetDate,
            source: r.source,
            wishlistId: r.wishlistId,
            status: r.status,
            showOnChart: r.showOnChart,
            purchasedAt: r.purchasedAt,
            transactionId: r.transactionId,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        })) as PlannedTransaction[];
    }

    async getPlannedById(id: number): Promise<PlannedTransaction | null> {
        const result = await db.select().from(plannedTransactions).where(eq(plannedTransactions.id, id)).limit(1);
        return result[0] || null;
    }

    async createPlanned(plannedData: InsertPlannedTransaction): Promise<PlannedTransaction> {
        const result = await db.insert(plannedTransactions).values(plannedData).returning();
        return result[0];
    }

    async updatePlanned(id: number, plannedData: Partial<InsertPlannedTransaction>): Promise<PlannedTransaction> {
        const result = await db.update(plannedTransactions).set({
            ...plannedData,
            updatedAt: new Date()
        }).where(eq(plannedTransactions.id, id)).returning();
        return result[0];
    }

    async deletePlanned(id: number): Promise<void> {
        await db.delete(plannedTransactions).where(eq(plannedTransactions.id, id));
    }
}

export const plannedRepository = new PlannedRepository();
