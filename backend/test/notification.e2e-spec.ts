import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { NotificationService } from '../src/notification/notification.service';
import { PushTransportService } from '../src/notification/push-transport.service';
import { PushSubscriptionEntity } from '../src/notification/push-subscription.entity';
import { NotificationDeliveryEntity } from '../src/notification/notification-delivery.entity';
import { NotificationDispatchEntity } from '../src/notification/notification-dispatch.entity';
import { RoundEntity } from '../src/round/round.entity';
import { ChampionshipEntity } from '../src/championship/championship.entity';

// Explicit opt-in to an isolated database; never use the app's database settings.
const url = process.env.PUSH_TEST_DATABASE_URL;
const integration =
  url && new URL(url).pathname === '/push_notification_test'
    ? describe
    : describe.skip;

integration('Notifications with PostgreSQL', () => {
  let db: DataSource;
  let service: NotificationService;
  let roundId: string;
  let championshipId: string;
  const transport = {
    getConfig: jest.fn(() => ({ enabled: true, publicKey: 'public' })),
    requireEnabled: jest.fn(),
    validateSubscription: jest.fn(),
    send: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url,
      entities: [__dirname + '/../src/**/*.entity.ts'],
      migrations: [__dirname + '/../src/migrations/*.ts'],
      synchronize: false,
    }).initialize();
    await db.runMigrations();
    service = new NotificationService(
      db,
      transport as unknown as PushTransportService,
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    transport.send.mockReset().mockResolvedValue(null);
    await db.query('TRUNCATE users, championships RESTART IDENTITY CASCADE');
    await db.query(`INSERT INTO users (id, username, email, password, role) VALUES
      (1, 'admin', 'admin@test.invalid', 'unused', 'admin'),
      (2, 'active', 'active@test.invalid', 'unused', 'user'),
      (3, 'pending', 'pending@test.invalid', 'unused', 'user'),
      (4, 'outsider', 'outsider@test.invalid', 'unused', 'user')`);
    const championship = await db
      .getRepository(ChampionshipEntity)
      .save({ name: 'Test cup', image: '', createdByUserId: '1' });
    championshipId = championship.id;
    const round = await db.getRepository(RoundEntity).save({
      name: 'Tour 1',
      startDate: new Date('2026-11-01'),
      championshipId,
    });
    roundId = round.id;
    await db.query(
      `INSERT INTO memberships ("userId", "championshipId", status) VALUES (2, $1, 'active'), (3, $1, 'pending')`,
      [championshipId],
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.undoLastMigration();
      expect(await db.createQueryRunner().hasTable('push_subscriptions')).toBe(
        false,
      );
      await db.runMigrations();
      await db.destroy();
    }
  });

  async function subscription(userId = 2) {
    return service.register(userId, {
      endpoint: `https://fcm.googleapis.com/${randomUUID()}`,
      keys: { p256dh: 'key', auth: 'auth' },
    });
  }

  it('sends to every active member device only; same request is idempotent and results may be repeated', async () => {
    await subscription();
    await subscription();
    await subscription(3);
    await subscription(4);
    const requestId = randomUUID();
    const result = await service.send(roundId, 1, {
      type: 'round_results',
      requestId,
    });
    expect(result?.accepted).toBe(2);
    expect(transport.send).toHaveBeenCalledTimes(2);
    await service.send(roundId, 1, { type: 'round_results', requestId });
    expect(transport.send).toHaveBeenCalledTimes(2);
    await service.send(roundId, 1, {
      type: 'round_results',
      requestId: randomUUID(),
    });
    expect(transport.send).toHaveBeenCalledTimes(4);
    expect(await db.getRepository(NotificationDispatchEntity).count()).toBe(2);
    expect(transport.send.mock.calls[0][1].notification.body).toContain(
      'У турі «Tour 1»',
    );
  });

  it('does not consume announcement without recipients and serializes concurrent announcements', async () => {
    expect(
      await service.send(roundId, 1, {
        type: 'new_round',
        requestId: randomUUID(),
      }),
    ).toBeNull();
    await subscription();
    const sends = await Promise.allSettled(
      [1, 2].map(() =>
        service.send(roundId, 1, {
          type: 'new_round',
          requestId: randomUUID(),
        }),
      ),
    );
    expect(sends.filter((s) => s.status === 'fulfilled')).toHaveLength(1);
    expect(sends.filter((s) => s.status === 'rejected')).toHaveLength(1);
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('retries only failed deliveries, removes expired endpoints, and rechecks membership', async () => {
    await subscription();
    await subscription();
    await subscription();
    transport.send
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockRejectedValueOnce({ statusCode: 410 });
    const result = await service.send(roundId, 1, {
      type: 'round_results',
      requestId: randomUUID(),
    });
    expect(result).toMatchObject({
      accepted: 1,
      failed: 1,
      expired: 1,
      canRetry: true,
    });
    expect(await db.getRepository(PushSubscriptionEntity).count()).toBe(2);
    transport.send.mockResolvedValue(null);
    const retry = await service.retry(result!.id);
    expect(retry).toMatchObject({
      accepted: 2,
      failed: 0,
      expired: 1,
      canRetry: false,
    });
    expect(transport.send).toHaveBeenCalledTimes(4);
    const failed = await service.send(roundId, 1, {
      type: 'round_results',
      requestId: randomUUID(),
    });
    await db
      .getRepository(NotificationDeliveryEntity)
      .update({ dispatchId: failed!.id }, { status: 'failed' });
    await db.query('DELETE FROM memberships WHERE "userId" = 2');
    expect(await service.retry(failed!.id)).toMatchObject({
      skipped: 2,
      canRetry: false,
    });
    expect(transport.send).toHaveBeenCalledTimes(6);
  });

  it('registers idempotently without transferring ownership and protects removal/testing', async () => {
    const dto = {
      endpoint: 'https://fcm.googleapis.com/same',
      keys: { p256dh: 'key', auth: 'auth' },
    };
    const first = await service.register(2, dto);
    expect(await service.register(2, dto)).toEqual(first);
    await expect(service.register(3, dto)).rejects.toMatchObject({
      status: 409,
    });
    await expect(service.remove(3, first.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.test(3, first.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(transport.send).not.toHaveBeenCalled();
    expect(await service.test(2, first.id)).toEqual({ accepted: true });
    await service.remove(2, first.id);
    expect(await db.getRepository(PushSubscriptionEntity).count()).toBe(0);
  });

  it('rejects a concurrent request ID reused for another tour with 409', async () => {
    await subscription();
    const other = await db
      .getRepository(RoundEntity)
      .save({
        name: 'Tour 2',
        startDate: new Date('2026-11-02'),
        championshipId,
      });
    const requestId = randomUUID();
    const replies = await Promise.allSettled(
      [roundId, other.id].map((id) =>
        service.send(id, 1, { type: 'round_results', requestId }),
      ),
    );
    const rejected = replies.find((reply) => reply.status === 'rejected');
    expect(
      replies.filter((reply) => reply.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      rejected?.status === 'rejected' ? rejected.reason : null,
    ).toMatchObject({ status: 409 });
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('parallel identical requests share one dispatch and announced status outlives history window', async () => {
    await subscription();
    const requestId = randomUUID();
    const replies = await Promise.all(
      [1, 2].map(() =>
        service.send(roundId, 1, { type: 'new_round', requestId }),
      ),
    );
    expect(replies[0]?.id).toBe(replies[1]?.id);
    expect(transport.send).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 11; i++)
      await service.send(roundId, 1, {
        type: 'round_results',
        requestId: randomUUID(),
      });
    const status = await service.status(roundId);
    expect(status).toMatchObject({
      announced: true,
      recipientUsers: 1,
      recipientDevices: 1,
    });
    expect(status.dispatches).toHaveLength(10);
  });
});
