import { db } from "../db";
import { users, InsertUser, User } from "@shared/schema";
import { eq } from "drizzle-orm";

export class UserRepository {
    async getUserByEmail(email: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0] || null;
    }

    async getUserById(id: number): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0] || null;
    }

    async createUser(user: InsertUser): Promise<User> {
        const result = await db.insert(users).values(user).returning();
        return result[0];
    }
}

export const userRepository = new UserRepository();
