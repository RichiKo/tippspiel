import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatTimepicker } from '@angular/material/timepicker';
import { GameDialogComponent } from './game-dialog.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TeamOrigin } from '../../../teams/types/team.interface';

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
    expect(homeInput.getAttribute('maxlength')).toBe('1');
    expect(homeInput.getAttribute('enterkeyhint')).toBe('done');
    expect(homeInput.getAttribute('autocomplete')).toBe('off');
  });

  it('renders result score inputs in a compact score row', () => {
    fixture.componentRef.setInput('gameId', 'game-1');
    fixture.componentRef.setInput('teams', [
      {
        id: 'team-1',
        name: 'Arsenal',
        shortName: 'ARS',
        logoUrl: 'https://example.com/arsenal.png',
        origin: TeamOrigin.ENGLAND,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'team-2',
        name: 'Chelsea',
        shortName: 'CHE',
        logoUrl: 'https://example.com/chelsea.png',
        origin: TeamOrigin.ENGLAND,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    component.homeTeamId = 'team-1';
    component.awayTeamId = 'team-2';
    fixture.detectChanges();

    const scoreRow = fixture.nativeElement.querySelector(
      '.result-score-row',
    ) as HTMLElement;
    const separator = fixture.nativeElement.querySelector(
      '.result-score-separator',
    ) as HTMLElement;

    expect(scoreRow).toBeTruthy();
    expect(scoreRow.querySelector('input[name="homeScore"]')).toBeTruthy();
    expect(scoreRow.querySelector('input[name="awayScore"]')).toBeTruthy();
    expect(separator.textContent?.trim()).toBe(':');
    expect(scoreRow.textContent).toContain('Arsenal');
    expect(scoreRow.textContent).toContain('Chelsea');
    expect(scoreRow.querySelector('img[alt="Arsenal"]')).toBeTruthy();
    expect(scoreRow.querySelector('img[alt="Chelsea"]')).toBeTruthy();
  });

  it('moves focus from home score to away score after one digit', () => {
    fixture.componentRef.setInput('gameId', 'game-1');
    fixture.detectChanges();

    const homeInput = fixture.nativeElement.querySelector(
      'input[name="homeScore"]',
    ) as HTMLInputElement;
    const awayInput = fixture.nativeElement.querySelector(
      'input[name="awayScore"]',
    ) as HTMLInputElement;
    spyOn(awayInput, 'focus');
    spyOn(awayInput, 'select');

    homeInput.value = '2';
    homeInput.dispatchEvent(new Event('input'));

    expect(component.homeScore).toBe(2);
    expect(awayInput.focus).toHaveBeenCalled();
    expect(awayInput.select).toHaveBeenCalled();
  });

  it('moves focus back to home score on backspace from empty away score', () => {
    fixture.componentRef.setInput('gameId', 'game-1');
    fixture.detectChanges();

    const homeInput = fixture.nativeElement.querySelector(
      'input[name="homeScore"]',
    ) as HTMLInputElement;
    const awayInput = fixture.nativeElement.querySelector(
      'input[name="awayScore"]',
    ) as HTMLInputElement;
    spyOn(homeInput, 'focus');
    spyOn(homeInput, 'select');

    awayInput.value = '';
    awayInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

    expect(homeInput.focus).toHaveBeenCalled();
    expect(homeInput.select).toHaveBeenCalled();
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

    awayInput.value = '7x3';
    awayInput.dispatchEvent(new Event('input'));

    expect(homeInput.value).toBe('1');
    expect(awayInput.value).toBe('7');
    expect(component.homeScore).toBe(1);
    expect(component.awayScore).toBe(7);
  });

  it('sorts team select options alphabetically by name', () => {
    fixture.componentRef.setInput('teams', [
      {
        id: 'team-2',
        name: 'Juventus',
        shortName: 'JUV',
        logoUrl: 'https://example.com/juve.png',
        origin: TeamOrigin.ITALY,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'team-1',
        name: 'Barcelona',
        shortName: 'BAR',
        logoUrl: 'https://example.com/barca.png',
        origin: TeamOrigin.SPAIN,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    fixture.detectChanges();

    expect(component.sortedTeams().map((team) => team.name)).toEqual([
      'Barcelona',
      'Juventus',
    ]);
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
