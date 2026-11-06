import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { signal } from '@angular/core';
import { PersistingService } from '../../auth/services/persisisting.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard notification links', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PersistingService, useValue: { currentUser: signal(null) } },
      ],
    }),
  );
  it('keeps the tour target through login without redirecting the landing page again', () => {
    const guard = TestBed.inject(AuthGuard);
    const router = TestBed.inject(Router);
    const result = guard.canActivate(
      {} as ActivatedRouteSnapshot,
      { url: '/championship/cup?roundId=tour' } as RouterStateSnapshot,
    );
    const url = router.serializeUrl(result as ReturnType<Router['parseUrl']>);
    expect(url).toContain('returnUrl=');
    expect(
      guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url } as RouterStateSnapshot,
      ),
    ).toBeTrue();
  });
});
