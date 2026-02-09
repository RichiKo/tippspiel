import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly http = inject(HttpClient);

  uploadImage(
    file: File,
    category: 'teams' | 'users' | 'championships',
  ): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = this.getEndpoint(category);
    return this.http.post<{ url: string }>(endpoint, formData);
  }

  private getEndpoint(category: 'teams' | 'users' | 'championships'): string {
    const endpoints = {
      teams: '/api/upload/team-logo',
      users: '/api/upload/user-image',
      championships: '/api/upload/championship-image',
    };
    return endpoints[category];
  }
}
