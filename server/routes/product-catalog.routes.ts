import { Router } from 'express';
import { withAuth } from '../middleware/auth-utils';
import { productCatalogRepository } from '../repositories/product-catalog.repository';
import { productPriceHistoryRepository } from '../repositories/product-price-history.repository';
import { priceSearchReportsRepository } from '../repositories/price-search-reports.repository';

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

export default router;
