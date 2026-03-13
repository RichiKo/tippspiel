import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChampionshipAggregateStatistics,
  ChampionshipStatistics,
  Ranking,
  StandingsResponse,
} from '../types/ranking.interface';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  getRankingByChampionship(championshipId: string): Observable<Ranking[]> {
    return this.http.get<Ranking[]>(`/api/rankings/championship/${championshipId}`);
  }

  getStandings(championshipId: string): Observable<StandingsResponse> {
    return this.http.get<StandingsResponse>(
      `/api/rankings/championship/${championshipId}/standings`,
    );
  }

  getMyStatistics(championshipId: string): Observable<ChampionshipStatistics> {
    return this.http.get<ChampionshipStatistics>(
      `/api/rankings/championship/${championshipId}/statistics/me`,
    );
  }

  getChampionshipStatistics(
    championshipId: string,
  ): Observable<ChampionshipAggregateStatistics> {
    return this.http.get<ChampionshipAggregateStatistics>(
      `/api/rankings/championship/${championshipId}/statistics/championship`,
    );
  }
}
