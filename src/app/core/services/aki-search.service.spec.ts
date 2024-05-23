import { TestBed } from '@angular/core/testing';

import { AkiSearchService } from './aki-search.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AkiSearchService', () => {
  let service: AkiSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(AkiSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
