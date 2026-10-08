import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { PrizeFundDialogComponent } from './prize-fund-dialog.component';
import { ChampionshipService } from '../../../dashboard/services/championship.service';

describe('PrizeFundDialogComponent', () => {
  let fixture: ComponentFixture<PrizeFundDialogComponent>;
  const configuration = {
    entryFeeMinorUnits: '10000',
    prizeFundRule: {
      tieMode: 'share_equal_points' as const,
      prizeAmountsMinorUnits: ['50000', '30000', '10000'],
    },
  };
  const participants = [1, 2].map((userId) => ({
    userId,
    totalPoints: 3 - userId,
    exactHits: 0,
    goalDiffHits: 0,
    tendencyHits: 0,
    user: {
      username: `User ${userId}`,
      image: userId === 1 ? '/uploads/user-1.png' : null,
    },
  }));
  const service = { updatePrizeFund: jasmine.createSpy('updatePrizeFund') };
  const ref = { close: jasmine.createSpy('close'), disableClose: false };
  beforeEach(async () => {
    service.updatePrizeFund.calls.reset();
    service.updatePrizeFund.and.returnValue(of(configuration));
    ref.close.calls.reset();
    await TestBed.configureTestingModule({
      imports: [PrizeFundDialogComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        { provide: ChampionshipService, useValue: service },
        { provide: MatDialogRef, useValue: ref },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { championshipId: 'champ-1', configuration, participants },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PrizeFundDialogComponent);
    fixture.detectChanges();
  });

  it('prepopulates the three configurable prize places and shows an exact live preview', () => {
    expect(fixture.componentInstance.form.controls.prizeAmounts.length).toBe(3);
    fixture.componentInstance.form.patchValue({
      entryFee: '0.29',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.preview()?.totalMinorUnits).toBe(58n);
    expect(
      fixture.componentInstance.preview()?.winners[0].amountMinorUnits,
    ).toBe(50000n);
    expect(
      fixture.nativeElement.querySelectorAll('.prize-winners-table tbody tr')
        .length,
    ).toBe(2);
  });

  it('shows profile photos and initial placeholders in the preview', () => {
    const photo = fixture.nativeElement.querySelector(
      '.user-avatar',
    ) as HTMLImageElement | null;
    expect(photo?.getAttribute('src')).toBe('/uploads/user-1.png');
    expect(
      fixture.nativeElement
        .querySelector('.user-avatar-placeholder')
        ?.textContent.trim(),
    ).toBe('U');
  });

  it('falls back to an initial when a profile photo fails to load', () => {
    const photo = fixture.nativeElement.querySelector(
      '.user-avatar',
    ) as HTMLImageElement | null;
    expect(photo).toBeTruthy();
    photo?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.user-avatar')).toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('.user-avatar-placeholder').length,
    ).toBe(2);
  });

  it('uses standings-style place badges, podium rows and a highlighted money column', () => {
    expect(
      fixture.nativeElement
        .querySelector('.place-first .rank-pill--gold')
        ?.textContent.trim(),
    ).toBe('1');
    expect(
      fixture.nativeElement
        .querySelector('.place-second .rank-pill--silver')
        ?.textContent.trim(),
    ).toBe('2');
    expect(fixture.nativeElement.querySelector('th.money-col')).toBeTruthy();
  });

  it('rejects invalid money inputs and an empty prize list', () => {
    const component = fixture.componentInstance;
    for (const entryFee of ['-1', '1.001', '']) {
      component.form.patchValue({ entryFee });
      expect(component.form.invalid).toBeTrue();
      component.save();
    }
    component.form.patchValue({ entryFee: '1' });
    component.form.controls.prizeAmounts.at(0).setValue('-1');
    component.save();
    expect(component.form.invalid).toBeTrue();
    component.form.controls.prizeAmounts.clear();
    component.save();
    expect(component.form.invalid).toBeTrue();
    expect(service.updatePrizeFund).not.toHaveBeenCalled();
  });

  it('saves converted minor units and the selected rule then closes', () => {
    fixture.componentInstance.addPlace();
    fixture.componentInstance.form.patchValue({
      entryFee: '100,50',
      prizeAmounts: ['1500.00', '1000.00', '500.00', '100.50'],
      tieMode: 'tie_breakers',
    });
    fixture.componentInstance.save();
    expect(service.updatePrizeFund).toHaveBeenCalledWith('champ-1', {
      entryFeeMinorUnits: '10050',
      prizeFundRule: {
        tieMode: 'tie_breakers',
        prizeAmountsMinorUnits: ['150000', '100000', '50000', '10050'],
      },
    });
    expect(ref.close).toHaveBeenCalledWith(configuration);
  });

  it('cancels without any write', () => {
    fixture.componentInstance.cancel();
    expect(ref.close).toHaveBeenCalledWith();
    expect(service.updatePrizeFund).not.toHaveBeenCalled();
  });

  it('renders editable amounts for individual places instead of a count-only input', () => {
    expect(
      fixture.nativeElement.querySelectorAll('.prize-amount-input').length,
    ).toBe(3);
    expect(
      fixture.nativeElement.querySelector('.prize-add-button'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        '[formControlName="prizePlaceCount"]',
      ),
    ).toBeNull();
  });

  it('adds and removes places without changing the remaining agreed amounts', () => {
    const component = fixture.componentInstance;
    const add = fixture.nativeElement.querySelector(
      '.prize-add-button button',
    ) as HTMLButtonElement;
    add.click();
    fixture.detectChanges();
    expect(component.form.controls.prizeAmounts.getRawValue()).toEqual([
      '500.00',
      '300.00',
      '100.00',
      '0.00',
    ]);
    component.removePlace(1);
    fixture.detectChanges();
    expect(component.form.controls.prizeAmounts.getRawValue()).toEqual([
      '500.00',
      '100.00',
      '0.00',
    ]);
    component.removePlace(2);
    component.removePlace(1);
    component.removePlace(0);
    expect(component.form.controls.prizeAmounts.length).toBe(1);
  });

  it('shows 20 percent for a 500 UAH prize in a 2500 UAH fund without requiring full allocation', () => {
    const component = fixture.componentInstance;
    component.form.controls.entryFee.setValue('1250');
    component.removePlace(2);
    component.removePlace(1);
    fixture.detectChanges();
    expect(component.preview()?.totalMinorUnits).toBe(250000n);
    expect(component.placeShare(0)).toBe('20,00 %');
    expect(component.form.valid).toBeTrue();
    component.save();
    expect(service.updatePrizeFund).toHaveBeenCalled();
  });

  it('keeps the visible input bound to its place after removing a middle place', () => {
    const component = fixture.componentInstance;
    component.removePlace(1);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll(
      '.prize-amount-input',
    ) as NodeListOf<HTMLInputElement>;
    expect(Array.from(inputs).map((input) => input.value)).toEqual([
      '500.00',
      '100.00',
    ]);
    inputs[1].value = '250.50';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.form.controls.prizeAmounts.getRawValue()).toEqual([
      '500.00',
      '250.50',
    ]);
    expect(
      component.configuration()?.prizeFundRule.prizeAmountsMinorUnits,
    ).toEqual(['50000', '25050']);
  });

  it('can save fixed amounts migrated from a fund larger than signed bigint', () => {
    const component = fixture.componentInstance;
    component.form.controls.prizeAmounts
      .at(0)
      .setValue('184467440737095516.14');
    component.save();
    expect(service.updatePrizeFund).toHaveBeenCalled();
    expect(
      service.updatePrizeFund.calls.mostRecent().args[1].prizeFundRule
        .prizeAmountsMinorUnits[0],
    ).toBe('18446744073709551614');
  });

  it('allows saving 1500, 1000 and 500 UAH even if their sum exceeds the current fund', () => {
    const component = fixture.componentInstance;
    component.form.patchValue({
      entryFee: '1250',
      prizeAmounts: ['1500', '1000', '500'],
    });
    fixture.detectChanges();
    expect(component.form.valid).toBeTrue();
    component.save();
    expect(service.updatePrizeFund).toHaveBeenCalledWith('champ-1', {
      entryFeeMinorUnits: '125000',
      prizeFundRule: {
        tieMode: 'share_equal_points',
        prizeAmountsMinorUnits: ['150000', '100000', '50000'],
      },
    });
  });

  it('keeps the form open after a failed save and displays an error', () => {
    service.updatePrizeFund.and.returnValue(
      throwError(() => new Error('failed')),
    );
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(ref.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isSaving()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });
});
