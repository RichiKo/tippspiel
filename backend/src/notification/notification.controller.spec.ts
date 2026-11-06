import 'reflect-metadata';
import {
  ConflictException,
  INestApplication,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  RegisterSubscriptionDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UserRole } from '../user/user-rolle.enum';

describe('NotificationController HTTP API', () => {
  const roundId = '11111111-1111-4111-8111-111111111111';
  const subscriptionId = '22222222-2222-4222-8222-222222222222';
  const dispatchId = '33333333-3333-4333-8333-333333333333';
  const requestId = '44444444-4444-4444-8444-444444444444';
  const subscription: RegisterSubscriptionDto = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/device',
    keys: { p256dh: 'public-key', auth: 'auth-key' },
    locale: 'uk',
  };
  const sendDto: SendNotificationDto = { type: 'new_round', requestId };
  const config = { enabled: true, publicKey: 'public-vapid-key' };
  const summary = {
    id: dispatchId,
    type: 'new_round',
    createdAt: '2026-11-05T12:00:00.000Z',
    recipientCount: 2,
    accepted: 1,
    failed: 1,
    pending: 0,
    expired: 0,
    skipped: 0,
    inProgress: false,
    canRetry: true,
  };
  const service = {
    getConfig: jest.fn(),
    register: jest.fn(),
    remove: jest.fn(),
    test: jest.fn(),
    status: jest.fn(),
    send: jest.fn(),
    retry: jest.fn(),
  };
  const routes = [
    { method: 'get', path: '/notifications/config' },
    {
      method: 'post',
      path: '/notifications/subscriptions',
      body: subscription,
    },
    {
      method: 'delete',
      path: `/notifications/subscriptions/${subscriptionId}`,
    },
    {
      method: 'post',
      path: `/notifications/subscriptions/${subscriptionId}/test`,
    },
    { method: 'get', path: `/rounds/${roundId}/notifications` },
    { method: 'post', path: `/rounds/${roundId}/notifications`, body: sendDto },
    { method: 'post', path: `/notifications/dispatches/${dispatchId}/retry` },
  ] as const;
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: service }],
    }).compile();
    app = module.createNestApplication<INestApplication<App>>();
    // The real auth middleware populates request.user; keep both guards real.
    app.use(
      (
        req: Request & { user?: { id: number; role: string } },
        _res: Response,
        next: NextFunction,
      ) => {
        const role = req.header('x-test-role');
        if (role) req.user = { id: 42, role };
        next();
      },
    );
    // Keep one listener for the suite instead of reopening it for every request.
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    service.getConfig.mockReturnValue(config);
    service.register.mockResolvedValue({ id: subscriptionId });
    service.remove.mockResolvedValue(null);
    service.test.mockResolvedValue({ accepted: true });
    service.status.mockResolvedValue({ enabled: true, dispatches: [summary] });
    service.send.mockResolvedValue(summary);
    service.retry.mockResolvedValue(summary);
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it.each(routes)(
    'rejects unauthenticated $method $path before calling the service',
    async (route) => {
      const call = request(app.getHttpServer())[route.method](route.path);
      if ('body' in route) call.send(route.body);

      await call.expect(401);

      Object.values(service).forEach((method) =>
        expect(method).not.toHaveBeenCalled(),
      );
    },
  );

  it('returns public push configuration to an authenticated regular user', async () => {
    await request(app.getHttpServer())
      .get('/notifications/config')
      .set('x-test-role', UserRole.USER)
      .expect(200, config);
    expect(service.getConfig).toHaveBeenCalledTimes(1);
  });

  it('registers a subscription for the authenticated user, not a body-supplied owner', async () => {
    await request(app.getHttpServer())
      .post('/notifications/subscriptions')
      .set('x-test-role', UserRole.USER)
      .send(subscription)
      .expect(201, { id: subscriptionId });

    expect(service.register).toHaveBeenCalledWith(
      42,
      expect.any(RegisterSubscriptionDto),
    );
    expect(service.register).toHaveBeenCalledWith(42, subscription);
  });

  it('accepts an omitted locale', async () => {
    const body = { endpoint: subscription.endpoint, keys: subscription.keys };

    await request(app.getHttpServer())
      .post('/notifications/subscriptions')
      .set('x-test-role', UserRole.USER)
      .send(body)
      .expect(201);

    expect(service.register).toHaveBeenCalledWith(42, body);
  });

  it('returns 204 and forwards ownership when deleting a subscription', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/notifications/subscriptions/${subscriptionId}`)
      .set('x-test-role', UserRole.USER)
      .expect(204);

    expect(response.text).toBe('');
    expect(service.remove).toHaveBeenCalledWith(42, subscriptionId);
  });

  it('allows a regular user to test their own subscription', async () => {
    await request(app.getHttpServer())
      .post(`/notifications/subscriptions/${subscriptionId}/test`)
      .set('x-test-role', UserRole.USER)
      .expect(200, { accepted: true });

    expect(service.test).toHaveBeenCalledWith(42, subscriptionId);
  });

  const adminRoutes = routes.slice(4);

  it.each(adminRoutes)(
    'rejects a regular user on admin-only $method $path',
    async (route) => {
      const call = request(app.getHttpServer())
        [route.method](route.path)
        .set('x-test-role', UserRole.USER);
      if ('body' in route) call.send(route.body);

      await call.expect(403);

      expect(service.status).not.toHaveBeenCalled();
      expect(service.send).not.toHaveBeenCalled();
      expect(service.retry).not.toHaveBeenCalled();
    },
  );

  it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
    'allows %s to read, send, and retry',
    async (role) => {
      await request(app.getHttpServer())
        .get(`/rounds/${roundId}/notifications`)
        .set('x-test-role', role)
        .expect(200, { enabled: true, dispatches: [summary] });
      await request(app.getHttpServer())
        .post(`/rounds/${roundId}/notifications`)
        .set('x-test-role', role)
        .send(sendDto)
        .expect(200, summary);
      await request(app.getHttpServer())
        .post(`/notifications/dispatches/${dispatchId}/retry`)
        .set('x-test-role', role)
        .expect(200, summary);

      expect(service.status).toHaveBeenCalledWith(roundId);
      expect(service.send).toHaveBeenCalledWith(
        roundId,
        42,
        expect.any(SendNotificationDto),
      );
      expect(service.send).toHaveBeenCalledWith(roundId, 42, sendDto);
      expect(service.retry).toHaveBeenCalledWith(dispatchId);
    },
  );

  it.each(['new_round', 'round_results'])(
    'accepts the approved notification type %s',
    async (type) => {
      await request(app.getHttpServer())
        .post(`/rounds/${roundId}/notifications`)
        .set('x-test-role', UserRole.ADMIN)
        .send({ type, requestId })
        .expect(200);

      expect(service.send).toHaveBeenCalledWith(roundId, 42, {
        type,
        requestId,
      });
    },
  );

  it.each([
    {},
    { ...subscription, endpoint: null },
    { ...subscription, endpoint: 123 },
    { ...subscription, endpoint: 'x'.repeat(2049) },
    { endpoint: subscription.endpoint },
    { ...subscription, keys: null },
    { ...subscription, keys: 'not-an-object' },
    { ...subscription, keys: {} },
    { ...subscription, keys: { p256dh: 123, auth: 'auth' } },
    { ...subscription, keys: { p256dh: 'key', auth: null } },
    { ...subscription, keys: { p256dh: 'x'.repeat(129), auth: 'auth' } },
    { ...subscription, keys: { p256dh: 'key', auth: 'x'.repeat(65) } },
    {
      ...subscription,
      keys: { ...subscription.keys, privateKey: 'not-allowed' },
    },
    { ...subscription, locale: 'en' },
    { ...subscription, userId: 999 },
    { ...subscription, id: subscriptionId },
  ])('rejects malformed or unknown subscription fields: %p', async (body) => {
    await request(app.getHttpServer())
      .post('/notifications/subscriptions')
      .set('x-test-role', UserRole.USER)
      .send(body)
      .expect(400);

    expect(service.register).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { requestId },
    { type: 'new_round' },
    { type: 'custom', requestId },
    { type: null, requestId },
    { type: 'new_round', requestId: 'not-a-uuid' },
    { type: 'new_round', requestId: '11111111-1111-1111-8111-111111111111' },
    { type: 'new_round', requestId: null },
    { ...sendDto, title: 'Custom notification' },
    { ...sendDto, body: 'Custom notification' },
    { ...sendDto, url: 'https://attacker.example' },
    { ...sendDto, adminId: 999 },
  ])('rejects invalid or custom notification input: %p', async (body) => {
    await request(app.getHttpServer())
      .post(`/rounds/${roundId}/notifications`)
      .set('x-test-role', UserRole.ADMIN)
      .send(body)
      .expect(400);

    expect(service.send).not.toHaveBeenCalled();
  });

  it.each([
    { method: 'delete', path: '/notifications/subscriptions/not-a-uuid' },
    { method: 'post', path: '/notifications/subscriptions/not-a-uuid/test' },
    { method: 'get', path: '/rounds/not-a-uuid/notifications' },
    { method: 'post', path: '/rounds/not-a-uuid/notifications' },
    { method: 'post', path: '/notifications/dispatches/not-a-uuid/retry' },
  ] as const)('rejects malformed route IDs on $method $path', async (route) => {
    const call = request(app.getHttpServer())
      [route.method](route.path)
      .set('x-test-role', UserRole.ADMIN);
    if (route.method === 'post') call.send(sendDto);
    await call.expect(400);

    Object.values(service).forEach((method) =>
      expect(method).not.toHaveBeenCalled(),
    );
  });

  it('preserves service ownership errors for subscription deletion', async () => {
    service.remove.mockRejectedValueOnce(
      new NotFoundException('Subscription not found'),
    );

    await request(app.getHttpServer())
      .delete(`/notifications/subscriptions/${subscriptionId}`)
      .set('x-test-role', UserRole.USER)
      .expect(404);
  });

  it('returns 409 for duplicate round announcements', async () => {
    service.send.mockRejectedValueOnce(
      new ConflictException('Round already announced'),
    );

    await request(app.getHttpServer())
      .post(`/rounds/${roundId}/notifications`)
      .set('x-test-role', UserRole.ADMIN)
      .send(sendDto)
      .expect(409);
  });

  it('returns 503 when sending is disabled', async () => {
    service.send.mockRejectedValueOnce(
      new ServiceUnavailableException('Push notifications are disabled'),
    );

    await request(app.getHttpServer())
      .post(`/rounds/${roundId}/notifications`)
      .set('x-test-role', UserRole.ADMIN)
      .send(sendDto)
      .expect(503);
  });
});
