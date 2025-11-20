import { Router } from 'express';
import { withAuth } from '../middleware/auth-utils';
import { productCatalogRepository } from '../repositories/product-catalog.repository';
import { productPriceHistoryRepository } from '../repositories/product-price-history.repository';
import { priceSearchReportsRepository } from '../repositories/price-search-reports.repository';
import { updateProductCatalogSchema } from '@shared/schema';
import { normalizeName } from '../services/product-catalog.service';

const router = Router();

// GET /api/product-catalog - Список товаров
router.get('/', withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, category } = req.query;
    
    let products;
    
    if (search) {
      products = await productCatalogRepository.search(
        userId, 
        search as string
      );
    } else if (category) {
      products = await productCatalogRepository.findByCategory(
        userId, 
        category as string
      );
    } else {
      products = await productCatalogRepository.findByUser(userId);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}));

// GET /api/product-catalog/:id/price-history - История цен
router.get('/:id/price-history', withAuth(async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Проверить что товар принадлежит пользователю
    const product = await productCatalogRepository.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Получить историю цен
    const priceHistory = await productPriceHistoryRepository.findByProduct(productId);
    
    // Группировать по магазинам
    const byStore: Record<string, any[]> = {};
    
    for (const price of priceHistory) {
      if (!byStore[price.storeName]) {
        byStore[price.storeName] = [];
      }
      byStore[price.storeName].push(price);
    }
    
    res.json({
      product,
      priceHistory,
      byStore,
      statistics: {
        totalPurchases: priceHistory.length,
        averagePrice: product.averagePrice,
        bestPrice: product.bestPrice,
        bestStore: product.bestStore
      }
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
}));

// GET /api/product-catalog/:id - Детали товара
router.get('/:id', withAuth(async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const product = await productCatalogRepository.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Проверить что товар принадлежит пользователю
    if (product.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}));

// PATCH /api/product-catalog/:id - Обновить товар
router.patch('/:id', withAuth(async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Проверить что товар существует и принадлежит пользователю
    const product = await productCatalogRepository.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Валидация данных
    const validation = updateProductCatalogSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      });
    }
    
    const updateData = validation.data;
    
    // Преобразовать undefined в null для Drizzle (чтобы очищать поля)
    const cleanedData: any = {};
    for (const key in updateData) {
      cleanedData[key] = updateData[key as keyof typeof updateData] ?? null;
    }
    
    // Если имя изменилось - обновить normalizedName
    if (updateData.name) {
      cleanedData.normalizedName = normalizeName(updateData.name);
    }
    
    const updatedProduct = await productCatalogRepository.update(productId, cleanedData);
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
}));

export default router;
