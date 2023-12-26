import { TestBed } from '@angular/core/testing';

import { ModListService } from './mod-list.service';

describe('ModListService', () => {
  let service: ModListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
