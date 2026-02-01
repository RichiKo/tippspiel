import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChampionshipService } from '../../services/championship.service';
import { Championship } from '../../types/championship.interface';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-add-championship',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './add-championship.component.html',
  styleUrl: './add-championship.component.scss',
})
export class AddChampionshipComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(64),
    ]),
    description: this.fb.control<string | null>('', [
      Validators.maxLength(256),
    ]),
    image: this.fb.nonNullable.control('', [Validators.required]),
    isPublic: this.fb.nonNullable.control(true),
    isActive: this.fb.nonNullable.control(true),
  });
  readonly submitted = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onUploadError(error: string): void {
    this.errorMessage.set(error);
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: Omit<Championship, 'id' | 'createdAt' | 'updatedAt'> = {
      name: this.form.value.name ?? '',
      description: this.form.value.description ?? undefined,
      image: this.form.value.image ?? '',
      isPublic: this.form.value.isPublic ?? true,
      isActive: this.form.value.isActive ?? true,
      createdByUserId: '',
    };

    this.championshipService.createChampionship(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.form.reset({ isPublic: true, isActive: true });
        this.submitted.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Championship konnte nicht erstellt werden.');
      },
    });
  }
}
