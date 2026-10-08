import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { UiButtonComponent } from '../../../ui-lib/public-api';
import {
  PrizeFundConfiguration,
  PrizeFundParticipant,
  PrizeFundTieMode,
} from '../../types/prize-fund.interface';
import {
  calculatePrizeFund,
  formatMinorUnits,
  formatPrizePercent,
  minorUnitsToInput,
  parseEntryFee,
  parsePrizeAmount,
} from '../../utils/prize-fund.util';
import { PrizeFundTableComponent } from '../prize-fund-table/prize-fund-table.component';

export interface PrizeFundDialogData {
  championshipId: string;
  configuration: PrizeFundConfiguration;
  participants: PrizeFundParticipant[];
}

const entryFeeValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && parseEntryFee(control.value) !== null
    ? null
    : { money: true };

const prizeAmountValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && parsePrizeAmount(control.value) !== null
    ? null
    : { money: true };

@Component({
  selector: 'app-prize-fund-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    TranslateModule,
    UiButtonComponent,
    PrizeFundTableComponent,
  ],
  templateUrl: './prize-fund-dialog.component.html',
  styleUrl: './prize-fund-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrizeFundDialogComponent {
  private readonly service = inject(ChampionshipService);
  private readonly ref = inject(
    MatDialogRef<PrizeFundDialogComponent, PrizeFundConfiguration>,
  );
  private readonly translate = inject(TranslateService);
  readonly data = inject<PrizeFundDialogData>(MAT_DIALOG_DATA);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({
    entryFee: new FormControl(
      minorUnitsToInput(this.data.configuration.entryFeeMinorUnits),
      { nonNullable: true, validators: [entryFeeValidator] },
    ),
    prizeAmounts: new FormArray(
      this.data.configuration.prizeFundRule.prizeAmountsMinorUnits.map(
        (amount) => this.amountControl(minorUnitsToInput(amount)),
      ),
      { validators: [Validators.required] },
    ),
    tieMode: new FormControl<PrizeFundTieMode>(
      this.data.configuration.prizeFundRule.tieMode,
      { nonNullable: true, validators: [Validators.required] },
    ),
  });
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  readonly configuration = computed<PrizeFundConfiguration | null>(() => {
    const values = this.values();
    const entryFeeMinorUnits = parseEntryFee(values.entryFee ?? '');
    const amounts = (values.prizeAmounts ?? []).map((amount) =>
      parsePrizeAmount(amount),
    );
    const tieMode = values.tieMode;
    if (
      entryFeeMinorUnits === null ||
      amounts.length < 1 ||
      amounts.some((amount) => amount === null) ||
      (tieMode !== 'share_equal_points' && tieMode !== 'tie_breakers')
    )
      return null;
    return {
      entryFeeMinorUnits,
      prizeFundRule: {
        prizeAmountsMinorUnits: amounts.filter(
          (amount): amount is string => amount !== null,
        ),
        tieMode,
      },
    };
  });
  readonly preview = computed(() => {
    const configuration = this.configuration();
    return configuration
      ? calculatePrizeFund(this.data.participants, configuration)
      : null;
  });

  money(amount: bigint): string {
    return formatMinorUnits(amount, this.translate.currentLang);
  }

  placeShare(index: number): string {
    const amount =
      this.configuration()?.prizeFundRule.prizeAmountsMinorUnits[index];
    const preview = this.preview();
    return amount !== undefined && preview
      ? formatPrizePercent(
          BigInt(amount),
          preview.totalMinorUnits,
          this.translate.currentLang,
        )
      : '—';
  }

  addPlace(): void {
    if (!this.isSaving())
      this.form.controls.prizeAmounts.push(this.amountControl('0.00'));
  }

  removePlace(index: number): void {
    if (!this.isSaving() && this.form.controls.prizeAmounts.length > 1)
      this.form.controls.prizeAmounts.removeAt(index);
  }

  private amountControl(value: string): FormControl<string> {
    return new FormControl(value, {
      nonNullable: true,
      validators: [prizeAmountValidator],
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    const configuration = this.configuration();
    if (this.isSaving() || this.form.invalid || !configuration) return;
    this.isSaving.set(true);
    this.error.set(null);
    this.ref.disableClose = true;
    this.form.disable();
    this.service
      .updatePrizeFund(this.data.championshipId, configuration)
      .subscribe({
        next: (saved) => this.ref.close(saved),
        error: () => {
          this.form.enable();
          this.isSaving.set(false);
          this.ref.disableClose = false;
          this.error.set(
            this.translate.instant('championship.prizeFund.errors.save'),
          );
        },
      });
  }

  cancel(): void {
    if (!this.isSaving()) this.ref.close();
  }
}
