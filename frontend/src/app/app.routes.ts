import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { AuthLandingComponent } from './auth/components/auth-landing.component';
import type { SeoMetadata } from './shared/services/seo.service';

const LANDING_SEO: SeoMetadata = {
  title: 'TippsLiga | Fussball Tippspiel / Футбольний конкурс прогнозів',
  description:
    'TippsLiga ist dein digitales Fussball-Tippspiel fuer private Ligen und Freunde. TippsLiga — цифровий футбольний конкурс прогнозів для приватних ліг та друзів.',
  robots: 'index,follow',
};

const PRIVATE_SEO: SeoMetadata = {
  title: 'TippsLiga App | Privat / Приватно',
  description:
    'Privater Bereich von TippsLiga. Tipps, Rankings und Verwaltung sind nur nach Login sichtbar. Приватна зона TippsLiga доступна лише після входу.',
  robots: 'noindex,nofollow',
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: AuthLandingComponent,
    data: { seo: LANDING_SEO },
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'dashboard/create',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./dashboard/components/add-championship/add-championship.component').then(
        (m) => m.AddChampionshipComponent,
      ),
  },
  {
    path: 'dashboard/championship/:id/edit',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./dashboard/components/championship-edit/championship-edit.component').then(
        (m) => m.ChampionshipEditComponent,
      ),
  },
  {
    path: 'championship/:id',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./championship/championship-detail.component').then(
        (m) => m.ChampionshipDetailComponent,
      ),
  },
  {
    path: 'championship/:id/ranking',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./championship/components/ranking/ranking.component').then(
        (m) => m.RankingComponent,
      ),
  },
  {
    path: 'championship/:id/standings',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./championship/components/standings/standings.component').then(
        (m) => m.StandingsComponent,
      ),
  },
  {
    path: 'championship/:id/bonus-overview',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./bonus/components/bonus-overview/bonus-overview.component').then(
        (m) => m.BonusOverviewComponent,
      ),
  },
  {
    path: 'teams',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./teams/teams.component').then((m) => m.TeamsComponent),
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    data: { seo: PRIVATE_SEO },
    loadComponent: () =>
      import('./user-settings/user-settings.component').then(
        (m) => m.UserSettingsComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
