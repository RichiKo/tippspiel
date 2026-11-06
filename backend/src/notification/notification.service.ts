import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In, QueryFailedError } from 'typeorm';
import { RoundEntity } from '../round/round.entity';
import { MembershipEntity } from '../membership/membership.entity';
import { MembershipStatus } from '../membership/membership-status.enum';
import {
  RegisterSubscriptionDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { NotificationDeliveryEntity } from './notification-delivery.entity';
import { NotificationDispatchEntity } from './notification-dispatch.entity';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { PushTransportService } from './push-transport.service';
import {
  notificationPayload,
  notificationPreview,
} from './notification.templates';
import { DispatchSummary, RoundNotificationStatus } from './notification.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly db: DataSource,
    private readonly transport: PushTransportService,
  ) {}

  getConfig() {
    return this.transport.getConfig();
  }

  async register(
    userId: number,
    dto: RegisterSubscriptionDto,
  ): Promise<{ id: string }> {
    this.transport.requireEnabled();
    this.transport.validateSubscription(dto);
    const repo = this.db.getRepository(PushSubscriptionEntity);
    // ON CONFLICT never transfers an endpoint to another account.
    await repo
      .createQueryBuilder()
      .insert()
      .values({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        locale: dto.locale ?? 'uk',
      })
      .orIgnore()
      .execute();
    const subscription = await repo.findOneByOrFail({ endpoint: dto.endpoint });
    if (subscription.userId !== userId)
      throw new ConflictException('Subscription belongs to another account');
    await repo.update(subscription.id, {
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      locale: dto.locale ?? 'uk',
    });
    return { id: subscription.id };
  }

  async remove(userId: number, id: string): Promise<void> {
    const result = await this.db
      .getRepository(PushSubscriptionEntity)
      .delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Subscription not found');
  }

  async test(userId: number, id: string): Promise<{ accepted: boolean }> {
    this.transport.requireEnabled();
    const subscription = await this.db
      .getRepository(PushSubscriptionEntity)
      .createQueryBuilder('subscription')
      .addSelect([
        'subscription.endpoint',
        'subscription.p256dh',
        'subscription.auth',
      ])
      .where('subscription.id = :id AND subscription.userId = :userId', {
        id,
        userId,
      })
      .getOne();
    if (!subscription) throw new NotFoundException('Subscription not found');
    try {
      await this.transport.send(
        subscription,
        notificationPayload(
          {
            title: 'TippsLiga',
            body: 'Сповіщення увімкнено. Це тестове повідомлення.',
          },
          randomUUID(),
          '/settings',
        ),
      );
      return { accepted: true };
    } catch (error: unknown) {
      if ([404, 410].includes(this.statusCode(error) ?? 0)) {
        await this.db
          .getRepository(PushSubscriptionEntity)
          .delete({ id, userId });
      }
      return { accepted: false };
    }
  }

  async status(roundId: string): Promise<RoundNotificationStatus> {
    const round = await this.round(roundId);
    const recipients = await this.recipients(
      this.db.manager,
      round.championshipId,
    ).getMany();
    const dispatches = await this.db
      .getRepository(NotificationDispatchEntity)
      .find({ where: { roundId }, order: { createdAt: 'DESC' }, take: 10 });
    return {
      enabled: this.transport.getConfig().enabled,
      recipientUsers: new Set(recipients.map((s) => s.userId)).size,
      recipientDevices: recipients.length,
      announced: await this.db
        .getRepository(NotificationDispatchEntity)
        .existsBy({ roundId, type: 'new_round' }),
      previews: {
        new_round: notificationPreview(
          'new_round',
          round.championship.name,
          round.name,
        ),
        round_results: notificationPreview(
          'round_results',
          round.championship.name,
          round.name,
        ),
      },
      dispatches: await Promise.all(dispatches.map((d) => this.summary(d))),
    };
  }

  async send(
    roundId: string,
    adminId: number,
    dto: SendNotificationDto,
  ): Promise<DispatchSummary | null> {
    this.transport.requireEnabled();
    const created = await this.db
      .transaction(async (manager) => {
        const round = await manager.getRepository(RoundEntity).findOne({
          where: { id: roundId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!round) throw new NotFoundException('Round not found');
        const repo = manager.getRepository(NotificationDispatchEntity);
        const existing = await repo.findOneBy({ requestId: dto.requestId });
        if (existing) {
          if (existing.roundId !== roundId || existing.type !== dto.type)
            throw new ConflictException('Request ID already used');
          return { dispatch: existing, fresh: false };
        }
        if (
          dto.type === 'new_round' &&
          (await repo.existsBy({ roundId, type: 'new_round' }))
        )
          throw new ConflictException('Round already announced');
        const recipients = await this.recipients(
          manager,
          round.championshipId,
        ).getMany();
        if (!recipients.length) return null;
        const fullRound = await this.round(roundId, manager);
        const id = randomUUID();
        const url = `/championship/${encodeURIComponent(round.championshipId)}?roundId=${encodeURIComponent(round.id)}`;
        const dispatch = await repo.save(
          repo.create({
            id,
            requestId: dto.requestId,
            roundId,
            adminId,
            type: dto.type,
            recipientCount: recipients.length,
            payload: notificationPayload(
              notificationPreview(
                dto.type,
                fullRound.championship.name,
                round.name,
              ),
              id,
              url,
            ),
            lockedUntil: null,
            lockToken: null,
          }),
        );
        await manager.getRepository(NotificationDeliveryEntity).insert(
          recipients.map((s) => ({
            dispatchId: dispatch.id,
            subscriptionId: s.id,
            status: 'pending' as const,
            errorCode: null,
          })),
        );
        return { dispatch, fresh: true };
      })
      .catch((error: unknown) => {
        if (
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string }).code === '23505'
        ) {
          throw new ConflictException('Request ID already used');
        }
        throw error;
      });
    if (!created) return null;
    if (!created.fresh) return this.summary(created.dispatch);
    return this.process(created.dispatch.id);
  }

  async retry(id: string): Promise<DispatchSummary> {
    this.transport.requireEnabled();
    return this.process(id);
  }

  private async process(id: string): Promise<DispatchSummary> {
    const deadline = Date.now() + 25_000;
    const token = randomUUID();
    const dispatch = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(NotificationDispatchEntity);
      const dispatch = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!dispatch) throw new NotFoundException('Dispatch not found');
      if (dispatch.lockedUntil && dispatch.lockedUntil.getTime() > Date.now())
        throw new ConflictException('Dispatch in progress');
      dispatch.lockToken = token;
      dispatch.lockedUntil = new Date(Date.now() + 60_000);
      return repo.save(dispatch);
    });
    const repo = this.db.getRepository(NotificationDeliveryEntity);
    try {
      const round = await this.round(dispatch.roundId);
      const pending = await repo.find({
        where: { dispatchId: id, status: In(['pending', 'failed']) },
      });
      let index = 0;
      const workers = await Promise.allSettled(
        Array.from({ length: Math.min(10, pending.length) }, async () => {
          while (index < pending.length && Date.now() < deadline) {
            const delivery = pending[index++];
            const subscription = delivery.subscriptionId
              ? await this.recipients(this.db.manager, round.championshipId)
                  .addSelect([
                    'subscription.endpoint',
                    'subscription.p256dh',
                    'subscription.auth',
                  ])
                  .andWhere('subscription.id = :subscriptionId', {
                    subscriptionId: delivery.subscriptionId,
                  })
                  .getOne()
              : null;
            // A slow database lookup must not start a send after this worker's lease window.
            if (Date.now() >= deadline) return;
            if (!subscription) {
              await repo.update(delivery.id, {
                status: 'skipped',
                errorCode: null,
              });
              continue;
            }
            try {
              await this.transport.send(subscription, dispatch.payload);
              await repo.update(delivery.id, {
                status: 'accepted',
                errorCode: null,
              });
            } catch (error: unknown) {
              const code = this.statusCode(error);
              const expired = code === 404 || code === 410;
              await repo.update(delivery.id, {
                status: expired ? 'expired' : 'failed',
                errorCode: code,
              });
              if (expired)
                await this.db
                  .getRepository(PushSubscriptionEntity)
                  .delete(subscription.id);
            }
          }
        }),
      );
      const failed = workers.find((worker) => worker.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
    } finally {
      await this.db
        .getRepository(NotificationDispatchEntity)
        .update(
          { id, lockToken: token },
          { lockedUntil: null, lockToken: null },
        );
    }
    const summary = await this.summary({ ...dispatch, lockedUntil: null });
    this.logger.log(
      `dispatch=${summary.id} accepted=${summary.accepted} failed=${summary.failed} pending=${summary.pending}`,
    );
    return summary;
  }

  private async summary(
    dispatch: NotificationDispatchEntity,
  ): Promise<DispatchSummary> {
    const deliveries = await this.db
      .getRepository(NotificationDeliveryEntity)
      .findBy({ dispatchId: dispatch.id });
    const count = (status: NotificationDeliveryEntity['status']) =>
      deliveries.filter((d) => d.status === status).length;
    const inProgress = Boolean(
      dispatch.lockedUntil && dispatch.lockedUntil.getTime() > Date.now(),
    );
    return {
      id: dispatch.id,
      type: dispatch.type,
      createdAt: dispatch.createdAt,
      recipientCount: dispatch.recipientCount,
      accepted: count('accepted'),
      failed: count('failed'),
      pending: count('pending'),
      expired: count('expired'),
      skipped: count('skipped'),
      inProgress,
      canRetry: !inProgress && count('pending') + count('failed') > 0,
    };
  }

  private recipients(manager: EntityManager, championshipId: string) {
    return manager
      .getRepository(PushSubscriptionEntity)
      .createQueryBuilder('subscription')
      .innerJoin(
        MembershipEntity,
        'membership',
        'membership.userId = subscription.userId AND membership.championshipId = :championshipId AND membership.status = :active',
        { championshipId, active: MembershipStatus.ACTIVE },
      );
  }

  private async round(
    id: string,
    manager = this.db.manager,
  ): Promise<RoundEntity> {
    const round = await manager
      .getRepository(RoundEntity)
      .findOne({ where: { id }, relations: ['championship'] });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }

  private statusCode(error: unknown): number | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
    )
      return error.statusCode;
    return null;
  }
}
