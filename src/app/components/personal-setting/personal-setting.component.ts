import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);

  readonly userSettings = this.#userSettingsService.userSettingSignal;

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent('open-directory', 'open-directory-complete')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(value => console.log(value));
  }

  setActiveInstance(settingModel: UserSettingModel) {
    this.userSettings().forEach(us => us.isActive = false);

    settingModel.isActive = !settingModel.isActive;
  }
}
