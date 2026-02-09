import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersistingService } from '../auth/services/persisisting.service';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-user-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss',
})
export class UserSettingsComponent {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);
  private readonly userService = inject(UserService);

  readonly currentUser = this.persistingService.currentUser;

  // Form fields
  username = signal('');
  email = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  imageUrl = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // UI state
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  isUploadingImage = signal(false);

  readonly passwordsMatch = computed(() => {
    const newPw = this.newPassword();
    const confirmPw = this.confirmPassword();
    return !newPw || !confirmPw || newPw === confirmPw;
  });

  readonly isFormValid = computed(() => {
    const hasUsername = this.username().trim().length > 0;
    const hasEmail = this.email().trim().length > 0;
    const emailValid = this.isValidEmail(this.email());
    
    // Basic validation: username and email must be valid
    if (!hasUsername || !hasEmail || !emailValid) {
      return false;
    }
    
    // If changing password, validate password fields
    if (this.newPassword() || this.confirmPassword()) {
      const passwordValid = this.newPassword().length >= 6;
      const passwordsMatch = this.passwordsMatch();
      return passwordValid && passwordsMatch;
    }
    
    // If not changing password, just validate username and email
    return true;
  });

  constructor() {
    // Initialize form with current user data
    const user = this.currentUser();
    if (user) {
      this.username.set(user.username);
      this.email.set(user.email);
      this.imageUrl.set(user.image || '');
      this.previewUrl.set(user.image || null);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.error.set('Nur JPG, PNG und WebP Dateien sind erlaubt.');
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.error.set('Die Datei ist zu groß. Maximal 2MB sind erlaubt.');
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async onSave(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Upload image first if selected
      let uploadedImageUrl = this.imageUrl();
      if (this.selectedFile()) {
        this.isUploadingImage.set(true);
        const uploadResponse = await this.userService
          .uploadUserImage(this.selectedFile()!)
          .toPromise();
        uploadedImageUrl = uploadResponse!.url;
        this.isUploadingImage.set(false);
      }

      // Prepare update data
      const updateData: any = {
        username: this.username(),
        email: this.email(),
        image: uploadedImageUrl,
      };

      // Only include password if user wants to change it
      if (this.newPassword()) {
        updateData.password = this.newPassword();
      }

      // Update user
      await this.userService.updateUser(updateData).toPromise();

      this.success.set('Einstellungen erfolgreich gespeichert!');
      this.isLoading.set(false);

      // Clear password fields
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.selectedFile.set(null);

      // Navigate back after short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      this.error.set(err.error?.message || 'Fehler beim Speichern der Einstellungen.');
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
