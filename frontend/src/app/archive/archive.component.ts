import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { PersistingService } from '../auth/services/persisisting.service';
import { MaterialModule } from '../material.module';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UI_ICONS, UiPageHeaderComponent } from '../ui-lib/public-api';
import { ArchiveService } from './services/archive.service';
import {
  ArchiveEntry,
  ArchiveUserOption,
  ArchiveWinnerUser,
  ArchiveWinnerPayload,
  ArchiveWinnerSource,
  CreateArchiveEntryRequest,
} from './types/archive.interface';

type ArchiveWinnerForm = FormGroup<{
  source: FormControl<ArchiveWinnerSource>;
  userId: FormControl<number | null>;
  manualName: FormControl<string>;
  points: FormControl<number>;
}>;

type ArchiveForm = FormGroup<{
  championshipName: FormControl<string>;
  year: FormControl<number>;
  firstPlace: ArchiveWinnerForm;
  secondPlace: ArchiveWinnerForm;
  thirdPlace: ArchiveWinnerForm;
}>;

type ArchivePlace = 'firstPlace' | 'secondPlace' | 'thirdPlace';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    MaterialModule,
    ConfirmationDialogComponent,
    UiPageHeaderComponent,
  ],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss',
})
export class ArchiveComponent {
  private readonly archiveService = inject(ArchiveService);
  private readonly persistingService = inject(PersistingService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly currentYear = new Date().getFullYear();

  readonly icons = UI_ICONS;
  readonly entries = signal<ArchiveEntry[]>([]);
  readonly userOptions = signal<ArchiveUserOption[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly brokenAvatarKeys = signal<Set<string>>(new Set());
  readonly editingEntry = signal<ArchiveEntry | null>(null);
  readonly deleteEntry = signal<ArchiveEntry | null>(null);
  readonly isFormVisible = signal(false);
  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'super_admin';
  });
  readonly formTitleKey = computed(() =>
    this.editingEntry() ? 'archive.form.editTitle' : 'archive.form.createTitle',
  );

