import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { appConfig } from './app.config';

describe('appConfig date adapter', () => {
  it('uses monday as first day of week', () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const dateAdapter = TestBed.inject(DateAdapter<Date>);

    expect(dateAdapter.getFirstDayOfWeek()).toBe(1);
  });
});
