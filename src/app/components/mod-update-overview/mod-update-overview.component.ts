import { ChangeDetectorRef, Component, computed, DestroyRef, effect, inject, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { ModMeta, UpdateModMeta } from '../../../../shared/models/user-setting.model';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { ModListService } from '../../core/services/mod-list.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatListItemMeta } from '@angular/material/list';
import { ModUpdateService } from './mod-update.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { closest, distance } from 'fastest-levenshtein';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
  imports: [MatSlideToggle, ReactiveFormsModule, MatTooltip, MatIcon, MatIconButton, MatListItemMeta],
  providers: [ModUpdateService],
})
export default class ModUpdateOverviewComponent implements OnInit {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #configurationService = inject(ConfigurationService);
  #destroyRef = inject(DestroyRef);
  #ngZone = inject(NgZone);
  #modUpdateService = inject(ModUpdateService);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeAkiInstance = this.#userSettingsService.getActiveInstance();
  useIndexedModsControl = new FormControl(this.#modListService.useIndexedModsSignal());

  constructor() {
    effect(() => {
      const activeInstance = this.#userSettingsService.userSettingSignal().find(i => i.isActive);
      const indexedMods = this.#modListService.indexedModListSignal();
      const modMetaData = this.#configurationService.configSignal()?.modMetaData;

      let notFound = 0;

      activeInstance?.serverMods?.forEach(mod => {
        const alternativeName = this.#modUpdateService.getModHubMod(mod.name);
        const indexedModHubName = indexedMods.find(m => m.name === alternativeName);
        const indexedModModName = indexedMods.find(m => m.name === mod.name);

        if (!!indexedModHubName || !!indexedModModName) {
          // console.log(mod.name, 'indexedMod');
          mod.hubId = indexedModHubName?.id ?? indexedModModName?.id;
          return;
        }

        const closestAlternativeName = closest(alternativeName ?? '', this.flattenSubMods(modMetaData!));
        const closestModName = closest(mod.name ?? '', this.flattenSubMods(modMetaData!));

        const isHubNameBasedOnLevenshtein = this.isMatchBasedOnLevenshtein(closestAlternativeName, alternativeName);
        const isModNameBasedOnLLevenshtein = this.isMatchBasedOnLevenshtein(closestModName, mod.name);

        if (isHubNameBasedOnLevenshtein) {
          const item = modMetaData?.find(m => m.name === closestAlternativeName);
          mod.hubId = item?.hubId;
          return;
        }

        if (isModNameBasedOnLLevenshtein) {
          const item = modMetaData?.find(m => m.name === closestModName);
          mod.hubId = item?.hubId;
          return;
        }

        console.log('>>>>>> NOT FOUND -> serverMods', mod.name);
        notFound++;
      });

      activeInstance?.clientMods?.forEach(mod => {
        const alternativeName = this.#modUpdateService.getModHubMod(mod.name);
        const indexedModHubName = indexedMods.find(m => m.name === alternativeName);
        const indexedModModName = indexedMods.find(m => m.name === mod.name);

        if (!!indexedModHubName || !!indexedModModName) {
          // console.log(mod.name, 'indexedMod');
          mod.hubId = indexedModHubName?.id ?? indexedModModName?.id;
          return;
        }

        const closestAlternativeName = closest(alternativeName ?? '', this.flattenSubMods(modMetaData!));
        const closestModName = closest(mod.name ?? '', this.flattenSubMods(modMetaData!));

        const isHubNameBasedOnLevenshtein = this.isMatchBasedOnLevenshtein(closestAlternativeName, alternativeName);
        const isModNameBasedOnLLevenshtein = this.isMatchBasedOnLevenshtein(closestModName, mod.name);

        if (isHubNameBasedOnLevenshtein) {
          const item = modMetaData?.find(m => m.name === closestAlternativeName);
          mod.hubId = item?.hubId;
          return;
        }

        if (isModNameBasedOnLLevenshtein) {
          const item = modMetaData?.find(m => m.name === closestModName);
          mod.hubId = item?.hubId;
          return;
        }

        console.log('>>>>>> NOT FOUND -> clientMods', mod.name);
        notFound++;
      });

      console.log('Installed Mods (duplicates counted): ', (activeInstance?.serverMods?.length ?? 0) + (activeInstance?.clientMods?.length ?? 0));
      console.log('Mods not found', notFound);
    });
  }

  private flattenSubMods(mods: { name: string; hubId: string }[]): string[] {
    return mods.flatMap(mod => [...(mod.name ? [mod.name] : [])]);
  }

  ngOnInit() {
    this.getCurrentModMetaData();
  }

  private isMatchBasedOnLevenshtein(stringA = '', stringB = '', threshold = 0.2): boolean {
    if (!stringA || !stringB) {
      return false;
    }

    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;
    return relativeDistance <= threshold;
  }

  openExternal(modPath: string) {
    this.#electronService.openPath(modPath);
  }

  private getCurrentModMetaData() {
    this.#electronService.sendEvent<UpdateModMeta[]>('update-mod-data').subscribe(async value => {
      // https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
      // https://hub.sp-tarkov.com/files/
      // file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
      // console.log(value.args);
      //this.#httpClient
      //  .get(`${environment.akiFileBaseLink}/file/1062/#versions`, { observe: 'response', responseType: 'text' })
      //  .pipe(
      //    catchError(e => {
      //      console.log(e);
      //      console.log(e['headers']);
      //      return e;
      //    })
      //  )
      //  .subscribe(resp => {
      //    //console.log(resp);
      //    //console.log(resp['headers']);
      //    //if (resp.url != null) {
      //    //  // window.location.href = resp.url;
      //    //}
      //  });
      //
      //this.#httpClient
      //  .get(`files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions`, {
      //
      //    responseType: 'text',
      //  })
      //  .pipe(takeUntilDestroyed(this.#destroyRef))
      //  .subscribe(r => console.log(r));
    });
  }

  private async checkForUpdateFromIndexedList() {
    try {
      const indexedMods = this.#modListService.indexedModListSignal();

      // const updatesAvailable = response.filter(mod => {
      //   const indexedMod = indexedMods.find(indexedMod => indexedMod.modId === mod.modId);
      //   if (!indexedMod) {
      //     return true;
      //   }
      //
      //   // Or use a custom function to compare versions if it's not a simple number. E.g., '1.0.2'
      //   return indexedMod.version !== mod.version;
      // });

      // if (updatesAvailable.length > 0) {
      //   console.log('Updates Available: ', updatesAvailable);
      //   // Do something with the mods that need to be updated.
      // }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
}
