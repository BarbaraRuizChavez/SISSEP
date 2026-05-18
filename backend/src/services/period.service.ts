import { AppDataSource }        from '../config/database';
import { DeliveryPeriodEntity } from '../models/DeliveryPeriodEntity';
import { DocumentEntity }       from '../models/DocumentEntity';
import { getCatalog }           from '../utils/catalog';

const repo = () => AppDataSource.getRepository(DeliveryPeriodEntity);

const DEFAULTS: Record<string, { label: string; startDate: string; endDate: string }[]> = {
  servicio_social: [
    { label: 'Período 1', startDate: '2026-01-23', endDate: '2026-02-03' },
    { label: 'Período 2', startDate: '2026-02-18', endDate: '2026-03-03' },
    { label: 'Período 3', startDate: '2026-04-13', endDate: '2026-04-24' },
    { label: 'Período 4', startDate: '2026-05-11', endDate: '2026-05-22' },
    { label: 'Período 5', startDate: '2026-06-08', endDate: '2026-06-19' },
    { label: 'Período 6', startDate: '2026-06-22', endDate: '2026-06-30' },
  ],
  residencias: [
    { label: 'Período 1', startDate: '2026-01-23', endDate: '2026-02-28' },
    { label: 'Período 2', startDate: '2026-03-01', endDate: '2026-05-15' },
    { label: 'Período 3', startDate: '2026-05-16', endDate: '2026-06-30' },
  ],
};

async function initDefaultPeriods(programType: string): Promise<void> {
  const count = await repo().count({ where: { programType } });
  if (count > 0) return;

  const defaults = DEFAULTS[programType] ?? [];
  for (let i = 0; i < defaults.length; i++) {
    await repo().save(
      repo().create({
        periodNumber: i + 1,
        label:        defaults[i].label,
        startDate:    defaults[i].startDate,
        endDate:      defaults[i].endDate,
        programType,
      }),
    );
  }
}

export async function getPeriods(programType: string): Promise<DeliveryPeriodEntity[]> {
  await initDefaultPeriods(programType);
  return repo().find({
    where: { programType },
    order: { periodNumber: 'ASC' },
  });
}

function datesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 <= e2 && e1 >= s2;
}

export async function updatePeriod(
  periodId:  string,
  startDate: string,
  endDate:   string,
): Promise<DeliveryPeriodEntity> {
  if (startDate >= endDate) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  const period = await repo().findOne({ where: { id: periodId } });
  if (!period) throw new Error('Período no encontrado');

  const others = await repo().find({
    where: { programType: period.programType },
  });

  for (const other of others) {
    if (other.id === periodId) continue;
    if (datesOverlap(startDate, endDate, other.startDate, other.endDate)) {
      throw new Error(
        `Las fechas se traslapan con "${other.label}" (${other.startDate} – ${other.endDate})`,
      );
    }
  }

  period.startDate = startDate;
  period.endDate   = endDate;
  return repo().save(period);
}

export async function isStudentBlocked(
  studentId:   string,
  programType: string,
): Promise<boolean> {
  const today   = new Date().toISOString().split('T')[0];
  const periods = await getPeriods(programType);
  const catalog = getCatalog(programType);
  const docRepo = AppDataSource.getRepository(DocumentEntity);

  for (const period of periods) {
    if (period.endDate >= today) continue;

    const categories = catalog
      .filter((c) => c.periodNumber === period.periodNumber)
      .map((c) => c.category);

    if (categories.length === 0) continue;

    const docs = await docRepo
      .createQueryBuilder('d')
      .where('d.studentId = :studentId', { studentId })
      .andWhere('d.programType = :programType', { programType })
      .andWhere('d.category IN (:...categories)', { categories })
      .getMany();

    const hasUnsubmitted = docs.some((d) => !d.filePath && !d.externalUrl);
    if (hasUnsubmitted) return true;
  }

  return false;
}

export async function isPeriodOpen(
  category:    string,
  programType: string,
): Promise<boolean> {
  const today   = new Date().toISOString().split('T')[0];
  const catalog = getCatalog(programType);
  const item    = catalog.find((c) => c.category === category);
  if (!item) return false;

  const periods = await getPeriods(programType);
  const period  = periods.find((p) => p.periodNumber === item.periodNumber);
  if (!period) return false;

  return today >= period.startDate && today <= period.endDate;
}
