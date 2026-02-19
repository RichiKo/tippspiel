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
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { RankingService } from './services/ranking.service';
import { PersistingService } from '../auth/services/persisisting.service';
import { GameCardComponent } from './components/game-card/game-card.component';
import { RoundDialogComponent } from './components/round-dialog/round-dialog.component';
import { GameDialogComponent } from './components/game-dialog/game-dialog.component';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BonusPickFormComponent } from '../bonus/components/bonus-pick-form/bonus-pick-form.component';
import { BonusService } from '../bonus/services/bonus.service';
import { FinishedGamesMyViewComponent } from './components/finished-games-my-view/finished-games-my-view.component';
import { FinishedGamesAllViewComponent } from './components/finished-games-all-view/finished-games-all-view.component';
import { SpieltagsRankingTableComponent } from './components/spieltags-ranking-table/spieltags-ranking-table.component';
import {
  RankingParticipant,
  SpieltagViewMode,
  buildMyFinishedEntries,
  buildSpieltagRankingRows,
  groupGamesByDate,
  groupGamesByKickoff,
  isFinishedGame,
} from './utils/spieltag-views.util';
import { UI_ICONS, UiButtonComponent } from '../ui-lib/public-api';

@Component({
  selector: 'app-championship-detail',
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    TranslateModule,
    GameCardComponent,
    RoundDialogComponent,
    GameDialogComponent,
    ConfirmationDialogComponent,
    BonusPickFormComponent,
    FinishedGamesMyViewComponent,
    FinishedGamesAllViewComponent,
    SpieltagsRankingTableComponent,
    UiButtonComponent,
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
  private readonly rankingService = inject(RankingService);
  private readonly persistingService = inject(PersistingService);
  private readonly bonusService = inject(BonusService);
  private readonly translate = inject(TranslateService);

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
  selectedView = signal<SpieltagViewMode>('myGames');
  rankingParticipants = signal<RankingParticipant[]>([]);
  isRoundDrawerOpen = signal(false);
  roundDrawerDragOffset = signal(0);

  isDrawerDragging = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private isBodyScrollLockedByDrawer = false;

  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly icons = UI_ICONS;
  readonly eliminatedTeamIds = computed(
    () => this.championship()?.eliminatedTeamIds ?? [],
  );

  readonly finishedGames = computed(() =>
    this.games()
      .filter((game) => isFinishedGame(game))
      .sort(
        (a, b) =>
          new Date(a.kickoffTime).getTime() -
          new Date(b.kickoffTime).getTime(),
      ),
  );

  readonly openGames = computed(() =>
    this.games()
      .filter((game) => !isFinishedGame(game))
      .sort(
        (a, b) =>
          new Date(a.kickoffTime).getTime() -
          new Date(b.kickoffTime).getTime(),
      ),
  );

  readonly finishedGamesGroupedByKickoff = computed(() =>
    groupGamesByKickoff(this.finishedGames()),
  );

  readonly openGamesGroupedByDate = computed(() =>
    groupGamesByDate(this.openGames()),
  );

  readonly myFinishedEntries = computed(() =>
    buildMyFinishedEntries(this.finishedGames(), this.userTips()),
  );

  readonly spieltagRankingRows = computed(() =>
    buildSpieltagRankingRows(
      this.finishedGames(),
      this.gameTips(),
      this.rankingParticipants(),
    ),
  );

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
    this.loadRankingParticipants();
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
        error: () => {
          this.error.set(
            this.translate.instant('championship.detail.errors.loadTeams'),
          );
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
        error: () => {
          this.error.set(
            this.translate.instant('championship.detail.errors.loadChampionship'),
          );
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
      error: () => {
        this.error.set(
          this.translate.instant('championship.detail.errors.loadRounds'),
        );
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

  setSelectedView(mode: SpieltagViewMode): void {
    this.selectedView.set(mode);
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
        error: () => {
          this.error.set(
            this.translate.instant('championship.detail.errors.loadGames'),
          );
        },
      });
  }

  private loadTipsForStartedGames() {
    const games = this.games();
    const now = new Date();

    const startedGames = games.filter(
      (g) => g.isClosed || new Date(g.kickoffTime) <= now,
    );

    startedGames.forEach((game) => {
      this.tipService.getTipsForGame(game.id).subscribe({
        next: (tips) => {
          const currentTips = this.gameTips();
          currentTips.set(game.id, tips);
          this.gameTips.set(new Map(currentTips));
        },
        error: () => {},
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
        error: () => {},
      });
  }

  private loadRankingParticipants(): void {
    this.rankingService.getRankingByChampionship(this.championshipId).subscribe({
      next: (rankings) => {
        const map = new Map<number, RankingParticipant>();
        for (const ranking of rankings) {
          if (!map.has(ranking.userId)) {
            map.set(ranking.userId, {
              userId: ranking.userId,
              username: ranking.user.username,
            });
          }
        }
        this.rankingParticipants.set(Array.from(map.values()));
      },
      error: () => {
        this.rankingParticipants.set([]);
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
      error: () => {
        this.error.set(
          this.translate.instant('championship.detail.errors.saveTip'),
        );
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
      error: () => {
        this.error.set(
          this.translate.instant('championship.detail.errors.createRound'),
        );
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
            error: () => {
              this.error.set(
                this.translate.instant('championship.detail.errors.updateResult'),
              );
              this.showGameDialog.set(false);
            },
          });
        },
        error: () => {
          this.error.set(
            this.translate.instant('championship.detail.errors.updateGame'),
          );
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
        error: () => {
          this.error.set(
            this.translate.instant('championship.detail.errors.createGame'),
          );
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
      error: () => {
        this.error.set(
          this.translate.instant('championship.detail.errors.deleteGame'),
        );
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
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
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

    const countKey = 'dialogScrollLockCount';
    const scrollYKey = 'dialogScrollLockScrollY';
    const bodyOverflowKey = 'dialogScrollLockBodyOverflow';
    const bodyPositionKey = 'dialogScrollLockBodyPosition';
    const bodyTopKey = 'dialogScrollLockBodyTop';
    const bodyWidthKey = 'dialogScrollLockBodyWidth';
    const htmlOverflowKey = 'dialogScrollLockHtmlOverflow';
    const currentCount = Number.parseInt(
      document.body.dataset[countKey] ?? '0',
      10,
    );

    if (locked) {
      if (this.isBodyScrollLockedByDrawer) {
        return;
      }

      if (currentCount === 0) {
        const scrollY =
          typeof window !== 'undefined'
            ? window.scrollY || window.pageYOffset || 0
            : 0;
        document.body.dataset[scrollYKey] = String(scrollY);
        document.body.dataset[bodyOverflowKey] = document.body.style.overflow;
        document.body.dataset[bodyPositionKey] = document.body.style.position;
        document.body.dataset[bodyTopKey] = document.body.style.top;
        document.body.dataset[bodyWidthKey] = document.body.style.width;
        document.body.dataset[htmlOverflowKey] =
          document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
      }

      document.body.dataset[countKey] = String(currentCount + 1);
      this.isBodyScrollLockedByDrawer = true;
      return;
    }

    if (!this.isBodyScrollLockedByDrawer) {
      return;
    }

    const nextCount = Math.max(0, currentCount - 1);
    document.body.dataset[countKey] = String(nextCount);
    this.isBodyScrollLockedByDrawer = false;

    if (nextCount === 0) {
      const scrollY = Number.parseInt(document.body.dataset[scrollYKey] ?? '0', 10);
      document.body.style.overflow = document.body.dataset[bodyOverflowKey] ?? '';
      document.body.style.position = document.body.dataset[bodyPositionKey] ?? '';
      document.body.style.top = document.body.dataset[bodyTopKey] ?? '';
      document.body.style.width = document.body.dataset[bodyWidthKey] ?? '';
      document.documentElement.style.overflow =
        document.body.dataset[htmlOverflowKey] ?? '';
      if (typeof window !== 'undefined') {
        window.scrollTo(0, Number.isNaN(scrollY) ? 0 : scrollY);
      }
      delete document.body.dataset[scrollYKey];
      delete document.body.dataset[bodyOverflowKey];
      delete document.body.dataset[bodyPositionKey];
      delete document.body.dataset[bodyTopKey];
      delete document.body.dataset[bodyWidthKey];
      delete document.body.dataset[htmlOverflowKey];
      delete document.body.dataset[countKey];
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

  onBackClick(): void {
    this.router.navigate(['/dashboard']);
  }
}
