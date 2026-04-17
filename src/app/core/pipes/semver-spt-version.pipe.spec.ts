import { SemverSptVersionPipe } from './semver-spt-version.pipe';
import {  createPipeFactory, mockProvider, SpectatorPipe } from "@ngneat/spectator";
import { ConfigurationService } from "../services/configuration.service";

describe('SemverSptVersionPipe', () => {
  let spectator: SpectatorPipe<SemverSptVersionPipe>;
  const createPipe = createPipeFactory({
    pipe: SemverSptVersionPipe,
    providers: [mockProvider(ConfigurationService)],
  });

  beforeEach(() => (spectator = createPipe('<div> </div>')));

  it('create an instance', () => {
    expect(spectator.hostComponent).toBeTruthy();
  });
});
