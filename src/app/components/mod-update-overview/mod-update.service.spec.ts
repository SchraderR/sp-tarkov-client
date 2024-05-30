import { TestBed } from '@angular/core/testing';

import { ModUpdateService } from './mod-update.service';

describe('ModUpdateService', () => {
  let service: ModUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
