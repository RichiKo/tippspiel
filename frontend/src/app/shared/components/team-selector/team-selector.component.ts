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
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TeamService } from '../../../teams/services/team.service';
import {
  Team,
  TeamOrigin,
  TEAM_ORIGIN_OPTIONS,
} from '../../../teams/types/team.interface';

type TeamOriginFilter = TeamOrigin | 'ALL';

@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './team-selector.component.html',
  styleUrl: './team-selector.component.scss',
})
export class TeamSelectorComponent {
  private readonly teamService = inject(TeamService);
  private readonly translate = inject(TranslateService);

  // Inputs
  selectedTeamIds = input<string[]>([]);
  disabled = input<boolean>(false);
  showActiveCheckbox = input<boolean>(false);
  eliminatedTeamIds = input<string[]>([]);

  // Outputs
  teamAdded = output<string>();
  teamRemoved = output<string>();
  teamActiveChanged = output<{ teamId: string; isActive: boolean }>();

  // State
  readonly allTeams = signal<Team[]>([]);
  readonly filteredTeams = signal<Team[]>([]);
  readonly searchTerm = signal<string>('');
  readonly selectedOrigin = signal<TeamOriginFilter>(TeamOrigin.ENGLAND);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly originOptions = TEAM_ORIGIN_OPTIONS;

  // Computed
  readonly selectedTeams = computed(() => {
    const ids = this.selectedTeamIds();
    return this.allTeams().filter((team) => ids.includes(team.id));
  });

  readonly availableTeams = computed(() => {
    const ids = this.selectedTeamIds();
    const search = this.searchTerm().toLowerCase();
    return this.filteredTeams()
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
    const origin = this.selectedOrigin();
    const originFilter = origin === 'ALL' ? undefined : origin;

    forkJoin({
      allTeams: this.teamService.getAllTeams(),
      filteredTeams: this.teamService.getAllTeams(originFilter),
    }).subscribe({
      next: ({ allTeams, filteredTeams }) => {
        this.allTeams.set(allTeams);
        this.filteredTeams.set(filteredTeams);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('teamSelector.errors.loadFailed'),
        );
        this.allTeams.set([]);
        this.filteredTeams.set([]);
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  onOriginChange(value: string): void {
    if (value === 'ALL') {
      this.selectedOrigin.set('ALL');
      this.loadTeams();
      return;
    }

    if (this.originOptions.includes(value as TeamOrigin)) {
      this.selectedOrigin.set(value as TeamOrigin);
      this.loadTeams();
    }
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

  isTeamActive(teamId: string): boolean {
    return !this.eliminatedTeamIds().includes(teamId);
  }

  onActiveChange(teamId: string, checked: boolean) {
    if (!this.disabled()) {
      this.teamActiveChanged.emit({ teamId, isActive: checked });
    }
  }

  getOriginLabel(origin: TeamOrigin): string {
    return this.translate.instant(`teams.origin.${origin}`);
  }
}
