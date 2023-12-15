import { TestBed } from '@angular/core/testing';

import { AkiSearchService } from './aki-search.service';

describe('AkiSearchService', () => {
  let service: AkiSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AkiSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
