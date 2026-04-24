import fs   from 'fs';
import path from 'path';

import { AppDataSource }  from '../config/database';
import { DocumentEntity } from '../models/DocumentEntity';
import { getCatalog }     from '../utils/catalog';
import { DocStatus, ProgramType } from '../types';

const repo = () => AppDataSource.getRepository(DocumentEntity);

/**
 * Crea las filas del catalogo para un estudiante si aun no existen.
 * Se llama automaticamente al listar documentos.
 */
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
        repo().create({ studentId, programType, ...item, status: 'pendiente' }),
      );
    }
  }
}

// Devuelve los documentos del estudiante autenticado, creando el catalogo si no existe
export async function getMyDocuments(studentId: string, programType: ProgramType) {
  await seedCatalog(studentId, programType);
  return repo().find({
    where: { studentId, programType },
    order: { createdAt: 'ASC' },
  });
}

// Devuelve los documentos de cualquier estudiante (uso del encargado)
export async function getStudentDocuments(studentId: string, programType: ProgramType) {
  await seedCatalog(studentId, programType);
  return repo().find({
    where: { studentId, programType },
    order: { createdAt: 'ASC' },
  });
}

// Registra un archivo fisico subido por el estudiante
export async function submitFile(data: {
  studentId:   string;
  programType: ProgramType;
  category:    string;
  fileName:    string;
  filePath:    string;
  fileSize:    number;
}) {
  const doc = await repo().findOne({
    where: {
      studentId:   data.studentId,
      programType: data.programType,
      category:    data.category,
    },
  });
  if (!doc) throw new Error(`Documento "${data.category}" no encontrado en el catalogo`);

  // Eliminar archivo anterior del disco si existe
  if (doc.filePath) {
    try { fs.unlinkSync(path.resolve(doc.filePath)); } catch { /* archivo ya no existe */ }
  }

  doc.fileName     = data.fileName;
  doc.filePath     = data.filePath;
  doc.fileSize     = data.fileSize;
  doc.status       = 'pendiente';
  doc.observations = '';

  return repo().save(doc);
}

// Registra una URL externa (Google Drive, OneDrive, Dropbox)
export async function submitUrl(data: {
  studentId:   string;
  programType: ProgramType;
  category:    string;
  externalUrl: string;
}) {
  const doc = await repo().findOne({
    where: {
      studentId:   data.studentId,
      programType: data.programType,
      category:    data.category,
    },
  });
  if (!doc) throw new Error(`Documento "${data.category}" no encontrado en el catalogo`);

  doc.externalUrl  = data.externalUrl;
  doc.status       = 'pendiente';
  doc.observations = '';

  return repo().save(doc);
}

// Aprueba o rechaza un documento (solo encargados)
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

// Progreso agregado de todos los estudiantes (query SQL directa para eficiencia)
export async function getStudentsProgress(programType: ProgramType) {
  return AppDataSource.query(
    `SELECT
       u.id,
       u.control_number                                              AS "controlNumber",
       u.name,
       u.carrera,
       COUNT(d.id)::int                                             AS total,
       SUM(CASE WHEN d.status = 'aprobado'  THEN 1 ELSE 0 END)::int AS approved,
       SUM(CASE WHEN d.status = 'pendiente' THEN 1 ELSE 0 END)::int AS pending,
       SUM(CASE WHEN d.status = 'rechazado' THEN 1 ELSE 0 END)::int AS rejected
     FROM users u
     LEFT JOIN documents d
            ON d.student_id  = u.id
           AND d.program_type = $1
     WHERE u.role = 'estudiante'
     GROUP BY u.id, u.control_number, u.name, u.carrera
     ORDER BY u.name ASC`,
    [programType],
  );
}
