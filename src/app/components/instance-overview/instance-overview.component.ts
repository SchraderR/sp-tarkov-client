import { ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/services/electron.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ModMeta } from '../../../../shared/models/user-setting.model';
import { NgPipesModule } from 'ngx-pipes';
import { ToggleModStateModel } from '../../../../shared/models/toggle-mod-state.model';

@Component({
  standalone: true,
  selector: 'app-instance-overview',
  templateUrl: './instance-overview.component.html',
  styleUrl: './instance-overview.component.scss',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatSlideToggleModule,
    NgPipesModule,
  ],
})
export default class InstanceOverviewComponent {
  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeSptInstance = this.#userSettingsService.getActiveInstance();

  openExternal(mod: ModMeta) {
    console.log(mod);

    let modPath = mod.modPath;
    if (modPath.endsWith(mod.modOriginalName)) {
      modPath = modPath.split(mod.modOriginalName)[0];
    }

    console.log(modPath);

    this.#electronService.openPath(modPath);
  }

  openRealismTool(modPath: string) {
    this.#electronService.openPath(modPath + '/RealismModConfig.exe');
  }

  openSVMTool(modPath: string) {
    this.#electronService.openPath(modPath + '/Greed.exe');
  }

  toggleModState(mod: ModMeta, isServerMod = false) {
    console.log(mod.isMoving);
    if (!this.activeSptInstance || mod.isMoving) {
      return;
    }

    const toggleModState: ToggleModStateModel = {
      isServerMod: isServerMod,
      sptInstancePath: this.activeSptInstance.sptRootDirectory ?? this.activeSptInstance.akiRootDirectory,
      modOriginalPath: mod.modOriginalPath,
      modOriginalName: mod.modOriginalName,
      modWillBeDisabled: mod.isEnabled,
    };

    mod.isMoving = true;

    this.#electronService
      .sendEvent<{
        path: string;
        name: string;
        isEnabled: boolean
      }, ToggleModStateModel>('toggle-mod-state', toggleModState)
      .subscribe(disabledMod => {
        this.#ngZone.run(() => {
          mod.isMoving = false
          const activeInstance = this.#userSettingsService.getActiveInstance();
          if (!activeInstance) {
            return;
          }

          mod.modOriginalPath = disabledMod.args.path;
          mod.modPath = disabledMod.args.path;
          mod.isEnabled = disabledMod.args.isEnabled;
          mod.subMods?.map(m => (m.modPath = disabledMod.args.path));

          this.#userSettingsService.updateUserSetting();
          this.#changeDetectorRef.detectChanges();
        });
      });
  }
}
