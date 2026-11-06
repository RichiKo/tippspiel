import { NotificationPayload, NotificationType } from './notification.types';

const templates = {
  uk: {
    new_round: (round: string) =>
      `Створено новий тур «${round}». Час робити прогнози!`,
    round_results: (round: string) =>
      `У турі «${round}» опубліковано нові результати.`,
  },
};

export function notificationPreview(
  type: NotificationType,
  championship: string,
  round: string,
) {
  return {
    title: `TippsLiga · ${championship}`,
    body: templates.uk[type](round),
  };
}

export function notificationPayload(
  preview: { title: string; body: string },
  id: string,
  url: string,
): NotificationPayload {
  return {
    notification: {
      ...preview,
      icon: '/assets/branding/favicon-192.png',
      tag: `tippsliga-${id}`,
      data: {
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url },
        },
      },
    },
  };
}
