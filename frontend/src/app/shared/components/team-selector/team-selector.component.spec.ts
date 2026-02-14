import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { TeamSelectorComponent } from './team-selector.component';
import { TeamService } from '../../../teams/services/team.service';
import { TeamOrigin } from '../../../teams/types/team.interface';

describe('TeamSelectorComponent', () => {
  let component: TeamSelectorComponent;
  let fixture: ComponentFixture<TeamSelectorComponent>;

  const allTeams = [
    {
      id: 'team-1',
      name: 'Arsenal FC',
      shortName: 'ARS',
      logoUrl: 'https://example.com/ars.png',
      origin: TeamOrigin.ENGLAND,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 'team-2',
      name: 'Bayern',
      shortName: 'FCB',
      logoUrl: 'https://example.com/fcb.png',
      origin: TeamOrigin.GERMANY,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    },
  ];

  const mockTeamService = {
    getAllTeams: jasmine.createSpy('getAllTeams').and.callFake((origin?: TeamOrigin) => {
      if (!origin) {
        return of(allTeams);
      }

      return of(allTeams.filter((team) => team.origin === origin));
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamSelectorComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: TeamService, useValue: mockTeamService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamSelectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedTeamIds', []);
    fixture.detectChanges();
  });

  it('should use ENGLAND as default API filter for available teams', () => {
    expect(mockTeamService.getAllTeams).toHaveBeenCalledWith();
    expect(mockTeamService.getAllTeams).toHaveBeenCalledWith(TeamOrigin.ENGLAND);

    expect(component.availableTeams().length).toBe(1);
    expect(component.availableTeams()[0].shortName).toBe('ARS');
  });

  it('should reload teams when origin filter changes', () => {
    component.onOriginChange(TeamOrigin.GERMANY);
    fixture.detectChanges();

    expect(mockTeamService.getAllTeams).toHaveBeenCalledWith(TeamOrigin.GERMANY);
    expect(component.availableTeams().length).toBe(1);
    expect(component.availableTeams()[0].shortName).toBe('FCB');
  });
});
