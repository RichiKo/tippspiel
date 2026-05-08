import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { StandingsComponent } from './standings.component';
import { ChampionshipService } from '../../../dashboard/services/championship.service';
import { RankingService } from '../../services/ranking.service';
import { PersistingService } from '../../../auth/services/persisisting.service';

describe('StandingsComponent', () => {
  let component: StandingsComponent;
  let fixture: ComponentFixture<StandingsComponent>;

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
    getStandings: jasmine.createSpy('getStandings').and.returnValue(
      of({
        evaluatedBonusRules: [{ id: 'b-1', name: 'Meister' }],
        bonusColumns: [
          {
            key: 'b-1:finalist',
            ruleId: 'b-1',
            subrule: 'finalist',
            label: 'Meister (Finalist)',
          },
          {
            key: 'b-1:champion',
            ruleId: 'b-1',
            subrule: 'champion',
            label: 'Meister (Champion)',
          },
        ],
        standings: [
          {
            id: 's-2',
            userId: 2,
            championshipId: 'champ-1',
            rank: 2,
            exactHits: 1,
            goalDiffHits: 1,
            tendencyHits: 2,
            missedTips: 1,
            totalPoints: 6,
            gamePoints: 5,
            bonusPoints: 1,
            bonusPointsByRule: { 'b-1': 1 },
            bonusPointsByColumn: { 'b-1:finalist': 0, 'b-1:champion': 1 },
            updatedAt: new Date('2026-02-01T13:00:00.000Z'),
            user: { id: 2, username: 'Alice', email: 'alice@test.com' },
          },
          {
            id: 's-1',
            userId: 1,
            championshipId: 'champ-1',
            rank: 1,
            exactHits: 2,
            goalDiffHits: 1,
            tendencyHits: 2,
            missedTips: 0,
            totalPoints: 10,
            gamePoints: 8,
            bonusPoints: 2,
            bonusPointsByRule: { 'b-1': 2 },
            bonusPointsByColumn: { 'b-1:finalist': 1, 'b-1:champion': 2 },
            updatedAt: new Date('2026-02-01T13:00:00.000Z'),
            user: { id: 1, username: 'Richi', email: 'richi@test.com' },
          },
        ],
      }),
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
      imports: [StandingsComponent, TranslateModule.forRoot()],
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
        { provide: PersistingService, useValue: mockPersistingService },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        championship: {
          standings: {
            headers: {
              total: 'Gesamt',
              gamePoints: 'Punkte (Spiele)',
            },
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(StandingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render migrated standings header and table', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.standings-table')).toBeTruthy();
  });

  it('should keep current user highlighted and show total column', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const firstRow = rows[0] as HTMLElement;
    expect(firstRow.classList.contains('current-user')).toBeTrue();
    expect(firstRow.textContent).toContain('Richi');

    const headerCells = fixture.nativeElement.querySelectorAll('thead th');
    const headerText = Array.from(headerCells)
      .map((cell) => (cell as HTMLElement).textContent ?? '')
      .join(' ');
    expect(headerText).toContain('Gesamt');
  });

  it('should render bonus standings inside a horizontal scroll region', () => {
    const tableWrapper = fixture.nativeElement.querySelector(
      '.standings-table-wrapper',
    ) as HTMLElement;
    const table = fixture.nativeElement.querySelector(
      '.standings-table',
    ) as HTMLTableElement;

    expect(tableWrapper.classList).toContain(
      'standings-table-wrapper--scrollable',
    );
    expect(tableWrapper.getAttribute('tabindex')).toBe('0');
    expect(table.classList).toContain('standings-table--with-bonus');
  });

  it('should render champion finalist bonus column labels with compact subrule suffixes', () => {
    const bonusHeaders = fixture.nativeElement.querySelectorAll(
      'th.bonus-col',
    ) as NodeListOf<HTMLTableCellElement>;

    expect(bonusHeaders[0].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Meister (FN)',
    );
    expect(bonusHeaders[0].getAttribute('title')).toBe('Meister (Finalist)');
    expect(bonusHeaders[1].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Meister (CH)',
    );
    expect(bonusHeaders[1].getAttribute('title')).toBe('Meister (Champion)');
  });

  it('should render champion finalist suffixes as separate header lines', () => {
    const bonusHeaders = fixture.nativeElement.querySelectorAll(
      'th.bonus-col',
    ) as NodeListOf<HTMLTableCellElement>;

    expect(
      bonusHeaders[0].querySelector('.standings-header-label__suffix')
        ?.textContent?.trim(),
    ).toBe('(FN)');
    expect(
      bonusHeaders[1].querySelector('.standings-header-label__suffix')
        ?.textContent?.trim(),
    ).toBe('(CH)');
  });

  it('should render the game points column label without bracketed suffixes', () => {
    const pointsHeader = fixture.nativeElement.querySelector(
      'th.points-col',
    ) as HTMLTableCellElement;

    expect(pointsHeader.textContent?.trim()).toBe('Punkte');
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });

});
