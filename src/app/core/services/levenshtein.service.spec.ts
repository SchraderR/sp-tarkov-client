import { TestBed } from '@angular/core/testing';

import { LevenshteinService } from './levenshtein.service';

describe('LevenshteinService', () => {
  let service: LevenshteinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LevenshteinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
