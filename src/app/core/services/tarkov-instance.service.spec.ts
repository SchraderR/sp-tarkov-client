import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator';
import { EMPTY } from 'rxjs';
import { TarkovInstanceService } from './tarkov-instance.service';
import { ElectronService } from './electron.service';

describe('TarkovInstanceService', () => {
  let service: TarkovInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(ElectronService, {
          getServerOutput: () => EMPTY,
          getServerExit: () => EMPTY,
        }),
      ],
    });
    service = TestBed.inject(TarkovInstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
