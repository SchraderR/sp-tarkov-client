import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services';
import { PersonalSettingModel } from '../../core/models/personal-setting.model';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [CommonModule, MatButtonModule],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  personalSetting: PersonalSettingModel | null = null;

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
      .sendEvent<PersonalSettingModel>('user-settings', 'user-settings-complete')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(res => {
        this.personalSetting = res!.args;
        this.#changeDetectorRef.detectChanges();
      });
  }
}
