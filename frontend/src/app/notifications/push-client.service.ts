import { computed, inject, Injectable, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, timeout } from 'rxjs';
import { PersistingService } from '../auth/services/persisisting.service';
import { NotificationApiService } from './notification-api.service';

interface DeviceRegistration {
  userId: number;
  id: string;
}
const STORAGE_KEY = 'tippsliga.pushRegistration';

@Injectable({ providedIn: 'root' })
export class PushClientService {
  private readonly sw = inject(SwPush, { optional: true });
  private readonly api = inject(NotificationApiService);
  private readonly users = inject(PersistingService);
  private queue: Promise<unknown> = Promise.resolve();
  private publicKey: string | null = null;

  readonly ready = signal(false);
  readonly enabled = signal(false);
  readonly active = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly permission = signal<NotificationPermission>(
    typeof Notification === 'undefined' ? 'default' : Notification.permission,
  );
  readonly needsInstall = signal(
    this.isIos() &&
      !window.matchMedia('(display-mode: standalone)').matches &&
      !(navigator as Navigator & { standalone?: boolean }).standalone,
  );
  readonly supported = computed(() =>
    Boolean(
      window.isSecureContext &&
        this.sw?.isEnabled &&
        'PushManager' in window &&
        'Notification' in window,
    ),
  );

  refresh(): Promise<void> {
    return this.serial(async () => {
      this.error.set(null);
      try {
        const user = this.users.currentUser();
        if (!user) {
          this.active.set(false);
          return;
        }
        const config = await this.api.config();
        this.enabled.set(config.enabled);
        this.publicKey = config.publicKey;
        if (!this.supported()) return;
        this.permission.set(Notification.permission);
        const subscription = await this.subscription();
        const record = this.registration();
        if (subscription && (!record || record.userId !== user.id)) {
          await subscription.unsubscribe();
          localStorage.removeItem(STORAGE_KEY);
          this.active.set(false);
          return;
        }
        this.active.set(
          Boolean(
            subscription && record && Notification.permission === 'granted',
          ),
        );
        if (
          subscription &&
          record &&
          config.enabled &&
          this.users.currentUser()?.id === user.id
        ) {
          const saved = await this.api.register(subscription);
          if (this.users.currentUser()?.id === user.id)
            this.remember({ userId: user.id, id: saved.id });
        }
      } catch {
        this.error.set('notifications.settings.loadFailed');
      } finally {
        this.ready.set(true);
      }
    });
  }

  async enable(): Promise<void> {
    this.error.set(null);
    this.message.set(null);
    if (this.busy()) return;
    if (this.needsInstall()) {
      this.error.set('notifications.settings.installFirst');
      return;
    }
    if (!this.supported() || !this.enabled() || !this.publicKey) {
      this.error.set('notifications.settings.unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      this.error.set('notifications.settings.blocked');
      return;
    }
    // Request permission directly in the click handler to preserve the iOS user gesture.
    const permissionRequest = Notification.requestPermission();
    this.busy.set(true);
    try {
      this.permission.set(await permissionRequest);
      if (this.permission() !== 'granted') {
        this.error.set('notifications.settings.blocked');
        return;
      }
      await this.serial(async () => {
        const user = this.users.currentUser();
        if (!user || !this.sw || !this.publicKey) return;
        const subscription = await this.sw.requestSubscription({
          serverPublicKey: this.publicKey,
        });
        try {
          const result = await this.api.register(subscription);
          this.remember({ userId: user.id, id: result.id });
          this.active.set(true);
        } catch (error: unknown) {
          await subscription.unsubscribe();
          throw error;
        }
      });
    } catch {
      this.error.set('notifications.settings.enableFailed');
    } finally {
      this.busy.set(false);
    }
  }

  async disable(): Promise<boolean> {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      return await this.serial(async () => {
        const record = this.registration();
        let serverRemoved = false;
        let browserRemoved = false;
        if (record?.userId === this.users.currentUser()?.id) {
          try {
            await this.api.remove(record!.id);
            serverRemoved = true;
          } catch (error: unknown) {
            serverRemoved =
              typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              error.status === 404;
          }
        }
        try {
          const subscription = this.supported()
            ? await this.subscription()
            : null;
          browserRemoved = subscription
            ? await subscription.unsubscribe()
            : true;
        } catch {
          browserRemoved = false;
        }
        if (!serverRemoved && !browserRemoved)
          throw new Error('Could not detach device');
        this.active.set(false);
        localStorage.removeItem(STORAGE_KEY);
        return true;
      });
    } catch {
      this.error.set('notifications.settings.disableFailed');
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  async test(): Promise<void> {
    const record = this.registration();
    if (!record || !this.active() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      const result = await this.api.test(record.id);
      if (!result.accepted) throw new Error('Test failed');
      this.message.set('notifications.settings.testAccepted');
    } catch {
      this.error.set('notifications.settings.testFailed');
    } finally {
      this.busy.set(false);
    }
  }

  private subscription(): Promise<PushSubscription | null> {
    return this.sw
      ? firstValueFrom(this.sw.subscription.pipe(timeout(5000)))
      : Promise.resolve(null);
  }

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => null);
    return result;
  }

  private registration(): DeviceRegistration | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<DeviceRegistration>;
      return typeof value.userId === 'number' && typeof value.id === 'string'
        ? (value as DeviceRegistration)
        : null;
    } catch {
      return null;
    }
  }

  private remember(registration: DeviceRegistration): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registration));
  }

  private isIos(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }
}
