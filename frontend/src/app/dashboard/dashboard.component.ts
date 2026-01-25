import { Component, signal, effect, inject } from '@angular/core';
import { Championship } from './types/championship.interface';
import { ChampionshipCardComponent } from './components/championship-card/championship-card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from './services/championship.service';

@Component({
  selector: 'app-dashboard',
  imports: [ChampionshipCardComponent, CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly championshipService = inject(ChampionshipService);
  championships = signal<Championship[]>([]);

  constructor() {
    console.log('DashboardComponent constructor');
    this.loadChampionships();
  }

  loadChampionships() {
    this.championshipService.getAllChampionships().subscribe({
      next: (data) => {
        console.log('championships', data);
        this.championships.set(data);
      },
      error: (err) => {
        // Fehlerbehandlung, z.B. Notification
        this.championships.set([]);
      },
    });
  }
}
