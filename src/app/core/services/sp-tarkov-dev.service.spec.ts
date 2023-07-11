import { TestBed } from '@angular/core/testing';

import { SpTarkovDevService } from './sp-tarkov-dev.service';

describe('SpTarkovDevService', () => {
  let service: SpTarkovDevService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpTarkovDevService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
