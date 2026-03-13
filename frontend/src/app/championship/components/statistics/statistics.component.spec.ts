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
    getMyStatistics: jasmine.createSpy('getMyStatistics').and.returnValue(
      of({
        championshipId: 'champ-1',
        userId: 1,
        totalMatches: 24,
        playedMatches: 10,
        participatedMatches: 8,
        missedMatches: 2,
        averagePointsPerRound: 4.6,
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
      }),
    ),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  beforeEach(async () => {
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
    const currentStats = component.statistics();
    expect(currentStats).toBeTruthy();

    component.statistics.set({
      ...currentStats!,
      bestRound: null,
      worstRound: null,
    });
    fixture.detectChanges();

    const emptyBlocks = fixture.nativeElement.querySelectorAll('.round-empty');
    expect(emptyBlocks.length).toBe(2);
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });
});
