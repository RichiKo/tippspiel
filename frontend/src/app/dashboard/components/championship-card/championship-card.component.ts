import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Championship } from '../../types/championship.interface';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ChampionshipService } from '../../services/championship.service';

@Component({
  selector: 'app-championship-card',
  imports: [RouterModule, ConfirmationDialogComponent],
  templateUrl: './championship-card.component.html',
  styleUrl: './championship-card.component.scss',
})
export class ChampionshipCardComponent {
  championship = input<Championship>();

  private readonly persistingService = inject(PersistingService);
  private readonly championshipService = inject(ChampionshipService);
  private readonly router = inject(Router);

  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly showDeleteDialog = signal(false);
  readonly isDeleting = signal(false);

  onDeleteClick() {
    if (!this.isAdmin()) {
      return;
    }
    this.showDeleteDialog.set(true);
  }

  handleDeleteCancel() {
    this.showDeleteDialog.set(false);
  }

  handleDeleteConfirm() {
    const id = this.championship()?.id;
    if (!id) {
      this.showDeleteDialog.set(false);
      return;
    }

    this.isDeleting.set(true);
    this.championshipService.deleteChampionship(id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteDialog.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isDeleting.set(false);
        this.showDeleteDialog.set(false);
      },
    });
  }
}
