import { TestBed } from '@angular/core/testing';
import { SptSearchService } from './spt-search.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SptSearchService', () => {
  let service: SptSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SptSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
