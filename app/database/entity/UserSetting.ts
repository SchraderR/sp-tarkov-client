import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'UserSetting' })
export class UserSettingEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() theme!: 'system' | 'dark' | 'light';
  @Column() isTutorialDone!: boolean;
  @Column() isExperimentalFunctionsActive!: boolean;
  @Column() keepTempDownloadDirectory!: boolean;
}
