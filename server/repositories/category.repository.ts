import { db } from "../db";
import { categories, InsertCategory, Category } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class CategoryRepository {
    async getCategoriesByUserId(
        userId: number,
        filters?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ categories: Category[]; total: number }> {
        const conditions = [eq(categories.userId, userId)];

        // Get total count for pagination metadata
        const countResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(categories)
            .where(and(...conditions));

        const total = countResult[0]?.count || 0;

        // Build query with optional pagination
        let query = db
            .select()
            .from(categories)
            .where(and(...conditions))
            .orderBy(desc(categories.createdAt), categories.name)
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
            categories: results as Category[],
            total,
        };
    }

    async getCategoryById(id: number): Promise<Category | null> {
        const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
        return result[0] || null;
    }

    async getCategoryByNameAndUserId(name: string, userId: number): Promise<Category | null> {
        const result = await db
            .select()
            .from(categories)
            .where(and(eq(categories.name, name), eq(categories.userId, userId)))
            .limit(1);
        return result[0] || null;
    }

    async createCategory(category: InsertCategory): Promise<Category> {
        const result = await db.insert(categories).values(category).returning();
        return result[0];
    }

    async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
        const result = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
        return result[0];
    }

    async deleteCategory(id: number): Promise<void> {
        await db.delete(categories).where(eq(categories.id, id));
    }
}

export const categoryRepository = new CategoryRepository();
