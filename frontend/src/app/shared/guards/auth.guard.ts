import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { PersistingService } from '../../auth/services/persisisting.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.persistingService.currentUser();
    if (user) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
