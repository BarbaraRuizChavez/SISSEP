import fs   from 'fs';
import path from 'path';

import { AppDataSource }  from '../config/database';
import { DocumentEntity } from '../models/DocumentEntity';
import { UserEntity }     from '../models/UserEntity';
import { getCatalog }     from '../utils/catalog';
import { DocStatus, ProgramType } from '../types';
import { isStudentBlocked, isPeriodOpen } from './period.service';

const repo     = () => AppDataSource.getRepository(DocumentEntity);
const userRepo = () => AppDataSource.getRepository(UserEntity);

export async function seedCatalog(
  studentId:   string,
  programType: ProgramType,
): Promise<void> {
  const catalog = getCatalog(programType);
  for (const item of catalog) {
    const exists = await repo().findOne({
      where: { studentId, programType, category: item.category },
    });
    if (!exists) {
      await repo().save(
        repo().create({
          studentId,
          programType,
          category:     item.category,
          description:  item.description,
          periodNumber: item.periodNumber,
          status:       'pendiente',
        }),
      );
    }
  }
}

export async function getMyDocuments(studentId: string, programType: ProgramType) {
  await seedCatalog(studentId, programType);

  const blocked = await isStudentBlocked(studentId, programType);
  const user    = await userRepo().findOne({ where: { id: studentId } });
  if (user && user.studentStatus !== (blocked ? 'bloqueado' : 'activo')) {
    user.studentStatus = blocked ? 'bloqueado' : 'activo';
    await userRepo().save(user);
  }

  return repo().find({
    where: { studentId, programType },
    order: { periodNumber: 'ASC', createdAt: 'ASC' },
  });
}

export async function getStudentDocuments(studentId: string, programType: ProgramType) {
  await seedCatalog(studentId, programType);
  return repo().find({
    where: { studentId, programType },
    order: { periodNumber: 'ASC', createdAt: 'ASC' },
  });
}

export async function submitFile(data: {
  studentId:   string;
  programType: ProgramType;
  category:    string;
  fileName:    string;
  filePath:    string;
  fileSize:    number;
}) {
  const blocked = await isStudentBlocked(data.studentId, data.programType);
  if (blocked) {
    throw new Error(
      'Tu expediente esta bloqueado. Tienes documentos sin entregar de un periodo vencido. Comunicate con el encargado.',
    );
  }

  const open = await isPeriodOpen(data.category, data.programType);
  if (!open) {
    throw new Error(
      'El periodo de entrega para este documento no esta abierto actualmente.',
    );
  }

  const doc = await repo().findOne({
    where: {
      studentId:   data.studentId,
      programType: data.programType,
      category:    data.category,
    },
  });
  if (!doc) throw new Error(`Documento "${data.category}" no encontrado en el catalogo`);

  if (doc.filePath) {
    try { fs.unlinkSync(path.resolve(doc.filePath)); } catch { /* ya no existe */ }
  }

  doc.fileName     = data.fileName;
  doc.filePath     = data.filePath;
  doc.fileSize     = data.fileSize;
  doc.externalUrl  = null;
  doc.status       = 'pendiente';
  doc.observations = '';

  return repo().save(doc);
}

export async function submitUrl(data: {
  studentId:   string;
  programType: ProgramType;
  category:    string;
  externalUrl: string;
}) {
  const blocked = await isStudentBlocked(data.studentId, data.programType);
  if (blocked) {
    throw new Error(
      'Tu expediente esta bloqueado. Tienes documentos sin entregar de un periodo vencido. Comunicate con el encargado.',
    );
  }

  const open = await isPeriodOpen(data.category, data.programType);
  if (!open) {
    throw new Error(
      'El periodo de entrega para este documento no esta abierto actualmente.',
    );
  }

  const doc = await repo().findOne({
    where: {
      studentId:   data.studentId,
      programType: data.programType,
      category:    data.category,
    },
  });
  if (!doc) throw new Error(`Documento "${data.category}" no encontrado en el catalogo`);

  doc.externalUrl  = data.externalUrl;
  doc.filePath     = null;
  doc.fileName     = null;
  doc.fileSize     = null;
  doc.status       = 'pendiente';
  doc.observations = '';

  return repo().save(doc);
}

export async function reviewDocument(
  docId:        string,
  status:       DocStatus,
  observations: string,
  reviewedBy:   string,
) {
  const doc = await repo().findOne({ where: { id: docId } });
  if (!doc) throw new Error('Documento no encontrado');

  doc.status       = status;
  doc.observations = observations || '';
  doc.reviewedBy   = reviewedBy;

  return repo().save(doc);
}

export async function getStudentsProgress(programType: ProgramType) {
  const rows = await AppDataSource.query(
    `SELECT
       u.id,
       u.control_number   AS "controlNumber",
       u.name,
       u.carrera,
       u.periodo,
       u.student_status   AS "studentStatus",
       COUNT(d.id)::int   AS total,
       SUM(CASE WHEN d.status = 'aprobado'  THEN 1 ELSE 0 END)::int AS approved,
       SUM(CASE WHEN d.status = 'pendiente' THEN 1 ELSE 0 END)::int AS pending,
       SUM(CASE WHEN d.status = 'rechazado' THEN 1 ELSE 0 END)::int AS rejected
     FROM users u
     LEFT JOIN documents d
            ON d.student_id  = u.id
           AND d.program_type = $1
     WHERE u.role = 'estudiante'
     GROUP BY u.id, u.control_number, u.name, u.carrera, u.periodo, u.student_status
     ORDER BY u.name ASC`,
    [programType],
  );
  return rows;
}
