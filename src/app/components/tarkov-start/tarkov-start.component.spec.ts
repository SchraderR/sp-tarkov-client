import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarkovStartComponent } from './tarkov-start.component';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from '../../core/services/electron.service';
import { applicationTarkovInstanceOutputEventNames } from '../../core/events/electron.events';
import { EMPTY, of } from 'rxjs';

describe('TarkovStartComponent', () => {
  let component: TarkovStartComponent;
  let fixture: ComponentFixture<TarkovStartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TarkovStartComponent],
      providers: [
        mockProvider(ElectronService, {
          getServerOutput: () => EMPTY,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TarkovStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
