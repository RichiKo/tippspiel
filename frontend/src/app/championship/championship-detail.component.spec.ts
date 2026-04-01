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
import { Round } from './types/round.interface';
import { TeamOrigin } from '../teams/types/team.interface';

describe('ChampionshipDetailComponent', () => {
  let component: ChampionshipDetailComponent;
  let fixture: ComponentFixture<ChampionshipDetailComponent>;

  const createRound = (
    id: string,
    startDate: string,
    endDate: string | null,
    createdAt = '2026-01-01T00:00:00.000Z',
  ): Round => ({
    id,
    name: `Runde ${id}`,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    championshipId: 'champ-1',
    createdAt: new Date(createdAt),
  });

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

  const defaultRounds: Round[] = [
    {
      id: 'r1',
      name: 'Runde 1',
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-02-03T00:00:00.000Z'),
      championshipId: 'champ-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ];

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
          roundPredictionProgress: [
            {
              roundId: 'r1',
              roundName: 'Runde 1',
              isRoundActive: true,
              totalUsers: 20,
              totalMatchesInRound: 3,
              totalPossiblePredictions: 60,
              submittedPredictions: 9,
              progressPercent: 15,
            },
          ],
        }),
      ),
    getChampionshipTeams: jasmine
      .createSpy('getChampionshipTeams')
      .and.returnValue(of([])),
  };

  const mockRoundService = {
    getRoundsByChampionship: jasmine
      .createSpy('getRoundsByChampionship')
      .and.returnValue(of(defaultRounds)),
    createRound: jasmine.createSpy('createRound').and.returnValue(of()),
    updateRound: jasmine
      .createSpy('updateRound')
      .and.callFake((id: string, dto: { name: string; startDate: Date; endDate?: Date }) =>
        of({
          id,
          name: dto.name,
          startDate: dto.startDate,
          endDate: dto.endDate ?? null,
          championshipId: 'champ-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
    deleteRound: jasmine.createSpy('deleteRound').and.returnValue(of(void 0)),
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
      .and.callFake((gameId: string) =>
        of(
          gameId === 'g2'
            ? [
                {
                  gameId: 'g2',
                  championshipId: 'champ-1',
                  userId: 2,
                  homeTeamGoals: null,
                  awayTeamGoals: null,
                  points: 0,
                  outcomeType: 'notTipped',
                  user: { id: 2, username: 'Ivan', email: 'i@test.com' },
                },
              ]
            : [
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
              ],
        ),
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
    mockRoundService.getRoundsByChampionship.and.returnValue(of(defaultRounds));

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

  it('should scroll to top on component init', () => {
    const scrollSpy = spyOn(window, 'scrollTo');

    const initFixture = TestBed.createComponent(ChampionshipDetailComponent);
    initFixture.detectChanges();

    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });

  it('should add mobile back-row offset class when round drawer fab is visible', () => {
    component.isMobileView.set(true);
    component.rounds.set([
      createRound('r-mobile', '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
    ]);
    fixture.detectChanges();

    const backRow = fixture.nativeElement.querySelector('.detail-back-row') as HTMLElement;

    expect(backRow.classList.contains('detail-back-row--mobile-offset')).toBeTrue();
  });

  it('should keep notTipped tips in started games map', () => {
    const startedGameTips = component.gameTips().get('g2') ?? [];

    expect(mockTipService.getTipsForGame).toHaveBeenCalledWith('g2');
    expect(startedGameTips.some((tip) => tip.outcomeType === 'notTipped')).toBeTrue();
  });

  it('should show open games tip progress in section header', () => {
    const progressBadge = fixture.nativeElement.querySelector(
      '.open-games-progress',
    ) as HTMLElement | null;

    expect(progressBadge).toBeTruthy();
    expect(progressBadge?.textContent?.replace(/\s+/g, ' ').trim()).toContain('0/1');

    component.userTips.set(
      new Map([
        [
          'g2',
          {
            gameId: 'g2',
            championshipId: 'champ-1',
            userId: 1,
            homeTeamGoals: 1,
            awayTeamGoals: 0,
            points: null,
            outcomeType: null,
          },
        ],
      ]),
    );
    fixture.detectChanges();

    const updatedProgressBadge = fixture.nativeElement.querySelector(
      '.open-games-progress',
    ) as HTMLElement | null;
    expect(updatedProgressBadge?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      '1/1',
    );
  });

  it('should show finished games progress in section header', () => {
    const progressBadge = fixture.nativeElement.querySelector(
      '.finished-games-progress',
    ) as HTMLElement | null;

    expect(progressBadge).toBeTruthy();
    expect(progressBadge?.textContent?.replace(/\s+/g, ' ').trim()).toContain('1/2');
  });

  it('should show active tour prediction progress when selected round is active', () => {
    const progressBlock = fixture.nativeElement.querySelector(
      '[data-testid="active-tour-progress"]',
    ) as HTMLElement | null;
    const progressTrack = fixture.nativeElement.querySelector(
      '.active-tour-progress__track',
    ) as HTMLElement | null;
    const progressFill = fixture.nativeElement.querySelector(
      '.active-tour-progress__fill',
    ) as HTMLElement | null;

    expect(progressBlock).toBeTruthy();
    expect(progressBlock?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      '15%',
    );
    expect(component.selectedRoundPredictionProgress()?.submittedPredictions).toBe(9);
    expect(component.selectedRoundPredictionProgress()?.totalPossiblePredictions).toBe(
      60,
    );
    expect(progressTrack?.getAttribute('aria-valuenow')).toBe('15');
    expect(progressFill?.style.width).toContain('15%');
  });

  it('should show tour prediction progress when selected round is not active', () => {
    const currentChampionship = component.championship();
    expect(currentChampionship).toBeTruthy();

    component.championship.set({
      ...currentChampionship!,
      roundPredictionProgress: [
        {
          roundId: 'r1',
          roundName: 'Runde 1',
          isRoundActive: false,
          totalUsers: 20,
          totalMatchesInRound: 3,
          totalPossiblePredictions: 60,
          submittedPredictions: 9,
          progressPercent: 15,
        },
      ],
    });
    fixture.detectChanges();

    const progressBlock = fixture.nativeElement.querySelector(
      '[data-testid="active-tour-progress"]',
    ) as HTMLElement | null;

    expect(progressBlock).toBeTruthy();
    expect(progressBlock?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      '15%',
    );
  });

  it('should render tour prediction progress inside mobile active tour block', () => {
    component.isMobileView.set(true);
    fixture.detectChanges();

    const mobileSwitcher = fixture.nativeElement.querySelector(
      '.mobile-round-switcher',
    ) as HTMLElement | null;
    const progressInMobile = mobileSwitcher?.querySelector(
      '[data-testid="active-tour-progress"]',
    ) as HTMLElement | null;

    expect(mobileSwitcher).toBeTruthy();
    expect(progressInMobile).toBeTruthy();
  });

  it('should pick active round initially when today is inside round range', () => {
    const rounds = [
      createRound('r4', '2026-02-21T00:00:00.000Z', '2026-02-22T00:00:00.000Z'),
      createRound('r1', '2026-02-04T00:00:00.000Z', '2026-02-04T00:00:00.000Z'),
      createRound('r3', '2026-02-16T00:00:00.000Z', '2026-02-20T00:00:00.000Z'),
      createRound('r2', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-02-18T10:30:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('r3');
  });

  it('should pick next upcoming round when no active round exists', () => {
    const rounds = [
      createRound('r1', '2026-02-04T00:00:00.000Z', '2026-02-04T00:00:00.000Z'),
      createRound('r3', '2026-02-16T00:00:00.000Z', '2026-02-20T00:00:00.000Z'),
      createRound('r4', '2026-02-21T00:00:00.000Z', '2026-02-22T00:00:00.000Z'),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-02-10T08:00:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('r3');
  });

  it('should pick latest past round when no active and no upcoming round exists', () => {
    const rounds = [
      createRound('r1', '2026-02-04T00:00:00.000Z', '2026-02-04T00:00:00.000Z'),
      createRound('r2', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'),
      createRound('r3', '2026-02-16T00:00:00.000Z', '2026-02-20T00:00:00.000Z'),
      createRound('r4', '2026-02-21T00:00:00.000Z', '2026-02-22T00:00:00.000Z'),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-03-01T12:00:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('r4');
  });

  it('should treat round without endDate as one-day active round', () => {
    const rounds = [
      createRound('r1', '2026-02-12T00:00:00.000Z', null),
      createRound('r2', '2026-02-14T00:00:00.000Z', '2026-02-15T00:00:00.000Z'),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-02-12T19:15:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('r1');
  });

  it('should pick deterministic round for overlapping active rounds', () => {
    const rounds = [
      createRound('rA', '2026-02-16T00:00:00.000Z', '2026-02-20T00:00:00.000Z'),
      createRound('rB', '2026-02-17T00:00:00.000Z', '2026-02-18T00:00:00.000Z'),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-02-18T09:00:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('rB');
  });

  it('should keep deterministic tiebreaker by createdAt for identical active ranges', () => {
    const rounds = [
      createRound(
        'rOld',
        '2026-02-16T00:00:00.000Z',
        '2026-02-20T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ),
      createRound(
        'rNew',
        '2026-02-16T00:00:00.000Z',
        '2026-02-20T00:00:00.000Z',
        '2026-01-05T00:00:00.000Z',
      ),
    ];

    const picked = (component as any).pickInitialRound(
      rounds,
      new Date('2026-02-17T11:00:00.000Z'),
    ) as Round | null;

    expect(picked?.id).toBe('rNew');
  });

  it('should clear selection and dependent state when rounds list is empty', () => {
    mockRoundService.getRoundsByChampionship.and.returnValue(of([]));
    component.selectedRound.set(
      createRound('existing', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'),
    );
    component.games.set([closedGame]);
    component.userTips.set(
      new Map([
        [
          'g1',
          {
            gameId: 'g1',
            championshipId: 'champ-1',
            userId: 1,
            homeTeamGoals: 2,
            awayTeamGoals: 1,
            points: 3,
            outcomeType: 'exact',
          },
        ],
      ]),
    );
    component.gameTips.set(new Map([['g1', []]]));

    (component as any).loadRounds();

    expect(component.selectedRound()).toBeNull();
    expect(component.games().length).toBe(0);
    expect(component.userTips().size).toBe(0);
    expect(component.gameTips().size).toBe(0);
    expect(component.isLoading()).toBeFalse();
  });

  it('should hydrate created game with team data when backend returns only team ids', () => {
    const kickoffTime = new Date('2026-02-03T12:00:00.000Z');
    const createdGame: Game = {
      id: 'g3',
      homeTeamId: 'h3',
      awayTeamId: 'a3',
      kickoffTime,
      roundId: 'r1',
      homeScore: null,
      awayScore: null,
      isClosed: false,
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    };

    mockGameService.createGame.and.returnValue(of(createdGame));
    component.teams.set([
      {
        id: 'h3',
        name: 'Arsenal',
        shortName: 'ARS',
        logoUrl: 'arsenal.png',
        origin: TeamOrigin.ENGLAND,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'a3',
        name: 'Barcelona',
        shortName: 'BAR',
        logoUrl: 'barcelona.png',
        origin: TeamOrigin.SPAIN,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    component.onGameDialogConfirmed({
      homeTeamId: 'h3',
      awayTeamId: 'a3',
      kickoffTime,
    });

    const addedGame = component.games().find((game) => game.id === 'g3');
    expect(addedGame?.homeTeam?.name).toBe('Arsenal');
    expect(addedGame?.awayTeam?.name).toBe('Barcelona');
  });

  it('should not open round edit dialog for non-admin', () => {
    mockPersistingService.currentUser.set({
      ...mockPersistingService.currentUser(),
      role: 'user',
    });

    component.onEditRound();

    expect(component.showRoundDialog()).toBeFalse();
    expect(component.roundInDialog()).toBeNull();
  });

  it('should update selected round from round dialog confirmation in edit mode', () => {
    mockPersistingService.currentUser.set({
      ...mockPersistingService.currentUser(),
      role: 'admin',
    });

    const selected = component.selectedRound();
    expect(selected).toBeTruthy();

    component.onEditRound();
    component.onRoundDialogConfirmed({
      name: 'Runde 1 korrigiert',
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-02-04T00:00:00.000Z'),
    });

    expect(mockRoundService.updateRound).toHaveBeenCalled();
    expect(component.selectedRound()?.name).toBe('Runde 1 korrigiert');
    expect(component.showRoundDialog()).toBeFalse();
  });

  it('should delete selected round from round dialog and clear games', () => {
    mockPersistingService.currentUser.set({
      ...mockPersistingService.currentUser(),
      role: 'admin',
    });

    component.onEditRound();
    component.onRoundDialogDeleted();

    expect(mockRoundService.deleteRound).toHaveBeenCalled();
    expect(component.rounds().length).toBe(0);
    expect(component.selectedRound()).toBeNull();
    expect(component.games().length).toBe(0);
  });

  it('should blur focused drawer element before closing round drawer', () => {
    component.isMobileView.set(true);
    component.rounds.set([
      createRound('r-mobile', '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z'),
    ]);
    fixture.detectChanges();

    component.openRoundDrawer();
    fixture.detectChanges();

    const drawerItem = fixture.nativeElement.querySelector(
      '.round-drawer-item',
    ) as HTMLButtonElement;
    const blurSpy = spyOn(drawerItem, 'blur').and.callThrough();

    drawerItem.focus();
    component.closeRoundDrawer();

    expect(blurSpy).toHaveBeenCalled();
  });
});
