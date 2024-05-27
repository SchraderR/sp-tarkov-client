import { inject, Injectable } from '@angular/core';
import { Configuration, ConfigurationService } from '../../core/services/configuration.service';
import { ModListService } from '../../core/services/mod-list.service';
import alternativeModNames from '../../core/directives/backupAlternativeNames.json';
import { ModMeta } from '../../../../shared/models/user-setting.model';

@Injectable()
export class ModUpdateService {
  #configurationService = inject(ConfigurationService);
  #modListService = inject(ModListService);

  constructor() {}

  assignAlternativeNames(mods: ModMeta[], alternativeNames: { [key: string]: string }) {
    for (const mod of mods) {
      if (Object.prototype.hasOwnProperty.call(alternativeNames, mod.name.trim())) {
        mod.alternativeName = alternativeNames[mod.name.trim()];
      }

      if (mod.subMods) {
        this.assignAlternativeNames(mod.subMods, alternativeNames); // Recursive call for subMods
      }
    }

    return mods;
  }
}
