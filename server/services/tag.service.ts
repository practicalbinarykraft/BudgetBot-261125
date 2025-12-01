import { tagRepository } from '../repositories/tag.repository';
import type { InsertPersonalTag } from '@shared/schema';

/**
 * Получить все теги пользователя
 */
export async function getAllTags(
  userId: number,
  filters?: { limit?: number; offset?: number }
) {
  return await tagRepository.getPersonalTagsByUserId(userId, filters);
}

/**
 * Создать новый тег
 */
export async function createTag(
  userId: number,
  data: InsertPersonalTag
) {
  return await tagRepository.createTag(userId, data);
}

/**
 * Обновить тег
 */
export async function updateTag(
  tagId: number,
  data: Partial<InsertPersonalTag>
) {
  return await tagRepository.updateTag(tagId, data);
}

/**
 * Получить один тег
 */
export async function getTag(tagId: number) {
  return await tagRepository.getTagById(tagId);
}

/**
 * Удалить тег
 */
export async function deleteTag(tagId: number) {
  await tagRepository.deleteTag(tagId);
}

/**
 * Статистика по тегу
 */
export async function getTagStats(tagId: number) {
  return await tagRepository.getTagStats(tagId);
}

/**
 * Создать дефолтные теги при регистрации
 */
export async function createDefaultTags(userId: number) {
  await tagRepository.createDefaultTags(userId);
}
