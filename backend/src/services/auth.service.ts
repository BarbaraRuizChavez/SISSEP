import * as XLSX from 'xlsx';

import { AppDataSource }                 from '../config/database';
import { UserEntity }                    from '../models/UserEntity';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken }                     from '../utils/jwt';
import { UserRole }                      from '../types';

const repo = () => AppDataSource.getRepository(UserEntity);

export async function registerUser(data: {
  controlNumber: string;
  name:          string;
  password:      string;
  role:          UserRole;
  carrera?:      string;
  periodo?:      string;
}) {
  const exists = await repo().findOne({
    where: { controlNumber: data.controlNumber.trim() },
  });
  if (exists) throw new Error('El numero de control ya esta registrado');

  const user = repo().create({
    controlNumber: data.controlNumber.trim(),
    name:          data.name.trim(),
    passwordHash:  await hashPassword(data.password),
    role:          data.role,
    carrera:       data.carrera?.trim() || '',
    periodo:       data.periodo?.trim() || '',
  });

  await repo().save(user);
  return { id: user.id, name: user.name, role: user.role, carrera: user.carrera, periodo: user.periodo };
}

export async function loginUser(controlNumber: string, password: string) {
  const user = await repo().findOne({
    where: { controlNumber: controlNumber.trim() },
  });

  if (!user) throw new Error('Credenciales incorrectas');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new Error('Credenciales incorrectas');

  const token = signToken({
    userId:  user.id,
    role:    user.role,
    carrera: user.carrera,
    name:    user.name,
  });

  return {
    token,
    user: {
      id:      user.id,
      name:    user.name,
      role:    user.role,
      carrera: user.carrera,
      periodo: user.periodo,
    },
  };
}

export async function getAllStudents() {
  return repo().find({
    where:  { role: 'estudiante' },
    order:  { name: 'ASC' },
    select: ['id', 'controlNumber', 'name', 'carrera', 'periodo', 'studentStatus', 'createdAt'],
  });
}

export interface ImportRow {
  controlNumber: string;
  name:          string;
  carrera:       string;
  periodo:       string;
  password?:     string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors:  { row: number; controlNumber: string; reason: string }[];
}

export async function bulkRegisterStudents(fileBuffer: Buffer): Promise<ImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

  const result: ImportResult = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const controlNumber = String(row['No. Control'] ?? row['no_control'] ?? row['controlNumber'] ?? '').trim();
    const name          = String(row['Nombre']      ?? row['name']         ?? '').trim();
    const carrera       = String(row['Programa Educativo'] ?? row['carrera'] ?? '').trim();
    const periodo       = String(row['Periodo']     ?? row['periodo']       ?? '').trim();
    const password      = String(row['Contrasena']  ?? row['password']      ?? '').trim() || controlNumber;

    if (!controlNumber || !name) {
      result.errors.push({ row: i + 2, controlNumber, reason: 'No. Control y Nombre son requeridos' });
      continue;
    }

    try {
      await registerUser({ controlNumber, name, password, role: 'estudiante', carrera, periodo });
      result.created++;
    } catch (e: any) {
      if (e.message?.includes('ya esta registrado')) {
        result.skipped++;
      } else {
        result.errors.push({ row: i + 2, controlNumber, reason: e.message });
      }
    }
  }

  return result;
}
