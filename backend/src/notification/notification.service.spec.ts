import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource, EntityManager, In } from 'typeorm';
import { ChampionshipEntity } from '../championship/championship.entity';
import { MembershipEntity } from '../membership/membership.entity';
import { MembershipStatus } from '../membership/membership-status.enum';
import { RoundEntity } from '../round/round.entity';
import { NotificationDeliveryEntity } from './notification-delivery.entity';
import { NotificationDispatchEntity } from './notification-dispatch.entity';
import { NotificationService } from './notification.service';
import { notificationPayload } from './notification.templates';
import { NotificationPayload } from './notification.types';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { PushTransportService } from './push-transport.service';

describe('NotificationService', () => {
  const now = new Date('2026-11-05T12:00:00.000Z');
  const dto = {
    endpoint: 'https://fcm.googleapis.com/device',
    keys: { p256dh: 'public-key', auth: 'auth-key' },
  };
  const transport = {
    getConfig: jest.fn(),
    requireEnabled: jest.fn(),
    validateSubscription: jest.fn(),
    send: jest.fn(),
  };
  const query = {
    insert: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    execute: jest.fn(),
    innerJoin: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };
  const subscriptions = {
    createQueryBuilder: jest.fn(),
    findOneByOrFail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const rounds = { findOne: jest.fn() };
  const dispatches = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const deliveryRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  let service: NotificationService;
  let subscription: PushSubscriptionEntity;
  let round: RoundEntity;
  let dispatch: NotificationDispatchEntity;
  let deliveries: NotificationDeliveryEntity[];

  const delivery = (
    id: string,
    status: NotificationDeliveryEntity['status'],
    subscriptionId: string | null = 'device-1',
  ) =>
    Object.assign(new NotificationDeliveryEntity(), {
      id,
      dispatchId: 'dispatch-1',
      subscriptionId,
      status,
      errorCode: null,
    });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    subscription = Object.assign(new PushSubscriptionEntity(), {
      id: 'device-1',
      userId: 42,
      ...dto,
      ...dto.keys,
      locale: 'uk',
      createdAt: now,
    });
    round = Object.assign(new RoundEntity(), {
      id: 'round-1',
      name: 'Round 12',
      championshipId: 'championship-1',
      championship: Object.assign(new ChampionshipEntity(), { name: 'League' }),
    });
    dispatch = Object.assign(new NotificationDispatchEntity(), {
      id: 'dispatch-1',
      requestId: 'request-1',
      roundId: round.id,
      type: 'round_results',
      adminId: 7,
      createdAt: now,
      recipientCount: 2,
      lockedUntil: null,
      lockToken: null,
      payload: notificationPayload(
        { title: 'TippsLiga', body: 'Results' },
        'dispatch-1',
        '/championship/championship-1',
      ),
    });
    deliveries = [];
    transport.getConfig.mockReturnValue({
      enabled: true,
      publicKey: 'public-key',
    });
    transport.send.mockResolvedValue(null);
    for (const method of [
      'insert',
      'values',
      'orIgnore',
      'innerJoin',
      'addSelect',
      'where',
      'andWhere',
    ] as const) {
      query[method].mockReturnValue(query);
    }
    query.execute.mockResolvedValue({});
    query.getMany.mockResolvedValue([]);
    query.getOne.mockResolvedValue(subscription);
    subscriptions.createQueryBuilder.mockReturnValue(query);
    subscriptions.findOneByOrFail.mockResolvedValue(subscription);
    subscriptions.delete.mockResolvedValue({ affected: 1 });
    rounds.findOne.mockResolvedValue(round);
    dispatches.findOne.mockImplementation(() => Promise.resolve(dispatch));
    dispatches.findOneBy.mockResolvedValue(null);
    dispatches.existsBy.mockResolvedValue(false);
    dispatches.find.mockResolvedValue([]);
    dispatches.save.mockImplementation((value: NotificationDispatchEntity) =>
      Promise.resolve(value),
    );
    deliveryRepository.find.mockImplementation(() =>
      Promise.resolve(
        deliveries.filter((d) => ['failed', 'pending'].includes(d.status)),
      ),
    );
    deliveryRepository.findBy.mockImplementation(() =>
      Promise.resolve(deliveries),
    );
    deliveryRepository.update.mockImplementation(
      (id: string, patch: Partial<NotificationDeliveryEntity>) => {
        const item = deliveries.find((d) => d.id === id);
        if (item) Object.assign(item, patch);
        return Promise.resolve({ affected: item ? 1 : 0 });
      },
    );

    const getRepository = jest.fn((entity: unknown) => {
      if (entity === PushSubscriptionEntity) return subscriptions;
      if (entity === RoundEntity) return rounds;
      if (entity === NotificationDispatchEntity) return dispatches;
      if (entity === NotificationDeliveryEntity) return deliveryRepository;
      throw new Error('Unexpected repository');
    });
    const manager = { getRepository };
    const db = {
      getRepository,
      manager,
      transaction: jest.fn(
        (work: (manager: EntityManager) => Promise<unknown>) =>
          work(manager as unknown as EntityManager),
      ),
    };
    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: DataSource, useValue: db },
        { provide: PushTransportService, useValue: transport },
      ],
    }).compile();
    service = module.get(NotificationService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('refreshes an owned subscription without sending automatically', async () => {
    await expect(service.register(42, dto)).resolves.toEqual({
      id: subscription.id,
    });

    expect(transport.validateSubscription).toHaveBeenCalledWith(dto);
    expect(query.values).toHaveBeenCalledWith({
      userId: 42,
      endpoint: dto.endpoint,
      ...dto.keys,
      locale: 'uk',
    });
    expect(query.orIgnore).toHaveBeenCalledTimes(1);
    expect(subscriptions.update).toHaveBeenCalledWith(subscription.id, {
      ...dto.keys,
      locale: 'uk',
    });
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('does not transfer an existing endpoint to another account', async () => {
    await expect(service.register(99, dto)).rejects.toThrow(ConflictException);

    expect(subscriptions.findOneByOrFail).toHaveBeenCalledWith({
      endpoint: dto.endpoint,
    });
    expect(subscriptions.update).not.toHaveBeenCalled();
  });

  it('validates a subscription before writing it', async () => {
    transport.validateSubscription.mockImplementation(() => {
      throw new BadRequestException();
    });

    await expect(service.register(42, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(subscriptions.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('scopes subscription deletion to the authenticated owner', async () => {
    await service.remove(42, subscription.id);

    expect(subscriptions.delete).toHaveBeenCalledWith({
      id: subscription.id,
      userId: 42,
    });
  });

  it('does not reveal another account subscription through deletion', async () => {
    subscriptions.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(99, subscription.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('scopes test notifications to the authenticated owner', async () => {
    query.getOne.mockResolvedValue(null);

    await expect(service.test(99, subscription.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(query.where).toHaveBeenCalledWith(
      'subscription.id = :id AND subscription.userId = :userId',
      { id: subscription.id, userId: 99 },
    );
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('sends an owned device test with a settings deep link', async () => {
    await expect(service.test(42, subscription.id)).resolves.toEqual({
      accepted: true,
    });

    const [sentSubscription, payload] = transport.send.mock.calls[0] as [
      PushSubscriptionEntity,
      NotificationPayload,
    ];
    expect(sentSubscription).toBe(subscription);
    expect(payload.notification).toMatchObject({
      title: 'TippsLiga',
      data: {
        onActionClick: {
          default: {
            operation: 'navigateLastFocusedOrOpen',
            url: '/settings',
          },
        },
      },
    });
    expect(subscriptions.delete).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    'removes an expired test subscription after provider status %s',
    async (statusCode) => {
      transport.send.mockRejectedValue({ statusCode });

      await expect(service.test(42, subscription.id)).resolves.toEqual({
        accepted: false,
      });
      expect(subscriptions.delete).toHaveBeenCalledWith({
        id: subscription.id,
        userId: 42,
      });
    },
  );

  it.each([{ statusCode: 429 }, { statusCode: 503 }, new Error('Timeout')])(
    'retains a test subscription on a transient error: %p',
    async (error) => {
      transport.send.mockRejectedValue(error);

      await expect(service.test(42, subscription.id)).resolves.toEqual({
        accepted: false,
      });
      expect(subscriptions.delete).not.toHaveBeenCalled();
    },
  );

  it('counts users independently from devices and filters active championship membership', async () => {
    query.getMany.mockResolvedValue([
      subscription,
      { ...subscription, id: 'device-2' },
      { ...subscription, id: 'device-3', userId: 99 },
    ]);
    dispatches.existsBy.mockResolvedValue(true);

    const status = await service.status(round.id);

    expect(status).toMatchObject({
      recipientUsers: 2,
      recipientDevices: 3,
      announced: true,
    });
    expect(query.innerJoin).toHaveBeenCalledWith(
      MembershipEntity,
      'membership',
      'membership.userId = subscription.userId AND membership.championshipId = :championshipId AND membership.status = :active',
      { championshipId: round.championshipId, active: MembershipStatus.ACTIVE },
    );
    expect(dispatches.find).toHaveBeenCalledWith({
      where: { roundId: round.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    expect(dispatches.existsBy).toHaveBeenCalledWith({
      roundId: round.id,
      type: 'new_round',
    });
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('does not consume the new-round announcement when there are no recipients', async () => {
    await expect(
      service.send(round.id, 7, { type: 'new_round', requestId: 'request-1' }),
    ).resolves.toBeNull();

    expect(rounds.findOne).toHaveBeenCalledWith({
      where: { id: round.id },
      lock: { mode: 'pessimistic_write' },
    });
    expect(dispatches.create).not.toHaveBeenCalled();
    expect(deliveryRepository.insert).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('rejects another new-round announcement even with a new request ID', async () => {
    dispatches.existsBy.mockResolvedValue(true);

    await expect(
      service.send(round.id, 7, { type: 'new_round', requestId: 'request-2' }),
    ).rejects.toThrow(ConflictException);
    expect(dispatches.create).not.toHaveBeenCalled();
  });

  it('does not apply the one-announcement constraint to manual results', async () => {
    dispatches.existsBy.mockResolvedValue(true);

    await service.send(round.id, 7, {
      type: 'round_results',
      requestId: 'request-2',
    });
    await service.send(round.id, 7, {
      type: 'round_results',
      requestId: 'request-3',
    });

    expect(dispatches.existsBy).not.toHaveBeenCalled();
    expect(query.getMany).toHaveBeenCalledTimes(2);
  });

  it('returns an idempotent replay without resending failed or pending deliveries', async () => {
    dispatches.findOneBy.mockResolvedValue(dispatch);
    deliveries = [
      delivery('accepted', 'accepted'),
      delivery('failed', 'failed'),
    ];
    dispatch.recipientCount = deliveries.length;

    await expect(
      service.send(round.id, 7, {
        type: 'round_results',
        requestId: dispatch.requestId,
      }),
    ).resolves.toMatchObject({
      id: dispatch.id,
      accepted: 1,
      failed: 1,
      canRetry: true,
    });

    expect(dispatches.create).not.toHaveBeenCalled();
    expect(dispatches.findOne).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it.each([
    { roundId: 'other-round', type: 'round_results' },
    { roundId: 'round-1', type: 'new_round' },
  ])(
    'rejects request ID reuse for a different round or type: %p',
    async (existing) => {
      dispatches.findOneBy.mockResolvedValue({ ...dispatch, ...existing });

      await expect(
        service.send(round.id, 7, {
          type: 'round_results',
          requestId: dispatch.requestId,
        }),
      ).rejects.toThrow(ConflictException);
      expect(transport.send).not.toHaveBeenCalled();
    },
  );

  it('rejects a missing round without creating a dispatch', async () => {
    rounds.findOne.mockResolvedValue(null);

    await expect(
      service.send(round.id, 7, {
        type: 'round_results',
        requestId: 'request-1',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(dispatches.create).not.toHaveBeenCalled();
  });

  it('retries only failed and pending deliveries, preserving terminal results', async () => {
    deliveries = [
      delivery('accepted', 'accepted'),
      delivery('expired', 'expired'),
      delivery('skipped', 'skipped'),
      delivery('pending', 'pending'),
      delivery('failed', 'failed'),
    ];

    const summary = await service.retry(dispatch.id);

    expect(deliveryRepository.find).toHaveBeenCalledWith({
      where: { dispatchId: dispatch.id, status: In(['pending', 'failed']) },
    });
    expect(transport.send).toHaveBeenCalledTimes(2);
    expect(deliveryRepository.update).toHaveBeenCalledTimes(2);
    expect(deliveryRepository.update).toHaveBeenCalledWith('failed', {
      status: 'accepted',
      errorCode: null,
    });
    expect(deliveryRepository.update).toHaveBeenCalledWith('pending', {
      status: 'accepted',
      errorCode: null,
    });
    expect(summary).toMatchObject({
      accepted: 3,
      expired: 1,
      skipped: 1,
      failed: 0,
      pending: 0,
      canRetry: false,
    });
    expect(dispatches.update).toHaveBeenCalledWith(
      { id: dispatch.id, lockToken: dispatch.lockToken },
      { lockedUntil: null, lockToken: null },
    );
  });

  it('rechecks membership and skips a device that is no longer eligible', async () => {
    deliveries = [delivery('pending', 'pending')];
    query.getOne.mockResolvedValue(null);

    await expect(service.retry(dispatch.id)).resolves.toMatchObject({
      skipped: 1,
      canRetry: false,
    });
    expect(query.andWhere).toHaveBeenCalledWith(
      'subscription.id = :subscriptionId',
      { subscriptionId: subscription.id },
    );
    expect(query.innerJoin).toHaveBeenCalledWith(
      MembershipEntity,
      'membership',
      expect.stringContaining('membership.status = :active'),
      { championshipId: round.championshipId, active: MembershipStatus.ACTIVE },
    );
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('skips a delivery whose subscription was deleted', async () => {
    deliveries = [delivery('pending', 'pending', null)];

    await expect(service.retry(dispatch.id)).resolves.toMatchObject({
      skipped: 1,
    });
    expect(query.getOne).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    'expires deliveries and removes devices after provider status %s',
    async (statusCode) => {
      deliveries = [delivery('pending', 'pending')];
      transport.send.mockRejectedValue({ statusCode });

      await expect(service.retry(dispatch.id)).resolves.toMatchObject({
        expired: 1,
        failed: 0,
        canRetry: false,
      });
      expect(subscriptions.delete).toHaveBeenCalledWith(subscription.id);
      expect(deliveryRepository.update).toHaveBeenCalledWith('pending', {
        status: 'expired',
        errorCode: statusCode,
      });
    },
  );

  it.each([{ statusCode: 429 }, { statusCode: 503 }, new Error('Timeout')])(
    'keeps failed deliveries retryable after %p',
    async (error) => {
      deliveries = [delivery('pending', 'pending')];
      transport.send.mockRejectedValue(error);

      await expect(service.retry(dispatch.id)).resolves.toMatchObject({
        failed: 1,
        canRetry: true,
      });
      expect(subscriptions.delete).not.toHaveBeenCalled();
    },
  );

  it('rejects a retry while another worker holds the lease', async () => {
    dispatch.lockedUntil = new Date(now.getTime() + 1000);

    await expect(service.retry(dispatch.id)).rejects.toThrow(ConflictException);
    expect(deliveryRepository.find).not.toHaveBeenCalled();
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('holds the lease until every worker settles before rethrowing a worker failure', async () => {
    deliveries = [
      delivery('lookup-failure', 'pending'),
      delivery('in-flight', 'pending', 'device-2'),
    ];
    const workerFailure = new Error('Membership lookup failed');
    const otherDevice = { ...subscription, id: 'device-2' };
    query.getOne
      .mockRejectedValueOnce(workerFailure)
      .mockResolvedValueOnce(otherDevice);

    let releaseSend = () => {};
    let markSendStarted = () => {};
    const inFlight = new Promise<void>((resolve) => {
      releaseSend = resolve;
    });
    const sendStarted = new Promise<void>((resolve) => {
      markSendStarted = resolve;
    });
    transport.send.mockImplementation(() => {
      markSendStarted();
      return inFlight;
    });
    dispatches.update.mockImplementation(
      (
        criteria: { lockToken: string },
        patch: Partial<NotificationDispatchEntity>,
      ) => {
        if (criteria.lockToken === dispatch.lockToken)
          Object.assign(dispatch, patch);
        return Promise.resolve({ affected: 1 });
      },
    );
    let completed = false;
    const outcome = service.retry(dispatch.id).then(
      () => {
        completed = true;
        return null;
      },
      (error: unknown) => {
        completed = true;
        return error;
      },
    );

    try {
      await sendStarted;
      // Drain the rejection microtasks while the other send remains blocked.
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(completed).toBe(false);
      expect(dispatches.update).not.toHaveBeenCalled();
      expect(dispatch.lockedUntil).toEqual(new Date(now.getTime() + 60_000));
      await expect(service.retry(dispatch.id)).rejects.toThrow(
        ConflictException,
      );
      expect(transport.send).toHaveBeenCalledTimes(1);
    } finally {
      releaseSend();
      await outcome;
    }

    expect(await outcome).toBe(workerFailure);
    expect(transport.send).toHaveBeenCalledWith(otherDevice, dispatch.payload);
    expect(deliveries.map(({ status }) => status)).toEqual([
      'pending',
      'accepted',
    ]);
    expect(dispatches.update).toHaveBeenCalledTimes(1);
    expect(dispatch.lockedUntil).toBeNull();
    expect(dispatch.lockToken).toBeNull();
  });

  it.each(['present', 'missing'] as const)(
    'does not send or overwrite a retry accepted while an old membership lookup stalls: subscription %s',
    async (subscriptionState) => {
      deliveries = [delivery('pending', 'pending')];
      dispatch.recipientCount = 1;
      let releaseLookup: (
        value: PushSubscriptionEntity | null,
      ) => void = () => {};
      let markLookupStarted = () => {};
      const lookupResult = new Promise<PushSubscriptionEntity | null>(
        (resolve) => {
          releaseLookup = resolve;
        },
      );
      const lookupStarted = new Promise<void>((resolve) => {
        markLookupStarted = resolve;
      });
      query.getOne.mockImplementationOnce(() => {
        markLookupStarted();
        return lookupResult;
      });
      dispatches.findOne.mockImplementation(() =>
        Promise.resolve({ ...dispatch }),
      );
      dispatches.save.mockImplementation(
        (value: NotificationDispatchEntity) => {
          Object.assign(dispatch, value);
          return Promise.resolve({ ...value });
        },
      );
      dispatches.update.mockImplementation(
        (
          criteria: { lockToken: string },
          patch: Partial<NotificationDispatchEntity>,
        ) => {
          const matches = criteria.lockToken === dispatch.lockToken;
          if (matches) Object.assign(dispatch, patch);
          return Promise.resolve({ affected: matches ? 1 : 0 });
        },
      );
      deliveryRepository.find.mockImplementation(() =>
        Promise.resolve(
          deliveries
            .filter((d) => ['pending', 'failed'].includes(d.status))
            .map((d) => ({ ...d })),
        ),
      );
      const oldWorker = service.retry(dispatch.id);

      try {
        await lookupStarted;
        jest.mocked(Date.now).mockReturnValue(now.getTime() + 61_000);

        await expect(service.retry(dispatch.id)).resolves.toMatchObject({
          accepted: 1,
          pending: 0,
          skipped: 0,
          canRetry: false,
        });
        expect(transport.send).toHaveBeenCalledTimes(1);
        expect(deliveryRepository.update).toHaveBeenCalledTimes(1);
      } finally {
        releaseLookup(subscriptionState === 'present' ? subscription : null);
        await oldWorker;
      }

      await expect(oldWorker).resolves.toMatchObject({
        accepted: 1,
        pending: 0,
        skipped: 0,
        canRetry: false,
      });
      expect(transport.send).toHaveBeenCalledTimes(1);
      expect(deliveryRepository.update).toHaveBeenCalledTimes(1);
      expect(deliveryRepository.update).toHaveBeenCalledWith('pending', {
        status: 'accepted',
        errorCode: null,
      });
      expect(deliveries[0]).toMatchObject({
        status: 'accepted',
        errorCode: null,
      });
      expect(subscriptions.delete).not.toHaveBeenCalled();
    },
  );

  it('allows a retry after a previous lease has expired', async () => {
    dispatch.lockedUntil = new Date(now.getTime() - 1);

    await expect(service.retry(dispatch.id)).resolves.toMatchObject({
      inProgress: false,
    });
    expect(dispatches.save).toHaveBeenCalledWith(
      expect.objectContaining({
        lockedUntil: new Date(now.getTime() + 60_000),
      }),
    );
  });

  it('rejects a missing dispatch', async () => {
    dispatches.findOne.mockResolvedValue(null);

    await expect(service.retry('missing')).rejects.toThrow(NotFoundException);
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('rejects push operations before database access when disabled', async () => {
    transport.requireEnabled.mockImplementation(() => {
      throw new ServiceUnavailableException();
    });

    await expect(service.register(42, dto)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.test(42, subscription.id)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(
      service.send(round.id, 7, { type: 'new_round', requestId: 'request-1' }),
    ).rejects.toThrow(ServiceUnavailableException);
    await expect(service.retry(dispatch.id)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(subscriptions.createQueryBuilder).not.toHaveBeenCalled();
    expect(rounds.findOne).not.toHaveBeenCalled();
    expect(dispatches.findOne).not.toHaveBeenCalled();
  });
});
