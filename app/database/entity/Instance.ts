import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CoreEntity } from './Core';

@Entity({name: 'Instance'})
export class InstanceEntity {
  @PrimaryGeneratedColumn() id: number
  @Column() sptRootDirectory: string
  @Column() isActive: boolean

  @ManyToOne(() => CoreEntity, (core) => core.instances)
  core: CoreEntity
}
