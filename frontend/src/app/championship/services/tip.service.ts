import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tip, CreateTipDto } from '../types/tip.interface';

@Injectable({ providedIn: 'root' })
export class TipService {
  private readonly http = inject(HttpClient);

  createOrUpdateTip(tip: CreateTipDto): Observable<Tip> {
    return this.http.post<Tip>('/api/tips', tip);
  }

  getUserTipsForChampionship(userId: string, championshipId: string): Observable<Tip[]> {
    return this.http.get<Tip[]>(`/api/tips/user/${userId}/championship/${championshipId}`);
  }

  getTipsForGame(gameId: string): Observable<Tip[]> {
    return this.http.get<Tip[]>(`/api/games/${gameId}/tips`);
  }
}
