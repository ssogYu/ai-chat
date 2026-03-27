import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { LoggerMiddleware } from './common/middlewares';
import { LoggerModule } from './core/logger/logger.module';
import { UserModule } from './module/user/user.module';

@Module({
  imports: [ConfigModule, LoggerModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 1. 应用我们刚才写的 LoggerMiddleware
      .apply(LoggerMiddleware)
      // 2. 排除掉不需要记录日志的健康检查或静态资源路由（可选）
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'favicon.ico', method: RequestMethod.GET },
      )
      // 3. 作用于所有的路由（'*'）
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
