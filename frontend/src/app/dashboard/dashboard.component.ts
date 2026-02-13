import { Component, signal, inject, computed } from '@angular/core';
import { Championship } from './types/championship.interface';
import { ChampionshipCardComponent } from './components/championship-card/championship-card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from './services/championship.service';
import { PersistingService } from '../auth/services/persisisting.service';

@Component({
  selector: 'app-dashboard',
  imports: [ChampionshipCardComponent, CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly championshipService = inject(ChampionshipService);
  private readonly persistingService = inject(PersistingService);

  championships = signal<Championship[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isAdmin = computed(
    () => this.persistingService.currentUser()?.role === 'admin'
  );
  readonly hasChampionships = computed(() => this.championships().length > 0);
  readonly sortedChampionships = computed(() => {
    return [...this.championships()].sort((a, b) => {
      const priorityDiff = this.getTypePriority(a) - this.getTypePriority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const createdAtDiff = this.toTimestamp(b.createdAt) - this.toTimestamp(a.createdAt);
      if (createdAtDiff !== 0) {
        return createdAtDiff;
      }

      return a.name.localeCompare(b.name, 'de');
    });
  });

  constructor() {
    this.loadChampionships();
  }

  loadChampionships(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.championshipService.getAllChampionships().subscribe({
      next: (data) => {
        this.championships.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.championships.set([]);
        this.loadError.set(
          'Championships konnten nicht geladen werden. Bitte erneut versuchen.'
        );
        this.isLoading.set(false);
      },
    });
  }

  private getTypePriority(championship: Championship): number {
    if (championship.isActive && !championship.isPublic) {
      return 0;
    }

    if (championship.isActive && championship.isPublic) {
      return 1;
    }

    if (!championship.isActive && !championship.isPublic) {
      return 2;
    }

    return 3;
  }

  private toTimestamp(value: Date | string): number {
    if (value instanceof Date) {
      return value.getTime();
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
