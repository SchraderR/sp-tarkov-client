import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from './configuration.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
