import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { AuthLandingComponent } from './auth/components/auth-landing.component';

export const routes: Routes = [
  { path: '', component: AuthLandingComponent },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'dashboard/create',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./dashboard/components/add-championship/add-championship.component').then(
        (m) => m.AddChampionshipComponent,
      ),
  },
  {
    path: 'dashboard/championship/:id/edit',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./dashboard/components/championship-edit/championship-edit.component').then(
        (m) => m.ChampionshipEditComponent,
      ),
  },
  {
    path: 'championship/:id',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./championship/championship-detail.component').then(
        (m) => m.ChampionshipDetailComponent,
      ),
  },
  {
    path: 'championship/:id/ranking',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./championship/components/ranking/ranking.component').then(
        (m) => m.RankingComponent,
      ),
  },
  {
    path: 'championship/:id/standings',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./championship/components/standings/standings.component').then(
        (m) => m.StandingsComponent,
      ),
  },
  {
    path: 'championship/:id/bonus-overview',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./bonus/components/bonus-overview/bonus-overview.component').then(
        (m) => m.BonusOverviewComponent,
      ),
  },
  {
    path: 'teams',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./teams/teams.component').then((m) => m.TeamsComponent),
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./user-settings/user-settings.component').then(
        (m) => m.UserSettingsComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
