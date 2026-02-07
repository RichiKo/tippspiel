import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { AuthGuard } from '@app/guards/auth.guard';
import { AuthMiddleware } from '@app/user/middlewares/auth.middleware';
import { ConfigModule } from '@nestjs/config';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ormConfig } from '@app/ormconfig/ormoptions.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@app/user/user.module';
import { ChampionshipModule } from './championship/championship.module';
import { TeamModule } from './team/team.module';
import { UploadModule } from './upload/upload.module';
import { RoundModule } from './round/round.module';
import { GameModule } from './game/game.module';
import { TipModule } from './tip/tip.module';
import { RankingModule } from './ranking/ranking.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`],
      isGlobal: true,
    }),
    UserModule,
    ChampionshipModule,
    TeamModule,
    RoundModule,
    GameModule,
    TipModule,
    RankingModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthGuard],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
