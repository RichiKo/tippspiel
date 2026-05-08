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
} from '../../../ui-lib/public-api';

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

  championship = signal<Championship | null>(null);
  bonusColumns = signal<BonusColumn[]>([]);
  standings = signal<StandingRow[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

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
    this.championshipService.getChampionshipById(this.championshipId).subscribe({
      next: (championship) => {
        this.championship.set(championship);
      },
      error: () => {
        this.error.set(
          this.translate.instant('championship.standings.errors.loadChampionship'),
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

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }
}
