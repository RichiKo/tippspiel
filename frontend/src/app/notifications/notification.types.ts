export type NotificationType = 'new_round' | 'round_results';
export interface NotificationConfig {
  enabled: boolean;
  publicKey: string | null;
}
export interface DispatchSummary {
  id: string;
  type: NotificationType;
  createdAt: string;
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
