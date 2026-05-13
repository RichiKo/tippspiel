import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ChampionshipService } from './services/championship.service';
import { PersistingService } from '../auth/services/persisisting.service';
import { MembershipService } from '../shared/services/membership.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        {
          provide: ChampionshipService,
          useValue: {
            getAllChampionships: jasmine
              .createSpy('getAllChampionships')
              .and.returnValue(of([])),
          },
        },
        {
          provide: PersistingService,
          useValue: {
            currentUser: signal({
              id: 1,
              username: 'User',
              email: 'user@test.de',
              role: 'user',
              image: null,
              token: 'token',
            }),
          },
        },
        {
          provide: MembershipService,
          useValue: {
            getMembershipStatus: jasmine.createSpy('getMembershipStatus'),
            getPendingMemberships: jasmine.createSpy('getPendingMemberships'),
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        dashboard: {
          hero: {
            badge: 'Tippspiel',
            title: 'Dashboard',
            subtitle: 'Uebersicht',
          },
          actions: {
            archive: 'Archive',
          },
          states: {
            empty: 'Keine Championships vorhanden.',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders the archive button inside the dashboard card', () => {
    const hero = fixture.nativeElement.querySelector(
      '.dashboard-hero',
    ) as HTMLElement;
    const link = hero.querySelector(
      '[data-testid="dashboard-archive-link"]',
    ) as HTMLAnchorElement;

    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/archive');
    expect(link.textContent).toContain('Archive');
    expect(
      fixture.nativeElement.querySelector('.dashboard-tile--archive'),
    ).toBeNull();
  });
});
