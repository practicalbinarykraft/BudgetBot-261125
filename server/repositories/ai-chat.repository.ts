import { db } from "../db";
import { aiChatMessages, InsertAiChatMessage, AiChatMessage, OwnedInsert } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export class AiChatRepository {
    async getAIChatMessages(userId: number, limit: number = 50): Promise<AiChatMessage[]> {
        return db
            .select()
            .from(aiChatMessages)
            .where(eq(aiChatMessages.userId, userId))
            .orderBy(asc(aiChatMessages.createdAt))
            .limit(limit);
    }

    async createAIChatMessage(messageData: OwnedInsert<InsertAiChatMessage>): Promise<number> {
        const result = await db.insert(aiChatMessages).values(messageData).returning();
        return result[0].id;
    }
}

export const aiChatRepository = new AiChatRepository();
