import { IsAlreadyInstalledDirective } from './is-already-installed.directive';
import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator';

describe('IsAlreadyInstalledDirective', () => {
  let spectator: SpectatorDirective<IsAlreadyInstalledDirective>;
  const createDirective = createDirectiveFactory(IsAlreadyInstalledDirective);

  beforeEach(() => (spectator = createDirective('<div appIsAlreadyInstalled> </div>')));

  it('should create an instance', () => {
    expect(spectator.directive).toBeTruthy();
  });
});
