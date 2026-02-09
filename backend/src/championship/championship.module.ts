import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { ChampionshipService } from './championship.service';
import { ChampionshipController } from './championship.controller';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChampionshipEntity, TeamEntity]),
    forwardRef(() => MembershipModule),
  ],
  controllers: [ChampionshipController],
  providers: [ChampionshipService],
  exports: [ChampionshipService],
})
export class ChampionshipModule {}
