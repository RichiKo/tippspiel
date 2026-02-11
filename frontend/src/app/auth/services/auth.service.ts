import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrentUserResponse } from '../../shared/types/current-user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = '/api/users';

  http = inject(HttpClient);

  login(email: string, password: string): Observable<CurrentUserResponse> {
    const url = `${this.baseUrl}/login`;
    const payload = {
      user: {
        email,
        password,
      },
    };

    return this.http.post<CurrentUserResponse>(url, payload);
  }

  register(
    username: string,
    email: string,
    password: string
  ): Observable<CurrentUserResponse> {
    const payload = {
      user: {
        username,
        email,
        password,
      },
    };

    return this.http.post<CurrentUserResponse>(this.baseUrl, payload);
  }
}
