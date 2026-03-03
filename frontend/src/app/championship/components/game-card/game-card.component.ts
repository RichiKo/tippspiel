import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Game } from '../../types/game.interface';
import { Tip, CreateTipDto } from '../../types/tip.interface';
import { TipsTableComponent } from '../tips-table/tips-table.component';
import { UI_ICONS } from '../../../ui-lib/public-api';

@Component({
  selector: 'app-game-card',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TipsTableComponent,
    LucideAngularModule,
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss',
})
export class GameCardComponent {
  private readonly translate = inject(TranslateService);
  readonly icons = UI_ICONS;

  game = input.required<Game>();
  tip = input<Tip | undefined>();
  gameTips = input<Tip[]>([]);
  currentUserId = input.required<number>();
  isAdmin = input<boolean>(false);
  championshipId = input.required<string>();

  tipChanged = output<CreateTipDto>();
  editGame = output<Game>();
  deleteGame = output<string>();

  homeGoals = signal<number | null>(null);
  awayGoals = signal<number | null>(null);
  isEditMode = signal<boolean>(false);

  readonly isTipLocked = computed(() => {
    const kickoff = new Date(this.game().kickoffTime);
    return new Date() >= kickoff;
  });

  readonly canSaveTip = computed(() => {
    const home = this.homeGoals();
    const away = this.awayGoals();
    return home !== null && away !== null && home >= 0 && away >= 0;
  });

  readonly hasTip = computed(() => {
    return this.tip() !== undefined;
  });

  readonly showInputs = computed(() => {
    return !this.hasTip() || this.isEditMode();
  });

  readonly showTipDisplay = computed(() => {
    return this.hasTip() && !this.isEditMode();
  });

  readonly showTipsTable = computed(() => {
    return this.game().isClosed || this.isTipLocked();
  });

  onHomeGoalsChange(event: Event, nextInput: HTMLInputElement) {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value.replace(/\D+/g, '').slice(0, 1);
    if (target.value !== sanitizedValue) {
      target.value = sanitizedValue;
    }
    this.homeGoals.set(this.parseGoalsValue(sanitizedValue));

    if (sanitizedValue.length === 1) {
      nextInput.focus();
      nextInput.select();
    }
  }

  onAwayGoalsChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value.replace(/\D+/g, '').slice(0, 1);
    if (target.value !== sanitizedValue) {
      target.value = sanitizedValue;
    }
    this.awayGoals.set(this.parseGoalsValue(sanitizedValue));
  }

  onAwayGoalsKeydown(
    event: KeyboardEvent,
    previousInput: HTMLInputElement,
  ): void {
    const target = event.target as HTMLInputElement;
    if (event.key !== 'Backspace' || target.value !== '') {
      return;
    }

    event.preventDefault();
    previousInput.focus();
    previousInput.select();
  }

  selectInputValue(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.select();
  }

  private parseGoalsValue(value: string): number | null {
    if (value === '') {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return Math.min(9, Math.max(0, parsed));
  }

  saveTip() {
    if (!this.canSaveTip() || this.isTipLocked()) return;

    const home = this.homeGoals();
    const away = this.awayGoals();

    if (home === null || away === null) return;

    const tipDto: CreateTipDto = {
      gameId: this.game().id,
      championshipId: this.championshipId(),
      homeTeamGoals: home,
      awayTeamGoals: away,
    };

    this.tipChanged.emit(tipDto);
    this.isEditMode.set(false);
  }

  enterEditMode() {
    const existingTip = this.tip();
    if (existingTip) {
      this.homeGoals.set(existingTip.homeTeamGoals);
      this.awayGoals.set(existingTip.awayTeamGoals);
    }
    this.isEditMode.set(true);
  }

  onEditGame() {
    this.editGame.emit(this.game());
  }

  onDeleteGame() {
    this.deleteGame.emit(this.game().id);
  }

  formatKickoffTime(kickoffTime: Date): string {
    const date = new Date(kickoffTime);
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}
