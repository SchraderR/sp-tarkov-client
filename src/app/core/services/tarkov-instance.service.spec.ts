import { TestBed } from '@angular/core/testing';
import { TarkovInstanceService } from './tarkov-instance.service';

describe('TarkovInstanceService', () => {
  let service: TarkovInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TarkovInstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
