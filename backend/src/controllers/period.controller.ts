import { Request, Response } from 'express';
import * as PeriodService    from '../services/period.service';
import { ok, fail }          from '../utils/response';

export async function listPeriods(req: Request, res: Response): Promise<void> {
  try {
    const pt = (req.query.programType as string) || 'servicio_social';
    ok(res, await PeriodService.getPeriods(pt));
  } catch (e: any) {
    fail(res, e.message);
  }
}

export async function updatePeriod(req: Request, res: Response): Promise<void> {
  try {
    const { periodId }             = req.params;
    const { startDate, endDate }   = req.body;
    if (!startDate || !endDate) {
      fail(res, 'startDate y endDate son requeridos'); return;
    }
    ok(res, await PeriodService.updatePeriod(periodId, startDate, endDate));
  } catch (e: any) {
    fail(res, e.message);
  }
}
