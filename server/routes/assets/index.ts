/**
 * Assets Routes - Main Router
 *
 * Coordinates all asset-related routes and handlers
 * Junior-Friendly: <60 lines, focused on route registration
 */

import { Router } from 'express';
import { withAuth } from '../../middleware/auth-utils';
import {
  getAssets,
  getSummary,
  getForecast,
  getHistory,
  getAssetById
} from './get-handlers';
import {
  createAsset,
  updateAsset,
  calibrateAsset,
  deleteAsset
} from './mutation-handlers';

const router = Router();

// GET routes
router.get('/', withAuth(getAssets));
router.get('/summary', withAuth(getSummary));
router.get('/forecast', withAuth(getForecast));
router.get('/history', withAuth(getHistory));
router.get('/:id', withAuth(getAssetById));

// POST routes
router.post('/', withAuth(createAsset));
router.post('/:id/calibrate', withAuth(calibrateAsset));

// PATCH routes
router.patch('/:id', withAuth(updateAsset));

// DELETE routes
router.delete('/:id', withAuth(deleteAsset));

export default router;
