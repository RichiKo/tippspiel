import { Component, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BonusService } from '../../services/bonus.service';
import { BonusPick } from '../../types/bonus.interface';

@Component({
  selector: 'app-bonus-picks-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './bonus-picks-table.component.html',
  styleUrls: ['./bonus-picks-table.component.scss'],
})
export class BonusPicksTableComponent {
  private readonly bonusService = inject(BonusService);
  private readonly translate = inject(TranslateService);

  bonusRuleId = input.required<string>();
  bonusRuleName = input.required<string>();

  allPicks = signal<BonusPick[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const ruleId = this.bonusRuleId();
      if (ruleId) {
        this.loadAllPicks();
      }
    });
  }

  private loadAllPicks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.getAllPicksUser(this.bonusRuleId()).subscribe({
      next: (picks) => {
        this.allPicks.set(picks);
        this.isLoading.set(false);
      },
      error: (error) => {
        if (error.status === 403) {
          this.errorMessage.set(
            this.translate.instant('bonus.picksTable.errors.visibleAfterDeadline'),
          );
        } else {
          this.errorMessage.set(
            this.translate.instant('bonus.picksTable.errors.loadFailed'),
          );
        }
        this.isLoading.set(false);
      },
    });
  }

  getTeamCount(teamId: string): number {
    return this.allPicks().filter((pick) => pick.teamId === teamId).length;
  }

  getUniqueTeams(): { teamId: string; teamName: string; count: number }[] {
    const picks = this.allPicks();
    const teamMap = new Map<string, { name: string; count: number }>();

    picks.forEach((pick) => {
      if (pick.team) {
        const existing = teamMap.get(pick.teamId);
        if (existing) {
          existing.count++;
        } else {
          teamMap.set(pick.teamId, { name: pick.team.name, count: 1 });
        }
      }
    });

    return Array.from(teamMap.entries())
      .map(([teamId, data]) => ({
        teamId,
        teamName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
