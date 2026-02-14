import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BonusService } from '../../services/bonus.service';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { BonusPick, BonusRule } from '../../types/bonus.interface';
import { Championship } from '../../../dashboard/types/championship.interface';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiCardComponent,
  UiPageHeaderComponent,
} from '../../../ui-lib/public-api';

interface UserPicksRow {
  userId: number;
  username: string;
  userImage: string | null;
  picks: Map<string, { teamId: string; teamName: string; teamLogo: string }>;
}

@Component({
  selector: 'app-bonus-overview',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiBadgeComponent,
    UiCardComponent,
    UiPageHeaderComponent,
  ],
  templateUrl: './bonus-overview.component.html',
  styleUrl: './bonus-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusOverviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bonusService = inject(BonusService);
  private readonly championshipService = inject(ChampionshipService);

  championship = signal<Championship | null>(null);
  bonusRules = signal<BonusRule[]>([]);
  userPicksRows = signal<UserPicksRow[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  eliminatedTeamIds = signal<Set<string>>(new Set());
  brokenAvatarUserIds = signal<Set<number>>(new Set());

  readonly icons = UI_ICONS;

  readonly eliminatedPicksCount = computed(() => {
    const rows = this.userPicksRows();
    const rules = this.bonusRules();

    let count = 0;
    for (const row of rows) {
      for (const rule of rules) {
        const pick = row.picks.get(rule.id);
        if (pick && this.eliminatedTeamIds().has(pick.teamId)) {
          count += 1;
        }
      }
    }

    return count;
  });

  championshipId = '';

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        return;
      }

      this.championshipId = id;
      this.loadData();
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.championshipService.getChampionshipById(this.championshipId).subscribe({
      next: (championship) => {
        this.championship.set(championship);
        this.eliminatedTeamIds.set(new Set(championship.eliminatedTeamIds || []));
      },
      error: () => {
        this.errorMessage.set('Fehler beim Laden der Championship.');
      },
    });

    this.bonusService.getBonusRulesForOverview(this.championshipId).subscribe({
      next: async (rules) => {
        this.bonusRules.set(rules);

        const picksPromises = rules.map((rule) =>
          this.bonusService.getAllPicksUser(rule.id).toPromise().catch(() => []),
        );

        const allPicksArrays = await Promise.all(picksPromises);
        const userMap = new Map<number, UserPicksRow>();

        rules.forEach((rule, ruleIndex) => {
          const picks = allPicksArrays[ruleIndex] || [];

          picks.forEach((pick: BonusPick) => {
            if (!pick.user || !pick.team) {
              return;
            }

            let userRow = userMap.get(pick.userId);
            if (!userRow) {
              userRow = {
                userId: pick.userId,
                username: pick.user.username,
                userImage: pick.user.image,
                picks: new Map(),
              };
              userMap.set(pick.userId, userRow);
            }

            userRow.picks.set(rule.id, {
              teamId: pick.teamId,
              teamName: pick.team.name,
              teamLogo: pick.team.logoUrl,
            });
          });
        });

        this.userPicksRows.set(Array.from(userMap.values()));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Fehler beim Laden der Bonus-Regeln.');
        this.isLoading.set(false);
      },
    });
  }

  getUserPick(
    userId: number,
    ruleId: string,
  ): { teamId: string; teamName: string; teamLogo: string } | null {
    const userRow = this.userPicksRows().find((row) => row.userId === userId);
    return userRow?.picks.get(ruleId) ?? null;
  }

  isEliminatedTeam(teamId: string): boolean {
    return this.eliminatedTeamIds().has(teamId);
  }

  isUserPickEliminated(userId: number, ruleId: string): boolean {
    const pick = this.getUserPick(userId, ruleId);
    if (!pick) {
      return false;
    }

    return this.isEliminatedTeam(pick.teamId);
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }

  shouldRenderUserAvatar(userRow: UserPicksRow): boolean {
    const image = userRow.userImage?.trim();
    return !!image && !this.brokenAvatarUserIds().has(userRow.userId);
  }

  getUserInitial(username: string): string {
    return username?.charAt(0).toUpperCase() || 'U';
  }

  onUserAvatarError(userId: number): void {
    this.brokenAvatarUserIds.update((ids) => {
      const next = new Set(ids);
      next.add(userId);
      return next;
    });
  }
}
