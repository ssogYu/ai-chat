import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validationSchema } from './env.validation';
import appConfig from './app.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      // 动态加载环境文件
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      isGlobal: true,
      // 加载所有配置分组
      load: [appConfig],
      // 验证环境变量
      validationSchema,
      validationOptions: {
        abortEarly: true,
        stripUnknown: true,
      },
      // 启用缓存提高性能
      cache: true,
      // 展开环境变量（支持嵌套）
      expandVariables: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
