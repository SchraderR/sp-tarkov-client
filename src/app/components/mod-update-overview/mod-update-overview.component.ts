import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { HtmlHelper } from '../../core/helper/html-helper';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { UpdateModMeta } from '../../../../shared/models/user-setting.model';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
})
export default class ModUpdateOverviewComponent implements OnInit {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #destroyRef = inject(DestroyRef);
  accumulatedVersionList: any[] = [];

  ngOnInit() {
    this.getCurrentModMetaData();
  }

  private getCurrentModMetaData() {
    this.#electronService.sendEvent<UpdateModMeta[]>('update-mod-data').subscribe(async value => {
      const clientMods = this.#userSettingsService.getActiveInstance()?.clientMods;
      console.log(clientMods);
      let extendedModList: any[] = [];

      clientMods?.forEach(m => {
        console.log(m);
        // if (m.name !== 'SAIN') return;
        console.log(value.args);

        value.args.forEach(um => {
          const urlString = um.url.split(`${um.hubId}-`)[1].toLowerCase().replace('/', '');
          let alternativeName = m.alternativeName?.toLowerCase();

          //console.log(urlString);
          //console.log(alternativeName);

          // Remove quotes
          alternativeName = alternativeName?.replace(/"/g, '-');
          alternativeName = alternativeName?.replace(/ - /g, '-');
          alternativeName = alternativeName?.replace(/[\s.]/g, '-');

          if (urlString === alternativeName) {
            extendedModList.push({ ...um, ...m });
          }
        });
      });

      // https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
      // https://hub.sp-tarkov.com/files/
      // file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions

      console.log(value.args);

      extendedModList.forEach(em => {
        console.log(em);
        const baseLink = em.url.replace('https://hub.sp-tarkov.com/', '');

        this.#httpClient
          .get(`${baseLink}/#versions`, { responseType: 'text' })
          .pipe()
          .subscribe((versionResult: string) => {
            const versionView = HtmlHelper.parseStringAsHtml(versionResult);
            const versionList = versionView.body.getElementsByClassName('filebaseVersion');

            let cleanedVersion = em.version.trim();

            const accumulatedVersionList = Array.from(versionList).map(e => e.getElementsByClassName('externalURL')[0].innerHTML);
            const clearedModVersion = accumulatedVersionList.map(version => version.replace(/Version /, '').replace(/ hotfix/, ''));
            let cleanedVersionArray = cleanedVersion.split('.').map(Number);

            let higherVersions = clearedModVersion.filter(version => {
              let versionArray = version.split('.').map(Number);

              for (let i = 0; i < versionArray.length; i++) {
                if (versionArray[i] > cleanedVersionArray[i]) {
                  return true;
                } else if (versionArray[i] < cleanedVersionArray[i]) {
                  return false;
                }
              }

              return false;
            });

            console.log(higherVersions);
            console.log(!!higherVersions.length);

            if (!!higherVersions.length) {
              this.#electronService
                .sendEvent('notification-publish', { modName: em.name ?? em.alternativeName, modVersion: higherVersions[0] })
                .subscribe();
            }

            this.accumulatedVersionList = Array.from(versionList).map(e => ({
              name: em.name,
              version: e.getElementsByClassName('externalURL')[0].innerHTML,
            }));

            //.filter(e => this.filterCoreMods(e));
          });
      });
    });
  }
}
