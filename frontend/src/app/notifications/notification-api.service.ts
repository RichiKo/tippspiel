import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DispatchSummary,
  NotificationConfig,
  NotificationType,
  RoundNotificationStatus,
} from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  config(): Promise<NotificationConfig> {
    return firstValueFrom(
      this.http.get<NotificationConfig>('/api/notifications/config'),
    );
  }
  register(subscription: PushSubscription): Promise<{ id: string }> {
    const value = subscription.toJSON();
    return firstValueFrom(
      this.http.post<{ id: string }>('/api/notifications/subscriptions', {
        endpoint: value.endpoint,
        keys: value.keys,
        locale: 'uk',
      }),
    );
  }
  remove(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `/api/notifications/subscriptions/${encodeURIComponent(id)}`,
      ),
    );
  }
  test(id: string): Promise<{ accepted: boolean }> {
    return firstValueFrom(
      this.http.post<{ accepted: boolean }>(
        `/api/notifications/subscriptions/${encodeURIComponent(id)}/test`,
        {},
      ),
    );
  }
  roundStatus(id: string): Promise<RoundNotificationStatus> {
    return firstValueFrom(
      this.http.get<RoundNotificationStatus>(
        `/api/rounds/${encodeURIComponent(id)}/notifications`,
      ),
    );
  }
  send(
    id: string,
    type: NotificationType,
    requestId: string,
  ): Promise<DispatchSummary | null> {
    return firstValueFrom(
      this.http.post<DispatchSummary | null>(
        `/api/rounds/${encodeURIComponent(id)}/notifications`,
        { type, requestId },
      ),
    );
  }
  retry(id: string): Promise<DispatchSummary> {
    return firstValueFrom(
      this.http.post<DispatchSummary>(
        `/api/notifications/dispatches/${encodeURIComponent(id)}/retry`,
        {},
      ),
    );
  }
}
