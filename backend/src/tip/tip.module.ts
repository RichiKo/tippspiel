import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipEntity } from './tip.entity';
import { TipService } from './tip.service';
import { TipController } from './tip.controller';
import { GameEntity } from '../game/game.entity';
import { AuthGuard } from '../guards/auth.guard';
import { MembershipEntity } from '../membership/membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipEntity, GameEntity, MembershipEntity])],
  controllers: [TipController],
  providers: [TipService, AuthGuard],
  exports: [TipService],
})
export class TipModule {}
