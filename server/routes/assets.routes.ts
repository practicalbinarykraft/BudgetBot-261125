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

// GET /api/assets/history - получить историю стоимости активов по датам
router.get('/history', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    // Если даты не указаны - последние 6 месяцев
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 месяцев назад
    
    // Получить все активы пользователя
    const allAssets = await assetsRepository.findByUserId(userId);
    
    // 🚀 Optimization: Preload all valuations for all assets in one batch
    // Pre-sort valuations by date DESC for O(log V) binary search later
    const valuationsMap = new Map<number, any[]>();
    await Promise.all(
      allAssets.map(async (item) => {
        const valuations = await assetsRepository.getValuations(item.asset.id);
        // Sort once - descending order (most recent first)
        const sorted = valuations.sort((a, b) => 
          new Date(b.valuationDate).getTime() - new Date(a.valuationDate).getTime()
        );
        valuationsMap.set(item.asset.id, sorted);
      })
    );
    
    // Генерируем даты для графика (каждый месяц)
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }
    
    // Для каждой даты рассчитать стоимость активов и пассивов
    const history = dates.map((date) => {
      let totalAssets = 0;
      let totalLiabilities = 0;
      
      for (const item of allAssets) {
        const asset = item.asset;
        
        // Пропустить если актив куплен после этой даты
        const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(asset.createdAt);
        if (purchaseDate > new Date(date)) {
          continue;
        }
        
        // Рассчитать стоимость актива на эту дату (используем предзагруженные valuations)
        const valuations = valuationsMap.get(asset.id) || [];
        const value = calculateAssetValueAtDate(asset, date, valuations);
        
        if (asset.type === 'asset') {
          totalAssets += value;
        } else {
          totalLiabilities += value;
        }
      }
      
      return {
        date,
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth: totalAssets - totalLiabilities
      };
    });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching assets history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets history'
    });
  }
}));

// Вспомогательная функция для расчета стоимости актива на конкретную дату
// 🚀 Оптимизировано: valuations передаются как параметр для избежания N×M запросов к БД
// Valuations уже отсортированы по убыванию даты (DESC)
function calculateAssetValueAtDate(asset: any, targetDate: string, valuations: any[]): number {
  const target = new Date(targetDate);
  
  // Найти первую оценку <= target date (массив уже отсортирован по убыванию)
  // O(V) вместо O(V log V) - без повторной сортировки
  const relevantValuation = valuations.find(v => 
    new Date(v.valuationDate) <= target
  );
  
  if (relevantValuation) {
    // Если есть историческая оценка - использовать её
    return parseFloat(relevantValuation.value as unknown as string);
  }
  
  // Если нет исторических оценок - рассчитать на основе appreciation/depreciation rate
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(asset.createdAt);
  const purchaseValue = asset.purchasePrice 
    ? parseFloat(asset.purchasePrice as unknown as string) 
    : parseFloat(asset.currentValue as unknown as string);
  
  // Если target дата до покупки - вернуть 0
  if (target < purchaseDate) {
    return 0;
  }
  
  // Рассчитать количество лет от покупки до target даты
  const yearsElapsed = (target.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  // Применить appreciation/depreciation rate
  if (asset.appreciationRate) {
    const rate = parseFloat(asset.appreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 + rate, yearsElapsed);
  }
  
  if (asset.depreciationRate) {
    const rate = parseFloat(asset.depreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 - rate, yearsElapsed);
  }
  
  // Если нет изменения цены - текущая стоимость
  return purchaseValue;
}

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
