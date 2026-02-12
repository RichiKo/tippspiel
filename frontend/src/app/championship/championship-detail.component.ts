import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Championship } from '../dashboard/types/championship.interface';
import { Round, CreateRoundDto } from './types/round.interface';
import {
  Game,
  CreateGameDto,
  UpdateGameDto,
  UpdateGameResultDto,
} from './types/game.interface';
import { Tip, CreateTipDto } from './types/tip.interface';
import { Team } from '../teams/types/team.interface';
import { ChampionshipService } from '../dashboard/services/championship.service';
import { RoundService } from './services/round.service';
import { GameService } from './services/game.service';
import { TipService } from './services/tip.service';
import { PersistingService } from '../auth/services/persisisting.service';
import { GameCardComponent } from './components/game-card/game-card.component';
import { RoundDialogComponent } from './components/round-dialog/round-dialog.component';
import { GameDialogComponent } from './components/game-dialog/game-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BonusPickFormComponent } from '../bonus/components/bonus-pick-form/bonus-pick-form.component';
import { BonusService } from '../bonus/services/bonus.service';

@Component({
  selector: 'app-championship-detail',
  imports: [
    CommonModule,
    RouterModule,
    GameCardComponent,
    RoundDialogComponent,
    GameDialogComponent,
    ConfirmationDialogComponent,
    BonusPickFormComponent,
  ],
  templateUrl: './championship-detail.component.html',
  styleUrl: './championship-detail.component.scss',
})
export class ChampionshipDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly roundService = inject(RoundService);
  private readonly gameService = inject(GameService);
  private readonly tipService = inject(TipService);
  private readonly persistingService = inject(PersistingService);
  private readonly bonusService = inject(BonusService);

  championship = signal<Championship | null>(null);
  rounds = signal<Round[]>([]);
  selectedRound = signal<Round | null>(null);
  games = signal<Game[]>([]);
  teams = signal<Team[]>([]);
  userTips = signal<Map<string, Tip>>(new Map());
  gameTips = signal<Map<string, Tip[]>>(new Map());
  isLoading = signal(true);
  error = signal<string | null>(null);

  showRoundDialog = signal(false);
  showGameDialog = signal(false);
  selectedGame = signal<Game | null>(null);
  showDeleteConfirm = signal(false);
  gameToDelete = signal<string | null>(null);
  isMobileView = signal(false);
  isBonusExpanded = signal(true);
  hasActiveBonusRules = signal(false);
  isRoundDrawerOpen = signal(false);
  roundDrawerDragOffset = signal(0);

  isDrawerDragging = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private bodyOverflowBeforeDrawer: string | null = null;

  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly eliminatedTeamIds = computed(
    () => this.championship()?.eliminatedTeamIds ?? [],
  );

  readonly groupedGames = computed(() => {
    const games = this.games();
    const grouped = new Map<string, { date: Date; games: Game[] }>();

    games.forEach((game) => {
      const kickoffDate = new Date(game.kickoffTime);
      // Use date string as key (without time)
      const dateKey = kickoffDate.toDateString();

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { date: kickoffDate, games: [] });
      }
      grouped.get(dateKey)!.games.push(game);
    });

    // Sort groups by date ascending
    return Array.from(grouped.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((group) => ({
        date: group.date,
        games: group.games.sort(
          (a, b) =>
            new Date(a.kickoffTime).getTime() -
            new Date(b.kickoffTime).getTime(),
        ),
      }));
  });

  championshipId = '';

  constructor() {
    this.updateViewportState();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.championshipId = id;
    this.loadChampionship();
    this.loadRounds();
    this.loadTeams();
    this.loadActiveBonusRulesAvailability();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportState();
  }

  @HostListener('document:keydown', ['$event'])
  onRoundDrawerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isRoundDrawerOpen()) {
      this.closeRoundDrawer();
    }
  }

  private updateViewportState(): void {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const wasMobile = this.isMobileView();
    this.isMobileView.set(isMobile);
    if (wasMobile !== isMobile) {
      this.isBonusExpanded.set(!isMobile);
      if (!isMobile) {
        this.closeRoundDrawer();
      }
    }
  }

  openRoundDrawer(): void {
    if (!this.isMobileView()) {
      return;
    }

    this.roundDrawerDragOffset.set(0);
    this.isDrawerDragging = false;
    this.isRoundDrawerOpen.set(true);
    this.setBodyScrollLocked(true);
  }

  closeRoundDrawer(): void {
    this.roundDrawerDragOffset.set(0);
    this.isDrawerDragging = false;
    this.isRoundDrawerOpen.set(false);
    this.setBodyScrollLocked(false);
  }

  toggleRoundDrawer(): void {
    if (this.isRoundDrawerOpen()) {
      this.closeRoundDrawer();
      return;
    }

    this.openRoundDrawer();
  }

  onRoundDrawerBackdropClick(): void {
    this.closeRoundDrawer();
  }

  selectRoundFromDrawer(round: Round): void {
    this.selectRound(round);
    this.closeRoundDrawer();
  }

  onDrawerTouchStart(event: TouchEvent): void {
    if (!this.isRoundDrawerOpen()) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.roundDrawerDragOffset.set(0);
    this.isDrawerDragging = true;
  }

  onDrawerTouchMove(event: TouchEvent): void {
    if (!this.isDrawerDragging || !this.isRoundDrawerOpen()) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (deltaX >= 0) {
      this.roundDrawerDragOffset.set(0);
      return;
    }

    event.preventDefault();
    const maxOffset = this.getRoundDrawerWidthPx();
    this.roundDrawerDragOffset.set(Math.min(Math.abs(deltaX), maxOffset));
  }

  onDrawerTouchEnd(): void {
    if (!this.isDrawerDragging) {
      return;
    }

    const currentOffset = this.roundDrawerDragOffset();
    const closeThreshold = Math.max(72, this.getRoundDrawerWidthPx() * 0.25);
    this.isDrawerDragging = false;

    if (currentOffset >= closeThreshold) {
      this.closeRoundDrawer();
      return;
    }

    this.roundDrawerDragOffset.set(0);
  }

  getRoundDrawerTransform(): string {
    if (!this.isRoundDrawerOpen()) {
      return 'translateX(-100%)';
    }

    const offset = Math.max(0, this.roundDrawerDragOffset());
    return `translateX(-${offset}px)`;
  }

  ngOnDestroy(): void {
    this.setBodyScrollLocked(false);
  }

  private loadTeams() {
    this.championshipService
      .getChampionshipTeams(this.championshipId)
      .subscribe({
        next: (data) => {
          this.teams.set(data);
        },
        error: (err) => {
          console.error('Teams konnten nicht geladen werden');
        },
      });
  }

  private loadActiveBonusRulesAvailability(): void {
    this.bonusService.getActiveBonusRules(this.championshipId).subscribe({
      next: (rules) => {
        this.hasActiveBonusRules.set(rules.length > 0);
      },
      error: () => {
        this.hasActiveBonusRules.set(false);
      },
    });
  }

  private loadChampionship() {
    this.championshipService
      .getChampionshipById(this.championshipId)
      .subscribe({
        next: (data) => {
          this.championship.set(data);
        },
        error: (err) => {
          this.error.set('Championship konnte nicht geladen werden');
          this.isLoading.set(false);
        },
      });
  }

  private loadRounds() {
    this.roundService.getRoundsByChampionship(this.championshipId).subscribe({
      next: (data) => {
        this.rounds.set(data);
        if (data.length > 0) {
          const lastRoundIndex = data.length - 1;
          this.selectRound(data[lastRoundIndex]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Spieltage konnten nicht geladen werden');
        this.isLoading.set(false);
      },
    });
  }

  selectRound(round: Round) {
    this.selectedRound.set(round);
    this.loadGames(round.id);
  }

  toggleBonusSection(): void {
    this.isBonusExpanded.update((value) => !value);
  }

  private loadGames(roundId: string) {
    this.gameService
      .getGamesByChampionship(this.championshipId, { roundId })
      .subscribe({
        next: (data) => {
          const sortedGames = data.sort(
            (a, b) =>
              new Date(a.kickoffTime).getTime() -
              new Date(b.kickoffTime).getTime(),
          );
          this.games.set(sortedGames);
          this.loadUserTips();
          this.loadTipsForStartedGames();
        },
        error: (err) => {
          this.error.set('Spiele konnten nicht geladen werden');
        },
      });
  }

  private loadTipsForStartedGames() {
    const games = this.games();
    const now = new Date();

    const startedGames = games.filter((g) => new Date(g.kickoffTime) <= now);

    startedGames.forEach((game) => {
      this.tipService.getTipsForGame(game.id).subscribe({
        next: (tips) => {
          const currentTips = this.gameTips();
          currentTips.set(game.id, tips);
          this.gameTips.set(new Map(currentTips));
        },
        error: (err) => {
          console.error(
            `Fehler beim Laden der Tipps für Spiel ${game.id}`,
            err,
          );
        },
      });
    });
  }

  private loadUserTips() {
    const userId = this.currentUser()?.id;
    if (!userId) return;

    this.tipService
      .getUserTipsForChampionship(userId.toString(), this.championshipId)
      .subscribe({
        next: (tips) => {
          const tipsMap = new Map<string, Tip>();
          tips.forEach((tip) => tipsMap.set(tip.gameId, tip));
          this.userTips.set(tipsMap);
        },
        error: (err) => {
          console.error('Tipps konnten nicht geladen werden', err);
        },
      });
  }

  onTipChanged(tip: CreateTipDto) {
    this.tipService.createOrUpdateTip(tip).subscribe({
      next: (savedTip) => {
        const currentTips = this.userTips();
        currentTips.set(tip.gameId, savedTip);
        this.userTips.set(new Map(currentTips));
      },
      error: (err) => {
        this.error.set('Tipp konnte nicht gespeichert werden');
        console.error('Tipp-Fehler:', err);
      },
    });
  }

  onCreateRound() {
    this.showRoundDialog.set(true);
  }

  onRoundDialogConfirmed(dto: CreateRoundDto) {
    this.roundService.createRound(this.championshipId, dto).subscribe({
      next: (round) => {
        const currentRounds = this.rounds();
        this.rounds.set([...currentRounds, round]);
        this.showRoundDialog.set(false);
      },
      error: (err) => {
        this.error.set('Spieltag konnte nicht erstellt werden');
        this.showRoundDialog.set(false);
      },
    });
  }

  onRoundDialogCancelled() {
    this.showRoundDialog.set(false);
  }

  onAddGame() {
    const round = this.selectedRound();
    if (!round) return;
    this.selectedGame.set(null);
    this.showGameDialog.set(true);
  }

  onGameDialogConfirmed(dto: any) {
    const round = this.selectedRound();
    if (!round) return;

    const gameId = this.selectedGame()?.id;

    if (gameId) {
      // Update existing game: First update game data, then update result
      const gameDto: UpdateGameDto = {
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        kickoffTime: dto.kickoffTime,
      };

      this.gameService.updateGame(gameId, gameDto).subscribe({
        next: (updatedGame) => {
          // Now update the result
          const resultDto: UpdateGameResultDto = {
            homeScore: dto.homeScore ?? 0,
            awayScore: dto.awayScore ?? 0,
            isClosed: dto.isClosed ?? false,
          };

          this.gameService.updateGameResult(gameId, resultDto).subscribe({
            next: (finalGame) => {
              const currentGames = this.games();
              const index = currentGames.findIndex((g) => g.id === gameId);
              if (index !== -1) {
                currentGames[index] = finalGame;
                const sortedGames = [...currentGames].sort(
                  (a, b) =>
                    new Date(a.kickoffTime).getTime() -
                    new Date(b.kickoffTime).getTime(),
                );
                this.games.set(sortedGames);
              }

              if (
                finalGame.isClosed ||
                new Date(finalGame.kickoffTime) <= new Date()
              ) {
                this.tipService.getTipsForGame(gameId).subscribe({
                  next: (tips) => {
                    const currentTips = this.gameTips();
                    currentTips.set(gameId, tips);
                    this.gameTips.set(new Map(currentTips));
                  },
                });
              }

              this.showGameDialog.set(false);
              this.selectedGame.set(null);
            },
            error: (err) => {
              this.error.set('Ergebnis konnte nicht aktualisiert werden');
              this.showGameDialog.set(false);
            },
          });
        },
        error: (err) => {
          this.error.set('Spiel konnte nicht aktualisiert werden');
          this.showGameDialog.set(false);
        },
      });
    } else {
      // Create new game
      this.gameService.createGame(round.id, dto as CreateGameDto).subscribe({
        next: (game) => {
          const currentGames = this.games();
          const sortedGames = [...currentGames, game].sort(
            (a, b) =>
              new Date(a.kickoffTime).getTime() -
              new Date(b.kickoffTime).getTime(),
          );
          this.games.set(sortedGames);
          this.showGameDialog.set(false);
        },
        error: (err) => {
          this.error.set('Spiel konnte nicht erstellt werden');
          this.showGameDialog.set(false);
        },
      });
    }
  }

  onGameDialogCancelled() {
    this.showGameDialog.set(false);
    this.selectedGame.set(null);
  }

  onEditGame(game: Game) {
    this.selectedGame.set(game);
    this.showGameDialog.set(true);
  }

  onDeleteGameClick(gameId: string) {
    this.gameToDelete.set(gameId);
    this.showDeleteConfirm.set(true);
  }

  onDeleteGameConfirmed() {
    const gameId = this.gameToDelete();
    if (!gameId) return;

    this.gameService.deleteGame(gameId).subscribe({
      next: () => {
        const currentGames = this.games();
        this.games.set(currentGames.filter((g) => g.id !== gameId));
        this.showDeleteConfirm.set(false);
        this.gameToDelete.set(null);
      },
      error: (err) => {
        this.error.set('Spiel konnte nicht gelöscht werden');
        this.showDeleteConfirm.set(false);
        this.gameToDelete.set(null);
      },
    });
  }

  onDeleteGameCancelled() {
    this.showDeleteConfirm.set(false);
    this.gameToDelete.set(null);
  }

  formatRoundDate(round: Round): string {
    const startDate = new Date(round.startDate);
    const start = this.formatDate(startDate);

    if (round.endDate) {
      const endDate = new Date(round.endDate);
      const end = this.formatDate(endDate);
      return `${start} - ${end}`;
    }

    return start;
  }

  formatGameDateHeader(date: Date): string {
    const weekdays = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];

    return `${weekday}, ${day}.${month}.${year}`;
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (locked) {
      if (this.bodyOverflowBeforeDrawer === null) {
        this.bodyOverflowBeforeDrawer = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
      return;
    }

    if (this.bodyOverflowBeforeDrawer !== null) {
      document.body.style.overflow = this.bodyOverflowBeforeDrawer;
      this.bodyOverflowBeforeDrawer = null;
    }
  }

  private getRoundDrawerWidthPx(): number {
    if (typeof window === 'undefined') {
      return 260;
    }

    const viewportWidth = window.innerWidth;
    const preferredWidth = viewportWidth * 0.7;
    return Math.min(380, Math.max(260, preferredWidth));
  }
}
