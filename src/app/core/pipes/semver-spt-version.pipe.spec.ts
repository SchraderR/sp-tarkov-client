import { SemverSptVersionPipe } from './semver-spt-version.pipe';

describe('SemverSptVersionPipe', () => {
  it('create an instance', () => {
    const pipe = new SemverSptVersionPipe();
    expect(pipe).toBeTruthy();
  });
});
