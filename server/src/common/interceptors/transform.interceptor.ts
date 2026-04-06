import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { BaseResponse } from '../interfaces/base-response.interface';
import { ErrorCodeEnum, ErrorCodeMessageMap } from '../enums/error-code.enum';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  BaseResponse<T>
> {
  private readonly excludePaths = ['/chat/stream'];
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const requestPath = (request.url as string)?.split('?')[0] ?? '';
    if (this.excludePaths.includes(requestPath)) {
      return next.handle() as unknown as Observable<BaseResponse<T>>;
    }
    return next.handle().pipe(
      map(data => ({
        code: ErrorCodeEnum.SUCCESS,
        message: ErrorCodeMessageMap[ErrorCodeEnum.SUCCESS],
        data,
      })),
    );
  }
}
