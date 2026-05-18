import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('delivery_periods')
export class DeliveryPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'period_number', type: 'int' })
  periodNumber!: number;

  @Column({ name: 'label', length: 100 })
  label!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'program_type', type: 'varchar', length: 30 })
  programType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