  readonly form: ArchiveForm = new FormGroup({
    championshipName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    year: new FormControl(this.currentYear, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1900),
        Validators.max(this.currentYear),
      ],
    }),
    firstPlace: this.createWinnerForm(),
    secondPlace: this.createWinnerForm(),
    thirdPlace: this.createWinnerForm(),
  });

  constructor() {
    this.loadEntries();
    if (this.isAdmin()) {
      this.loadUserOptions();
    }
  }

  loadEntries(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.archiveService.getArchiveEntries().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.isLoading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loadError.set(this.translate.instant('archive.errors.loadFailed'));
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingEntry.set(null);
    this.resetForm();
    this.isFormVisible.set(true);
  }

  openEditForm(entry: ArchiveEntry): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingEntry.set(entry);
    this.submitted.set(false);
    this.formError.set(null);
    this.form.reset({
      championshipName: entry.championshipName,
      year: entry.year,
      firstPlace: this.buildWinnerFormValue(
        entry.firstPlaceUserId,
        entry.firstPlaceManualName,
        entry.firstPlacePoints,
      ),
      secondPlace: this.buildWinnerFormValue(
        entry.secondPlaceUserId,
        entry.secondPlaceManualName,
        entry.secondPlacePoints,
      ),
      thirdPlace: this.buildWinnerFormValue(
        entry.thirdPlaceUserId,
        entry.thirdPlaceManualName,
        entry.thirdPlacePoints,
      ),
    });
    this.isFormVisible.set(true);
  }

  closeForm(): void {
    this.isFormVisible.set(false);
    this.editingEntry.set(null);
    this.formError.set(null);
    this.submitted.set(false);
  }

  submitForm(): void {
    this.submitted.set(true);
    this.formError.set(null);

    const payload = this.buildPayload();
    if (!payload || this.form.invalid) {
      return;
    }

    this.isSaving.set(true);
    const editingEntry = this.editingEntry();
    const request$ = editingEntry
      ? this.archiveService.updateArchiveEntry(editingEntry.id, payload)
      : this.archiveService.createArchiveEntry(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeForm();
        this.loadEntries();
      },
      error: () => {
        this.formError.set(this.translate.instant('archive.errors.saveFailed'));
        this.isSaving.set(false);
      },
    });
  }

  requestDelete(entry: ArchiveEntry): void {
    if (!this.isAdmin()) {
      return;
    }

    this.deleteEntry.set(entry);
  }

  cancelDelete(): void {
    this.deleteEntry.set(null);
  }

  confirmDelete(): void {
    const entry = this.deleteEntry();
    if (!entry) {
      return;
    }

    this.isDeleting.set(true);
    this.archiveService.deleteArchiveEntry(entry.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteEntry.set(null);
        this.loadEntries();
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteEntry.set(null);
        this.loadError.set(this.translate.instant('archive.errors.deleteFailed'));
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getWinnerDisplayName(entry: ArchiveEntry, place: ArchivePlace): string {
    const user = this.getWinnerUser(entry, place);
    if (this.getWinnerUserId(entry, place) !== null && user?.username) {
      return user.username;
    }

    if (place === 'firstPlace') {
      return entry.firstPlaceDisplayName;
    }

    if (place === 'secondPlace') {
      return entry.secondPlaceDisplayName;
    }

    return entry.thirdPlaceDisplayName;
  }

  getWinnerUser(entry: ArchiveEntry, place: ArchivePlace): ArchiveWinnerUser | null {
    const user = this.getEntryWinnerUser(entry, place);
    const userId = this.getWinnerUserId(entry, place);
    const optionUser = userId
      ? this.userOptions().find((option) => option.id === userId)
      : undefined;
    const currentUser = this.currentUser();
    const currentWinnerUser =
      userId && currentUser?.id === userId
        ? {
            id: currentUser.id,
            username: currentUser.username,
            image: currentUser.image,
          }
        : undefined;

    if (!user) {
      return currentWinnerUser ?? optionUser ?? null;
    }

    if (!this.hasImage(user.image) && currentWinnerUser?.image) {
      return {
        ...user,
        image: currentWinnerUser.image,
      };
    }

    if (!this.hasImage(user.image) && optionUser?.image) {
      return {
        ...user,
        image: optionUser.image,
      };
    }

    return user;
  }

  getWinnerPoints(entry: ArchiveEntry, place: ArchivePlace): number {
    if (place === 'firstPlace') {
      return entry.firstPlacePoints;
    }

    if (place === 'secondPlace') {
      return entry.secondPlacePoints;
    }

    return entry.thirdPlacePoints;
  }

  hasRegisteredWinner(entry: ArchiveEntry, place: ArchivePlace): boolean {
    if (place === 'firstPlace') {
      return entry.firstPlaceUserId !== null;
    }

    if (place === 'secondPlace') {
      return entry.secondPlaceUserId !== null;
    }

    return entry.thirdPlaceUserId !== null;
  }

  shouldRenderWinnerAvatarImage(entry: ArchiveEntry, place: ArchivePlace): boolean {
    const user = this.getWinnerUser(entry, place);
    return this.hasImage(user?.image) && !this.brokenAvatarKeys().has(this.getAvatarKey(entry, place));
  }

  getWinnerInitial(entry: ArchiveEntry, place: ArchivePlace): string {
    return this.getWinnerDisplayName(entry, place).charAt(0).toUpperCase() || '?';
  }

  onWinnerAvatarError(entry: ArchiveEntry, place: ArchivePlace): void {
    const key = this.getAvatarKey(entry, place);
    this.brokenAvatarKeys.update((keys) => {
      const next = new Set(keys);
      next.add(key);
      return next;
    });
  }

  private loadUserOptions(): void {
    this.archiveService.getArchiveUserOptions().subscribe({
      next: (users) => this.userOptions.set(users),
      error: () => this.userOptions.set([]),
    });
  }

  private createWinnerForm(): ArchiveWinnerForm {
    return new FormGroup({
      source: new FormControl<ArchiveWinnerSource>('manual', {
        nonNullable: true,
      }),
      userId: new FormControl<number | null>(null),
      manualName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(100)],
      }),
      points: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  private resetForm(): void {
    this.submitted.set(false);
    this.formError.set(null);
    this.form.reset({
      championshipName: '',
      year: this.currentYear,
      firstPlace: this.buildWinnerFormValue(null, '', 0),
      secondPlace: this.buildWinnerFormValue(null, '', 0),
      thirdPlace: this.buildWinnerFormValue(null, '', 0),
    });
  }

  private buildWinnerFormValue(
    userId: number | null,
    manualName: string | null,
    points: number,
  ): {
    source: ArchiveWinnerSource;
    userId: number | null;
    manualName: string;
    points: number;
  } {
    return {
      source: userId ? 'user' : 'manual',
      userId,
      manualName: manualName ?? '',
      points,
    };
  }

  private buildPayload(): CreateArchiveEntryRequest | null {
    const firstPlace = this.buildWinnerPayload('firstPlace');
    const secondPlace = this.buildWinnerPayload('secondPlace');
    const thirdPlace = this.buildWinnerPayload('thirdPlace');

    if (!firstPlace || !secondPlace || !thirdPlace) {
      return null;
    }

    if (!this.areWinnersUnique([firstPlace, secondPlace, thirdPlace])) {
      this.formError.set(this.translate.instant('archive.validation.uniqueWinners'));
      return null;
    }

    return {
      championshipName: this.form.controls.championshipName.value.trim(),
      year: this.form.controls.year.value,
      firstPlace,
      secondPlace,
      thirdPlace,
    };
  }

  private buildWinnerPayload(place: ArchivePlace): ArchiveWinnerPayload | null {
    const group = this.form.controls[place];
    const source = group.controls.source.value;

    if (source === 'user') {
      const userId = group.controls.userId.value;
      if (!userId) {
        this.formError.set(this.translate.instant('archive.validation.userRequired'));
        return null;
      }

      return { userId, points: group.controls.points.value };
    }

    const manualName = group.controls.manualName.value.trim();
    if (!manualName) {
      this.formError.set(this.translate.instant('archive.validation.nameRequired'));
      return null;
    }

    return { manualName, points: group.controls.points.value };
  }

  private areWinnersUnique(winners: ArchiveWinnerPayload[]): boolean {
    const keys = new Set<string>();

    for (const winner of winners) {
      const key =
        winner.userId !== undefined && winner.userId !== null
          ? `user:${winner.userId}`
          : `manual:${this.normalizeName(winner.manualName)}`;

      if (keys.has(key)) {
        return false;
      }

      keys.add(key);
    }

    return true;
  }

  private normalizeName(value: string | null | undefined): string {
    return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
  }

  private getAvatarKey(entry: ArchiveEntry, place: ArchivePlace): string {
    return `${entry.id}:${place}:${this.getWinnerUser(entry, place)?.image ?? ''}`;
  }

  private getEntryWinnerUser(
    entry: ArchiveEntry,
    place: ArchivePlace,
  ): ArchiveWinnerUser | null {
    if (place === 'firstPlace') {
      return entry.firstPlaceUser ?? null;
    }

    if (place === 'secondPlace') {
      return entry.secondPlaceUser ?? null;
    }

    return entry.thirdPlaceUser ?? null;
  }

  private getWinnerUserId(entry: ArchiveEntry, place: ArchivePlace): number | null {
    if (place === 'firstPlace') {
      return entry.firstPlaceUserId;
    }

    if (place === 'secondPlace') {
      return entry.secondPlaceUserId;
    }

    return entry.thirdPlaceUserId;
  }

  private hasImage(image: string | null | undefined): boolean {
    return (image ?? '').trim().length > 0;
  }
}
