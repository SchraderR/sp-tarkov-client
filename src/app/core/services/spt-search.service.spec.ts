import { TestBed } from '@angular/core/testing';
import { SptSearchService } from './spt-search.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SptSearchService', () => {
  let service: SptSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(SptSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
