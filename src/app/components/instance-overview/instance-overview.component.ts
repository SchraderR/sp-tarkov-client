import { ChangeDetectorRef, Component, inject, NgZone, TemplateRef, ViewChild } from '@angular/core';
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
import { ModCache, ModMeta } from '../../../../shared/models/user-setting.model';
import { NgPipesModule } from 'ngx-pipes';
import { ToggleModStateModel } from '../../../../shared/models/toggle-mod-state.model';
import { DialogModule } from '@angular/cdk/dialog';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { ModListService } from '../../core/services/mod-list.service';
import { Mod } from '../../core/models/mod';
import { SptSearchService } from '../../core/services/spt-search.service';
import { TrackedMod } from '../../../../shared/models/tracked-mod.model';

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
    MatTooltip,
  ],
})
export default class InstanceOverviewComponent {
  @ViewChild('instanceToggleModWarning', { static: true }) instanceToggleModWarning!: TemplateRef<unknown>;

  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #modListService = inject(ModListService);
  #searchService = inject(SptSearchService);

  activeInstance = this.#userSettingsService.getActiveInstance();
  isWorking = false;

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

  async exportModsToFileSystem() {
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!activeInstance || !activeInstance.trackedMods.length) {
      return;
    }

    if (activeInstance?.trackedMods.length === 0) {
      return;
    }

    await firstValueFrom(
      this.#electronService.sendEvent(
        'export-mods-file-system',
        activeInstance.trackedMods?.map(m => m.hubId)
      )
    );
  }

  async importModsFromFileSystem() {
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!activeInstance) {
      return;
    }

    this.#electronService.sendEvent<Mod[]>('import-mods-file-system').subscribe(importedMods => {
      this.#ngZone.run(() => {
        const trackedModHubIds = activeInstance.trackedMods.map(mod => mod.hubId);
        const filteredMods = importedMods.args.filter(importedMod => !trackedModHubIds.includes(importedMod.hubId ?? ''));

        filteredMods.forEach(async importedMod => {
          const modInfo = await firstValueFrom(this.#searchService.getFileHubView(importedMod.fileUrl));
          const modCacheItem: ModCache = {
            hubId: modInfo.hubId,
            name: modInfo.name,
            icon: modInfo.icon,
            image: modInfo.image,
            fileUrl: modInfo.fileUrl,
            teaser: modInfo.teaser,
            supportedSptVersion: modInfo.supportedSptVersion,
            sptVersionColorCode: modInfo.sptVersionColorCode,
          };

          await this.#modListService.addMod(modInfo);
          await firstValueFrom(this.#electronService.sendEvent('add-mod-list-cache', modCacheItem));
        });

        this.#changeDetectorRef.detectChanges();
      });
    });
  }

  toggleModState(mod: TrackedMod, remove = false) {
    if (!this.activeInstance) {
      return;
    }

    this.isWorking = true;

    const toggleModState: ToggleModStateModel = {
      hubId: mod.hubId,
      instancePath: this.activeInstance.sptRootDirectory ?? this.activeInstance.akiRootDirectory,
      remove: remove,
    };

    this.#electronService.sendEvent<void, ToggleModStateModel>('toggle-mod-state', toggleModState).subscribe(() => {
      this.#ngZone.run(() => {
        const activeInstance = this.#userSettingsService.getActiveInstance();
        if (!activeInstance) {
          return;
        }

        if (toggleModState.remove) {
          activeInstance.trackedMods = activeInstance.trackedMods.filter(m => m.hubId !== toggleModState.hubId);
        } else {
          mod.isActive = !mod.isActive;
        }

        this.isWorking = false;
        this.#userSettingsService.updateUserSetting();
        this.#changeDetectorRef.detectChanges();
      });
    });
  }
}
