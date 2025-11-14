import { db } from '../db';
import { personalTags, transactions } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import type { InsertPersonalTag } from '@shared/schema';

/**
 * Получить все теги пользователя
 */
export async function getAllTags(userId: number) {
  return await db
    .select()
    .from(personalTags)
    .where(eq(personalTags.userId, userId))
    .orderBy(personalTags.sortOrder, personalTags.id);
}

/**
 * Создать новый тег
 */
export async function createTag(
  userId: number,
  data: InsertPersonalTag
) {
  const [tag] = await db
    .insert(personalTags)
    .values({
      userId,
      name: data.name,
      icon: data.icon ?? 'User',
      color: data.color ?? '#3b82f6',
      type: data.type ?? 'person',
      isDefault: false,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();
  
  return tag;
}

/**
 * Обновить тег
 */
export async function updateTag(
  tagId: number,
  data: Partial<InsertPersonalTag>
) {
  const [tag] = await db
    .update(personalTags)
    .set(data)
    .where(eq(personalTags.id, tagId))
    .returning();
  
  return tag;
}

/**
 * Получить один тег
 */
export async function getTag(tagId: number) {
  const [tag] = await db
    .select()
    .from(personalTags)
    .where(eq(personalTags.id, tagId))
    .limit(1);
  
  return tag;
}

/**
 * Удалить тег
 */
export async function deleteTag(tagId: number) {
  // Сначала убрать тег у всех транзакций
  await db
    .update(transactions)
    .set({ personalTagId: null })
    .where(eq(transactions.personalTagId, tagId));
  
  // Потом удалить тег
  await db
    .delete(personalTags)
    .where(eq(personalTags.id, tagId));
}

/**
 * Статистика по тегу
 */
export async function getTagStats(tagId: number) {
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

/**
 * Создать дефолтные теги при регистрации
 */
export async function createDefaultTags(userId: number) {
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
