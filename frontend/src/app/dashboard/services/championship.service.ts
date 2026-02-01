import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Championship } from '../types/championship.interface';
import { Team } from '../../teams/types/team.interface';

@Injectable({ providedIn: 'root' })
export class ChampionshipService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/championships';

  getAllChampionships(): Observable<Championship[]> {
    return this.http.get<Championship[]>(this.apiUrl);
  }

  getChampionshipById(id: string): Observable<Championship> {
    return this.http.get<Championship>(`${this.apiUrl}/${id}`);
  }

  createChampionship(
    championship: Omit<Championship, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Championship> {
    return this.http.post<Championship>(this.apiUrl, championship);
  }

  updateChampionship(
    id: string,
    championship: Partial<Championship>
  ): Observable<Championship> {
    return this.http.put<Championship>(`${this.apiUrl}/${id}`, championship);
  }

  deleteChampionship(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Team Management
  addTeamToChampionship(
    championshipId: string,
    teamId: string
  ): Observable<Championship> {
    return this.http.post<Championship>(
      `${this.apiUrl}/${championshipId}/teams/${teamId}`,
      {}
    );
  }

  removeTeamFromChampionship(
    championshipId: string,
    teamId: string
  ): Observable<Championship> {
    return this.http.delete<Championship>(
      `${this.apiUrl}/${championshipId}/teams/${teamId}`
    );
  }

  getChampionshipTeams(championshipId: string): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/${championshipId}/teams`);
  }
}
