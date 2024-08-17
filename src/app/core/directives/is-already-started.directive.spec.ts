import { IsAlreadyStartedDirective } from './is-already-started.directive';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator';
import { ModListService } from '../services/mod-list.service';

describe('IsAlreadyStartedDirective', () => {
  let spectator: SpectatorDirective<IsAlreadyStartedDirective>;
  const createDirective = createDirectiveFactory({
    directive: IsAlreadyStartedDirective,
    providers: [mockProvider(ModListService)],
  });

  beforeEach(() => (spectator = createDirective('<div appIsAlreadyStarted> </div>')));

  it('should create an instance', () => {
    expect(spectator.directive).toBeTruthy();
  });
});
