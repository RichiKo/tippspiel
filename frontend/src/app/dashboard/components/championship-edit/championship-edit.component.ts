import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship.service';
import { Championship } from '../../types/championship.interface';

@Component({
  selector: 'app-championship-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './championship-edit.component.html',
  styleUrl: './championship-edit.component.scss',
})
export class ChampionshipEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly championshipService = inject(ChampionshipService);

  private readonly championshipId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    description: ['', [Validators.maxLength(256)]],
    image: ['', [Validators.required]],
    isPublic: [true],
    isActive: [true],
  });

  readonly canSubmit = computed(
    () => !this.isLoading() && this.form.valid && !!this.championshipId(),
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.championshipId.set(id);
    this.loadChampionship(id);
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
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Championship konnte nicht geladen werden.');
        this.isLoading.set(false);
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

    this.championshipService
      .updateChampionship(this.championshipId()!, payload)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMessage.set(
            'Championship konnte nicht aktualisiert werden.',
          );
          this.isLoading.set(false);
        },
      });
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }
}
