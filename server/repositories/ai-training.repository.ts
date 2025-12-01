import { db } from "../db";
import { aiTrainingExamples, InsertAiTrainingExample, AiTrainingExample } from "@shared/schema";
import { eq } from "drizzle-orm";

export class AiTrainingRepository {
    async createTrainingExample(example: InsertAiTrainingExample & { userId: number }): Promise<void> {
        await db.insert(aiTrainingExamples).values(example);
    }

    async getTrainingExamplesByUserId(userId: number): Promise<AiTrainingExample[]> {
        return db.select().from(aiTrainingExamples).where(eq(aiTrainingExamples.userId, userId));
    }
}

export const aiTrainingRepository = new AiTrainingRepository();
