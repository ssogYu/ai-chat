import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [ConfigModule, LoggerModule],
  exports: [ConfigModule, LoggerModule],
})
export class CoreModule {}
