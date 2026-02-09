import { Component, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ConfirmationDialogComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);

  readonly currentUser = this.persistingService.currentUser;
  showLogoutConfirm = signal(false);

  onLogoutClick(): void {
    this.showLogoutConfirm.set(true);
  }

  onLogoutConfirmed(): void {
    this.showLogoutConfirm.set(false);
    this.persistingService.clear();
    this.router.navigate(['/']);
  }

  onLogoutCancelled(): void {
    this.showLogoutConfirm.set(false);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
