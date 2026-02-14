import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent {
  private readonly uploadService = inject(UploadService);
  private readonly translate = inject(TranslateService);

  // Inputs
  uploadCategory = input.required<'teams' | 'users' | 'championships'>();
  currentImageUrl = input<string | null>(null);
  label = input<string>('imageUpload.label');
  maxSizeMB = input<number>(2);

  // Outputs
  imageUploaded = output<string>();
  uploadError = output<string>();

  // Local State
  previewUrl = signal<string | null>(null);
  isUploading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Computed
  displayImageUrl = computed(() => {
    const preview = this.previewUrl();
    const current = this.currentImageUrl();
    return preview || current;
  });

  hasImage = computed(() => !!this.displayImageUrl());

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.errorMessage.set(null);

    // Client-side validation
    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage.set(validationError);
      this.uploadError.emit(validationError);
      return;
    }

    // Generate preview
    this.generatePreview(file);

    // Upload file
    this.uploadFile(file);
  }

  private validateFile(file: File): string | null {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return this.translate.instant('imageUpload.errors.fileType');
    }

    // Check file size
    const maxSizeBytes = this.maxSizeMB() * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return this.translate.instant('imageUpload.errors.fileSize', {
        size: this.maxSizeMB(),
      });
    }

    return null;
  }

  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.uploadService.uploadImage(file, this.uploadCategory()).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.imageUploaded.emit(response.url);
      },
      error: (error) => {
        this.isUploading.set(false);
        const errorMsg =
          error.error?.message ||
          this.translate.instant('imageUpload.errors.uploadFailed');
        this.errorMessage.set(errorMsg);
        this.uploadError.emit(errorMsg);
        this.previewUrl.set(null);
      },
    });
  }

  removeImage(): void {
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.imageUploaded.emit('');
  }
}
