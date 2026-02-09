import { Component, signal, computed, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Championship } from '../../../dashboard/types/championship.interface';
import { Ranking } from '../../types/ranking.interface';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { GameService } from '../../services/game.service';
import { PersistingService } from '../../../auth/services/persisisting.service';

@Component({
  selector: 'app-ranking',
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly rankingService = inject(RankingService);
  private readonly gameService = inject(GameService);
  private readonly persistingService = inject(PersistingService);

  championship = signal<Championship | null>(null);
  rankings = signal<Ranking[]>([]);
  totalGames = signal<number>(0);
  closedGames = signal<number>(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly currentUser = this.persistingService.currentUser;

  readonly sortedRankings = computed(() => {
    const currentUserId = this.currentUser()?.id;
    const allRankings = this.rankings();
    
    const currentUserRanking = allRankings.find(r => r.userId === currentUserId);
    const otherRankings = allRankings
      .filter(r => r.userId !== currentUserId)
      .sort((a, b) => a.user.username.localeCompare(b.user.username));
    
    return currentUserRanking 
      ? [currentUserRanking, ...otherRankings]
      : otherRankings;
  });

  championshipId = '';

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.championshipId = id;
        this.loadData();
      }
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
      error: (err) => {
        console.error('Failed to load championship:', err);
        this.error.set('Fehler beim Laden der Championship-Daten.');
      }
    });
  }

  loadRankings(): void {
    this.rankingService.getRankingByChampionship(this.championshipId).subscribe({
      next: (rankings) => {
        this.rankings.set(rankings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load rankings:', err);
        this.error.set('Fehler beim Laden der Rangliste.');
        this.isLoading.set(false);
      }
    });
  }

  loadGamesCount(): void {
    this.gameService.getGamesByChampionship(this.championshipId).subscribe({
      next: (games) => {
        this.totalGames.set(games.length);
        this.closedGames.set(games.filter(g => g.isClosed).length);
      },
      error: (err) => {
        console.error('Failed to load games count:', err);
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
