import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Championship } from '../../../dashboard/types/championship.interface';
import { Ranking } from '../../types/ranking.interface';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { GameService } from '../../services/game.service';
import { PersistingService } from '../../../auth/services/persisisting.service';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiBadgeTone,
  UiCardComponent,
  UiPageHeaderComponent,
} from '../../../ui-lib/public-api';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    UiBadgeComponent,
    UiCardComponent,
    UiPageHeaderComponent,
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly gameService = inject(GameService);
  private readonly persistingService = inject(PersistingService);
  private readonly translate = inject(TranslateService);

  championship = signal<Championship | null>(null);
  rankings = signal<Ranking[]>([]);
  totalGames = signal(0);
  closedGames = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly currentUser = this.persistingService.currentUser;
  readonly icons = UI_ICONS;

  readonly sortedRankings = computed(() => {
    const currentUserId = this.currentUser()?.id;
    const allRankings = this.rankings();

    const currentUserRanking = allRankings.find((ranking) => ranking.userId === currentUserId);
    const otherRankings = allRankings
      .filter((ranking) => ranking.userId !== currentUserId)
      .sort((a, b) => a.user.username.localeCompare(b.user.username));

    return currentUserRanking ? [currentUserRanking, ...otherRankings] : otherRankings;
  });

  readonly progressPercent = computed(() => {
    const totalGames = this.totalGames();
    if (totalGames === 0) {
      return 0;
    }

    return Math.round((this.closedGames() / totalGames) * 100);
  });

  readonly progressTone = computed<UiBadgeTone>(() => {
    const totalGames = this.totalGames();
    const closedGames = this.closedGames();

    if (totalGames > 0 && closedGames === totalGames) {
      return 'success';
    }

    if (closedGames > 0) {
      return 'info';
    }

    return 'neutral';
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

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.loadChampionship();
    this.loadRankings();
    this.loadGamesCount();
  }

  loadChampionship(): void {
    this.championshipService.getChampionshipById(this.championshipId).subscribe({
      next: (championship) => {
        this.championship.set(championship);
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.ranking.errors.loadChampionship'),
        );
      },
    });
  }

  loadRankings(): void {
    this.rankingService.getRankingByChampionship(this.championshipId).subscribe({
      next: (rankings) => {
        this.rankings.set(rankings);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.ranking.errors.loadRanking'),
        );
        this.isLoading.set(false);
      },
    });
  }

  loadGamesCount(): void {
    this.gameService.getGamesByChampionship(this.championshipId).subscribe({
      next: (games) => {
        this.totalGames.set(games.length);
        this.closedGames.set(games.filter((game) => game.isClosed).length);
      },
      error: () => {
        this.totalGames.set(0);
        this.closedGames.set(0);
      },
    });
  }

  isCurrentUser(userId: number): boolean {
    return this.currentUser()?.id === userId;
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }
}
