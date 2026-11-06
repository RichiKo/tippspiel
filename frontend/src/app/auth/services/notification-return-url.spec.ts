import { notificationReturnUrl } from './notification-return-url';

describe('notificationReturnUrl', () => {
  it('preserves the internal tour deep link', () => {
    expect(notificationReturnUrl('/championship/cup-1?roundId=round-1')).toBe(
      '/championship/cup-1?roundId=round-1',
    );
  });
  it('rejects external redirects and unrelated query arguments', () => {
    for (const value of [
      'https://example.org',
      '//example.org',
      '/championship/../settings',
      '/championship/cup?next=https://example.org',
    ])
      expect(notificationReturnUrl(value)).toBeNull();
  });
});
