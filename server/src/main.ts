import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './core/logger/winston.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const customLogger = app.get(WinstonLoggerService);
  const configService = app.get(ConfigService);

  app.useLogger(customLogger);
  app.use(helmet());
  app.enableCors({
    origin: configService.getOrThrow<string>('CORS_ORIGIN'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 中未定义的多余字段
      transform: true, // 自动转换 DTO 中的字段类型
      forbidNonWhitelisted: true, // 禁止传递未定义的字段
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Chat Server API')
    .setDescription('基于 NestJS + Prisma + PostgreSQL + JWT 的认证接口文档')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '访问令牌',
      },
      'access-token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '刷新令牌',
      },
      'refresh-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(configService.get<number>('PORT', 3000));
}

void bootstrap();
