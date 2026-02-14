import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { RankingComponent } from './ranking.component';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { GameService } from '../../services/game.service';
import { PersistingService } from '../../../auth/services/persisisting.service';

describe('RankingComponent', () => {
  let component: RankingComponent;
  let fixture: ComponentFixture<RankingComponent>;

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
        eliminatedTeamIds: [],
      }),
    ),
  };

  const mockRankingService = {
    getRankingByChampionship: jasmine.createSpy('getRankingByChampionship').and.returnValue(
      of([
        {
          id: 'rank-2',
          championshipId: 'champ-1',
          userId: 2,
          rank: 2,
          exactHits: 1,
          goalDiffHits: 1,
          tendencyHits: 0,
          missedTips: 2,
          totalPoints: 5,
          bonusPoints: 0,
          updatedAt: new Date('2026-02-01T13:00:00.000Z'),
          user: { id: 2, username: 'Alice', email: 'alice@test.com' },
        },
        {
          id: 'rank-1',
          championshipId: 'champ-1',
          userId: 1,
          rank: 1,
          exactHits: 2,
          goalDiffHits: 1,
          tendencyHits: 1,
          missedTips: 0,
          totalPoints: 10,
          bonusPoints: 1,
          updatedAt: new Date('2026-02-01T13:00:00.000Z'),
          user: { id: 1, username: 'Richi', email: 'richi@test.com' },
        },
      ]),
    ),
  };

  const mockGameService = {
    getGamesByChampionship: jasmine.createSpy('getGamesByChampionship').and.returnValue(
      of([
        { id: 'g1', isClosed: true },
        { id: 'g2', isClosed: true },
        { id: 'g3', isClosed: false },
      ]),
    ),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  const mockPersistingService = {
    currentUser: signal({
      id: 1,
      username: 'Richi',
      email: 'richi@test.com',
      role: 'user',
      image: null,
      token: 'token',
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingComponent, TranslateModule.forRoot()],
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
        { provide: GameService, useValue: mockGameService },
        { provide: PersistingService, useValue: mockPersistingService },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        championship: {
          ranking: {
            gamesInfo: '{{closed}} von {{total}} Spielen ausgewertet',
            you: 'Du',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(RankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render migrated ui with page header and games info', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();

    const gamesInfo = fixture.nativeElement.querySelector('[data-testid="games-info"]') as HTMLElement;
    expect(gamesInfo.textContent).toContain('2 von 3 Spielen ausgewertet');
  });

  it('should keep current user row first and mark it', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const firstRow = rows[0] as HTMLElement;
    expect(firstRow.classList.contains('current-user')).toBeTrue();

    const firstRowText = firstRow.textContent ?? '';
    expect(firstRowText).toContain('Richi');
    expect(firstRowText).toContain('Du');
  });

  it('should not render bonus and total columns', () => {
    const headerText = (
      fixture.nativeElement.querySelector('thead') as HTMLElement
    ).textContent;

    expect(headerText).not.toContain('Bonus');
    expect(headerText).not.toContain('Gesamt');
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });
});
