import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createECDH, ECDH } from 'node:crypto';
import * as webPush from 'web-push';
import { RegisterSubscriptionDto } from './dto/notification.dto';
import { NotificationPayload } from './notification.types';

@Injectable()
export class PushTransportService {
  constructor(private readonly config: ConfigService) {}

  getConfig(): { enabled: boolean; publicKey: string | null } {
    const enabled =
      this.config.get<string>('PUSH_ENABLED') === 'true' && this.validVapid();
    return {
      enabled,
      publicKey: enabled
        ? this.config.getOrThrow<string>('VAPID_PUBLIC_KEY')
        : null,
    };
  }

  requireEnabled(): void {
    if (!this.getConfig().enabled)
      throw new ServiceUnavailableException('Push notifications are disabled');
  }

  validateSubscription(dto: RegisterSubscriptionDto): void {
    try {
      const url = new URL(dto.endpoint);
      const host = url.hostname;
      const allowed =
        host === 'fcm.googleapis.com' ||
        host === 'updates.push.services.mozilla.com' ||
        host.endsWith('.push.apple.com');
      if (
        url.protocol !== 'https:' ||
        !allowed ||
        url.username ||
        url.password ||
        (url.port && url.port !== '443') ||
        url.hash
      )
        throw new Error('endpoint');
      if (
        !dto.keys ||
        !/^[A-Za-z0-9_-]+$/.test(dto.keys.p256dh) ||
        !/^[A-Za-z0-9_-]+$/.test(dto.keys.auth)
      )
        throw new Error('keys');
      const key = Buffer.from(dto.keys.p256dh, 'base64url');
      if (
        key.length !== 65 ||
        key[0] !== 4 ||
        Buffer.from(dto.keys.auth, 'base64url').length !== 16
      )
        throw new Error('keys');
      ECDH.convertKey(key, 'prime256v1');
    } catch {
      throw new BadRequestException('Invalid push subscription');
    }
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: NotificationPayload,
  ): Promise<void> {
    this.requireEnabled();
    this.validateSubscription({
      endpoint: subscription.endpoint,
      keys: subscription,
    });
    const details = webPush.generateRequestDetails(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: 86400,
        vapidDetails: {
          subject: this.config.getOrThrow<string>('VAPID_SUBJECT'),
          publicKey: this.config.getOrThrow<string>('VAPID_PUBLIC_KEY'),
          privateKey: this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
        },
      },
    );
    const response = await fetch(details.endpoint, {
      method: details.method,
      headers: details.headers,
      body: details.body ? new Uint8Array(details.body) : null,
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
    await response.body?.cancel();
    if (!response.ok)
      throw Object.assign(new Error('Push provider rejected request'), {
        statusCode: response.status,
      });
  }

  private validVapid(): boolean {
    try {
      const privateKey = this.config.getOrThrow<string>('VAPID_PRIVATE_KEY');
      const publicKey = this.config.getOrThrow<string>('VAPID_PUBLIC_KEY');
      const subject = new URL(this.config.getOrThrow<string>('VAPID_SUBJECT'));
      const key = createECDH('prime256v1');
      key.setPrivateKey(Buffer.from(privateKey, 'base64url'));
      return (
        key.getPublicKey().toString('base64url') === publicKey &&
        ['mailto:', 'https:'].includes(subject.protocol)
      );
    } catch {
      return false;
    }
  }
}
