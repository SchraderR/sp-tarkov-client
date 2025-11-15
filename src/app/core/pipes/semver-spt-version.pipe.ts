import { Pipe, PipeTransform, inject } from '@angular/core';
import { satisfies } from 'semver';
import { ConfigurationService } from '../services/configuration.service';

@Pipe({
  name: 'semverSptVersion',
})
export class SemverSptVersionPipe implements PipeTransform {
  private configurationService = inject(ConfigurationService);

  transform(modSptVersionConstraint?: string): any {
    if (!modSptVersionConstraint) {
      return null;
    }

    const matchingVersions = this.configurationService.sptVersionSignal().filter(v => satisfies(v.version, modSptVersionConstraint));

    return matchingVersions?.[0] ?? null;
  }
}
