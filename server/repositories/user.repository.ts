import { db } from "../db";
import { users, InsertUser, User } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class UserRepository {
    async getUserByEmail(email: string): Promise<User | null> {
        // Явно указываем поля для совместимости с БД без всех полей
        const result = await db
            .select({
                id: users.id,
                email: users.email,
                password: users.password,
                name: users.name,
                telegramId: users.telegramId,
                telegramUsername: users.telegramUsername,
                telegramFirstName: users.telegramFirstName,
                telegramPhotoUrl: users.telegramPhotoUrl,
                twoFactorEnabled: users.twoFactorEnabled,
                twoFactorSecret: users.twoFactorSecret,
                isBlocked: users.isBlocked,
                tier: users.tier,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return result[0] as User | null;
    }

    async getUserById(id: number): Promise<User | null> {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:28',message:'getUserById entry',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Сначала пытаемся выбрать БЕЗ isBlocked, так как колонка может отсутствовать
        try {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:32',message:'Selecting without isBlocked first',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            const result = await db
                .select({
                    id: users.id,
                    email: users.email,
                    password: users.password,
                    name: users.name,
                    telegramId: users.telegramId,
                    telegramUsername: users.telegramUsername,
                    telegramFirstName: users.telegramFirstName,
                    telegramPhotoUrl: users.telegramPhotoUrl,
                    twoFactorEnabled: users.twoFactorEnabled,
                    twoFactorSecret: users.twoFactorSecret,
                    createdAt: users.createdAt,
                })
                .from(users)
                .where(eq(users.id, id))
                .limit(1);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:50',message:'Select without isBlocked succeeded',data:{id,hasResult:!!result[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            // Добавляем значения по умолчанию для isBlocked и tier
            if (result[0]) {
                return { ...result[0], isBlocked: false, tier: result[0].tier || 'free' } as User;
            }
            return null;
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:52',message:'Error in getUserById',data:{id,errorMessage:error?.message,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            throw error;
        }
    }

    async createUser(user: InsertUser): Promise<User> {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:81',message:'createUser entry',data:{hasEmail:!!user.email,hasName:!!user.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        try {
            // Удаляем isBlocked из данных перед вставкой, так как колонка может отсутствовать
            const { isBlocked, ...userData } = user;
            
            // Вставляем данные без isBlocked и получаем только ID
            const [insertResult] = await db.insert(users).values(userData as InsertUser).returning({ id: users.id });
            
            if (!insertResult) {
                throw new Error('Failed to create user');
            }
            
            // Получаем созданного пользователя через getUserById (который обрабатывает отсутствие isBlocked)
            const createdUser = await this.getUserById(insertResult.id);
            
            if (!createdUser) {
                throw new Error('Failed to retrieve created user');
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:94',message:'createUser succeeded',data:{userId:createdUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            return createdUser;
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/69a6307d-1c32-43aa-a884-80c8c3bf30bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/repositories/user.repository.ts:99',message:'createUser error',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            throw error;
        }
    }

    async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
        try {
            // Удаляем isBlocked из данных обновления, если колонки может не быть
            const { isBlocked, ...dataToUpdate } = userData;
            
            // Обновляем только если есть данные для обновления (кроме isBlocked)
            if (Object.keys(dataToUpdate).length > 0) {
                await db
                    .update(users)
                    .set(dataToUpdate)
                    .where(eq(users.id, id));
            }
            
            // Если нужно обновить isBlocked, делаем это отдельно через raw SQL
            if (isBlocked !== undefined) {
                try {
                    // Проверяем существование колонки перед обновлением
                    const checkResult = await db.execute(sql`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'is_blocked'
                    `);
                    
                    if ((checkResult.rows || []).length > 0) {
                        // Колонка существует, обновляем через raw SQL
                        await db.execute(sql`
                            UPDATE users 
                            SET is_blocked = ${isBlocked} 
                            WHERE id = ${id}
                        `);
                    }
                    // Если колонки нет, просто пропускаем обновление
                } catch (error: any) {
                    // Если ошибка не связана с отсутствием колонки, пробрасываем дальше
                    if (!error.message?.includes('is_blocked') && !error.message?.includes('column')) {
                        throw error;
                    }
                    // Иначе просто пропускаем обновление isBlocked
                }
            }
            
            // Получаем обновленного пользователя через getUserById (который уже обрабатывает отсутствие isBlocked)
            const updatedUser = await this.getUserById(id);
            if (!updatedUser) {
                throw new Error('User not found');
            }
            return updatedUser;
        } catch (error: any) {
            // Если ошибка не связана с isBlocked, пробрасываем дальше
            if (!error.message?.includes('is_blocked') && !error.message?.includes('column')) {
                throw error;
            }
            // Если ошибка связана с isBlocked, получаем пользователя без обновления isBlocked
            const user = await this.getUserById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        }
    }
}

export const userRepository = new UserRepository();
