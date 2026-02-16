import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { PersistingService } from './auth/services/persisisting.service';
import { appConfig } from './app.config';
import { routes } from './app.routes';
import { AuthGuard } from './shared/guards/auth.guard';

describe('appConfig date adapter', () => {
  it('uses monday as first day of week', () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const dateAdapter = TestBed.inject(DateAdapter<Date>);

    expect(dateAdapter.getFirstDayOfWeek()).toBe(1);
  });
});

describe('AuthGuard routing behavior', () => {
  const route = {} as ActivatedRouteSnapshot;

  function setup(currentUser: unknown) {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        provideRouter(routes),
        { provide: PersistingService, useValue: { currentUser: () => currentUser } },
      ],
    });

    return {
      guard: TestBed.inject(AuthGuard),
      router: TestBed.inject(Router),
    };
  }

  it('redirects authenticated users from root to dashboard', () => {
    const { guard, router } = setup({ token: 'valid-token' });
    const state = { url: '/' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('allows unauthenticated users to access root', () => {
    const { guard } = setup(null);
    const state = { url: '/' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result).toBeTrue();
  });

  it('redirects unauthenticated users from protected routes to root', () => {
    const { guard, router } = setup(null);
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
