import multer  from 'multer';
import path    from 'path';
import { getStudentFolder } from '../utils/folders';
import { ENV }              from '../config/env';

const ALLOWED = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// Multer con almacenamiento en disco organizado por estudiante
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    // req.body ya contiene los campos de texto en multipart/form-data
    const programType = (req.body?.programType as string) || 'servicio_social';
    const carrera     = req.user?.carrera || 'Sin_Carrera';
    const name        = req.user?.name    || 'Estudiante';
    cb(null, getStudentFolder(programType, carrera, name));
  },
  filename(_req, file, cb) {
    const ts     = Date.now();
    const random = Math.round(Math.random() * 1_000_000);
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${ts}-${random}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${ext}. Permitidos: ${ALLOWED.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: ENV.MAX_FILE_MB * 1024 * 1024 },
});
