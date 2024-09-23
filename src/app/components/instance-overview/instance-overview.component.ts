import { ChangeDetectorRef, Component, computed, effect, inject, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { DialogModule } from '@angular/cdk/dialog';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { TrackedMod } from '../../../../app/events/file-tracking.event';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DownloadService } from '../../core/services/download.service';

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
    DialogModule,
    MatCard,
    MatCardActions,
    MatCardHeader,
    MatCardContent,
  ],
})
export default class InstanceOverviewComponent {
  @ViewChild('instanceToggleModWarning', { static: true }) instanceToggleModWarning!: TemplateRef<unknown>;

  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeSptInstance = this.#userSettingsService.getActiveInstance();

  openExternal(mod: ModMeta) {
    let modPath = mod.modPath;
    if (modPath.endsWith(mod.modOriginalName)) {
      modPath = modPath.split(mod.modOriginalName)[0];
    }

    this.#electronService.openPath(modPath);
  }

  openExternalHub(hubId: string) {
    this.#electronService.openExternal(`${environment.sptFileBaseLink}/file/${hubId}`);
  }

  toggleModState(mod: TrackedMod) {
    if (!this.activeSptInstance) {
      return;
    }

    const toggleModState: ToggleModStateModel = {
      hubId: mod.hubId,
      instancePath: this.activeSptInstance.sptRootDirectory ?? this.activeSptInstance.akiRootDirectory,
    };

    this.#electronService
      .sendEvent<{ path: string; name: string; isEnabled: boolean }, ToggleModStateModel>('toggle-mod-state', toggleModState)
      .subscribe(() => {
        this.#ngZone.run(() => {
          const activeInstance = this.#userSettingsService.getActiveInstance();
          if (!activeInstance) {
            return;
          }

          mod.isActive = !mod.isActive;
          this.#userSettingsService.updateUserSetting();
          this.#changeDetectorRef.detectChanges();
        });
      });
  }
}
