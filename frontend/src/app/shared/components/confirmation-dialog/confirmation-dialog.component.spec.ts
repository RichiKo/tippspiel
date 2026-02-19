import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('message', 'Soll geloescht werden?');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('should render dialog with ui buttons when visible', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cd-dialog')).toBeTruthy();

    const buttons = fixture.nativeElement.querySelectorAll('ui-button');
    expect(buttons.length).toBe(2);
  });

  it('should emit confirm and cancel actions', () => {
    const confirmSpy = jasmine.createSpy('confirmSpy');
    const cancelSpy = jasmine.createSpy('cancelSpy');

    component.confirmed.subscribe(confirmSpy);
    component.cancelled.subscribe(cancelSpy);

    const buttons = fixture.nativeElement.querySelectorAll('.cd-actions .ui-button');
    const cancelButton = buttons[0] as HTMLButtonElement;
    const confirmButton = buttons[1] as HTMLButtonElement;

    cancelButton.click();
    confirmButton.click();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('should lock body scroll while visible and restore it after close', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    document.body.style.overflow = 'auto';

    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('auto');
  });
});
