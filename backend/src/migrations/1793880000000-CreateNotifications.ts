import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1793880000000 implements MigrationInterface {
  name = 'CreateNotifications1793880000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE "push_subscriptions" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "endpoint" varchar(2048) NOT NULL UNIQUE,
      "p256dh" varchar NOT NULL, "auth" varchar NOT NULL,
      "locale" varchar NOT NULL DEFAULT 'uk', "createdAt" timestamp NOT NULL DEFAULT now()
    )`);
    await runner.query(
      `CREATE INDEX "IDX_push_subscriptions_user" ON "push_subscriptions" ("userId")`,
    );
    await runner.query(`CREATE TABLE "notification_dispatches" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL UNIQUE,
      "roundId" uuid NOT NULL REFERENCES "rounds"("id") ON DELETE CASCADE,
      "adminId" integer REFERENCES "users"("id") ON DELETE SET NULL,
      "type" varchar NOT NULL CHECK ("type" IN ('new_round', 'round_results')),
      "payload" jsonb NOT NULL, "recipientCount" integer NOT NULL,
      "lockedUntil" timestamp, "lockToken" uuid, "createdAt" timestamp NOT NULL DEFAULT now()
    )`);
    await runner.query(
      `CREATE INDEX "IDX_notification_dispatch_round" ON "notification_dispatches" ("roundId")`,
    );
    await runner.query(
      `CREATE UNIQUE INDEX "IDX_notification_once_per_round" ON "notification_dispatches" ("roundId", "type") WHERE "type" = 'new_round'`,
    );
    await runner.query(`CREATE TABLE "notification_deliveries" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "dispatchId" uuid NOT NULL REFERENCES "notification_dispatches"("id") ON DELETE CASCADE,
      "subscriptionId" uuid REFERENCES "push_subscriptions"("id") ON DELETE SET NULL,
      "status" varchar NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'failed', 'expired', 'skipped')),
      "errorCode" integer, UNIQUE ("dispatchId", "subscriptionId")
    )`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE "notification_deliveries"');
    await runner.query('DROP TABLE "notification_dispatches"');
    await runner.query('DROP TABLE "push_subscriptions"');
  }
}
