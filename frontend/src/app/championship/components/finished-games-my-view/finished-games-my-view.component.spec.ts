import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { MyFinishedEntry } from '../../utils/spieltag-views.util';
import { Tip } from '../../types/tip.interface';
import { FinishedGamesMyViewComponent } from './finished-games-my-view.component';

describe('FinishedGamesMyViewComponent', () => {
  let fixture: ComponentFixture<FinishedGamesMyViewComponent>;

  const kickoffA = new Date('2026-02-17T18:45:00.000Z');
  const kickoffB = new Date('2026-02-17T21:00:00.000Z');
  const kickoffC = new Date('2026-02-18T18:00:00.000Z');

  function createEntry(overrides: Partial<MyFinishedEntry>): MyFinishedEntry {
    return {
      gameId: 'game-1',
      kickoffTime: kickoffA,
      homeTeamName: 'Galatasaray',
      awayTeamName: 'Juventus',
      homeTeamLogoUrl: 'https://example.com/galatasaray.png',
      awayTeamLogoUrl: 'https://example.com/juventus.png',
      finalScore: '5 : 2',
      userTip: '1 : 1',
      points: 0,
      ...overrides,
    };
  }

  function createTip(
    gameId: string,
    userId: number,
    username: string,
  ): Tip {
    return {
      id: `${gameId}-${userId}`,
      gameId,
      championshipId: 'champ-1',
      userId,
      homeTeamGoals: userId,
      awayTeamGoals: 0,
      points: userId === 1 ? 3 : 0,
      outcomeType: userId === 1 ? 'exact' : 'missed',
      user: { id: userId, username, email: `${username}@test.com` },
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinishedGamesMyViewComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'de',
      {
        championship: {
          finishedMy: {
            kickoffLabel: 'Anstoss',
            finalScore: 'Endstand',
            yourTip: 'Dein Tipp',
            tipPrefix: 'Tipp',
            points: 'Punkte',
            pointsShort: 'P',
            showParticipantTips: 'Tipps der Teilnehmer anzeigen',
            hideParticipantTips: 'Tipps der Teilnehmer ausblenden',
            participantTipsUnavailable: 'Keine Teilnehmer-Tipps verfügbar',
            empty: 'Noch keine gewerteten Spiele.',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(FinishedGamesMyViewComponent);
  });

  it('groups entries by calendar day and sorts matches by kickoff time', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-a-1', kickoffTime: kickoffA }),
      createEntry({ gameId: 'g-b-1', kickoffTime: kickoffB, awayTeamName: 'Inter' }),
      createEntry({ gameId: 'g-c-1', kickoffTime: kickoffC, awayTeamName: 'PSG' }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const dayGroups = fixture.nativeElement.querySelectorAll('.my-day-group');
    const firstDayMatches =
      dayGroups.item(0)?.querySelectorAll('.my-item-row') ?? [];
    const secondDayMatches =
      dayGroups.item(1)?.querySelectorAll('.my-item-row') ?? [];

    expect(dayGroups.length).toBe(2);
    expect(firstDayMatches.length).toBe(2);
    expect(secondDayMatches.length).toBe(1);
    expect(
      Array.from(firstDayMatches).map((match) =>
        (match as HTMLElement).getAttribute('data-game-id'),
      ),
    ).toEqual(['g-a-1', 'g-b-1']);
  });

  it('renders one date heading and a time header with a disabled tips button per match', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-a-1', kickoffTime: kickoffA }),
      createEntry({ gameId: 'g-b-1', kickoffTime: kickoffB }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const dateHeadings = fixture.nativeElement.querySelectorAll('.my-day-heading');
    const kickoffTimes = Array.from(
      fixture.nativeElement.querySelectorAll('.my-kickoff-time'),
    ) as HTMLElement[];
    const toggleButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.my-tips-toggle'),
    ) as HTMLButtonElement[];

    expect(dateHeadings.length).toBe(1);
    expect(dateHeadings.item(0)?.textContent ?? '').not.toContain('19:45');
    expect(kickoffTimes.map((item) => item.textContent?.trim())).toEqual([
      '19:45',
      '22:00',
    ]);
    expect(toggleButtons.length).toBe(2);
    expect(toggleButtons.every((button) => button.disabled)).toBeTrue();
    expect(toggleButtons.at(0)?.getAttribute('aria-label')).toBe(
      'Keine Teilnehmer-Tipps verfügbar',
    );
    expect(toggleButtons.at(0)?.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders final score, tip and points for each row', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({
        gameId: 'g-1',
        finalScore: '2 : 0',
        userTip: '1 : 0',
        points: 3,
      }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const finalScore = fixture.nativeElement.querySelector('.my-final') as HTMLElement;
    const tip = fixture.nativeElement.querySelector('.my-tip') as HTMLElement;
    const points = fixture.nativeElement.querySelector('.my-points') as HTMLElement;

    expect(finalScore.textContent?.trim()).toBe('2 : 0');
    expect(tip.textContent).toContain('Tipp: 1 : 0');
    expect(points.textContent).toContain('3 P');
  });

  it('replaces one match body with participant tips and toggles it back', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-1', kickoffTime: kickoffA }),
      createEntry({ gameId: 'g-2', kickoffTime: kickoffB }),
    ];
    const gameTipsMap = new Map<string, Tip[]>([
      ['g-1', [createTip('g-1', 1, 'Anna'), createTip('g-1', 2, 'Ben')]],
      ['g-2', [createTip('g-2', 1, 'Anna')]],
    ]);

    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('gameTipsMap', gameTipsMap);
    fixture.componentRef.setInput('currentUserId', 1);
    fixture.detectChanges();

    const firstMatch = fixture.nativeElement.querySelector(
      '[data-game-id="g-1"]',
    ) as HTMLElement;
    const firstToggle = firstMatch.querySelector(
      '.my-tips-toggle',
    ) as HTMLButtonElement;

    expect(firstToggle.disabled).toBeFalse();
    expect(firstToggle.getAttribute('aria-label')).toBe(
      'Tipps der Teilnehmer anzeigen',
    );
    firstToggle.focus();
    expect(document.activeElement).toBe(firstToggle);
    expect(firstToggle.tabIndex).toBe(0);

    firstToggle.click();
    fixture.detectChanges();

    expect(firstMatch.querySelector('.my-game-row')).toBeNull();
    expect(firstMatch.querySelector('app-tips-table')).toBeTruthy();
    expect(firstToggle.getAttribute('aria-pressed')).toBe('true');
    expect(firstToggle.getAttribute('aria-label')).toBe(
      'Tipps der Teilnehmer ausblenden',
    );

    firstToggle.click();
    fixture.detectChanges();

    expect(firstMatch.querySelector('.my-game-row')).toBeTruthy();
    expect(firstMatch.querySelector('app-tips-table')).toBeNull();
    expect(firstToggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('returns the previous match to default when another match is selected', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-1', kickoffTime: kickoffA }),
      createEntry({ gameId: 'g-2', kickoffTime: kickoffB }),
    ];
    const gameTipsMap = new Map<string, Tip[]>([
      ['g-1', [createTip('g-1', 1, 'Anna')]],
      ['g-2', [createTip('g-2', 2, 'Ben')]],
    ]);

    fixture.componentRef.setInput('entries', entries);
    fixture.componentRef.setInput('gameTipsMap', gameTipsMap);
    fixture.componentRef.setInput('currentUserId', 1);
    fixture.detectChanges();

    const firstMatch = fixture.nativeElement.querySelector(
      '[data-game-id="g-1"]',
    ) as HTMLElement;
    const secondMatch = fixture.nativeElement.querySelector(
      '[data-game-id="g-2"]',
    ) as HTMLElement;

    (firstMatch.querySelector('.my-tips-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    (secondMatch.querySelector('.my-tips-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(firstMatch.querySelector('.my-game-row')).toBeTruthy();
    expect(firstMatch.querySelector('app-tips-table')).toBeNull();
    expect(secondMatch.querySelector('.my-game-row')).toBeNull();
    expect(secondMatch.querySelector('app-tips-table')).toBeTruthy();
  });

  it('resets the selected match when the entries change', () => {
    const firstEntry = createEntry({ gameId: 'g-1', kickoffTime: kickoffA });
    const secondEntry = createEntry({ gameId: 'g-2', kickoffTime: kickoffB });
    const gameTipsMap = new Map<string, Tip[]>([
      ['g-1', [createTip('g-1', 1, 'Anna')]],
      ['g-2', [createTip('g-2', 1, 'Anna')]],
    ]);

    fixture.componentRef.setInput('entries', [firstEntry]);
    fixture.componentRef.setInput('gameTipsMap', gameTipsMap);
    fixture.componentRef.setInput('currentUserId', 1);
    fixture.detectChanges();

    const firstToggle = fixture.nativeElement.querySelector(
      '.my-tips-toggle',
    ) as HTMLButtonElement;
    firstToggle.click();
    fixture.detectChanges();

    fixture.componentRef.setInput('entries', [secondEntry]);
    fixture.detectChanges();
    fixture.componentRef.setInput('entries', [firstEntry]);
    fixture.detectChanges();

    const restoredFirstMatch = fixture.nativeElement.querySelector(
      '[data-game-id="g-1"]',
    ) as HTMLElement;
    expect(restoredFirstMatch.querySelector('.my-game-row')).toBeTruthy();
    expect(restoredFirstMatch.querySelector('app-tips-table')).toBeNull();
  });

  it('applies point modifier classes for zero, mid and high values', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-0', points: 0 }),
      createEntry({ gameId: 'g-2', points: 2 }),
      createEntry({ gameId: 'g-3', points: 3 }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const pointItems = Array.from(
      fixture.nativeElement.querySelectorAll('.my-points'),
    ) as HTMLElement[];

    const zeroPoints = pointItems.find((item) =>
      item.textContent?.includes('0 P'),
    );
    const midPoints = pointItems.find((item) =>
      item.textContent?.includes('2 P'),
    );
    const highPoints = pointItems.find((item) =>
      item.textContent?.includes('3 P'),
    );

    expect(zeroPoints?.classList.contains('my-points--zero')).toBeTrue();
    expect(midPoints?.classList.contains('my-points--mid')).toBeTrue();
    expect(highPoints?.classList.contains('my-points--high')).toBeTrue();
  });

  it('shows team initials fallback when logos are missing', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({
        gameId: 'g-fallback',
        homeTeamName: 'Real Madrid',
        awayTeamName: 'Paris Saint-Germain',
        homeTeamLogoUrl: null,
        awayTeamLogoUrl: null,
      }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const logos = fixture.nativeElement.querySelectorAll('.my-team-logo');
    const fallbacks = Array.from(
      fixture.nativeElement.querySelectorAll('.my-team-fallback'),
    ) as HTMLElement[];
    const fallbackTexts = fallbacks.map((item) => item.textContent?.trim());

    expect(logos.length).toBe(0);
    expect(fallbackTexts).toEqual(['RM', 'PS']);
  });

  it('renders empty state when there are no entries', () => {
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.my-empty') as HTMLElement;

    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Noch keine gewerteten Spiele.');
  });
});
