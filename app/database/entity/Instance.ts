import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Instance' })
export class InstanceEntity {
  @PrimaryGeneratedColumn() id!: number
  @Column() sptRootDirectory!: string;
  @Column() isActive!: boolean;
  @Column({ type: 'simple-json', nullable: true }) modCache!: number[] | null;
}
