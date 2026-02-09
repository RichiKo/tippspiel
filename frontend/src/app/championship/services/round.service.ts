import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Round, CreateRoundDto, UpdateRoundDto } from '../types/round.interface';

@Injectable({ providedIn: 'root' })
export class RoundService {
  private readonly http = inject(HttpClient);

  getRoundsByChampionship(championshipId: string): Observable<Round[]> {
    return this.http.get<Round[]>(`/api/championships/${championshipId}/rounds`);
  }

  getRoundById(id: string): Observable<Round> {
    return this.http.get<Round>(`/api/rounds/${id}`);
  }

  createRound(championshipId: string, round: CreateRoundDto): Observable<Round> {
    return this.http.post<Round>(`/api/championships/${championshipId}/rounds`, round);
  }

  updateRound(id: string, round: UpdateRoundDto): Observable<Round> {
    return this.http.put<Round>(`/api/rounds/${id}`, round);
  }

  deleteRound(id: string): Observable<void> {
    return this.http.delete<void>(`/api/rounds/${id}`);
  }
}
