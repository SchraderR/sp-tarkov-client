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

  activeAkiInstance = this.#userSettingsService.getActiveInstance();

  openExternal(modPath: string) {
    this.#electronService.openPath(modPath);
  }

  openRealismTool(modPath: string) {
    this.#electronService.openPath(modPath + '/RealismModConfig.exe');
  }

  openSVMTool(modPath: string) {
    this.#electronService.openPath(modPath + '/Greed.exe');
  }

  toggleModState(mod: ModMeta, isServerMod = false) {
    if (!this.activeAkiInstance) {
      return;
    }
    const toggleModState: ToggleModStateModel = {
      isServerMod: isServerMod,
      akiInstancePath: this.activeAkiInstance.akiRootDirectory,
      modOriginalPath: mod.modOriginalPath,
      modOriginalName: mod.modOriginalName,
      modWillBeDisabled: mod.isEnabled,
    };

    this.#electronService.sendEvent<boolean, ToggleModStateModel>('toggle-mod-state', toggleModState).subscribe(() => {
      this.#ngZone.run(() => {
        console.log(mod);
        mod.isEnabled = !mod.isEnabled;
      });
    });
  }
}
