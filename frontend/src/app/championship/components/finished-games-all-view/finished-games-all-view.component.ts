import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GameCardComponent } from '../game-card/game-card.component';
import { Game } from '../../types/game.interface';
import { Tip, CreateTipDto } from '../../types/tip.interface';
import { KickoffGroup } from '../../utils/spieltag-views.util';

@Component({
  selector: 'app-finished-games-all-view',
  imports: [CommonModule, TranslateModule, GameCardComponent],
  templateUrl: './finished-games-all-view.component.html',
  styleUrl: './finished-games-all-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishedGamesAllViewComponent {
  private readonly translate = inject(TranslateService);

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
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    const dateLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    const timeLabel = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    return `${dateLabel} · ${timeLabel}`;
  }
}
