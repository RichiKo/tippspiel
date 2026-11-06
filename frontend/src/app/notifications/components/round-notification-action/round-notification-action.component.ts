import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  InjectionToken,
  input,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, RefreshCw, Send } from 'lucide-angular';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { UiButtonComponent } from '../../../ui-lib/public-api';
import { NotificationApiService } from '../../notification-api.service';
import {
  DispatchSummary,
  NotificationType,
  RoundNotificationStatus,
} from '../../notification.types';

// Dialogs destroy their content on close; uncertain requests must survive remounts.
const ROUND_NOTIFICATION_REQUESTS = new InjectionToken<Map<string, string>>(
  'RoundNotificationRequests',
  {
    providedIn: 'root',
    factory: () => new Map<string, string>(),
  },
);

@Component({
  selector: 'app-round-notification-action',
  standalone: true,
  imports: [DatePipe, TranslateModule, LucideAngularModule, UiButtonComponent],
  templateUrl: './round-notification-action.component.html',
  styleUrl: './round-notification-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundNotificationActionComponent implements OnDestroy {
  readonly roundId = input<string | null | undefined>(null);
  readonly type = input.required<NotificationType>();
  readonly visible = input(false);

  private readonly api = inject(NotificationApiService);
  private readonly users = inject(PersistingService);
  private readonly requests = inject(ROUND_NOTIFICATION_REQUESTS);
  private revision = 0;

  readonly icons = { send: Send, refresh: RefreshCw };
  readonly status = signal<RoundNotificationStatus | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly confirming = signal(false);
  readonly pendingRequest = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly context = computed(() => {
    const user = this.users.currentUser();
    const roundId = this.roundId()?.trim();
    if (
      !this.visible() ||
      !roundId ||
      !user ||
      !['admin', 'super_admin'].includes(user.role)
    ) {
      return null;
    }
    const type = this.type();
    return { roundId, type, key: `${user.id}:${roundId}:${type}` };
  });
  readonly canSend = computed(() => {
    const status = this.status();
    return Boolean(
      this.context() &&
        status?.enabled &&
        status.recipientDevices > 0 &&
        !this.loading() &&
        !this.busy() &&
        !(this.type() === 'new_round' && status.announced),
    );
  });
  readonly dispatches = computed(
    () =>
      this.status()?.dispatches.filter(
        (dispatch) => dispatch.type === this.type(),
      ) ?? [],
  );

  constructor() {
    effect(() => {
      const context = this.context();
      untracked(() => {
        this.revision++;
        this.status.set(null);
        this.loading.set(false);
        this.busy.set(false);
        this.confirming.set(false);
        this.error.set(null);
        this.message.set(null);
        if (!context) return;
        this.pendingRequest.set(this.requests.has(context.key));
        void this.refresh();
      });
    });
  }

  ngOnDestroy(): void {
    this.revision++;
  }

  async refresh(): Promise<void> {
    const context = this.context();
    if (!context || this.loading() || this.busy()) return;
    const revision = ++this.revision;
    this.loading.set(true);
    this.error.set(null);
    try {
      const status = await this.api.roundStatus(context.roundId);
      if (this.isCurrent(revision, context.key)) this.status.set(status);
    } catch {
      if (this.isCurrent(revision, context.key))
        this.error.set('notifications.admin.loadFailed');
    } finally {
      if (this.isCurrent(revision, context.key)) this.loading.set(false);
    }
  }

  preview(): void {
    if (!this.canSend()) return;
    this.message.set(null);
    this.confirming.set(true);
  }

  cancel(): void {
    if (!this.busy()) this.confirming.set(false);
  }

  async send(): Promise<void> {
    const context = this.context();
    if (!context || !this.confirming() || !this.canSend()) return;
    const revision = this.revision;
    // Keep an uncertain request id so a lost response cannot create a second batch.
    const requestId = this.requests.get(context.key) ?? crypto.randomUUID();
    this.requests.set(context.key, requestId);
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const dispatch = await this.api.send(
        context.roundId,
        context.type,
        requestId,
      );
      if (!this.isCurrent(revision, context.key)) return;
      if (this.requests.get(context.key) === requestId)
        this.requests.delete(context.key);
      this.pendingRequest.set(false);
      this.confirming.set(false);
      if (dispatch) {
        this.updateDispatch(dispatch);
      } else {
        this.status.update((status) =>
          status ? { ...status, recipientUsers: 0, recipientDevices: 0 } : null,
        );
        this.message.set('notifications.admin.noRecipients');
      }
    } catch (error: unknown) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? error.status
          : 0;
      if (
        typeof status === 'number' &&
        status >= 400 &&
        status < 500 &&
        status !== 408 &&
        this.requests.get(context.key) === requestId
      )
        this.requests.delete(context.key);
      if (!this.isCurrent(revision, context.key)) return;
      this.pendingRequest.set(this.requests.has(context.key));
      this.error.set(
        this.pendingRequest()
          ? 'notifications.admin.sendUncertain'
          : 'notifications.admin.sendFailed',
      );
    } finally {
      if (this.isCurrent(revision, context.key)) this.busy.set(false);
    }
  }

  async retry(id: string): Promise<void> {
    const context = this.context();
    const dispatch = this.dispatches().find((item) => item.id === id);
    if (
      !context ||
      !this.status()?.enabled ||
      this.busy() ||
      this.loading() ||
      !dispatch?.canRetry ||
      dispatch.inProgress
    )
      return;
    const revision = this.revision;
    this.busy.set(true);
    this.error.set(null);
    try {
      const updated = await this.api.retry(id);
      if (this.isCurrent(revision, context.key)) this.updateDispatch(updated);
    } catch {
      if (this.isCurrent(revision, context.key))
        this.error.set('notifications.admin.retryFailed');
    } finally {
      if (this.isCurrent(revision, context.key)) this.busy.set(false);
    }
  }

  private isCurrent(revision: number, key: string): boolean {
    return this.revision === revision && this.context()?.key === key;
  }

  private updateDispatch(dispatch: DispatchSummary): void {
    this.status.update((status) =>
      status
        ? {
            ...status,
            announced: status.announced || dispatch.type === 'new_round',
            dispatches: [
              dispatch,
              ...status.dispatches.filter((item) => item.id !== dispatch.id),
            ].slice(0, 10),
          }
        : null,
    );
  }
}
