import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Team,
  TeamOrigin,
  TEAM_ORIGIN_OPTIONS,
} from '../../types/team.interface';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { TeamService } from '../../services/team.service';
import { MaterialModule } from '../../../material.module';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
} from '../../../ui-lib/public-api';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ConfirmationDialogComponent,
    ImageUploadComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    MaterialModule,
    TranslateModule,
  ],
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  team = input<Team>();

  editClicked = output<string>();
  deleteClicked = output<string>();

  private readonly persistingService = inject(PersistingService);
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly translate = inject(TranslateService);

  readonly icons = UI_ICONS;
  readonly originOptions = TEAM_ORIGIN_OPTIONS;
  readonly isAdmin = computed(
    () => this.persistingService.currentUser()?.role === 'admin',
  );
  readonly showDeleteDialog = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly uploadedLogoUrl = signal<string | null>(null);

  readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    logoUrl: ['', [Validators.required]],
    origin: [TeamOrigin.ENGLAND, [Validators.required]],
  });

  onEditClick(): void {
    const team = this.team();
    if (!team) {
      return;
    }

    this.editForm.patchValue({
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      origin: team.origin,
    });
    this.uploadedLogoUrl.set(team.logoUrl);
    this.isEditing.set(true);
  }

  onCancelEdit(): void {
    this.isEditing.set(false);
    this.uploadedLogoUrl.set(null);
    this.editForm.reset();
  }

  onImageUploaded(url: string): void {
    this.uploadedLogoUrl.set(url);
    this.editForm.patchValue({ logoUrl: url });
  }

  onSaveEdit(): void {
    const team = this.team();
    if (!team || this.editForm.invalid) {
      return;
    }

    this.isSaving.set(true);

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

    this.teamService.updateTeam(team.id, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.uploadedLogoUrl.set(null);
        this.editClicked.emit(team.id);
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  getOriginLabel(origin: TeamOrigin): string {
    return this.translate.instant(`teams.origin.${origin}`);
  }

  onDeleteClick(): void {
    this.showDeleteDialog.set(true);
  }

  handleDeleteCancel(): void {
    this.showDeleteDialog.set(false);
  }

  handleDeleteConfirm(): void {
    const id = this.team()?.id;
    if (!id) {
      return;
    }

    this.deleteClicked.emit(id);
    this.showDeleteDialog.set(false);
  }
}
