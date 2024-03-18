import { IsAlreadyInstalledDirective } from './is-already-installed.directive';
import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator';
import { Kind } from '../../../../shared/models/unzip.model';
import { UserSettingsService } from '../services/user-settings.service';
import { ModListService } from '../services/mod-list.service';

describe('IsAlreadyInstalledDirective', () => {
  let spectator: SpectatorDirective<IsAlreadyInstalledDirective>;
  const createDirective = createDirectiveFactory({
    directive: IsAlreadyInstalledDirective,
    providers: [ModListService, UserSettingsService],
  });

  beforeEach(() => (spectator = createDirective('<div appIsAlreadyInstalled> </div>')));

  it('should create an instance', () => expect(spectator.directive).toBeTruthy());

  describe('isAlreadyInstalled', () => {
    it('should return false when no mods are installed at all', () => {
      spectator.directive.mod = { name: 'non-existing module', fileUrl: 'url', kind: Kind.client, extended: false };

      expect(spectator.directive.isAlreadyInstalled()).toEqual(false);
    });

    it('should return false when the mod is not installed', () => {
      spyOn(spectator.inject(UserSettingsService), 'getActiveInstance').and.returnValue({
        serverMods: [{ name: 'mod' }],
        clientMods: [],
      });
      spectator.directive.mod = { name: 'non-existing module', fileUrl: 'url', kind: Kind.client, extended: false };

      expect(spectator.directive.isAlreadyInstalled()).toEqual(false);
    });

    it('should return true when the mod is installed', () => {
      spyOn(spectator.inject(UserSettingsService), 'getActiveInstance').and.returnValue({
        serverMods: [{ name: 'mod' }],
        clientMods: [],
      });
      spectator.directive.mod = { name: 'mod', fileUrl: 'url', kind: Kind.client, extended: false };

      expect(spectator.directive.isAlreadyInstalled()).toEqual(true);
    });
  });

  describe('isInModList', () => {
    it('should return false when the mod is not in the mod list', () => {
      spyOn(spectator.inject(ModListService), 'modListSignal').and.returnValue([]);
      spectator.directive.mod = { name: 'non-existing module', fileUrl: 'url', kind: Kind.client, extended: false };

      expect(spectator.directive.isInModList()).toEqual(false);
    });

    it('should return true when the mod is in the mod list', () => {
      spyOn(spectator.inject(ModListService), 'modListSignal').and.returnValue([
        { name: 'existing module', fileUrl: 'url', kind: Kind.client, extended: false },
      ]);
      spectator.directive.mod = { name: 'existing module', fileUrl: 'url', kind: Kind.client, extended: false };

      expect(spectator.directive.isInModList()).toEqual(true);
    });
  });
});
