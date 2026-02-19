import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Team,
  TeamOrigin,
  TEAM_ORIGIN_OPTIONS,
} from './types/team.interface';
import { TeamService } from './services/team.service';
import { ImageUploadComponent } from '../shared/components/image-upload/image-upload.component';
import { PersistingService } from '../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MaterialModule } from '../material.module';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiPageHeaderComponent,
} from '../ui-lib/public-api';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ImageUploadComponent,
    ConfirmationDialogComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiPageHeaderComponent,
    MaterialModule,
    TranslateModule,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly persistingService = inject(PersistingService);
  private readonly translate = inject(TranslateService);

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly uploadedLogoUrl = signal<string | null>(null);

  readonly editingTeamId = signal<string | null>(null);
  readonly editLogoUrl = signal<string | null>(null);
  readonly isSaving = signal(false);

  readonly showDeleteDialog = signal(false);
  readonly teamToDelete = signal<Team | null>(null);

  readonly icons = UI_ICONS;
  readonly originOptions = TEAM_ORIGIN_OPTIONS;
  readonly sortedOriginOptions = computed(() =>
    [...this.originOptions].sort((a, b) =>
      this.getOriginLabel(a).localeCompare(this.getOriginLabel(b), undefined, {
        sensitivity: 'base',
      }),
    ),
  );

  readonly isAdmin = computed(
    () => this.persistingService.currentUser()?.role === 'admin',
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
    origin: this.fb.nonNullable.control<TeamOrigin>(TeamOrigin.ENGLAND, [
      Validators.required,
    ]),
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
    origin: this.fb.nonNullable.control<TeamOrigin>(TeamOrigin.ENGLAND, [
      Validators.required,
    ]),
  });

  constructor() {
    this.loadTeams();
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadTeams(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('teams.errors.loadFailed'));
        this.isLoading.set(false);
        this.teams.set([]);
      },
    });
  }

  onImageUploaded(url: string): void {
    this.uploadedLogoUrl.set(url);
    this.form.patchValue({ logoUrl: url });
  }

  onUploadError(error: string): void {
    this.errorMessage.set(error);
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newTeam: Omit<Team, 'id' | 'createdAt'> = {
      name: this.form.value.name ?? '',
      shortName: this.form.value.shortName ?? '',
      logoUrl: this.form.value.logoUrl ?? '',
      origin: this.form.value.origin ?? TeamOrigin.ENGLAND,
    };

    this.teamService.createTeam(newTeam).subscribe({
      next: () => {
        this.form.reset();
        this.form.patchValue({ origin: TeamOrigin.ENGLAND });
        this.submitted.set(false);
        this.uploadedLogoUrl.set(null);
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('teams.errors.createFailed'));
        this.isLoading.set(false);
      },
    });
  }

  onEditClick(team: Team): void {
    this.editingTeamId.set(team.id);
    this.editLogoUrl.set(team.logoUrl);
    this.editForm.patchValue({
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      origin: team.origin,
    });
  }

  onCancelEdit(): void {
    this.editingTeamId.set(null);
    this.editLogoUrl.set(null);
    this.editForm.reset();
  }

  onEditImageUploaded(url: string): void {
    this.editLogoUrl.set(url);
    this.editForm.patchValue({ logoUrl: url });
  }

  onSaveEdit(teamId: string): void {
    if (this.editForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<Team> = {};
    const name = this.editForm.value.name;
    const shortName = this.editForm.value.shortName;
    const logoUrl = this.editForm.value.logoUrl;
    const origin = this.editForm.value.origin;

    if (name) {
      updateData.name = name;
    }
    if (shortName) {
      updateData.shortName = shortName;
    }
    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }
    if (origin) {
      updateData.origin = origin;
    }

    this.teamService.updateTeam(teamId, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingTeamId.set(null);
        this.editLogoUrl.set(null);
        this.editForm.reset();
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('teams.errors.updateFailed'));
        this.isSaving.set(false);
      },
    });
  }

  getOriginLabel(origin: TeamOrigin): string {
    return this.translate.instant(`teams.origin.${origin}`);
  }

  onDeleteClick(team: Team): void {
    this.teamToDelete.set(team);
    this.showDeleteDialog.set(true);
  }

  handleDeleteCancel(): void {
    this.showDeleteDialog.set(false);
    this.teamToDelete.set(null);
  }

  handleDeleteConfirm(): void {
    const team = this.teamToDelete();
    if (!team) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.teamService.deleteTeam(team.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.teamToDelete.set(null);
        this.loadTeams();
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('teams.errors.deleteFailed'));
        this.isLoading.set(false);
        this.showDeleteDialog.set(false);
        this.teamToDelete.set(null);
      },
    });
  }
}
