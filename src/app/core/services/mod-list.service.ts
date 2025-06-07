import { inject, Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { FileHelper } from '../helper/file-helper';
import { ConfigurationService } from './configuration.service';
import { catchError, firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import { ElectronService } from './electron.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HtmlHelper } from '../helper/html-helper';
import { ForgeMod } from './forge-api.service';
import { SptVersion } from '../../../../shared/models/spt-core.model';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  readonly #configurationService = inject(ConfigurationService);
  readonly #electronService = inject(ElectronService);
  readonly #httpClient = inject(HttpClient);

  private modList = signal<Mod[]>([]);
  readonly modListSignal = this.modList.asReadonly();

  async addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);

    const modDependenciesIds = this.getModDependenciesIds(mod);
    if (modDependenciesIds.length > 0) {
      const signalMod = this.modList().find(m => m.name === mod.name);
      if (!signalMod) {
        return;
      }

      signalMod.isDependenciesLoading = true;
      // TODO MOD DEPENDENCY
      // signalMod.dependencies = await firstValueFrom(this.fetchModDependencyData(FileHelper.extractHubIdFromUrl(mod.fileUrl), modDependenciesIds));
      signalMod.isDependenciesLoading = false;
      signalMod.installProgress = this.initialInstallProgress();
      this.updateMod();
    }
    this.updateMod();
  }

  updateMod() {
    this.modList.update(state => [...state]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }

  removeCompletedMods() {
    this.modList.update(() => [...this.modList().filter(m => !m.installProgress?.completed)]);
  }

  initialInstallProgress(): InstallProgress {
    return {
      completed: false,
      error: false,
      downloadStep: {
        start: false,
        error: false,
        percent: 0,
        totalBytes: '',
        transferredBytes: '',
      },
      unzipStep: {
        start: false,
        error: false,
        progress: 0,
      },
    };
  }

  clearFakeTutorialMods() {
    this.modList.set([]);
  }

  addFakeModForTutorial() {
    this.modList.set([
      {
        name: "Amands's Graphics",
        detail_url: null!,
        thumbnail: 'assets/images/813.png',
        teaser: 'Lighting and postprocessing overhaul',
        versions: [{ version: 'SPT 5.0.0' } as SptVersion],
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        // TODO sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        // TODO isInvalid: false,
        id: 0,
        hub_id: null,
        slug: '',
        downloads: 0,
        source_code_url: '',
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
      {
        name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
        detail_url: null!,
        thumbnail: 'assets/images/1062.jpg',
        teaser: "Bots that don't suck.",
        versions: [{ version: 'SPT 5.0.0' } as SptVersion],
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        // TODO sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        // TODO isInvalid: false,
        id: 0,
        hub_id: null,
        slug: '',
        downloads: 0,
        source_code_url: '',
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
      {
        name: 'SPT Realism Mod',
        detail_url: null!,
        thumbnail: 'assets/images/606.png',
        teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
        versions: [{ version: 'SPT 5.0.0' } as SptVersion],
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        // TODO sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        // TODO isInvalid: false,
        id: 0,
        hub_id: null,
        slug: '',
        downloads: 0,
        source_code_url: '',
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
    ]);
  }

  private getModDependenciesIds(mod: Mod) {
    const config = this.#configurationService.configSignal();
    if (!mod.id || !config) {
      return [];
    }

    const modDependencySetting = config.modDependency.find(d => d.hubId === mod.id);
    if (!modDependencySetting) {
      return [];
    }

    return modDependencySetting.dependencies;
  }

  // TODO CHECK MOD DEPENDENCY
  // will be implemented later with the forgeApi

  // private fetchModDependencyData(modId: string | null, modDependencies: string[]) {
  //   return forkJoin(
  //     modDependencies.map((dep, i) =>
  //       this.#electronService.sendEvent<string, string>('get-mod-page', dep, `${modId}-${i}-${dep}`).pipe(
  //         switchMap(modPageLink => {
  //           const modUrl = environment.production ? modPageLink.args : modPageLink.args.replace('https://hub.sp-tarkov.com/', '');
  //           return this.#httpClient.get(modUrl, { responseType: 'text' }).pipe(
  //             map(modView => ({ hubId: dep, ...this.extractModInformation(modView, modPageLink.args) })),
  //             catchError(() => this.handleDependencyError())
  //           );
  //         }),
  //         map(e => e as Mod),
  //         catchError(() => this.handleDependencyError())
  //       )
  //     )
  //   );
  // }

  private handleDependencyError() {
    return of({
      name: 'Error while fetching dependency. Please check the hub page',
      supportedSptVersion: 'Error while fetching dependency version',
      sptVersionColorCode: 'badge label red',
      isInvalid: true,
    } as unknown as Mod);
  }
}
