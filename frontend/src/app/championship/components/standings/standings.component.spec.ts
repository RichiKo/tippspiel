import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
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
          { key: 'b-1:champion', ruleId: 'b-1', subrule: 'champion', label: 'Meister' },
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
            bonusPointsByColumn: { 'b-1:champion': 1 },
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
            bonusPointsByColumn: { 'b-1:champion': 2 },
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
      imports: [StandingsComponent],
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

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });
});
