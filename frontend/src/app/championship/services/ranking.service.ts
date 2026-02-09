import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ranking, StandingsResponse } from '../types/ranking.interface';

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
}
