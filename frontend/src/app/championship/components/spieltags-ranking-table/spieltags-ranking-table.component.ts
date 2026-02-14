import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SpieltagRankingRow } from '../../utils/spieltag-views.util';

@Component({
  selector: 'app-spieltags-ranking-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './spieltags-ranking-table.component.html',
  styleUrl: './spieltags-ranking-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpieltagsRankingTableComponent {
  rows = input.required<SpieltagRankingRow[]>();
  evaluatedGamesCount = input<number>(0);
  currentUserId = input<number | null>(null);

  isCurrentUser(userId: number): boolean {
    return this.currentUserId() === userId;
  }
}
