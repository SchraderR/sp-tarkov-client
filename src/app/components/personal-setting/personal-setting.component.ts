import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services';
import { PersonalSettingModel } from '../../core/models/personal-setting.model';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [CommonModule],
})
export default class PersonalSettingComponent {
  #electronService = inject(ElectronService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  personalSetting: PersonalSettingModel | null = null;

  constructor() {
    this.#electronService.sendEvent<PersonalSettingModel>('user-settings', 'user-settings-complete').subscribe(res => {
      this.personalSetting = res!.args;
      this.#changeDetectorRef.detectChanges();
    });
  }
}
