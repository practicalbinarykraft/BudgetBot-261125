import { db } from "../db";
import { wishlist, InsertWishlist, WishlistItem } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export class WishlistRepository {
    async getWishlistByUserId(userId: number): Promise<WishlistItem[]> {
        return db.select().from(wishlist).where(eq(wishlist.userId, userId));
    }

    async getWishlistById(id: number): Promise<WishlistItem | null> {
        const result = await db.select().from(wishlist).where(eq(wishlist.id, id)).limit(1);
        return result[0] || null;
    }

    async createWishlist(wishlistData: InsertWishlist): Promise<WishlistItem> {
        const result = await db.insert(wishlist).values(wishlistData).returning();
        return result[0];
    }

    async updateWishlist(id: number, wishlistData: Partial<InsertWishlist>): Promise<WishlistItem> {
        const result = await db.update(wishlist).set(wishlistData).where(eq(wishlist.id, id)).returning();
        return result[0];
    }

    async deleteWishlist(id: number): Promise<void> {
        await db.delete(wishlist).where(eq(wishlist.id, id));
    }

    async reorderWishlist(userId: number, items: { id: number; sortOrder: number }[]): Promise<void> {
        const ids = items.map((i) => i.id);

        // Verify all items belong to this user
        const owned = await db.select({ id: wishlist.id })
            .from(wishlist)
            .where(and(eq(wishlist.userId, userId), inArray(wishlist.id, ids)));

        if (owned.length !== ids.length) {
            throw new Error("Some wishlist items not found or not owned by user");
        }

        // Update sortOrder for each item
        for (const item of items) {
            await db.update(wishlist)
                .set({ sortOrder: item.sortOrder })
                .where(eq(wishlist.id, item.id));
        }
    }
}

export const wishlistRepository = new WishlistRepository();
