import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Championship } from '../../../dashboard/types/championship.interface';
import {
  BonusColumn,
  StandingRow,
  StandingsResponse,
} from '../../types/ranking.interface';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { PersistingService } from '../../../auth/services/persisisting.service';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiCardComponent,
  UiPageHeaderComponent,
  UiButtonComponent,
} from '../../../ui-lib/public-api';
import { PrizeFundConfiguration } from '../../types/prize-fund.interface';
import {
  calculatePrizeFund,
  formatMinorUnits,
} from '../../utils/prize-fund.util';
import { PrizeFundTableComponent } from '../prize-fund-table/prize-fund-table.component';
import {
  PrizeFundDialogComponent,
  PrizeFundDialogData,
} from '../prize-fund-dialog/prize-fund-dialog.component';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    UiBadgeComponent,
    UiCardComponent,
    UiPageHeaderComponent,
    UiButtonComponent,
    PrizeFundTableComponent,
  ],
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly persistingService = inject(PersistingService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private prizeRequest: Subscription | null = null;

  championship = signal<Championship | null>(null);
  bonusColumns = signal<BonusColumn[]>([]);
  standings = signal<StandingRow[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  readonly selectedView = signal<'standings' | 'winners'>('standings');
  readonly prizeConfiguration = signal<PrizeFundConfiguration | null>(null);
  readonly isPrizeLoading = signal(false);
  readonly prizeError = signal<string | null>(null);
  readonly prizeFund = computed(() => {
    const configuration = this.prizeConfiguration();
    return configuration
      ? calculatePrizeFund(this.standings(), configuration)
      : null;
  });
  readonly canManagePrizeFund = computed(() => {
    const user = this.currentUser();
    const championship = this.championship();
    return (
      !!user &&
      !!championship &&
      !championship.isPublic &&
      (user.role === 'admin' ||
        user.role === 'super_admin' ||
        championship.createdByUserId === user.id.toString())
    );
  });

  readonly currentUser = this.persistingService.currentUser;
  readonly icons = UI_ICONS;
  readonly showTotalColumn = computed(() => this.bonusColumns().length > 0);

  readonly sortedStandings = computed(() => {
    const allStandings = this.standings();

    return [...allStandings].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactHits !== a.exactHits) {
        return b.exactHits - a.exactHits;
      }
      if (b.goalDiffHits !== a.goalDiffHits) {
        return b.goalDiffHits - a.goalDiffHits;
      }
      return b.tendencyHits - a.tendencyHits;
    });
  });

  championshipId = '';

  setView(view: 'standings' | 'winners'): void {
    if (
      view === this.selectedView() ||
      (view === 'winners' && this.championship()?.isPublic !== false)
    )
      return;
    this.prizeRequest?.unsubscribe();
    this.isPrizeLoading.set(false);
    this.selectedView.set(view);
    if (view === 'winners') this.loadPrizeFund();
  }

  loadPrizeFund(): void {
    this.prizeRequest?.unsubscribe();
    this.isPrizeLoading.set(true);
    this.prizeError.set(null);
    this.prizeRequest = forkJoin({
      configuration: this.championshipService.getPrizeFund(this.championshipId),
      standings: this.rankingService.getStandings(this.championshipId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ configuration, standings }) => {
          this.prizeConfiguration.set(configuration);
          this.standings.set(standings.standings);
          this.bonusColumns.set(standings.bonusColumns ?? []);
          this.isPrizeLoading.set(false);
        },
        error: () => {
          this.isPrizeLoading.set(false);
          this.prizeError.set(
            this.translate.instant('championship.prizeFund.errors.load'),
          );
        },
      });
  }

  editPrizeFund(): void {
    const configuration = this.prizeConfiguration();
    if (!configuration || !this.canManagePrizeFund() || this.isPrizeLoading())
      return;
    this.dialog
      .open<
        PrizeFundDialogComponent,
        PrizeFundDialogData,
        PrizeFundConfiguration
      >(PrizeFundDialogComponent, {
        width: '720px',
        maxWidth: 'calc(100vw - 24px)',
        data: {
          championshipId: this.championshipId,
          configuration,
          participants: this.standings(),
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) this.loadPrizeFund();
      });
  }

  money(amount: bigint | string): string {
    return formatMinorUnits(BigInt(amount), this.translate.currentLang);
  }

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
    this.loadStandings();
  }

  loadChampionship(): void {
    this.championshipService
      .getChampionshipById(this.championshipId)
      .subscribe({
        next: (championship) => {
          this.championship.set(championship);
        },
        error: () => {
          this.error.set(
            this.translate.instant(
              'championship.standings.errors.loadChampionship',
            ),
          );
        },
      });
  }

  loadStandings(): void {
    this.rankingService.getStandings(this.championshipId).subscribe({
      next: (response: StandingsResponse) => {
        this.bonusColumns.set(response.bonusColumns ?? []);
        this.standings.set(response.standings);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.standings.errors.loadStandings'),
        );
        this.isLoading.set(false);
      },
    });
  }

  isCurrentUser(userId: number): boolean {
    return this.currentUser()?.id === userId;
  }

  getBonusPointsForColumn(standing: StandingRow, columnKey: string): number {
    return standing.bonusPointsByColumn[columnKey] ?? 0;
  }

  getColumnDisplayLabel(label: string): string {
    return label.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }

  getBonusColumnDisplayLabel(column: BonusColumn): string {
    const baseLabel = this.getColumnDisplayLabel(column.label);
    const suffix = this.getBonusColumnSubruleSuffix(column);

    return suffix ? `${baseLabel} ${suffix}` : baseLabel;
  }

  getBonusColumnSubruleSuffix(column: BonusColumn): string {
    if (column.subrule === 'finalist') {
      return '(FN)';
    }

    if (column.subrule === 'champion') {
      return '(CH)';
    }

    return '';
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }
}
