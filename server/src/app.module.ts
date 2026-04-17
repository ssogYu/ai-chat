import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './common/guards';
import { LoggerMiddleware } from './common/middlewares';
import { CoreModule } from './core/core.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [CoreModule, PrismaModule, AuthModule, UsersModule, ChatModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'favicon.ico', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
