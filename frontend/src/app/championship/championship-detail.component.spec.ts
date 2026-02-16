import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ChampionshipDetailComponent } from './championship-detail.component';
import { ChampionshipService } from '../dashboard/services/championship.service';
import { RoundService } from './services/round.service';
import { GameService } from './services/game.service';
import { TipService } from './services/tip.service';
import { BonusService } from '../bonus/services/bonus.service';
import { RankingService } from './services/ranking.service';
import { PersistingService } from '../auth/services/persisisting.service';
import { Game } from './types/game.interface';

describe('ChampionshipDetailComponent', () => {
  let component: ChampionshipDetailComponent;
  let fixture: ComponentFixture<ChampionshipDetailComponent>;

  const closedGame: Game = {
    id: 'g1',
    homeTeamId: 'h1',
    awayTeamId: 'a1',
    kickoffTime: new Date('2026-02-01T12:00:00.000Z'),
    roundId: 'r1',
    homeScore: 2,
    awayScore: 1,
    isClosed: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const openGame: Game = {
    id: 'g2',
    homeTeamId: 'h2',
    awayTeamId: 'a2',
    kickoffTime: new Date('2026-02-02T12:00:00.000Z'),
    roundId: 'r1',
    homeScore: null,
    awayScore: null,
    isClosed: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockChampionshipService = {
    getChampionshipById: jasmine
      .createSpy('getChampionshipById')
      .and.returnValue(
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
          eliminatedTeamIds: [],
        }),
      ),
    getChampionshipTeams: jasmine
      .createSpy('getChampionshipTeams')
      .and.returnValue(of([])),
  };

  const mockRoundService = {
    getRoundsByChampionship: jasmine
      .createSpy('getRoundsByChampionship')
      .and.returnValue(
        of([
          {
            id: 'r1',
            name: 'Runde 1',
            startDate: new Date('2026-02-01T00:00:00.000Z'),
            endDate: new Date('2026-02-03T00:00:00.000Z'),
            championshipId: 'champ-1',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ]),
      ),
    createRound: jasmine.createSpy('createRound').and.returnValue(of()),
  };

  const mockGameService = {
    getGamesByChampionship: jasmine
      .createSpy('getGamesByChampionship')
      .and.returnValue(of([closedGame, openGame])),
    createGame: jasmine.createSpy('createGame').and.returnValue(of(closedGame)),
    updateGame: jasmine.createSpy('updateGame').and.returnValue(of(closedGame)),
    updateGameResult: jasmine
      .createSpy('updateGameResult')
      .and.returnValue(of(closedGame)),
    deleteGame: jasmine.createSpy('deleteGame').and.returnValue(of(void 0)),
  };

  const mockTipService = {
    getUserTipsForChampionship: jasmine
      .createSpy('getUserTipsForChampionship')
      .and.returnValue(
        of([
          {
            gameId: 'g1',
            championshipId: 'champ-1',
            userId: 1,
            homeTeamGoals: 2,
            awayTeamGoals: 1,
            points: 3,
            outcomeType: 'exact',
          },
        ]),
      ),
    getTipsForGame: jasmine
      .createSpy('getTipsForGame')
      .and.returnValue(
        of([
          {
            gameId: 'g1',
            championshipId: 'champ-1',
            userId: 1,
            homeTeamGoals: 2,
            awayTeamGoals: 1,
            points: 3,
            outcomeType: 'exact',
            user: { id: 1, username: 'Richi', email: 'r@test.com' },
          },
        ]),
      ),
    createOrUpdateTip: jasmine.createSpy('createOrUpdateTip').and.returnValue(
      of({
        gameId: 'g1',
        championshipId: 'champ-1',
        userId: 1,
        homeTeamGoals: 2,
        awayTeamGoals: 1,
        points: 3,
        outcomeType: 'exact',
      }),
    ),
  };

  const mockBonusService = {
    getActiveBonusRules: jasmine
      .createSpy('getActiveBonusRules')
      .and.returnValue(of([])),
  };

  const mockRankingService = {
    getRankingByChampionship: jasmine
      .createSpy('getRankingByChampionship')
      .and.returnValue(
        of([
          {
            id: 'rank-1',
            championshipId: 'champ-1',
            userId: 1,
            rank: 1,
            exactHits: 1,
            goalDiffHits: 0,
            tendencyHits: 0,
            missedTips: 0,
            totalPoints: 3,
            bonusPoints: 0,
            updatedAt: new Date('2026-02-01T13:00:00.000Z'),
            user: { id: 1, username: 'Richi', email: 'r@test.com' },
          },
        ]),
      ),
  };

  const mockPersistingService = {
    currentUser: signal({
      id: 1,
      username: 'Richi',
      email: 'r@test.com',
      role: 'user',
      image: null,
      token: 'token',
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionshipDetailComponent, TranslateModule.forRoot()],
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
            navigate: jasmine.createSpy('navigate'),
            events: of({}),
            createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
            serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/'),
          },
        },
        { provide: ChampionshipService, useValue: mockChampionshipService },
        { provide: RoundService, useValue: mockRoundService },
        { provide: GameService, useValue: mockGameService },
        { provide: TipService, useValue: mockTipService },
        { provide: BonusService, useValue: mockBonusService },
        { provide: RankingService, useValue: mockRankingService },
        { provide: PersistingService, useValue: mockPersistingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChampionshipDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should switch to table view and render ranking table view', () => {
    const tableToggle = fixture.nativeElement.querySelector(
      '[data-testid="view-toggle-table"]',
    ) as HTMLButtonElement;

    expect(tableToggle).toBeTruthy();

    tableToggle.click();
    fixture.detectChanges();

    expect(component.selectedView()).toBe('table');
    expect(
      fixture.nativeElement.querySelector('[data-testid="view-table"]'),
    ).toBeTruthy();
  });

  it('should set mobile view on resize when viewport is below 768px', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);

    component.onWindowResize();

    expect(component.isMobileView()).toBeTrue();
  });
});
