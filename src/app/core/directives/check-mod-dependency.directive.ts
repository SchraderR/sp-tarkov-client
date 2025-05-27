import { computed, Directive, inject, input } from '@angular/core';
import { ConfigurationService } from '../services/configuration.service';
import { Mod } from '../models/mod';
import { FileHelper } from '../helper/file-helper';

@Directive({
  standalone: true,
  selector: '[appCheckModDependency]',
  exportAs: 'hasModDependencies',
})
export class CheckModDependencyDirective {
  #configurationService = inject(ConfigurationService);

  readonly mod = input.required<Mod>();

  hasModDependencies = computed(() => this.checkForModDependencies());

  private checkForModDependencies() {
    const config = this.#configurationService.configSignal();
    const fileId = FileHelper.extractHubIdFromUrl(this.mod().fileUrl);

    if (!fileId || !config) {
      return false;
    }

    const modDependencySetting = config.modDependency.find(d => d.hubId === fileId);
    if (!modDependencySetting) {
      return false;
    }

    return !!modDependencySetting;
  }
}
