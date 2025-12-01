import { db } from "../db";
import { personalTags, transactions, PersonalTag, InsertPersonalTag } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export class TagRepository {
    async getPersonalTagsByUserId(
        userId: number,
        filters?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ tags: PersonalTag[]; total: number }> {
        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(personalTags)
            .where(eq(personalTags.userId, userId));

        const total = countResult[0]?.count || 0;

        // Build dynamic query with pagination
        let query = db.select()
            .from(personalTags)
            .where(eq(personalTags.userId, userId))
            .orderBy(personalTags.sortOrder, personalTags.id)
            .$dynamic();

        // Apply pagination if provided
        if (filters?.limit !== undefined) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset !== undefined) {
            query = query.offset(filters.offset);
        }

        const tags = await query;
        return { tags, total };
    }

    async createTag(userId: number, tag: InsertPersonalTag): Promise<PersonalTag> {
        const result = await db.insert(personalTags).values({
            ...tag,
            userId,
            icon: tag.icon ?? 'User',
            color: tag.color ?? '#3b82f6',
            type: tag.type ?? 'person',
            isDefault: false,
            sortOrder: tag.sortOrder ?? 0,
        }).returning();
        return result[0];
    }

    async updateTag(tagId: number, data: Partial<InsertPersonalTag>): Promise<PersonalTag> {
        const result = await db.update(personalTags)
            .set(data)
            .where(eq(personalTags.id, tagId))
            .returning();
        return result[0];
    }

    async getTagById(tagId: number): Promise<PersonalTag | null> {
        const result = await db.select()
            .from(personalTags)
            .where(eq(personalTags.id, tagId))
            .limit(1);
        return result[0] || null;
    }

    async deleteTag(tagId: number): Promise<void> {
        // First remove tag from all transactions
        await db.update(transactions)
            .set({ personalTagId: null })
            .where(eq(transactions.personalTagId, tagId));

        // Then delete the tag
        await db.delete(personalTags)
            .where(eq(personalTags.id, tagId));
    }

    async getTagStats(tagId: number): Promise<{ transactionCount: number; totalSpent: number }> {
        const result = await db
            .select({
                count: sql<number>`cast(count(*) as integer)`,
                total: sql<string>`cast(coalesce(sum(${transactions.amountUsd}), 0) as text)`,
            })
            .from(transactions)
            .where(eq(transactions.personalTagId, tagId));

        return {
            transactionCount: result[0]?.count || 0,
            totalSpent: parseFloat(result[0]?.total || '0'),
        };
    }

    async createDefaultTags(userId: number): Promise<void> {
        await db.insert(personalTags).values([
            {
                userId,
                name: 'Personal (Me)',
                icon: 'User',
                color: '#3b82f6',
                type: 'personal',
                isDefault: true,
                sortOrder: 1,
            },
            {
                userId,
                name: 'Shared',
                icon: 'Home',
                color: '#8b5cf6',
                type: 'shared',
                isDefault: true,
                sortOrder: 2,
            },
            {
                userId,
                name: 'Неопределена',
                icon: 'HelpCircle',
                color: '#9ca3af',
                type: 'person',
                isDefault: true,
                sortOrder: 3,
            },
        ]);
    }
    async findOrCreateUnknownTag(userId: number): Promise<PersonalTag> {
        return await db.transaction(async (tx) => {
            const existing = await tx.query.personalTags.findFirst({
                where: eq(personalTags.name, 'Неопределена')
            });

            if (existing && existing.userId === userId) {
                return existing;
            }

            // Double check with userId in query if possible, but findFirst with name is what was there.
            // Actually, the original code checked userId AND name.
            const existingCorrect = await tx.query.personalTags.findFirst({
                where: and(
                    eq(personalTags.userId, userId),
                    eq(personalTags.name, 'Неопределена')
                )
            });

            if (existingCorrect) {
                return existingCorrect;
            }

            const [created] = await tx
                .insert(personalTags)
                .values({
                    userId,
                    name: 'Неопределена',
                    icon: 'HelpCircle',
                    color: '#9ca3af',
                    type: 'person',
                    isDefault: true,
                    sortOrder: 999
                })
                .returning();

            return created;
        });
    }
}

export const tagRepository = new TagRepository();
