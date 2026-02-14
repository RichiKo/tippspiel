import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { TeamCardComponent } from './team-card.component';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { TeamService } from '../../services/team.service';
import { UploadService } from '../../../shared/services/upload.service';

describe('TeamCardComponent', () => {
  let component: TeamCardComponent;
  let fixture: ComponentFixture<TeamCardComponent>;

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

  const mockTeamService = {
    updateTeam: jasmine.createSpy('updateTeam').and.returnValue(of(void 0)),
  };

  const mockUploadService = {
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(
      of({ url: 'https://example.com/uploaded.png' }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamCardComponent, TranslateModule.forRoot()],
      providers: [
        { provide: PersistingService, useValue: mockPersistingService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('team', {
      id: 'team-1',
      name: 'Arsenal FC',
      shortName: 'ARS',
      logoUrl: 'https://example.com/arsenal.png',
      origin: 'ENGLAND',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    fixture.detectChanges();
  });

  it('should render team card with admin actions', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.team-card')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Arsenal FC');

    const actionButtons = fixture.nativeElement.querySelectorAll('.team-actions ui-button');
    expect(actionButtons.length).toBe(2);
  });

  it('should emit delete event after confirmation', () => {
    const deleteSpy = jasmine.createSpy('deleteSpy');
    component.deleteClicked.subscribe(deleteSpy);

    component.onDeleteClick();
    fixture.detectChanges();

    component.handleDeleteConfirm();

    expect(deleteSpy).toHaveBeenCalledWith('team-1');
  });
});
