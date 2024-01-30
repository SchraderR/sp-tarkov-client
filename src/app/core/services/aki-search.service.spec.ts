import { TestBed } from '@angular/core/testing';

import { AkiSearchService } from './aki-search.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AkiSearchService', () => {
  let service: AkiSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AkiSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
