import { TestBed } from '@angular/core/testing';

import { ModListService } from './mod-list.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ModListService', () => {
  let service: ModListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ModListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
