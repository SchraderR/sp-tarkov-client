import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModLoadOrderComponent from './mod-load-order.component';
import { ElectronService } from '../../core/services/electron.service';
import { mockProvider } from '@ngneat/spectator';
import { of } from 'rxjs';

describe('ModLoadOrderComponent', () => {
  let component: ModLoadOrderComponent;
  let fixture: ComponentFixture<ModLoadOrderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModLoadOrderComponent],
      providers: [mockProvider(ElectronService, { sendEvent: () => of() })],
    }).compileComponents();

    fixture = TestBed.createComponent(ModLoadOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
