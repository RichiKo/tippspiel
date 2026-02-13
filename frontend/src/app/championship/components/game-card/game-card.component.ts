import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Game } from '../../types/game.interface';
import { Tip, CreateTipDto } from '../../types/tip.interface';
import { TipsTableComponent } from '../tips-table/tips-table.component';

@Component({
  selector: 'app-game-card',
  imports: [CommonModule, FormsModule, TipsTableComponent],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss',
})
export class GameCardComponent {
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

  onHomeGoalsChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.homeGoals.set(value === '' ? null : parseInt(value, 10));
  }

  onAwayGoalsChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.awayGoals.set(value === '' ? null : parseInt(value, 10));
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }
}
