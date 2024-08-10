import { inject, Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { FileHelper } from '../helper/file-helper';
import { ConfigurationService } from './configuration.service';
import { catchError, firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import { ElectronService } from './electron.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HtmlHelper } from '../helper/html-helper';
import { DirectoryError } from '../models/directory-error';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  readonly #configurationService = inject(ConfigurationService);
  readonly #electronService = inject(ElectronService);
  readonly #httpClient = inject(HttpClient);

  private modList = signal<Mod[]>([]);
  private useIndexedMods = signal<boolean>(false);
  readonly modListSignal = this.modList.asReadonly();
  readonly useIndexedModsSignal = this.useIndexedMods.asReadonly();

  setUseIndexedMods(value: boolean) {
    this.useIndexedMods.set(value);
  }

  async addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);

    const modDependencies = this.getModDependencies(mod);
    if (modDependencies.length > 0) {
      const signalMod = this.modList().find(m => m.name === mod.name);
      if (!signalMod) {
        return;
      }

      signalMod.isDependenciesLoading = true;
      signalMod.dependencies = await firstValueFrom(this.fetchModDependencyData(FileHelper.extractFileIdFromUrl(mod.fileUrl), modDependencies));
      signalMod.isDependenciesLoading = false;
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
      linkStep: {
        start: false,
        error: false,
        progress: 0,
      },
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
        fileUrl: null!,
        image: 'assets/images/813.png',
        teaser: 'Lighting and postprocessing overhaul',
        supportedSptVersion: 'SPT 5.0.0',
        kind: 'Mod',
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        isInvalid: false,
      },
      {
        name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
        fileUrl: null!,
        image: 'assets/images/1062.jpg',
        teaser: "Bots that don't suck.",
        supportedSptVersion: 'SPT 5.0.0',
        kind: 'Mod',
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        isInvalid: false,
      },
      {
        name: 'SPT Realism Mod',
        fileUrl: null!,
        image: 'assets/images/606.png',
        teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
        supportedSptVersion: 'SPT 5.0.0',
        kind: 'Mod',
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        sptVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
        isInvalid: false,
      },
    ]);
  }

  private getModDependencies(mod: Mod) {
    const config = this.#configurationService.configSignal();
    const fileId = FileHelper.extractFileIdFromUrl(mod.fileUrl);

    if (!fileId || !config) {
      return [];
    }

    const modDependencySetting = config.modDependency.find(d => d.hubId === fileId);
    if (!modDependencySetting) {
      return [];
    }

    return modDependencySetting.dependencies;
  }

  private fetchModDependencyData(modId: string | null, modDependencies: string[]) {
    return forkJoin(
      modDependencies.map((dep, i) =>
        this.#electronService.sendEvent<string, string>('get-mod-page', dep, `${modId}-${i}-${dep}`).pipe(
          switchMap(modPageLink => {
            const modUrl = environment.production ? modPageLink.args : modPageLink.args.replace('https://hub.sp-tarkov.com/', '');
            return this.#httpClient.get(modUrl, { responseType: 'text' }).pipe(
              map(modView => this.extractModInformation(modView, modPageLink.args)),
              catchError(() => this.handleDependencyError())
            );
          }),
          map(e => e as Mod),
          catchError(() => this.handleDependencyError())
        )
      )
    );
  }

  private extractModInformation(htmlResult: string, modUrl: string): Mod | null {
    const modPageView = HtmlHelper.parseStringAsHtml(htmlResult);

    if (!modPageView) {
      return null;
    }

    return {
      name: modPageView.getElementsByClassName('contentTitle')?.[0]?.getElementsByTagName('span')[0].innerHTML,
      fileUrl: modUrl,
      supportedSptVersion: modPageView.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.innerHTML ?? '',
      sptVersionColorCode: modPageView.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.className,
    } as Mod;
  }

  private handleDependencyError() {
    return of({
      name: 'Error while fetching dependency. Please check the hub page',
      supportedSptVersion: 'Error while fetching dependency version',
      sptVersionColorCode: 'badge label red',
      isInvalid: true,
    } as unknown as Mod);
  }
}
