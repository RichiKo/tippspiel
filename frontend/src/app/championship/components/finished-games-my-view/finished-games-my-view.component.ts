import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MyFinishedEntry } from '../../utils/spieltag-views.util';

interface MyKickoffGroup {
  kickoffTime: Date;
  entries: MyFinishedEntry[];
}

@Component({
  selector: 'app-finished-games-my-view',
  imports: [CommonModule, TranslateModule],
  templateUrl: './finished-games-my-view.component.html',
  styleUrl: './finished-games-my-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishedGamesMyViewComponent {
  private readonly translate = inject(TranslateService);

  entries = input.required<MyFinishedEntry[]>();

  readonly groupedEntries = computed<MyKickoffGroup[]>(() => {
    const groups = new Map<string, MyKickoffGroup>();

    for (const entry of this.entries()) {
      const kickoffTime = new Date(entry.kickoffTime);
      const key = this.getKickoffSlotKey(kickoffTime);

      if (!groups.has(key)) {
        groups.set(key, { kickoffTime, entries: [] });
      }

      groups.get(key)?.entries.push(entry);
    }

    return Array.from(groups.values())
      .sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime())
      .map((group) => ({
        kickoffTime: group.kickoffTime,
        entries: group.entries
          .slice()
          .sort(
            (a, b) =>
              new Date(a.kickoffTime).getTime() -
              new Date(b.kickoffTime).getTime(),
          ),
      }));
  });

  formatKickoff(kickoffTime: Date): string {
    const date = new Date(kickoffTime);
    const locale = this.translate.currentLang === 'de' ? 'de-DE' : 'uk-UA';
    const dateLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    const timeLabel = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${dateLabel} · ${timeLabel}`;
  }

  getTeamInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private getKickoffSlotKey(kickoffTime: Date): string {
    const normalized = new Date(kickoffTime);
    normalized.setSeconds(0, 0);
    return normalized.toISOString();
  }
}
