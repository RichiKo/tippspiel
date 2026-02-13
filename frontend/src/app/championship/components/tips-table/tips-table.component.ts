import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tip } from '../../types/tip.interface';
import { UiBadgeComponent, type UiBadgeTone } from '../../../ui-lib/public-api';

@Component({
  selector: 'app-tips-table',
  imports: [CommonModule, UiBadgeComponent],
  templateUrl: './tips-table.component.html',
  styleUrl: './tips-table.component.scss',
})
export class TipsTableComponent {
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
    const labels: Record<string, string> = {
      exact: 'Exakt',
      goalDiff: 'Tordifferenz',
      tendency: 'Tendenz',
      missed: 'Falsch',
      notTipped: 'Nicht getippt',
    };
    return labels[outcomeType || ''] || '-';
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
