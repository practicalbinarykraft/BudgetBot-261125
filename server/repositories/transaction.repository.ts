import { db } from "../db";
import { transactions, InsertTransaction, Transaction, categories, wallets, personalTags } from "@shared/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";

export class TransactionRepository {
    async getTransactionsByUserId(
        userId: number,
        filters?: {
            personalTagIds?: number[];
            categoryIds?: number[];
            types?: ('income' | 'expense')[];
            from?: string;
            to?: string;
            limit?: number;
            offset?: number;
        }
    ): Promise<{ transactions: Transaction[]; total: number }> {
        const conditions = [eq(transactions.userId, userId)];

        if (filters?.personalTagIds && filters.personalTagIds.length > 0) {
            conditions.push(inArray(transactions.personalTagId, filters.personalTagIds));
        }

        if (filters?.categoryIds && filters.categoryIds.length > 0) {
            conditions.push(inArray(transactions.categoryId, filters.categoryIds));
        }

        if (filters?.types && filters.types.length > 0) {
            conditions.push(inArray(transactions.type, filters.types));
        }

        if (filters?.from) {
            conditions.push(gte(transactions.date, filters.from));
        }

        if (filters?.to) {
            conditions.push(lte(transactions.date, filters.to));
        }

        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(transactions)
            .where(and(...conditions));

        const total = countResult[0]?.count || 0;

        // Optimized query with JOINs to avoid N+1
        // This fetches transactions with related category, wallet, and tag in a single query
        let query = db
            .select({
                // Transaction fields
                id: transactions.id,
                userId: transactions.userId,
                type: transactions.type,
                amount: transactions.amount,
                amountUsd: transactions.amountUsd,
                description: transactions.description,
                category: transactions.category,
                categoryId: transactions.categoryId,
                date: transactions.date,
                currency: transactions.currency,
                originalAmount: transactions.originalAmount,
                originalCurrency: transactions.originalCurrency,
                exchangeRate: transactions.exchangeRate,
                source: transactions.source,
                walletId: transactions.walletId,
                personalTagId: transactions.personalTagId,
                financialType: transactions.financialType,
                createdAt: transactions.createdAt,
                // Related data (for client convenience, reduces separate queries)
                categoryName: categories.name,
                categoryIcon: categories.icon,
                categoryColor: categories.color,
                walletName: wallets.name,
                walletBalance: wallets.balance,
                walletCurrency: wallets.currency,
                tagName: personalTags.name,
                tagColor: personalTags.color,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .leftJoin(wallets, eq(transactions.walletId, wallets.id))
            .leftJoin(personalTags, eq(transactions.personalTagId, personalTags.id))
            .where(and(...conditions))
            .orderBy(desc(transactions.date), desc(transactions.id))
            .$dynamic();

        // Apply pagination if provided
        if (filters?.limit !== undefined) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset !== undefined) {
            query = query.offset(filters.offset);
        }

        const results = await query;

        // Map to Transaction type (keeping original structure for compatibility)
        const transactionsList = results.map(r => ({
            id: r.id,
            userId: r.userId,
            type: r.type,
            amount: r.amount,
            amountUsd: r.amountUsd,
            description: r.description,
            category: r.category,
            categoryId: r.categoryId,
            date: r.date,
            currency: r.currency,
            originalAmount: r.originalAmount,
            originalCurrency: r.originalCurrency,
            exchangeRate: r.exchangeRate,
            source: r.source,
            walletId: r.walletId,
            personalTagId: r.personalTagId,
            financialType: r.financialType,
            createdAt: r.createdAt,
        })) as Transaction[];

        return {
            transactions: transactionsList,
            total,
        };
    }

    async getTransactionById(id: number): Promise<Transaction | null> {
        const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
        return result[0] || null;
    }

    async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
        const result = await db.insert(transactions).values(transaction).returning();
        return result[0];
    }

    async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
        const result = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
        return result[0];
    }

    async deleteTransaction(id: number): Promise<void> {
        await db.delete(transactions).where(eq(transactions.id, id));
    }

    async backfillNullTags(userId: number, tagId: number): Promise<{ id: number }[]> {
        return await db
            .update(transactions)
            .set({
                personalTagId: tagId,
            })
            .where(
                and(
                    eq(transactions.userId, userId),
                    sql`${transactions.personalTagId} IS NULL`
                )
            )
            .returning({ id: transactions.id });
    }

    async backfillNullFinancialTypes(userId: number): Promise<{ id: number }[]> {
        return await db
            .update(transactions)
            .set({
                financialType: 'discretionary',
            })
            .where(
                and(
                    eq(transactions.userId, userId),
                    sql`${transactions.financialType} IS NULL`
                )
            )
            .returning({ id: transactions.id });
    }
}

export const transactionRepository = new TransactionRepository();
