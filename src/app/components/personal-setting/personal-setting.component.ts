import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalSettingModel } from '../../core/models/personal-setting.model';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [CommonModule, MatButtonModule, MatCardModule],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #ngZone = inject(NgZone);
  userSetting: UserSettingModel[] = [];

  constructor() {
    this.getCurrentPersonalSettings();
  }

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent('open-directory', 'open-directory-complete')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(value => console.log(value));
  }

  private getCurrentPersonalSettings() {
    this.#electronService
      .sendEvent<UserSettingModel[]>('user-settings', 'user-settings-complete')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(res => {
        this.#ngZone.run(() => {
          console.log('RES', res);
          this.userSetting = res!.args;
          this.#changeDetectorRef.detectChanges();
        });
      });
  }
}
