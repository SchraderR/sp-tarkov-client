import { Component, inject } from '@angular/core';
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

  toggleModState(mod: ModMeta) {
    mod.isEnabled = !mod.isEnabled;
    console.log(mod);
  }
}
