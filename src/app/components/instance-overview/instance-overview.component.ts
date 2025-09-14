import { ChangeDetectorRef, Component, inject, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
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

@Component({
    selector: 'app-instance-overview',
    templateUrl: './instance-overview.component.html',
    styleUrl: './instance-overview.component.scss',
    imports: [
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
    MatCardContent
]
})
export default class InstanceOverviewComponent implements OnInit {
  @ViewChild('instanceToggleModWarning', { static: true }) instanceToggleModWarning!: TemplateRef<unknown>;

  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #matDialog = inject(MatDialog);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeSptInstance = this.#userSettingsService.getActiveInstance();
  isExperimentalFunctionActive = this.#userSettingsService.isExperimentalFunctionActive;
  isWorking = false;
  isToggleWarningButtonDisabled = true;
  counter = 5;
  toggleWarningDialogRef!: MatDialogRef<unknown, unknown>;

  ngOnInit() {
    if (this.isExperimentalFunctionActive() && !this.#userSettingsService.wasInstanceOverviewReviewed()) {
      this.toggleWarningDialogRef = this.#matDialog.open(this.instanceToggleModWarning, {
        disableClose: true,
        width: '50%',
      });

      const countdown = setInterval(() => {
        if (this.counter === 0) {
          this.isToggleWarningButtonDisabled = false;
          clearInterval(countdown);
        } else {
          this.counter--;
        }
      }, 1000);
    }
  }

  openExternal(mod: ModMeta) {
    let modPath = mod.modPath;
    if (modPath.endsWith(mod.modOriginalName)) {
      modPath = modPath.split(mod.modOriginalName)[0];
    }

    this.#electronService.openPath(modPath);
  }

  setToggleWarningState() {
    this.#userSettingsService.wasInstanceOverviewReviewed.set(true);
    this.toggleWarningDialogRef.close(true);
  }

  toggleModState(mod: ModMeta, isServerMod = false) {
    if (!this.activeSptInstance || this.isWorking) {
      return;
    }

    const toggleModState: ToggleModStateModel = {
      isServerMod: isServerMod,
      sptInstancePath: this.activeSptInstance.sptRootDirectory ?? this.activeSptInstance.akiRootDirectory,
      modOriginalPath: mod.modOriginalPath,
      modOriginalName: mod.modOriginalName,
      isPrePatcherMod: mod.isPrePatcherMod ?? false,
      modWillBeDisabled: mod.isEnabled,
    };

    this.isWorking = true;

    this.#electronService
      .sendEvent<{ path: string; name: string; isEnabled: boolean }, ToggleModStateModel>('toggle-mod-state', toggleModState)
      .subscribe(disabledMod => {
        this.#ngZone.run(() => {
          this.isWorking = false;
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
