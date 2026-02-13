import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiBadgeComponent } from './ui-badge.component';

describe('UiBadgeComponent', () => {
  let fixture: ComponentFixture<UiBadgeComponent>;
  let component: UiBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render neutral soft badge by default', () => {
    const badge = fixture.nativeElement.querySelector('.ui-badge') as HTMLElement;

    expect(component).toBeTruthy();
    expect(badge.classList.contains('ui-badge--neutral')).toBeTrue();
    expect(badge.classList.contains('ui-badge--soft')).toBeTrue();
  });

  it('should apply success solid classes', () => {
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('appearance', 'solid');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.ui-badge') as HTMLElement;

    expect(badge.classList.contains('ui-badge--success')).toBeTrue();
    expect(badge.classList.contains('ui-badge--solid')).toBeTrue();
  });
});
