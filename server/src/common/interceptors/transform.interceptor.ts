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
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    return next.handle().pipe(
      map(data => {
        return {
          code: ErrorCodeEnum.SUCCESS,
          message: ErrorCodeMessageMap[ErrorCodeEnum.SUCCESS],
          data,
        };
      }),
    );
  }
}
