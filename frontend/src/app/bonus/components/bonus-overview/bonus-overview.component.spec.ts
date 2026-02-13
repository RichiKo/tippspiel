import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BonusOverviewComponent } from './bonus-overview.component';
import { BonusService } from '../../services/bonus.service';
import { ChampionshipService } from '../../../dashboard/services/championship.service';

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
    getBonusRules: jasmine.createSpy('getBonusRules').and.returnValue(
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
      ]),
    ),
    getAllPicksUser: jasmine.createSpy('getAllPicksUser').and.returnValue(
      of([
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
            image: 'https://example.com/user.png',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    ),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusOverviewComponent],
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BonusOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render migrated bonus overview with ui page header', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.bonus-overview-table')).toBeTruthy();
  });

  it('should show eliminated picks in badge and table state', () => {
    const eliminatedCountBadge = fixture.nativeElement.querySelector(
      '[data-testid="eliminated-count-badge"]',
    ) as HTMLElement;

    expect(eliminatedCountBadge.textContent).toContain('1 eliminiert');

    const eliminatedCell = fixture.nativeElement.querySelector(
      '.pick-cell.eliminated-pick',
    ) as HTMLElement;
    expect(eliminatedCell).toBeTruthy();
    expect(eliminatedCell.textContent).toContain('Eliminiert');
  });

  it('should navigate back when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/championship', 'champ-1']);
  });
});
