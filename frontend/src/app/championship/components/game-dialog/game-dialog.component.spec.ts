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
    const dateAdapter = TestBed.inject(DateAdapter<Date>);

    expect(dateAdapter.getFirstDayOfWeek()).toBe(1);
  });
});
