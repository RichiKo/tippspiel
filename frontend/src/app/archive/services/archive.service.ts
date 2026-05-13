import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ArchiveEntry,
  ArchiveUserOption,
  CreateArchiveEntryRequest,
  UpdateArchiveEntryRequest,
} from '../types/archive.interface';

@Injectable({ providedIn: 'root' })
export class ArchiveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getArchiveEntries(): Observable<ArchiveEntry[]> {
    return this.http.get<ArchiveEntry[]>(`${this.apiUrl}/archive`);
  }

  createArchiveEntry(
    payload: CreateArchiveEntryRequest,
  ): Observable<ArchiveEntry> {
    return this.http.post<ArchiveEntry>(`${this.apiUrl}/archive`, payload);
  }

  updateArchiveEntry(
    id: string,
    payload: UpdateArchiveEntryRequest,
  ): Observable<ArchiveEntry> {
    return this.http.put<ArchiveEntry>(
      `${this.apiUrl}/archive/${encodeURIComponent(id)}`,
      payload,
    );
  }

  deleteArchiveEntry(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/archive/${encodeURIComponent(id)}`,
    );
  }

  getArchiveUserOptions(): Observable<ArchiveUserOption[]> {
    return this.http.get<ArchiveUserOption[]>(
      `${this.apiUrl}/users/archive-options`,
    );
  }
}
