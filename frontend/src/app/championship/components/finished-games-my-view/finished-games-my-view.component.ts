import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MyFinishedEntry } from '../../utils/spieltag-views.util';
import { Tip } from '../../types/tip.interface';
import { TipsTableComponent } from '../tips-table/tips-table.component';
import { UI_ICONS } from '../../../ui-lib/public-api';

interface MyDayGroup {
  dayKey: string;
  date: Date;
  entries: MyFinishedEntry[];
}

@Component({
  selector: 'app-finished-games-my-view',
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslateModule,
    TipsTableComponent,
  ],
  templateUrl: './finished-games-my-view.component.html',
  styleUrl: './finished-games-my-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishedGamesMyViewComponent {
  private readonly translate = inject(TranslateService);

  entries = input.required<MyFinishedEntry[]>();
  gameTipsMap = input<Map<string, Tip[]>>(new Map());
  currentUserId = input(0);
  private readonly activeTipsGameId = signal<string | null>(null);
  readonly icons = UI_ICONS;

  readonly groupedEntries = computed<MyDayGroup[]>(() => {
    const groups = new Map<string, MyDayGroup>();

    for (const entry of this.entries()) {
      const kickoffTime = new Date(entry.kickoffTime);
      const dayKey = this.getDayKey(kickoffTime);

      if (!groups.has(dayKey)) {
        groups.set(dayKey, { dayKey, date: kickoffTime, entries: [] });
      }

      groups.get(dayKey)?.entries.push(entry);
    }

    return Array.from(groups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((group) => ({
        ...group,
        entries: group.entries
          .slice()
          .sort(
            (a, b) =>
              new Date(a.kickoffTime).getTime() -
              new Date(b.kickoffTime).getTime(),
          ),
      }));
  });

  constructor() {
    effect(() => {
      const activeGameId = this.activeTipsGameId();
      if (
        activeGameId !== null &&
        !this.entries().some((entry) => entry.gameId === activeGameId)
      ) {
        this.activeTipsGameId.set(null);
      }
    });
  }

  formatDay(kickoffTime: Date): string {
    const date = new Date(kickoffTime);
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  formatKickoffTime(kickoffTime: Date): string {
    const date = new Date(kickoffTime);
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  hasParticipantTips(gameId: string): boolean {
    return (this.gameTipsMap().get(gameId)?.length ?? 0) > 0;
  }

  getParticipantTips(gameId: string): Tip[] {
    return this.gameTipsMap().get(gameId) ?? [];
  }

  isParticipantTipsVisible(gameId: string): boolean {
    return this.activeTipsGameId() === gameId;
  }

  toggleParticipantTips(gameId: string): void {
    if (!this.hasParticipantTips(gameId) || this.currentUserId() <= 0) {
      return;
    }

    this.activeTipsGameId.update((activeGameId) =>
      activeGameId === gameId ? null : gameId,
    );
  }

  getParticipantTipsLabelKey(gameId: string): string {
    if (!this.hasParticipantTips(gameId) || this.currentUserId() <= 0) {
      return 'championship.finishedMy.participantTipsUnavailable';
    }

    return this.isParticipantTipsVisible(gameId)
      ? 'championship.finishedMy.hideParticipantTips'
      : 'championship.finishedMy.showParticipantTips';
  }

  getTeamInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private getDayKey(kickoffTime: Date): string {
    const year = kickoffTime.getFullYear();
    const month = String(kickoffTime.getMonth() + 1).padStart(2, '0');
    const day = String(kickoffTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
