import { Injectable, signal } from '@angular/core';
import { CurrentUserInterface } from '../../shared/types/current-user.interface';

const LOCAL_STORAGE_KEY = 'currentUser';

@Injectable({
  providedIn: 'root',
})
export class PersistingService {
  private readonly storage = localStorage;

  readonly currentUser = signal<CurrentUserInterface | null>(
    this.loadFromStorage()
  );

  save(user: CurrentUserInterface) {
    this.storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  clear() {
    this.storage.removeItem(LOCAL_STORAGE_KEY);
    this.currentUser.set(null);
  }

  private loadFromStorage(): CurrentUserInterface | null {
    const raw = this.storage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUserInterface;
    } catch {
      return null;
    }
  }
}
