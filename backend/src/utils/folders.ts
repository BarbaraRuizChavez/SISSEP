import path from 'path';
import fs   from 'fs';
import { ENV } from '../config/env';

/**
 * Convierte un string a un nombre seguro para usar como carpeta.
 * Elimina tildes, reemplaza espacios por guion bajo, elimina caracteres especiales.
 */
export function sanitize(input: string): string {
  return (input || 'sin_nombre')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // quita tildes
    .replace(/\s+/g, '_')                // espacios a guion bajo
    .replace(/[^a-zA-Z0-9_\-]/g, '')    // elimina caracteres no permitidos
    .replace(/_+/g, '_')                 // colapsa guiones multiples
    .replace(/^_+|_+$/g, '')            // quita guiones al inicio y fin
    || 'carpeta';
}

/**
 * Devuelve la ruta absoluta de la carpeta del estudiante y la crea si no existe.
 *
 * Estructura resultante:
 *   uploads/servicio_social/<Carrera>/<Nombre_Estudiante>/
 *   uploads/residencias/<Carrera>/<Nombre_Estudiante>/
 */
export function getStudentFolder(
  program: string,
  carrera: string,
  name: string,
): string {
  const dir = path.resolve(
    ENV.UPLOAD_BASE,
    sanitize(program),
    sanitize(carrera || 'Sin_Carrera'),
    sanitize(name),
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Convierte una ruta absoluta a relativa desde cwd().
 * Se guarda en la base de datos para construir URLs de descarga.
 */
export function toRelative(absPath: string): string {
  return path.relative(process.cwd(), absPath);
}
