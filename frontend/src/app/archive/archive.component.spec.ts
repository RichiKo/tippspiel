import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { firstValueFrom, of } from 'rxjs';
import { ArchiveComponent } from './archive.component';
import { ArchiveService } from './services/archive.service';
import { PersistingService } from '../auth/services/persisisting.service';

describe('ArchiveComponent', () => {
  let fixture: ComponentFixture<ArchiveComponent>;
  const avatarDataUrl =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  const archiveService = {
    getArchiveEntries: jasmine.createSpy('getArchiveEntries').and.returnValue(
      of([
        {
          id: 'archive-1',
          championshipName: 'WM Tipps 2026',
          year: 2026,
          firstPlaceUserId: 1,
          firstPlaceManualName: null,
          firstPlaceDisplayName: 'Anna',
          firstPlacePoints: 22541,
          firstPlaceUser: {
            id: 1,
            username: 'Anna',
            image: null,
          },
          secondPlaceUserId: null,
          secondPlaceManualName: 'Gastspieler',
          secondPlaceDisplayName: 'Gastspieler',
          secondPlacePoints: 18698,
          thirdPlaceUserId: 2,
          thirdPlaceManualName: null,
          thirdPlaceDisplayName: 'Ben',
          thirdPlacePoints: 12256,
          thirdPlaceUser: {
            id: 2,
            username: 'Ben',
            image: null,
          },
          createdAt: '2026-05-13T10:00:00.000Z',
          updatedAt: '2026-05-13T10:00:00.000Z',
        },
      ]),
    ),
    getArchiveUserOptions: jasmine
      .createSpy('getArchiveUserOptions')
      .and.returnValue(of([{ id: 1, username: 'Anna', image: avatarDataUrl }])),
    createArchiveEntry: jasmine.createSpy('createArchiveEntry'),
    updateArchiveEntry: jasmine.createSpy('updateArchiveEntry'),
    deleteArchiveEntry: jasmine.createSpy('deleteArchiveEntry'),
  };

  const persistingService = {
    currentUser: signal({
      id: 1,
      username: 'Admin',
      email: 'admin@test.de',
      role: 'admin',
      image: null as string | null,
      token: 'token',
    }),
  };

  const navigateSpy = jasmine.createSpy('navigate');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ArchiveComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        provideNoopAnimations(),
        { provide: ArchiveService, useValue: archiveService },
        { provide: PersistingService, useValue: persistingService },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        archive: {
          page: {
            title: 'Archive',
            subtitle: 'Sieger vergangener Championships',
            back: 'Zurueck zum Dashboard',
          },
          actions: {
            create: 'Archive-Eintrag erstellen',
            edit: 'Bearbeiten',
            delete: 'Loeschen',
          },
          places: {
            first: 'Platz 1',
            second: 'Platz 2',
            third: 'Platz 3',
          },
          states: {
            loading: 'Lade Archive...',
            empty: 'Noch keine Archive-Eintraege vorhanden.',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(ArchiveComponent);
    fixture.detectChanges();
  });

  it('renders archive cards with winners', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('WM Tipps 2026');
    expect(text).toContain('2026');
    expect(text).toContain('Anna');
    expect(text).toContain('Gastspieler');
    expect(text).toContain('Ben');
    expect(text).toContain('22541');
    expect(text).toContain('18698');
    expect(text).toContain('12256');
  });

  it('shows admin create action', () => {
    expect(
      fixture.nativeElement.querySelector('[data-testid="archive-create-button"]'),
    ).toBeTruthy();
  });

  it('renders avatars for registered winners and falls back to archive user options', () => {
    const firstAvatar = fixture.nativeElement.querySelector(
      '[data-testid="archive-firstPlace-avatar"] img',
    ) as HTMLImageElement;
    const thirdAvatar = fixture.nativeElement.querySelector(
      '[data-testid="archive-thirdPlace-avatar"]',
    ) as HTMLElement;
    const manualAvatar = fixture.nativeElement.querySelector(
      '[data-testid="archive-secondPlace-avatar"]',
    ) as HTMLElement;

    expect(firstAvatar).toBeTruthy();
    expect(firstAvatar.getAttribute('src')).toBe(avatarDataUrl);
    expect(thirdAvatar.textContent?.trim()).toBe('B');
    expect(manualAvatar.textContent?.trim()).toBe('G');
  });

  it('uses the current user avatar when archive relations do not include an image', () => {
    fixture.componentInstance.userOptions.set([]);
    persistingService.currentUser.set({
      id: 1,
      username: 'Anna',
      email: 'anna@test.de',
      role: 'admin',
      image: avatarDataUrl,
      token: 'token',
    });
    fixture.detectChanges();

    const firstAvatar = fixture.nativeElement.querySelector(
      '[data-testid="archive-firstPlace-avatar"] img',
    ) as HTMLImageElement;

    expect(firstAvatar).toBeTruthy();
    expect(firstAvatar.getAttribute('src')).toBe(avatarDataUrl);
  });

  it('shows linked registered user names instead of stale display snapshots', () => {
    fixture.componentInstance.entries.set([
      {
        id: 'archive-2',
        championshipName: 'EM Tipps 2024',
        year: 2024,
        firstPlaceUserId: 23,
        firstPlaceManualName: null,
        firstPlaceDisplayName: 'Erik',
        firstPlacePoints: 10,
        firstPlaceUser: {
          id: 23,
          username: 'Dima',
          image: null,
        },
        secondPlaceUserId: 25,
        secondPlaceManualName: null,
        secondPlaceDisplayName: 'Richi',
        secondPlacePoints: 8,
        secondPlaceUser: {
          id: 25,
          username: 'Jenya',
          image: null,
        },
        thirdPlaceUserId: null,
        thirdPlaceManualName: 'Max',
        thirdPlaceDisplayName: 'Max',
        thirdPlacePoints: 6,
        thirdPlaceUser: null,
        createdAt: '2026-05-13T10:00:00.000Z',
        updatedAt: '2026-05-13T10:00:00.000Z',
      },
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Dima');
    expect(text).toContain('Jenya');
    expect(text).toContain('Max');
    expect(text).not.toContain('Erik');
    expect(text).not.toContain('Richi');
  });
});
