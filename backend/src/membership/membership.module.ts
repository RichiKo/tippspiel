import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from './membership.entity';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { UserEntity } from '../user/user.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { ChampionshipOwnerGuard } from './guards/championship-owner.guard';
import { ChampionshipModule } from '../championship/championship.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipEntity,
      UserEntity,
      ChampionshipEntity,
    ]),
    forwardRef(() => ChampionshipModule),
    RankingModule,
  ],
  providers: [MembershipService, ChampionshipOwnerGuard],
  controllers: [MembershipController],
  exports: [MembershipService, ChampionshipOwnerGuard],
})
export class MembershipModule {}
