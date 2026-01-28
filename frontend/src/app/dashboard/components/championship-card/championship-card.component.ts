import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Championship } from '../../types/championship.interface';
import { PersistingService } from '../../../auth/services/persisisting.service';

@Component({
  selector: 'app-championship-card',
  imports: [RouterModule],
  templateUrl: './championship-card.component.html',
  styleUrl: './championship-card.component.scss',
})
export class ChampionshipCardComponent {
  championship = input<Championship>();

  private readonly persistingService = inject(PersistingService);
  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
}
