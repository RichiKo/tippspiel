import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createECDH } from 'node:crypto';
import * as webPush from 'web-push';
import { RegisterSubscriptionDto } from './dto/notification.dto';
import { notificationPayload } from './notification.templates';
import { PushTransportService } from './push-transport.service';

jest.mock('web-push', () => ({ generateRequestDetails: jest.fn() }));

describe('PushTransportService', () => {
  const vapidKey = createECDH('prime256v1');
  vapidKey.setPrivateKey(Buffer.alloc(32, 1));
  const deviceKey = createECDH('prime256v1');
  deviceKey.setPrivateKey(Buffer.alloc(32, 2));
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-device',
    p256dh: deviceKey.getPublicKey().toString('base64url'),
    auth: Buffer.alloc(16, 3).toString('base64url'),
  };
  const dto = (): RegisterSubscriptionDto => ({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  });
  const payload = notificationPayload(
    { title: 'TippsLiga', body: 'Round results' },
    'dispatch-id',
    '/championship/championship-id?roundId=round-id',
  );
  const generateRequestDetails = jest.mocked(webPush.generateRequestDetails);
  let service: PushTransportService;
  let configuration: Record<string, string>;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let timeoutMock: jest.SpiedFunction<typeof AbortSignal.timeout>;
  let signal: AbortSignal;

  beforeEach(() => {
    configuration = {
      PUSH_ENABLED: 'true',
      VAPID_PUBLIC_KEY: vapidKey.getPublicKey().toString('base64url'),
      VAPID_PRIVATE_KEY: vapidKey.getPrivateKey().toString('base64url'),
      VAPID_SUBJECT: 'mailto:push@example.com',
    };
    const config = {
      get: jest.fn((key: string) => configuration[key]),
      getOrThrow: jest.fn((key: string) => {
        if (!(key in configuration)) throw new Error(`Missing ${key}`);
        return configuration[key];
      }),
    };
    service = new PushTransportService(config as unknown as ConfigService);
    generateRequestDetails.mockReset();
    generateRequestDetails.mockReturnValue({
      endpoint: subscription.endpoint,
      method: 'POST',
      headers: { TTL: '86400', 'Content-Encoding': 'aes128gcm' },
      body: Buffer.from('encrypted-payload'),
    });
    fetchMock = jest.spyOn(globalThis, 'fetch');
    fetchMock.mockRejectedValue(new Error('Unexpected provider request'));
    signal = new AbortController().signal;
    timeoutMock = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('configuration', () => {
    it('exposes only enabled and the public key for a valid VAPID pair', () => {
      expect(service.getConfig()).toEqual({
        enabled: true,
        publicKey: configuration.VAPID_PUBLIC_KEY,
      });
      expect(() => service.requireEnabled()).not.toThrow();
    });

    it('accepts an HTTPS VAPID subject', () => {
      configuration.VAPID_SUBJECT = 'https://example.com/push-contact';

      expect(service.getConfig().enabled).toBe(true);
    });

    it.each(['false', 'TRUE', '1', ''])(
      'disables push for PUSH_ENABLED=%p',
      (value) => {
        configuration.PUSH_ENABLED = value;

        expect(service.getConfig()).toEqual({
          enabled: false,
          publicKey: null,
        });
        expect(() => service.requireEnabled()).toThrow(
          ServiceUnavailableException,
        );
      },
    );

    it.each([
      'PUSH_ENABLED',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
    ])('fails closed when %s is missing', (key) => {
      delete configuration[key];

      expect(service.getConfig()).toEqual({ enabled: false, publicKey: null });
    });

    it.each([
      ['VAPID_PUBLIC_KEY', deviceKey.getPublicKey().toString('base64url')],
      ['VAPID_PUBLIC_KEY', 'not-a-public-key'],
      ['VAPID_PRIVATE_KEY', 'not-a-private-key'],
      ['VAPID_PRIVATE_KEY', Buffer.alloc(32).toString('base64url')],
      ['VAPID_SUBJECT', 'http://example.com/contact'],
      ['VAPID_SUBJECT', 'not-a-url'],
    ])('fails closed for invalid %s=%p', (key, value) => {
      configuration[key] = value;

      expect(service.getConfig()).toEqual({ enabled: false, publicKey: null });
    });
  });

  describe('subscription validation', () => {
    it.each([
      'https://fcm.googleapis.com/fcm/send/device',
      'https://updates.push.services.mozilla.com/wpush/v2/device',
      'https://web.push.apple.com/device/token',
      'https://web.push.apple.com:443/device/token',
    ])('accepts a valid HTTPS provider endpoint: %s', (endpoint) => {
      expect(() =>
        service.validateSubscription({ ...dto(), endpoint }),
      ).not.toThrow();
    });

    it.each([
      'not-a-url',
      'http://fcm.googleapis.com/fcm/send/device',
      'http://updates.push.services.mozilla.com/device',
      'http://web.push.apple.com/device',
      'ftp://fcm.googleapis.com/device',
      'https://example.com/device',
      'https://localhost/device',
      'https://127.0.0.1/device',
      'https://fcm.googleapis.com.attacker.example/device',
      'https://updates.push.services.mozilla.com.attacker.example/device',
      'https://web.push.apple.com.attacker.example/device',
      'https://evilpush.apple.com/device',
      'https://fcm.googleapis.com@attacker.example/device',
      'https://user:password@fcm.googleapis.com/device',
      'https://fcm.googleapis.com:8443/device',
      'https://fcm.googleapis.com/device#fragment',
    ])('rejects an unsafe endpoint: %s', (endpoint) => {
      expect(() =>
        service.validateSubscription({ ...dto(), endpoint }),
      ).toThrow(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      { p256dh: '', auth: subscription.auth },
      { p256dh: `${subscription.p256dh}=`, auth: subscription.auth },
      {
        p256dh: Buffer.alloc(64, 4).toString('base64url'),
        auth: subscription.auth,
      },
      {
        p256dh: Buffer.alloc(65, 3).toString('base64url'),
        auth: subscription.auth,
      },
      {
        p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64)]).toString(
          'base64url',
        ),
        auth: subscription.auth,
      },
      { p256dh: subscription.p256dh, auth: '' },
      {
        p256dh: subscription.p256dh,
        auth: Buffer.alloc(15).toString('base64url'),
      },
      {
        p256dh: subscription.p256dh,
        auth: Buffer.alloc(17).toString('base64url'),
      },
      { p256dh: subscription.p256dh, auth: 'not+base64/url' },
    ])('rejects malformed subscription keys: %p', (keys) => {
      expect(() => service.validateSubscription({ ...dto(), keys })).toThrow(
        'Invalid push subscription',
      );
    });

    it('rejects missing keys with a client error', () => {
      expect(() =>
        service.validateSubscription({
          endpoint: subscription.endpoint,
        } as RegisterSubscriptionDto),
      ).toThrow(BadRequestException);
    });
  });

  describe('send', () => {
    it('encrypts the payload and uses a bounded non-redirecting fetch', async () => {
      const response = new Response('provider response', { status: 201 });
      const cancel = jest.spyOn(response.body!, 'cancel');
      fetchMock.mockResolvedValue(response);

      await expect(
        service.send(subscription, payload),
      ).resolves.toBeUndefined();

      expect(generateRequestDetails).toHaveBeenCalledWith(
        { endpoint: subscription.endpoint, keys: dto().keys },
        JSON.stringify(payload),
        {
          TTL: 86400,
          vapidDetails: {
            subject: configuration.VAPID_SUBJECT,
            publicKey: configuration.VAPID_PUBLIC_KEY,
            privateKey: configuration.VAPID_PRIVATE_KEY,
          },
        },
      );
      expect(timeoutMock).toHaveBeenCalledWith(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(subscription.endpoint, {
        method: 'POST',
        headers: { TTL: '86400', 'Content-Encoding': 'aes128gcm' },
        body: new Uint8Array(Buffer.from('encrypted-payload')),
        signal,
        redirect: 'error',
      });
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('does not generate a request when push is disabled', async () => {
      configuration.PUSH_ENABLED = 'false';

      await expect(service.send(subscription, payload)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(generateRequestDetails).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('revalidates persisted subscriptions before generating or sending a request', async () => {
      await expect(
        service.send(
          { ...subscription, endpoint: 'https://localhost/private' },
          payload,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(generateRequestDetails).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([404, 410, 429, 500, 503])(
      'preserves provider status %s for delivery handling',
      async (status) => {
        const response = new Response('provider details must not leak', {
          status,
        });
        const cancel = jest.spyOn(response.body!, 'cancel');
        fetchMock.mockResolvedValue(response);

        await expect(service.send(subscription, payload)).rejects.toMatchObject(
          {
            message: 'Push provider rejected request',
            statusCode: status,
          },
        );
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );

    it.each(['TimeoutError', 'TypeError'])(
      'propagates %s without silently retrying',
      async (name) => {
        const error = Object.assign(new Error('Send failed'), { name });
        fetchMock.mockRejectedValue(error);

        await expect(service.send(subscription, payload)).rejects.toBe(error);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );

    it('propagates request-generation failures without contacting a provider', async () => {
      const error = new Error('Encryption failed');
      generateRequestDetails.mockImplementation(() => {
        throw error;
      });

      await expect(service.send(subscription, payload)).rejects.toBe(error);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
