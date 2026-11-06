import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { UI_ICONS } from '../../../ui-lib/public-api';
import { PushClientService } from '../../../notifications/push-client.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    ConfirmationDialogComponent,
    TranslateModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly persistingService = inject(PersistingService);
  private readonly push = inject(PushClientService);

  readonly currentUser = this.persistingService.currentUser;
  readonly icons = UI_ICONS;
  readonly showLogoutConfirm = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly logoutBusy = signal(false);
  readonly logoutError = signal<string | null>(null);

  onLogoutClick(): void {
    this.isMobileMenuOpen.set(false);
    this.showLogoutConfirm.set(true);
  }

  async onLogoutConfirmed(): Promise<void> {
    if (this.logoutBusy()) return;
    this.showLogoutConfirm.set(false);
    this.logoutBusy.set(true);
    this.logoutError.set(null);
    const detached = await this.push.disable();
    this.logoutBusy.set(false);
    if (!detached) {
      this.logoutError.set('notifications.settings.disableFailed');
      return;
    }
    this.persistingService.clear();
    this.router.navigate(['/']);
  }

  onLogoutCancelled(): void {
    this.showLogoutConfirm.set(false);
  }

  navigateToSettings(): void {
    this.isMobileMenuOpen.set(false);
    this.router.navigate(['/settings']);
  }

  navigateToDashboard(): void {
    this.isMobileMenuOpen.set(false);
    this.router.navigate(['/dashboard']);
  }

  onMobileMenuToggle(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  onMobileMenuClose(): void {
    this.isMobileMenuOpen.set(false);
  }
}
