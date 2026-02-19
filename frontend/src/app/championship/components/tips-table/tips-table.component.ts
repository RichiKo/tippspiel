import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Tip } from '../../types/tip.interface';
import {
  UiBadgeComponent,
  type UiBadgeTone,
} from '../../../ui-lib/public-api';

@Component({
  selector: 'app-tips-table',
  imports: [CommonModule, TranslateModule, UiBadgeComponent],
  templateUrl: './tips-table.component.html',
  styleUrl: './tips-table.component.scss',
})
export class TipsTableComponent {
  private readonly translate = inject(TranslateService);

  tips = input.required<Tip[]>();
  currentUserId = input.required<number>();
  isClosed = input<boolean>(false);

  readonly sortedTips = computed(() => {
    const allTips = this.tips();
    const currentId = this.currentUserId();

    const currentUserTip = allTips.find((tip) => tip.userId === currentId);
    const otherTips = allTips
      .filter((tip) => tip.userId !== currentId)
      .sort((a, b) => a.user!.username.localeCompare(b.user!.username));

    return currentUserTip ? [currentUserTip, ...otherTips] : otherTips;
  });

  getOutcomeLabel(outcomeType: string | null): string {
    const labelKeys: Record<string, string> = {
      exact: 'championship.tipsTable.outcomes.exact',
      goalDiff: 'championship.tipsTable.outcomes.goalDiff',
      tendency: 'championship.tipsTable.outcomes.tendency',
      missed: 'championship.tipsTable.outcomes.missed',
      notTipped: 'championship.tipsTable.outcomes.notTipped',
    };

    const key = labelKeys[outcomeType || ''];
    return key ? this.translate.instant(key) : '-';
  }

  getOutcomeTone(outcomeType: string | null): UiBadgeTone {
    const tones: Record<string, UiBadgeTone> = {
      exact: 'success',
      goalDiff: 'info',
      tendency: 'warning',
      missed: 'danger',
      notTipped: 'neutral',
    };

    return tones[outcomeType || ''] ?? 'neutral';
  }

  getPointsTone(points: number | null): UiBadgeTone {
    if (points === null || points === 0) {
      return 'neutral';
    }

    return points >= 3 ? 'success' : 'info';
  }

  isCurrentUser(userId: number): boolean {
    return userId === this.currentUserId();
  }
}
