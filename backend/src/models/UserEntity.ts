import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { UserRole }       from '../types';
import { DocumentEntity } from './DocumentEntity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'control_number', unique: true, length: 30 })
  controlNumber!: string;

  @Column({ name: 'name', length: 140 })
  name!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'role', type: 'varchar', default: 'estudiante' })
  role!: UserRole;

  @Column({ name: 'carrera', length: 140, nullable: true, default: '' })
  carrera!: string;

  // Solo relevante para usuarios con role = 'encargado'
  @Column({ name: 'encargado_section', length: 80, nullable: true, default: '' })
  encargadoSection!: string;

  @OneToMany(() => DocumentEntity, (doc) => doc.student)
  documents!: DocumentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
