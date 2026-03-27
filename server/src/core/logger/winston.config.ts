// src/core/logger/winston.config.ts
import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

export const createWinstonConfig = (configService: ConfigService) => {
  // 1. 获取环境与基础信息
  const env = configService.get<string>('NODE_ENV') || 'development';
  const isProd = env === 'production';
  const appName = configService.get<string>('APP_NAME') || 'NestApp';

  // 2. 定义全局默认元数据 (所有产生的日志都会默认带上这些字段)
  const defaultMeta = {
    appName,
    env,
    pid: process.pid,
    hostname: os.hostname(),
  };

  // 3. 针对【本地开发环境】的日志格式：注重美观、高亮、易读
  const devFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), // 毫秒级时间戳
    format.ms(), // 记录距离上一条日志的耗时 (如 +5ms)
    format.errors({ stack: true }),
    format.colorize({ all: true }), // 开启全彩
    format.printf(
      ({ timestamp, level, message, context, stack, ms, ...meta }: any) => {
        const contextStr = context ? `[${context}] ` : '';
        const stackStr = stack ? `\n${stack}` : '';

        // 过滤掉 defaultMeta，让本地控制台清爽一点，只打印业务代码额外传入的 meta
        const { appName, env, pid, hostname, ...customMeta } = meta;
        const metaStr = Object.keys(customMeta).length
          ? `\n${JSON.stringify(customMeta, null, 2)}`
          : '';
        return `${timestamp} ${level} ${contextStr}${message} ${ms}${metaStr}${stackStr}`;
      },
    ),
  );

  // 4. 针对【生产环境】的日志格式：纯 JSON，机器友好，方便日志系统检索
  const prodFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // 提取错误堆栈展开到 JSON 字段中
    format.json(), // 核心：转为标准 JSON 字符串
  );

  // 5. 提取 DailyRotateFile 的通用配置项，避免重复代码
  const dailyRotateOptions = {
    dirname: 'logs',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // 压缩归档历史日志 (极大地节省服务器硬盘空间)
    maxSize: '20m', // 当天日志达到 20MB 时自动切割为新文件
    // 生产环境写入 JSON，开发环境写入去色的纯文本
    format: isProd
      ? prodFormat
      : format.combine(format.uncolorize(), devFormat),
  };

  return {
    defaultMeta, // 挂载全局元数据
    transports: [
      // A. 控制台输出 (开发环境输出 debug 及以上彩色文本；生产环境输出 info 及以上 JSON)
      new transports.Console({
        level: isProd ? 'info' : 'debug',
        format: isProd ? prodFormat : devFormat,
      }),

      // B. 业务常规日志 (info, warn 等)
      new DailyRotateFile({
        ...dailyRotateOptions,
        dirname: 'logs/info',
        level: 'info',
        filename: 'app/app-%DATE%.log',
        maxFiles: '14d', // 常规日志保留 14 天
      }),

      // C. 专门的错误日志提取 (仅 error，方便线上配置报警规则)
      new DailyRotateFile({
        ...dailyRotateOptions,
        dirname: 'logs/error',
        level: 'error',
        filename: 'error/error-%DATE%.log',
        maxFiles: '30d', // 错误日志极具排查价值，保留 30 天
      }),
    ],

    // D. 自动捕获 Node.js 底层的致命崩溃 (非常重要！)
    exceptionHandlers: [
      new DailyRotateFile({
        ...dailyRotateOptions,
        dirname: 'logs/crash',
        filename: 'exceptions-%DATE%.log',
        maxFiles: '30d',
      }),
    ],
    rejectionHandlers: [
      new DailyRotateFile({
        ...dailyRotateOptions,
        dirname: 'logs/crash',
        filename: 'rejections-%DATE%.log',
        maxFiles: '30d',
      }),
    ],
  };
};
