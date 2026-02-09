import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ranking } from '../types/ranking.interface';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  getRankingByChampionship(championshipId: string): Observable<Ranking[]> {
    return this.http.get<Ranking[]>(`/api/rankings/championship/${championshipId}`);
  }
}
