import { db } from "../db";
import { wallets, InsertWallet, Wallet } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";

export class WalletRepository {
    async getWalletsByUserId(
        userId: number,
        filters?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ wallets: Wallet[]; total: number }> {
        const conditions = [eq(wallets.userId, userId)];

        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(wallets)
            .where(and(...conditions));

        const total = countResult[0]?.count || 0;

        // Build query with optional pagination
        let query = db
            .select()
            .from(wallets)
            .where(and(...conditions))
            .orderBy(desc(wallets.createdAt), wallets.name)
            .$dynamic();

        // Apply pagination if provided
        if (filters?.limit !== undefined) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset !== undefined) {
            query = query.offset(filters.offset);
        }

        const results = await query;

        return {
            wallets: results as Wallet[],
            total,
        };
    }

    async getWalletById(id: number): Promise<Wallet | null> {
        const result = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
        return result[0] || null;
    }

    async createWallet(wallet: InsertWallet): Promise<Wallet> {
        const result = await db.insert(wallets).values(wallet).returning();
        return result[0];
    }

    async updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet> {
        const result = await db.update(wallets).set(wallet).where(eq(wallets.id, id)).returning();
        return result[0];
    }

    async deleteWallet(id: number): Promise<void> {
        await db.delete(wallets).where(eq(wallets.id, id));
    }
}

export const walletRepository = new WalletRepository();
