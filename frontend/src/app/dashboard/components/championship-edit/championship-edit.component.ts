import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship.service';
import { Championship } from '../../types/championship.interface';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { TeamSelectorComponent } from '../../../shared/components/team-selector/team-selector.component';
import { MemberSelectorComponent } from '../../../shared/components/member-selector/member-selector.component';
import { BonusAdminComponent } from '../../../bonus/components/bonus-admin/bonus-admin.component';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TeamService } from '../../../teams/services/team.service';
import { Team } from '../../../teams/types/team.interface';

@Component({
  selector: 'app-championship-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ImageUploadComponent,
    TeamSelectorComponent,
    MemberSelectorComponent,
    BonusAdminComponent,
  ],
  templateUrl: './championship-edit.component.html',
  styleUrl: './championship-edit.component.scss',
})
export class ChampionshipEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);
  private readonly teamService = inject(TeamService);

  readonly championshipId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedTeamIds = signal<string[]>([]);
  readonly initialTeamIds = signal<string[]>([]);
  readonly selectedEliminatedTeamIds = signal<string[]>([]);
  readonly isUpdatingEliminated = signal(false);
  readonly allTeams = signal<Team[]>([]);
  readonly selectedTeams = computed(() => {
    const selectedIds = this.selectedTeamIds();
    return this.allTeams().filter((team) => selectedIds.includes(team.id));
  });
  readonly availableTeams = computed(() => this.selectedTeams());

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    description: ['', [Validators.maxLength(256)]],
    image: ['', [Validators.required]],
    isPublic: [true],
    isActive: [true],
  });

  readonly canSubmit = computed(
    () => !this.isLoading() && this.form.valid && !!this.championshipId()
  );

  ngOnInit() {
    this.loadAllTeams();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.championshipId.set(id);
    this.loadChampionship(id);
  }

  private loadAllTeams() {
    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.allTeams.set(teams);
      },
      error: () => {
        this.errorMessage.set('Teams konnten nicht geladen werden.');
      },
    });
  }

  private loadChampionship(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.championshipService.getChampionshipById(id).subscribe({
      next: (championship: Championship) => {
        this.form.patchValue({
          name: championship.name,
          description: championship.description ?? '',
          image: championship.image,
          isPublic: championship.isPublic,
          isActive: championship.isActive,
        });

        // Load teams
        this.championshipService.getChampionshipTeams(id).subscribe({
          next: (teams) => {
            const teamIds = teams.map((t) => t.id);
            this.selectedTeamIds.set(teamIds);
            this.initialTeamIds.set(teamIds);
            this.championshipService.getEliminatedTeams(id).subscribe({
              next: (eliminated) => {
                const allowedIds = new Set(teamIds);
                this.selectedEliminatedTeamIds.set(
                  (eliminated.eliminatedTeamIds || []).filter((teamId) =>
                    allowedIds.has(teamId)
                  )
                );
                this.isLoading.set(false);
              },
              error: () => {
                this.selectedEliminatedTeamIds.set([]);
                this.isLoading.set(false);
              },
            });
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.errorMessage.set('Championship konnte nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  onTeamAdded(teamId: string): void {
    this.selectedTeamIds.update((ids) => [...ids, teamId]);
  }

  onTeamRemoved(teamId: string): void {
    this.selectedTeamIds.update((ids) => ids.filter((id) => id !== teamId));
    this.selectedEliminatedTeamIds.update((ids) =>
      ids.filter((id) => id !== teamId)
    );
  }

  onTeamActiveChanged(payload: { teamId: string; isActive: boolean }): void {
    const championshipId = this.championshipId();
    if (!championshipId || this.isUpdatingEliminated()) {
      return;
    }

    this.isUpdatingEliminated.set(true);
    this.errorMessage.set(null);

    this.championshipService
      .updateSingleEliminatedTeam(championshipId, payload.teamId, {
        isEliminated: !payload.isActive,
      })
      .subscribe({
        next: (response) => {
          this.selectedEliminatedTeamIds.set(response.eliminatedTeamIds || []);
          this.isUpdatingEliminated.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Ausgestiegen-Markierung konnte nicht aktualisiert werden.'
          );
          this.isUpdatingEliminated.set(false);
        },
      });
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form.invalid || !this.championshipId()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: Partial<Championship> = {
      name: this.form.value.name ?? '',
      description: this.form.value.description ?? undefined,
      image: this.form.value.image ?? '',
      isPublic: this.form.value.isPublic ?? true,
      isActive: this.form.value.isActive ?? true,
    };

    const championshipId = this.championshipId()!;
    const currentTeamIds = this.selectedTeamIds();
    const originalTeamIds = this.initialTeamIds();

    // Determine which teams to add and remove
    const teamsToAdd = currentTeamIds.filter(
      (id) => !originalTeamIds.includes(id)
    );
    const teamsToRemove = originalTeamIds.filter(
      (id) => !currentTeamIds.includes(id)
    );

    this.championshipService
      .updateChampionship(championshipId, payload)
      .pipe(
        switchMap(() => {
          const operations = [];

          // Add new teams
          if (teamsToAdd.length > 0) {
            operations.push(
              ...teamsToAdd.map((teamId) =>
                this.championshipService.addTeamToChampionship(
                  championshipId,
                  teamId
                )
              )
            );
          }

          // Remove teams
          if (teamsToRemove.length > 0) {
            operations.push(
              ...teamsToRemove.map((teamId) =>
                this.championshipService.removeTeamFromChampionship(
                  championshipId,
                  teamId
                )
              )
            );
          }

          return operations.length > 0 ? forkJoin(operations) : of(null);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/championship', championshipId]);
        },
        error: () => {
          this.errorMessage.set(
            'Championship konnte nicht aktualisiert werden.'
          );
          this.isLoading.set(false);
        },
      });
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onUploadError(error: string): void {
    this.errorMessage.set(error);
  }

  onCancel() {
    const id = this.championshipId();
    if (id) {
      this.router.navigate(['/championship', id]);
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
