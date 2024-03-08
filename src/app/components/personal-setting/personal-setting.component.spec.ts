import { ComponentFixture, TestBed } from '@angular/core/testing';
import PersonalSettingComponent from './personal-setting.component';
import { JoyrideModule } from 'ngx-joyride';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PersonalSettingComponent', () => {
  let component: PersonalSettingComponent;
  let fixture: ComponentFixture<PersonalSettingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, PersonalSettingComponent, JoyrideModule.forRoot()],
      providers: [],
    });
    fixture = TestBed.createComponent(PersonalSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
