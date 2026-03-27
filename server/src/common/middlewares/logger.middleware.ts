// src/common/middlewares/logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLoggerService } from 'src/core/logger/winston.server';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '-';
    // 记录请求开始的时间
    const startTime = Date.now();

    // 监听 response 的 'finish' 事件（请求正常处理完毕）
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || 0;
      const duration = Date.now() - startTime;

      const logFormat = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} [${duration}ms]`;

      // 根据状态码输出不同级别的日志
      if (statusCode >= 500) {
        this.logger.error(logFormat);
      } else if (statusCode >= 400) {
        this.logger.warn(logFormat);
      } else {
        this.logger.log(logFormat);
      }
    });

    // 监听 'close' 事件（客户端异常断开连接，例如用户提前关掉浏览器）
    response.on('close', () => {
      // 只有在没有正常 finish 的情况下才记录 close
      if (!response.writableFinished) {
        const duration = Date.now() - startTime;
        this.logger.warn(
          `[Client Disconnected] ${method} ${originalUrl} - ${userAgent} ${ip} [${duration}ms]`,
        );
      }
    });

    // 必须调用 next()，否则请求会被挂起卡死！
    next();
  }
}
