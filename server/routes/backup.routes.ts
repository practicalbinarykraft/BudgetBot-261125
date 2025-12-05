/**
 * Backup Routes
 *
 * Endpoints for user data export and backup.
 * Junior-Friendly: ~60 lines, GDPR-compliant exports
 */

import { Router } from 'express';
import { withAuth } from '../middleware/auth-utils';
import { exportUserData, getExportStats } from '../services/backup.service';
import { logInfo, logError } from '../lib/logger';

const router = Router();

/**
 * GET /backup/stats
 * Get export statistics (preview before download)
 */
router.get('/stats', withAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = await getExportStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /backup/export
 * Export all user data as JSON (GDPR data portability)
 */
router.get('/export', withAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    logInfo('User requested data export', { userId });

    const exportData = await exportUserData(userId);

    // Set headers for file download
    const filename = 'budgetbot-export-user' + userId + '-' + Date.now() + '.json';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    res.json(exportData);
  } catch (error) {
    logError('Data export failed', error);
    next(error);
  }
});

/**
 * GET /backup/export/csv
 * Export transactions as CSV
 */
router.get('/export/csv', withAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const exportData = await exportUserData(userId);

    // Convert transactions to CSV (cast to any for flexible access)
    const txns = exportData.transactions as Array<Record<string, unknown>>;
    const wlts = exportData.wallets as Array<Record<string, unknown>>;
    const cats = exportData.categories as Array<Record<string, unknown>>;

    const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Wallet'];
    const rows = txns.map(t => {
      const wallet = wlts.find(w => w.id === t.walletId);
      const category = cats.find(c => c.id === t.categoryId);
      return [
        String(t.date || '').split('T')[0],
        String(t.type || ''),
        String(t.amount || ''),
        String(category?.name || ''),
        String(t.description || '').replace(/,/g, ';'),
        String(wallet?.name || ''),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Set headers for CSV download
    const filename = 'budgetbot-transactions-user' + userId + '-' + Date.now() + '.csv';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    res.send(csv);
  } catch (error) {
    logError('CSV export failed', error);
    next(error);
  }
});

export default router;
