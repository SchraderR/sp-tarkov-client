import { IsAlreadyInstalledDirective } from './is-already-installed.directive';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator';
import { ConfigurationService } from '../services/configuration.service';

describe('IsAlreadyInstalledDirective', () => {
  let spectator: SpectatorDirective<IsAlreadyInstalledDirective>;
  const createDirective = createDirectiveFactory({ directive: IsAlreadyInstalledDirective, providers: [mockProvider(ConfigurationService)] });

  beforeEach(() => (spectator = createDirective('<div appIsAlreadyInstalled> </div>')));

  it('should create an instance', () => {
    expect(spectator.directive).toBeTruthy();
  });
});
