import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { PersistingService } from '../auth/services/persisisting.service';
import { NotificationApiService } from './notification-api.service';
import { PushClientService } from './push-client.service';

describe('PushClientService', () => {
  let service: PushClientService;
  let permission: NotificationPermission;
  let subscription: PushSubscription;
  let current: BehaviorSubject<PushSubscription | null>;
  const user = signal({ id: 1 });
  let api: jasmine.SpyObj<NotificationApiService>;
  let request: jasmine.Spy;

  beforeEach(() => {
    localStorage.removeItem('tippsliga.pushRegistration');
    user.set({ id: 1 });
    permission = 'default';
    spyOnProperty(Notification, 'permission', 'get').and.callFake(
      () => permission,
    );
    spyOn(Notification, 'requestPermission').and.callFake(async () => {
      permission = 'granted';
      return permission;
    });
    current = new BehaviorSubject<PushSubscription | null>(null);
    subscription = {
      unsubscribe: jasmine.createSpy('unsubscribe').and.resolveTo(true),
    } as unknown as PushSubscription;
    request = jasmine
      .createSpy('requestSubscription')
      .and.callFake(async () => {
        current.next(subscription);
        return subscription;
      });
    api = jasmine.createSpyObj('NotificationApiService', [
      'config',
      'register',
      'remove',
      'test',
    ]);
    api.config.and.resolveTo({ enabled: true, publicKey: 'key' });
    api.register.and.resolveTo({ id: 'subscription-1' });
    api.remove.and.resolveTo();
    api.test.and.resolveTo({ accepted: true });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwPush,
          useValue: {
            isEnabled: true,
            subscription: current,
            requestSubscription: request,
          },
        },
        { provide: NotificationApiService, useValue: api },
        { provide: PersistingService, useValue: { currentUser: user } },
      ],
    });
    service = TestBed.inject(PushClientService);
  });

  afterEach(() => localStorage.removeItem('tippsliga.pushRegistration'));

  it('does not request permission on startup, only after explicit activation', async () => {
    await service.refresh();
    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(service.active()).toBeFalse();
    await service.enable();
    expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(api.register).toHaveBeenCalledWith(subscription);
    expect(service.active()).toBeTrue();
    await service.test();
    expect(api.test).toHaveBeenCalledWith('subscription-1');
  });

  it('does not subscribe when permission was denied', async () => {
    permission = 'denied';
    await service.refresh();
    await service.enable();
    expect(request).not.toHaveBeenCalled();
    expect(service.error()).toBe('notifications.settings.blocked');
  });

  it('detaches another account device instead of silently registering it', async () => {
    permission = 'granted';
    localStorage.setItem(
      'tippsliga.pushRegistration',
      JSON.stringify({ userId: 2, id: 'other' }),
    );
    current.next(subscription);
    await service.refresh();
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(api.register).not.toHaveBeenCalled();
    expect(service.active()).toBeFalse();
  });

  it('removes both server registration and browser subscription when disabled', async () => {
    await service.refresh();
    await service.enable();
    expect(await service.disable()).toBeTrue();
    expect(api.remove).toHaveBeenCalledWith('subscription-1');
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(service.active()).toBeFalse();
    expect(localStorage.getItem('tippsliga.pushRegistration')).toBeNull();
  });

  it('unsubscribes after failed registration and reports the failure', async () => {
    api.register.and.rejectWith(new Error('offline'));
    await service.refresh();
    await service.enable();
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(service.active()).toBeFalse();
    expect(service.error()).toBe('notifications.settings.enableFailed');
  });
});
