/**
 * GET Route Handlers for Assets
 *
 * Handlers for retrieving assets, summaries, forecasts, and history
 * Junior-Friendly: <200 lines, focused on GET operations
 */

import { Request, Response } from 'express';
import { assetsRepository } from '../../repositories/assets.repository';
import { netWorthService } from '../../services/net-worth.service';
import { db } from '../../db';
import { wallets } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { forecastQuerySchema, historyQuerySchema } from './validation';
import { calculateAssetValueAtDate } from './utils';
import { logError } from '../../lib/logger';
import { getErrorMessage } from '../../lib/errors';

/**
 * GET /api/assets - Get all user assets
 * Supports optional ?type=asset|liability filter
 */
export async function getAssets(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { type } = req.query; // 'asset' | 'liability' | undefined

    let assetsData;
    if (type === 'asset' || type === 'liability') {
      assetsData = await assetsRepository.findByUserIdAndType(userId, type as 'asset' | 'liability');
    } else {
      assetsData = await assetsRepository.findByUserId(userId);
    }

    // Flatten {asset, category} structure
    const flatAssets = assetsData.map(item => ({
      ...item.asset,
      category: item.category || undefined
    }));

    // Group by categories
    const grouped = assetsRepository.groupByCategory(assetsData);

    res.json({
      success: true,
      data: {
        assets: flatAssets,
        grouped
      }
    });
  } catch (error: unknown) {
    logError('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
}

/**
 * GET /api/assets/summary - Get net worth summary
 */
export async function getSummary(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const summary = await netWorthService.calculateNetWorth(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error: unknown) {
    logError('Error calculating net worth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate net worth'
    });
  }
}

/**
 * GET /api/assets/forecast - Forecast total capital
 * Query params: ?months=12 (1-120)
 */
export async function getForecast(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // Validate query parameters
    const validation = forecastQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }

    const { months } = validation.data;

    // Get current wallets balance
    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const currentWalletsBalance = userWallets.reduce((sum, wallet) =>
      sum + parseFloat(wallet.balanceUsd || '0'), 0
    );

    // Forecast total capital
    const forecast = await netWorthService.forecastTotalCapital({
      userId,
      months,
      currentWalletsBalance
    });

    res.json({
      success: true,
      data: forecast
    });
  } catch (error: unknown) {
    logError('Error forecasting total capital:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to forecast total capital'
    });
  }
}

/**
 * GET /api/assets/history - Get asset value history
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Default: last 6 months
 */
export async function getHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // Validate query parameters
    const validation = historyQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }

    const { startDate, endDate } = validation.data;

    // Default: last 6 months if dates not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    // Get all user assets
    const allAssets = await assetsRepository.findByUserId(userId);

    // Optimization: Preload all valuations in one batch
    // Pre-sort valuations DESC for O(V) lookup later
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

    // Generate dates for chart (monthly)
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }

    // Calculate asset values for each date
    const history = dates.map((date) => {
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const item of allAssets) {
        const asset = item.asset;

        // Determine purchase date (fallback: first valuation or createdAt)
        const valuations = valuationsMap.get(asset.id) || [];
        const firstValuationDate = valuations.length > 0
          ? valuations[valuations.length - 1].valuationDate // last element in DESC-sorted array
          : null;
        const purchaseDate = asset.purchaseDate
          ? new Date(asset.purchaseDate)
          : (firstValuationDate ? new Date(firstValuationDate) : new Date(asset.createdAt));

        // Skip if asset purchased after this date
        if (purchaseDate > new Date(date)) {
          continue;
        }

        // Calculate asset value at this date (using preloaded valuations)
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
  } catch (error: unknown) {
    logError('Error fetching assets history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets history'
    });
  }
}

/**
 * GET /api/assets/:id - Get specific asset by ID
 * Includes valuations history and change calculation
 */
export async function getAssetById(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const assetId = parseInt(req.params.id);

    const asset = await assetsRepository.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Check ownership
    if (asset.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get valuations history
    const valuations = await assetsRepository.getValuations(assetId);

    // Calculate change
    const change = netWorthService.calculateAssetChange(asset);

    res.json({
      success: true,
      data: {
        asset,
        valuations,
        change
      }
    });
  } catch (error: unknown) {
    logError('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset'
    });
  }
}
