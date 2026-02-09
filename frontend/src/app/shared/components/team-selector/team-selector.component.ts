import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../teams/services/team.service';
import { Team } from '../../../teams/types/team.interface';

@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-selector.component.html',
  styleUrl: './team-selector.component.scss',
})
export class TeamSelectorComponent {
  private readonly teamService = inject(TeamService);

  // Inputs
  selectedTeamIds = input<string[]>([]);
  disabled = input<boolean>(false);

  // Outputs
  teamAdded = output<string>();
  teamRemoved = output<string>();

  // State
  readonly allTeams = signal<Team[]>([]);
  readonly searchTerm = signal<string>('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Computed
  readonly selectedTeams = computed(() => {
    const ids = this.selectedTeamIds();
    return this.allTeams().filter((team) => ids.includes(team.id));
  });

  readonly availableTeams = computed(() => {
    const ids = this.selectedTeamIds();
    const search = this.searchTerm().toLowerCase();
    return this.allTeams()
      .filter((team) => !ids.includes(team.id))
      .filter(
        (team) =>
          team.name.toLowerCase().includes(search) ||
          team.shortName.toLowerCase().includes(search)
      );
  });

  constructor() {
    this.loadTeams();
  }

  loadTeams() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.allTeams.set(teams);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Teams konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  onAddTeam(teamId: string) {
    if (!this.disabled()) {
      this.teamAdded.emit(teamId);
    }
  }

  onRemoveTeam(teamId: string) {
    if (!this.disabled()) {
      this.teamRemoved.emit(teamId);
    }
  }
}
