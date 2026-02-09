import { Component, signal, computed, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Championship } from '../../../dashboard/types/championship.interface';
import { Ranking } from '../../types/ranking.interface';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { PersistingService } from '../../../auth/services/persisisting.service';

@Component({
  selector: 'app-standings',
  imports: [CommonModule],
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss',
})
export class StandingsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly persistingService = inject(PersistingService);

  championship = signal<Championship | null>(null);
  standings = signal<Ranking[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly currentUser = this.persistingService.currentUser;

  readonly sortedStandings = computed(() => {
    const allStandings = this.standings();
    
    // Sort by totalPoints descending, then by exactHits, goalDiffHits, tendencyHits
    return allStandings.sort((a, b) => {
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
      if (id) {
        this.championshipId = id;
        this.loadData();
      }
    }, { allowSignalWrites: true });
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
      error: (err) => {
        console.error('Failed to load championship:', err);
        this.error.set('Fehler beim Laden der Championship-Daten.');
      }
    });
  }

  loadStandings(): void {
    this.rankingService.getRankingByChampionship(this.championshipId).subscribe({
      next: (standings) => {
        this.standings.set(standings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load standings:', err);
        this.error.set('Fehler beim Laden der Ergebnis-Tabelle.');
        this.isLoading.set(false);
      }
    });
  }

  isCurrentUser(userId: number): boolean {
    return this.currentUser()?.id === userId;
  }

  backToChampionship(): void {
    this.router.navigate(['/championship', this.championshipId]);
  }
}
