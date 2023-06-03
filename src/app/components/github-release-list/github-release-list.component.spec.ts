import { ComponentFixture, TestBed } from '@angular/core/testing';
import GithubReleaseListComponent from './github-release-list.component';

describe('GithubReleaseListComponent', () => {
  let component: GithubReleaseListComponent;
  let fixture: ComponentFixture<GithubReleaseListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GithubReleaseListComponent],
    });
    fixture = TestBed.createComponent(GithubReleaseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
