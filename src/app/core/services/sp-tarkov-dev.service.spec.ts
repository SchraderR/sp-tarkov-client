import { TestBed } from '@angular/core/testing';

import { SpTarkovDevService } from './sp-tarkov-dev.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SpTarkovDevService', () => {
  let service: SpTarkovDevService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SpTarkovDevService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
