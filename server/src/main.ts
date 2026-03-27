import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './core/logger/winston.server';

async function bootstrap() {
  // 启用日志缓冲，避免在生产环境中直接打印到控制台
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // 获取自定义的 Logger 实例
  // 替换 NestJS 默认的系统 Logger
  const customLogger = app.get(WinstonLoggerService);
  app.useLogger(customLogger);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
