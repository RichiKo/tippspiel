import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrentUserInterface } from '../../shared/types/current-user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseUrl: string = 'http://localhost:3000/users/login';

  http = inject(HttpClient);

  login(email: string, password: string): Observable<CurrentUserInterface> {
    const url: string = 'http://localhost:3000/users/login';

    const payload = {
      user: {
        email,
        password,
      },
    };

    return this.http.post<CurrentUserInterface>(url, payload);
  }
}
