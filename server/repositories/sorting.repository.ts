import { db } from "../db";
import { sortingSessions, sortingProgress, InsertSortingSession } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { format, subDays, parseISO } from 'date-fns';

export class SortingRepository {
    async createOrUpdateSession(
        userId: number,
        sessionDate: string,
        transactionsSorted: number,
        pointsEarned: number
    ): Promise<{ success: boolean; currentStreak: number; totalPoints: number }> {
        return await db.transaction(async (tx) => {
            // 1. UPSERT session
            await tx
                .insert(sortingSessions)
                .values({
                    userId,
                    sessionDate,
                    transactionsSorted,
                    pointsEarned,
                })
                .onConflictDoUpdate({
                    target: [sortingSessions.userId, sortingSessions.sessionDate],
                    set: {
                        transactionsSorted: sql`${sortingSessions.transactionsSorted} + ${transactionsSorted}`,
                        pointsEarned: sql`${sortingSessions.pointsEarned} + ${pointsEarned}`,
                    },
                });

            // 2. Update progress
            // Get or create progress (atomic via UPSERT)
            await tx
                .insert(sortingProgress)
                .values({
                    userId,
                    currentStreak: 0,
                    longestStreak: 0,
                    totalPoints: 0,
                    totalSorted: 0,
                    lastSessionDate: null,
                })
                .onConflictDoNothing({ target: sortingProgress.userId });

            // Now fetch progress with lock
            const [progress] = await tx
                .select()
                .from(sortingProgress)
                .where(eq(sortingProgress.userId, userId))
                .for('update')
                .limit(1);

            if (!progress) {
                throw new Error('Failed to create or fetch sorting progress');
            }

            // Calculate new streak
            let newStreak: number;

            if (!progress.lastSessionDate) {
                newStreak = 1;
            } else {
                const lastDate = parseISO(progress.lastSessionDate);
                const currentDate = parseISO(sessionDate);
                const yesterday = subDays(currentDate, 1);

                const lastDateStr = format(lastDate, 'yyyy-MM-dd');
                const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
                const currentDateStr = format(currentDate, 'yyyy-MM-dd');

                if (lastDateStr === yesterdayStr) {
                    newStreak = progress.currentStreak + 1;
                } else if (lastDateStr === currentDateStr) {
                    newStreak = progress.currentStreak;
                } else {
                    newStreak = 1;
                }
            }

            const newLongestStreak = Math.max(progress.longestStreak, newStreak);
            const newTotalPoints = progress.totalPoints + pointsEarned;
            const newTotalSorted = progress.totalSorted + transactionsSorted;

            // Update progress
            await tx
                .update(sortingProgress)
                .set({
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    totalPoints: newTotalPoints,
                    totalSorted: newTotalSorted,
                    lastSessionDate: sessionDate,
                    updatedAt: sql`NOW()`,
                })
                .where(eq(sortingProgress.userId, userId));

            return {
                success: true,
                currentStreak: newStreak,
                totalPoints: newTotalPoints,
            };
        });
    }
}

export const sortingRepository = new SortingRepository();
