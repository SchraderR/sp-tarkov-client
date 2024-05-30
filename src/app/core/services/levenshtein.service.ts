import { Injectable } from '@angular/core';
import { distance } from 'fastest-levenshtein';
import { ModMeta } from '../../../../shared/models/user-setting.model';

@Injectable({
  providedIn: 'root',
})
export class LevenshteinService {
  isMatchBasedOnLevenshtein(stringA = '', stringB = '', threshold = 0.2): boolean {
    if (!stringA || !stringB) {
      return false;
    }

    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;

    return relativeDistance <= threshold;
  }

  flattenSubMods(mods: ModMeta[]): string[] {
    return mods.flatMap(mod => [
      ...(mod.name ? [mod.name] : []),
      ...(mod.alternativeName ? [mod.alternativeName] : []),
      ...this.flattenSubMods(mod.subMods ?? []),
    ]);
  }
}
