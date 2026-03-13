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
import {
  ChampionshipStatistics,
  PointsBucket,
} from '../../types/ranking.interface';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiBadgeTone,
  UiCardComponent,
  UiPageHeaderComponent,
} from '../../../ui-lib/public-api';

interface DistributionItem {
  labelKey: string;
  tone: UiBadgeTone;
  bucket: PointsBucket;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    UiBadgeComponent,
    UiCardComponent,
    UiPageHeaderComponent,
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly translate = inject(TranslateService);

  championship = signal<Championship | null>(null);
  statistics = signal<ChampionshipStatistics | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly icons = UI_ICONS;

  readonly participationRatio = computed(() => {
    const stats = this.statistics();
    if (!stats || stats.playedMatches === 0) {
      return 0;
    }

    return stats.participatedMatches / stats.playedMatches;
  });

  readonly participationPercent = computed(() =>
    Math.round(this.participationRatio() * 100),
  );

  readonly resultativeGamesRatio = computed(() => {
    const stats = this.statistics();
    if (!stats) {
      return 0;
    }

    return (
      stats.pointsDistribution.threePoints.ratio +
      stats.pointsDistribution.twoPoints.ratio +
      stats.pointsDistribution.onePoint.ratio
    );
  });

  readonly notGuessedGamesRatio = computed(() => {
    const stats = this.statistics();
    if (!stats) {
      return 0;
    }

    return stats.pointsDistribution.zeroPoints.ratio;
  });

  readonly resultativeGamesCount = computed(() => {
    const stats = this.statistics();
    if (!stats) {
      return 0;
    }

    return (
      stats.pointsDistribution.threePoints.count +
      stats.pointsDistribution.twoPoints.count +
      stats.pointsDistribution.onePoint.count
    );
  });

  readonly notResultativeGamesCount = computed(() => {
    const stats = this.statistics();
    if (!stats) {
      return 0;
    }

    return stats.pointsDistribution.zeroPoints.count;
  });

  readonly distributionItems = computed<DistributionItem[]>(() => {
    const stats = this.statistics();
    if (!stats) {
      return [];
    }

    return [
      {
        labelKey: 'championship.statistics.distribution.rows.threePoints',
        tone: 'success',
        bucket: stats.pointsDistribution.threePoints,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.twoPoints',
        tone: 'info',
        bucket: stats.pointsDistribution.twoPoints,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.onePoint',
        tone: 'warning',
        bucket: stats.pointsDistribution.onePoint,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.zeroPoints',
        tone: 'danger',
        bucket: stats.pointsDistribution.zeroPoints,
      },
    ];
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
    this.loadStatistics();
  }

  loadChampionship(): void {
    this.championshipService.getChampionshipById(this.championshipId).subscribe({
      next: (championship) => {
        this.championship.set(championship);
      },
      error: () => {
        this.error.set(
          this.translate.instant(
            'championship.statistics.errors.loadChampionship',
          ),
        );
      },
    });
  }

  loadStatistics(): void {
    this.rankingService.getMyStatistics(this.championshipId).subscribe({
      next: (statistics) => {
        this.statistics.set(statistics);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.statistics.errors.loadStatistics'),
        );
        this.isLoading.set(false);
      },
    });
  }

  formatPercent(ratio: number): string {
    return `${(ratio * 100).toFixed(1)}%`;
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }
}
