import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { PersistingService } from '../../auth/services/persisisting.service';
import { notificationReturnUrl } from '../../auth/services/notification-return-url';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const user = this.persistingService.currentUser();
    const isAuthenticated = Boolean(user?.token);

    if (state.url.split('?')[0] === '/') {
      if (isAuthenticated) {
        return this.router.parseUrl('/dashboard');
      }

      return true;
    }

    if (isAuthenticated) {
      return true;
    }

    const returnUrl = notificationReturnUrl(state.url);
    return returnUrl ? this.router.createUrlTree(['/'], { queryParams: { returnUrl } }) : this.router.parseUrl('/');
  }
}
