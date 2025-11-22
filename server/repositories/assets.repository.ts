import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  assets, 
  assetValuations, 
  categories,
  type Asset, 
  type InsertAsset, 
  type AssetValuation, 
  type InsertAssetValuation 
} from '@shared/schema';

/**
 * Assets Repository
 * Handles database operations for assets and liabilities
 */
class AssetsRepository {
  
  // Получить все активы пользователя с категориями
  async findByUserId(userId: number): Promise<any[]> {
    return await db
      .select({
        asset: assets,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color
        }
      })
      .from(assets)
      .leftJoin(categories, eq(assets.categoryId, categories.id))
      .where(eq(assets.userId, userId))
      .orderBy(desc(assets.createdAt));
  }
  
  // Получить активы по типу (asset/liability)
  async findByUserIdAndType(userId: number, type: 'asset' | 'liability'): Promise<any[]> {
    return await db
      .select({
        asset: assets,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color
        }
      })
      .from(assets)
      .leftJoin(categories, eq(assets.categoryId, categories.id))
      .where(
        and(
          eq(assets.userId, userId),
          eq(assets.type, type)
        )
      )
      .orderBy(desc(assets.currentValue));
  }
  
  // Получить конкретный актив
  async findById(id: number): Promise<Asset | null> {
    const result = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);
    
    return result[0] || null;
  }
  
  // Создать актив
  async create(data: InsertAsset): Promise<Asset> {
    const result = await db
      .insert(assets)
      .values({
        ...data,
        lastValuationDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      })
      .returning();
    
    // Создать первую запись в истории оценок
    await this.createValuation({
      assetId: result[0].id,
      value: data.currentValue,
      valueOriginal: data.currentValueOriginal || null,
      currency: data.currency || 'USD',
      source: 'initial',
      valuationDate: new Date().toISOString().split('T')[0]
    });
    
    return result[0];
  }
  
  // Обновить актив
  async update(id: number, data: Partial<InsertAsset>): Promise<Asset> {
    const result = await db
      .update(assets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(assets.id, id))
      .returning();
    
    return result[0];
  }
  
  // Удалить актив
  async delete(id: number): Promise<void> {
    await db
      .delete(assets)
      .where(eq(assets.id, id));
  }
  
  // Получить историю оценок актива
  async getValuations(assetId: number): Promise<AssetValuation[]> {
    return await db
      .select()
      .from(assetValuations)
      .where(eq(assetValuations.assetId, assetId))
      .orderBy(desc(assetValuations.valuationDate));
  }
  
  // Создать новую оценку
  async createValuation(data: InsertAssetValuation): Promise<AssetValuation> {
    const result = await db
      .insert(assetValuations)
      .values(data)
      .returning();
    
    return result[0];
  }
  
  // Калибровать цену актива (обновить текущую стоимость)
  async calibrateValue(params: {
    assetId: number;
    newValue: string;
    newValueOriginal?: string;
    currency?: string;
    exchangeRate?: string;
    source?: string;
    notes?: string;
  }): Promise<void> {
    const { 
      assetId, 
      newValue, 
      newValueOriginal,
      currency = 'USD',
      exchangeRate,
      source = 'manual', 
      notes 
    } = params;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Обновить текущую стоимость актива
    await db
      .update(assets)
      .set({
        currentValue: newValue,
        currentValueOriginal: newValueOriginal || null,
        exchangeRate: exchangeRate || null,
        lastValuationDate: today,
        updatedAt: new Date()
      })
      .where(eq(assets.id, assetId));
    
    // Добавить запись в историю оценок
    await this.createValuation({
      assetId,
      value: newValue,
      valueOriginal: newValueOriginal || null,
      currency,
      source,
      notes,
      valuationDate: today
    });
  }
  
  // Группировать активы по категориям (для UI)
  groupByCategory(assetsWithCategories: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      'Без категории': []
    };
    
    for (const item of assetsWithCategories) {
      const categoryName = item.category?.name || 'Без категории';
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      
      // Объединяем поля актива и категории в один объект
      grouped[categoryName].push({
        ...item.asset,
        category: item.category || undefined
      });
    }
    
    return grouped;
  }
}

export const assetsRepository = new AssetsRepository();
