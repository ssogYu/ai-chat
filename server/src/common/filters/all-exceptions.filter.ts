import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import type { BaseResponse } from '../interfaces/base-response.interface';
import { ErrorCodeEnum, ErrorCodeMessageMap } from '../enums/error-code.enum';
import { ApiException } from '../exceptions/api.exception';

const HttpStatusToErrorCodeMap: Record<number, ErrorCodeEnum> = {
  [HttpStatus.BAD_REQUEST]: ErrorCodeEnum.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCodeEnum.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCodeEnum.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCodeEnum.NOT_FOUND,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ErrorCodeMessageMap[ErrorCodeEnum.INTERNAL_SERVER_ERROR];
    let errorCode = ErrorCodeEnum.INTERNAL_SERVER_ERROR;
    if (exception instanceof ApiException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      const exceptionResponse = exception.getResponse() as Record<string, any>;
      message = exceptionResponse.message || exception.message;
    } else if (exception instanceof HttpException) {
      console.error('exception22', exception);
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || exception.message;
        if (Array.isArray(message)) {
          message = message[0];
        }
      }
      errorCode =
        HttpStatusToErrorCodeMap[status] || ErrorCodeEnum.INTERNAL_SERVER_ERROR;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const finalErrorCode =
      exception instanceof ApiException
        ? errorCode
        : HttpStatusToErrorCodeMap[status] ||
          ErrorCodeEnum.INTERNAL_SERVER_ERROR;
    const errorResponse: BaseResponse<null> = {
      code: finalErrorCode,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
