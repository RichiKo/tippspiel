import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TeamOrigin } from '../../../teams/types/team.interface';
import { GameCardComponent } from './game-card.component';

describe('GameCardComponent', () => {
  let component: GameCardComponent;
  let fixture: ComponentFixture<GameCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('game', {
      id: 'game-1',
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      kickoffTime: new Date('2099-05-01T19:45:00.000Z'),
      roundId: 'round-1',
      homeScore: null,
      awayScore: null,
      isClosed: false,
      createdAt: new Date('2099-04-01T00:00:00.000Z'),
      homeTeam: {
        id: 'team-1',
        name: 'Home Team',
        shortName: 'HOME',
        logoUrl: 'https://example.com/home.png',
        origin: TeamOrigin.GERMANY,
        createdAt: new Date('2099-01-01T00:00:00.000Z'),
      },
      awayTeam: {
        id: 'team-2',
        name: 'Away Team',
        shortName: 'AWAY',
        logoUrl: 'https://example.com/away.png',
        origin: TeamOrigin.ITALY,
        createdAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    });
    fixture.componentRef.setInput('currentUserId', 1);
    fixture.componentRef.setInput('championshipId', 'champ-1');
    fixture.componentRef.setInput('tip', undefined);
    fixture.componentRef.setInput('gameTips', []);
    fixture.detectChanges();
  });

  it('should render tel inputs with numeric mobile attributes', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      '.goal-input',
    ) as NodeListOf<HTMLInputElement>;

    expect(inputs.length).toBe(2);
    expect(inputs[0].type).toBe('tel');
    expect(inputs[0].getAttribute('inputmode')).toBe('numeric');
    expect(inputs[0].getAttribute('pattern')).toBe('[0-9]*');
    expect(inputs[0].getAttribute('maxlength')).toBe('1');
    expect(inputs[0].getAttribute('enterkeyhint')).toBe('done');
    expect(inputs[0].getAttribute('autocomplete')).toBe('off');
  });

  it('should render icon-only admin action buttons', () => {
    fixture.componentRef.setInput('isAdmin', true);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      '.edit-game-btn',
    ) as HTMLButtonElement | null;
    const deleteButton = fixture.nativeElement.querySelector(
      '.delete-game-btn',
    ) as HTMLButtonElement | null;

    expect(editButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
    expect(editButton?.querySelector('lucide-icon')).toBeTruthy();
    expect(deleteButton?.querySelector('lucide-icon')).toBeTruthy();
  });

  it('should sanitize non-digit characters in goal input', () => {
    const input = fixture.nativeElement.querySelector(
      '.goal-input',
    ) as HTMLInputElement;
    input.value = '1a-2';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('1');
    expect(component.homeGoals()).toBe(1);
  });

  it('should move focus to away input after entering one home goal digit', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      '.goal-input',
    ) as NodeListOf<HTMLInputElement>;
    const homeInput = inputs[0] as HTMLInputElement;
    const awayInput = inputs[1] as HTMLInputElement;
    const awayFocusSpy = spyOn(awayInput, 'focus');
    const awaySelectSpy = spyOn(awayInput, 'select');

    homeInput.value = '4';
    homeInput.dispatchEvent(new Event('input'));

    expect(component.homeGoals()).toBe(4);
    expect(awayFocusSpy).toHaveBeenCalled();
    expect(awaySelectSpy).toHaveBeenCalled();
  });

  it('should move focus back to home input on backspace in empty away input', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      '.goal-input',
    ) as NodeListOf<HTMLInputElement>;
    const homeInput = inputs[0] as HTMLInputElement;
    const awayInput = inputs[1] as HTMLInputElement;
    const homeFocusSpy = spyOn(homeInput, 'focus');
    const homeSelectSpy = spyOn(homeInput, 'select');

    awayInput.value = '';
    awayInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

    expect(homeFocusSpy).toHaveBeenCalled();
    expect(homeSelectSpy).toHaveBeenCalled();
  });

  it('should render tips table with notTipped entry for started game', () => {
    fixture.componentRef.setInput('game', {
      ...component.game(),
      kickoffTime: new Date('2000-05-01T19:45:00.000Z'),
      isClosed: false,
    });
    fixture.componentRef.setInput('gameTips', [
      {
        id: 'tip-2',
        userId: 2,
        gameId: 'game-1',
        championshipId: 'champ-1',
        homeTeamGoals: null,
        awayTeamGoals: null,
        points: 0,
        outcomeType: 'notTipped',
        user: { id: 2, username: 'User 2', email: 'u2@test.com' },
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-tips-table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'championship.tipsTable.outcomes.notTipped',
    );
  });
});
