import { CheckModDependencyDirective } from './check-mod-dependency.directive';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator';
import { ConfigurationService } from '../services/configuration.service';

describe('CheckModDependencyDirective', () => {
  let spectator: SpectatorDirective<CheckModDependencyDirective>;
  const createDirective = createDirectiveFactory({
    directive: CheckModDependencyDirective,
    providers: [mockProvider(ConfigurationService)],
  });

  beforeEach(() => (spectator = createDirective('<div appCheckModDependency> </div>')));

  it('should create an instance', () => {
    expect(spectator.directive).toBeTruthy();
  });
});
