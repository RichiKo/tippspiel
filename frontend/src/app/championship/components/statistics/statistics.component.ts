import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
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
  ChampionshipAggregateStatistics,
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
import { Chart, Plugin } from 'chart.js/auto';
import type { TooltipItem } from 'chart.js';

interface DistributionItem {
  labelKey: string;
  tone: UiBadgeTone;
  bucket: PointsBucket;
}

type StatisticsMode = 'user' | 'championship';

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
export class StatisticsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly translate = inject(TranslateService);

  championship = signal<Championship | null>(null);
  statisticsMode = signal<StatisticsMode>('user');
  statistics = signal<ChampionshipStatistics | null>(null);
  championshipStatistics = signal<ChampionshipAggregateStatistics | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly icons = UI_ICONS;
  private distributionChart: Chart<'pie', number[], string> | null = null;
  private distributionCanvasRef: ElementRef<HTMLCanvasElement> | null = null;
  private roundTrendChart: Chart<'line', number[], string> | null = null;
  private roundTrendCanvasRef: ElementRef<HTMLCanvasElement> | null = null;
  private readonly distributionSegmentColors = [
    'rgba(34, 197, 94, 0.29)', // success +~20%
    'rgba(37, 99, 235, 0.26)', // info +~20%
    'rgba(245, 158, 11, 0.34)', // warning +~20%
    'rgba(220, 38, 38, 0.29)', // danger +~20%
  ] as const;
  private readonly distributionSegmentBorderColors = [
    'rgba(34, 197, 94, 0.62)', // success border +~20%
    'rgba(37, 99, 235, 0.58)', // info border +~20%
    'rgba(245, 158, 11, 0.67)', // warning border +~20%
    'rgba(220, 38, 38, 0.60)', // danger border +~20%
  ] as const;

  @ViewChild('distributionChart')
  set distributionChartCanvas(
    value: ElementRef<HTMLCanvasElement> | undefined,
  ) {
    this.distributionCanvasRef = value ?? null;
    if (!this.distributionCanvasRef) {
      this.destroyDistributionChart();
      return;
    }
    this.renderDistributionChart();
  }

  @ViewChild('roundTrendChart')
  set roundTrendChartCanvas(value: ElementRef<HTMLCanvasElement> | undefined) {
    this.roundTrendCanvasRef = value ?? null;
    if (!this.roundTrendCanvasRef) {
      this.destroyRoundTrendChart();
      return;
    }
    this.renderRoundTrendChart();
  }

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
    const distribution = this.statistics()?.pointsDistribution;
    if (!distribution) {
      return [];
    }

    return this.buildDistributionItems(distribution);
  });

  readonly roundDistributionItems = computed<DistributionItem[]>(() => {
    const distribution = this.championshipStatistics()?.pointsDistribution;
    if (!distribution) {
      return [];
    }

    return this.buildDistributionItems(distribution);
  });

  readonly roundTotalPointsAllUsers = computed(() => {
    const stats = this.championshipStatistics();
    if (!stats) {
      return 0;
    }

    return stats.totalPointsAllParticipants;
  });

  readonly roundResultativeGamesCount = computed(() => {
    const stats = this.championshipStatistics();
    if (!stats) {
      return 0;
    }

    return (
      stats.pointsDistribution.threePoints.count +
      stats.pointsDistribution.twoPoints.count +
      stats.pointsDistribution.onePoint.count
    );
  });

  readonly roundNotResultativeGamesCount = computed(() => {
    const stats = this.championshipStatistics();
    if (!stats) {
      return 0;
    }

    return stats.pointsDistribution.zeroPoints.count;
  });

  readonly roundResultativeGamesRatio = computed(() => {
    const stats = this.championshipStatistics();
    if (!stats) {
      return 0;
    }

    return (
      stats.pointsDistribution.threePoints.ratio +
      stats.pointsDistribution.twoPoints.ratio +
      stats.pointsDistribution.onePoint.ratio
    );
  });

  readonly roundNotGuessedGamesRatio = computed(() => {
    const stats = this.championshipStatistics();
    if (!stats) {
      return 0;
    }

    return stats.pointsDistribution.zeroPoints.ratio;
  });

  readonly pageTitleKey = computed(() =>
    this.statisticsMode() === 'user'
      ? 'championship.statistics.page.title'
      : 'championship.statistics.page.championshipTitle',
  );

  private buildDistributionItems(distribution: {
    threePoints: PointsBucket;
    twoPoints: PointsBucket;
    onePoint: PointsBucket;
    zeroPoints: PointsBucket;
  }): DistributionItem[] {
    return [
      {
        labelKey: 'championship.statistics.distribution.rows.threePoints',
        tone: 'success',
        bucket: distribution.threePoints,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.twoPoints',
        tone: 'info',
        bucket: distribution.twoPoints,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.onePoint',
        tone: 'warning',
        bucket: distribution.onePoint,
      },
      {
        labelKey: 'championship.statistics.distribution.rows.zeroPoints',
        tone: 'danger',
        bucket: distribution.zeroPoints,
      },
    ];
  }

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

  ngOnDestroy(): void {
    this.destroyDistributionChart();
    this.destroyRoundTrendChart();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.loadChampionship();
    this.loadStatisticsForCurrentMode();
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

  setStatisticsMode(mode: StatisticsMode): void {
    if (this.statisticsMode() === mode) {
      return;
    }

    this.statisticsMode.set(mode);
    this.loadStatisticsForCurrentMode();
  }

  private loadStatisticsForCurrentMode(): void {
    this.isLoading.set(true);
    this.error.set(null);

    if (this.statisticsMode() === 'user') {
      this.loadUserStatistics();
      return;
    }

    this.loadChampionshipStatistics();
  }

  private loadUserStatistics(): void {
    this.rankingService.getMyStatistics(this.championshipId).subscribe({
      next: (statistics) => {
        this.statistics.set(statistics);
        this.championshipStatistics.set(null);
        this.isLoading.set(false);
        this.renderDistributionChart();
        this.renderRoundTrendChart();
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.statistics.errors.loadStatistics'),
        );
        this.isLoading.set(false);
        this.destroyDistributionChart();
        this.destroyRoundTrendChart();
      },
    });
  }

  private loadChampionshipStatistics(): void {
    this.rankingService.getChampionshipStatistics(this.championshipId).subscribe({
      next: (statistics) => {
        this.championshipStatistics.set(statistics);
        this.statistics.set(null);
        this.isLoading.set(false);
        this.renderDistributionChart();
        this.renderRoundTrendChart();
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.statistics.errors.loadStatistics'),
        );
        this.isLoading.set(false);
        this.destroyDistributionChart();
        this.destroyRoundTrendChart();
      },
    });
  }

  formatPercent(ratio: number): string {
    return `${(ratio * 100).toFixed(1)}%`;
  }

  formatMatchKickoff(kickoffTime: string): string {
    const date = new Date(kickoffTime);
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    const dateLabel = new Intl.DateTimeFormat(locale, {
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

  getTeamInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }

  private renderDistributionChart(): void {
    const canvas = this.distributionCanvasRef?.nativeElement;
    const distribution =
      this.statisticsMode() === 'user'
        ? this.statistics()?.pointsDistribution
        : this.championshipStatistics()?.pointsDistribution;

    if (!canvas || !distribution) {
      return;
    }

    const labels = [
      this.translate.instant(
        'championship.statistics.distribution.rows.threePoints',
      ),
      this.translate.instant('championship.statistics.distribution.rows.twoPoints'),
      this.translate.instant('championship.statistics.distribution.rows.onePoint'),
      this.translate.instant(
        'championship.statistics.distribution.rows.zeroPoints',
      ),
    ];
    const data = [
      distribution.threePoints.count,
      distribution.twoPoints.count,
      distribution.onePoint.count,
      distribution.zeroPoints.count,
    ];

    if (this.distributionChart) {
      this.distributionChart.data.labels = labels;
      this.distributionChart.data.datasets[0].data = data;
      this.distributionChart.update();
      return;
    }

    this.distributionChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: this.distributionSegmentColors,
            borderColor: this.distributionSegmentBorderColors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 10,
              font: {
                size: 12,
              },
            },
          },
        },
      },
      plugins: [this.percentageLabelPlugin],
    });
  }

  private destroyDistributionChart(): void {
    if (this.distributionChart) {
      this.distributionChart.destroy();
      this.distributionChart = null;
    }
  }

  private renderRoundTrendChart(): void {
    const canvas = this.roundTrendCanvasRef?.nativeElement;
    const pointsByRound =
      this.statisticsMode() === 'user'
        ? this.statistics()?.pointsByRound
        : this.championshipStatistics()?.pointsByRound;

    if (!canvas || !pointsByRound || pointsByRound.length === 0) {
      this.destroyRoundTrendChart();
      return;
    }

    const labels = pointsByRound.map((round) => round.roundName);
    const points = pointsByRound.map((round) => round.points);
    const primary500 = this.resolveCssVar('--ts-primary-500', '#10b981');
    const primary600 = this.resolveCssVar('--ts-primary-600', '#0e7a55');
    const primary700 = this.resolveCssVar('--ts-primary-700', '#0f766e');
    const trendLineColor = this.withAlpha(primary600, 0.5);
    const trendFillColor = this.withAlpha(primary500, 0.14);
    const trendPointColor = this.withAlpha(primary700, 0.5);

    if (this.roundTrendChart) {
      this.roundTrendChart.data.labels = labels;
      this.roundTrendChart.data.datasets[0].data = points;
      this.roundTrendChart.data.datasets[0].borderColor = trendLineColor;
      this.roundTrendChart.data.datasets[0].backgroundColor = trendFillColor;
      this.roundTrendChart.data.datasets[0].pointBackgroundColor = trendPointColor;
      this.roundTrendChart.update();
      return;
    }

    this.roundTrendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: points,
            fill: true,
            borderColor: trendLineColor,
            backgroundColor: trendFillColor,
            borderWidth: 2,
            tension: 0.32,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: trendPointColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'line'>) =>
                this.translate.instant(
                  'championship.statistics.trend.tooltipPoints',
                  { points: context.parsed.y },
                ),
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#475569',
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#475569',
              precision: 0,
              stepSize: 1,
            },
            grid: {
              color: this.withAlpha(primary600, 0.18),
            },
          },
        },
      },
    });
  }

  private destroyRoundTrendChart(): void {
    if (this.roundTrendChart) {
      this.roundTrendChart.destroy();
      this.roundTrendChart = null;
    }
  }

  private resolveCssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') {
      return fallback;
    }

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  }

  private withAlpha(color: string, alpha: number): string {
    const hexMatch = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      const normalized =
        hex.length === 3
          ? hex
              .split('')
              .map((char) => `${char}${char}`)
              .join('')
          : hex;
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const rgbMatch = color
      .trim()
      .match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return `rgba(16, 185, 129, ${alpha})`;
  }

  private readonly percentageLabelPlugin: Plugin<'pie'> = {
    id: 'percentageLabelPlugin',
    afterDatasetsDraw: (chart) => {
      const dataset = chart.data.datasets[0];
      if (!dataset) {
        return;
      }

      const values = (dataset.data as number[]).map((value) =>
        Number.isFinite(value) ? value : 0,
      );
      const total = values.reduce((sum, value) => sum + value, 0);

      if (total <= 0) {
        return;
      }

      const meta = chart.getDatasetMeta(0);
      const { ctx } = chart;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial';

      meta.data.forEach((arc, index) => {
        const value = values[index] ?? 0;
        if (value <= 0) {
          return;
        }

        const percentage = (value / total) * 100;
        const label = `${percentage.toFixed(1)}%`;

        const position = arc.tooltipPosition(false);
        if (position.x === null || position.y === null) {
          return;
        }
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(label, position.x, position.y);
        ctx.fillText(label, position.x, position.y);
      });

      ctx.restore();
    },
  };
}
