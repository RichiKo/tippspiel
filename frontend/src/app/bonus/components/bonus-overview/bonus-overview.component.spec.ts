import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { BonusOverviewComponent } from './bonus-overview.component';
import { BonusService } from '../../services/bonus.service';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../../championship/services/ranking.service';

describe('BonusOverviewComponent', () => {
  let component: BonusOverviewComponent;
  let fixture: ComponentFixture<BonusOverviewComponent>;

  const mockChampionshipService = {
    getChampionshipById: jasmine.createSpy('getChampionshipById').and.returnValue(
      of({
        id: 'champ-1',
        name: 'CL 2026',
        description: '',
        image: '',
        isPublic: true,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        teamIds: [],
        eliminatedTeamIds: ['team-2'],
      }),
    ),
  };

  const mockBonusService = {
    getBonusRulesForOverview: jasmine
      .createSpy('getBonusRulesForOverview')
      .and.returnValue(
      of([
        {
          id: 'rule-1',
          championshipId: 'champ-1',
          type: 'champion',
          name: 'Meister',
          config: { championPoints: 3 },
          deadline: '2026-02-01T00:00:00.000Z',
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rule-2',
          championshipId: 'champ-1',
          type: 'champion',
          name: 'Finalist',
          config: { championPoints: 3 },
          deadline: '2026-02-02T00:00:00.000Z',
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    ),
    getAllPicksUser: jasmine
      .createSpy('getAllPicksUser')
      .and.callFake((ruleId: string) => {
        if (ruleId === 'rule-2') {
          return of([
            {
              id: 'pick-2',
              bonusRuleId: 'rule-2',
              userId: 1,
              teamId: 'team-1',
              team: {
                id: 'team-1',
                name: 'Silver Wolf',
                shortName: 'SW',
                logoUrl: 'https://example.com/sw.png',
              },
              user: {
                id: 1,
                username: 'Richi',
                email: 'richi@test.com',
                image: '',
              },
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ]);
        }

        return of([
          {
            id: 'pick-1',
            bonusRuleId: 'rule-1',
            userId: 1,
            teamId: 'team-2',
            team: {
              id: 'team-2',
              name: 'Golden Eagle',
              shortName: 'GE',
              logoUrl: 'https://example.com/ge.png',
            },
            user: {
              id: 1,
              username: 'Richi',
              email: 'richi@test.com',
              image: '',
            },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]);
      }),
  };

  const mockRankingService = {
    getRankingByChampionship: jasmine
      .createSpy('getRankingByChampionship')
      .and.returnValue(
        of([
          {
            id: 'ranking-1',
            userId: 1,
            championshipId: 'champ-1',
            rank: 1,
            exactHits: 0,
            goalDiffHits: 0,
            tendencyHits: 0,
            missedTips: 0,
            totalPoints: 0,
            bonusPoints: 0,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            user: {
              id: 1,
              username: 'Richi',
              email: 'richi@test.com',
              image: null,
            },
          },
          {
            id: 'ranking-2',
            userId: 2,
            championshipId: 'champ-1',
            rank: 2,
            exactHits: 0,
            goalDiffHits: 0,
            tendencyHits: 0,
            missedTips: 0,
            totalPoints: 0,
            bonusPoints: 0,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            user: {
              id: 2,
              username: 'Petya',
              email: 'petya@test.com',
              image: null,
            },
          },
        ]),
      ),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusOverviewComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'champ-1' }),
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: navigateSpy,
          },
        },
        { provide: BonusService, useValue: mockBonusService },
        { provide: ChampionshipService, useValue: mockChampionshipService },
        { provide: RankingService, useValue: mockRankingService },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        bonus: {
          overview: {
            badges: {
              inGame: '{{count}} im Spiel',
              out: '{{count}} raus',
            },
            eliminated: 'Eliminiert',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(BonusOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render migrated bonus overview with ui page header', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('.bonus-overview-table').length,
    ).toBe(2);
  });

  it('should render one table per bonus rule', () => {
    const tables = fixture.nativeElement.querySelectorAll(
      '.bonus-overview-table',
    ) as NodeListOf<HTMLTableElement>;

    expect(tables.length).toBe(2);
    expect(tables[0].querySelector('th.bonus-column')?.textContent).toContain(
      'Meister',
    );
    expect(tables[1].querySelector('th.bonus-column')?.textContent).toContain(
      'Finalist',
    );
  });

  it('should show in-game and out counts in badges and table state', () => {
    const inGameCountBadge = fixture.nativeElement.querySelector(
      '[data-testid="in-game-count-badge"]',
    ) as HTMLElement;
    const eliminatedCountBadge = fixture.nativeElement.querySelector(
      '[data-testid="eliminated-count-badge"]',
    ) as HTMLElement;

    expect(inGameCountBadge.textContent).toContain('1');
    expect(eliminatedCountBadge.textContent).toContain('3');

    const eliminatedCell = fixture.nativeElement.querySelector(
      '.pick-cell.eliminated-pick',
    ) as HTMLElement;
    expect(eliminatedCell).toBeTruthy();
    expect(eliminatedCell.textContent).toContain('Golden Eagle');
  });

  it('should render participants without pick with placeholder entry', () => {
    const tables = fixture.nativeElement.querySelectorAll(
      '.bonus-overview-table',
    ) as NodeListOf<HTMLTableElement>;

    const firstTableRows = tables[0].querySelectorAll('tbody tr');
    const secondTableRows = tables[1].querySelectorAll('tbody tr');

    const petyaRowInFirstTable = Array.from(firstTableRows).find((row) =>
      row.textContent?.includes('Petya'),
    ) as HTMLTableRowElement | undefined;
    const petyaRowInSecondTable = Array.from(secondTableRows).find((row) =>
      row.textContent?.includes('Petya'),
    ) as HTMLTableRowElement | undefined;

    expect(petyaRowInFirstTable).toBeTruthy();
    expect(petyaRowInSecondTable).toBeTruthy();

    expect(
      petyaRowInFirstTable?.querySelector('.pick-cell ui-badge')?.textContent,
    ).toContain('Не вибрано');
    expect(
      petyaRowInSecondTable?.querySelector('.pick-cell ui-badge')?.textContent,
    ).toContain('Не вибрано');
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });

  it('should render username initials placeholder when avatar image is missing', () => {
    const placeholder = fixture.nativeElement.querySelector(
      '.user-avatar-placeholder',
    ) as HTMLElement;

    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent?.trim()).toBe('R');
  });
});
