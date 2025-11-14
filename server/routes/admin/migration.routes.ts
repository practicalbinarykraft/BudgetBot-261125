import { Router } from 'express';
import { withAuth } from '../../middleware/auth-utils';
import { backfillTransactionClassifications } from '../../services/migration/transaction-classification-migration.service';

const router = Router();

router.post('/migrate-transaction-classifications', withAuth(async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Migration endpoint disabled in production' });
    }

    const result = await backfillTransactionClassifications(req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
