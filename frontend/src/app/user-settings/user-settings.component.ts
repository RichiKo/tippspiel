import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PersistingService } from '../auth/services/persisisting.service';
import { UpdateUserDto, UserService } from '../shared/services/user.service';
import {
  UI_ICONS,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiPageHeaderComponent,
} from '../ui-lib/public-api';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiPageHeaderComponent,
  ],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);
  private readonly userService = inject(UserService);

  readonly currentUser = this.persistingService.currentUser;
  readonly icons = UI_ICONS;

  username = signal('');
  email = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  imageUrl = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  isUploadingImage = signal(false);

  readonly passwordsMatch = computed(() => {
    const newPassword = this.newPassword();
    const confirmPassword = this.confirmPassword();
    return !newPassword || !confirmPassword || newPassword === confirmPassword;
  });

  readonly isFormValid = computed(() => {
    const hasUsername = this.username().trim().length > 0;
    const hasEmail = this.email().trim().length > 0;
    const emailValid = this.isValidEmail(this.email());

    if (!hasUsername || !hasEmail || !emailValid) {
      return false;
    }

    if (this.newPassword() || this.confirmPassword()) {
      const passwordValid = this.newPassword().length >= 6;
      return passwordValid && this.passwordsMatch();
    }

    return true;
  });

  constructor() {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.username.set(user.username);
    this.email.set(user.email);
    this.imageUrl.set(user.image || '');
    this.previewUrl.set(user.image || null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.error.set('Nur JPG, PNG und WebP Dateien sind erlaubt.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.error.set('Die Datei ist zu gross. Maximal 2MB sind erlaubt.');
      return;
    }

    this.selectedFile.set(file);
    this.error.set(null);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      this.previewUrl.set(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async onSave(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      let uploadedImageUrl = this.imageUrl();
      const selectedFile = this.selectedFile();

      if (selectedFile) {
        this.isUploadingImage.set(true);
        const uploadResponse = await firstValueFrom(
          this.userService.uploadUserImage(selectedFile),
        );
        uploadedImageUrl = uploadResponse.url;
        this.isUploadingImage.set(false);
      }

      const updateData: UpdateUserDto = {
        username: this.username(),
        email: this.email(),
        image: uploadedImageUrl,
      };

      if (this.newPassword()) {
        updateData.password = this.newPassword();
      }

      await firstValueFrom(this.userService.updateUser(updateData));

      this.success.set('Einstellungen erfolgreich gespeichert!');
      this.isLoading.set(false);

      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.selectedFile.set(null);

      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (error: unknown) {
      const typedError = error as { error?: { message?: string } };
      this.error.set(
        typedError.error?.message || 'Fehler beim Speichern der Einstellungen.',
      );
      this.isLoading.set(false);
      this.isUploadingImage.set(false);
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
