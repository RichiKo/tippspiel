import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCardComponent } from './ui-card.component';

describe('UiCardComponent', () => {
  let fixture: ComponentFixture<UiCardComponent>;
  let component: UiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render with default variant and md padding', () => {
    const card = fixture.nativeElement.querySelector('.ui-card') as HTMLElement;

    expect(component).toBeTruthy();
    expect(card.classList.contains('ui-card--default')).toBeTrue();
    expect(card.classList.contains('ui-card--p-md')).toBeTrue();
  });

  it('should apply elevated and interactive styles', () => {
    fixture.componentRef.setInput('variant', 'elevated');
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.ui-card') as HTMLElement;

    expect(card.classList.contains('ui-card--elevated')).toBeTrue();
    expect(card.classList.contains('ui-card--interactive')).toBeTrue();
  });
});
