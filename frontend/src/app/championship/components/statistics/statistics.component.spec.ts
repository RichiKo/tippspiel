import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { StatisticsComponent } from './statistics.component';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';

describe('StatisticsComponent', () => {
  let component: StatisticsComponent;
  let fixture: ComponentFixture<StatisticsComponent>;

  const defaultStatistics = {
    championshipId: 'champ-1',
    userId: 1,
    totalMatches: 24,
    playedMatches: 10,
    participatedMatches: 8,
    missedMatches: 2,
    averagePointsPerRound: 4.6,
    pointsByRound: [
      { roundId: 'r-1', roundName: 'Round 1', points: 7 },
      { roundId: 'r-2', roundName: 'Round 2', points: 4 },
      { roundId: 'r-3', roundName: 'Round 3', points: 1 },
    ],
    pointsDistribution: {
      threePoints: { count: 3, ratio: 0.3 },
      twoPoints: { count: 2, ratio: 0.2 },
      onePoint: { count: 1, ratio: 0.1 },
      zeroPoints: { count: 4, ratio: 0.4 },
    },
    bestRound: {
      roundId: 'r-1',
      roundName: 'Round 1',
      points: 7,
    },
    worstRound: {
      roundId: 'r-3',
      roundName: 'Round 3',
      points: 1,
    },
  };

  const defaultRoundStatistics = {
    championshipId: 'champ-1',
    totalMatches: 8,
    playedMatches: 6,
    participantsCount: 12,
    participatedMatches: 58,
    missedMatches: 14,
    averagePointsPerRound: 31,
    averagePointsPerParticipant: 5.2,
    totalPointsAllParticipants: 62,
    pointsByRound: [
      { roundId: 'r-1', roundName: 'Round 1', points: 34 },
      { roundId: 'r-2', roundName: 'Round 2', points: 28 },
    ],
    pointsDistribution: {
      threePoints: { count: 18, ratio: 0.25 },
      twoPoints: { count: 12, ratio: 0.1666666667 },
      onePoint: { count: 10, ratio: 0.1388888889 },
      zeroPoints: { count: 32, ratio: 0.4444444444 },
    },
    bestRound: {
      roundId: 'r-1',
      roundName: 'Round 1',
      points: 34,
    },
    worstRound: {
      roundId: 'r-2',
      roundName: 'Round 2',
      points: 28,
    },
    bestParticipant: {
      userId: 1,
      username: 'Round Pro',
      points: 11,
    },
    worstParticipant: {
      userId: 9,
      username: 'No Luck',
      points: 0,
    },
    mostResultativeGame: {
      gameId: 'game-top',
      roundName: 'Viertelfinale',
      kickoffTime: '2026-02-17T18:15:00.000Z',
      homeTeam: {
        id: 'team-1',
        name: 'Juventus',
        logoUrl: 'https://example.com/juventus.svg',
      },
      awayTeam: {
        id: 'team-2',
        name: 'Inter Milan',
        logoUrl: '',
      },
      homeScore: 1,
      awayScore: 2,
      totalPoints: 17,
      exactHits: 3,
      goalDiffHits: 2,
      tendencyHits: 4,
    },
    participants: [
      {
        place: 1,
        userId: 1,
        username: 'Round Pro',
        totalPoints: 11,
        participatedMatches: 6,
        missedMatches: 0,
        pointsDistribution: {
          threePoints: { count: 3, ratio: 0.5 },
          twoPoints: { count: 1, ratio: 0.1666666667 },
          onePoint: { count: 1, ratio: 0.1666666667 },
          zeroPoints: { count: 1, ratio: 0.1666666667 },
        },
      },
    ],
  };

  const mockChampionshipService = {
    getChampionshipById: jasmine.createSpy('getChampionshipById').and.returnValue(
      of({
        id: 'champ-1',
        name: 'CL 2026',
        description: '',
        image: '',
        isPublic: true,
        isActive: true,
        createdByUserId: '1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        eliminatedTeamIds: [],
      }),
    ),
  };

  const mockRankingService = {
    getMyStatistics: jasmine.createSpy('getMyStatistics'),
    getChampionshipStatistics: jasmine.createSpy('getChampionshipStatistics'),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  beforeEach(async () => {
    mockRankingService.getMyStatistics.and.returnValue(of(defaultStatistics));
    mockRankingService.getChampionshipStatistics.and.returnValue(
      of(defaultRoundStatistics),
    );

    await TestBed.configureTestingModule({
      imports: [StatisticsComponent, TranslateModule.forRoot()],
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
        { provide: ChampionshipService, useValue: mockChampionshipService },
        { provide: RankingService, useValue: mockRankingService },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        championship: {
          statistics: {
            rounds: {
              notAvailable: 'Keine Daten',
            },
            mostResultativeGame: {
              title: 'Meist resultatives Spiel',
              totalPoints: 'Gesamtpunkte',
              exactHits: 'Exakt',
              goalDiffHits: 'Differenz',
              tendencyHits: 'Tendenz',
              empty: 'Noch kein beendetes Spiel vorhanden.',
            },
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render statistics summary values', () => {
    expect(component).toBeTruthy();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('24');
    expect(text).toContain('8');
    expect(text).toContain('2');
    expect(text).toContain('60.0% / 40.0%');
    expect(text).toContain('6 / 4');
    expect(text).toContain('Round 1');
    expect(text).toContain('Round 3');
  });

  it('should show fallback text when best and worst rounds are missing', () => {
    mockRankingService.getMyStatistics.and.returnValue(
      of({
        championshipId: 'champ-1',
        userId: 1,
        totalMatches: 24,
        playedMatches: 10,
        participatedMatches: 8,
        missedMatches: 2,
        averagePointsPerRound: 4.6,
        pointsByRound: [],
        pointsDistribution: {
          threePoints: { count: 3, ratio: 0.3 },
          twoPoints: { count: 2, ratio: 0.2 },
          onePoint: { count: 1, ratio: 0.1 },
          zeroPoints: { count: 4, ratio: 0.4 },
        },
        bestRound: null,
        worstRound: null,
      }),
    );

    const fallbackFixture = TestBed.createComponent(StatisticsComponent);
    fallbackFixture.detectChanges();

    const text = fallbackFixture.nativeElement.textContent as string;
    expect(text).toContain('Keine Daten');
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });

  it('should switch to championship statistics mode and load aggregate data', () => {
    const roundModeButton = fixture.nativeElement.querySelectorAll(
      '.statistics-mode-toggle button',
    )[1] as HTMLButtonElement;

    roundModeButton.click();
    fixture.detectChanges();

    expect(mockRankingService.getChampionshipStatistics).toHaveBeenCalledWith(
      'champ-1',
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('62');
    expect(text).toContain('Round 1');
    expect(text).toContain('Round 2');
  });

  it('should render the most resultative game only in championship mode', () => {
    expect(
      fixture.nativeElement.querySelector('.most-resultative-game-card'),
    ).toBeNull();

    const championshipModeButton = fixture.nativeElement.querySelectorAll(
      '.statistics-mode-toggle button',
    )[1] as HTMLButtonElement;
    championshipModeButton.click();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector(
      '.most-resultative-game-card',
    ) as HTMLElement;
    const text = card.textContent ?? '';

    expect(card).toBeTruthy();
    expect(text).toContain('Meist resultatives Spiel');
    expect(text).toContain('Viertelfinale');
    expect(text).toContain('17.02.2026');
    expect(text).toContain('19:15');
    expect(text).toContain('Juventus');
    expect(text).toContain('Inter Milan');
    expect(text).toContain('1 : 2');
    expect(text).toContain('Gesamtpunkte');
    expect(text).toContain('17');
    expect(text).toContain('Exakt');
    expect(text).toContain('3');
    expect(text).toContain('Differenz');
    expect(text).toContain('2');
    expect(text).toContain('Tendenz');
    expect(text).toContain('4');
    expect(card.querySelectorAll('img').length).toBe(1);
    expect(
      card.querySelector('.resultative-team-fallback')?.textContent,
    ).toContain('IM');
    expect(card.querySelector('.my-tip')).toBeNull();
    expect(card.querySelector('button')).toBeNull();
  });

  it('should render an empty state when no championship game is closed', () => {
    mockRankingService.getChampionshipStatistics.and.returnValue(
      of({
        ...defaultRoundStatistics,
        mostResultativeGame: null,
      }),
    );
    const emptyFixture = TestBed.createComponent(StatisticsComponent);
    emptyFixture.detectChanges();

    const championshipModeButton = emptyFixture.nativeElement.querySelectorAll(
      '.statistics-mode-toggle button',
    )[1] as HTMLButtonElement;
    championshipModeButton.click();
    emptyFixture.detectChanges();

    const card = emptyFixture.nativeElement.querySelector(
      '.most-resultative-game-card',
    ) as HTMLElement;

    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Noch kein beendetes Spiel vorhanden.');
    expect(card.querySelector('.resultative-match')).toBeNull();
  });
});
