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

  @Column({ name: 'periodo', length: 30, nullable: true, default: '' })
  periodo!: string;

  @Column({ name: 'student_status', type: 'varchar', default: 'activo' })
  studentStatus!: string;

  @OneToMany(() => DocumentEntity, (doc) => doc.student)
  documents!: DocumentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
