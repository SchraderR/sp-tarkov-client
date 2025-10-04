import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InstanceEntity } from './Instance';

@Entity({name: 'Core'})
export class CoreEntity {
    @PrimaryGeneratedColumn() id: number
    @Column() theme: 'system' | 'dark' | 'light'
    @Column() isTutorialDone: boolean
    @Column() isExperimentalFunctionsActive: boolean
    @Column() keepTempDownloadDirectory: boolean
    @Column() isCheckInstalledActive: boolean

    @OneToMany(() => InstanceEntity, (instance) => instance.core)
    instances: InstanceEntity[]
}
