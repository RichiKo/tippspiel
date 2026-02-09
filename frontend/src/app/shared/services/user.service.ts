import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CurrentUserResponse } from '../types/current-user.interface';
import { PersistingService } from '../../auth/services/persisisting.service';

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly persistingService = inject(PersistingService);

  updateUser(data: UpdateUserDto): Observable<CurrentUserResponse> {
    return this.http.put<CurrentUserResponse>('/api/user', { user: data }).pipe(
      tap((response) => {
        // Update persisted user data after successful update
        this.persistingService.save(response.user);
      })
    );
  }

  uploadUserImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>('/api/upload/user-image', formData);
  }
}
