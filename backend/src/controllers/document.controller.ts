import { Request, Response }       from 'express';
import * as DocumentService        from '../services/document.service';
import { ok, fail }                from '../utils/response';
import { toRelative }              from '../utils/folders';
import { DocStatus, ProgramType }  from '../types';

const URL_REGEX = /^https?:\/\/.{4,}/i;

export async function listMyDocs(req: Request, res: Response): Promise<void> {
  try {
    const pt = (req.query.programType as ProgramType) || 'servicio_social';
    ok(res, await DocumentService.getMyDocuments(req.user!.userId, pt));
  } catch (e: any) { fail(res, e.message); }
}

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) { fail(res, 'Archivo requerido'); return; }
    const { category, programType = 'servicio_social' } = req.body;
    if (!category) { fail(res, 'El campo category es requerido'); return; }

    const doc = await DocumentService.submitFile({
      studentId:   req.user!.userId,
      programType: programType as ProgramType,
      category,
      fileName:    req.file.originalname,
      filePath:    toRelative(req.file.path),
      fileSize:    req.file.size,
    });
    ok(res, doc, 201);
  } catch (e: any) { fail(res, e.message); }
}

export async function submitUrl(req: Request, res: Response): Promise<void> {
  try {
    const { category, programType = 'servicio_social', externalUrl } = req.body;
    if (!category)    { fail(res, 'El campo category es requerido'); return; }
    if (!externalUrl) { fail(res, 'El campo externalUrl es requerido'); return; }
    if (!URL_REGEX.test(externalUrl)) {
      fail(res, 'URL invalida. Debe comenzar con http:// o https://');
      return;
    }

    const doc = await DocumentService.submitUrl({
      studentId:   req.user!.userId,
      programType: programType as ProgramType,
      category,
      externalUrl,
    });
    ok(res, doc);
  } catch (e: any) { fail(res, e.message); }
}

export async function progress(req: Request, res: Response): Promise<void> {
  try {
    const pt = (req.query.programType as ProgramType) || 'servicio_social';
    ok(res, await DocumentService.getStudentsProgress(pt));
  } catch (e: any) { fail(res, e.message); }
}

export async function studentDocs(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params;
    const pt = (req.query.programType as ProgramType) || 'servicio_social';
    ok(res, await DocumentService.getStudentDocuments(studentId, pt));
  } catch (e: any) { fail(res, e.message); }
}

export async function reviewDoc(req: Request, res: Response): Promise<void> {
  try {
    const { docId }                = req.params;
    const { status, observations } = req.body;
    const valid: DocStatus[]       = ['aprobado', 'rechazado'];

    if (!valid.includes(status)) {
      fail(res, 'El campo status debe ser "aprobado" o "rechazado"');
      return;
    }

    ok(res, await DocumentService.reviewDocument(
      docId, status, observations || '', req.user!.userId,
    ));
  } catch (e: any) { fail(res, e.message); }
}
