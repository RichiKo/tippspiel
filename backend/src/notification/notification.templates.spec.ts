import {
  notificationPayload,
  notificationPreview,
} from './notification.templates';

describe('notification templates', () => {
  it('renders a new-round invitation with the championship and round names', () => {
    expect(
      notificationPreview('new_round', 'Premier League', 'Round 12'),
    ).toEqual({
      title: 'TippsLiga \u00b7 Premier League',
      body: '\u0421\u0442\u0432\u043e\u0440\u0435\u043d\u043e \u043d\u043e\u0432\u0438\u0439 \u0442\u0443\u0440 \u00abRound 12\u00bb. \u0427\u0430\u0441 \u0440\u043e\u0431\u0438\u0442\u0438 \u043f\u0440\u043e\u0433\u043d\u043e\u0437\u0438!',
    });
  });

  it('renders round results without promising a final or complete round', () => {
    expect(
      notificationPreview('round_results', 'Premier League', 'Round 12'),
    ).toEqual({
      title: 'TippsLiga \u00b7 Premier League',
      body: '\u0423 \u0442\u0443\u0440\u0456 \u00abRound 12\u00bb \u043e\u043f\u0443\u0431\u043b\u0456\u043a\u043e\u0432\u0430\u043d\u043e \u043d\u043e\u0432\u0456 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0438.',
    });
  });

  it('builds the Angular service-worker payload with a relative deep link', () => {
    const preview = { title: 'TippsLiga', body: 'Results updated' };
    const url = '/championship/champ-id?roundId=round-id';

    expect(notificationPayload(preview, 'dispatch-id', url)).toEqual({
      notification: {
        ...preview,
        icon: '/assets/branding/favicon-192.png',
        tag: 'tippsliga-dispatch-id',
        data: {
          onActionClick: {
            default: { operation: 'navigateLastFocusedOrOpen', url },
          },
        },
      },
    });
    expect(preview).toEqual({ title: 'TippsLiga', body: 'Results updated' });
  });

  it('uses a stable tag for retries and distinct tags for repeated result dispatches', () => {
    const preview = notificationPreview('round_results', 'League', 'Round');
    const first = notificationPayload(
      preview,
      'first-dispatch',
      '/championship/id',
    );
    const retry = notificationPayload(
      preview,
      'first-dispatch',
      '/championship/id',
    );
    const repeat = notificationPayload(
      preview,
      'second-dispatch',
      '/championship/id',
    );

    expect(retry).toEqual(first);
    expect(repeat.notification.tag).not.toBe(first.notification.tag);
  });
});
