import { Component, inject } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  standalone: true,
  selector: 'app-instance-overview',
  templateUrl: './instance-overview.component.html',
  styleUrl: './instance-overview.component.scss',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, MatListModule, MatIconModule],
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
}
