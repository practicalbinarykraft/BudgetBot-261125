/**
 * Mutation Route Handlers for Assets
 *
 * Handlers for creating, updating, calibrating, and deleting assets
 * Junior-Friendly: <180 lines, focused on POST/PATCH/DELETE operations
 */

import { Request, Response } from 'express';
import { assetsRepository } from '../../repositories/assets.repository';

/**
 * POST /api/assets - Create new asset
 * Request body: { name, type, currentValue, ... }
 * Security: userId is stripped from client payload
 */
export async function createAsset(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    // Security: Strip userId from client payload
    const { userId: _, ...data } = req.body;

    // Validation
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
}

/**
 * PATCH /api/assets/:id - Update asset
 * Request body: { name?, currentValue?, ... }
 * Security: userId is stripped from client payload
 * Validates ownership before update
 */
export async function updateAsset(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const assetId = parseInt(req.params.id);
    // Security: Strip userId from client payload
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
}

/**
 * POST /api/assets/:id/calibrate - Calibrate asset price
 * Request body: { newValue, newValueOriginal?, currency?, exchangeRate?, source?, notes? }
 * Validates ownership before calibration
 * Creates valuation record
 */
export async function calibrateAsset(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
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
}

/**
 * DELETE /api/assets/:id - Delete asset
 * Validates ownership before deletion
 * Also deletes associated valuations (via repository)
 */
export async function deleteAsset(req: Request, res: Response) {
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
}
