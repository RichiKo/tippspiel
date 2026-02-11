import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BonusService } from '../../services/bonus.service';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { BonusRule, BonusPick } from '../../types/bonus.interface';
import { Championship } from '../../../dashboard/types/championship.interface';

interface UserPicksRow {
  userId: number;
  username: string;
  userImage: string;
  picks: Map<string, { teamId: string; teamName: string; teamLogo: string }>;
}

@Component({
  selector: 'app-bonus-overview',
  imports: [CommonModule],
  templateUrl: './bonus-overview.component.html',
  styleUrls: ['./bonus-overview.component.scss'],
})
export class BonusOverviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bonusService = inject(BonusService);
  private readonly championshipService = inject(ChampionshipService);

  championship = signal<Championship | null>(null);
  bonusRules = signal<BonusRule[]>([]);
  userPicksRows = signal<UserPicksRow[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  eliminatedTeamIds = signal<Set<string>>(new Set());

  championshipId = '';

  constructor() {
    effect(
      () => {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.championshipId = id;
          this.loadData();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.championshipService.getChampionshipById(this.championshipId).subscribe({
      next: (championship) => {
        this.championship.set(championship);
        this.eliminatedTeamIds.set(new Set(championship.eliminatedTeamIds || []));
      },
      error: (err) => {
        console.error('Error loading championship:', err);
        this.errorMessage.set('Fehler beim Laden der Championship.');
      },
    });

    // Load all bonus rules (with picks)
    this.bonusService.getBonusRules(this.championshipId).subscribe({
      next: async (rules) => {
        this.bonusRules.set(rules);

        // Load picks for each rule
        const picksPromises = rules.map((rule) =>
          this.bonusService.getAllPicksUser(rule.id).toPromise().catch(() => []),
        );

        const allPicksArrays = await Promise.all(picksPromises);

        // Build user rows
        const userMap = new Map<number, UserPicksRow>();

        rules.forEach((rule, ruleIndex) => {
          const picks = allPicksArrays[ruleIndex] || [];

          picks.forEach((pick: BonusPick) => {
            if (!pick.user || !pick.team) return;

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
      error: (err) => {
        console.error('Error loading bonus rules:', err);
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
    return userRow?.picks.get(ruleId) || null;
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
}
