import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCardComponent } from '../game-card/game-card.component';
import { Game } from '../../types/game.interface';
import { Tip, CreateTipDto } from '../../types/tip.interface';
import { KickoffGroup } from '../../utils/spieltag-views.util';

@Component({
  selector: 'app-finished-games-all-view',
  imports: [CommonModule, GameCardComponent],
  templateUrl: './finished-games-all-view.component.html',
  styleUrl: './finished-games-all-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishedGamesAllViewComponent {
  groupedGames = input.required<KickoffGroup[]>();
  userTipsMap = input.required<Map<string, Tip>>();
  gameTipsMap = input.required<Map<string, Tip[]>>();
  currentUserId = input.required<number>();
  isAdmin = input<boolean>(false);
  championshipId = input.required<string>();

  tipChanged = output<CreateTipDto>();
  editGame = output<Game>();
  deleteGame = output<string>();

  onTipChanged(tip: CreateTipDto): void {
    this.tipChanged.emit(tip);
  }

  onEditGame(game: Game): void {
    this.editGame.emit(game);
  }

  onDeleteGame(gameId: string): void {
    this.deleteGame.emit(gameId);
  }

  formatKickoffHeader(kickoffTime: Date): string {
    const date = new Date(kickoffTime);
    const weekdays = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const weekday = weekdays[date.getDay()];

    return `${weekday}, ${day}.${month}.${year} · ${hours}:${minutes} Uhr`;
  }
}
