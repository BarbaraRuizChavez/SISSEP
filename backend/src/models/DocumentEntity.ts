import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { DocStatus, ProgramType } from '../types';
import { UserEntity }             from './UserEntity';

@Entity('documents')
// Garantiza que un estudiante no tenga dos filas para el mismo documento
@Index(['studentId', 'programType', 'category'], { unique: true })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => UserEntity, (u) => u.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: UserEntity;

  @Column({ name: 'program_type', type: 'varchar' })
  programType!: ProgramType;

  @Column({ name: 'category', length: 120 })
  category!: string;

  @Column({ name: 'description', type: 'text', default: '' })
  description!: string;

  @Column({ name: 'status', type: 'varchar', default: 'pendiente' })
  status!: DocStatus;

  // Archivo fisico subido por el estudiante
  @Column({ name: 'file_name', type: 'varchar', length: 260, nullable: true })
  fileName!: string | null;

  // Ruta relativa desde cwd(), e.g. uploads/servicio_social/ISC/Juan/archivo.pdf
  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath!: string | null;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize!: number | null;

  // URL de Google Drive, OneDrive o Dropbox
  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  // Comentario del encargado al aprobar o rechazar
  @Column({ name: 'observations', type: 'text', default: '' })
  observations!: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
