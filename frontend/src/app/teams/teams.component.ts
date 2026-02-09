import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Team } from './types/team.interface';
import { TeamService } from './services/team.service';
import { ImageUploadComponent } from '../shared/components/image-upload/image-upload.component';
import { PersistingService } from '../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImageUploadComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly persistingService = inject(PersistingService);

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly uploadedLogoUrl = signal<string | null>(null);

  // Edit-Funktionalität
  readonly editingTeamId = signal<string | null>(null);
  readonly editLogoUrl = signal<string | null>(null);
  readonly isSaving = signal(false);

  // Delete-Dialog
  readonly showDeleteDialog = signal(false);
  readonly teamToDelete = signal<Team | null>(null);

  readonly isAdmin = computed(
    () => this.persistingService.currentUser()?.role === 'admin'
  );

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    shortName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(10),
    ]),
    logoUrl: this.fb.nonNullable.control('', [Validators.required]),
  });

  readonly editForm = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    shortName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(10),
    ]),
    logoUrl: this.fb.nonNullable.control('', [Validators.required]),
  });

  constructor() {
    this.loadTeams();
  }

  loadTeams() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Teams konnten nicht geladen werden.');
        this.isLoading.set(false);
        this.teams.set([]);
      },
    });
  }

  onImageUploaded(url: string) {
    this.uploadedLogoUrl.set(url);
    this.form.patchValue({ logoUrl: url });
  }

  onUploadError(error: string) {
    this.errorMessage.set(error);
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newTeam: Omit<Team, 'id' | 'createdAt'> = {
      name: this.form.value.name ?? '',
      shortName: this.form.value.shortName ?? '',
      logoUrl: this.form.value.logoUrl ?? '',
    };

    this.teamService.createTeam(newTeam).subscribe({
      next: () => {
        this.form.reset();
        this.submitted.set(false);
        this.uploadedLogoUrl.set(null);
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set('Team konnte nicht erstellt werden.');
        this.isLoading.set(false);
      },
    });
  }

  onEditClick(team: Team) {
    this.editingTeamId.set(team.id);
    this.editLogoUrl.set(team.logoUrl);
    this.editForm.patchValue({
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
    });
  }

  onCancelEdit() {
    this.editingTeamId.set(null);
    this.editLogoUrl.set(null);
    this.editForm.reset();
  }

  onEditImageUploaded(url: string) {
    this.editLogoUrl.set(url);
    this.editForm.patchValue({ logoUrl: url });
  }

  onSaveEdit(teamId: string) {
    if (this.editForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<Team> = {
      name: this.editForm.value.name ?? undefined,
      shortName: this.editForm.value.shortName ?? undefined,
      logoUrl: this.editForm.value.logoUrl ?? undefined,
    };

    this.teamService.updateTeam(teamId, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingTeamId.set(null);
        this.editLogoUrl.set(null);
        this.editForm.reset();
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set('Team konnte nicht aktualisiert werden.');
        this.isSaving.set(false);
      },
    });
  }

  onDeleteClick(team: Team) {
    this.teamToDelete.set(team);
    this.showDeleteDialog.set(true);
  }

  handleDeleteCancel() {
    this.showDeleteDialog.set(false);
    this.teamToDelete.set(null);
  }

  handleDeleteConfirm() {
    const team = this.teamToDelete();
    if (!team) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.teamService.deleteTeam(team.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.teamToDelete.set(null);
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set('Team konnte nicht gelöscht werden.');
        this.isLoading.set(false);
        this.showDeleteDialog.set(false);
        this.teamToDelete.set(null);
      },
    });
  }
}
