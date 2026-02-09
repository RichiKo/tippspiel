import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, CreateGameDto, UpdateGameDto, UpdateGameResultDto } from '../types/game.interface';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  getGamesByChampionship(
    championshipId: string,
    filters?: { roundId?: string; isClosed?: boolean }
  ): Observable<Game[]> {
    let params = new HttpParams();
    if (filters?.roundId) {
      params = params.set('roundId', filters.roundId);
    }
    if (filters?.isClosed !== undefined) {
      params = params.set('isClosed', filters.isClosed.toString());
    }

    return this.http.get<Game[]>(`/api/championships/${championshipId}/games`, { params });
  }

  getGameById(id: string): Observable<Game> {
    return this.http.get<Game>(`/api/games/${id}`);
  }

  createGame(roundId: string, game: CreateGameDto): Observable<Game> {
    return this.http.post<Game>(`/api/rounds/${roundId}/games`, game);
  }

  updateGame(id: string, game: UpdateGameDto): Observable<Game> {
    return this.http.put<Game>(`/api/games/${id}`, game);
  }

  updateGameResult(id: string, result: UpdateGameResultDto): Observable<Game> {
    return this.http.put<Game>(`/api/games/${id}/result`, result);
  }

  deleteGame(id: string): Observable<void> {
    return this.http.delete<void>(`/api/games/${id}`);
  }
}
