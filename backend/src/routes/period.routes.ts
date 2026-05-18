import { Router }                  from 'express';
import * as PeriodController       from '../controllers/period.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get( '/',           authenticate, PeriodController.listPeriods);
router.patch('/:periodId', authenticate, authorize('encargado'), PeriodController.updatePeriod);

export default router;
