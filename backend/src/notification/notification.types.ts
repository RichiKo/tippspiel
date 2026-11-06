export type NotificationType = 'new_round' | 'round_results';
export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'failed'
  | 'expired'
  | 'skipped';

export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    icon: string;
    tag: string;
    data: {
      onActionClick: {
        default: { operation: 'navigateLastFocusedOrOpen'; url: string };
      };
    };
  };
}

export interface DispatchSummary {
  id: string;
  type: NotificationType;
  createdAt: Date;
  recipientCount: number;
  accepted: number;
  failed: number;
  pending: number;
  expired: number;
  skipped: number;
  inProgress: boolean;
  canRetry: boolean;
}

export interface RoundNotificationStatus {
  enabled: boolean;
  recipientUsers: number;
  recipientDevices: number;
  announced: boolean;
  previews: Record<NotificationType, { title: string; body: string }>;
  dispatches: DispatchSummary[];
}
