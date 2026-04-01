import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Championship } from '../../types/championship.interface';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ChampionshipService } from '../../services/championship.service';
import { MembershipService } from '../../../shared/services/membership.service';
import { MembershipStatus } from '../../../shared/types/membership.interface';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-championship-card',
  imports: [RouterModule, ConfirmationDialogComponent, TranslateModule],
  templateUrl: './championship-card.component.html',
  styleUrl: './championship-card.component.scss',
})
export class ChampionshipCardComponent implements OnInit {
  championship = input<Championship>();

  private readonly persistingService = inject(PersistingService);
  private readonly championshipService = inject(ChampionshipService);
  private readonly membershipService = inject(MembershipService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly currentUser = this.persistingService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly showDeleteDialog = signal(false);
  readonly isDeleting = signal(false);
  readonly pendingRequestsCount = signal(0);
  readonly hasPendingRequests = computed(() => this.pendingRequestsCount() > 0);
  readonly currentRoundTipLabel = computed(
    () => this.championship()?.currentRoundTipLabel ?? null,
  );
  readonly currentRoundTipTextKey = computed(() => {
    const status = this.currentRoundTipLabel()?.status;
    if (status === 'missing_all') {
      return 'championshipCard.roundTipLabel.missingAll';
    }
    if (status === 'missing_some') {
      return 'championshipCard.roundTipLabel.missingSome';
    }
    if (status === 'all_tipped') {
      return 'championshipCard.roundTipLabel.allTipped';
    }
    return null;
  });
  readonly currentRoundTipTextParams = computed(() => {
    const label = this.currentRoundTipLabel();
    if (!label || label.status !== 'missing_some') {
      return {};
    }

    return {
      tipped: label.tippedGamesCount,
      total: label.totalGamesCount,
    };
  });

  // Membership state signals
  readonly membershipStatus = signal<MembershipStatus | null>(null);
  readonly isCheckingMembership = signal(false);
  readonly isJoining = signal(false);

  // Dialog signals
  readonly showJoinConfirmDialog = signal(false);
  readonly joinConfirmMessage = computed(() => {
    const championship = this.championship();
    return championship?.isPublic
      ? this.translate.instant('championshipCard.join.publicMessage')
      : this.translate.instant('championshipCard.join.privateMessage');
  });

  // Expose MembershipStatus enum for template
  readonly MembershipStatus = MembershipStatus;

  ngOnInit() {
    // Load membership status on init
    const championship = this.championship();
    if (championship && this.currentUser()) {
      this.loadMembershipStatus();
      if (this.isAdmin()) {
        this.loadPendingRequests();
      }
    }
  }

  private loadPendingRequests() {
    const championship = this.championship();
    if (!championship) {
      return;
    }

    this.membershipService.getPendingMemberships(championship.id).subscribe({
      next: (response) => {
        this.pendingRequestsCount.set(response.pendingRequests.length);
      },
      error: () => {
        this.pendingRequestsCount.set(0);
      },
    });
  }

  private loadMembershipStatus() {
    const championship = this.championship();
    if (!championship) return;

    this.membershipService.getMembershipStatus(championship.id).subscribe({
      next: (response) => {
        if (response.membership) {
          this.membershipStatus.set(response.membership.status);
        }
      },
      error: () => {
        // Silently fail - user can still try to join
      },
    });
  }

  onCardClick() {
    // Prevent navigation during loading
    if (this.isCheckingMembership() || this.isJoining()) {
      return;
    }

    const championship = this.championship();
    if (!championship) return;

    const status = this.membershipStatus();

    // If PENDING or REJECTED, don't navigate - status is shown in card
    if (status === MembershipStatus.PENDING || status === MembershipStatus.REJECTED) {
      return;
    }

    // If ACTIVE, navigate directly
    if (status === MembershipStatus.ACTIVE) {
      this.navigateToChampionship();
      return;
    }

    // No membership exists - show join confirm
    this.showJoinConfirmDialog.set(true);
  }

  handleJoinConfirm() {
    const championship = this.championship();
    if (!championship) return;

    this.isJoining.set(true);

    this.membershipService.joinChampionship(championship.id).subscribe({
      next: (response) => {
        this.isJoining.set(false);
        this.showJoinConfirmDialog.set(false);
        
        // Update membership status in card
        this.membershipStatus.set(response.membership.status);

        if (response.membership.status === MembershipStatus.ACTIVE) {
          // Public championship - joined directly, navigate
          this.navigateToChampionship();
        }
        // If PENDING: Status is now shown in card, no navigation
      },
      error: () => {
        this.isJoining.set(false);
        this.showJoinConfirmDialog.set(false);
      },
    });
  }

  onReRequestClick(event: Event) {
    // Prevent card click
    event.stopPropagation();
    
    const championship = this.championship();
    if (!championship) return;

    this.isJoining.set(true);

    this.membershipService.joinChampionship(championship.id).subscribe({
      next: (response) => {
        this.isJoining.set(false);
        this.membershipStatus.set(response.membership.status);
      },
      error: () => {
        this.isJoining.set(false);
      },
    });
  }

  private navigateToChampionship() {
    this.router.navigate(['/championship', this.championship()?.id]);
  }

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
