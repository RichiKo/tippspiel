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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { BonusService } from '../../services/bonus.service';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { BonusPick, BonusRule } from '../../types/bonus.interface';
import { Championship } from '../../../dashboard/types/championship.interface';
import { RankingService } from '../../../championship/services/ranking.service';
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

type BadgeLabelType = 'inGame' | 'out';

@Component({
  selector: 'app-bonus-overview',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
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
  private readonly rankingService = inject(RankingService);
  private readonly translate = inject(TranslateService);

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
        if (!pick || this.eliminatedTeamIds().has(pick.teamId)) {
          count += 1;
        }
      }
    }

    return count;
  });

  readonly inGamePicksCount = computed(() => {
    const rows = this.userPicksRows();
    const rules = this.bonusRules();

    let count = 0;
    for (const row of rows) {
      for (const rule of rules) {
        const pick = row.picks.get(rule.id);
        if (pick && !this.eliminatedTeamIds().has(pick.teamId)) {
          count += 1;
        }
      }
    }

    return count;
  });

  readonly sortedRowsByRule = computed(() => {
    const rows = this.userPicksRows();
    const rules = this.bonusRules();
    const eliminatedTeamIds = this.eliminatedTeamIds();
    const originalOrder = new Map<number, number>();

    rows.forEach((row, index) => {
      originalOrder.set(row.userId, index);
    });

    const byRule = new Map<string, UserPicksRow[]>();

    for (const rule of rules) {
      const sortedRows = [...rows].sort((left, right) => {
        const leftPick = left.picks.get(rule.id);
        const rightPick = right.picks.get(rule.id);

        const leftPriority = this.getPickPriority(leftPick, eliminatedTeamIds);
        const rightPriority = this.getPickPriority(rightPick, eliminatedTeamIds);

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return (
          (originalOrder.get(left.userId) ?? Number.MAX_SAFE_INTEGER) -
          (originalOrder.get(right.userId) ?? Number.MAX_SAFE_INTEGER)
        );
      });

      byRule.set(rule.id, sortedRows);
    }

    return byRule;
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
        this.errorMessage.set(
          this.translate.instant('bonus.overview.errors.loadChampionship'),
        );
      },
    });

    this.bonusService.getBonusRulesForOverview(this.championshipId).subscribe({
      next: async (rules) => {
        try {
          this.bonusRules.set(rules);

          const rankings = await firstValueFrom(
            this.rankingService.getRankingByChampionship(this.championshipId),
          ).catch(() => []);

          const userMap = new Map<number, UserPicksRow>();
          rankings.forEach((ranking) => {
            userMap.set(ranking.user.id, {
              userId: ranking.user.id,
              username: ranking.user.username,
              userImage: ranking.user.image ?? null,
              picks: new Map(),
            });
          });

          const picksPromises = rules.map((rule) =>
            firstValueFrom(this.bonusService.getAllPicksUser(rule.id)).catch(
              () => [] as BonusPick[],
            ),
          );

          const allPicksArrays = await Promise.all(picksPromises);

          rules.forEach((rule, ruleIndex) => {
            const picks = allPicksArrays[ruleIndex] || [];

            picks.forEach((pick) => {
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
              } else if (!userRow.userImage && pick.user.image) {
                userRow.userImage = pick.user.image;
              }

              userRow.picks.set(rule.id, {
                teamId: pick.teamId,
                teamName: pick.team.name,
                teamLogo: pick.team.logoUrl,
              });
            });
          });

          this.userPicksRows.set(Array.from(userMap.values()));
        } finally {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.overview.errors.loadRules'),
        );
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

  getSortedUserRowsForRule(ruleId: string): UserPicksRow[] {
    return this.sortedRowsByRule().get(ruleId) ?? this.userPicksRows();
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
    return username?.charAt(0).toUpperCase() || '?';
  }

  onUserAvatarError(userId: number): void {
    this.brokenAvatarUserIds.update((ids) => {
      const next = new Set(ids);
      next.add(userId);
      return next;
    });
  }

  getInGameBadgeText(): string {
    return this.getBadgeText({
      primaryKey: 'bonus.overview.badges.inGame',
      legacyKey: 'bonus.overview.badges.participants',
      count: this.inGamePicksCount(),
      type: 'inGame',
    });
  }

  getOutBadgeText(): string {
    return this.getBadgeText({
      primaryKey: 'bonus.overview.badges.out',
      legacyKey: 'bonus.overview.badges.eliminated',
      count: this.eliminatedPicksCount(),
      type: 'out',
    });
  }

  private getBadgeText({
    primaryKey,
    legacyKey,
    count,
    type,
  }: {
    primaryKey: string;
    legacyKey: string;
    count: number;
    type: BadgeLabelType;
  }): string {
    const params = { count };
    const primary = this.translate.instant(primaryKey, params);
    if (primary !== primaryKey) {
      return primary;
    }

    const legacy = this.translate.instant(legacyKey, params);
    if (legacy !== legacyKey) {
      return legacy;
    }

    return `${count} ${this.getHardcodedBadgeWord(type)}`;
  }

  private getHardcodedBadgeWord(type: BadgeLabelType): string {
    const language = this.translate.currentLang === 'de' ? 'de' : 'uk';
    if (language === 'de') {
      return type === 'inGame' ? 'im Spiel' : 'raus';
    }

    return type === 'inGame' ? 'в грі' : 'поза грою';
  }

  private getPickPriority(
    pick: { teamId: string } | undefined,
    eliminatedTeamIds: Set<string>,
  ): number {
    if (!pick) {
      return 2;
    }

    if (eliminatedTeamIds.has(pick.teamId)) {
      return 1;
    }

    return 0;
  }
}
