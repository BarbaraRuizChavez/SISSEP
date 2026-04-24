import 'reflect-metadata';
import { DataSource }     from 'typeorm';
import { ENV }            from './env';
import { UserEntity }     from '../models/UserEntity';
import { DocumentEntity } from '../models/DocumentEntity';

export const AppDataSource = new DataSource({
  type:       'postgres',
  host:        ENV.DB.HOST,
  port:        ENV.DB.PORT,
  username:    ENV.DB.USER,
  password:    ENV.DB.PASS,
  database:    ENV.DB.NAME,
  // synchronize crea y actualiza las tablas automaticamente en desarrollo.
  // En produccion debe ser false y usar migraciones.
  synchronize: ENV.NODE_ENV === 'development',
  logging:     false,
  entities:    [UserEntity, DocumentEntity],
});

export async function connectDB(): Promise<void> {
  await AppDataSource.initialize();
  console.log('[DB] PostgreSQL conectado correctamente');
}
