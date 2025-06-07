import { TestBed } from '@angular/core/testing';

import { ModListService } from './mod-list.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ModListService', () => {
  let service: ModListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(ModListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
