import { Router } from 'express';
import { withAuth } from '../middleware/auth-utils';
import * as tagService from '../services/tag.service';
import { insertPersonalTagSchema } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import { getErrorMessage } from '../lib/errors';
import { logError } from '../lib/logger';

const router = Router();

/**
 * GET /api/tags
 * Получить все теги пользователя
 * Supports pagination: ?limit=100&offset=0
 */
router.get('/', withAuth(async (req, res) => {
  const userId = Number(req.user.id);

  try {
    const { limit, offset } = req.query;
    const filters: { limit?: number; offset?: number } = {};

    // Parse and validate pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
      }
      if (limitNum > 1000) {
        return res.status(400).json({ error: 'Limit cannot exceed 1000. Please use pagination for large datasets.' });
      }
      filters.limit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: 'Invalid offset parameter. Must be a non-negative integer.' });
      }
      filters.offset = offsetNum;
    }

    const result = await tagService.getAllTags(userId, filters);

    // Unified response: always { data, pagination }
    const effectiveLimit = filters.limit ?? 100;
    const effectiveOffset = filters.offset ?? 0;
    const response = {
      data: result.tags,
      pagination: {
        total: result.total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        hasMore: effectiveOffset + result.tags.length < result.total,
      },
    };

    res.json(response);
  } catch (error: unknown) {
    logError('Failed to load tags:', error);
    res.status(500).json({ error: 'Failed to load tags' });
  }
}));

/**
 * POST /api/tags
 * Создать новый тег
 */
router.post('/', withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  
  // Валидация
  const validation = insertPersonalTagSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = fromZodError(validation.error).toString();
    return res.status(400).json({ error: errorMessage });
  }
  
  try {
    const tag = await tagService.createTag(userId, validation.data);
    res.json(tag);
  } catch (error: unknown) {
    logError('Failed to create tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
}));

/**
 * PATCH /api/tags/:id
 * Обновить тег
 */
router.patch('/:id', withAuth(async (req, res) => {
  const tagId = parseInt(req.params.id);
  const userId = Number(req.user.id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  // Проверка ownership
  try {
    const tag = await tagService.getTag(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    if (tag.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error: unknown) {
    logError('Failed to verify tag ownership:', error);
    return res.status(500).json({ error: 'Failed to verify tag ownership' });
  }

  // Валидация partial update
  const validation = insertPersonalTagSchema.partial().safeParse(req.body);
  if (!validation.success) {
    const errorMessage = fromZodError(validation.error).toString();
    return res.status(400).json({ error: errorMessage });
  }
  
  try {
    const updatedTag = await tagService.updateTag(tagId, validation.data);
    res.json(updatedTag);
  } catch (error: unknown) {
    logError('Failed to update tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
}));

/**
 * DELETE /api/tags/:id
 * Удалить тег
 */
router.delete('/:id', withAuth(async (req, res) => {
  const tagId = parseInt(req.params.id);
  const userId = Number(req.user.id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  // Проверка ownership и isDefault
  try {
    const tag = await tagService.getTag(tagId);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    if (tag.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (tag.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default tag' });
    }
    
    await tagService.deleteTag(tagId);
    res.json({ success: true });
  } catch (error: unknown) {
    logError('Failed to delete tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
}));

/**
 * GET /api/tags/:id/stats
 * Статистика по тегу
 */
router.get('/:id/stats', withAuth(async (req, res) => {
  const tagId = parseInt(req.params.id);
  const userId = Number(req.user.id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  // Проверка ownership
  try {
    const tag = await tagService.getTag(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    if (tag.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error: unknown) {
    logError('Failed to verify tag ownership:', error);
    return res.status(500).json({ error: 'Failed to verify tag ownership' });
  }

  try {
    const stats = await tagService.getTagStats(tagId);
    res.json(stats);
  } catch (error: unknown) {
    logError('Failed to load stats:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
}));

export default router;
