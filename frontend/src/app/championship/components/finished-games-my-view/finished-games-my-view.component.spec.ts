import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { MyFinishedEntry } from '../../utils/spieltag-views.util';
import { FinishedGamesMyViewComponent } from './finished-games-my-view.component';

describe('FinishedGamesMyViewComponent', () => {
  let fixture: ComponentFixture<FinishedGamesMyViewComponent>;

  const kickoffA = new Date('2026-02-17T18:45:00.000Z');
  const kickoffB = new Date('2026-02-17T21:00:00.000Z');

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
            empty: 'Noch keine gewerteten Spiele.',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(FinishedGamesMyViewComponent);
  });

  it('renders grouped entries with kickoff header', () => {
    const entries: MyFinishedEntry[] = [
      createEntry({ gameId: 'g-a-1', kickoffTime: kickoffA }),
      createEntry({ gameId: 'g-a-2', kickoffTime: kickoffA, awayTeamName: 'Inter' }),
      createEntry({ gameId: 'g-b-1', kickoffTime: kickoffB, awayTeamName: 'PSG' }),
    ];

    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();

    const groups = fixture.nativeElement.querySelectorAll('.my-kickoff-group');
    const firstGroupRows = groups[0].querySelectorAll('.my-item-row');
    const firstKickoff = groups[0].querySelector('.my-kickoff') as HTMLElement;

    expect(groups.length).toBe(2);
    expect(firstGroupRows.length).toBe(2);
    expect(firstKickoff.textContent).toContain('Anstoss');
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
