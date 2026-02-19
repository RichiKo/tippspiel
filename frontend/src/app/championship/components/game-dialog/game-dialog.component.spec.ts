import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatTimepicker } from '@angular/material/timepicker';
import { GameDialogComponent } from './game-dialog.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('GameDialogComponent', () => {
  let component: GameDialogComponent;
  let fixture: ComponentFixture<GameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameDialogComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(GameDialogComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('uses a material timepicker with 15 minute interval', () => {
    const timepickerDebugEl = fixture.debugElement.query(By.directive(MatTimepicker));

    expect(timepickerDebugEl).not.toBeNull();

    const timepickerInstance = timepickerDebugEl.componentInstance as MatTimepicker<Date>;
    expect(timepickerInstance.interval()).toBe(900);
  });

  it('uses monday as first day of week in dialog date adapter', () => {
    const dateAdapter = fixture.debugElement.injector.get(DateAdapter<Date>);

    expect(dateAdapter.getFirstDayOfWeek()).toBe(1);
  });

  it('formats dates in German style in dialog date adapter', () => {
    const dateAdapter = fixture.debugElement.injector.get(DateAdapter<Date>);
    const formatted = dateAdapter
      .format(new Date(2026, 1, 18), {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
      .replace(/\s/g, '');

    expect(formatted).toMatch(/^18\.\d{1,2}\.2026$/);
  });

  it('uses tel numeric attributes for result score inputs', () => {
    fixture.componentRef.setInput('gameId', 'game-1');
    fixture.detectChanges();

    const homeInput = fixture.nativeElement.querySelector(
      'input[name="homeScore"]',
    ) as HTMLInputElement;
    const awayInput = fixture.nativeElement.querySelector(
      'input[name="awayScore"]',
    ) as HTMLInputElement;

    expect(homeInput).toBeTruthy();
    expect(awayInput).toBeTruthy();
    expect(homeInput.type).toBe('tel');
    expect(homeInput.getAttribute('inputmode')).toBe('numeric');
    expect(homeInput.getAttribute('pattern')).toBe('[0-9]*');
    expect(homeInput.getAttribute('enterkeyhint')).toBe('done');
    expect(homeInput.getAttribute('autocomplete')).toBe('off');
  });

  it('sanitizes non-digit characters in result score inputs', () => {
    fixture.componentRef.setInput('gameId', 'game-1');
    fixture.detectChanges();

    const homeInput = fixture.nativeElement.querySelector(
      'input[name="homeScore"]',
    ) as HTMLInputElement;
    const awayInput = fixture.nativeElement.querySelector(
      'input[name="awayScore"]',
    ) as HTMLInputElement;

    homeInput.value = '1a-2';
    homeInput.dispatchEvent(new Event('input'));

    awayInput.value = '0x3';
    awayInput.dispatchEvent(new Event('input'));

    expect(homeInput.value).toBe('12');
    expect(awayInput.value).toBe('03');
    expect(component.homeScore).toBe(12);
    expect(component.awayScore).toBe(3);
  });

  it('locks body scroll while dialog is visible and restores it after close', () => {
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
