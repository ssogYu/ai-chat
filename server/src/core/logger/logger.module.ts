import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import { createWinstonConfig } from './winston.config';
import { WinstonLoggerService } from './winston.server';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      // 告诉 Nest 需要注入什么依赖，这里注入 ConfigService 来获取环境变量配置
      inject: [ConfigService],
      // 异步工厂函数，根据环境变量动态创建 Winstonston 配置
      useFactory: (configService: ConfigService) =>
        createWinstonConfig(configService),
    }),
  ],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
