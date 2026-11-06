import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationApiService } from './notification-api.service';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('registers only endpoint and keys, excluding browser expirationTime', async () => {
    const operation = service.register({
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/device',
        expirationTime: null,
        keys: { p256dh: 'key', auth: 'auth' },
      }),
    } as unknown as PushSubscription);
    const request = http.expectOne('/api/notifications/subscriptions');
    expect(request.request.body).toEqual({
      endpoint: 'https://fcm.googleapis.com/device',
      keys: { p256dh: 'key', auth: 'auth' },
      locale: 'uk',
    });
    request.flush({ id: 'device' });
    expect(await operation).toEqual({ id: 'device' });
  });

  it('sends only explicit type and idempotency key for a tour', async () => {
    const operation = service.send('round/a', 'round_results', 'request-1');
    const request = http.expectOne('/api/rounds/round%2Fa/notifications');
    expect(request.request.body).toEqual({
      type: 'round_results',
      requestId: 'request-1',
    });
    request.flush(null);
    expect(await operation).toBeNull();
  });
});
