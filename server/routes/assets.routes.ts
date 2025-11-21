import { Router } from 'express';
import { assetsRepository } from '../repositories/assets.repository';
import { netWorthService } from '../services/net-worth.service';
import { withAuth } from '../middleware/auth-utils';

const router = Router();

// GET /api/assets - получить все активы пользователя
router.get('/', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query; // 'asset' | 'liability' | undefined
    
    let assetsData;
    if (type === 'asset' || type === 'liability') {
      assetsData = await assetsRepository.findByUserIdAndType(userId, type as 'asset' | 'liability');
    } else {
      assetsData = await assetsRepository.findByUserId(userId);
    }
    
    // Группировать по категориям
    const grouped = assetsRepository.groupByCategory(assetsData);
    
    res.json({
      success: true,
      data: {
        assets: assetsData,
        grouped
      }
    });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
}));

// GET /api/assets/summary - получить сводку (net worth)
router.get('/summary', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    
    const summary = await netWorthService.calculateNetWorth(userId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Error calculating net worth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate net worth'
    });
  }
}));

// GET /api/assets/:id - получить конкретный актив
router.get('/:id', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = parseInt(req.params.id);
    
    const asset = await assetsRepository.findById(assetId);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    // Проверка владения
    if (asset.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Получить историю оценок
    const valuations = await assetsRepository.getValuations(assetId);
    
    // Рассчитать изменение
    const change = netWorthService.calculateAssetChange(asset);
    
    res.json({
      success: true,
      data: {
        asset,
        valuations,
        change
      }
    });
  } catch (error: any) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset'
    });
  }
}));

// POST /api/assets - создать новый актив
router.post('/', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    // 🔒 Security: Strip userId from client payload
    const { userId: _, ...data } = req.body;
    
    // Валидация
    if (!data.name || !data.type || !data.currentValue) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, currentValue'
      });
    }
    
    if (data.type !== 'asset' && data.type !== 'liability') {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "asset" or "liability"'
      });
    }
    
    const asset = await assetsRepository.create({
      ...data,
      userId
    });
    
    res.json({
      success: true,
      data: asset
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create asset'
    });
  }
}));

// PATCH /api/assets/:id - обновить актив
router.patch('/:id', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = parseInt(req.params.id);
    // 🔒 Security: Strip userId from client payload
    const { userId: _, ...data } = req.body;
    
    const asset = await assetsRepository.findById(assetId);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    if (asset.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const updated = await assetsRepository.update(assetId, data);
    
    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update asset'
    });
  }
}));

// POST /api/assets/:id/calibrate - калибровать цену
router.post('/:id/calibrate', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = parseInt(req.params.id);
    const { 
      newValue, 
      newValueOriginal, 
      currency, 
      exchangeRate, 
      source, 
      notes 
    } = req.body;
    
    if (!newValue) {
      return res.status(400).json({
        success: false,
        error: 'Missing newValue'
      });
    }
    
    const asset = await assetsRepository.findById(assetId);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    if (asset.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await assetsRepository.calibrateValue({
      assetId,
      newValue,
      newValueOriginal,
      currency,
      exchangeRate,
      source,
      notes
    });
    
    res.json({
      success: true,
      message: 'Price calibrated successfully'
    });
  } catch (error: any) {
    console.error('Error calibrating price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calibrate price'
    });
  }
}));

// DELETE /api/assets/:id - удалить актив
router.delete('/:id', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = parseInt(req.params.id);
    
    const asset = await assetsRepository.findById(assetId);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    if (asset.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await assetsRepository.delete(assetId);
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
}));

export default router;
