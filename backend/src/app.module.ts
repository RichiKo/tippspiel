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

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`],
      isGlobal: true,
    }),
    UserModule,
    ChampionshipModule,
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
