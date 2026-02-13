import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TeamsComponent } from './teams.component';
import { TeamService } from './services/team.service';
import { PersistingService } from '../auth/services/persisisting.service';
import { UploadService } from '../shared/services/upload.service';

describe('TeamsComponent', () => {
  let component: TeamsComponent;
  let fixture: ComponentFixture<TeamsComponent>;

  const mockTeamService = {
    getAllTeams: jasmine.createSpy('getAllTeams').and.returnValue(
      of([
        {
          id: 'team-1',
          name: 'Arsenal FC',
          shortName: 'ARS',
          logoUrl: 'https://example.com/arsenal.png',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]),
    ),
    createTeam: jasmine.createSpy('createTeam').and.returnValue(of(void 0)),
    updateTeam: jasmine.createSpy('updateTeam').and.returnValue(of(void 0)),
    deleteTeam: jasmine.createSpy('deleteTeam').and.returnValue(of(void 0)),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  const mockPersistingService = {
    currentUser: signal({
      id: 1,
      username: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      image: null,
      token: 'token',
    }),
  };

  const mockUploadService = {
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(
      of({ url: 'https://example.com/uploaded.png' }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamsComponent],
      providers: [
        { provide: TeamService, useValue: mockTeamService },
        { provide: PersistingService, useValue: mockPersistingService },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render migrated teams header and table', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.teams-table')).toBeTruthy();
  });

  it('should navigate back to dashboard when header back button is clicked', () => {
    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
