import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './ui-button.component';

describe('UiButtonComponent', () => {
  let fixture: ComponentFixture<UiButtonComponent>;
  let component: UiButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render primary button by default', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(component).toBeTruthy();
    expect(button.classList.contains('ui-button--primary')).toBeTrue();
    expect(button.disabled).toBeFalse();
  });

  it('should apply secondary variant and lg size', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.classList.contains('ui-button--secondary')).toBeTrue();
    expect(button.classList.contains('ui-button--lg')).toBeTrue();
  });

  it('should disable button when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ui-button__spinner')).toBeTruthy();
  });
});
