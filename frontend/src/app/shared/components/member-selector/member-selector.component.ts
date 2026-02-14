import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembershipService } from '../../services/membership.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Membership,
  MembershipStatus,
} from '../../types/membership.interface';

@Component({
  selector: 'app-member-selector',
  imports: [CommonModule, TranslateModule],
  templateUrl: './member-selector.component.html',
  styleUrl: './member-selector.component.scss',
})
export class MemberSelectorComponent implements OnInit {
  // Inputs
  championshipId = input.required<string>();
  showActiveMembers = input<boolean>(false);
  disabled = input<boolean>(false);

  // Inject services
  private readonly membershipService = inject(MembershipService);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly pendingRequests = signal<Membership[]>([]);
  readonly activeMembers = signal<Membership[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isProcessing = signal<string | null>(null); // membershipId being processed
  readonly brokenAvatarMembershipIds = signal<Set<string>>(new Set());

  // Outputs
  membershipChanged = output<void>();

  ngOnInit() {
    this.loadPendingRequests();
    if (this.showActiveMembers()) {
      this.loadActiveMembers();
    }
  }

  private loadPendingRequests() {
    this.isLoading.set(true);
    this.membershipService
      .getPendingMemberships(this.championshipId())
      .subscribe({
        next: (response) => {
          this.pendingRequests.set(response.pendingRequests);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            this.translate.instant('memberSelector.errors.loadRequests'),
          );
          this.isLoading.set(false);
        },
      });
  }

  private loadActiveMembers() {
    this.membershipService
      .getChampionshipMembers(this.championshipId(), MembershipStatus.ACTIVE)
      .subscribe({
        next: (response) => {
          this.activeMembers.set(response.members);
        },
        error: () => {
          this.errorMessage.set(
            this.translate.instant('memberSelector.errors.loadMembers'),
          );
        },
      });
  }

  onApprove(membershipId: string) {
    if (this.disabled()) return;

    this.isProcessing.set(membershipId);
    this.membershipService.approveMembership(membershipId).subscribe({
      next: () => {
        this.isProcessing.set(null);
        this.loadPendingRequests();
        if (this.showActiveMembers()) {
          this.loadActiveMembers();
        }
        this.membershipChanged.emit();
      },
      error: () => {
        this.isProcessing.set(null);
        this.errorMessage.set(
          this.translate.instant('memberSelector.errors.approve'),
        );
      },
    });
  }

  onReject(membershipId: string) {
    if (this.disabled()) return;

    this.isProcessing.set(membershipId);
    this.membershipService.rejectMembership(membershipId).subscribe({
      next: () => {
        this.isProcessing.set(null);
        this.loadPendingRequests();
        this.membershipChanged.emit();
      },
      error: () => {
        this.isProcessing.set(null);
        this.errorMessage.set(
          this.translate.instant('memberSelector.errors.reject'),
        );
      },
    });
  }

  onRemove(membershipId: string) {
    if (this.disabled()) return;

    this.isProcessing.set(membershipId);
    this.membershipService.removeMembership(membershipId).subscribe({
      next: () => {
        this.isProcessing.set(null);
        this.loadActiveMembers();
        this.membershipChanged.emit();
      },
      error: () => {
        this.isProcessing.set(null);
        this.errorMessage.set(
          this.translate.instant('memberSelector.errors.remove'),
        );
      },
    });
  }

  shouldRenderAvatarImage(membership: Membership): boolean {
    const image = membership.user?.image;
    return !!image && !this.brokenAvatarMembershipIds().has(membership.id);
  }

  getUserInitial(membership: Membership): string {
    return membership.user?.username?.charAt(0).toUpperCase() || 'N';
  }

  onAvatarError(membershipId: string): void {
    this.brokenAvatarMembershipIds.update((ids) => {
      const next = new Set(ids);
      next.add(membershipId);
      return next;
    });
  }
}
